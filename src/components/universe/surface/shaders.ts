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
  float diff = max(dot(n, uSun), 0.0);
  vec3 amb = mix(uA, uHorizon, 0.55) * 0.5;
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
