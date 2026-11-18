"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { AnimationMixer, Color, LoopRepeat, MeshStandardMaterial, Matrix4, PMREMGenerator, Plane, Ray, Vector3, type AnimationAction, type AnimationClip, type Bone, type BufferGeometry, type Group, type Material, type Mesh, type MeshBasicMaterial, type Object3D, type SkinnedMesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { baseLive, baseStore } from "@/lib/lab/baseStore";
import { MAX_BLASTS, MAX_BULLETS, atk, exitAttack, groundAt, updateAttack } from "@/lib/lab/attackSim";
import { WEAPONS } from "@/lib/lab/weapons";

/**
 * The player's character in attack mode, a placeholder soldier: dark armour with a glowing
 * visor and a rifle. Bullets come from a fixed pool; the aim reticle follows the mouse.
 * Swap the model later: it only needs the group that Character.tsx moves and turns.
 */
/** the hero: a rigged armoured soldier (252k verts, Idle/Walk/Run/Wave clips). It is 1 unit tall and faces -z; the rifle is a separate mesh that follows the right hand. */
const HERO_URL = "/models/hero.glb";
const GUN_URL = "/models/gun.glb";
/** height of the character in the game, in world units */
const HERO_SCALE = 2.6;
/** turn the model if it runs backwards (radians around y) */
const HERO_YAW = 0;
/** scale of the rifle mesh (0.19 long in the file) */
const GUN_SCALE = 6.6;
interface Hero {
  scene: Object3D;
  clips: Record<string, AnimationClip>;
  hand: Bone | null;
  gun: BufferGeometry | null;
  gunMat: Material | null;
}
const GLOW = new Color(0.3, 2.2, 3.2);
const BULLET = new Color(3.2, 2.6, 0.7);
const armour = { color: "#1a2230", metalness: 0.8, roughness: 0.4 } as const;
const plate = { color: "#2f3b52", metalness: 0.75, roughness: 0.35 } as const;

export function CharacterLayer() {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const flash = useRef<Mesh>(null);
  const bullets = useRef<(Mesh | null)[]>([]);
  const reticle = useRef<Mesh>(null);
  const gun = useRef<Group>(null);
  const blasts = useRef<(Mesh | null)[]>([]);
  const bar = useRef<Group>(null);
  const fill = useRef<Group>(null);
  const fallback = useRef<Group>(null);
  const heroRef = useRef<Group>(null);
  const [hero, setHero] = useState<Hero | null>(null);
  const gl = useThree((st) => st.gl);
  const [want, setWant] = useState(false);
  const wantRef = useRef(false);
  const rig = useRef<{ mixer: AnimationMixer; idle: AnimationAction | null; run: AnimationAction | null; cur: AnimationAction | null; v: Vector3 } | null>(null);
  // the model is big (14 MB), so it is only fetched the first time attack mode is used
  useEffect(() => {
    if (!want) return;
    let dead = false;
    // loaded outside Suspense on purpose: if it fails the placeholder soldier simply stays
    const loader = new GLTFLoader();
    const load = (url: string) => new Promise<{ scene: Object3D; animations: AnimationClip[] } | null>((res) => loader.load(url, (g) => res(g), undefined, () => res(null)));
    Promise.all([load(HERO_URL), load(GUN_URL)]).then(([h, g]) => {
      if (dead || !h) return;
      const clips: Record<string, AnimationClip> = {};
      for (const c of h.animations) clips[c.name] = c;
      let hand: Bone | null = null;
      h.scene.traverse((o) => {
        if (o.name === "RightHand") hand = o as Bone;
        const sm = o as SkinnedMesh;
        // the animated pose leaves the bind-pose bounds, so never cull it
        if (sm.isSkinnedMesh) sm.frustumCulled = false;
      });
      let gunMesh: Mesh | null = null;
      g?.scene.traverse((o) => {
        if (!gunMesh && (o as Mesh).isMesh) gunMesh = o as Mesh;
      });
      const gm = gunMesh as Mesh | null;
      h.scene.scale.setScalar(HERO_SCALE);
      h.scene.position.y = 0.5008 * HERO_SCALE;
      const mixer = new AnimationMixer(h.scene);
      const idle = clips.Idle ? mixer.clipAction(clips.Idle) : null;
      const run = clips.Run ? mixer.clipAction(clips.Run) : null;
      for (const a of [idle, run]) if (a) a.setLoop(LoopRepeat, Infinity);
      idle?.play();
      rig.current = { mixer, idle, run, cur: idle, v: new Vector3() };
      setHero({ scene: h.scene, clips, hand, gun: gm?.geometry ?? null, gunMat: gm?.material as Material | null });
    });
    return () => {
      dead = true;
    };
  }, [want]);
  // the scene is dark, so the armour gets its own soft environment light and sharp textures
  useEffect(() => {
    if (!hero) return;
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    const aniso = gl.capabilities.getMaxAnisotropy();
    const mats = new Set<MeshStandardMaterial>();
    hero.scene.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined;
      if (m && (m as MeshStandardMaterial).isMeshStandardMaterial) mats.add(m);
    });
    if (hero.gunMat) mats.add(hero.gunMat as MeshStandardMaterial);
    for (const m of mats) {
      m.envMap = env;
      m.envMapIntensity = 1.5;
      m.metalness = 0.7;
      m.roughness = 0.85;
      for (const t of [m.map, m.metalnessMap, m.roughnessMap]) if (t) t.anisotropy = aniso;
      m.needsUpdate = true;
    }
    pm.dispose();
  }, [hero, gl]);
  const work = useMemo(() => ({ ray: new Ray(), inv: new Matrix4(), plane: new Plane(new Vector3(0, 1, 0), 0), hit: new Vector3(), muz: new Vector3() }), []);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    if (atk.on && !baseStore.get().mode) exitAttack();
    if (!atk.on) {
      g.visible = false;
      if (reticle.current) reticle.current.visible = false;
      for (const b of bullets.current) if (b) b.visible = false;
      return;
    }

    // where the mouse points on the ground (local space of the base)
    work.plane.constant = -groundAt(atk.x, atk.z);
    atk.hasAim = false;
    if (atk.useMouse) {
      const rect = state.gl.domElement.getBoundingClientRect();
      const x = ((baseLive.px - rect.left) / rect.width) * 2 - 1;
      const y = -((baseLive.py - rect.top) / rect.height) * 2 + 1;
      if (x >= -1 && x <= 1 && y >= -1 && y <= 1) {
        state.raycaster.setFromCamera({ x, y } as never, state.camera);
        g.parent?.updateWorldMatrix(true, false);
        work.inv.copy((g.parent ?? g).matrixWorld).invert();
        work.ray.copy(state.raycaster.ray).applyMatrix4(work.inv);
        if (work.ray.intersectPlane(work.plane, work.hit)) {
          atk.aimX = work.hit.x;
          atk.aimZ = work.hit.z;
          atk.hasAim = true;
        }
      }
    }

    updateAttack(dt);

    if (!wantRef.current) {
      wantRef.current = true;
      setWant(true);
    }
    g.visible = true;
    const gy = groundAt(atk.x, atk.z);
    g.position.set(atk.x, gy, atk.z);
    // turn smoothly toward the facing direction (shortest way round)
    let d = atk.face - g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    g.rotation.y += d * (1 - Math.exp(-dt * 16));
    const t = state.clock.elapsedTime;
    const walk = atk.moving ? Math.sin(t * 13) : 0;
    const r = rig.current;
    if (r && hero) {
      // blend between standing and running
      const next = atk.moving ? r.run : r.idle;
      if (next && next !== r.cur) {
        next.reset().fadeIn(0.18).play();
        r.cur?.fadeOut(0.18);
        r.cur = next;
      }
      r.mixer.update(dt);
      // the rifle follows the right hand, but keeps pointing where the character looks
      if (hero.hand && gun.current) {
        g.updateMatrixWorld(true);
        hero.hand.getWorldPosition(r.v);
        g.worldToLocal(r.v);
        gun.current.position.copy(r.v);
      }
    }
    // the muzzle: bullets leave from the tip of the gun, wherever the hand has put it
    if (flash.current && g.parent) {
      g.updateMatrixWorld(true);
      flash.current.getWorldPosition(work.muz);
      g.parent.worldToLocal(work.muz);
      atk.muzX = work.muz.x;
      atk.muzZ = work.muz.z;
      atk.muzY = Math.max(0.3, work.muz.y - gy);
      atk.muzOk = true;
    }
    if (body.current) body.current.position.y = 0.95 + (atk.moving ? Math.abs(walk) * 0.07 : Math.sin(t * 2) * 0.015);
    if (legL.current) legL.current.rotation.x = walk * 0.7;
    if (legR.current) legR.current.rotation.x = -walk * 0.7;
    // blink while invulnerable after respawning
    g.scale.setScalar(atk.invuln > 0 && Math.floor(t * 10) % 2 === 0 ? 0.0001 : 1);
    if (flash.current) flash.current.visible = atk.flash > 0;

    for (let i = 0; i < MAX_BULLETS; i++) {
      const m = bullets.current[i];
      if (!m) continue;
      const b = atk.bullets[i];
      if (!b) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(b.x, gy + b.y, b.z);
      m.rotation.y = Math.atan2(b.vx, b.vz);
      const w = WEAPONS[b.w];
      m.scale.set(w.size[0], w.size[0], w.size[1]);
      (m.material as MeshBasicMaterial).color.setRGB(w.color[0], w.color[1], w.color[2]);
    }
    for (let i = 0; i < MAX_BLASTS; i++) {
      const m = blasts.current[i];
      if (!m) continue;
      const bl = atk.blasts[i];
      if (!bl) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(bl.x, 1 + groundAt(bl.x, bl.z), bl.z);
      const k = Math.min(1, bl.t / 0.25);
      m.scale.setScalar(Math.max(0.01, bl.r * (0.3 + 0.7 * k)));
      (m.material as MeshBasicMaterial).opacity = 0.7 * (1 - bl.t / 0.4);
    }
    if (gun.current) gun.current.scale.set(...WEAPONS[atk.weapon].gun);
    if (reticle.current) {
      reticle.current.visible = atk.useMouse && atk.hasAim;
      reticle.current.position.set(atk.aimX, 0.2 + gy, atk.aimZ);
    }
    if (bar.current) bar.current.visible = atk.hp < atk.max;
    if (fill.current) fill.current.scale.x = Math.max(0.001, atk.hp / atk.max);
  });

  return (
    <group>
      <group ref={root} visible={false}>
        {hero && (
          <group ref={heroRef} rotation={[0, HERO_YAW, 0]}>
            <primitive object={hero.scene} />
          </group>
        )}
        <group ref={fallback} visible={!hero}>
        <group ref={body} position={[0, 0.95, 0]}>
          {/* torso, head, visor */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.8, 0.9, 0.45]} />
            <meshStandardMaterial {...plate} />
          </mesh>
          <mesh position={[0, 0.4, 0.24]}>
            <boxGeometry args={[0.5, 0.08, 0.03]} />
            <meshBasicMaterial color={GLOW} toneMapped={false} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.28, 14, 10]} />
            <meshStandardMaterial {...armour} />
          </mesh>
          <mesh position={[0, 1.07, 0.2]}>
            <boxGeometry args={[0.36, 0.1, 0.1]} />
            <meshBasicMaterial color={GLOW} toneMapped={false} />
          </mesh>
          {/* arms and the rifle */}
          <mesh position={[-0.55, 0.4, 0.05]}>
            <boxGeometry args={[0.2, 0.7, 0.25]} />
            <meshStandardMaterial {...armour} />
          </mesh>
        </group>
        {/* legs swing around the hips */}
        <group ref={legL} position={[-0.2, 0.95, 0]}>
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[0.26, 0.9, 0.3]} />
            <meshStandardMaterial {...armour} />
          </mesh>
        </group>
        <group ref={legR} position={[0.2, 0.95, 0]}>
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[0.26, 0.9, 0.3]} />
            <meshStandardMaterial {...armour} />
          </mesh>
        </group>
        </group>
        <group ref={gun} position={[0.5, 1.3, 0.3]}>
          {hero?.gun && hero.gunMat ? (
            <mesh geometry={hero.gun} material={hero.gunMat} scale={GUN_SCALE} />
          ) : (
            <>
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.2, 0.22, 0.9]} />
            <meshStandardMaterial {...plate} />
          </mesh>
          <mesh position={[0, 0.02, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.8, 8]} />
            <meshStandardMaterial color="#222b3b" metalness={0.9} roughness={0.3} />
          </mesh>
            </>
          )}
          <mesh ref={flash} position={[0, 0.02, hero?.gun ? 0.65 : 1.3]} visible={false}>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshBasicMaterial color={BULLET} toneMapped={false} />
          </mesh>
        </group>
        <Billboard position={[0, 3.3, 0]}>
          <group ref={bar} visible={false}>
            <mesh>
              <planeGeometry args={[1.7, 0.2]} />
              <meshBasicMaterial color="#05080c" transparent opacity={0.75} depthTest={false} />
            </mesh>
            <group ref={fill} position={[-0.8, 0, 0.01]}>
              <mesh position={[0.8, 0, 0]} renderOrder={5}>
                <planeGeometry args={[1.6, 0.12]} />
                <meshBasicMaterial color={GLOW} toneMapped={false} depthTest={false} />
              </mesh>
            </group>
          </group>
        </Billboard>
      </group>

      {Array.from({ length: MAX_BULLETS }, (_, i) => (
        <mesh key={i} ref={(el) => void (bullets.current[i] = el)} visible={false}>
          <boxGeometry args={[0.1, 0.1, 0.7]} />
          <meshBasicMaterial color={BULLET} toneMapped={false} />
        </mesh>
      ))}

      {Array.from({ length: MAX_BLASTS }, (_, i) => (
        <mesh key={i} ref={(el) => void (blasts.current[i] = el)} visible={false}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color={new Color(3.6, 1.6, 0.4)} toneMapped={false} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}

      <mesh ref={reticle} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.35, 0.5, 24]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}
