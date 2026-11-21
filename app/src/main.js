// Vice Coast Cover Studio — page wiring: photos, layout, grade, caption, panel
// crop, undo/redo, shuffle, PNG export. A `?shot=` query sets up a fixed scene
// for a screenshot instead (see ./shots.js).
import { GRADES, LAYOUTS, SIZES, renderCover, renderCoverToCanvas } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const zoomInput = document.getElementById('zoom');
const shiftXInput = document.getElementById('shiftX');
const shiftYInput = document.getElementById('shiftY');

const LAYOUT_NAMES = Object.keys(LAYOUTS);
const GRADE_NAMES = Object.keys(GRADES);
const TITLES = ['VICE COAST', 'PIER PRESSURE', 'NIGHT SHIFT', 'BOULEVARD QUEEN', 'NEON SHORE', 'SUNSET HEIST', 'PALM ROYALE', 'TURBO VICE'];

function defaultPanels() {
  return [
    { photo: 0, zoom: 1.15, x: 0, y: 0 },
    { photo: 1, zoom: 1.15, x: 0, y: 0 },
    { photo: 0, zoom: 1.25, x: 0, y: 0 },
    { photo: 1, zoom: 1.25, x: 0, y: 0 },
  ];
}

function defaultState() {
  return {
    layout: 'hero3', grade: 'sunset', title: 'VICE COAST', subtitle: 'a Leonida story',
    size: '1080x1080', panel: 0, panels: defaultPanels(),
  };
}

let state = defaultState();
let photos = [null, null, null];
let undoStack = [];
let redoStack = [];
let redrawTimer = 0;

function snapshotState() {
  return JSON.parse(JSON.stringify(state));
}

function pushHistory() {
  undoStack.push(snapshotState());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
}

function applyState(next) {
  state = next;
  syncControls();
  redraw();
}

function panelCount() {
  return LAYOUTS[state.layout].panels.length;
}

function currentCrop() {
  return state.panels[state.panel];
}

function redraw() {
  renderCover(canvas, state, photos);
}

function redrawSoon() {
  clearTimeout(redrawTimer);
  redrawTimer = setTimeout(redraw, 40);
}

function syncControls() {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  document.querySelectorAll('#layoutRow .pick').forEach((b) => b.classList.toggle('is-on', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradeRow .pick').forEach((b) => b.classList.toggle('is-on', b.dataset.grade === state.grade));
  document.querySelectorAll('#sizeRow .pick').forEach((b) => b.classList.toggle('is-on', b.dataset.size === state.size));
  document.querySelectorAll('#panelRow .pick').forEach((b) => {
    b.classList.toggle('is-on', Number(b.dataset.panel) === state.panel);
    b.disabled = Number(b.dataset.panel) >= panelCount();
  });
  document.querySelectorAll('#panelPhotoRow .pick').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.pphoto) === currentCrop().photo));
  zoomInput.value = currentCrop().zoom;
  shiftXInput.value = currentCrop().x;
  shiftYInput.value = currentCrop().y;
  const [w, h] = SIZES[state.size];
  const previewW = state.size === '1920x1080' ? 960 : 900;
  canvas.width = previewW;
  canvas.height = Math.round((previewW * h) / w);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function loadSample(name, slot) {
  return loadImage(`samples/${name}.jpg`).then((img) => {
    photos[slot] = img;
    redraw();
    status.textContent = `Sample ${name} loaded into Photo ${'ABC'[slot]}.`;
  }).catch(() => {
    status.textContent = `Could not load sample ${name}.`;
  });
}

function bindPhotoInput(id, slot) {
  document.getElementById(id).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pushHistory();
    photos[slot] = await loadImage(URL.createObjectURL(file));
    redraw();
    status.textContent = `Photo ${'ABC'[slot]} loaded: ${file.name}.`;
  });
}

bindPhotoInput('photoA', 0);
bindPhotoInput('photoB', 1);
bindPhotoInput('photoC', 2);
document.getElementById('sampleBoulevard').addEventListener('click', () => { pushHistory(); loadSample('boulevard', 0); });
document.getElementById('samplePier').addEventListener('click', () => { pushHistory(); loadSample('pier', 1); });

document.getElementById('layoutRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout]');
  if (!b) return;
  pushHistory();
  state.layout = b.dataset.layout;
  if (state.panel >= panelCount()) state.panel = 0;
  syncControls();
  redraw();
});

document.getElementById('gradeRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grade]');
  if (!b) return;
  pushHistory();
  state.grade = b.dataset.grade;
  syncControls();
  redraw();
});

document.getElementById('sizeRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-size]');
  if (!b) return;
  state.size = b.dataset.size;
  syncControls();
  redraw();
});

document.getElementById('panelRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-panel]');
  if (!b || b.disabled) return;
  state.panel = Number(b.dataset.panel);
  syncControls();
});

document.getElementById('panelPhotoRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pphoto]');
  if (!b) return;
  pushHistory();
  currentCrop().photo = Number(b.dataset.pphoto);
  syncControls();
  redraw();
});

function cropChanged() {
  currentCrop().zoom = Number(zoomInput.value);
  currentCrop().x = Number(shiftXInput.value);
  currentCrop().y = Number(shiftYInput.value);
  redrawSoon();
}
zoomInput.addEventListener('input', cropChanged);
shiftXInput.addEventListener('input', cropChanged);
shiftYInput.addEventListener('input', cropChanged);
for (const input of [zoomInput, shiftXInput, shiftYInput]) {
  input.addEventListener('change', () => pushHistory());
}

titleInput.addEventListener('input', () => { state.title = titleInput.value; redrawSoon(); });
titleInput.addEventListener('change', () => pushHistory());
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redrawSoon(); });
subtitleInput.addEventListener('change', () => pushHistory());

document.getElementById('undo').addEventListener('click', () => {
  const prev = undoStack.pop();
  if (!prev) { status.textContent = 'Nothing to undo.'; return; }
  redoStack.push(snapshotState());
  applyState(prev);
  status.textContent = 'Undone.';
});
document.getElementById('redo').addEventListener('click', () => {
  const next = redoStack.pop();
  if (!next) { status.textContent = 'Nothing to redo.'; return; }
  undoStack.push(snapshotState());
  applyState(next);
  status.textContent = 'Redone.';
});

document.getElementById('randomize').addEventListener('click', () => {
  pushHistory();
  state.layout = LAYOUT_NAMES[Math.floor(Math.random() * LAYOUT_NAMES.length)];
  state.grade = GRADE_NAMES[Math.floor(Math.random() * GRADE_NAMES.length)];
  state.title = TITLES[Math.floor(Math.random() * TITLES.length)];
  if (state.panel >= panelCount()) state.panel = 0;
  syncControls();
  redraw();
  status.textContent = `Shuffled: ${LAYOUTS[state.layout].label} + ${GRADES[state.grade].label}.`;
});

/** Exports the cover at the chosen size as a PNG download. */
export function exportCoverPNG() {
  const [w, h] = SIZES[state.size];
  const out = renderCoverToCanvas(state, photos, w, h);
  return new Promise((resolve) => {
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-coast-${state.size}.png`;
      a.click();
      status.textContent = `Saved vice-coast-${state.size}.png (${w} x ${h}).`;
      resolve({ width: w, height: h, bytes: blob ? blob.size : 0 });
    }, 'image/png');
  });
}
document.getElementById('export').addEventListener('click', exportCoverPNG);

// Test hook for the maker: renders at a size and reports the PNG data URL size.
window.__viceCoast = {
  state: () => snapshotState(),
  photosLoaded: () => photos.filter(Boolean).length,
  renderDataURL(size) {
    const [w, h] = SIZES[size] || SIZES['1080x1080'];
    const out = renderCoverToCanvas(state, photos, w, h);
    return { width: w, height: h, dataUrlLength: out.toDataURL('image/png').length };
  },
};

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, photos, loadImage, syncControls, redraw, (next) => { state = next; });
} else {
  syncControls();
  redraw();
  // Boot with both free samples so the first paint already shows cover art.
  loadSample('boulevard', 0);
  loadSample('pier', 1);
}
