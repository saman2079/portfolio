"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useEffect } from "react";
import { Euler, MathUtils, Matrix4, Quaternion, Vector3, type Group, type PerspectiveCamera as ThreeCamera } from "three";
import { DESTINATIONS } from "@/lib/universe/destinations";
import { SEGMENTS, flightLive, flightStore, type LandState } from "@/lib/store/flightStore";
import type { DestinationId } from "@/lib/universe/destinations";
import { EYE } from "./surface/terrain";
import { buildFlightPath } from "./flightPath";
import { Cockpit } from "./Cockpit";
import { SpeedStreaks } from "./SpeedStreaks";
import { Lever } from "./Lever";
import { ExteriorShip } from "./ExteriorShip";

/** how far the pilot can turn the head, in radians */
const MAX_YAW = 0.85;
const MAX_PITCH = 0.3;

const UP = new Vector3(0, 1, 0);
/** the point the outside camera orbits: just ahead of the pilot, in the middle of the hull */
const HULL_CENTER = new Vector3(0, -0.3, -3);
const ORBIT_RADIUS = 11.5;
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
  const cockpit = useRef<Group>(null);
  const exterior = useRef<Group>(null);
  const hs = useRef({ x: 0, y: 0 });
  const land = useRef({
    state: "idle" as LandState,
    id: null as DestinationId | null,
    index: 0,
    t: 0,
    flash: 0,
    shown: -1,
    dock: new Vector3(),
    target: new Vector3(),
  });

  // never leave the page locked or tinted if the 3D layer goes away mid-landing
  useEffect(
    () => () => {
      const root = document.documentElement;
      root.style.overflow = "";
      root.style.setProperty("--land-flash", "0");
      flightLive.surface = false;
      flightLive.landCmd = null;
      flightStore.publish({ ...flightStore.get(), land: "idle", landId: null });
    },
    []
  );
  const camera = useRef<ThreeCamera>(null);
  const publishAt = useRef(0);
  const started = useRef(false);

  const gl = useThree((s) => s.gl);
  const look = useRef({ yaw: 0, pitch: 0, drag: false, sx: 0, sy: 0, syaw: 0, spitch: 0, idle: 0, touch: false });

  /* drag left/right (and a little up/down with a mouse) to turn the pilot's head */
  useEffect(() => {
    const el = gl.domElement;
    const L = look.current;
    const down = (e: PointerEvent) => {
      if (e.button > 0) return;
      L.drag = true;
      L.touch = e.pointerType === "touch";
      L.sx = e.clientX;
      L.sy = e.clientY;
      L.syaw = L.yaw;
      L.spitch = L.pitch;
    };
    const move = (e: PointerEvent) => {
      if (!L.drag) return;
      if (flightLive.grabbing) {
        L.drag = false;
        return;
      }
      const w = Math.max(320, el.clientWidth);
      L.yaw = MathUtils.clamp(L.syaw + ((e.clientX - L.sx) / w) * 2.2, -MAX_YAW, MAX_YAW);
      if (!L.touch) L.pitch = MathUtils.clamp(L.spitch + ((e.clientY - L.sy) / w) * 1.2, -MAX_PITCH, MAX_PITCH);
      L.idle = 0;
      el.style.cursor = "grabbing";
    };
    const up = () => {
      L.drag = false;
      el.style.cursor = "";
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.style.cursor = "";
    };
  }, [gl]);

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
      eye: new Vector3(),
      qOut: new Quaternion(),
      qIn: new Quaternion(),
      euler: new Euler(0, 0, 0, "YXZ"),
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

    /* 3b. landing: dive into the planet, swap to its surface world, and back */
    const L = land.current;
    const setLand = (state: LandState) => {
      L.state = state;
      L.t = 0;
      live.surface = state === "landed" || state === "ascending";
      document.documentElement.style.overflow = state === "idle" ? "" : "hidden";
      flightStore.publish({ ...flightStore.get(), land: state, landId: state === "idle" ? null : L.id });
    };
    const cmd = live.landCmd;
    if (cmd) {
      live.landCmd = null;
      if (cmd.type === "land" && L.state === "idle" && cmd.id) {
        const index = DESTINATIONS.findIndex((d) => d.id === cmd.id);
        const cfg = DESTINATIONS[index];
        const planet = work.planets[index];
        if (cfg && planet) {
          L.id = cmd.id;
          L.index = index;
          L.dock.copy(work.pos);
          L.target.copy(work.pos).sub(planet).normalize().multiplyScalar(cfg.radius * 1.03).add(planet);
          document.documentElement.style.setProperty("--land-color", cfg.atmosphere);
          setLand("descending");
        }
      } else if (cmd.type === "takeoff" && L.state === "landed") {
        setLand("ascending");
      }
    }

    if (L.state === "descending") {
      L.t += dt;
      const p = MathUtils.clamp(L.t / 3.4, 0, 1);
      const e = Math.pow(p, 2.2);
      const planet = work.planets[L.index];
      g.position.copy(L.dock).lerp(L.target, e);
      if (planet) {
        work.m.lookAt(g.position, planet, UP);
        work.q.setFromRotationMatrix(work.m);
        g.quaternion.slerp(work.q, 1 - Math.exp(-dt * 6));
      }
      live.speedNorm = Math.max(live.speedNorm, 0.2 + 0.8 * p);
      live.vLocal[0] = 0;
      live.vLocal[1] = 0;
      live.vLocal[2] = -45 * (0.3 + p);
      L.flash = MathUtils.smoothstep(p, 0.78, 1);
      if (p >= 1) {
        setLand("landed");
        g.quaternion.identity();
      }
    } else if (L.state === "landed") {
      L.t += dt;
      const p = MathUtils.clamp(L.t / 3, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      g.position.set(0, 7 * (1 - ease), 0);
      g.quaternion.identity();
      live.speedNorm = 0.25 * (1 - p);
      live.vLocal[0] = 0;
      live.vLocal[1] = -30 * (1 - p) * (1 - p);
      live.vLocal[2] = 0;
      L.flash = Math.max(0, 1 - L.t / 1.2);
    } else if (L.state === "ascending") {
      L.t += dt;
      const p = MathUtils.clamp(L.t / 2.6, 0, 1);
      g.position.set(0, 40 * Math.pow(p, 2.2), 0);
      g.quaternion.identity();
      live.speedNorm = 0.2 + 0.8 * p;
      live.vLocal[0] = 0;
      live.vLocal[1] = 60 * p;
      live.vLocal[2] = 0;
      L.flash = MathUtils.smoothstep(p, 0.6, 1);
      if (p >= 1) {
        setLand("idle");
        g.position.copy(work.pos);
        g.quaternion.copy(work.q);
      }
    } else {
      L.flash += (0 - L.flash) * (1 - Math.exp(-dt * 3));
      if (L.flash < 0.004) L.flash = 0;
    }
    if (Math.abs(L.flash - L.shown) > 0.004) {
      L.shown = L.flash;
      document.documentElement.style.setProperty("--land-flash", L.flash.toFixed(3));
    }
    void EYE;

    /* 4. head: pointer look-around plus shake that grows with speed */
    const t = state.clock.elapsedTime;
    const shake = live.speedNorm * live.speedNorm * 0.006;
    const h = head.current;
    if (h) {
      const L = look.current;
      // after a while without dragging the head slowly returns to the front
      if (!L.drag) {
        L.idle += dt;
        if (L.idle > 2.5) {
          const back = 1 - Math.exp(-dt * 1.2);
          L.yaw -= L.yaw * back;
          L.pitch -= L.pitch * back;
        }
      }
      const ease = 1 - Math.exp(-dt * 7);
      const wantY = L.yaw - state.pointer.x * 0.03 + Math.sin(t * 31) * shake;
      const wantX = L.pitch + state.pointer.y * 0.02 + Math.sin(t * 27 + 1) * shake;
      hs.current.y += (wantY - hs.current.y) * ease;
      hs.current.x += (wantX - hs.current.x) * ease;
      const roll = Math.sin(t * 0.4) * 0.004 + Math.sin(t * 37) * shake;

      // cockpit <-> outside: ease the blend, then fly the camera out around the hull
      live.view += ((live.outside ? 1 : 0) - live.view) * (1 - Math.exp(-dt * 3.2));
      if (Math.abs(live.view - (live.outside ? 1 : 0)) < 0.001) live.view = live.outside ? 1 : 0;
      const s = MathUtils.smootherstep(live.view, 0, 1);

      // in the cockpit: head turn. outside: the same drag orbits the camera around the ship
      work.euler.set(hs.current.x, hs.current.y, roll);
      work.qIn.setFromEuler(work.euler);
      if (s > 0) {
        const az = hs.current.y * 2;
        const el = 0.22 + hs.current.x;
        work.eye.set(
          HULL_CENTER.x + ORBIT_RADIUS * Math.cos(el) * Math.sin(az),
          HULL_CENTER.y + ORBIT_RADIUS * Math.sin(el),
          HULL_CENTER.z + ORBIT_RADIUS * Math.cos(el) * Math.cos(az)
        );
        work.m.lookAt(work.eye, HULL_CENTER, UP);
        work.qOut.setFromRotationMatrix(work.m);
        h.position.set(0, 0, 0).lerp(work.eye, s);
        h.quaternion.copy(work.qIn).slerp(work.qOut, s);
      } else {
        h.position.set(0, 0, 0);
        h.quaternion.copy(work.qIn);
      }
      // swap interiors: the cockpit (and its lights, kept in the scene) shrinks away, the hull appears
      const inside = s < 0.2;
      if (cockpit.current) cockpit.current.scale.setScalar(inside ? 1 : 0.0001);
      if (exterior.current) exterior.current.visible = s > 0.12;
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
        speedMul: Math.round(live.speedMul * 100) / 100,
        land: L.state,
        landId: L.state === "idle" ? null : L.id,
      });
    }
  });

  return (
    <group ref={ship} name="ship">
      <group ref={cockpit}>
        <Cockpit />
        <Lever />
      </group>
      <ExteriorShip groupRef={exterior} />
      <SpeedStreaks count={quality === "high" ? 500 : 220} />
      <group ref={head}>
        <PerspectiveCamera ref={camera} makeDefault fov={58} near={0.05} far={2500} />
      </group>
    </group>
  );
}
