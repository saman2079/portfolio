"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { AdditiveBlending, Color, DoubleSide, MathUtils, ShaderMaterial, Vector3, type Group } from "three";
import { SUN_POSITION, type DestinationConfig } from "@/lib/universe/destinations";
import { universeStore, useUniverse } from "@/lib/store/universeStore";
import { PlanetBody } from "./PlanetModel";
import { StormShell } from "./StormShell";
import {
  atmosphereFragment,
  atmosphereVertex,
  planetFragment,
  planetVertex,
  ringFragment,
  ringVertex,
} from "./shaders";

const ATMOS_SCALE = 1.12;

interface PlanetProps {
  cfg: DestinationConfig;
  label?: string;
  sublabel?: string;
  interactive?: boolean;
  /** true: lit by the real sun position; false: art-directed key light */
  sunlit?: boolean;
  segments?: number;
}

export function Planet({ cfg, label, sublabel, interactive = true, sunlit = false, segments = 64 }: PlanetProps) {
  const body = useRef<Group>(null);
  const hover = useRef(0);
  const { hovered } = useUniverse();
  const hot = interactive && hovered === cfg.id;

  const lightDir = useMemo(() => {
    if (sunlit) return new Vector3(...SUN_POSITION).sub(new Vector3(...cfg.position)).normalize();
    return new Vector3(...cfg.light).normalize();
  }, [cfg, sunlit]);

  const materials = useMemo(() => {
    const planet = new ShaderMaterial({
      vertexShader: planetVertex,
      fragmentShader: planetFragment,
      uniforms: {
        uA: { value: new Color(cfg.colors[0]) },
        uB: { value: new Color(cfg.colors[1]) },
        uC: { value: new Color(cfg.colors[2]) },
        uAtmos: { value: new Color(cfg.atmosphere) },
        uLight: { value: lightDir.clone() },
        uSeed: { value: cfg.seed },
        uBands: { value: cfg.bands },
        uBandMix: { value: cfg.bandMix },
        uCloud: { value: cfg.cloud },
      },
    });
    const atmo = new ShaderMaterial({
      vertexShader: atmosphereVertex,
      fragmentShader: atmosphereFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uColor: { value: new Color(cfg.atmosphere) },
        uLight: { value: lightDir.clone() },
        uIntensity: { value: 1 },
      },
    });
    const ring = cfg.ring
      ? new ShaderMaterial({
          vertexShader: ringVertex,
          fragmentShader: ringFragment,
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
          uniforms: {
            uColor: { value: new Color(cfg.ring.color) },
            uInner: { value: cfg.radius * cfg.ring.inner },
            uOuter: { value: cfg.radius * cfg.ring.outer },
            uSeed: { value: cfg.seed },
          },
        })
      : null;
    return { planet, atmo, ring };
  }, [cfg, lightDir]);

  useEffect(
    () => () => {
      materials.planet.dispose();
      materials.atmo.dispose();
      materials.ring?.dispose();
    },
    [materials]
  );

  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    []
  );

  useFrame((_, delta) => {
    if (body.current) body.current.rotation.y += delta * cfg.spin;
    const target = interactive && universeStore.get().hovered === cfg.id ? 1 : 0;
    hover.current = MathUtils.damp(hover.current, target, 6, delta);
    const u = materials.atmo.uniforms["uIntensity"];
    if (u) u.value = 1 + hover.current * 1.1;
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    universeStore.hover(cfg.id);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    universeStore.hover(null);
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // a drag (looking around the cabin) must not count as a click
    if (e.delta > 6) return;
    universeStore.goTo(cfg.id);
  };

  return (
    <group position={cfg.position}>
      <group ref={body} rotation={[0.18, 0, 0.12]}>
        {/* the model streams in; until it is there the painted sphere stands in for it */}
        <Suspense
          fallback={
            <mesh material={materials.planet}>
              <sphereGeometry args={[cfg.radius, segments, Math.round(segments * 0.75)]} />
            </mesh>
          }
        >
          <PlanetBody kind={cfg.model} radius={cfg.radius} />
        </Suspense>
      </group>

      {cfg.id === "lab" && <StormShell radius={cfg.radius} bolts={interactive} />}

      <mesh material={materials.atmo} scale={ATMOS_SCALE}>
        <sphereGeometry args={[cfg.radius, 48, 32]} />
      </mesh>

      {cfg.ring && materials.ring && (
        <mesh material={materials.ring} rotation={[-Math.PI / 2 + cfg.ring.tilt, 0, 0.25]}>
          <ringGeometry args={[cfg.radius * cfg.ring.inner, cfg.radius * cfg.ring.outer, 128, 1]} />
        </mesh>
      )}

      {interactive && (
        <mesh onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <sphereGeometry args={[cfg.radius * 1.3, 16, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}

      {interactive && label && (
        <Html position={[0, cfg.radius * 1.45, 0]} center pointerEvents="none" zIndexRange={[5, 0]}>
          <div className="universe-label" data-hot={hot ? "true" : undefined}>
            <span>{label}</span>
            {sublabel && <small>{sublabel}</small>}
          </div>
        </Html>
      )}
    </group>
  );
}
