"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { MathUtils, Matrix4, Quaternion, Vector3, type Group, type PerspectiveCamera as ThreeCamera } from "three";
import { DESTINATIONS } from "@/lib/universe/destinations";
import { SEGMENTS, flightLive, flightStore } from "@/lib/store/flightStore";
import { buildFlightPath } from "./flightPath";
import { Cockpit } from "./Cockpit";
import { SpeedStreaks } from "./SpeedStreaks";

const UP = new Vector3(0, 1, 0);
/** world units per second that counts as "full speed" for effects */
const MAX_SPEED = 60;

/**
 * The ship is a group that follows the flight path. Progress eases towards the
 * scroll position (so it accelerates and brakes), the nose turns to face each
 * planet on arrival, and speed drives the field of view, shake and star streaks.
 * The cockpit is fixed inside the group; the pilot's head (the camera) can turn.
 */
export function Ship({ quality }: { quality: "high" | "low" }) {
  const ship = useRef<Group>(null);
  const head = useRef<Group>(null);
  const camera = useRef<ThreeCamera>(null);
  const publishAt = useRef(0);
  const started = useRef(false);

  const path = useMemo(() => buildFlightPath(), []);
  const work = useMemo(
    () => ({
      pos: new Vector3(),
      prev: new Vector3(),
      tan: new Vector3(),
      toPlanet: new Vector3(),
      dir: new Vector3(),
      target: new Vector3(),
      vel: new Vector3(),
      m: new Matrix4(),
      q: new Quaternion(),
      qIdentity: new Quaternion(),
      inv: new Quaternion(),
      planets: DESTINATIONS.map((d) => new Vector3(...d.position)),
    }),
    []
  );

  useFrame((state, delta) => {
    const g = ship.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const live = flightLive;

    /* 1. progress: ease towards the scroll target, with a speed limit */
    const maxStep = 0.22 * live.speedMul * dt;
    const eased = MathUtils.damp(live.shipU, live.targetU, 2.2 * live.speedMul, dt);
    live.shipU += MathUtils.clamp(eased - live.shipU, -maxStep, maxStep);
    const u = live.shipU;

    /* 2. position and velocity */
    path.curve.getPoint(u, work.pos);
    if (!started.current) {
      work.prev.copy(work.pos);
      started.current = true;
    }
    work.vel.copy(work.pos).sub(work.prev).divideScalar(Math.max(dt, 1e-4));
    work.prev.copy(work.pos);
    const k = Math.min(1, dt * 8);
    live.worldSpeed += (work.vel.length() - live.worldSpeed) * k;
    live.speedNorm = MathUtils.clamp(live.worldSpeed / MAX_SPEED, 0, 1);
    work.inv.copy(g.quaternion).invert();
    work.vel.applyQuaternion(work.inv);
    live.vLocal[0] += (work.vel.x - live.vLocal[0]) * k;
    live.vLocal[1] += (work.vel.y - live.vLocal[1]) * k;
    live.vLocal[2] += (work.vel.z - live.vLocal[2]) * k;
    g.position.copy(work.pos);

    /* 3. orientation: along the path, but facing the planet when docking */
    path.curve.getTangent(u, work.tan).normalize();
    let near = 0;
    let nearGap = 9;
    for (let i = 0; i < SEGMENTS; i++) {
      const gap = Math.abs(u - (i + 1) / SEGMENTS);
      if (gap < nearGap) {
        nearGap = gap;
        near = i;
      }
    }
    const planet = work.planets[near];
    if (planet) {
      const w = 1 - MathUtils.smoothstep(nearGap, 0, 0.045);
      work.toPlanet.copy(planet).sub(work.pos).normalize();
      work.dir.copy(work.tan).lerp(work.toPlanet, w).normalize();
    } else {
      work.dir.copy(work.tan);
    }
    work.target.copy(work.pos).addScaledVector(work.dir, 10);
    work.m.lookAt(work.pos, work.target, UP);
    work.q.setFromRotationMatrix(work.m);
    // the opening view keeps the original straight-ahead composition
    work.q.slerp(work.qIdentity, 1 - MathUtils.smoothstep(u, 0, 0.07));
    g.quaternion.slerp(work.q, 1 - Math.exp(-dt * 5));

    /* 4. head: pointer look-around plus shake that grows with speed */
    const t = state.clock.elapsedTime;
    const shake = live.speedNorm * live.speedNorm * 0.006;
    const h = head.current;
    if (h) {
      const ease = 1 - Math.exp(-dt * 3);
      h.rotation.y += (-state.pointer.x * 0.1 + Math.sin(t * 31) * shake - h.rotation.y) * ease;
      h.rotation.x += (state.pointer.y * 0.05 + Math.sin(t * 27 + 1) * shake - h.rotation.x) * ease;
      h.rotation.z = Math.sin(t * 0.4) * 0.004 + Math.sin(t * 37) * shake;
    }

    /* 5. field of view widens with speed */
    const cam = camera.current;
    if (cam) {
      const base = state.size.width / state.size.height < 0.8 ? 74 : 58;
      const want = base + 16 * Math.pow(live.speedNorm, 1.5);
      const next = cam.fov + (want - cam.fov) * (1 - Math.exp(-dt * 6));
      if (Math.abs(next - cam.fov) > 0.005) {
        cam.fov = next;
        cam.updateProjectionMatrix();
      }
    }

    /* 6. HUD snapshot, about ten times a second */
    publishAt.current += dt;
    if (publishAt.current >= 0.1) {
      publishAt.current = 0;
      let nearId = null;
      let arrivedId = null;
      let nextIndex = -1;
      for (let i = 0; i < SEGMENTS; i++) {
        const d = DESTINATIONS[i];
        if (!d) continue;
        const gap = u - (i + 1) / SEGMENTS;
        if (Math.abs(gap) < 0.05) nearId = d.id;
        if (Math.abs(gap) < 0.012 && live.speedNorm < 0.08) arrivedId = d.id;
        if (nextIndex < 0 && gap < -0.01) nextIndex = i;
      }
      const next = nextIndex >= 0 ? DESTINATIONS[nextIndex] : undefined;
      const nextPlanet = nextIndex >= 0 ? work.planets[nextIndex] : undefined;
      flightStore.publish({
        shipU: Math.round(u * 1000) / 1000,
        speedNorm: Math.round(live.speedNorm * 100) / 100,
        worldSpeed: Math.round(live.worldSpeed * 10) / 10,
        nearId,
        nextId: next ? next.id : null,
        nextDist: next && nextPlanet ? Math.max(0, Math.round(work.pos.distanceTo(nextPlanet) - next.radius)) : null,
        arrivedId,
      });
    }
  });

  return (
    <group ref={ship} name="ship">
      <Cockpit />
      <SpeedStreaks count={quality === "high" ? 500 : 220} />
      <group ref={head}>
        <PerspectiveCamera ref={camera} makeDefault fov={58} near={0.05} far={2500} />
      </group>
    </group>
  );
}
