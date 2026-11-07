"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { HalfFloatType, Vector2, WebGLRenderTarget } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/**
 * HDR render → bloom (high tier only) → tone mapping + sRGB. Uses the passes that
 * ship with `three`, so no extra dependency is needed. Rendering at priority 1
 * tells react-three-fiber to leave the final draw to this composer.
 */
export function Effects({ tier }: { tier: "high" | "low" }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const rig = useMemo(() => {
    const target = new WebGLRenderTarget(size.width, size.height, {
      type: HalfFloatType,
      samples: tier === "high" ? 4 : 0,
    });
    const composer = new EffectComposer(gl, target);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    if (tier === "high") {
      composer.addPass(new UnrealBloomPass(new Vector2(size.width, size.height), 0.8, 0.65, 0.85));
    }
    composer.addPass(new OutputPass());
    return { composer, renderPass };
    // size is applied in the effect below; the camera is re-assigned every frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, tier]);

  useEffect(() => {
    rig.composer.setPixelRatio(dpr);
    rig.composer.setSize(size.width, size.height);
  }, [rig, dpr, size.width, size.height]);

  useEffect(
    () => () => {
      rig.composer.passes.forEach((pass) => pass.dispose?.());
      rig.composer.dispose();
    },
    [rig]
  );

  useFrame((state, delta) => {
    rig.renderPass.camera = state.camera;
    rig.composer.render(delta);
  }, 1);

  return null;
}
