"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  MeshBasicMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Group,
} from "three";
import data from "@/lib/universe/consoleScreens.json";
import { en } from "@/i18n/en";
import { fa } from "@/i18n/fa";

/**
 * Screens of "Large Wall-Mounted Computer Console" by Inditrion Dradnon (CC BY 4.0,
 * sketchfab.com/3d-models/large-wall-mounted-computer-console). Only the screen meshes were kept
 * (the housing was dropped) and their geometry is baked into consoleScreens.json.
 * The big panel shows the owner's name and role; the others show a quiet data readout.
 */

/** Where the console sits in ship space (the pilot's eye is the origin, forward is -Z). Tunable with ?con=x,y,z,scale,tiltX */
const DEFAULT = { x: 0, y: -0.8, z: -1.5, s: 0.1, rx: 0 };

function readOverride() {
  const out = { ...DEFAULT };
  try {
    const raw = new URLSearchParams(window.location.search).get("con");
    if (!raw) return out;
    const v = raw.split(",").map(Number);
    const keys = ["x", "y", "z", "s", "rx"] as const;
    keys.forEach((k, i) => {
      const n = v[i];
      if (n !== undefined && Number.isFinite(n)) out[k] = n;
    });
  } catch {
    /* ignore */
  }
  return out;
}

function geo(p: number[], uv: number[]) {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(p), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  g.computeVertexNormals();
  return g;
}

function mainTexture() {
  const H = 512;
  const W = Math.round(H * data.aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) return null;
  x.fillStyle = "#020b14";
  x.fillRect(0, 0, W, H);
  // faint grid
  x.strokeStyle = "rgba(56,189,248,0.10)";
  x.lineWidth = 1;
  for (let i = 0; i <= W; i += 48) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, H);
    x.stroke();
  }
  for (let j = 0; j <= H; j += 48) {
    x.beginPath();
    x.moveTo(0, j);
    x.lineTo(W, j);
    x.stroke();
  }
  // frame
  x.strokeStyle = "rgba(56,189,248,0.75)";
  x.lineWidth = 4;
  x.strokeRect(14, 14, W - 28, H - 28);
  x.fillStyle = "rgba(56,189,248,0.9)";
  x.font = "600 22px ui-monospace, Menlo, Consolas, monospace";
  x.textAlign = "left";
  x.fillText("SAMAN.OS  //  PILOT ONLINE", 40, 52);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#ffffff";
  x.font = `700 ${Math.round(H * 0.16)}px Tahoma, "Segoe UI", Arial, sans-serif`;
  x.fillText(fa.name, W / 2, H * 0.33);
  x.fillStyle = "#7dd3fc";
  x.font = `600 ${Math.round(H * 0.1)}px Tahoma, "Segoe UI", Arial, sans-serif`;
  x.fillText(fa.role, W / 2, H * 0.5);
  x.fillStyle = "#ffffff";
  x.font = `700 ${Math.round(H * 0.12)}px "Segoe UI", Arial, sans-serif`;
  x.fillText(en.name, W / 2, H * 0.68);
  x.fillStyle = "#fbbf24";
  x.font = `600 ${Math.round(H * 0.085)}px "Segoe UI", Arial, sans-serif`;
  x.fillText(en.role, W / 2, H * 0.82);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function auxTexture() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const x = c.getContext("2d");
  if (!x) return null;
  x.fillStyle = "#020b14";
  x.fillRect(0, 0, S, S);
  x.strokeStyle = "rgba(56,189,248,0.25)";
  x.lineWidth = 1;
  for (let i = 0; i <= S; i += 32) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, i);
    x.lineTo(S, i);
    x.stroke();
  }
  const bars = [0.7, 0.45, 0.9, 0.3, 0.6, 0.8, 0.5];
  bars.forEach((h, i) => {
    x.fillStyle = i % 3 === 1 ? "rgba(251,191,36,0.85)" : "rgba(56,189,248,0.8)";
    x.fillRect(14 + i * 34, S - 20 - h * (S - 70), 22, h * (S - 70));
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  return t;
}

export function ConsoleScreens() {
  const root = useRef<Group>(null);
  const placed = useMemo(readOverride, []);

  const stuff = useMemo(() => {
    const mainMap = mainTexture();
    const auxMap = auxTexture();
    const mainMat = new MeshBasicMaterial({ map: mainMap, toneMapped: false, side: DoubleSide, color: new Color(0, 0, 0) });
    const auxMat = new MeshBasicMaterial({ map: auxMap, toneMapped: false, side: DoubleSide, color: new Color(0, 0, 0) });
    return {
      mainMap,
      auxMap,
      mainMat,
      auxMat,
      mainGeo: geo(data.main.p, data.main.uv),
      auxGeo: geo(data.aux.p, data.aux.uv),
    };
  }, []);

  useEffect(
    () => () => {
      stuff.mainMap?.dispose();
      stuff.auxMap?.dispose();
      stuff.mainMat.dispose();
      stuff.auxMat.dispose();
      stuff.mainGeo.dispose();
      stuff.auxGeo.dispose();
    },
    [stuff]
  );

  // power-on: the screens fade up from black once they are loaded
  const t0 = useRef<number | null>(null);
  useFrame((state) => {
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const k = Math.min(1, (state.clock.elapsedTime - t0.current - 0.4) / 1.4);
    const a = Math.max(0, k);
    const flick = a < 1 ? 0.6 + Math.sin(state.clock.elapsedTime * 60) * 0.4 : 1;
    const g = a * flick;
    stuff.mainMat.color.setRGB(1.25 * g, 1.25 * g, 1.25 * g);
    stuff.auxMat.color.setRGB(0.9 * g, 0.9 * g, 0.9 * g);
  });

  return (
    <group ref={root} position={[placed.x, placed.y, placed.z]} rotation={[placed.rx, 0, 0]} scale={placed.s}>
      <mesh geometry={stuff.mainGeo} material={stuff.mainMat} />
      <mesh geometry={stuff.auxGeo} material={stuff.auxMat} />
    </group>
  );
}
