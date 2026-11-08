"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { detectCapability } from "@/lib/three/capability";
import { useWorld, worldStore } from "@/lib/store/worldStore";
import { useSceneState } from "@/lib/store/sceneStore";
import { flightLive } from "@/lib/store/flightStore";
import { attachFlight } from "@/lib/flight/controller";
import { useSectionTracking } from "@/components/world/useSectionTracking";
import { universeText } from "@/i18n/universe";
import { DESTINATION_IDS } from "@/lib/universe/destinations";
import type { Locale } from "@/i18n/config";
import type { UniverseLabels } from "./UniverseScene";
import { UniverseHud } from "./UniverseHud";

const UniverseCanvas = dynamic(() => import("./UniverseCanvas"), { ssr: false });

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Any render error in the 3D tree falls back to the regular 2D page instead of a blank screen. */
class Boundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface Props {
  lang: Locale;
  name: string;
  role: string;
  tagline: string;
}

export function UniverseRoot({ lang, name, role, tagline }: Props) {
  const world = useWorld();
  const scene = useSceneState();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as IdleWindow;
    const run = () => worldStore.resolve(detectCapability());
    if (w.requestIdleCallback && w.cancelIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 600);
    return () => window.clearTimeout(id);
  }, []);

  useSectionTracking(world.status === "active");

  // scroll position drives the ship while the 3D world is active
  useEffect(() => {
    if (world.status !== "active") return;
    return attachFlight();
  }, [world.status]);

  const labels = useMemo(() => {
    const places = universeText[lang].places;
    return Object.fromEntries(DESTINATION_IDS.map((id) => [id, places[id]])) as UniverseLabels;
  }, [lang]);

  const on = world.status === "active" && ready && scene.section === "top";

  useEffect(() => {
    flightLive.enabled = on;
    return () => {
      flightLive.enabled = false;
    };
  }, [on]);

  // CSS hooks: hide the legacy hero and the 2D chrome only while the universe is on screen
  useEffect(() => {
    document.documentElement.dataset.universe = on ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.universe;
    };
  }, [on]);

  if (world.status !== "active") return null;

  return (
    <div className="universe-layer" data-on={on ? "true" : "false"}>
      <div aria-hidden className="universe-canvas">
        <Boundary onError={() => worldStore.fail("load-error")}>
          <UniverseCanvas
            tier={world.tier === "low" ? "low" : "high"}
            active={on}
            labels={labels}
            onReady={() => setReady(true)}
          />
        </Boundary>
      </div>
      <UniverseHud lang={lang} name={name} role={role} tagline={tagline} />
    </div>
  );
}
