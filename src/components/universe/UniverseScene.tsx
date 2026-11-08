"use client";

import { Suspense, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { DESTINATIONS, HORIZON_PLANET, SUN_POSITION, type DestinationId } from "@/lib/universe/destinations";
import { worldStore } from "@/lib/store/worldStore";
import { Planet } from "./Planet";
import { Sky, Sun } from "./Sky";
import { Asteroids } from "./Asteroids";
import { Station } from "./Station";
import { Ship } from "./Ship";
import { Cockpit } from "./Cockpit";
import { Effects } from "./Effects";
import { SurfaceWorld } from "./SurfaceWorld";
import { flightLive } from "@/lib/store/flightStore";
import type { Group } from "three";

export type UniverseLabels = Record<DestinationId, { title: string; sub: string }>;

/** If the scene stays slow for a few seconds, step down a tier (and finally to the 2D page). */
function PerformanceGuard() {
  const acc = useRef({ warm: 0, time: 0, frames: 0 });
  useFrame((_, delta) => {
    const a = acc.current;
    if (delta > 0.5) {
      // tab was hidden or the loop was paused: start measuring again
      a.warm = 0;
      a.time = 0;
      a.frames = 0;
      return;
    }
    a.warm += delta;
    if (a.warm < 4) return; // ignore shader compilation at start
    a.time += delta;
    a.frames += 1;
    if (a.time >= 3) {
      const fps = a.frames / a.time;
      a.time = 0;
      a.frames = 0;
      if (fps < 22) {
        worldStore.degrade();
        a.warm = 0;
      }
    }
  });
  return null;
}

/** Everything that is "space": hidden while the ship is on a planet's surface. */
function Space({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = !flightLive.surface;
  });
  return <group ref={group}>{children}</group>;
}

export function UniverseScene({ tier, onReady }: { tier: "high" | "low"; labels: UniverseLabels; onReady: () => void }) {
  return (
    <>
      <color attach="background" args={["#02040a"]} />
      <ambientLight intensity={0.06} />
      <hemisphereLight args={["#8fb0ff", "#1c1420", 0.45]} />
      <directionalLight position={SUN_POSITION} intensity={2.4} color="#ffe2c4" />

      <Space>
        <Sky tier={tier} />
        <Sun />
        <Planet cfg={HORIZON_PLANET} interactive={false} sunlit segments={tier === "high" ? 96 : 56} />
        {DESTINATIONS.map((cfg) => (
          <Planet
            key={cfg.id}
            cfg={cfg}
            segments={tier === "high" ? 64 : 40}
          />
        ))}
        <Asteroids count={tier === "high" ? 150 : 64} />
        <Station />
      </Space>
      <SurfaceWorld tier={tier} />
      <Ship quality={tier}>
        <Suspense fallback={null}>
          <Cockpit onLoaded={onReady} />
        </Suspense>
      </Ship>
      <Effects tier={tier} />
      <PerformanceGuard />
    </>
  );
}
