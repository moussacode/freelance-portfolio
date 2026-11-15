'use client';

import { useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { gsap, motionOK } from '@/lib/gsap';
import { parseColor } from '@/lib/liquidTitle';

const INTERACTIVE = 'a, button, summary, label, [role="button"]';
const FIELD = 'input, textarea, select';
const TEXT = 'p, h1, h2, h3, h4, li, blockquote, figcaption, dt, dd';

const N = 7; // points de la traînée
const SIZE = 300; // côté de la petite toile qui suit la souris, en px
const R_IDLE = 9; // rayon de la goutte au repos
const R_LINK = 22; // rayon sur ce qui se clique
const R_TEXT = 15; // rayon sur du texte : une goutte de verre

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

// La même matière que le titre liquide : des gouttes fondues entre elles, avec un reflet.
const FRAG = `#version 300 es
precision highp float;
uniform vec3 uPts[${N}];
uniform float uDpr;
uniform float uH;
uniform vec3 uCol;
uniform float uAlpha;
uniform float uBevel;
uniform float uSpec;
uniform float uRim;
uniform vec2 uRipple; // rayon de l'onde, opacité
out vec4 outColor;

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
float field(vec2 p) {
  float f = 1e5;
  for (int i = 0; i < ${N}; i++) {
    float r = uPts[i].z;
    if (r < 0.05) continue;
    float b = length(p - uPts[i].xy) - r;
    f = f > 1e4 ? b : smin(f, b, r * 1.45);
  }
  return f;
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uH - gl_FragCoord.y) / uDpr;
  float f = field(p);
  float fw = max(fwidth(f), 1e-4);
  float a = clamp(0.5 - f / fw, 0.0, 1.0);
  // L'onde : un cercle fin qui part de la goutte quand on arrive sur un élément cliquable, ou qu'on clique.
  float ring = smoothstep(1.6, 0.0, abs(length(p - uPts[0].xy) - uRipple.x)) * uRipple.y;
  if (a <= 0.0) { outColor = vec4(uCol * ring, ring); return; }

  vec2 grad = vec2(
    field(p + vec2(1.0, 0.0)) - field(p - vec2(1.0, 0.0)),
    field(p + vec2(0.0, 1.0)) - field(p - vec2(0.0, 1.0))
  ) * 0.5;
  float gl = length(grad);
  vec2 n2 = gl > 1e-4 ? grad / gl : vec2(0.0);
  float s = 1.0 - clamp(-f / uBevel, 0.0, 1.0);
  s = pow(s, 1.6);
  vec3 N = normalize(vec3(n2 * s, sqrt(max(0.0, 1.0 - s * s))));
  vec3 L = normalize(vec3(-0.45, -0.7, 0.62));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(N, H), 0.0), 48.0) * uSpec * a;

  // Sur un bouton ou du texte, la goutte devient une lentille : centre translucide, bord plus dense.
  float alpha = max(a * mix(uAlpha, 1.0, pow(s, 3.0) * uRim), ring);
  outColor = vec4(uCol * alpha + vec3(spec), max(alpha, spec));
}`;

/**
 * Curseur personnalisé : une goutte liquide, la même matière que le titre de l'accueil.
 * Elle suit la souris avec un peu d'inertie et laisse une traînée qui se referme, comme en apesanteur.
 * Sur ce qui se clique, elle lance une onde, s'élargit en lentille teal et bat doucement : on sent que ça se clique.
 * Sur du texte, elle devient une goutte de verre, presque transparente, pour laisser lire.
 * Dans un champ, le curseur de texte revient ;
 * sur le titre liquide, elle s'efface et la goutte du titre prend le relais.
 * Seulement avec une vraie souris, WebGL2 et les animations autorisées : sinon le curseur du système reste.
 */
export function Cursor() {
  const { calm } = useApp();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || calm || !motionOK()) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    const buf = gl.createBuffer();
    if (!vs || !fs || !prog || !buf) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'aPos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const loc = (name: string) => gl.getUniformLocation(prog, name);
    const u = {
      pts: loc('uPts'),
      dpr: loc('uDpr'),
      h: loc('uH'),
      col: loc('uCol'),
      alpha: loc('uAlpha'),
      bevel: loc('uBevel'),
      spec: loc('uSpec'),
      rim: loc('uRim'),
      ripple: loc('uRipple'),
    };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(SIZE * dpr);

    const root = document.documentElement;
    let ink: [number, number, number] = [0.04, 0.12, 0.16];
    let brand: [number, number, number] = [0, 0.41, 0.54];
    const readColors = () => {
      const cs = getComputedStyle(root);
      ink = parseColor(cs.getPropertyValue('--ink'), ink);
      brand = parseColor(cs.getPropertyValue('--brand'), brand);
      awake = true;
    };

    // Traînée : la tête suit la souris, chaque point suit le précédent, tous sur ressorts.
    const x = new Float32Array(N);
    const y = new Float32Array(N);
    const vx = new Float32Array(N);
    const vy = new Float32Array(N);
    const pts = new Float32Array(N * 3);
    let seen = false;
    let lost = false;
    let awake = true;
    let tx = 0;
    let ty = 0;
    let lastScroll = window.scrollY;
    let state: 'idle' | 'link' | 'text' | 'hidden' = 'idle';
    let clock = 0;
    let rippleR = 0;
    let rippleA = 0;
    const ripple = (strength: number) => {
      rippleR = radius;
      rippleA = strength;
      awake = true;
    };
    let present = false;
    let down = false;
    // Valeurs affichées, qui glissent vers leur cible.
    let mass = 0;
    let radius = R_IDLE;
    let alpha = 1;
    let teal = 0;
    let rim = 0.8;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || lost) return;
      tx = e.clientX;
      ty = e.clientY;
      if (!seen) {
        // Le curseur du système n'est masqué qu'une fois la goutte réellement en place.
        seen = true;
        x.fill(tx);
        y.fill(ty);
        root.classList.add('has-cursor');
      }
      present = true;
      awake = true;
      const target = e.target instanceof Element ? e.target : null;
      const before = state;
      state =
        target?.closest(FIELD) || target?.closest('.is-liquid')
          ? 'hidden'
          : target?.closest(INTERACTIVE)
            ? 'link'
            : target?.closest(TEXT)
              ? 'text'
              : 'idle';
      if (state === 'link' && before !== 'link') ripple(0.55);
    };
    const onDown = () => {
      down = true;
      if (state !== 'hidden') ripple(0.7);
      awake = true;
    };
    const onUp = () => {
      down = false;
      awake = true;
    };
    const onLeave = () => {
      present = false;
      awake = true;
    };

    const K = 420; // tête : assez raide pour viser juste, assez souple pour flotter
    const C = 2 * 0.8 * Math.sqrt(K);
    const KF = 230; // queue
    const CF = 2 * 0.5 * Math.sqrt(KF);

    const tick = () => {
      if (!seen || lost) return;
      const scroll = window.scrollY;
      const ds = scroll - lastScroll;
      lastScroll = scroll;
      if (ds !== 0) {
        // Au défilement, la queue est emportée avec la page : la goutte s'étire.
        for (let i = 1; i < N; i++) y[i] -= Math.max(-40, Math.min(40, ds)) * 0.5 * (i / (N - 1));
        awake = true;
      }
      if (!awake) return;

      const dt = Math.min(gsap.ticker.deltaRatio() / 60, 1 / 30);
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      let energy = 0;
      for (let s = 0; s < steps; s++) {
        for (let i = 0; i < N; i++) {
          const gx = i === 0 ? tx : x[i - 1];
          const gy = i === 0 ? ty : y[i - 1];
          const k = i === 0 ? K : KF;
          const c = i === 0 ? C : CF;
          vx[i] += ((gx - x[i]) * k - vx[i] * c) * h;
          vy[i] += ((gy - y[i]) * k - vy[i] * c) * h;
          x[i] += vx[i] * h;
          y[i] += vy[i] * h;
        }
      }
      for (let i = 0; i < N; i++) energy += Math.abs(vx[i]) + Math.abs(vy[i]);
      energy += Math.hypot(tx - x[N - 1], ty - y[N - 1]);

      const ease = 1 - Math.pow(0.82, gsap.ticker.deltaRatio());
      clock += dt;
      const link = state === 'link';
      const massT = present && state !== 'hidden' ? 1 : 0;
      // Sur un élément cliquable, la lentille bat doucement (environ un battement par seconde).
      const beat = link && !down ? 1 + 0.07 * Math.sin(clock * 6) : 1;
      const radiusT = (link ? R_LINK : state === 'text' ? R_TEXT : R_IDLE) * (down ? 0.78 : 1) * beat;
      const alphaT = link ? 0.22 : state === 'text' ? 0.08 : 1;
      const tealT = link ? 1 : 0;
      const rimT = state === 'text' ? 0.5 : 0.8;
      mass += (massT - mass) * ease;
      radius += (radiusT - radius) * ease;
      alpha += (alphaT - alpha) * ease;
      teal += (tealT - teal) * ease;
      rim += (rimT - rim) * ease;
      if (rippleA > 0) {
        rippleR += dt * 95;
        rippleA = Math.max(0, rippleA - dt * 1.3);
      }
      const settling =
        Math.abs(massT - mass) +
        Math.abs(radiusT - radius) / R_LINK +
        Math.abs(alphaT - alpha) +
        Math.abs(tealT - teal) +
        rippleA +
        (link && massT ? 1 : 0); // tant que la lentille bat, on continue de dessiner

      // La toile est centrée sur la tête ; les points sont exprimés dans son repère.
      const half = SIZE / 2;
      for (let i = 0; i < N; i++) {
        const lx = x[i] - x[0] + half;
        const ly = y[i] - y[0] + half;
        const taper = i === 0 ? 1 : 0.66 - 0.4 * ((i - 1) / (N - 2));
        // Près du bord de la toile, la goutte s'amenuise au lieu d'être coupée net.
        const edge = Math.max(0, Math.min(1, (half - Math.hypot(lx - half, ly - half) - radius) / 30));
        pts[i * 3] = lx;
        pts[i * 3 + 1] = ly;
        pts[i * 3 + 2] = radius * taper * mass * edge;
      }
      canvas.style.transform = `translate3d(${x[0] - half}px, ${y[0] - half}px, 0)`;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform3fv(u.pts, pts);
      gl.uniform1f(u.dpr, dpr);
      gl.uniform1f(u.h, canvas.height);
      gl.uniform3f(
        u.col,
        ink[0] + (brand[0] - ink[0]) * teal,
        ink[1] + (brand[1] - ink[1]) * teal,
        ink[2] + (brand[2] - ink[2]) * teal,
      );
      gl.uniform1f(u.alpha, alpha);
      gl.uniform1f(u.bevel, Math.max(3, radius * 0.9));
      gl.uniform1f(u.spec, 0.6);
      gl.uniform1f(u.rim, rim);
      gl.uniform2f(u.ripple, rippleR, rippleA * mass);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Plus rien ne bouge : on arrête de calculer jusqu'au prochain geste.
      if (energy < 0.5 && settling < 0.004) awake = false;
    };

    const stop = () => {
      lost = true;
      root.classList.remove('has-cursor');
    };
    const onContextLost = (e: Event) => {
      e.preventDefault();
      stop(); // on rend la main au curseur du système
    };

    const themeObserver = new MutationObserver(readColors);
    const scheme = matchMedia('(prefers-color-scheme: dark)');
    readColors();
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    scheme.addEventListener('change', readColors);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    root.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('webglcontextlost', onContextLost);
    gsap.ticker.add(tick);
    return () => {
      stop();
      themeObserver.disconnect();
      scheme.removeEventListener('change', readColors);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      root.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      gsap.ticker.remove(tick);
      if (!gl.isContextLost()) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, [calm]);

  if (calm) return null;
  return <canvas className="cursor" ref={ref} aria-hidden="true" />;
}
