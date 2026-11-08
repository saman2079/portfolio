"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
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
import { Planet } from "./Planet";

/** All positions here are in cockpit-model space (metres of the model; the pilot looks along +Z). */
const BUTTON: [number, number, number] = [0, 1.236, 0.535];
const RISE = 0.31;

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

/** The round button on the dash that opens and closes the hologram. */
export function HoloButton() {
  const rim = useRef<MeshBasicMaterial>(null);
  useFrame((state) => {
    const m = rim.current;
    if (!m) return;
    const pulse = holo.open ? 0.55 : 0.55 + Math.sin(state.clock.elapsedTime * 3) * 0.35;
    m.color.setRGB(3.2 * pulse, 1.3 * pulse, 0.25 * pulse);
  });
  return (
    <group
      position={BUTTON}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 6) return;
        holo.open = !holo.open;
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
        <meshBasicMaterial ref={rim} color={new Color(3.2, 1.3, 0.25)} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.0105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.013, 20]} />
        <meshBasicMaterial color={new Color(0.4, 1.8, 2.6)} toneMapped={false} side={DoubleSide} />
      </mesh>
    </group>
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
      <mesh position={[0, -size * 2.1, 0]}>
        <planeGeometry args={[size * 4.2, size * 1.05]} />
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
        <planeGeometry args={[size * 4.2, size * 5]} />
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
  const beam = useRef<MeshBasicMaterial>(null);
  const k = useRef(0);
  const open = useRef(0);
  const lang = typeof document !== "undefined" && document.documentElement.lang.startsWith("fa") ? "fa" : "en";
  const t = universeText[lang];

  const size = portrait ? 0.026 : 0.034;
  const items = useMemo(() => {
    const cols = portrait ? 3 : DESTINATIONS.length;
    const gx = portrait ? 0.075 : 0.105;
    const gy = 0.15;
    const rows = Math.ceil(DESTINATIONS.length / cols);
    return DESTINATIONS.map((d, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const inRow = Math.min(cols, DESTINATIONS.length - r * cols);
      return {
        id: d.id,
        pos: [(c - (inRow - 1) / 2) * gx, ((rows - 1) / 2 - r) * gy, 0] as [number, number, number],
      };
    });
  }, [portrait]);

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
    // the light beam only shows while the planets are rising or folding away, never over the open hologram
    if (beam.current) beam.current.opacity = 0.3 * Math.sin(Math.PI * e);
  });

  return (
    <group ref={root} position={BUTTON} rotation={[0, Math.PI, 0]} visible={false}>
      {/* light beam from the button to the planets */}
      <mesh position={[0, RISE / 2, 0]} renderOrder={-1}>
        <cylinderGeometry args={[0.1, 0.03, RISE, 24, 1, true]} />
        <meshBasicMaterial ref={beam} color={new Color(0.3, 1.1, 1.8)} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} toneMapped={false} />
      </mesh>
      <group ref={lift}>
        {items.map((it) => (
          <Orb key={it.id} id={it.id} title={t.places[it.id].title} position={it.pos} size={size} open={open} />
        ))}
      </group>
    </group>
  );
}
