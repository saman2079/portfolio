"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, Matrix4, Plane, Quaternion, Ray, Vector3, type Group } from "three";
import {
  CELL,
  GRID,
  ORIGIN,
  baseLive,
  baseStore,
  cellCenter,
  links,
  occupant,
  useBase,
} from "@/lib/lab/baseStore";
import { Building, HUES } from "./Buildings";

const OK = new Color(0.2, 1.6, 0.7);
const BAD = new Color(2.2, 0.3, 0.3);
const IDLE = new Color(0.3, 1.2, 2.0);
const GRID_Y = 0.07;

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
  const selected = useBase((s) => s.selected);
  const root = useRef<Group>(null);

  const work = useMemo(
    () => ({ ray: new Ray(), inv: new Matrix4(), plane: new Plane(new Vector3(0, 1, 0), 0), hit: new Vector3() }),
    []
  );

  // which grid cell is under the pointer (every frame while the builder is open)
  useFrame((state) => {
    const g = root.current;
    if (!g || !baseStore.get().mode) return;
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
    const who = occupant(baseStore.get().placed, gx, gz);
    const drag = baseStore.get().dragging;
    baseStore.setHover({ gx, gz, ok: who === null || who === drag });
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
    if (!baseStore.get().mode) return;
    e.stopPropagation();
    baseLive.candidate = { index, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    baseLive.px = e.nativeEvent.clientX;
    baseLive.py = e.nativeEvent.clientY;
  };

  const centerX = ORIGIN.x + (GRID * CELL) / 2;
  const centerZ = ORIGIN.z + (GRID * CELL) / 2;

  return (
    <group ref={root} visible={mode}>
      <gridHelper args={[GRID * CELL, GRID, "#5bc8ff", "#1f6fb2"]} position={[centerX, GRID_Y, centerZ]} />
      {/* soft base under the grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, GRID_Y - 0.02, centerZ]}>
        <planeGeometry args={[GRID * CELL + 0.6, GRID * CELL + 0.6]} />
        <meshBasicMaterial color="#04101c" transparent opacity={0.55} />
      </mesh>

      {/* hover tile */}
      {mode && hover && (
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
  );
}
