"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { Color, Matrix4, Plane, Ray, Vector3, type Group, type Mesh } from "three";
import { baseLive, baseStore } from "@/lib/lab/baseStore";
import { MAX_BULLETS, atk, exitAttack, updateAttack } from "@/lib/lab/attackSim";

/**
 * The player's character in attack mode, a placeholder soldier: dark armour with a glowing
 * visor and a rifle. Bullets come from a fixed pool; the aim reticle follows the mouse.
 * Swap the model later: it only needs the group that Character.tsx moves and turns.
 */
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
  const bar = useRef<Group>(null);
  const fill = useRef<Group>(null);
  const work = useMemo(() => ({ ray: new Ray(), inv: new Matrix4(), plane: new Plane(new Vector3(0, 1, 0), 0), hit: new Vector3() }), []);

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

    g.visible = true;
    g.position.set(atk.x, 0, atk.z);
    // turn smoothly toward the facing direction (shortest way round)
    let d = atk.face - g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    g.rotation.y += d * (1 - Math.exp(-dt * 16));
    const t = state.clock.elapsedTime;
    const walk = atk.moving ? Math.sin(t * 13) : 0;
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
      m.position.set(b.x, 1.3, b.z);
      m.rotation.y = Math.atan2(b.vx, b.vz);
    }
    if (reticle.current) {
      reticle.current.visible = atk.useMouse && atk.hasAim;
      reticle.current.position.set(atk.aimX, 0.2, atk.aimZ);
    }
    if (bar.current) bar.current.visible = atk.hp < atk.max;
    if (fill.current) fill.current.scale.x = Math.max(0.001, atk.hp / atk.max);
  });

  return (
    <group>
      <group ref={root} visible={false}>
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
          <group position={[0.5, 0.35, 0.3]}>
            <mesh position={[0, 0, 0.1]}>
              <boxGeometry args={[0.2, 0.22, 0.9]} />
              <meshStandardMaterial {...plate} />
            </mesh>
            <mesh position={[0, 0.02, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.8, 8]} />
              <meshStandardMaterial color="#222b3b" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh ref={flash} position={[0, 0.02, 1.3]} visible={false}>
              <sphereGeometry args={[0.2, 8, 6]} />
              <meshBasicMaterial color={BULLET} toneMapped={false} />
            </mesh>
          </group>
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
        <Billboard position={[0, 3.0, 0]}>
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

      <mesh ref={reticle} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.35, 0.5, 24]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}
