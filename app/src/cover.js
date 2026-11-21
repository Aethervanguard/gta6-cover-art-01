// Vice Coast Cover Studio — cover render engine.
// Turns photos into GTA-poster style art on a 2D canvas: five-step posterize,
// gradient-map colour grades, Sobel ink outlines, halftone dots, a retro sunset
// sky with palm silhouettes, paper grain, and bold outlined title lettering.
// Everything is drawn by hand here; no Rockstar logo, artwork or font is used.

/** Five-stop colour ramps (dark to light) plus sky, sun and title colours. */
export const GRADES = {
  sunset: { label: 'Vice Sunset', ramp: ['#1b0f2e', '#7b2d8b', '#e84a7f', '#ff9e57', '#ffe9a8'], sky: ['#ff9e57', '#e84a7f', '#4a1a6b'], sun: '#ffe9a8', titleMid: '#ff9e57', titleEnd: '#e84a7f', accent: '#ff2ea6' },
  neon: { label: 'Neon Nights', ramp: ['#050510', '#1b1b4d', '#7c3aed', '#c026d3', '#7df9ff'], sky: ['#22d3ee', '#7c3aed', '#0b0b2e'], sun: '#f0abfc', titleMid: '#22d3ee', titleEnd: '#c026d3', accent: '#22d3ee' },
  gold: { label: 'Palm Gold', ramp: ['#201505', '#7a4a12', '#d98e2b', '#f6c453', '#fff3c4'], sky: ['#f6c453', '#e07840', '#5b2a12'], sun: '#fff3c4', titleMid: '#f6c453', titleEnd: '#d98e2b', accent: '#f6c453' },
  teal: { label: 'Miami Teal', ramp: ['#03252b', '#0b5563', '#0ea5a5', '#5eead4', '#e6fffa'], sky: ['#5eead4', '#0ea5a5', '#083344'], sun: '#e6fffa', titleMid: '#5eead4', titleEnd: '#0ea5a5', accent: '#5eead4' },
  bubble: { label: 'Bubblegum', ramp: ['#2b0a2e', '#8b1e6b', '#ef476f', '#ffb3c6', '#fff0f3'], sky: ['#ffb3c6', '#ef476f', '#5b1040'], sun: '#fff0f3', titleMid: '#ffb3c6', titleEnd: '#ef476f', accent: '#ff7ad9' },
};

/** Panel maps per layout. Rects are fractions of the cover; rot is degrees. */
export const LAYOUTS = {
  hero3: { label: 'Hero + 3', sky: false, tilt: false, panels: [
    { x: 0, y: 0, w: 0.63, h: 0.74, rot: 0 }, { x: 0.63, y: 0, w: 0.37, h: 0.37, rot: 0 },
    { x: 0.63, y: 0.37, w: 0.37, h: 0.37, rot: 0 }, { x: 0, y: 0.74, w: 1, h: 0.26, rot: 0 } ] },
  grid4: { label: 'Grid 4', sky: false, tilt: false, panels: [
    { x: 0, y: 0, w: 0.5, h: 0.5, rot: 0 }, { x: 0.5, y: 0, w: 0.5, h: 0.5, rot: 0 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5, rot: 0 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5, rot: 0 } ] },
  fullbleed: { label: 'Full bleed', sky: false, tilt: false, panels: [
    { x: 0, y: 0, w: 1, h: 1, rot: 0 } ] },
  tilt: { label: 'Tilted snaps', sky: true, tilt: true, panels: [
    { x: 0.05, y: 0.08, w: 0.44, h: 0.5, rot: -4 }, { x: 0.52, y: 0.05, w: 0.43, h: 0.54, rot: 3 },
    { x: 0.27, y: 0.52, w: 0.48, h: 0.4, rot: -1 } ] },
  triptych: { label: 'Triptych', sky: false, tilt: false, panels: [
    { x: 0, y: 0, w: 0.333, h: 1, rot: 0 }, { x: 0.333, y: 0, w: 0.334, h: 1, rot: 0 },
    { x: 0.667, y: 0, w: 0.333, h: 1, rot: 0 } ] },
  strip: { label: 'Comic strip', sky: false, tilt: false, panels: [
    { x: 0, y: 0, w: 1, h: 0.56, rot: 0 }, { x: 0, y: 0.56, w: 0.333, h: 0.44, rot: 0 },
    { x: 0.333, y: 0.56, w: 0.334, h: 0.44, rot: 0 }, { x: 0.667, y: 0.56, w: 0.333, h: 0.44, rot: 0 } ] },
};

export const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };
export const INK = '#160a24';

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpRgb(a, b, f) {
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

let halftonePattern = null;
let grainPattern = null;

function getHalftonePattern() {
  if (halftonePattern) return halftonePattern;
  const tile = document.createElement('canvas');
  tile.width = 14; tile.height = 14;
  const t = tile.getContext('2d');
  t.fillStyle = '#000';
  t.beginPath(); t.arc(7, 7, 2.1, 0, Math.PI * 2); t.fill();
  halftonePattern = tile;
  return tile;
}

function getGrainPattern() {
  if (grainPattern) return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = 140; tile.height = 140;
  const t = tile.getContext('2d');
  const id = t.createImageData(140, 140);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  t.putImageData(id, 0, 0);
  grainPattern = tile;
  return tile;
}

/**
 * Posterizes one photo into a panel: cover-fit crop, five-step posterize,
 * gradient-map grade, Sobel ink outlines, halftone print dots.
 * `crop` is { zoom, x, y }; grade is one of GRADES.
 */
export function posterizePanelWithGrade(img, pw, ph, crop, grade) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(pw));
  c.height = Math.max(2, Math.round(ph));
  const x = c.getContext('2d');
  if (!img) {
    const g = x.createLinearGradient(0, 0, 0, ph);
    const ramp = grade.ramp;
    g.addColorStop(0, ramp[1]); g.addColorStop(0.55, ramp[2]); g.addColorStop(1, ramp[0]);
    x.fillStyle = g; x.fillRect(0, 0, pw, ph);
    x.fillStyle = 'rgba(255,255,255,0.9)';
    x.font = `900 ${Math.round(ph * 0.09)}px "Arial Black", Arial, sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('LOAD A PHOTO', pw / 2, ph / 2);
    return c;
  }
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * crop.zoom;
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  x.drawImage(img, (pw - dw) / 2 + crop.x * pw, (ph - dh) / 2 + crop.y * ph, dw, dh);
  const w = c.width, h = c.height;
  const id = x.getImageData(0, 0, w, h);
  const d = id.data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < lum.length; i++) {
    lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }
  const ramp = grade.ramp.map(hexToRgb);
  const ink = hexToRgb(INK);
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = py * w + px, o = i * 4;
      const L = lum[i] / 255;
      // Gradient map: luminance picks a colour on the five-stop ramp.
      const pos = L * 4;
      const lo = Math.min(3, Math.floor(pos));
      const gr = lerpRgb(ramp[lo], ramp[lo + 1], pos - lo);
      // Posterized original colour, kept at 30% so the photo stays itself.
      const pr = Math.round(d[o] / 255 * 4) / 4 * 255;
      const pg = Math.round(d[o + 1] / 255 * 4) / 4 * 255;
      const pb = Math.round(d[o + 2] / 255 * 4) / 4 * 255;
      let r = gr[0] * 0.7 + pr * 0.3;
      let g = gr[1] * 0.7 + pg * 0.3;
      let b = gr[2] * 0.7 + pb * 0.3;
      // Sobel ink outline: strong luminance edges pull toward ink.
      if (px > 0 && px < w - 1 && py > 0 && py < h - 1) {
        const gx = lum[i + 1] - lum[i - 1] + lum[i + w + 1] - lum[i + w - 1] + lum[i - w + 1] - lum[i - w - 1];
        const gy = lum[i + w] - lum[i - w] + lum[i + w + 1] - lum[i - w + 1] + lum[i + w - 1] - lum[i - w - 1];
        const e = (Math.abs(gx) + Math.abs(gy)) / 255;
        if (e > 0.28) {
          const f = Math.min(1, (e - 0.28) * 2.2) * 0.85;
          r = r * (1 - f) + ink[0] * f;
          g = g * (1 - f) + ink[1] * f;
          b = b * (1 - f) + ink[2] * f;
        }
      }
      d[o] = r; d[o + 1] = g; d[o + 2] = b;
    }
  }
  x.putImageData(id, 0, 0);
  x.globalAlpha = 0.09;
  x.fillStyle = x.createPattern(getHalftonePattern(), 'repeat');
  x.fillRect(0, 0, w, h);
  x.globalAlpha = 1;
  return c;
}

/** A retro striped sun: gradient disc with sky-coloured slice gaps. */
export function drawRetroSun(ctx, cx, cy, r, grade) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, grade.sun); g.addColorStop(0.6, grade.sky[0]); g.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = grade.sky[1];
  let y = cy + r * 0.05, gap = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.16;
    gap *= 1.35;
  }
  ctx.restore();
}

/** One palm tree silhouette: curved trunk and drooping fronds. */
export function drawPalmSilhouette(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.55, x + s * 0.02, y - s);
  ctx.stroke();
  const cx = x + s * 0.02, cy = y - s;
  ctx.lineWidth = s * 0.045;
  const fronds = [[-1, -0.05], [-0.75, -0.4], [-0.3, -0.65], [0.25, -0.6], [0.7, -0.35], [1, 0.05], [-0.55, 0.4], [0.55, 0.45]];
  for (const [fx, fy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + fx * s * 0.55, cy + fy * s * 0.45, cx + fx * s * 0.9, cy + fy * s * 0.8 + s * 0.38);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** Sunset sky: vertical gradient, retro sun, halftone dots low down, palms. */
export function drawSunsetSky(ctx, w, h, grade) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, grade.sky[0]); g.addColorStop(0.55, grade.sky[1]); g.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  drawRetroSun(ctx, w * 0.72, h * 0.3, Math.min(w, h) * 0.17, grade);
  // Halftone dots fading down the sky.
  ctx.fillStyle = 'rgba(22,10,36,0.35)';
  const cell = Math.max(10, w * 0.012);
  for (let row = 0, y = h * 0.52; y < h; y += cell, row++) {
    for (let x = cell / 2; x < w; x += cell) {
      const r = Math.min(cell * 0.42, cell * 0.1 + row * cell * 0.045);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  drawPalmSilhouette(ctx, w * 0.02, h * 1.0, h * 0.2, 'rgba(18,6,30,0.9)');
  drawPalmSilhouette(ctx, w * 0.98, h * 1.0, h * 0.16, 'rgba(18,6,30,0.85)');
}

/** Fits the title to the cover width, returns the font size. */
export function fitTitleSize(ctx, title, w, h) {
  let size = h * 0.115;
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  while (ctx.measureText(title).width > w * 0.94 && size > 10) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  }
  return size;
}

/** Title block: dark band, halftone dots, outlined gradient title, neon subtitle. */
export function drawTitleBlock(ctx, state, w, h, grade) {
  const bandH = h * 0.3;
  const g = ctx.createLinearGradient(0, h - bandH, 0, h);
  g.addColorStop(0, 'rgba(20,6,32,0)');
  g.addColorStop(0.45, 'rgba(20,6,32,0.55)');
  g.addColorStop(1, 'rgba(20,6,32,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, h - bandH, w, bandH);
  // Halftone dots growing down the band.
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  const cell = Math.max(9, w * 0.011);
  for (let row = 0, y = h - bandH * 0.85; y < h - bandH * 0.12; y += cell, row++) {
    for (let x = cell / 2; x < w; x += cell) {
      const r = Math.min(cell * 0.4, cell * 0.08 + row * cell * 0.05);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const size = fitTitleSize(ctx, title, w, h);
    ctx.save();
    ctx.translate(w / 2, h - bandH * 0.42);
    ctx.rotate(-0.028);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch (err) { /* older canvas: no letter spacing */ }
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = INK;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(title, 0, 0);
    const fg = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
    fg.addColorStop(0, '#fff7d6');
    fg.addColorStop(0.5, grade.titleMid);
    fg.addColorStop(1, grade.titleEnd);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = fg;
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(12, h * 0.032);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `italic 700 ${subSize}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = subSize * 0.7;
    ctx.fillText(sub, w / 2, h - bandH * 0.1);
    ctx.restore();
  }
}

/** Small gold star badge, top-right corner. */
export function drawStarBadge(ctx, w, h) {
  const r = Math.min(w, h) * 0.055;
  const cx = w - r * 1.5, cy = r * 1.5;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f6c453'; ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = `900 ${r * 0.95}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('★', cx, cy + r * 0.05);
  ctx.font = `700 ${Math.max(8, r * 0.24)}px Arial, sans-serif`;
  ctx.fillText('LEONIDA', cx, cy + r * 1.35);
  ctx.restore();
}

function drawPaperGrainAndVignette(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(getGrainPattern(), 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(10,4,20,0)');
  v.addColorStop(1, 'rgba(10,4,20,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Renders the whole cover onto `canvas` at its own size.
 * `state` is { layout, grade, title, subtitle, panels: [{ photo, zoom, x, y }] },
 * `photos` is an array of up to 3 Image objects (or null).
 */
export function renderCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero3;
  ctx.fillStyle = '#2b1838';
  ctx.fillRect(0, 0, w, h);
  if (layout.sky) drawSunsetSky(ctx, w, h, grade);
  const frame = Math.max(3, w * 0.008);
  layout.panels.forEach((panel, i) => {
    const crop = state.panels[i] || { photo: 0, zoom: 1.15, x: 0, y: 0 };
    const pw = panel.w * w, ph = panel.h * h;
    const img = photos[crop.photo] || null;
    const art = posterizePanelWithGrade(img, pw, ph, crop, grade);
    const cx = (panel.x + panel.w / 2) * w, cy = (panel.y + panel.h / 2) * h;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((panel.rot * Math.PI) / 180);
    if (layout.tilt) {
      ctx.fillStyle = '#fff8ee';
      ctx.fillRect(-pw / 2 - frame, -ph / 2 - frame, pw + frame * 2, ph + frame * 2);
      ctx.drawImage(art, -pw / 2, -ph / 2, pw, ph);
      ctx.strokeStyle = 'rgba(22,10,36,0.6)';
      ctx.lineWidth = Math.max(1, frame * 0.25);
      ctx.strokeRect(-pw / 2 - frame, -ph / 2 - frame, pw + frame * 2, ph + frame * 2);
    } else {
      ctx.drawImage(art, -pw / 2, -ph / 2, pw, ph);
      ctx.strokeStyle = '#fff8ee';
      ctx.lineWidth = frame;
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      ctx.strokeStyle = 'rgba(22,10,36,0.85)';
      ctx.lineWidth = Math.max(1, frame * 0.22);
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
    }
    ctx.restore();
  });
  drawTitleBlock(ctx, state, w, h, grade);
  drawStarBadge(ctx, w, h);
  drawPaperGrainAndVignette(ctx, w, h);
}

/** Renders the cover at an export size and returns the fresh canvas. */
export function renderCoverToCanvas(state, photos, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  renderCover(canvas, state, photos);
  return canvas;
}
