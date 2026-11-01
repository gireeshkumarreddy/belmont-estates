// The nearby-places map: pick a type of place, then a place, and see where it sits from Belmont.
// Places, numbers and positions come from the Belmont Area Attractions Map (09/24), which is not to scale.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const SVG = 'http://www.w3.org/2000/svg';

const CATEGORIES = [
  { id: 'schools', label: 'Schools', colour: '#C7B36D', ink: '#33383B' },
  { id: 'daycares', label: 'Daycares', colour: '#6F9E95', ink: '#FAFAF4' },
  { id: 'medical', label: 'Medical', colour: '#98B5AD', ink: '#33383B' },
  { id: 'grocery', label: 'Grocery', colour: '#8A6636', ink: '#FAFAF4' },
  { id: 'shopping', label: 'Shopping', colour: '#45506B', ink: '#FAFAF4' },
  { id: 'entertainment', label: 'Entertainment', colour: '#5F6B6A', ink: '#FAFAF4' },
  { id: 'parks', label: 'Museums and parks', colour: '#4F6E62', ink: '#FAFAF4' },
  { id: 'hardware', label: 'Hardware', colour: '#E4CDA6', ink: '#33383B' }
];
const PLACES = [
  [1, 'Huggins Elementary', 'schools', 127, 441], [2, 'Roberts Middle School', 'schools', 152, 461],
  [3, 'Dean Leaman Junior High', 'schools', 138, 421], [4, 'Fulshear High School', 'schools', 148, 441],
  [5, 'Houston Methodist West Hospital', 'medical', 586, 228], [6, 'Memorial Hermann Katy Hospital', 'medical', 375, 228],
  [7, 'Kelsey-Seybold Clinic', 'medical', 448, 464], [8, 'LaCenterra at Cinco Ranch', 'entertainment', 370, 355],
  [9, 'Cinemark 19 & XD', 'entertainment', 424, 228], [10, 'Typhoon Texas Waterpark', 'entertainment', 357, 278],
  [11, 'H-E-B', 'grocery', 208, 352], [12, 'Kroger', 'grocery', 375, 421], [13, 'Walmart Supercenter', 'grocery', 251, 425],
  [14, 'Ace Hardware', 'hardware', 128, 463], [15, 'The Home Depot', 'hardware', 379, 395], [16, "Lowe's Home Improvement", 'hardware', 344, 429],
  [17, 'Kiddie Academy of Fulshear', 'daycares', 245, 334], [18, 'The Goddard School', 'daycares', 110, 495],
  [19, 'Fulshear Early Learning Center', 'daycares', 89, 456], [20, 'Fort Bend Museum', 'parks', 587, 668],
  [21, 'George Ranch Historical Park', 'parks', 578, 695], [22, 'Katy Heritage Museum', 'parks', 325, 220],
  [23, 'Jones Creek Ranch Park', 'parks', 508, 678], [24, 'LaCenterra at Cinco Ranch', 'shopping', 384, 364],
  [25, 'The Shops at Bella Terra', 'shopping', 415, 519], [26, 'Katy Mills Mall', 'shopping', 308, 291],
  [27, 'Costco', 'shopping', 384, 265], [28, "Fulshear Farmers' Market", 'shopping', 135, 495]
].map(([id, name, type, x, y]) => ({ id, name, type, x, y }));
const HOME = { x: 207, y: 577 };
const FULL = { x: 20, y: 180, w: 740, h: 540 };
const ROADS = [
  ['I-10', 180, 272, 'shield'], ['I-10', 488, 250, 'shield'], ['99', 400, 338], ['99', 563, 583], ['6', 671, 338],
  ['359', 62, 389], ['359', 253, 561], ['1463', 222, 406], ['1093', 196, 467], ['Westpark Tollway', 560, 431],
  ['Texas Heritage Pkwy', 143, 322, 'street'], ["Bois D'Arc Ln", 150, 545, 'street']
];

const byId = id => PLACES.find(place => place.id === id);
const typeOf = id => CATEGORIES.find(category => category.id === id);
const el = (name, attrs = {}) => {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

export function setupAreaMap() {
  const root = $('#area-map');
  if (!root) return { focus() {} };
  const svg = $('.am-svg', root), stage = $('.am-stage', root), pinsLayer = $('#am-pins'), labelsLayer = $('#am-labels');
  const route = $('#am-route'), card = $('#am-card'), filters = $('#am-filters'), list = $('#am-list');
  let filter = 'all', selected = null, view = { ...FULL }, unit = 1, frame = 0;
  const scaled = [];

  // Road names and route shields keep their size at any zoom.
  for (const [text, x, y, kind] of ROADS) {
    const group = el('g', { class: `am-road-label am-${kind || 'route'}` });
    if (kind === 'street') {
      const label = el('text', { transform: 'rotate(-90)', 'text-anchor': 'middle', dy: '3' });
      label.textContent = text;
      group.append(label);
    } else {
      const width = Math.max(26, text.length * 6.4 + 12);
      group.append(el('rect', { x: -width / 2, y: -9, width, height: 18, rx: kind === 'shield' ? 9 : 3 }));
      const label = el('text', { 'text-anchor': 'middle', dy: '3.6' });
      label.textContent = text;
      group.append(label);
    }
    labelsLayer.append(group);
    scaled.push({ node: group, x, y });
  }

  const home = el('g', { class: 'am-home' });
  home.append(el('circle', { r: 21 }), el('image', { href: 'assets/logo/icon.svg', x: -10, y: -11.5, width: 20, height: 22 }));
  const homeLabel = el('text', { y: 36, 'text-anchor': 'middle' });
  homeLabel.textContent = 'Belmont Estates';
  home.append(homeLabel);
  pinsLayer.append(home);
  scaled.push({ node: home, x: HOME.x, y: HOME.y });

  const pins = new Map();
  for (const place of PLACES) {
    const type = typeOf(place.type);
    const pin = el('g', { class: 'am-pin', 'data-id': place.id, style: `--c:${type.colour};--i:${type.ink}` });
    pin.append(el('circle', { r: 10.5 }));
    const number = el('text', { 'text-anchor': 'middle', dy: '3.8' });
    number.textContent = place.id;
    pin.append(number);
    pinsLayer.append(pin);
    pins.set(place.id, pin);
    scaled.push({ node: pin, x: place.x, y: place.y });
  }

  filters.innerHTML = [{ id: 'all', label: 'All places' }, ...CATEGORIES].map(category => {
    const count = category.id === 'all' ? PLACES.length : PLACES.filter(place => place.type === category.id).length;
    const swatch = category.colour ? `<i style="--c:${category.colour}"></i>` : '';
    return `<button type="button" class="am-chip" data-filter="${category.id}" aria-pressed="${category.id === 'all'}">${swatch}${category.label}<small>${count}</small></button>`;
  }).join('');

  const tip = document.createElement('p');
  tip.className = 'am-tip';
  tip.hidden = true;
  stage.append(tip);

  /* ----- drawing ----- */
  function applyView() {
    svg.setAttribute('viewBox', `${view.x.toFixed(2)} ${view.y.toFixed(2)} ${view.w.toFixed(2)} ${view.h.toFixed(2)}`);
    const box = svg.getBoundingClientRect();
    unit = box.width ? Math.max(view.w / box.width, view.h / box.height) : 1;
    for (const item of scaled) item.node.setAttribute('transform', `translate(${item.x} ${item.y}) scale(${unit.toFixed(4)})`);
  }
  function animateTo(target) {
    cancelAnimationFrame(frame);
    if (reducedMotion.matches) { view = { ...target }; applyView(); return; }
    const from = { ...view }, start = performance.now(), duration = 760;
    const step = now => {
      const t = Math.min(1, (now - start) / duration), k = 1 - (1 - t) ** 3;
      for (const key of ['x', 'y', 'w', 'h']) view[key] = from[key] + (target[key] - from[key]) * k;
      applyView();
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }
  // Frame a set of points (always with Belmont in view), padded and kept to the stage's shape.
  function fit(points) {
    const all = [...points, HOME];
    let minX = Math.min(...all.map(p => p.x)), maxX = Math.max(...all.map(p => p.x));
    let minY = Math.min(...all.map(p => p.y)), maxY = Math.max(...all.map(p => p.y)) + 46;
    const box = stage.getBoundingClientRect(), ratio = box.width / Math.max(1, box.height) || FULL.w / FULL.h;
    let w = Math.max(maxX - minX + 110, 230), h = Math.max(maxY - minY + 110, 230 / ratio);
    if (w / h > ratio) h = w / ratio; else w = h * ratio;
    w = Math.min(w, FULL.w * 1.05); h = Math.min(h, FULL.h * 1.05);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const x = Math.min(Math.max(cx - w / 2, FULL.x - 20), FULL.x + FULL.w - w + 20);
    const y = Math.min(Math.max(cy - h / 2, FULL.y - 20), FULL.y + FULL.h - h + 20);
    return { x, y, w, h };
  }
  const visible = () => PLACES.filter(place => filter === 'all' || place.type === filter);

  function renderList() {
    const groups = filter === 'all' ? CATEGORIES : [typeOf(filter)];
    list.innerHTML = groups.map(category => {
      const items = PLACES.filter(place => place.type === category.id).map(place => `
        <li><button type="button" data-id="${place.id}" aria-pressed="${place.id === selected}" style="--c:${category.colour};--i:${category.ink}">
          <span class="am-num">${place.id}</span><span>${place.name}</span></button></li>`).join('');
      return filter === 'all' ? `<li class="am-group" aria-hidden="true">${category.label}</li>${items}` : items;
    }).join('');
  }
  function setFilter(id, { keepSelection = false } = {}) {
    filter = id;
    root.dataset.filter = id;
    $$('.am-chip', filters).forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.filter === id)));
    for (const place of PLACES) pins.get(place.id).classList.toggle('is-dim', id !== 'all' && place.type !== id);
    if (!keepSelection && selected && byId(selected).type !== id && id !== 'all') select(null);
    renderList();
    animateTo(id === 'all' ? FULL : fit(visible()));
  }
  function drawRoute(place) {
    if (!place) { route.classList.remove('on'); return; }
    const dx = place.x - HOME.x, dy = place.y - HOME.y, length = Math.hypot(dx, dy);
    const cx = (HOME.x + place.x) / 2 - dy * .18, cy = (HOME.y + place.y) / 2 + dx * .18;
    route.setAttribute('d', `M${HOME.x} ${HOME.y}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${place.x} ${place.y}`);
    route.style.setProperty('--len', length.toFixed(0));
    route.classList.remove('on');
    void route.getBoundingClientRect();
    route.classList.add('on');
  }
  function select(id, { frame: reframe = true } = {}) {
    selected = id;
    pins.forEach((pin, key) => pin.classList.toggle('is-on', key === id));
    $$('button[data-id]', list).forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.id) === id)));
    const place = id ? byId(id) : null;
    drawRoute(place);
    if (!place) { card.hidden = true; return; }
    const type = typeOf(place.type);
    card.innerHTML = `
      <span class="am-num" style="--c:${type.colour};--i:${type.ink}">${place.id}</span>
      <div class="am-card-text"><p class="am-card-type">${type.label}</p><p class="am-card-name">${place.name}</p></div>
      <div class="am-card-nav">
        <button type="button" data-step="-1" aria-label="Previous place"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg></button>
        <button type="button" data-step="1" aria-label="Next place"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg></button>
        <button type="button" data-close aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>
      </div>`;
    card.hidden = false;
    if (reframe) animateTo(fit(filter === 'all' ? [place] : visible()));
  }
  function showTip(id) {
    const pin = pins.get(id);
    if (!pin || pin.classList.contains('is-dim')) { tip.hidden = true; return; }
    const box = pin.getBoundingClientRect(), frameBox = stage.getBoundingClientRect();
    tip.textContent = byId(id).name;
    tip.style.left = `${box.left + box.width / 2 - frameBox.left}px`;
    tip.style.top = `${box.top - frameBox.top}px`;
    tip.hidden = false;
  }
  const hot = (id, on) => {
    pins.get(id)?.classList.toggle('is-hot', on);
    $(`button[data-id="${id}"]`, list)?.classList.toggle('is-hot', on);
    if (on) showTip(id); else tip.hidden = true;
  };

  /* ----- events ----- */
  filters.addEventListener('click', event => {
    const chip = event.target.closest('[data-filter]');
    if (chip) setFilter(chip.dataset.filter);
  });
  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-id]');
    if (button) select(Number(button.dataset.id));
  });
  list.addEventListener('pointerover', event => { const b = event.target.closest('button[data-id]'); if (b) hot(Number(b.dataset.id), true); });
  list.addEventListener('pointerout', event => { const b = event.target.closest('button[data-id]'); if (b) hot(Number(b.dataset.id), false); });
  pinsLayer.addEventListener('pointerover', event => { const p = event.target.closest('.am-pin'); if (p) hot(Number(p.dataset.id), true); });
  pinsLayer.addEventListener('pointerout', event => { const p = event.target.closest('.am-pin'); if (p) hot(Number(p.dataset.id), false); });
  pinsLayer.addEventListener('click', event => {
    const pin = event.target.closest('.am-pin');
    if (pin && !pin.classList.contains('is-dim')) select(Number(pin.dataset.id));
  });
  card.addEventListener('click', event => {
    if (event.target.closest('[data-close]')) { select(null); animateTo(filter === 'all' ? FULL : fit(visible())); return; }
    const step = event.target.closest('[data-step]');
    if (!step) return;
    const pool = visible(), index = pool.findIndex(place => place.id === selected);
    select(pool[(index + Number(step.dataset.step) + pool.length) % pool.length].id);
  });
  new ResizeObserver(() => applyView()).observe(stage);

  root.dataset.filter = filter;
  renderList();
  applyView();
  return {
    // Used by the schools section: open the map on one place.
    focus(id) {
      const place = byId(id);
      if (!place) return;
      setFilter(place.type, { keepSelection: true });
      select(id, { frame: false });
    }
  };
}
