"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  Color,
  Matrix4,
  RepeatWrapping,
  NoColorSpace,
  Plane,
  Quaternion,
  Ray,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  Vector3,
  type Group,
} from "three";
import {
  CELL,
  GRID,
  ORIGIN,
  PLATFORM,
  baseLive,
  baseStore,
  gameBlockers,
  cellCenter,
  links,
  occupant,
  parkSpot,
  useBase,
} from "@/lib/lab/baseStore";
import { Building, HUES } from "./Buildings";
import { GameLayer } from "./GameBuildings";
import { gameStore, useGame } from "@/lib/lab/gameStore";
import { atk, useAttackOn } from "@/lib/lab/attackSim";
import { scout, useScoutOn } from "@/lib/lab/scoutSim";

const OK = new Color(0.2, 1.6, 0.7);
const BAD = new Color(2.2, 0.3, 0.3);
const IDLE = new Color(0.3, 1.2, 2.0);
const GRID_Y = 0.07;
const PAD_R = 10.2;

/**
 * The ground of the base map: a round plate of dark rock that glows at its rim, with no grid
 * of little squares. The build area only shows a soft outline, and corner dots appear while a
 * building is being dragged. The parking pad of the ship is painted into the same shader.
 */
const platformVertex = /* glsl */ `
  varying vec2 vP;
  varying vec2 vW;
  void main() {
    vP = position.xy;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const platformFragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uShow;
  uniform float uDrag;
  uniform float uCell;
  uniform float uGrid;
  uniform float uR;
  uniform vec2 uOrigin;
  uniform vec3 uPad;
  uniform float uTime;
  varying vec2 vP;
  varying vec2 vW;
  void main() {
    vec2 p = vW;
    float r = length(vP) / uR;
    float g1 = texture2D(uTex, p * 0.045).r;
    float g2 = texture2D(uTex, p * 0.2).r;
    vec3 col = mix(vec3(0.03, 0.048, 0.072), vec3(0.085, 0.125, 0.165), g1 * 0.6 + g2 * 0.4);
    col *= 0.8 + 0.55 * (1.0 - r);
    // soft glowing rings: the rim of the plate and a faint inner ring
    col += vec3(0.1, 0.5, 0.9) * (exp(-pow((r - 0.9) / 0.012, 2.0)) * 0.9 + exp(-pow((r - 0.52) / 0.006, 2.0)) * 0.3);
    // build area: tinted plot, outline, corner dots while dragging
    vec2 q = (p - uOrigin) / uCell;
    vec2 c = abs(q - uGrid * 0.5) - uGrid * 0.5;
    float sd = length(max(c, 0.0)) + min(max(c.x, c.y), 0.0);
    col += vec3(0.02, 0.07, 0.12) * (1.0 - smoothstep(-0.02, 0.02, sd));
    float outline = 1.0 - smoothstep(0.0, 0.07, abs(sd));
    float dots = (1.0 - smoothstep(0.03, 0.08, length(fract(q + 0.5) - 0.5))) * (1.0 - smoothstep(0.0, 0.05, sd));
    col += vec3(0.25, 0.8, 1.0) * (outline * 0.6 + dots * uDrag * 0.9);
    // the parking pad: a dark disc ringed with amber lights
    vec2 pp = p - uPad.xy;
    float pr = length(pp);
    col = mix(col, vec3(0.018, 0.03, 0.045), (1.0 - smoothstep(uPad.z - 0.4, uPad.z, pr)) * 0.85);
    float tick = smoothstep(0.9, 1.0, cos(atan(pp.y, pp.x) * 14.0)) * (1.0 - smoothstep(0.0, 0.5, abs(pr - uPad.z + 0.9)));
    float pulse = 0.75 + 0.25 * sin(uTime * 2.0);
    col += vec3(1.0, 0.55, 0.15) * (exp(-pow((pr - uPad.z) / 0.1, 2.0)) * 0.9 + tick * 0.9 * pulse);
    col += vec3(0.1, 0.5, 0.9) * exp(-pow((pr - (uPad.z - 2.0)) / 0.05, 2.0)) * 0.5;
    float a = uShow * (1.0 - smoothstep(0.93, 1.0, r));
    gl_FragColor = vec4(col, a);
  }
`;

function Beam({ a, b, color }: { a: Vector3; b: Vector3; color: Color }) {
  const { pos, quat, len } = useMemo(() => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const length = dir.length();
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
    return { pos: mid, quat: q, len: length };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[0.04, 0.04, len, 6]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/** The build grid on the Lab planet. Lives in the surface group (ground is y = 0). */
export function BaseBuilder() {
  const mode = useBase((s) => s.mode);
  const skills = useBase((s) => s.skills);
  const placed = useBase((s) => s.placed);
  const dragging = useBase((s) => s.dragging);
  const hover = useBase((s) => s.hover);
  const armedNow = useGame((s) => s.armed);
  const attackOn = useAttackOn();
  const scoutOn = useScoutOn();
  const attackNow = attackOn || scoutOn;
  const selected = useBase((s) => s.selected);
  const root = useRef<Group>(null);
  const plate = useRef<Group>(null);
  const size = useThree((st) => st.size);
  const portrait = size.width / size.height < 0.8;

  const platform = useMemo(() => {
    const tex = new TextureLoader().load("/models/storm/ground.jpg");
    tex.colorSpace = NoColorSpace;
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.anisotropy = 8;
    const mat = new ShaderMaterial({
      vertexShader: platformVertex,
      fragmentShader: platformFragment,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      uniforms: {
        uTex: { value: tex },
        uShow: { value: 0 },
        uDrag: { value: 0 },
        uCell: { value: CELL },
        uGrid: { value: GRID },
        uR: { value: PLATFORM.r },
        uOrigin: { value: new Vector2(ORIGIN.x, ORIGIN.z) },
        uPad: { value: new Vector3(0, 0, PAD_R) },
        uTime: { value: 0 },
      },
    });
    return { tex, mat };
  }, []);
  useEffect(
    () => () => {
      platform.tex.dispose();
      platform.mat.dispose();
    },
    [platform]
  );

  // fade the plate in and out with the builder, and glow the corner dots while dragging
  useFrame((state, dt) => {
    const u = platform.mat.uniforms;
    const on = baseStore.get().mode;
    const show = (u["uShow"]!.value as number) + ((on ? 1 : 0) - (u["uShow"]!.value as number)) * (1 - Math.exp(-dt * 3));
    u["uShow"]!.value = show;
    const dragWant = baseStore.get().dragging !== null || gameStore.get().armed ? 1 : 0;
    u["uDrag"]!.value = (u["uDrag"]!.value as number) + (dragWant - (u["uDrag"]!.value as number)) * (1 - Math.exp(-dt * 8));
    u["uTime"]!.value = state.clock.elapsedTime;
    const sp = parkSpot(portrait);
    (u["uPad"]!.value as Vector3).set(sp.x, sp.z, PAD_R);
    if (plate.current) plate.current.visible = show > 0.01;
  });

  const work = useMemo(
    () => ({ ray: new Ray(), inv: new Matrix4(), plane: new Plane(new Vector3(0, 1, 0), 0), hit: new Vector3() }),
    []
  );

  // which grid cell is under the pointer (every frame while the builder is open)
  useFrame((state) => {
    const g = root.current;
    if (!g || !baseStore.get().mode) return;
    if (atk.on || scout.on) {
      baseStore.setHover(null);
      return;
    }
    const rect = state.gl.domElement.getBoundingClientRect();
    const x = ((baseLive.px - rect.left) / rect.width) * 2 - 1;
    const y = -((baseLive.py - rect.top) / rect.height) * 2 + 1;
    if (x < -1 || x > 1 || y < -1 || y > 1) {
      baseStore.setHover(null);
      return;
    }
    state.raycaster.setFromCamera({ x, y } as never, state.camera);
    g.parent?.updateWorldMatrix(true, false);
    work.inv.copy((g.parent ?? g).matrixWorld).invert();
    work.ray.copy(state.raycaster.ray).applyMatrix4(work.inv);
    if (!work.ray.intersectPlane(work.plane, work.hit)) {
      baseStore.setHover(null);
      return;
    }
    const gx = Math.floor((work.hit.x - ORIGIN.x) / CELL);
    const gz = Math.floor((work.hit.z - ORIGIN.z) / CELL);
    if (gx < 0 || gz < 0 || gx >= GRID || gz >= GRID) {
      baseStore.setHover(null);
      return;
    }
    const armed = gameStore.get().armed;
    if (armed) {
      baseStore.setHover({ gx, gz, ok: gameStore.canPlace(armed.type, gx, gz, armed.moveId) });
      return;
    }
    const who = occupant(baseStore.get().placed, gx, gz);
    const drag = baseStore.get().dragging;
    baseStore.setHover({ gx, gz, ok: (who === null || who === drag) && !gameBlockers.fn?.(gx, gz) });
  });

  const entries = Object.entries(placed)
    .map(([k, c]) => ({ index: Number(k), ...c }))
    .filter((e) => e.index < skills.length);
  const complete = skills.length > 0 && entries.length === skills.length;

  const pos = (gx: number, gz: number, y = 0) => {
    const [x, z] = cellCenter(gx, gz);
    return new Vector3(x, y, z);
  };
  const pairs = useMemo(() => links(placed), [placed]);

  const onPress = (index: number) => (e: ThreeEvent<PointerEvent>) => {
    if (!baseStore.get().mode || gameStore.get().armed || baseLive.armedTap) return;
    e.stopPropagation();
    baseLive.candidate = { index, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    baseLive.px = e.nativeEvent.clientX;
    baseLive.py = e.nativeEvent.clientY;
  };

  const centerX = ORIGIN.x + (GRID * CELL) / 2;
  const centerZ = ORIGIN.z + (GRID * CELL) / 2;

  return (
    <>
    <group ref={plate} visible={false}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[PLATFORM.x, GRID_Y - 0.03, PLATFORM.z]}
        material={platform.mat}
        renderOrder={-4}
        frustumCulled={false}
      >
        <circleGeometry args={[PLATFORM.r, 96]} />
      </mesh>
    </group>
    <group ref={root} visible={mode}>

      <GameLayer />

      {/* hover tile (skills drag, or just pointing) */}
      {mode && hover && !armedNow && !attackNow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cellCenter(hover.gx, hover.gz)[0], GRID_Y + 0.02, cellCenter(hover.gx, hover.gz)[1]]}>
          <planeGeometry args={[CELL - 0.12, CELL - 0.12]} />
          <meshBasicMaterial color={dragging !== null ? (hover.ok ? OK : BAD) : IDLE} toneMapped={false} transparent opacity={dragging !== null ? 0.55 : 0.25} />
        </mesh>
      )}

      {/* buildings */}
      {mode &&
        entries
          .filter((e) => e.index !== dragging)
          .map((e) => {
            const [x, z] = cellCenter(e.gx, e.gz);
            return (
              <group key={e.index} position={[x, 0, z]} onPointerDown={onPress(e.index)}>
                <Building kind={e.index} level={skills[e.index]?.level ?? 1} />
                {selected === e.index && (
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                    <ringGeometry args={[1.5, 1.62, 48]} />
                    <meshBasicMaterial color={new Color(3, 2.4, 0.6)} toneMapped={false} />
                  </mesh>
                )}
              </group>
            );
          })}

      {/* ghost of the building being dragged */}
      {mode && dragging !== null && hover && (
        <group position={[cellCenter(hover.gx, hover.gz)[0], 0, cellCenter(hover.gx, hover.gz)[1]]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[1.0, 1.1, 2.8, 20, 1, true]} />
            <meshBasicMaterial color={hover.ok ? OK : BAD} toneMapped={false} transparent opacity={0.28} depthWrite={false} />
          </mesh>
          <group scale={0.0001 + (hover.ok ? 1 : 0)}>
            <Building kind={dragging} level={skills[dragging]?.level ?? 1} />
          </group>
        </group>
      )}

      {/* links between neighbours */}
      {mode &&
        pairs.map(([i, j]) => {
          const a = placed[i];
          const b = placed[j];
          if (!a || !b || i === dragging || j === dragging) return null;
          return <Beam key={`${i}-${j}`} a={pos(a.gx, a.gz, 1.2)} b={pos(b.gx, b.gz, 1.2)} color={new Color(HUES[i % 9] ?? "#22d3ee").multiplyScalar(2)} />;
        })}

      {/* all skills placed: the base lights up under a dome */}
      {mode && complete && (
        <mesh position={[centerX, 0, centerZ]}>
          <sphereGeometry args={[19, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={new Color(0.3, 1.4, 2.2)} wireframe toneMapped={false} transparent opacity={0.22} />
        </mesh>
      )}
    </group>
    </>
  );
}
