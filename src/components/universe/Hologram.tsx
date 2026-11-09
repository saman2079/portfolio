"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  SRGBColorSpace,
  type Group,
  type MeshBasicMaterial,
} from "three";
import { DESTINATIONS, type DestinationId } from "@/lib/universe/destinations";
import { universeText } from "@/i18n/universe";
import { flightLive, flightStore } from "@/lib/store/flightStore";
import { universeStore } from "@/lib/store/universeStore";
import { holo } from "@/lib/store/holoStore";
import { toggleMusic } from "@/lib/audio/music";
import { Planet } from "./Planet";

/** All positions here are in cockpit-model space (metres of the model; the pilot looks along +Z). */
const BUTTON: [number, number, number] = [0, 1.236, 0.535];
const RISE = 0.24;

/** Should the hologram be shown right now? (it also folds away whenever the pilot leaves the cockpit view) */
function canShow() {
  return (
    holo.open &&
    !flightLive.surface &&
    flightLive.view < 0.05 &&
    !flightLive.build &&
    !universeStore.get().panel &&
    flightStore.get().land === "idle"
  );
}

function docLang() {
  return typeof document !== "undefined" && document.documentElement.lang.startsWith("fa") ? "fa" : "en";
}

function Button({
  x,
  color,
  active,
  onPress,
  caption,
}: {
  x: number;
  color: [number, number, number];
  active: () => boolean;
  onPress: () => void;
  caption: string;
}) {
  const rim = useRef<MeshBasicMaterial>(null);
  const map = useMemo(() => nameTexture(caption), [caption]);
  useEffect(() => () => map?.dispose(), [map]);
  useFrame((state) => {
    const m = rim.current;
    if (!m) return;
    // lit steadily while it is on, breathing while it waits to be pressed
    const pulse = active() ? 1 : 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
    m.color.setRGB(color[0] * pulse, color[1] * pulse, color[2] * pulse);
  });
  return (
    <group position={[BUTTON[0] + x, BUTTON[1], BUTTON[2]]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 6) return;
          onPress();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <mesh position={[0, 0.004, 0]}>
          <cylinderGeometry args={[0.04, 0.045, 0.01, 32]} />
          <meshBasicMaterial color="#1a0e04" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.0105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.022, 0.034, 32]} />
          <meshBasicMaterial ref={rim} color={new Color(...color)} toneMapped={false} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.0105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.013, 20]} />
          <meshBasicMaterial color={new Color(0.4, 1.8, 2.6)} toneMapped={false} side={DoubleSide} />
        </mesh>
      </group>
      {/* caption behind the button, tilted up towards the pilot */}
      <mesh position={[0, 0.014, 0.068]} rotation={[1.0, Math.PI, 0]} renderOrder={3}>
        <planeGeometry args={[0.13, 0.0325]} />
        <meshBasicMaterial map={map} transparent toneMapped={false} depthWrite={false} side={DoubleSide} />
      </mesh>
    </group>
  );
}

/** Two round buttons on the dash: planet hologram (middle) and music (beside it), each with a caption. */
export function DashButtons() {
  const fa = docLang() === "fa";
  return (
    <>
      <Button
        x={0}
        color={[3.2, 1.3, 0.25]}
        active={() => holo.open}
        onPress={() => {
          holo.open = !holo.open;
        }}
        caption={fa ? "سیاره‌ها" : "Planets"}
      />
      <Button
        x={-0.12}
        color={[0.3, 2.6, 1.2]}
        active={() => holo.music}
        onPress={toggleMusic}
        caption={fa ? "آهنگ" : "Music"}
      />
    </>
  );
}

function nameTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 384;
  c.height = 96;
  const x = c.getContext("2d");
  if (!x) return null;
  let fam = "Tahoma, sans-serif";
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--font-body").trim();
    if (v) fam = `${v}, ${fam}`;
  } catch {
    /* ignore */
  }
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `700 54px ${fam}`;
  x.shadowColor = "rgba(0,0,0,0.9)";
  x.shadowBlur = 8;
  x.fillStyle = "#e6f9ff";
  x.fillText(text, 192, 50);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Dark glass with a faint grid and a glowing frame: the screen the planets are shown on. */
function panelTexture(aspect: number) {
  const H = 512;
  const W = Math.round(H * aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) return null;
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#04202f");
  g.addColorStop(1, "#020a12");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(56,189,248,0.13)";
  x.lineWidth = 1;
  for (let i = 0; i <= W; i += 40) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, H);
    x.stroke();
  }
  for (let j = 0; j <= H; j += 40) {
    x.beginPath();
    x.moveTo(0, j);
    x.lineTo(W, j);
    x.stroke();
  }
  x.fillStyle = "rgba(125,211,252,0.05)";
  for (let j = 0; j < H; j += 6) x.fillRect(0, j, W, 2);
  x.strokeStyle = "rgba(56,189,248,0.9)";
  x.lineWidth = 6;
  x.strokeRect(8, 8, W - 16, H - 16);
  x.strokeStyle = "rgba(251,191,36,0.9)";
  x.lineWidth = 8;
  const L = 46;
  for (const [cx, cy, dx, dy] of [[8, 8, 1, 1], [W - 8, 8, -1, 1], [8, H - 8, 1, -1], [W - 8, H - 8, -1, -1]] as const) {
    x.beginPath();
    x.moveTo(cx + dx * L, cy);
    x.lineTo(cx, cy);
    x.lineTo(cx, cy + dy * L);
    x.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Orb({
  id,
  title,
  position,
  size,
  open,
}: {
  id: DestinationId;
  title: string;
  position: [number, number, number];
  size: number;
  open: MutableRefObject<number>;
}) {
  const cfg = DESTINATIONS.find((d) => d.id === id);
  const group = useRef<Group>(null);
  const map = useMemo(() => nameTexture(title), [title]);
  useEffect(() => () => map?.dispose(), [map]);
  const body = useMemo(() => (cfg ? { ...cfg, position: [0, 0, 0] as [number, number, number], radius: 1 } : null), [cfg]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const target = universeStore.get().hovered === id ? 1.35 : 1;
    g.scale.setScalar(g.scale.x + (target - g.scale.x) * Math.min(1, dt * 10));
  });

  if (!body) return null;
  return (
    <group position={position}>
      <group ref={group}>
        <group scale={size}>
          <Planet cfg={body} interactive={false} segments={26} />
        </group>
      </group>
      <mesh position={[0, -size * 1.75, 0]}>
        <planeGeometry args={[size * 3.4, size * 0.85]} />
        <meshBasicMaterial map={map} transparent toneMapped={false} depthWrite={false} side={DoubleSide} />
      </mesh>
      <mesh
        position={[0, -size * 0.6, 0.002]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta > 6 || open.current < 0.8) return;
          universeStore.goTo(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (open.current < 0.8) return;
          universeStore.hover(id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (universeStore.get().hovered === id) universeStore.hover(null);
          document.body.style.cursor = "";
        }}
      >
        <planeGeometry args={[size * 3.4, size * 4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Six small 3D planets that rise from the dash button. Tap one and the ship flies there. */
export function Hologram() {
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const portrait = aspect < 0.8;
  const root = useRef<Group>(null);
  const lift = useRef<Group>(null);
  const k = useRef(0);
  const open = useRef(0);
  const lang = docLang();
  const t = universeText[lang];

  // the six planets stand side by side on a half circle, like a rainbow over the dash
  const radius = portrait ? 0.14 : 0.23;
  const size = portrait ? 0.02 : 0.033;
  const items = useMemo(
    () =>
      DESTINATIONS.map((d, i) => {
        const theta = Math.PI * (1 - (0.07 + (0.86 * i) / (DESTINATIONS.length - 1)));
        return {
          id: d.id,
          pos: [Math.cos(theta) * radius, Math.sin(theta) * radius, 0] as [number, number, number],
        };
      }),
    [radius]
  );

  const panel = useMemo(() => {
    const w = 2 * radius + 0.34;
    const h = radius + 0.22;
    return { w, h, cy: (radius - 0.02) / 2 };
  }, [radius]);
  const panelMap = useMemo(() => panelTexture(panel.w / panel.h), [panel]);
  useEffect(() => () => panelMap?.dispose(), [panelMap]);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    k.current = Math.min(1, Math.max(0, k.current + (canShow() ? 1 : -1) * dt * 1.8));
    const e = k.current * k.current * (3 - 2 * k.current);
    open.current = e;
    g.visible = e > 0.002;
    if (lift.current) {
      lift.current.position.y = RISE * e;
      const flick = e < 1 ? 0.75 + Math.sin(state.clock.elapsedTime * 50) * 0.25 : 1;
      lift.current.scale.setScalar(Math.max(0.001, e) * flick);
    }
  });

  return (
    <group ref={root} position={BUTTON} rotation={[0, Math.PI, 0]} visible={false}>
      <group ref={lift}>
        {/* the hologram monitor: opaque, so it hides the view behind it and the planets read cleanly */}
        <mesh
          position={[0, panel.cy, -0.03]}
          onClick={(e) => {
            if (open.current > 0.8) e.stopPropagation();
          }}
          onPointerOver={(e) => {
            if (open.current > 0.8) e.stopPropagation();
          }}
        >
          <planeGeometry args={[panel.w, panel.h]} />
          <meshBasicMaterial map={panelMap} color={new Color(1.15, 1.15, 1.15)} toneMapped={false} side={DoubleSide} />
        </mesh>
        {items.map((it) => (
          <Orb key={it.id} id={it.id} title={t.places[it.id].title} position={it.pos} size={size} open={open} />
        ))}
      </group>
    </group>
  );
}
