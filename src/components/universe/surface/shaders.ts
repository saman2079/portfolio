import { NOISE_GLSL } from "../shaders";

/* Colours are linear; the composer's OutputPass does tone mapping and sRGB. */

export const terrainVertex = /* glsl */ `
attribute float aH;
varying vec3 vWorld;
varying vec3 vN;
varying float vH;
varying float vDist;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vN = normal;
  vH = aH;
  vDist = distance(cameraPosition, w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const terrainFragment = /* glsl */ `
${NOISE_GLSL}
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uHorizon;
uniform vec3 uSun;
uniform float uAmp;
uniform float uFog;
uniform float uAmb;
#ifdef USE_TEX
uniform sampler2D uTex;
uniform sampler2D uNorm;
#endif
varying vec3 vWorld;
varying vec3 vN;
varying float vH;
varying float vDist;
void main() {
  vec3 n = normalize(vN);
  float m = vnoise(vec3(vWorld.xz * 0.9, 3.0));
  float m2 = vnoise(vec3(vWorld.xz * 6.0, 1.0));
  n = normalize(n + vec3(m - 0.5, 0.0, m2 - 0.5) * 0.3);
  float hn = clamp(vH / uAmp * 0.9 + 0.45, 0.0, 1.0);
  vec3 col = mix(uA, uB, smoothstep(0.12, 0.5, hn));
  col = mix(col, uC, smoothstep(0.55, 0.95, hn) * 0.85);
  float slope = 1.0 - n.y;
  col = mix(col, uA * 0.55, smoothstep(0.12, 0.5, slope));
  col *= 0.78 + m * 0.5;
#ifdef USE_TEX
  // photographic rock detail from the Thunderstorm model (mirror-tiled so no seams show):
  // two broad scales everywhere, plus a fine scale that fades in close to the camera
  vec2 w2 = vWorld.xz * 0.063 + 0.37;
  vec2 w3 = vWorld.xz * 0.34 + 0.11;
  float nearW = 1.0 - smoothstep(25.0, 110.0, vDist);
  float rt = texture2D(uTex, vWorld.xz * 0.011).r * 0.5 + texture2D(uTex, w2).r * 0.5;
  float fineT = texture2D(uTex, w3).r;
  col *= 0.42 + rt * 1.16;
  col *= mix(1.0, 0.62 + fineT * 0.76, nearW);
  // relief lighting from the model's normal map
  vec3 nm = texture2D(uNorm, w2).xyz * 2.0 - 1.0;
  vec3 nf = texture2D(uNorm, w3).xyz * 2.0 - 1.0;
  n = normalize(n + vec3(nm.x, 0.0, -nm.y) * 0.6 + vec3(nf.x, 0.0, -nf.y) * 0.55 * nearW);
#endif
  float diff = max(dot(n, uSun), 0.0);
  vec3 amb = mix(uA, uHorizon, 0.55) * uAmb;
  vec3 lit = col * (amb + diff * vec3(1.0, 0.95, 0.88) * 1.3);
  float grain = step(0.985, vnoise(vec3(vWorld.xz * 14.0, 7.0)));
  lit += uC * grain * (0.25 + diff) * 0.8;
  float f = 1.0 - exp(-vDist * uFog);
  gl_FragColor = vec4(mix(lit, uHorizon, clamp(f, 0.0, 1.0)), 1.0);
}
`;

export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const skyFragment = /* glsl */ `
${NOISE_GLSL}
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uSunColor;
uniform vec3 uSun;
uniform float uTime;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float t = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(t, 0.42));
  // drifting cloud bands near the horizon
  vec2 cp = d.xz / (d.y + 0.28) * 1.6 + vec2(uTime * 0.01, 0.0);
  float cl = fbm(vec3(cp, 4.0));
  col = mix(col, uHorizon * 1.15, smoothstep(0.5, 0.85, cl) * (1.0 - t) * 0.5);
  // stars high up
  float s = step(0.9965, hash31(floor(d * 260.0)));
  col += vec3(s) * smoothstep(0.3, 0.85, t) * 0.9;
  // sun disc and glow
  float sd = max(dot(d, uSun), 0.0);
  col += uSunColor * (pow(sd, 900.0) * 6.0 + pow(sd, 18.0) * 0.45 + pow(sd, 4.0) * 0.1);
  if (d.y < 0.0) col = uHorizon;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Stormy sky: two drifting cloud layers from the model's cloud texture, lightning flashes and bolts. */
export const stormFragment = /* glsl */ `
uniform sampler2D uCloud;
uniform sampler2D uBolt;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uSun;
uniform float uTime;
uniform float uFlash;
uniform float uBoltOn;
uniform float uAz;
uniform vec2 uRange;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float t = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(t, 0.45));
  vec2 p = d.xz / (d.y + 0.22);
  float c1 = texture2D(uCloud, p * 0.42 + vec2(uTime * 0.004, 0.0)).r;
  float c2 = texture2D(uCloud, p * 0.95 + vec2(-uTime * 0.009, 0.31)).r;
  float cl = pow(clamp(mix(c1, c2, 0.45), 0.0, 1.0), 1.5);
  float fade = smoothstep(0.0, 0.3, d.y);
  col = mix(col, mix(uZenith * 0.5, uHorizon * 2.4 + 0.02, cl), 0.9 * fade);
  // atmosphere: a luminous haze lying on the horizon, and a cold sun glimmering through the cloud
  col += uHorizon * pow(1.0 - t, 5.0) * 0.8;
  float sd = max(dot(d, uSun), 0.0);
  col += vec3(0.5, 0.68, 1.0) * (pow(sd, 28.0) * 0.55 + pow(sd, 5.0) * 0.1) * (1.0 - 0.8 * cl) * fade;
  // lightning lights the cloud deck from inside
  col += vec3(0.55, 0.68, 1.0) * uFlash * (0.12 + 0.9 * cl) * (0.35 + 0.65 * fade) * 1.6;
  // one visible bolt
  if (uBoltOn > 0.5 && d.y > 0.0) {
    float az = atan(d.z, d.x);
    float da = atan(sin(az - uAz), cos(az - uAz));
    float h = 0.62;
    float w = (uRange.y - uRange.x) * 1024.0 / (0.74 * 512.0) * h;
    float u = 0.5 + da / w;
    float v = asin(clamp(d.y, 0.0, 1.0)) / h * 0.74;
    if (u > 0.0 && u < 1.0 && v < 0.74) {
      vec4 b = texture2D(uBolt, vec2(mix(uRange.x, uRange.y, u), v));
      col += vec3(0.75, 0.88, 1.5) * b.a * b.r * 3.0 * uFlash;
    }
  }
  if (d.y < 0.0) col = uHorizon;
  gl_FragColor = vec4(col, 1.0);
}
`;
