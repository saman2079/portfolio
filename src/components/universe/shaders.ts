/* GLSL used by the universe scene. Colours are written in linear space; the
   OutputPass at the end of the composer does tone mapping and sRGB encoding. */

export const NOISE_GLSL = /* glsl */ `
float hash31(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}
`;

/* ---------- planets ---------- */

export const planetVertex = /* glsl */ `
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vViewW;
void main() {
  vObj = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vViewW = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const planetFragment = /* glsl */ `
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uAtmos;
uniform vec3 uLight;
uniform float uSeed;
uniform float uBands;
uniform float uBandMix;
uniform float uCloud;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vViewW;
${NOISE_GLSL}
void main() {
  vec3 dir = normalize(vObj);
  vec3 p = dir * 1.6 + vec3(uSeed * 7.13, uSeed * 3.71, uSeed * 1.97);
  float h = fbm(p);
  float h2 = fbm(p * 3.1 + 11.0);
  float terrain = h * 0.72 + h2 * 0.28;
  float warp = fbm(p * 1.7 + 5.0);
  float band = sin(dir.y * uBands + warp * 4.0) * 0.5 + 0.5;
  float v = mix(terrain, band * 0.62 + h * 0.38, uBandMix);
  vec3 col = mix(uA, uB, smoothstep(0.30, 0.58, v));
  col = mix(col, uC, smoothstep(0.58, 0.78, v));
  float cl = smoothstep(0.50, 0.80, fbm(p * 2.2 + 40.0));
  col = mix(col, vec3(0.95), cl * uCloud);

  vec3 n = normalize(vNormalW);
  vec3 vd = normalize(vViewW);
  float ndl = dot(n, normalize(uLight));
  float diff = smoothstep(-0.12, 0.6, ndl);
  vec3 lit = col * (0.035 + diff * 1.15);
  float fres = pow(1.0 - max(dot(n, vd), 0.0), 3.0);
  lit += uAtmos * fres * (0.12 + 0.9 * clamp(ndl * 1.4 + 0.3, 0.0, 1.0));
  lit += uAtmos * 0.10 * smoothstep(0.35, 0.0, abs(ndl));
  gl_FragColor = vec4(lit, 1.0);
}
`;

export const atmosphereVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const atmosphereFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uLight;
uniform float uIntensity;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 n = normalize(vN);
  float d = max(dot(n, normalize(vV)), 0.0);
  float rim = smoothstep(0.0, 0.42, d) * (1.0 - smoothstep(0.42, 0.95, d));
  float sun = clamp(dot(n, normalize(uLight)) * 1.5 + 0.4, 0.0, 1.0);
  gl_FragColor = vec4(uColor * 1.8, rim * sun * 0.9 * uIntensity);
}
`;

export const ringVertex = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ringFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uInner;
uniform float uOuter;
uniform float uSeed;
varying vec3 vPos;
${NOISE_GLSL}
void main() {
  float r = length(vPos.xy);
  float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
  float n = vnoise(vec3(t * 46.0, uSeed, 0.5));
  float n2 = vnoise(vec3(t * 140.0, uSeed + 3.0, 1.5));
  float gap = smoothstep(0.42, 0.46, t) * (1.0 - smoothstep(0.50, 0.54, t));
  float a = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.94, 1.0, t));
  a *= (0.25 + 0.75 * n) * (0.6 + 0.4 * n2) * (1.0 - gap * 0.85);
  gl_FragColor = vec4(uColor * (0.5 + 0.9 * n), a * 0.85);
}
`;

/* ---------- sky ---------- */

export const bakeVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Rendered once into an equirectangular texture, then shown on a huge sphere. */
export const bakeFragment = /* glsl */ `
varying vec2 vUv;
${NOISE_GLSL}
void main() {
  float phi = vUv.x * 6.28318530718;
  float theta = 3.14159265359 * (1.0 - vUv.y);
  vec3 d = vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));
  float n1 = fbm(d * 1.9 + 3.0);
  float n2 = fbm(d * 4.3 - 7.0);
  float n3 = fbm(d * 2.6 + 21.0);
  vec3 col = vec3(0.002, 0.004, 0.012);
  col += vec3(0.010, 0.030, 0.090) * smoothstep(0.25, 0.8, n1);
  float cloud = smoothstep(0.42, 0.85, n1) * smoothstep(0.25, 0.75, n2);
  col += vec3(0.05, 0.13, 0.34) * cloud * 0.9;
  col += vec3(0.30, 0.12, 0.05) * smoothstep(0.55, 0.9, n3) * smoothstep(0.3, 0.7, n2) * 0.45;
  float b = d.y * 1.7 + 0.35 * sin(d.x * 2.3 + 1.0);
  float band = exp(-b * b * 5.0);
  col += vec3(0.10, 0.12, 0.20) * band * (0.35 + 0.9 * fbm(d * 7.0 + 4.0)) * 0.55;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const starVertex = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
uniform float uPx;
uniform float uTime;
varying vec3 vColor;
void main() {
  float tw = 0.82 + 0.18 * sin(uTime * (0.6 + aPhase * 1.4) + aPhase * 40.0);
  vColor = aColor * tw;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPx;
}
`;

export const starFragment = /* glsl */ `
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(vColor, a);
}
`;

/* ---------- cockpit ---------- */

export const panelVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vN;
void main() {
  vPos = position;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const panelFragment = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uLine;
uniform vec3 uHot;
uniform float uScale;
uniform float uTime;
varying vec3 vPos;
varying vec3 vN;
float h21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec2 q = vPos.xy * uScale;
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float cell = h21(id);
  float edge = smoothstep(0.44, 0.5, max(abs(f.x), abs(f.y)));
  float on = step(0.88, cell) * (0.55 + 0.45 * sin(uTime * 1.6 + cell * 50.0));
  vec3 col = uBase * (0.65 + 0.5 * cell);
  col += uLine * edge * 0.55;
  col += uHot * on * (1.0 - edge) * 1.4;
  float l = 0.55 + 0.45 * abs(normalize(vN).y);
  gl_FragColor = vec4(col * l, 1.0);
}
`;

export const holoVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vPos;
void main() {
  vPos = position;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const holoFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying vec3 vN;
varying vec3 vPos;
${NOISE_GLSL}
void main() {
  vec3 n = normalize(vN);
  float fres = pow(1.0 - abs(n.z), 2.2);
  vec3 p = normalize(vPos);
  float lat = abs(fract(p.y * 6.0) - 0.5);
  float lon = abs(fract(atan(p.z, p.x) / 6.2831853 * 12.0) - 0.5);
  float grid = smoothstep(0.455, 0.5, max(lat, lon));
  float cont = smoothstep(0.55, 0.62, fbm(p * 2.5 + vec3(uTime * 0.05, 0.0, 0.0)));
  float scan = 0.85 + 0.15 * sin(uTime * 3.0 + p.y * 40.0);
  float a = (fres * 0.9 + grid * 0.45 + cont * 0.35 + 0.06) * scan;
  gl_FragColor = vec4(uColor * (0.8 + cont), a);
}
`;
