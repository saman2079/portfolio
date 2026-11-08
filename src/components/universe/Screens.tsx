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
  SRGBColorSpace,
} from "three";
import { en } from "@/i18n/en";
import { fa } from "@/i18n/fa";

/**
 * The three monitors above the dash (model space, the pilot looks along +Z, so the pilot's left is +X):
 *   left   — what I do        (Frontend developer)
 *   centre — who I am         (name)
 *   right  — how long         (two years of work experience)
 * Each quad sits exactly on a screen of the model, lifted 2 mm towards the pilot.
 */
const TOP = { y: 1.332, z: 0.831 };
const BOTTOM = { y: 1.243, z: 0.742 };
const LIFT = 0.002;

interface Panel {
  id: "role" | "name" | "years";
  xa: number; // model x of the edge on the pilot's right
  xb: number; // model x of the edge on the pilot's left
}
const PANELS: Panel[] = [
  { id: "role", xa: 0.225, xb: 0.425 },
  { id: "name", xa: -0.2, xb: 0.2 },
  { id: "years", xa: -0.425, xb: -0.225 },
];

function quad(xa: number, xb: number) {
  // u runs to the pilot's right (model -X), v runs up the sloped face
  const n = Math.SQRT1_2 * LIFT;
  const p = (x: number, e: { y: number; z: number }) => [x, e.y + n, e.z - n];
  const pos = [...p(xb, TOP), ...p(xa, TOP), ...p(xa, BOTTOM), ...p(xb, BOTTOM)];
  const uv = [0, 1, 1, 1, 1, 0, 0, 0];
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

function fontFamily() {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--font-body").trim();
    return v ? `${v}, Tahoma, sans-serif` : "Tahoma, 'Segoe UI', sans-serif";
  } catch {
    return "Tahoma, sans-serif";
  }
}

function draw(c: HTMLCanvasElement, id: Panel["id"]) {
  const x = c.getContext("2d");
  if (!x) return;
  const W = c.width;
  const H = c.height;
  const fam = fontFamily();
  x.clearRect(0, 0, W, H);
  x.fillStyle = "#031018";
  x.fillRect(0, 0, W, H);
  const glow = x.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.6);
  glow.addColorStop(0, "rgba(56,189,248,0.22)");
  glow.addColorStop(1, "rgba(56,189,248,0)");
  x.fillStyle = glow;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(56,189,248,0.8)";
  x.lineWidth = 4;
  x.strokeRect(10, 10, W - 20, H - 20);
  x.textAlign = "center";
  x.textBaseline = "middle";
  const line = (text: string, y: number, size: number, color: string, weight = 700) => {
    x.font = `${weight} ${Math.round(size)}px ${fam}`;
    x.fillStyle = color;
    x.fillText(text, W / 2, y);
  };
  if (id === "name") {
    line(fa.name, H * 0.36, H * 0.3, "#ffffff");
    line(en.name, H * 0.7, H * 0.2, "#7dd3fc");
  } else if (id === "role") {
    line("فرانت‌اند", H * 0.28, H * 0.19, "#ffffff");
    line("Frontend", H * 0.52, H * 0.15, "#7dd3fc");
    line("Developer", H * 0.74, H * 0.15, "#7dd3fc");
  } else {
    line("۲ سال", H * 0.27, H * 0.22, "#fbbf24");
    line("سابقه کاری", H * 0.5, H * 0.15, "#ffffff");
    line("2 years of experience", H * 0.75, H * 0.1, "#7dd3fc", 600);
  }
}

export function Screens() {
  const stuff = useMemo(
    () =>
      PANELS.map((p) => {
        const wide = p.id === "name";
        const c = document.createElement("canvas");
        c.width = wide ? 1024 : 512;
        c.height = wide ? 320 : 320;
        draw(c, p.id);
        const map = new CanvasTexture(c);
        map.colorSpace = SRGBColorSpace;
        map.anisotropy = 4;
        const mat = new MeshBasicMaterial({ map, toneMapped: false, side: DoubleSide, color: new Color(0, 0, 0) });
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -2;
        mat.polygonOffsetUnits = -2;
        return { p, c, map, mat, geo: quad(p.xa, p.xb) };
      }),
    []
  );

  // the web font may arrive after the first draw: paint again when it is ready
  useEffect(() => {
    let alive = true;
    void document.fonts?.ready.then(() => {
      if (!alive) return;
      stuff.forEach((s) => {
        draw(s.c, s.p.id);
        s.map.needsUpdate = true;
      });
    });
    return () => {
      alive = false;
    };
  }, [stuff]);

  useEffect(
    () => () => {
      stuff.forEach((s) => {
        s.map.dispose();
        s.mat.dispose();
        s.geo.dispose();
      });
    },
    [stuff]
  );

  // power-on: the screens fade up from black once the cockpit is loaded
  const t0 = useRef<number | null>(null);
  useFrame((state) => {
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const k = Math.max(0, Math.min(1, (state.clock.elapsedTime - t0.current - 0.4) / 1.4));
    const flick = k < 1 ? 0.6 + Math.sin(state.clock.elapsedTime * 60) * 0.4 : 1;
    const g = 1.2 * k * flick;
    stuff.forEach((s) => s.mat.color.setRGB(g, g, g));
  });

  return (
    <>
      {stuff.map((s) => (
        <mesh key={s.p.id} geometry={s.geo} material={s.mat} />
      ))}
    </>
  );
}
