// The master plan once the clouds clear: a 2D plan to drag and zoom, or the 3D model built in Blender.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const coarse = matchMedia('(hover: none), (pointer: coarse)');

// Points of interest, traced on the 2000 x 1445 site plan; labels follow the Clark Condon legend.
export const SPOTS = [
  { id: 'main-entry', x: 34, y: 425, title: 'Main entry', text: "Bois D'Arc Road at Preakness Stakes Drive: a stone tower and wall, raised planters, signage and lighting." },
  { id: 'secondary-entry', x: 48, y: 985, title: 'Secondary entry', text: "A second way in from Bois D'Arc Road, onto Belmont Stakes Drive." },
  { id: 'preakness', x: 1246, y: 716, title: 'Preakness Stakes Drive', text: 'The main street, from the entry past the ponds to Count Fleet Lane.' },
  { id: 'count-fleet', x: 1482, y: 900, title: 'Count Fleet Lane', text: 'Joins Preakness Stakes Drive to Belmont Stakes Drive.' },
  { id: 'belmont-stakes', x: 900, y: 1104, title: 'Belmont Stakes Drive', text: 'The long southern street, with homesites on both sides.' },
  { id: 'ponds', x: 900, y: 912, title: 'Ponds', text: 'Long detention ponds with fountains run between the streets.' },
  { id: 'trails', x: 1300, y: 470, title: 'Walking trails', text: 'Trails follow the greenbelts and loop the north lake.' },
  { id: 'bench', x: 1730, y: 800, title: 'Bench pads', text: 'Places to stop and sit along the trails.' },
  { id: 'homesites', x: 1222, y: 1172, title: 'Two-acre homesites', text: 'Seventy-five homesites of about two acres each.' },
  { id: 'walk', x: 1830, y: 1290, title: 'Future walk connections', text: 'Planned links from the trails to future walkways.' }
];

const HINTS = {
  '2d': 'Drag to move around. Pinch or hold Ctrl and scroll to zoom.',
  '3d': 'Drag to turn the model, right-drag to slide it. Pinch or hold Ctrl and scroll to zoom.'
};

export function setupPlan() {
  const section = $('#master-plan');
  if (!section) return;
  const viewport = $('#plan-viewport'), board = $('#plan-board'), pinsBox = $('#plan-pins');
  const ui = $('#plan-ui'), info = $('#plan-info'), hint = $('#plan-hint'), holder = $('#plan-3d');
  const state = { x: 0, y: 0, k: 1 };
  let mode = '2d', ready = false, exploring = false, viewer = null, loading = null, activeSpot = null;
  const live = () => ready && (!coarse.matches || exploring);

  pinsBox.innerHTML = SPOTS.map(spot => `<button type="button" class="plan-pin${spot.x < 240 ? ' to-east' : ''}" data-spot="${spot.id}" style="left:${(spot.x / 20).toFixed(2)}%;top:${(spot.y / 14.45).toFixed(2)}%"><span>${spot.title}</span></button>`).join('');

  /* ----- spots ----- */
  function showSpot(id) {
    activeSpot = id;
    $$('[data-spot]', section).forEach(pin => pin.classList.toggle('is-on', pin.dataset.spot === id));
    const spot = SPOTS.find(item => item.id === id);
    if (!spot) { info.hidden = true; return; }
    info.innerHTML = `<p class="plan-info-title">${spot.title}</p><p>${spot.text}</p><button type="button" class="plan-info-close" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>`;
    info.hidden = false;
  }
  info.addEventListener('click', event => { if (event.target.closest('.plan-info-close')) showSpot(null); });
  section.addEventListener('click', event => {
    const pin = event.target.closest('[data-spot]');
    if (pin && !moved) showSpot(pin.dataset.spot === activeSpot ? null : pin.dataset.spot);
  });

  /* ----- 2D pan and zoom ----- */
  const scrollScale = () => Number(board.style.getPropertyValue('--scroll-scale')) || 1;
  function limits(k = state.k) {
    const s = scrollScale() * k;
    return { x: Math.max(0, (board.offsetWidth * s - viewport.clientWidth) / 2), y: Math.max(0, (board.offsetHeight * s - viewport.clientHeight) / 2) };
  }
  // Zooming out stops once the whole plan fits on screen.
  const minK = () => Math.min(1, viewport.clientWidth / (board.offsetWidth * scrollScale()), viewport.clientHeight / (board.offsetHeight * scrollScale()));
  function apply() {
    const edge = limits();
    state.x = clamp(state.x, -edge.x, edge.x);
    state.y = clamp(state.y, -edge.y, edge.y);
    board.style.setProperty('--pan-x', `${state.x.toFixed(1)}px`);
    board.style.setProperty('--pan-y', `${state.y.toFixed(1)}px`);
    board.style.setProperty('--zoom', state.k.toFixed(4));
  }
  function zoomAt(factor, cx = 0, cy = 0, glide = false) {
    const k = clamp(state.k * factor, minK(), 4), f = k / state.k;
    state.x = cx - (cx - state.x) * f;
    state.y = cy - (cy - state.y) * f;
    state.k = k;
    board.classList.toggle('is-gliding', glide);
    apply();
  }
  const fromCentre = event => {
    const box = viewport.getBoundingClientRect();
    return [event.clientX - box.left - box.width / 2, event.clientY - box.top - box.height / 2];
  };

  const pointers = new Map();
  let moved = false, pinch = 0;
  viewport.addEventListener('pointerdown', event => {
    // Spots take their own clicks; capturing the pointer here would swallow them.
    if (!live() || mode !== '2d' || event.button > 0 || event.target.closest('[data-spot]')) return;
    pointers.set(event.pointerId, [event.clientX, event.clientY]);
    moved = false;
    board.classList.remove('is-gliding');
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove', event => {
    const last = pointers.get(event.pointerId);
    if (!last) return;
    const next = [event.clientX, event.clientY];
    pointers.set(event.pointerId, next);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const box = viewport.getBoundingClientRect();
      if (pinch) zoomAt(distance / pinch, (a[0] + b[0]) / 2 - box.left - box.width / 2, (a[1] + b[1]) / 2 - box.top - box.height / 2);
      pinch = distance;
      moved = true;
      return;
    }
    const dx = next[0] - last[0], dy = next[1] - last[1];
    if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
    state.x += dx; state.y += dy;
    apply();
  });
  const release = event => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = 0;
    if (!pointers.size) viewport.classList.remove('is-dragging');
    // Let a click that follows a drag through without opening a spot.
    setTimeout(() => { if (!pointers.size) moved = false; }, 0);
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('wheel', event => {
    if (!live() || !event.ctrlKey || mode !== '2d') return;
    event.preventDefault();
    zoomAt(Math.exp(-event.deltaY * .01), ...fromCentre(event));
  }, { passive: false });
  viewport.addEventListener('dblclick', event => {
    if (live() && mode === '2d' && !event.target.closest('[data-spot]')) zoomAt(1.7, ...fromCentre(event), true);
  });
  function resetView() {
    state.x = state.y = 0; state.k = 1;
    board.classList.add('is-gliding');
    apply();
  }

  /* ----- 2D or 3D ----- */
  function load3D() {
    loading = loading || import('./plan3d.js')
      .then(module => module.createViewer({ container: holder, spots: SPOTS, tip: $('#plan-3d-tip') }))
      .catch(error => {
        console.warn('3D master plan unavailable:', error);
        holder.classList.add('is-fallback');
        hint.textContent = "The 3D model couldn't load here, so this is a rendered view of it.";
        return null;
      });
    return loading;
  }
  async function setMode(next) {
    if (next === mode) return;
    mode = next;
    section.dataset.mode = next;
    $$('[data-view]', ui).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === next)));
    hint.textContent = HINTS[next];
    showSpot(null);
    if (next === '3d') {
      holder.hidden = false;
      requestAnimationFrame(() => section.classList.add('is-3d'));
      holder.classList.add('is-loading');
      viewer = await load3D();
      holder.classList.remove('is-loading');
      if (mode === '3d') viewer?.enter();
    } else {
      section.classList.remove('is-3d');
      viewer?.leave();
      setTimeout(() => { if (mode === '2d') holder.hidden = true; }, 650);
    }
  }
  ui.addEventListener('click', event => {
    const view = event.target.closest('button[data-view]');
    if (view) { if (coarse.matches && !exploring) setExploring(true); setMode(view.dataset.view); return; }
    const zoom = event.target.closest('button[data-zoom]');
    if (zoom) {
      const kind = zoom.dataset.zoom;
      if (mode === '3d') { if (kind === 'reset') viewer?.reset(); else viewer?.zoom(kind === 'in' ? 1.35 : 1 / 1.35); }
      else if (kind === 'reset') resetView();
      else zoomAt(kind === 'in' ? 1.4 : 1 / 1.4, 0, 0, true);
      return;
    }
    if (event.target.closest('[data-explore]')) setExploring(true);
    if (event.target.closest('[data-done]')) setExploring(false);
  });

  /* ----- phones: explore full screen, so a swipe over the plan still scrolls the page ----- */
  function setExploring(on) {
    exploring = on;
    section.classList.toggle('is-exploring', on);
    document.documentElement.classList.toggle('plan-exploring', on);
    if (!on) { resetView(); showSpot(null); }
    requestAnimationFrame(() => { apply(); viewer?.resize(); });
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && exploring) setExploring(false); });

  // While the plan fills the screen, the floating interest-list bar and back-to-top button step aside.
  let pinned = false;
  const updateChrome = () => document.body.classList.toggle('plan-on', ready && pinned);
  addEventListener('plan-ready', event => {
    ready = event.detail;
    ui.inert = !ready;
    section.classList.toggle('is-ready', ready);
    if (!ready) { showSpot(null); if (!exploring) resetView(); }
    updateChrome();
  });
  addEventListener('resize', () => apply(), { passive: true });
  new IntersectionObserver(([entry]) => viewer?.setActive(entry.isIntersecting && mode === '3d')).observe(section);
  new IntersectionObserver(([entry]) => { pinned = entry.intersectionRatio > .85; updateChrome(); }, { threshold: [0, .85, 1] })
    .observe($('.hs-sticky', section));
  hint.textContent = HINTS['2d'];
  // Without scroll choreography there are no clouds to wait for.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    board.style.setProperty('--scroll-scale', '1');
    dispatchEvent(new CustomEvent('plan-ready', { detail: true }));
  }
  apply();
}
