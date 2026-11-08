"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { detectCapability } from "@/lib/three/capability";
import { useWorld, worldStore } from "@/lib/store/worldStore";
import { useSceneState } from "@/lib/store/sceneStore";
import { flightLive, useFlightPick } from "@/lib/store/flightStore";
import { attachFlight } from "@/lib/flight/controller";
import { useSectionTracking } from "./useSectionTracking";
import { setLitePreference } from "@/lib/three/preference";
import { universeText } from "@/i18n/universe";
import { DESTINATION_IDS } from "@/lib/universe/destinations";
import type { Locale } from "@/i18n/config";
import type { UniverseLabels } from "./UniverseScene";
import { UniverseHud } from "./UniverseHud";
import { SectionPanel, type UniverseContent } from "./SectionPanel";
import { BuilderUi } from "./lab/BuilderUi";
import { baseStore } from "@/lib/lab/baseStore";

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
  content: UniverseContent;
}

export function UniverseRoot({ lang, name, role, tagline, content }: Props) {
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

  const land = useFlightPick((h) => h.land);
  const on = world.status === "active" && ready && scene.section === "top";

  useEffect(() => {
    flightLive.enabled = on;
    return () => {
      flightLive.enabled = false;
    };
  }, [on]);

  // the skills become the buildings of the Lab base
  useEffect(() => {
    baseStore.setSkills(content.skills.groups.flatMap((g) => g.items.map((i) => ({ name: i.name, level: i.level }))));
  }, [content]);

  // hide the 3D planet labels while standing on a surface
  useEffect(() => {
    document.documentElement.dataset.surface = land === "landed" ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.surface;
    };
  }, [land]);

  // CSS hooks: hide the legacy hero and the 2D chrome only while the universe is on screen
  useEffect(() => {
    document.documentElement.dataset.universe = on ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.universe;
    };
  }, [on]);

  // the visitor chose the plain page: leave a way back to the universe
  if (world.status === "fallback" && world.reason === "forced-off") {
    const back = () => {
      setLitePreference(false);
      const url = new URL(window.location.href);
      url.searchParams.set("world", "on");
      window.location.replace(url.toString());
    };
    return (
      <button
        type="button"
        onClick={back}
        className="fixed bottom-3 start-3 z-50 rounded-full border border-cyan-300/40 bg-black/60 px-4 py-2 text-xs text-cyan-100 backdrop-blur transition hover:border-cyan-300"
      >
        {universeText[lang].back3d}
      </button>
    );
  }

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
      <SectionPanel lang={lang} content={content} />
      <BuilderUi lang={lang} />
      <div aria-hidden className="universe-flash" />
    </div>
  );
}
