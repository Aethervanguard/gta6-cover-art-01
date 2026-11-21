// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo
// loaded; ?shot=cover shows the exported cover alone, full frame, at the size
// the query names. `photo` picks the sample, `caption` the title, `layout`,
// `grade`, `size` and `subtitle` the rest of the look.
// window.__shotReady is set once the scene has painted.
import { SIZES } from './cover.js';

function applyQueryState(query, setState, state) {
  const next = JSON.parse(JSON.stringify(state));
  const layout = query.get('layout');
  if (layout) next.layout = layout;
  const grade = query.get('grade');
  if (grade) next.grade = grade;
  const caption = query.get('caption');
  if (caption !== null) next.title = caption;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) next.subtitle = subtitle;
  const size = query.get('size');
  if (size && SIZES[size]) next.size = size;
  const panelPhoto = query.get('panelPhoto');
  if (panelPhoto !== null) {
    const slot = Number(panelPhoto);
    next.panels.forEach((p) => { p.photo = slot; });
  }
  setState(next);
  return next;
}

export async function runShot(shot, query, state, photos, loadImage, syncControls, redraw, setState) {
  const canvas = document.getElementById('cover');
  const sample = query.get('photo') ?? 'pier';
  const next = applyQueryState(query, setState, state);
  const [imgA, imgB] = await Promise.all([
    loadImage(`samples/${sample}.jpg`),
    loadImage(`samples/${sample === 'pier' ? 'boulevard' : 'pier'}.jpg`),
  ]);
  photos[0] = imgA;
  photos[1] = imgB;
  photos[2] = imgA;
  syncControls();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const [w, h] = SIZES[next.size] || SIZES['1920x1080'];
    canvas.width = w;
    canvas.height = h;
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
