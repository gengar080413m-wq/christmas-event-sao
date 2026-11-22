'use strict';

/* =====================================================================
   ⚙️  CONFIGURACIÓN FÁCIL  (edita aquí)
   ===================================================================== */

/* --- Texto de la carta ---
   · Cambia `to`, `message` y `from`.
   · Si ya abriste la página antes, sube `version` (1 → 2) para que el
     navegador ignore el texto viejo que tenía guardado.
   · editable:false → la carta es solo lectura (sin campos de escritura). */
const LETTER_CONFIG = {
  version: 3,
  editable: true,
  to: '',
  from: '',
    message:
`¡Feliz Navidad, mamá! ❤️

Antes que nada, quiero agradecerte por hacer que cada Navidad sea especial para nosotros.

Aunque vayamos creciendo, siempre encuentras la manera de consentirnos, sorprendernos y hacer que estas fechas sigan teniendo esa magia de cuando éramos pequeños.

Sé que detrás de cada regalo y cada detalle hay mucho esfuerzo, tiempo y cariño. Quiero que sepas que valoro muchísimo todo lo que haces por nosotros, incluso esas cosas que a veces pasan desapercibidas.

Gracias por trabajar tanto, por preocuparte por nosotros y por buscar siempre la manera de vernos felices. Sé que no todo es fácil y que haces muchos esfuerzos para darnos lo mejor. Nunca quiero que pienses que no los vemos o que no los agradecemos.

Y bueno... como nos preguntaste qué queríamos de Navidad, yo estuve pensando y hay algo que me gustaría mucho:

🎁 XP-Pen Deco 640

Mi regalo que me gustaría recibir:
https://articulo.mercadolibre.com.mx/MLM-3141375431-xppen-deco-640-tableta-grafica-6x4-pulgadas-con-16k-niveles-_JM

Es algo que me haría mucha ilusión y que aprovecharía bastante.

Pero quiero que sepas que, más allá de cualquier regalo, estoy muy agradecido por tenerte y por todo lo que haces por nosotros.

Espero que esta Navidad también sea especial para ti, porque tú mereces tanta felicidad como la que siempre buscas darnos.

Te quiero mucho, mamá.

¡Feliz Navidad! ❤️`,
};

/* --- Música de fondo (instrumental) ---
   Coloca tu archivo en  audio/musica-sao.mp3  (o cambia `src`). */
const MUSIC_CONFIG = {
  src: 'audio/musica-sao.mp4',
  volume: 0.6,
  loop: true,
  label: 'AINCRAD · BGM',
};

/* --- Interfaz estilo Aincrad (HUD de las esquinas) ---
   · floor: piso marcado en la escala lateral (1-100).
   · Cambia los textos libremente. */
const HUD_CONFIG = {
  name: 'AINCRAD',
  zone: 'FLOOR 22 · FOREST OF SNOW',
  floor: 22,
  temp: '-12°C',
};

/* =====================================================================
   Christmas Event · Sword Art Online style
   Secciones:
     1. Utilidades
     2. Fondo (estrellas + parallax)
     3. FX  → nieve en planos, partículas, estrellas, niebla, luz dinámica y gema (canvas)
     4. Música
     5. Carta (campos editables + autoguardado)
     6. Flujo de la experiencia (gema → notificación → carta)
   ===================================================================== */

(() => {

  /* ------------------------------------------------------------------
     1. UTILIDADES
     ------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);

  // Si el sistema pide "reducir movimiento", todo se acorta
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((res) => setTimeout(res, RM ? ms * 0.6 : ms));


  /* ------------------------------------------------------------------
     2. FONDO: estrellas estáticas + parallax suave con el puntero
     ------------------------------------------------------------------ */
  function drawStars() {
    ['#stars', '#stars2'].forEach(drawStarLayer); // dos capas que parpadean en fases distintas
  }

  function drawStarLayer(sel) {
    const c = $(sel);
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    const count = Math.round((w * h) / 13000);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.pow(Math.random(), 1.6) * h * 0.72; // más densas arriba
      const big = Math.random() > 0.9;
      const r = big ? rand(1, 1.6) : rand(0.3, 0.9);
      const a = rand(0.3, 1);
      const tint = Math.random() < 0.3 ? '170,215,255' : '255,255,255';
      g.fillStyle = `rgba(${tint},${a})`;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      if (big) {
        g.fillStyle = `rgba(150,210,255,${a * 0.15})`;
        g.beginPath(); g.arc(x, y, r * 3.2, 0, TAU); g.fill();
      }
    }
  }

  /* --- CAPAS 4 y 4b: bosque de pinos (posiciones fijas por semilla) --- */
  function buildForest() {
    const files = ['pino-pequeno-1', 'pino-pequeno-2', 'pino-mediano-1', 'pino-mediano-2'];
    const mobile = window.innerWidth < 700;
    // fondo: pequeños y lejanos · fila: más grandes, delante de las colinas
    const rows = [
      { sel: '#forest-back', n: mobile ? 14 : 24, seed: 20261225, h: [8, 14], b: [23, 28], tall: 3 },
      { sel: '#forest-row',  n: mobile ? 8 : 15,  seed: 1224,     h: [15, 24], b: [9, 17], tall: 5 },
    ];
    for (const r of rows) {
      const el = $(r.sel);
      if (!el) continue;
      el.textContent = '';
      let s = r.seed;
      const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      for (let i = 0; i < r.n; i++) {
        const f = files[Math.floor(rnd() * files.length)];
        const img = document.createElement('img');
        img.className = 'tree';
        img.src = 'imagenes/pinos/' + f + '.png';
        img.alt = ''; img.draggable = false;
        const hgt = r.h[0] + rnd() * (r.h[1] - r.h[0]) + (f.includes('mediano') ? 2 : 0);   // vh
        img.style.cssText = `left:${(((i + rnd() * 0.8) / r.n) * 100).toFixed(1)}%;bottom:${(r.b[0] + rnd() * (r.b[1] - r.b[0])).toFixed(1)}%;` +
          `height:${hgt.toFixed(1)}vh;--d:${(-rnd() * 8).toFixed(1)}s;` +
          `transform:translateX(-50%)${rnd() > 0.5 ? ' scaleX(-1)' : ''};opacity:${(0.85 + rnd() * 0.15).toFixed(2)}`;
        el.appendChild(img);
      }
    }
  }

  function initParallax() {
    const amp = RM ? 0.5 : 1;   // con "reducir movimiento": paralaje a la mitad, no desactivado
    const layers = [...document.querySelectorAll('[data-depth]')].map((el) => ({ el, d: Number(el.dataset.depth), x: 0, y: 0 }));
    const fine = window.matchMedia('(pointer: fine)').matches;
    let tx = 0, ty = 0, cx = 0, cy = 0, last = 0, acc = 0;
    if (fine) {
      window.addEventListener('pointermove', (e) => {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }
    // El puntero mueve las capas con suavizado; además hay una deriva de cámara casi imperceptible
    // (también en pantallas táctiles) que mantiene viva la sensación de profundidad.
    const loop = (ts) => {
      requestAnimationFrame(loop);
      if (document.hidden || document.body.classList.contains('has-win')) { last = ts; return; }
      acc += Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
      if (acc < 1 / 40) return;
      const t = ts / 1000;
      const k = 1 - Math.exp(-acc * 3.5); acc = 0;
      const dx = 0, dy = 0;   // sin deriva de cámara: solo el puntero mueve las capas; la única flotación autónoma es la de Aincrad (CSS)
      cx += (tx + dx - cx) * k; cy += (ty + dy - cy) * k;
      for (const L of layers) {
        const x = -cx * L.d * amp, y = -cy * L.d * 0.5 * amp;
        if (Math.abs(x - L.x) > 0.05 || Math.abs(y - L.y) > 0.05) {
          L.x = x; L.y = y;
          L.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        }
      }
    };
    requestAnimationFrame(loop);
  }


  /* ------------------------------------------------------------------
     3. FX: nieve en 4 planos, partículas luminosas, destellos de estrellas,
        niebla procedural, luz dinámica y efectos de la gema
        - 4 canvas intercalados entre las capas del paisaje (cielo · lejos · medio · cerca)
        - Sprites prerenderizados (barato) + composición aditiva
        - Cantidad adaptada al tamaño de pantalla y a la velocidad del equipo
        - Se pausa cuando la pestaña no está visible
     ------------------------------------------------------------------ */

  /* --- Texturas procedurales: niebla (sin costuras en horizontal) y grano de película --- */
  function makeFogTile(seed, w = 512, h = 192) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h), d = img.data;
    let s = seed;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const octs = [[4, 3], [8, 5], [16, 9], [32, 18]].map(([cx, cy]) => {
      const a = new Float32Array(cx * (cy + 1));
      for (let i = 0; i < a.length; i++) a[i] = rnd();
      return { cx, cy, a };
    });
    const sm = (t) => t * t * (3 - 2 * t);
    const sample = (o, u, v) => {
      const x = u * o.cx, y = v * o.cy;
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const fx = sm(x - x0), fy = sm(y - y0);
      const xa = x0 % o.cx, xb = (x0 + 1) % o.cx, yb = Math.min(o.cy, y0 + 1);
      const A = o.a, W = o.cx;
      return (A[y0 * W + xa] * (1 - fx) + A[y0 * W + xb] * fx) * (1 - fy) + (A[yb * W + xa] * (1 - fx) + A[yb * W + xb] * fx) * fy;
    };
    const amps = [0.5, 0.27, 0.15, 0.08];
    for (let y = 0; y < h; y++) {
      const win = Math.pow(Math.sin(Math.PI * (y / h)), 1.4);       // se desvanece arriba y abajo
      for (let x = 0; x < w; x++) {
        let n = 0;
        for (let i = 0; i < 4; i++) n += amps[i] * sample(octs[i], x / w, y / h);
        let a = Math.min(1, Math.max(0, (n - 0.34) * 2.6));
        a = a * a * (3 - 2 * a) * win * 0.75;
        const k = (y * w + x) * 4;
        d[k] = 170; d[k + 1] = 208; d[k + 2] = 255; d[k + 3] = a * 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function makeGrainTile(n = 160) {
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d');
    const img = g.createImageData(n, n), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    return c;
  }

  function bakeAtmosphere() {
    const root = document.documentElement.style;
    const publish = (cv, name) => {
      const set = (u) => root.setProperty(name, `url("${u}")`);
      if (cv.toBlob) cv.toBlob((b) => { if (b) set(URL.createObjectURL(b)); }, 'image/png');
      else set(cv.toDataURL());
    };
    publish(makeFogTile(7), '--fog-img');
    publish(makeFogTile(31), '--fog-img-b');
    publish(makeGrainTile(), '--grain-img');
  }

  const FX = (() => {
    const planeSel = { sky: '#fx-sky', far: '#fx-far', mid: '#fx-mid', front: '#fx' };
    const P = {};
    for (const k in planeSel) { const cv = $(planeSel[k]); P[k] = { cv, ctx: cv.getContext('2d'), dpr: 1 }; }
    const gemWrapEl = $('#gem-wrap');
    const gemBtnEl = $('#gem');

    /* --- sprites --- */
    function makeGlow(rgb, size = 64) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, `rgba(${rgb},1)`);
      grd.addColorStop(0.25, `rgba(${rgb},.55)`);
      grd.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      return c;
    }
    function makeStar(s = 64) {
      const c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d');
      const core = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 4);
      core.addColorStop(0, 'rgba(255,255,255,1)');
      core.addColorStop(1, 'rgba(150,215,255,0)');
      g.fillStyle = core; g.fillRect(0, 0, s, s);
      const h = g.createLinearGradient(0, 0, s, 0);
      h.addColorStop(0, 'rgba(150,215,255,0)'); h.addColorStop(0.5, 'rgba(255,255,255,.95)'); h.addColorStop(1, 'rgba(150,215,255,0)');
      g.fillStyle = h; g.fillRect(0, s / 2 - 1, s, 2);
      const v = g.createLinearGradient(0, 0, 0, s);
      v.addColorStop(0, 'rgba(150,215,255,0)'); v.addColorStop(0.5, 'rgba(255,255,255,.95)'); v.addColorStop(1, 'rgba(150,215,255,0)');
      g.fillStyle = v; g.fillRect(s / 2 - 1, 0, 2, s);
      return c;
    }
    function makeDot(size = 32) {                         // copo suave con núcleo brillante
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.38, 'rgba(235,247,255,.8)');
      grd.addColorStop(1, 'rgba(210,235,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, size, size);
      return c;
    }
    function makeBokeh(size = 96) {                       // disco desenfocado (copos muy cercanos a la cámara)
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const r = size / 2;
      const grd = g.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0, 'rgba(225,244,255,.35)');
      grd.addColorStop(0.72, 'rgba(225,244,255,.5)');
      grd.addColorStop(0.9, 'rgba(255,255,255,.85)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, size, size);
      return c;
    }

    const sprites = {
      blue: makeGlow('60,150,255'),
      sky: makeGlow('140,215,255'),
      white: makeGlow('235,248,255'),
      gold: makeGlow('255,205,110'),
    };
    const starSprite = makeStar();
    const dot = makeDot();
    const bokehSprite = makeBokeh();
    // Copos dibujados (imagenes/efectos/copo1-4.png) para parte de la nieve cercana
    const flakeImgs = [1, 2, 3, 4].map((n) => { const im = new Image(); im.src = 'imagenes/efectos/copo' + n + '.png'; return im; });

    /* --- estado --- */
    const state = { ready: false, charging: false, hidden: false };
    const gem = { on: false, x: 0, y: 0, w: 0, px: 0, py: 0, tilt: 1, imgTop: 0, imgH: 0 };
    const snow = { sky: [], far: [], mid: [], front: [] };
    const bokeh = [], ambient = [], bursts = [], flares = [], rises = [], shooting = [], stars = [];
    let W = 0, H = 0, t = 0, last = 0, raf = 0, flareTimer = 1, shootTimer = 5;
    let goldBias = 0.05;
    let Q = 1;                                  // calidad (baja sola si el equipo va justo)
    let slow = 0, hov = 0, hovering = false, chargeT = 0;
    let wind = 0, gust = 0, gustAmp = 0, gustLeft = 0, gustDur = 1, gustT = rand(6, 11);
    let beatT = 4.6, beatK = 0, riseAcc = 0, trailAcc = 0;
    const PERIOD = 5.2;
    const poolSprite = makeGlow('120,205,255', 128);
    // partículas que orbitan la gema en dos anillos inclinados
    const orbs = Array.from({ length: 12 }, (_, i) => ({
      ring: i % 2, a: rand(0, TAU), sp: (i % 2 ? -1 : 1) * rand(0.45, 0.8), s: rand(18, 28), type: i % 4 === 3 ? 'white' : 'sky',
    }));
    const RINGS = [{ rx: 0.68, ry: 0.2, tilt: -0.22 }, { rx: 0.52, ry: 0.36, tilt: 0.38 }];
    let backAcc = 0, tick = 0;

    // planos de nieve: n = copos por millón de píxeles · s = tamaño · vy = caída px/s · dp = cuánto le afecta el viento
    const SNOW = {
      sky:   { n: 34, s: [1.2, 3],  vy: [7, 15],   a: [0.25, 0.55], sway: 5,  dp: 0.15 },
      far:   { n: 70, s: [2, 4.2],  vy: [16, 30],  a: [0.35, 0.65], sway: 9,  dp: 0.35 },
      mid:   { n: 48, s: [3.5, 7],  vy: [34, 58],  a: [0.45, 0.8],  sway: 15, dp: 0.65 },
      front: { n: 22, s: [9, 18],   vy: [70, 125], a: [0.4, 0.85],  sway: 26, dp: 1 },
    };
    const area = () => Math.min(2.2, Math.max(0.5, (W * H) / 1e6));
    const count = (n) => Math.round(n * area() * Q * (RM ? 0.8 : 1));
    const ambientCount = () => Math.round(Math.min(110, Math.max(34, (W * H) / 16000)) * Q * (RM ? 0.8 : 1));

    function pickType() {
      if (Math.random() < goldBias) return 'gold';
      const r = Math.random();
      return r < 0.2 ? 'white' : r < 0.55 ? 'sky' : 'blue';
    }

    function spawn(p, initial) {                // partícula luminosa ambiental
      p.type = pickType();
      const gold = p.type === 'gold';
      p.x = rand(0, W);
      p.y = initial ? rand(0, H) : (gold ? -12 : H + 12);
      p.size = rand(6, 16) * (gold ? 1.1 : 1);
      p.vx = rand(-5, 5);
      p.vy = gold ? rand(12, 30) : -rand(6, 20);  // azules suben, dorados caen como nieve
      p.ph = rand(0, TAU);
      p.tw = rand(0.6, 1.8);
      p.a = rand(0.35, 0.95);
      p.near = 0;
      return p;
    }

    function spawnSnow(p, key, initial) {
      const d = SNOW[key];
      p.x = rand(-20, W + 20);
      p.y = initial ? rand(0, H) : -rand(4, 30);
      p.s = rand(d.s[0], d.s[1]);
      p.vy = rand(d.vy[0], d.vy[1]) * (RM ? 0.85 : 1);
      p.vx = rand(-4, 4);
      p.ph = rand(0, TAU);
      p.a = rand(d.a[0], d.a[1]);
      p.rot = rand(0, TAU); p.vr = rand(-0.8, 0.8);
      p.f = key === 'front' && Math.random() < 0.5 ? (Math.random() * 4) | 0 : -1;
      if (p.f >= 0) p.s *= 1.4;
      return p;
    }
    function spawnBokeh(p, initial) {
      p.x = rand(0, W); p.y = initial ? rand(0, H) : -90;
      p.s = rand(38, 96); p.vy = rand(26, 66) * (RM ? 0.85 : 1); p.vx = rand(-6, 6);
      p.ph = rand(0, TAU); p.a = rand(0.05, 0.13);
      return p;
    }

    function buildStars() {                     // estrellas que parpadean con destello en cruz
      stars.length = 0;
      const n = Math.round((W * H) / 30000 * Q);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: rand(0, W), y: Math.pow(Math.random(), 1.5) * H * 0.62, s: rand(10, 26),
          ph: rand(0, TAU), sp: rand(0.5, 1.7), b: rand(0.55, 1),
        });
      }
    }

    function fill(arr, n, make) { while (arr.length < n) arr.push(make({})); arr.length = Math.min(arr.length, n); }
    function sizeCanvases() {
      const dprBase = window.devicePixelRatio || 1;
      for (const k in P) {
        const p = P[k];
        p.dpr = Math.min(dprBase, k === 'front' ? 1.5 : 1);
        p.cv.width = Math.round(W * p.dpr);
        p.cv.height = Math.round(H * p.dpr);
        p.ctx.setTransform(p.dpr, 0, 0, p.dpr, 0, 0);
      }
    }
    function populate() {
      for (const k of ['sky', 'far', 'mid', 'front']) fill(snow[k], count(SNOW[k].n), (p) => spawnSnow(p, k, true));
      fill(bokeh, Math.round(6 * area() * Q * (RM ? 0.8 : 1)), (p) => spawnBokeh(p, true));
      fill(ambient, ambientCount(), (p) => spawn(p, true));
    }
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      sizeCanvases();
      populate();
      buildStars();
    }

    /* --- geometría de la gema (la plataforma está a 1.674 × el ancho del contenedor) --- */
    function updateGem() {
      if (state.hidden || gemWrapEl.hidden) { gem.on = false; return; }
      const r = gemWrapEl.getBoundingClientRect();
      if (!r.width) { gem.on = false; return; }
      gem.on = true; gem.w = r.width;
      gem.x = r.left + r.width / 2;
      gem.y = r.top + r.height * 0.46;
      gem.px = gem.x; gem.py = r.top + r.width * 1.674;
      const b = gemBtnEl.getBoundingClientRect();
      gem.tilt = Math.min(1, b.width / (gemWrapEl.offsetWidth || 1));       // giro 3D → anchura proyectada
      gem.imgH = gemWrapEl.offsetHeight * 1.12;
      gem.imgTop = b.top - gemWrapEl.offsetHeight * 0.06;
    }

    /* --- latido de energía de la gema --- */
    function fireBeat() {
      gemWrapEl.classList.remove('beat'); void gemWrapEl.offsetWidth; gemWrapEl.classList.add('beat');
      const n = Math.round(24 * Q);
      for (let i = 0; i < n; i++) {             // anillo de chispas que se expande
        const a = (i / n) * TAU + rand(-0.1, 0.1), sp = rand(70, 130), life = rand(0.9, 1.5);
        bursts.push({ x: gem.x + Math.cos(a) * gem.w * 0.25, y: gem.y + Math.sin(a) * gem.w * 0.25,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, life, max: life, drag: 1.6, size: rand(6, 12),
          type: Math.random() < 0.3 ? 'white' : 'sky' });
      }
    }
    function stepBeat(dt) {
      if (!state.ready || !gem.on || state.charging) { beatK = Math.max(0, beatK - dt * 2); return; }
      beatT += dt;
      if (beatT >= PERIOD) { beatT = 0; fireBeat(); }
      beatK = Math.min(1, beatT / 0.1) * Math.exp(-beatT * 1.55);
    }

    function stepWind(dt) {
      if (gustLeft > 0) {
        gustLeft -= dt;
        gust = gustAmp * Math.sin(Math.PI * (1 - Math.max(0, gustLeft) / gustDur));
      } else {
        gust *= 0.97;
        gustT -= dt;
        if (gustT <= 0) { gustAmp = rand(14, 30) * (Math.random() < 0.5 ? -1 : 1); gustDur = rand(3, 5); gustLeft = gustDur; gustT = rand(9, 18); }
      }
      wind = (Math.sin(t * 0.11) * 9 + Math.sin(t * 0.29 + 1.3) * 5 + gust) * (RM ? 0.8 : 1);
    }

    function drawSnow(ctx, arr, key, dt) {
      const d = SNOW[key];
      const wx = wind * d.dp;
      for (const p of arr) {
        p.x += (p.vx + wx + Math.sin(t * 0.7 + p.ph) * d.sway) * dt;
        p.y += p.vy * dt;
        if (p.y > H + 20 || p.x < -30 || p.x > W + 30) { spawnSnow(p, key, false); continue; }
        ctx.globalAlpha = p.a;
        const fl = p.f >= 0 ? flakeImgs[p.f] : null;
        if (fl && fl.naturalWidth) {
          p.rot += p.vr * dt;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.drawImage(fl, -p.s / 2, -p.s / 2, p.s, p.s);
          ctx.restore();
        } else {
          const s = p.s * 1.8;
          ctx.drawImage(dot, p.x - s / 2, p.y - s / 2, s, s);
        }
      }
    }

    /* --- planos --- */
    function frameSky(dt) {
      const ctx = P.sky.ctx;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const st of stars) {                 // estrellas que centellean
        const w = 0.5 + 0.5 * Math.sin(t * st.sp + st.ph);
        const a = 0.18 + 0.82 * w * w * w;
        const s = st.s * (0.55 + 0.6 * a);
        ctx.globalAlpha = a * st.b;
        ctx.drawImage(starSprite, st.x - s / 2, st.y - s / 2, s, s);
      }
      if (!RM) {                                // estrellas fugaces
        shootTimer -= dt;
        if (shootTimer <= 0 && shooting.length < 2) {
          shooting.push({ x: rand(W * 0.1, W * 0.75), y: rand(0, H * 0.28), vx: rand(520, 800), vy: rand(170, 300), life: 0, max: rand(0.7, 1.1) });
          shootTimer = rand(7, 16);
        }
        for (let i = shooting.length - 1; i >= 0; i--) {
          const s = shooting[i];
          s.life += dt;
          if (s.life >= s.max) { shooting.splice(i, 1); continue; }
          s.x += s.vx * dt; s.y += s.vy * dt;
          const k = s.life / s.max, a = Math.sin(k * Math.PI);
          const tx = s.x - s.vx * 0.16, ty = s.y - s.vy * 0.16;
          const grd = ctx.createLinearGradient(s.x, s.y, tx, ty);
          grd.addColorStop(0, `rgba(255,255,255,${a})`);
          grd.addColorStop(1, 'rgba(120,200,255,0)');
          ctx.globalAlpha = 1; ctx.strokeStyle = grd; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.globalAlpha = a; ctx.drawImage(sprites.white, s.x - 7, s.y - 7, 14, 14);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      drawSnow(ctx, snow.sky, 'sky', dt);
      ctx.globalAlpha = 1;
    }
    function frameFar(dt) {
      const ctx = P.far.ctx;
      ctx.clearRect(0, 0, W, H);
      drawSnow(ctx, snow.far, 'far', dt);
      ctx.globalAlpha = 1;
    }
    function frameMid(dt) {
      const ctx = P.mid.ctx;
      ctx.clearRect(0, 0, W, H);
      drawSnow(ctx, snow.mid, 'mid', dt);
      ctx.globalAlpha = 1;
    }

    function frameFront(dt) {
      const ctx = P.front.ctx;
      ctx.clearRect(0, 0, W, H);

      // nieve cercana + discos desenfocados (profundidad de campo)
      drawSnow(ctx, snow.front, 'front', dt);
      for (const p of bokeh) {
        p.x += (p.vx + wind * 1.4 + Math.sin(t * 0.4 + p.ph) * 18) * dt;
        p.y += p.vy * dt;
        if (p.y > H + 100 || p.x < -100 || p.x > W + 100) { spawnBokeh(p, false); continue; }
        ctx.globalAlpha = p.a;
        ctx.drawImage(bokehSprite, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }

      ctx.globalCompositeOperation = 'lighter';

      // partículas luminosas · atraídas por la gema, brillan al acercarse
      const pullR = Math.max(220, Math.min(W, H) * 0.34);
      for (const p of ambient) {
        if (gem.on && state.ready) {
          const dx = gem.x - p.x, dy = gem.y - p.y, d = Math.hypot(dx, dy) || 1;
          if (d < pullR) {
            const k = 1 - d / pullR;
            const ux = dx / d, uy = dy / d;
            p.vx += (ux * 70 * k * k - uy * 90 * k) * dt;            // atracción + giro en espiral
            p.vy += (uy * 70 * k * k + ux * 90 * k) * dt;
            const damp = Math.exp(-0.9 * k * dt);
            p.vx *= damp; p.vy *= damp;
            p.near = k;
            if ((dx * dx) / (gem.w * gem.w * 0.085) + (dy * dy) / (gem.w * gem.w * 0.62) < 1) {   // roza el cristal → destello
              flares.push({ x: p.x, y: p.y, life: 0, max: rand(0.5, 0.9), size: rand(16, 28) });
              spawn(p, false); p.y = rand(0, H); p.x = Math.random() < 0.5 ? -10 : W + 10;
              continue;
            }
          } else p.near *= 0.96;
        } else p.near = 0;
        p.x += (p.vx + Math.sin(t * 0.45 + p.ph) * 7) * dt;
        p.y += p.vy * dt;
        if (p.y < -20 || p.y > H + 20 || p.x < -20 || p.x > W + 20) { spawn(p, false); continue; }
        const tw = 0.65 + 0.35 * Math.sin(t * p.tw + p.ph);
        ctx.globalAlpha = Math.min(1, p.a * tw * (1 + p.near * 1.3));
        const s = p.size * (1 + p.near * 0.6);
        ctx.drawImage(sprites[p.type], p.x - s / 2, p.y - s / 2, s, s);
      }

      // chispas de energía que suben desde la plataforma hacia la gema
      if (gem.on && state.ready && !state.charging) {
        riseAcc += dt * 16 * Q * (RM ? 0.8 : 1);
        while (riseAcc >= 1 && rises.length < 130) {
          riseAcc -= 1;
          const a = rand(0, TAU), rr = rand(0.35, 1);
          rises.push({ x: gem.px + Math.cos(a) * gem.w * rr, y: gem.py + Math.sin(a) * gem.w * 0.22 * rr,
            vx: rand(-5, 5), vy: -rand(28, 70), life: 0, max: rand(2.2, 3.8), s: rand(5, 11), ph: rand(0, TAU),
            type: Math.random() < 0.12 ? 'gold' : Math.random() < 0.4 ? 'white' : 'sky' });
        }
        riseAcc = Math.min(riseAcc, 3);
      }
      for (let i = rises.length - 1; i >= 0; i--) {
        const r = rises[i];
        r.life += dt;
        if (r.life >= r.max) { rises.splice(i, 1); continue; }
        if (gem.on) r.vx += (gem.x - r.x) * 0.45 * dt;               // se encauzan hacia el eje de la gema
        r.x += (r.vx + Math.sin(t * 2 + r.ph) * 8) * dt; r.y += r.vy * dt;
        r.vx *= Math.exp(-0.6 * dt);
        const k = r.life / r.max;
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
        ctx.drawImage(sprites[r.type], r.x - r.s / 2, r.y - r.s / 2, r.s, r.s);
      }

      // luz de la gema proyectada sobre el suelo + partículas en órbita
      if (gem.on && (state.ready || state.charging)) {
        const pa = (0.14 + 0.32 * beatK + 0.3 * chargeT) * (0.92 + 0.08 * Math.sin(t * 2.1));
        const rx = gem.w * 1.45, ry = gem.w * 0.36;
        ctx.globalAlpha = Math.min(1, pa);
        ctx.drawImage(poolSprite, gem.px - rx, gem.py - ry, rx * 2, ry * 2);
        ctx.globalAlpha = Math.min(1, pa * 0.6);
        ctx.drawImage(poolSprite, gem.px - rx * 0.45, gem.py - ry * 0.45, rx * 0.9, ry * 0.9);
        if (state.ready && !state.charging) {
          const body = gem.w * 0.27;
          for (const o of orbs) {
            o.a += o.sp * dt * (1 + beatK * 0.9);
            const R = RINGS[o.ring], rx2 = gem.w * R.rx * (1 + 0.12 * beatK), ry2 = gem.w * R.ry * (1 + 0.12 * beatK);
            const ct = Math.cos(R.tilt), st = Math.sin(R.tilt);
            for (let k = 0; k < 4; k++) {                               // cola corta
              const a = o.a - Math.sign(o.sp) * k * 0.1;
              const ex = Math.cos(a) * rx2, ey = Math.sin(a) * ry2, depth = Math.sin(a) * Math.sign(o.sp);
              if (depth < 0 && Math.abs(ex * ct) < body) continue;      // queda detrás del cristal
              const x = gem.x + ex * ct - ey * st, y = gem.y + gem.w * 0.06 + ex * st + ey * ct;
              const s = o.s * (0.75 + 0.35 * depth) * (1 - k * 0.18);
              ctx.globalAlpha = Math.min(1, (0.45 + 0.7 * (depth * 0.5 + 0.5)) * (1 - k * 0.27) * (0.85 + 0.4 * beatK));
              ctx.drawImage(sprites[o.type], x - s / 2, y - s / 2, s, s);
            }
          }
        }
      }

      // estela de la gema mientras desciende
      if (gem.on && !state.ready && !state.charging) {
        trailAcc += dt * 80 * Q;
        while (trailAcc >= 1 && bursts.length < 260) {
          trailAcc -= 1;
          const life = rand(0.5, 1.1);
          bursts.push({ x: gem.x + rand(-0.18, 0.18) * gem.w, y: gem.y + rand(-0.6, 0.5) * gem.w,
            vx: rand(-12, 12), vy: rand(-30, 10), life, max: life, drag: 1.2, size: rand(5, 12), type: Math.random() < 0.4 ? 'white' : 'sky' });
        }
        trailAcc = Math.min(trailAcc, 4);
      }

      // destellos en forma de estrella (aleatorios + los de la gema)
      flareTimer -= dt;
      if (flareTimer <= 0 && flares.length < 6) {
        flares.push({ x: rand(0, W), y: rand(0, H * 0.7), life: 0, max: rand(0.9, 1.6), size: rand(18, 40) });
        flareTimer = rand(0.6, 1.8);
      }
      for (let i = flares.length - 1; i >= 0; i--) {
        const f = flares[i];
        f.life += dt;
        const k = f.life / f.max;
        if (k >= 1) { flares.splice(i, 1); continue; }
        const a = Math.sin(k * Math.PI);
        const s = f.size * (0.6 + 0.4 * a);
        ctx.globalAlpha = a * 0.85;
        ctx.drawImage(starSprite, f.x - s / 2, f.y - s / 2, s, s);
      }
      if (gem.on) {                             // brillos sobre las facetas del cristal
        for (const gl of GemFX.glints(t, Math.max(beatK, chargeT))) {
          const s = gem.w * gl.size;
          ctx.globalAlpha = gl.a;
          ctx.drawImage(starSprite, gem.x + (gl.x - 0.5) * gem.imgH * (109 / 292) * gem.tilt - s / 2, gem.imgTop + gl.y * gem.imgH - s / 2, s, s);
        }
      }

      // ráfagas (energía)
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.life -= dt;
        if (b.life <= 0) { bursts.splice(i, 1); continue; }
        if (b.drag) { const k = Math.exp(-b.drag * dt); b.vx *= k; b.vy *= k; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        const k = b.life / b.max;
        ctx.globalAlpha = Math.min(1, k * 1.5);
        const s = b.size * (0.4 + 0.6 * k);
        ctx.drawImage(sprites[b.type], b.x - s / 2, b.y - s / 2, s, s);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    /* --- bucle principal --- */
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const raw = (ts - last) / 1000 || 0.016;
      const dt = Math.min(0.05, raw);
      last = ts; t += dt;

      // si el equipo va justo, baja la cantidad de partículas (solo una vez por tramo)
      if (raw > 0.034) slow++; else slow = Math.max(0, slow - 1);
      if (slow > 45 && Q > 0.5) { Q = Math.max(0.5, Q * 0.72); slow = 0; populate(); buildStars(); }

      updateGem();
      stepWind(dt);
      stepBeat(dt);
      hov += ((hovering && !state.charging ? 1 : 0) - hov) * Math.min(1, dt * 4);
      chargeT = state.charging ? Math.min(1, chargeT + dt / 0.85) : Math.max(0, chargeT - dt * 2);

      // con una ventana abierta el fondo está oscurecido: los planos traseros se dibujan a la mitad de frecuencia
      backAcc += dt; tick ^= 1;
      if (!document.body.classList.contains('has-win') || tick) {
        frameSky(backAcc);
        frameFar(backAcc);
        frameMid(backAcc);
        backAcc = 0;
      }
      frameFront(dt);

      GemFX.draw(t, beatK, chargeT, hov, gem.on);
      Light.update(dt, t, gem, beatK, chargeT);
    }

    function play() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function pause() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    let resizeTimer = 0, lastW = window.innerWidth, lastH = window.innerHeight;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Android: la barra de direcciones y el teclado cambian solo la altura varias veces; rehacer los canvas
        // los borra y provoca destellos. Solo se reconstruye si cambia el ancho o la altura cambia de forma notable.
        const w = window.innerWidth, h = window.innerHeight;
        if (w === lastW && Math.abs(h - lastH) < lastH * 0.22) return;
        lastW = w; lastH = h;
        resize(); drawStars(); GemFX.layout(true);
      }, 150);
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
    gemBtnEl.addEventListener('pointerenter', () => { hovering = true; });
    gemBtnEl.addEventListener('pointerleave', () => { hovering = false; });

    return {
      state, gem,
      start() { resize(); play(); },

      /** Explosión de energía hacia afuera */
      burst(x, y, n = 60) {
        if (bursts.length > 260) return;
        const types = ['white', 'sky', 'sky', 'blue', 'gold'];
        for (let i = 0; i < n; i++) {
          const a = rand(0, TAU), s = rand(80, 420), life = rand(0.7, 1.5);
          bursts.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life, max: life, drag: 2.2, size: rand(10, 26),
            type: types[(Math.random() * types.length) | 0],
          });
        }
      },

      /** Partículas que son absorbidas por la gema mientras se carga */
      converge(x, y, n = 5) {
        if (bursts.length > 260) return;
        for (let i = 0; i < n; i++) {
          const a = rand(0, TAU), d = rand(150, 300), life = 0.65;
          bursts.push({
            x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
            vx: -Math.cos(a) * d / life, vy: -Math.sin(a) * d / life,
            life, max: life, drag: 0, size: rand(8, 18),
            type: Math.random() < 0.5 ? 'sky' : 'white',
          });
        }
      },

      /** Chispas luminosas que brotan del contorno de una ventana al activarse */
      edge(r, n = 60) {
        if (bursts.length > 240) return;
        for (let i = 0; i < n; i++) {
          const side = (Math.random() * 4) | 0, u = Math.random();
          const x = side < 2 ? r.left + u * r.width : (side === 2 ? r.left : r.right);
          const y = side < 2 ? (side === 0 ? r.top : r.bottom) : r.top + u * r.height;
          const nx = side < 2 ? 0 : (side === 2 ? -1 : 1), ny = side < 2 ? (side === 0 ? -1 : 1) : 0;
          const sp = rand(20, 90), life = rand(1, 1.7);
          bursts.push({ x, y, vx: nx * sp + rand(-15, 15), vy: ny * sp + rand(-30, -5), life, max: life, drag: 1.4, size: rand(6, 12),
            type: Math.random() < 0.35 ? 'white' : 'sky' });
        }
      },

      /** Más dorado y nieve cuando se abre la carta */
      setMood(mood) { goldBias = mood === 'xmas' ? 0.16 : 0.05; },
    };
  })();


  /* ------------------------------------------------------------------
     3b. LA GEMA: refracción, reflejos internos, pulsos y aberración cromática
         Se dibuja con canvas y se recorta con la silueta real de cristal.png
         (los CSS mask con imágenes locales no funcionan abriendo el HTML con doble clic)
     ------------------------------------------------------------------ */
  const GemFX = (() => {
    const cv = $('#gem-fx');
    const ctx = cv.getContext('2d');
    const buf = document.createElement('canvas'), b = buf.getContext('2d');
    const fr = document.createElement('canvas'), f = fr.getContext('2d');
    const img = new Image();
    let ok = false, cw = 0, ch = 0;

    // brillos fijos sobre las facetas (x, y en proporción a la imagen)
    const GL = [
      { x: 0.50, y: 0.10, z: 0.55, sp: 0.80, ph: 0.0, k: 1.0 },
      { x: 0.34, y: 0.38, z: 0.42, sp: 0.63, ph: 1.7, k: 0.8 },
      { x: 0.67, y: 0.50, z: 0.48, sp: 0.71, ph: 3.1, k: 0.9 },
      { x: 0.50, y: 0.78, z: 0.36, sp: 0.57, ph: 4.6, k: 0.6 },
    ];

    function layout(force) {
      if (!ok) return;
      const wrap = $('#gem-wrap');
      const hCss = wrap.offsetHeight * 1.12;
      if (!hCss) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = Math.round(hCss * dpr), w = Math.round(h * 109 / 292);
      if (!force && w === cw && h === ch) return;
      cw = cv.width = buf.width = fr.width = w;
      ch = cv.height = buf.height = fr.height = h;
      // franjas de color (cian a la izquierda, violeta a la derecha) que solo asoman por fuera del borde
      const tint = (dx, color) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.drawImage(img, dx, 0, w, h);
        g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, w, h);
        return c;
      };
      const k = Math.max(1.5, w * 0.025);
      f.clearRect(0, 0, w, h);
      f.globalCompositeOperation = 'source-over';
      f.drawImage(tint(-k, 'rgb(80,235,255)'), 0, 0);
      f.globalCompositeOperation = 'lighter';
      f.drawImage(tint(k, 'rgb(165,120,255)'), 0, 0);
      f.globalCompositeOperation = 'destination-out';
      f.drawImage(img, 0, 0, w, h);
      f.globalCompositeOperation = 'source-over';
    }
    img.onload = () => { ok = true; layout(true); };
    img.src = 'imagenes/cristales/cristal.png';

    return {
      layout,
      glints(t, e) {
        const out = [];
        for (const g of GL) {
          let a = Math.pow(Math.max(0, Math.sin(t * g.sp + g.ph)), 10);
          a = Math.min(1, a + e * 0.8 * g.k);
          if (a > 0.03) out.push({ x: g.x, y: g.y, size: g.z * (0.5 + 0.9 * a), a });
        }
        return out;
      },
      draw(t, beatK, chargeK, hov, visible) {
        if (!ok || !visible) return;
        if (!cw) layout(true);
        if (!cw) return;
        const e = Math.max(beatK, chargeK);                     // energía 0..1
        ctx.clearRect(0, 0, cw, ch);
        b.globalCompositeOperation = 'source-over';
        b.clearRect(0, 0, cw, ch);
        b.drawImage(img, 0, 0, cw, ch);                          // silueta
        b.globalCompositeOperation = 'source-atop';              // todo lo siguiente queda dentro del cristal

        let g = b.createRadialGradient(cw * 0.5, ch * 0.40, 0, cw * 0.5, ch * 0.40, ch * 0.55);
        g.addColorStop(0, `rgba(240,252,255,${0.12 + 0.6 * e})`);
        g.addColorStop(0.5, `rgba(130,205,255,${0.05 + 0.3 * e})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        b.fillStyle = g; b.fillRect(0, 0, cw, ch);               // núcleo que late

        for (let i = 0; i < 4; i++) {                            // cáusticas: luz refractada que se desplaza por las facetas
          const ph = t * (0.35 + 0.08 * i) + i * 1.9;
          const cx = cw * (0.5 + 0.22 * Math.sin(ph)), cy = ch * (0.2 + 0.15 * i + 0.05 * Math.cos(ph * 1.3));
          const rx = cw * (0.34 + 0.08 * Math.sin(ph * 0.7 + i)), ry = ch * (0.07 + 0.03 * i);
          b.save(); b.translate(cx, cy); b.rotate(-0.5 + 0.4 * Math.sin(ph * 0.6 + i)); b.scale(1, ry / rx);
          const col = i % 2 ? '190,170,255' : '150,235,255';
          g = b.createRadialGradient(0, 0, 0, 0, 0, rx);
          g.addColorStop(0, `rgba(${col},${0.3 + 0.2 * e})`); g.addColorStop(1, `rgba(${col},0)`);
          b.fillStyle = g; b.beginPath(); b.arc(0, 0, rx, 0, TAU); b.fill(); b.restore();
        }

        const sp = ((t * (0.17 + 0.12 * hov)) % 1.6) - 0.3;     // reflejo especular que barre en diagonal
        b.save(); b.translate(cw * 0.5, ch * 0.5); b.rotate(0.38);
        const gx = (sp - 0.5) * ch * 0.9;
        g = b.createLinearGradient(gx - cw * 0.35, 0, gx + cw * 0.35, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, `rgba(255,255,255,${0.55 + 0.3 * e})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        b.fillStyle = g; b.fillRect(-cw, -ch, cw * 2, ch * 2); b.restore();

        ctx.drawImage(buf, 0, 0);
        ctx.globalAlpha = 0.4 + 0.45 * e + 0.2 * hov;            // aberración cromática en el contorno
        ctx.drawImage(fr, 0, 0);
        ctx.globalAlpha = 1;
      },
    };
  })();


  /* ------------------------------------------------------------------
     3c. ILUMINACIÓN DINÁMICA: la luz de la gema baña el paisaje
         (halo + lavado de luz sobre montañas y pinos + rebote en la nieve)
     ------------------------------------------------------------------ */
  const Light = (() => {
    const glow = $('#env-glow'), wash = $('#env-wash'), floor = $('#env-floor');
    let x = window.innerWidth / 2, y = window.innerHeight * 0.5, fy = y + 120, k = 0;
    const place = (el, px, py) => { el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) translate(-50%,-50%)`; };

    return {
      update(dt, t, gem, beatK, chargeK) {
        let tx = x, ty = y, tfy = fy, ti = 0;
        if (gem.on) {                                           // sigue a la gema, incluso mientras desciende
          tx = gem.x; ty = gem.y; tfy = gem.py;
          ti = FX.state.ready ? 0.95 + 0.5 * beatK : 0.55;
          ti += chargeK * 1.2;
        } else if (phase === 'closed') {                        // la gema pequeña del botón "reabrir"
          const r = $('.reopen-gem').getBoundingClientRect();
          if (r.width) { tx = r.left + r.width / 2; ty = r.top + r.height / 2; tfy = ty + r.height; ti = 0.6; }
        } else if (phase === 'notice' || phase === 'transition' || phase === 'letter') {
          tx = window.innerWidth / 2; ty = window.innerHeight * 0.5; tfy = window.innerHeight * 0.66;
          ti = phase === 'letter' ? 0.38 : 0.6;
        }
        const f = Math.min(1, dt * 5);
        x += (tx - x) * f; y += (ty - y) * f; fy += (tfy - fy) * f;
        k += (ti - k) * Math.min(1, dt * 3);
        const flick = 1 + 0.03 * Math.sin(t * 9) + 0.02 * Math.sin(t * 15.7);
        place(glow, x, y); place(wash, x, y); place(floor, x, fy);
        glow.style.opacity = Math.min(1, 0.55 * k * flick).toFixed(3);
        wash.style.opacity = Math.min(1, 0.5 * k).toFixed(3);
        floor.style.opacity = Math.min(1, 0.6 * k * flick).toFixed(3);
      },
    };
  })();


  /* ------------------------------------------------------------------
     4. MÚSICA  (MUSIC_CONFIG.src · empieza al abrir la carta)
        - El archivo no se pide hasta ese momento
        - Si no existe: silencio total, sin errores ni reproductor vacío
        - No se reinicia al cerrar y volver a abrir la carta
     ------------------------------------------------------------------ */
  const Music = (() => {
    const el = $('#music');
    const panel = $('#audio-panel');
    const btn = $('#audio-toggle');
    const label = $('#audio-label');
    const bar = $('#audio-progress');
    const vol = $('#audio-vol');
    let started = false, broken = false;

    el.loop = MUSIC_CONFIG.loop;
    el.volume = MUSIC_CONFIG.volume;
    vol.value = MUSIC_CONFIG.volume;
    label.textContent = MUSIC_CONFIG.label;

    function setState(state) {
      panel.dataset.state = state;
      btn.setAttribute('aria-label', state === 'playing' ? 'Pausar música' : 'Reanudar música');
    }
    function fail() { broken = true; panel.hidden = true; } // silencioso

    el.addEventListener('playing', () => { setState('playing'); panel.hidden = false; });
    el.addEventListener('pause', () => { if (!el.ended) setState('paused'); });
    el.addEventListener('ended', () => { setState('paused'); bar.style.transform = 'scaleX(1)'; });
    el.addEventListener('timeupdate', () => {
      if (el.duration) bar.style.transform = `scaleX(${Math.min(1, el.currentTime / el.duration)})`;
    });
    el.addEventListener('error', fail);

    btn.addEventListener('click', () => {
      if (broken) return;
      if (el.paused) el.play().catch(() => {});
      else el.pause();
    });
    vol.addEventListener('input', () => { el.volume = Number(vol.value); });

    return {
      /** Llamar dentro de un clic del usuario. Solo actúa la primera vez. */
      start() {
        if (started || broken) return;
        started = true;
        el.src = MUSIC_CONFIG.src;
        const p = el.play();
        if (p && p.catch) {
          p.catch((err) => {
            if (el.error || (err && err.name === 'NotSupportedError')) fail();
            else { panel.hidden = false; setState('paused'); } // audio bloqueado: queda el botón
          });
        }
      },
    };
  })();


  /* ------------------------------------------------------------------
     5. CARTA: campos editables con autoguardado en el navegador
     ------------------------------------------------------------------ */
  const Letter = (() => {
    const KEY = 'sao-christmas-letter-v' + LETTER_CONFIG.version;
    const to = $('#letter-to');
    const msg = $('#letter-msg');
    const from = $('#letter-from');
    const status = $('#save-status');
    const statusText = $('#save-text');

    const DEFAULT = { to: LETTER_CONFIG.to, from: LETTER_CONFIG.from, msg: LETTER_CONFIG.message };

    const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
    const write = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch { return false; } };

    const data = Object.assign({}, DEFAULT, LETTER_CONFIG.editable ? (read() || {}) : {});
    to.value = data.to;
    msg.value = data.msg;
    from.value = data.from;

    if (!LETTER_CONFIG.editable) {            // modo solo lectura
      [to, msg, from].forEach((el) => { el.readOnly = true; });
      $('#letter').classList.add('is-readonly');
      $('#letter-msg-label').textContent = 'MENSAJE';
      status.hidden = true;
      if (!to.value) to.closest('.field').hidden = true;
      if (!from.value) from.closest('.field').hidden = true;
    }

    function autosize() {
      msg.style.height = 'auto';
      msg.style.height = (msg.scrollHeight + 2) + 'px';
    }

    /* Vista de lectura: los párrafos (separados por línea en blanco) se muestran con aire entre ellos.
       Al hacer clic (o al tabular) se pasa al textarea editable; al salir vuelve la vista de lectura. */
    const wrap = $('#letter-wrap'), readEl = $('#letter-read');
    function renderRead() {
      readEl.textContent = '';
      const text = msg.value.replace(/\r/g, '').trim();
      if (!text) {
        const p = document.createElement('p');
        p.className = 'ph'; p.textContent = msg.placeholder;
        readEl.appendChild(p);
        return;
      }
      text.split(/\n{2,}/).forEach((para, i) => {
        const p = document.createElement('p');
        p.style.setProperty('--n', i);
        para.split('\n').forEach((line, j) => {
          if (j) p.appendChild(document.createElement('br'));
          const url = line.trim();

if (/^https?:\/\/\S+$/.test(url)) {
  const a = document.createElement('a');
  a.href = url;
  a.textContent = '🎁 Ver mi regalo en Mercado Libre';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  a.style.color = '#55baff';
  a.style.textDecoration = 'underline';
  a.style.fontWeight = 'bold';
  a.style.cursor = 'pointer';

  p.appendChild(a);
} else {
  p.appendChild(document.createTextNode(line));
}
        });
        readEl.appendChild(p);
      });
    }
    renderRead();
    if (LETTER_CONFIG.editable) {
      msg.addEventListener('focus', () => { wrap.classList.remove('is-reading'); autosize(); });
      msg.addEventListener('blur', () => { renderRead(); wrap.classList.add('is-reading'); });
      readEl.addEventListener('click', () => {
        wrap.classList.remove('is-reading');
        msg.focus({ preventScroll: true });
        msg.setSelectionRange(msg.value.length, msg.value.length);
        autosize();
      });
    }

    let timer = 0;
    let dirty = false; // hay cambios sin guardar
    function setStatus(kind, text) {
      status.classList.toggle('is-saving', kind === 'saving');
      status.classList.toggle('is-error', kind === 'error');
      statusText.textContent = text;
    }
    function save() {
      clearTimeout(timer);
      dirty = false;
      const ok = write({ to: to.value, msg: msg.value, from: from.value });
      setStatus(ok ? 'ok' : 'error', ok ? 'GUARDADO' : 'SIN AUTOGUARDADO');
    }
    function queueSave() {
      dirty = true;
      setStatus('saving', 'ESCRIBIENDO…');
      clearTimeout(timer);
      timer = setTimeout(save, 350);
    }

    [to, msg, from].forEach((el) => el.addEventListener('input', queueSave));
    msg.addEventListener('input', autosize);
    window.addEventListener('resize', () => { if (!$('#letter').hidden) autosize(); });
    // Guarda antes de cerrar la pestaña (solo si hay cambios pendientes)
    window.addEventListener('pagehide', () => { if (dirty) save(); });

    return { autosize, flush() { if (dirty) save(); } };
  })();


  /* ------------------------------------------------------------------
     6. FLUJO DE LA EXPERIENCIA
        intro → ready → unlocking → notice → transition → letter ⇄ closed
     ------------------------------------------------------------------ */
  const gemWrap = $('#gem-wrap');
  const gemBtn = $('#gem');
  const gemImg = $('#gem-img');
  const flash = $('#flash');
  const notice = $('#notice');
  const letter = $('#letter');
  const openBtn = $('#open-memory');
  const closeBtn = $('#close-letter');
  const closeX = $('#close-x');
  const reopenBtn = $('#reopen');
  const typed = $('#notice-text');

  let phase = 'intro';
  const hasPointer = window.matchMedia('(pointer: fine)').matches;

  /* --- HUD estilo Aincrad: textos configurables, reloj y piso actual --- */
  const HUD = (() => {
    const clock = $('#hud-clock');
    $('#hud-name').textContent = HUD_CONFIG.name;
    $('#hud-zone').textContent = HUD_CONFIG.zone;
    $('#hud-temp').textContent = HUD_CONFIG.temp;
    $('#hud-floor').textContent = String(HUD_CONFIG.floor).padStart(2, '0');
    $('.hud-floors').style.setProperty('--fp', Math.max(1, Math.min(100, HUD_CONFIG.floor)));
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => { const d = new Date(); clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
    tick();
    setInterval(tick, 1000);
  })();

  /* --- Ventana de notificación: ligera inclinación 3D con el puntero (profundidad) --- */
  const Tilt = (() => {
    if (RM || !hasPointer) return { reset() {} };
    let raf = 0, rx = 0, ry = 0;
    const apply = () => {
      raf = 0;
      notice.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      notice.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    };
    window.addEventListener('pointermove', (e) => {
      if (phase !== 'notice') return;
      rx = -(e.clientY / window.innerHeight - 0.5) * 5;
      ry = (e.clientX / window.innerWidth - 0.5) * 7;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    return { reset() { rx = ry = 0; apply(); } };
  })();

  /* --- Secuencia "MEMORY RESTORED": los fragmentos de cristal se reúnen antes de abrir la carta.
         Se puede saltar con un clic o con Esc. --- */
  const MemorySeq = (() => {
    const root = $('#mseq'), nEl = $('#mseq-n'), pctEl = $('#mseq-pct'), barEl = $('#mseq-bar');
    let skipped = false, wake = null;
    const sleep = (ms) => new Promise((res) => {
      if (skipped) return res();
      const id = setTimeout(res, RM ? ms * 0.6 : ms);
      wake = () => { clearTimeout(id); res(); };
    });
    const set = (n, pct) => { nEl.textContent = n; pctEl.textContent = pct + '%'; barEl.style.transform = `scaleX(${pct / 100})`; };
    root.addEventListener('click', () => MemorySeq.skip());

    return {
      skip() { skipped = true; if (wake) wake(); },
      async play() {
        skipped = false;
        set(1, 0);
        root.classList.remove('is-out', 'is-done');
        root.hidden = false; void root.offsetWidth;
        root.classList.add('is-on');
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        const stream = setInterval(() => FX.converge(cx, cy, 3), 60);     // partículas que se funden en el centro
        await sleep(1150); set(2, 33); FX.burst(cx, cy, 16);
        await sleep(350);  set(3, 66); FX.burst(cx, cy, 16);
        await sleep(350);  set(3, 100); root.classList.add('is-done'); FX.burst(cx, cy, 90);
        clearInterval(stream);
        await sleep(560);
        root.classList.add('is-out');
      },
      async end() {
        await wait(600);
        root.hidden = true;
        root.classList.remove('is-on', 'is-out', 'is-done');
      },
    };
  })();

  /* --- ventanas --- */
  function showWin(win) {
    win.hidden = false;
    win.classList.remove('is-closing');
    void win.offsetWidth; // reinicia la animación
    win.classList.add('is-open');
  }
  async function hideWin(win) {
    win.classList.remove('is-open');
    win.classList.add('is-closing');
    await wait(500);
    win.hidden = true;
    win.classList.remove('is-closing');
  }

  /* --- texto tipo máquina de escribir --- */
  let typeRun = 0;
  async function typeText(el, text, speed = 34) {
    const run = ++typeRun;
    if (RM) { el.textContent = text; return; }
    el.textContent = '';
    for (let i = 1; i <= text.length; i++) {
      if (run !== typeRun) return;
      el.textContent = text.slice(0, i);
      await wait(speed);
    }
  }

  /* --- 1) el cristal termina de descender --- */
  function ready() {
    if (phase !== 'intro') return;
    phase = 'ready';
    FX.state.ready = true;
    gemBtn.disabled = false;
    document.body.classList.add('is-ready');
  }
  gemWrap.addEventListener('animationend', (e) => {
    if (e.target === gemWrap && e.animationName === 'gem-descend') ready();
  });
  setTimeout(ready, RM ? 400 : 5200); // respaldo por si el navegador no dispara animationend

  /* --- 2) clic en el cristal --- */
  async function unlock() {
    if (phase !== 'ready') return;

     Music.start();

    phase = 'unlocking';

    const r = gemBtn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    gemWrap.classList.add('charging');
    FX.state.charging = true;
    const iv = setInterval(() => FX.converge(cx, cy, 5), 45);
    await wait(850);
    clearInterval(iv);

    flash.classList.add('on');
    FX.burst(cx, cy, 80);
    await wait(260);

    gemWrap.classList.add('released');
    await wait(430);
    document.body.classList.add('has-win');   // el aviso empieza a abrirse mientras la gema aún se disuelve (sin hueco vacío)
    showWin(notice);
    await wait(270);
    gemWrap.hidden = true;
    FX.state.hidden = true; FX.state.charging = false;
    flash.classList.remove('on');
    setTimeout(() => { if (phase === 'notice') FX.edge(notice.getBoundingClientRect(), 50); }, 500);
    notice.focus({ preventScroll: true });
    phase = 'notice';
    await wait(750);
    if (phase === 'notice') typeText(typed, 'A special memory has arrived.');
  }
  gemBtn.addEventListener('click', unlock);

  /* --- 3) OPEN MEMORY → carta --- */
  async function toLetter() {
    if (phase !== 'notice') return;
    phase = 'transition';
    typeRun++; // detiene el tecleo si seguía en curso
    openBtn.classList.add('is-fired'); // destello al hacer clic
    // la música comienza al abrir la carta (dentro del clic del usuario)
    typed.textContent = 'A special memory has arrived.';
    FX.burst(window.innerWidth / 2, window.innerHeight / 2, 36);
    Tilt.reset();
    await hideWin(notice);
    await MemorySeq.play();      // "MEMORY RESTORED": los fragmentos se reúnen
    await openLetter(true);      // primera apertura: el recuerdo se desbloquea
    MemorySeq.end();
  }
  openBtn.addEventListener('click', toLetter);

  async function openLetter(first = false) {
    phase = 'letter';
    reopenBtn.hidden = true;
    FX.setMood('xmas');
    letter.classList.toggle('is-unlock', first);
    letter.classList.add('is-stage');
    setTimeout(() => letter.classList.remove('is-stage'), 4200);
    document.body.classList.add('has-win');
    showWin(letter);
    setTimeout(() => { if (phase === 'letter') FX.edge(letter.getBoundingClientRect(), first ? 80 : 40); }, 500);
    Letter.autosize();
    letter.focus({ preventScroll: true });
  }

  /* --- 4) cerrar y volver a abrir la carta --- */
  async function closeLetter() {
    if (phase !== 'letter') return;
    phase = 'closing';
    Letter.flush();
    letter.classList.remove('is-unlock', 'is-stage');   // evita que la animación de apertura se repita al cerrar
    await hideWin(letter);
    phase = 'closed';
    document.body.classList.remove('has-win');
    reopenBtn.hidden = false;
    reopenBtn.focus({ preventScroll: true });
  }
  closeBtn.addEventListener('click', closeLetter);
  closeX.addEventListener('click', closeLetter);

  reopenBtn.addEventListener('click', () => {
    if (phase !== 'closed') return;
    const r = reopenBtn.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height / 3, 28);
    openLetter();
  });

  /* --- teclado: Esc cierra la carta · Tab queda dentro de la ventana --- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && phase === 'transition') { MemorySeq.skip(); return; }
    if (e.key === 'Escape' && phase === 'letter') { closeLetter(); return; }
    if (e.key !== 'Tab') return;
    const win = phase === 'notice' ? notice : phase === 'letter' ? letter : null;
    if (!win) return;
    const items = [...win.querySelectorAll('button, input, textarea')]
      .filter((el) => !el.disabled && el.getClientRects().length);
    if (!items.length) return;
    const first = items[0], lastEl = items[items.length - 1];
    if (!win.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });

  /* --- imagen opcional: si existe imagenes/cristales/cristal.png se usa en lugar del cristal dibujado --- */
  const probe = new Image();
  probe.onload = () => { gemImg.src = probe.src; gemImg.hidden = false; gemBtn.classList.add('has-img'); };
  probe.src = 'imagenes/cristales/cristal.png';

  /* --- carga: la escena se muestra cuando las imágenes están decodificadas (máx. 3,5 s) --- */
  (function revealWhenReady() {
    const done = () => document.documentElement.classList.remove('js-loading');
    const imgs = [...document.querySelectorAll('#scene img')];
    const one = (im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve());
    Promise.race([Promise.all(imgs.map(one)), new Promise((r) => setTimeout(r, 3500))]).then(done);
    setTimeout(done, 4000);
  })();

  /* --- arranque --- */
  document.querySelectorAll('.year').forEach((el) => { el.textContent = new Date().getFullYear(); });
  bakeAtmosphere();   // niebla y grano de película (texturas procedurales)
  drawStars();
  buildForest();
  initParallax();
  FX.start();

})();
