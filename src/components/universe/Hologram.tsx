"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  PlaneGeometry,
  SRGBColorSpace,
  type Group,
} from "three";
import { DESTINATIONS, type DestinationId } from "@/lib/universe/destinations";
import { universeText } from "@/i18n/universe";
import { flightLive, flightStore, setSpeedMul, useFlightPick } from "@/lib/store/flightStore";
import { universeStore } from "@/lib/store/universeStore";
import { holo } from "@/lib/store/holoStore";

/** Hologram that opens above the console screens. Every planet is a button that flies the ship there. */
const CENTER: [number, number, number] = [0, 0.17, -1.6];

function textTexture(text: string, w: number, h: number, size: number, color: string) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  if (!x) return null;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `700 ${size}px Tahoma, "Segoe UI", Arial, sans-serif`;
  x.shadowColor = "rgba(56,189,248,0.9)";
  x.shadowBlur = 12;
  x.fillStyle = color;
  x.fillText(text, w / 2, h / 2 + 2);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function Label({
  text,
  width,
  height,
  size = 40,
  color = "#e0f7ff",
  position,
  onClick,
}: {
  text: string;
  width: number;
  height: number;
  size?: number;
  color?: string;
  position: [number, number, number];
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const map = useMemo(() => textTexture(text, 320, Math.round((320 * height) / width), size, color), [text, width, height, size, color]);
  useEffect(() => () => map?.dispose(), [map]);
  return (
    <mesh position={position} onClick={onClick}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={map} transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} />
    </mesh>
  );
}

function Planet({
  id,
  position,
  title,
  open,
}: {
  id: DestinationId;
  position: [number, number, number];
  title: string;
  open: MutableRefObject<number>;
}) {
  const cfg = DESTINATIONS.find((d) => d.id === id);
  const group = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const colors = useMemo(
    () => ({
      body: new Color(cfg?.colors[2] ?? "#ffffff").multiplyScalar(1.25),
      wire: new Color(cfg?.colors[1] ?? "#38bdf8").lerp(new Color("#7dd3fc"), 0.5).multiplyScalar(1.4),
    }),
    [cfg]
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const hovered = universeStore.get().hovered === id;
    const target = hovered ? 1.3 : 1;
    g.scale.setScalar(g.scale.x + (target - g.scale.x) * Math.min(1, dt * 10));
    if (spin.current) spin.current.rotation.y += dt * (hovered ? 1.6 : 0.5);
  });

  const go = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6 || open.current < 0.8) return;
    universeStore.goTo(id);
  };
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (open.current < 0.8) return;
    universeStore.hover(id);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    if (universeStore.get().hovered === id) universeStore.hover(null);
    document.body.style.cursor = "";
  };

  return (
    <group position={position}>
      <group ref={group}>
        <group ref={spin}>
          <mesh>
            <sphereGeometry args={[0.042, 20, 14]} />
            <meshBasicMaterial color={colors.body} transparent opacity={0.8} toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.052, 12, 8]} />
            <meshBasicMaterial color={colors.wire} wireframe transparent opacity={0.55} toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
          </mesh>
        </group>
      </group>
      {/* generous hit area: planet and its name */}
      <mesh position={[0, -0.04, 0.01]} onClick={go} onPointerOver={over} onPointerOut={out}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Label text={title} width={0.2} height={0.05} size={46} position={[0, -0.085, 0]} />
    </group>
  );
}

export function Hologram({ ready }: { ready: boolean }) {
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const portrait = aspect < 0.8;
  const root = useRef<Group>(null);
  const k = useRef(0);
  const open = useRef(0);
  const speed = useFlightPick((h) => Math.round(h.speedMul * 10) / 10);
  const lang = typeof document !== "undefined" && document.documentElement.lang.startsWith("fa") ? "fa" : "en";
  const t = universeText[lang];

  const layout = useMemo(() => {
    const cols = portrait ? 3 : DESTINATIONS.length;
    const rows = Math.ceil(DESTINATIONS.length / cols);
    const sx = portrait ? 0.21 : 0.225;
    const sy = 0.2;
    const items = DESTINATIONS.map((d, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const inRow = Math.min(cols, DESTINATIONS.length - r * cols);
      const x = (c - (inRow - 1) / 2) * sx;
      const y = ((rows - 1) / 2 - r) * sy;
      return { id: d.id, pos: [x, y, 0] as [number, number, number] };
    });
    const w = cols * sx + 0.08;
    const h = rows * sy + 0.1;
    return { items, w, h, rows };
  }, [portrait]);

  const frame = useMemo(() => new PlaneGeometry(layout.w, layout.h), [layout]);
  useEffect(() => () => frame.dispose(), [frame]);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const want =
      ready &&
      holo.open &&
      !flightLive.surface &&
      flightLive.view < 0.05 &&
      !flightLive.build &&
      !universeStore.get().panel &&
      flightStore.get().land === "idle";
    k.current = Math.min(1, Math.max(0, k.current + (want ? 1 : -1) * dt * 2.2));
    const e = k.current * k.current * (3 - 2 * k.current);
    open.current = e;
    g.visible = e > 0.002;
    const flicker = e < 1 ? 0.7 + Math.sin(state.clock.elapsedTime * 55) * 0.3 : 1;
    g.scale.set(e * flicker, Math.max(0.001, e), 1);
  });

  const step = (f: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6 || open.current < 0.8) return;
    setSpeedMul(flightLive.speedMul * f);
  };
  const rowY = -layout.h / 2 - 0.045;

  return (
    <group ref={root} position={CENTER} rotation={[-0.16, 0, 0]} visible={false}>
      <mesh geometry={frame}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.07} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} toneMapped={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[frame]} />
        <lineBasicMaterial color={new Color(0.2, 0.9, 1.6)} transparent opacity={0.7} toneMapped={false} />
      </lineSegments>
      {layout.items.map((it) => (
        <Planet key={it.id} id={it.id} position={it.pos} title={t.places[it.id].title} open={open} />
      ))}
      {/* flight speed: − 1.0x + */}
      <Label text="−" width={0.07} height={0.07} size={64} position={[-0.17, rowY, 0]} onClick={step(1 / 1.25)} />
      <Label text={`${speed.toFixed(1)}x`} width={0.2} height={0.06} size={44} color="#7dd3fc" position={[0, rowY, 0]} />
      <Label text="+" width={0.07} height={0.07} size={64} position={[0.17, rowY, 0]} onClick={step(1.25)} />
    </group>
  );
}
