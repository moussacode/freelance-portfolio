'use client';

import { gsap } from './gsap';

/**
 * Titre liquide : le titre de l'accueil est redessiné comme une surface visqueuse.
 * Le texte réel reste dans la page (lecteurs d'écran, sélection, sans JavaScript) ; on mesure
 * la position de chaque lettre, on en tire un champ de distance, et un shader y fond
 * une traînée de gouttes qui suit la souris : passer sur une lettre en arrache une perle d'encre,
 * qui retombe dans le trait quand on s'éloigne.
 * Les fins de titre se relaient en fondant un champ de distance dans le suivant.
 *
 * Uniquement avec une vraie souris et WebGL2. Sinon createLiquid() rend null et le titre reste du texte.
 */

const MAX_TRAIL = 10;
const TRAIL = 8;
const VISCOSITY = 0.55; // 0 = très fluide, 1 = épais et lent
const BLOB = 0.085; // rayon de la goutte, en fraction de la taille du titre : c'est le réglage de la « dose »
const INF = 1e20;

type Glyph = { ch: string; x: number; y: number };
type Field = { data: Float32Array; packed: Float32Array };
type Geo = {
  w: number; // taille de la toile en px CSS (titre + marge)
  h: number;
  fw: number; // taille du champ en texels
  fh: number;
  scale: number;
  fontSize: number;
  font: string;
  pad: number;
};

export type Liquid = {
  /** Fond la fin de titre courante dans la fin n° index. */
  morphTo: (index: number, duration: number) => void;
  destroy: () => void;
};

type Options = {
  title: HTMLElement;
  canvas: HTMLCanvasElement;
  lead: HTMLElement;
  ends: HTMLElement[];
  index: number;
  /** Appelé si le contexte graphique est perdu : la page doit réafficher le texte normal. */
  onLost: () => void;
};

/* ---------- Champ de distance signé (méthode TinySDF) ---------- */

function edt1d(
  grid: Float64Array,
  offset: number,
  stride: number,
  length: number,
  f: Float64Array,
  v: Uint32Array,
  z: Float64Array,
) {
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  f[0] = grid[offset];
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    f[q] = grid[offset + q * stride];
    const q2 = q * q;
    do {
      const r = v[k];
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k];
    const qr = q - r;
    grid[offset + q * stride] = f[r] + qr * qr;
  }
}

function boxBlur(src: Float32Array, dst: Float32Array, len: number, lines: number, r: number, step: number, stride: number) {
  const span = 2 * r + 1;
  for (let line = 0; line < lines; line++) {
    const base = line * stride;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[base + Math.min(len - 1, Math.max(0, k)) * step];
    for (let i = 0; i < len; i++) {
      dst[base + i * step] = acc / span;
      const out = Math.max(0, i - r);
      const inn = Math.min(len - 1, i + r + 1);
      acc += src[base + inn * step] - src[base + out * step];
    }
  }
}

function buildField(glyphs: Glyph[], geo: Geo): Field | null {
  const { fw: w, fh: h, scale } = geo;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.font = geo.font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  for (const g of glyphs) ctx.fillText(g.ch, g.x, g.y);
  const img = ctx.getImageData(0, 0, w, h).data;

  const n = w * h;
  const outer = new Float64Array(n);
  const inner = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = img[i * 4 + 3] / 255;
    if (a >= 1) {
      outer[i] = 0;
      inner[i] = INF;
    } else if (a <= 0) {
      outer[i] = INF;
      inner[i] = 0;
    } else {
      const d = 0.5 - a;
      outer[i] = d > 0 ? d * d : 0;
      inner[i] = d < 0 ? d * d : 0;
    }
  }
  const len = Math.max(w, h);
  const f = new Float64Array(len);
  const v = new Uint32Array(len);
  const z = new Float64Array(len + 1);
  for (const grid of [outer, inner]) {
    for (let x = 0; x < w; x++) edt1d(grid, x, w, h, f, v, z);
    for (let y = 0; y < h; y++) edt1d(grid, y * w, 1, w, f, v, z);
  }
  // Loin de tout texte, la distance est plafonnée : les calculs restent propres dans le shader.
  const far = geo.fontSize * 4;
  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) data[i] = Math.min(far, (Math.sqrt(outer[i]) - Math.sqrt(inner[i])) / scale);
  // Une copie adoucie arrondit les arêtes : la surface s'éclaire comme une goutte, pas comme un biseau.
  const soft = Float32Array.from(data);
  const tmp = new Float32Array(n);
  const radius = Math.max(1, Math.round(geo.fontSize * 0.035 * scale));
  for (let pass = 0; pass < 3; pass++) {
    boxBlur(soft, tmp, w, h, radius, 1, w);
    boxBlur(tmp, soft, h, w, radius, w, 1);
  }
  const packed = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    packed[i * 2] = data[i];
    packed[i * 2 + 1] = soft[i];
  }
  return { data, packed };
}

/* ---------- Mesure du texte réel ---------- */

/** Position de chaque lettre d'un élément, dans le repère de la toile. */
function readGlyphs(el: HTMLElement, originX: number, originY: number, ascent: number): Glyph[] {
  const glyphs: Glyph[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!ch.trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      glyphs.push({ ch, x: r.left - originX, y: r.top - originY + ascent });
    }
  }
  return glyphs;
}

/* ---------- Couleurs ---------- */

export function parseColor(input: string, fallback: [number, number, number]): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx || !input) return fallback;
  ctx.fillStyle = '#000';
  ctx.fillStyle = input.trim();
  const v = String(ctx.fillStyle);
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1, 7), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const m = v.match(/[\d.]+/g);
  if (!m || m.length < 3) return fallback;
  return [+m[0] / 255, +m[1] / 255, +m[2] / 255];
}

/* ---------- Shaders ---------- */

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uLead;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMix;
uniform float uBulge;
uniform vec2 uSize;
uniform float uDpr;
uniform float uCanvasH;
uniform vec4 uBlob[${MAX_TRAIL}];
uniform vec2 uWarp[${MAX_TRAIL}];
uniform int uCount;
uniform float uSigma;
uniform float uBevel;
uniform vec3 uInk;
uniform vec3 uInk2;
uniform vec3 uHi;
uniform float uSpec;
uniform float uShade;
out vec4 outColor;

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// Distance au titre : le début fixe, et la fin en cours de fondu vers la suivante.
// lean > 0 : la fin (teal) est la plus proche ; lean < 0 : c'est le début (encre).
float glyph(vec2 p, float soft, out float lean) {
  vec2 uv = p / uSize;
  vec2 l = texture(uLead, uv).rg;
  vec2 e = mix(texture(uA, uv).rg, texture(uB, uv).rg, uMix) - uBulge;
  lean = l.r - e.r;
  vec2 t = min(l, e);
  return mix(t.r, t.g, soft);
}

float field(vec2 p, float soft, out float lean) {
  vec2 warp = vec2(0.0);
  float wsum = 0.0;
  for (int i = 0; i < ${MAX_TRAIL}; i++) {
    if (i >= uCount) break;
    vec2 d = p - uBlob[i].xy;
    float g = exp(-dot(d, d) / (uSigma * uSigma));
    warp += uWarp[i] * g;
    wsum += g;
  }
  warp /= max(1.0, wsum);
  float f = glyph(p - warp, soft, lean);
  for (int i = 0; i < ${MAX_TRAIL}; i++) {
    if (i >= uCount) break;
    float r = uBlob[i].z;
    if (r < 0.05) continue;
    float b = length(p - uBlob[i].xy) - r;
    f = smin(f, b, r * 1.45);
  }
  return f;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uCanvasH - gl_FragCoord.y) / uDpr;
  float lean;
  float f = field(p, 0.0, lean);
  float fw = max(fwidth(f), 1e-4);
  float alpha = clamp(0.5 - f / fw, 0.0, 1.0);
  if (alpha <= 0.0) { outColor = vec4(0.0); return; }

  float e = 1.0;
  float tmp;
  vec2 grad = vec2(
    field(p + vec2(e, 0.0), 1.0, tmp) - field(p - vec2(e, 0.0), 1.0, tmp),
    field(p + vec2(0.0, e), 1.0, tmp) - field(p - vec2(0.0, e), 1.0, tmp)
  ) / (2.0 * e);
  float fs = field(p, 1.0, tmp);
  float gl = length(grad);
  vec2 n2 = gl > 1e-4 ? grad / gl : vec2(0.0);

  // Section ronde : raide au bord, plate au milieu des traits épais.
  float s = 1.0 - clamp(-min(fs, f + 0.5) / uBevel, 0.0, 1.0);
  s = pow(s, 1.6);
  vec3 N = normalize(vec3(n2 * s, sqrt(max(0.0, 1.0 - s * s))));
  vec3 L = normalize(vec3(-0.45, -0.7, 0.62));
  float diff = clamp(dot(N, L), 0.0, 1.0);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(N, H), 0.0), 48.0);

  // Le relief et le reflet n'existent qu'autour de la goutte : au repos, le titre est un texte à plat.
  float wet = 0.0;
  for (int i = 0; i < ${MAX_TRAIL}; i++) {
    if (i >= uCount) break;
    float r = uBlob[i].z;
    vec2 d = p - uBlob[i].xy;
    wet = max(wet, exp(-dot(d, d) / (uSigma * uSigma)) * smoothstep(0.0, uSigma * 0.25, r));
  }

  vec3 base = mix(uInk, uInk2, smoothstep(-1.5, 1.5, lean));
  vec3 col = base * mix(1.0, mix(1.0 - uShade, 1.0, diff), wet);
  col += uHi * spec * uSpec * wet;
  outColor = vec4(col * alpha, alpha);
}`;

const UNIFORMS = [
  'uLead',
  'uA',
  'uB',
  'uMix',
  'uBulge',
  'uSize',
  'uDpr',
  'uCanvasH',
  'uBlob',
  'uWarp',
  'uCount',
  'uSigma',
  'uBevel',
  'uInk',
  'uInk2',
  'uHi',
  'uSpec',
  'uShade',
] as const;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (!gl.isContextLost()) console.warn('Titre liquide, shader :', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/* ---------- Création ---------- */

export function createLiquid({ title, canvas, lead, ends, index, onLost }: Options): Liquid | null {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return null;
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  const buf = gl.createBuffer();
  if (!vs || !fs || !prog || !buf) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'aPos');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = {} as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  for (const name of UNIFORMS) u[name] = gl.getUniformLocation(prog, name);

  // Une texture pour le début du titre, puis une par fin.
  const makeTexture = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };
  const leadTex = makeTexture();
  const endTex = ends.map(makeTexture);

  let dead = false;
  let geo: Geo | null = null;
  let dpr = 1;
  let combined: Float32Array[] = []; // distance au titre complet, par fin, pour la simulation
  let current = index;
  let next = index;
  let simIndex = index;
  let dirty = false;
  const morph = { mix: 0, active: false };
  let morphTween: gsap.core.Tween | null = null;

  const look = {
    ink: [0.04, 0.12, 0.16] as [number, number, number],
    ink2: [0, 0.41, 0.54] as [number, number, number],
    spec: 0.75,
    shade: 0,
  };
  const refreshLook = () => {
    const cs = getComputedStyle(document.documentElement);
    look.ink = parseColor(cs.getPropertyValue('--ink'), [0.04, 0.12, 0.16]);
    look.ink2 = parseColor(cs.getPropertyValue('--brand'), [0, 0.41, 0.54]);
    // Encre claire = thème sombre : un peu d'ombre donne du volume, le reflet est plus discret.
    const dark = look.ink[0] * 0.3 + look.ink[1] * 0.6 + look.ink[2] * 0.1 > 0.5;
    look.spec = dark ? 0.35 : 0.5;
    look.shade = dark ? 0.25 : 0;
    dirty = true;
  };

  /* ----- Simulation : une traînée de points reliés par des ressorts ----- */
  const sim = {
    x: new Float32Array(MAX_TRAIL),
    y: new Float32Array(MAX_TRAIL),
    vx: new Float32Array(MAX_TRAIL),
    vy: new Float32Array(MAX_TRAIL),
    mass: 0,
    massV: 0,
    load: 0.5,
    mode: 'idle' as 'idle' | 'pointer' | 'release',
    tx: 0,
    ty: 0,
    homeX: 0,
    homeY: 0,
    releaseT: 0,
    anchorX: 0,
    anchorY: 0,
    tether: 0,
  };
  const blobBuf = new Float32Array(MAX_TRAIL * 4);
  const warpBuf = new Float32Array(MAX_TRAIL * 2);

  const sample = (x: number, y: number): number => {
    const data = combined[simIndex];
    if (!geo || !data) return INF;
    const fx = Math.min(geo.fw - 1, Math.max(0, Math.round(x * geo.scale)));
    const fy = Math.min(geo.fh - 1, Math.max(0, Math.round(y * geo.scale)));
    return data[fy * geo.fw + fx];
  };
  // Ramène un point sur la lettre la plus proche (légèrement à l'intérieur), en suivant la pente du champ.
  const nearestInside = (x: number, y: number, inset: number): [number, number] => {
    let px = x;
    let py = y;
    for (let i = 0; i < 10; i++) {
      const d = sample(px, py) + inset;
      if (Math.abs(d) < 0.5) break;
      const e = 1.5;
      const gx = (sample(px + e, py) - sample(px - e, py)) / (2 * e);
      const gy = (sample(px, py + e) - sample(px, py - e)) / (2 * e);
      const len = Math.hypot(gx, gy) || 1;
      px -= (gx / len) * d;
      py -= (gy / len) * d;
    }
    return [px, py];
  };
  const park = (x: number, y: number) => {
    for (let i = 0; i < MAX_TRAIL; i++) {
      sim.x[i] = x;
      sim.y[i] = y;
      sim.vx[i] = 0;
      sim.vy[i] = 0;
    }
  };

  const step = (dt: number) => {
    if (!geo) return;
    const n = TRAIL;
    const fontSize = geo.fontSize;
    let massTarget = 0;
    let gx = sim.homeX;
    let gy = sim.homeY;
    if (sim.mode === 'pointer') {
      massTarget = 1;
      gx = sim.tx;
      gy = sim.ty;
    } else if (sim.mode === 'release') {
      sim.releaseT += dt;
      if (sim.releaseT > 2.2) sim.mode = 'idle';
    }

    const k = 330 - 270 * VISCOSITY;
    const c = 2 * 0.62 * Math.sqrt(k);
    const kf = k * 1.25;
    const cf = 2 * 0.48 * Math.sqrt(kf);
    const km = 70;
    const cm = 2 * 0.3 * Math.sqrt(km);

    // Tension de surface : une goutte qui quitte un trait y reste reliée par la queue de la traînée.
    // Si le fil s'étire trop, il casse et laisse une perle libre.
    if (sim.mode === 'pointer') {
      if (sample(sim.x[0], sim.y[0]) < 0) {
        sim.tether = Math.min(1, sim.tether + dt * 8);
        [sim.anchorX, sim.anchorY] = nearestInside(sim.x[0], sim.y[0], fontSize * 0.04);
      } else if (sim.tether > 0) {
        const stretch = Math.hypot(sim.x[0] - sim.anchorX, sim.y[0] - sim.anchorY);
        if (stretch > fontSize * (0.42 + 0.4 * VISCOSITY)) sim.tether = 0;
      }
    } else {
      sim.tether = Math.max(0, sim.tether - dt * 3);
    }

    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      for (let i = 0; i < n; i++) {
        const tx = i === 0 ? gx : sim.x[i - 1];
        const ty = i === 0 ? gy : sim.y[i - 1];
        const kk = i === 0 ? k : kf;
        const cc = i === 0 ? c : cf;
        let fx = (tx - sim.x[i]) * kk;
        let fy = (ty - sim.y[i]) * kk;
        if (i > 0 && sim.tether > 0) {
          // Les points de queue penchent vers l'ancrage : la traînée s'étire en un fil.
          const w = sim.tether * Math.pow(i / (n - 1), 1.3) * 1.6;
          fx += (sim.anchorX - sim.x[i]) * kk * w;
          fy += (sim.anchorY - sim.y[i]) * kk * w;
        }
        sim.vx[i] += (fx - sim.vx[i] * cc) * h;
        sim.vy[i] += (fy - sim.vy[i] * cc) * h;
        sim.x[i] += sim.vx[i] * h;
        sim.y[i] += sim.vy[i] * h;
      }
      sim.massV += ((massTarget - sim.mass) * km - sim.massV * cm) * h;
      sim.mass += sim.massV * h;
    }
    for (let i = n; i < MAX_TRAIL; i++) {
      sim.x[i] = sim.x[n - 1];
      sim.y[i] = sim.y[n - 1];
      sim.vx[i] = 0;
      sim.vy[i] = 0;
    }
    // Traverser une lettre charge la goutte d'encre ; à l'air libre, elle s'amincit lentement.
    const inside = sample(sim.x[0], sim.y[0]) < fontSize * 0.02;
    sim.load = inside ? Math.min(1, sim.load + dt * 5) : Math.max(0.4, sim.load - dt * 0.35);
  };

  /* ----- Dessin ----- */
  const draw = () => {
    if (!geo || gl.isContextLost()) return;
    const R = geo.fontSize * BLOB;
    const n = TRAIL;
    const maxWarp = geo.fontSize * 0.03;
    const warpTime = 0.028 - VISCOSITY * 0.01;
    const mass = Math.max(0, sim.mass);
    for (let i = 0; i < MAX_TRAIL; i++) {
      const taper = i === 0 ? 1 : 0.62 - 0.34 * (1 - 0.6 * sim.tether) * ((i - 1) / Math.max(1, n - 2));
      blobBuf[i * 4] = sim.x[i];
      blobBuf[i * 4 + 1] = sim.y[i];
      blobBuf[i * 4 + 2] = i < n ? R * mass * (0.45 + 0.55 * sim.load) * taper : 0;
      blobBuf[i * 4 + 3] = 0;
      let wx = sim.vx[i] * warpTime * Math.min(1, mass * 1.4);
      let wy = sim.vy[i] * warpTime * Math.min(1, mass * 1.4);
      const wl = Math.hypot(wx, wy);
      if (wl > maxWarp) {
        wx *= maxWarp / wl;
        wy *= maxWarp / wl;
      }
      warpBuf[i * 2] = wx;
      warpBuf[i * 2 + 1] = wy;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, leadTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, endTex[current] ?? null);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, endTex[next] ?? null);
    gl.uniform1i(u.uLead, 0);
    gl.uniform1i(u.uA, 1);
    gl.uniform1i(u.uB, 2);
    gl.uniform1f(u.uMix, morph.mix);
    // Au milieu du fondu, la matière gonfle un peu : les deux textes se rejoignent au lieu de s'effacer.
    gl.uniform1f(u.uBulge, Math.sin(Math.PI * morph.mix) * geo.fontSize * 0.02);
    gl.uniform2f(u.uSize, geo.w, geo.h);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform1f(u.uCanvasH, canvas.height);
    gl.uniform4fv(u.uBlob, blobBuf);
    gl.uniform2fv(u.uWarp, warpBuf);
    gl.uniform1i(u.uCount, n);
    gl.uniform1f(u.uSigma, R * 1.8);
    gl.uniform1f(u.uBevel, Math.max(2, geo.fontSize * 0.085));
    gl.uniform3f(u.uInk, look.ink[0], look.ink[1], look.ink[2]);
    gl.uniform3f(u.uInk2, look.ink2[0], look.ink2[1], look.ink2[2]);
    gl.uniform3f(u.uHi, 1, 1, 1);
    gl.uniform1f(u.uSpec, look.spec);
    gl.uniform1f(u.uShade, look.shade);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* ----- Mise en place : mesure du texte, champs, textures ----- */
  const rebuild = (): boolean => {
    const cs = getComputedStyle(title);
    const fontSize = parseFloat(cs.fontSize) || 48;
    const rect = title.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;
    const pad = Math.round(fontSize * 0.4);
    const w = Math.ceil(rect.width) + pad * 2;
    const h = Math.ceil(rect.height) + pad * 2;
    const scale = Math.min(1, 1500 / w);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
    const g: Geo = { w, h, fw: Math.round(w * scale), fh: Math.round(h * scale), scale, fontSize, font, pad };

    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return false;
    probe.font = font;
    const ascent = probe.measureText('H').fontBoundingBoxAscent || fontSize * 0.93;
    const ox = rect.left - pad;
    const oy = rect.top - pad;

    const leadField = buildField(readGlyphs(lead, ox, oy, ascent), g);
    if (!leadField) return false;
    const endFields: Field[] = [];
    for (const el of ends) {
      const field = buildField(readGlyphs(el, ox, oy, ascent), g);
      if (!field) return false;
      endFields.push(field);
    }

    geo = g;
    combined = endFields.map((field) => {
      const out = new Float32Array(field.data.length);
      for (let i = 0; i < out.length; i++) out[i] = Math.min(leadField.data[i], field.data[i]);
      return out;
    });

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.left = `${-pad}px`;
    canvas.style.top = `${-pad}px`;

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const upload = (tex: WebGLTexture | null, field: Field) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, g.fw, g.fh, 0, gl.RG, gl.FLOAT, field.packed);
    };
    upload(leadTex, leadField);
    endFields.forEach((field, i) => upload(endTex[i], field));

    // La traînée attend sur le texte : la première goutte ne traverse jamais l'écran.
    [sim.homeX, sim.homeY] = nearestInside(w / 2, h / 2, fontSize * 0.03);
    if (sim.mode !== 'pointer') park(sim.homeX, sim.homeY);
    dirty = true;
    return true;
  };

  /* ----- Souris ----- */
  const release = () => {
    if (sim.mode !== 'pointer' || !geo) return;
    [sim.homeX, sim.homeY] = nearestInside(sim.x[0], sim.y[0], geo.fontSize * 0.03);
    sim.mode = 'release';
    sim.releaseT = 0;
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !geo) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    // La zone active est le titre et un petit liseré autour ; la goutte, elle, peut aller jusqu'au bord de la toile.
    const edge = geo.pad * 0.5;
    if (x < edge || y < edge || x > geo.w - edge || y > geo.h - edge) {
      release();
      return;
    }
    const m = geo.fontSize * 0.1;
    sim.tx = Math.min(geo.w - m, Math.max(m, x));
    sim.ty = Math.min(geo.h - m, Math.max(m, y));
    if (sim.mode !== 'pointer') {
      if (sim.mass < 0.05) park(sim.tx, sim.ty);
      sim.mode = 'pointer';
    }
  };
  const onLeave = () => release();

  /* ----- Boucle : on ne calcule et on ne dessine que s'il se passe quelque chose ----- */
  const frame = () => {
    if (dead || !geo) return;
    const busy = sim.mode !== 'idle' || sim.mass > 0.004 || Math.abs(sim.massV) > 0.02;
    if (busy) {
      step(Math.min(gsap.ticker.deltaRatio() / 60, 1 / 30));
      dirty = true;
    }
    if (dirty || morph.active) {
      dirty = false;
      draw();
    }
  };

  let resizeTimer = 0;
  const observer = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => !dead && rebuild(), 220);
  });
  const themeObserver = new MutationObserver(refreshLook);
  const scheme = matchMedia('(prefers-color-scheme: dark)');

  const destroy = () => {
    if (dead) return;
    dead = true;
    morphTween?.kill();
    window.clearTimeout(resizeTimer);
    observer.disconnect();
    themeObserver.disconnect();
    scheme.removeEventListener('change', refreshLook);
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('mouseleave', onLeave);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    gsap.ticker.remove(frame);
    if (!gl.isContextLost()) {
      gl.deleteTexture(leadTex);
      endTex.forEach((tex) => gl.deleteTexture(tex));
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    }
  };
  function onContextLost(e: Event) {
    e.preventDefault();
    destroy();
    onLost();
  }

  refreshLook();
  if (!rebuild()) {
    destroy();
    return null;
  }
  draw();

  observer.observe(title);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  scheme.addEventListener('change', refreshLook);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  canvas.addEventListener('webglcontextlost', onContextLost);
  gsap.ticker.add(frame);

  return {
    morphTo(target, duration) {
      if (dead || target === current || !endTex[target]) return;
      morphTween?.kill();
      next = target;
      morph.mix = 0;
      morph.active = true;
      morphTween = gsap.to(morph, {
        mix: 1,
        duration,
        ease: 'sine.inOut',
        onUpdate: () => {
          if (morph.mix > 0.5) simIndex = target;
        },
        onComplete: () => {
          current = target;
          simIndex = target;
          morph.mix = 0;
          morph.active = false;
          dirty = true;
        },
      });
    },
    destroy,
  };
}
