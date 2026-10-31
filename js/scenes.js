// Scroll choreography, ported from the Hidden Stories scene engine.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const phone = matchMedia('(max-width: 800px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const segment = (p, a, b) => clamp((p - a) / (b - a));
const ease = t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = t => 1 - (1 - t) ** 3;
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

let vw = innerWidth, vh = innerHeight;
const scenes = [];
let smooth;

/* Smooth, inertial wheel scrolling (mouse and trackpad); touch keeps native momentum. */
function setupSmoothScroll() {
  const native = { to: y => scrollTo({ top: y, behavior: reducedMotion.matches ? 'instant' : 'smooth' }) };
  if (!finePointer.matches || reducedMotion.matches) return native;
  let target = scrollY, current = scrollY, last = scrollY, running = false;
  const max = () => document.documentElement.scrollHeight - innerHeight;
  const canScroll = (element, delta) => {
    for (let node = element; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) {
        if ((delta < 0 && node.scrollTop > 0) || (delta > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1)) return true;
      }
    }
    return false;
  };
  const step = () => {
    if (Math.abs(scrollY - last) > 2) target = current = scrollY; // someone else scrolled (keyboard, scrollbar)
    current = lerp(current, target, .095);
    if (Math.abs(target - current) < .4) current = target;
    scrollTo(0, current);
    last = scrollY;
    if (current !== target) requestAnimationFrame(step); else running = false;
  };
  const run = () => { if (!running) { running = true; last = scrollY; requestAnimationFrame(step); } };
  addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (document.body.classList.contains('locked') || document.body.classList.contains('intro-lock')) return;
    if (canScroll(event.target, event.deltaY)) return;
    event.preventDefault();
    if (!running) target = current = scrollY;
    const delta = event.deltaMode === 1 ? event.deltaY * 40 : event.deltaMode === 2 ? event.deltaY * innerHeight : event.deltaY;
    target = clamp(passStops(target, delta), 0, max());
    run();
  }, { passive: false });
  return { to(y) { if (!running) current = scrollY; target = clamp(y, 0, max()); run(); } };
}

/* Map stops: scrolling holds at each map so it can be explored. Scrolling on in the same
   direction fills a gauge and carries on; turning back lets go at once. Keyboard and scrollbar are never held. */
const stops = [];
const HOLD = 720;
let hold = null;
const gauge = $('#stop-gauge'), gaugeFill = $('#stop-gauge i');
function addStop(id, y, { anchor, active = () => true } = {}) {
  stops.push({ id, y, anchor, active, armed: true });
}
function startHold(stop, dir, arriving = false) {
  hold = { stop, dir, gauge: 0, arriving };
  document.body.classList.add('at-stop');
  if (gauge) { gauge.inert = false; gaugeFill.style.transform = 'scaleX(0)'; }
  dispatchEvent(new CustomEvent('map-stop', { detail: { id: stop.id, on: true } }));
}
function endHold() {
  if (!hold) return;
  const { id } = hold.stop;
  hold = null;
  document.body.classList.remove('at-stop');
  if (gauge) gauge.inert = true;
  dispatchEvent(new CustomEvent('map-stop', { detail: { id, on: false } }));
}
function passStops(from, delta) {
  if (hold) {
    if (Math.sign(delta) !== hold.dir) endHold();
    else {
      hold.gauge += Math.abs(delta);
      gaugeFill.style.transform = `scaleX(${Math.min(1, hold.gauge / HOLD).toFixed(3)})`;
      if (hold.gauge < HOLD) return hold.stop.y();
      hold.stop.armed = false;
      endHold();
      return from + delta;
    }
  }
  const next = from + delta;
  for (const stop of stops) {
    if (!stop.armed || !stop.active()) continue;
    const y = stop.y();
    if ((from < y - 2 && next >= y) || (from > y + 2 && next <= y)) { startHold(stop, Math.sign(delta)); return y; }
  }
  return next;
}
function checkStops(y) {
  for (const stop of stops) if (!stop.armed && Math.abs(y - stop.y()) > vh * .6) stop.armed = true;
  if (!hold) return;
  const distance = Math.abs(y - hold.stop.y());
  if (hold.arriving) { if (distance < 4) hold.arriving = false; return; }
  if (distance > (finePointer.matches ? vh * .4 : 60)) endHold();
}
/* Touch keeps native momentum, so a stop there is a brief halt right at the map. */
function setupTouchStops() {
  let last = scrollY, timer;
  addEventListener('scroll', () => {
    const y = scrollY;
    for (const stop of stops) {
      if (!stop.armed || !stop.active()) continue;
      const at = stop.y();
      if ((last < at - 2 && y >= at) || (last > at + 2 && y <= at)) {
        stop.armed = false;
        const root = document.documentElement;
        root.style.overflow = 'hidden';
        scrollTo(0, at);
        startHold(stop, Math.sign(y - last), true);
        clearTimeout(timer);
        timer = setTimeout(() => { root.style.overflow = ''; }, 650);
        last = at;
        return;
      }
    }
    last = y;
  }, { passive: true });
}
export function goToStop(id) {
  const stop = stops.find(item => item.id === id);
  if (!stop) return false;
  stop.armed = false;
  endHold();
  smooth.to(stop.y());
  if (!reducedMotion.matches) startHold(stop, 1, true);
  return true;
}

/* Scenes: pinned scenes report progress across their sticky run; flow scenes across their pass through the screen. */
function addScene(element, update, { pinned = true, setup } = {}) {
  if (element) scenes.push({ element, update, pinned, setup, p: -1, start: 0, range: 1 });
}
function measure() {
  vw = innerWidth; vh = innerHeight;
  for (const scene of scenes) {
    scene.setup?.();
    const top = scene.element.getBoundingClientRect().top + scrollY;
    if (scene.pinned) { scene.start = top; scene.range = Math.max(1, scene.element.offsetHeight - vh); }
    else { scene.start = top - vh; scene.range = scene.element.offsetHeight + vh; }
    scene.p = -1;
  }
  headerZones = $$('[data-header]');
  render();
}
let frame = 0;
function render() {
  frame = 0;
  const y = scrollY;
  for (const scene of scenes) {
    const p = clamp((y - scene.start) / scene.range);
    if (p !== scene.p) { scene.p = p; scene.update(p); }
  }
  updateHeader(y);
  checkStops(y);
}
const requestRender = () => { if (!frame) frame = requestAnimationFrame(render); };

/* The header waits out the hero card, then turns light over photographs and dark over canvas. */
let headerZones = [];
const header = $('#site-header'), rail = $('.hs-rail b'), ring = $('.hs-emblem-ring'), card = $('.rv-hero');
function updateHeader(y) {
  // Read positions live: fonts and images change heights after load.
  const zone = headerZones.find(element => { const box = element.getBoundingClientRect(); return box.top <= 56 && box.bottom > 56; });
  if (zone) header.dataset.theme = zone.dataset.headerNow || zone.dataset.header;
  header.classList.toggle('is-scrolled', y > 24);
  const away = Boolean(card) && y < card.offsetHeight - 80;
  header.classList.toggle('is-away', away);
  if (away) header.classList.remove('nav-open');
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  if (rail) rail.style.transform = `scaleY(${(y / max).toFixed(4)})`;
  if (ring) ring.style.transform = `rotate(${(y * .06).toFixed(2)}deg)`;
}

/* A dome rising from the bottom edge until its canvas covers the screen. */
function domeMotion(dome, { peek = .3 } = {}) {
  let size = 0, cover = 1;
  return {
    setup() {
      size = vw > vh ? Math.min(vw * .62, vh * 1.05) : vw * .94;
      dome.style.width = dome.style.height = `${size}px`;
      cover = (Math.hypot(vw / 2, vh / 2) * 2.08) / size;
    },
    apply(t) {
      const start = vh - size * peek + size / 2;
      const centre = lerp(start, vh / 2, t);
      dome.style.transform = `translate3d(-50%, ${(centre - size / 2).toFixed(1)}px, 0) scale(${lerp(1, cover, t).toFixed(4)})`;
    }
  };
}

/* The About statement: its softer second sentence darkens word by word as it passes. */
function fillScene() {
  for (const element of $$('[data-fill]')) {
    const words = element.textContent.trim().split(/\s+/);
    element.innerHTML = words.map(word => `<span class="fw">${escapeHTML(word)}</span>`).join(' ');
    const spans = $$('.fw', element);
    addScene(element, p => {
      const lit = Math.round(segment(p, .22, .62) * spans.length);
      spans.forEach((span, i) => span.classList.toggle('lit', i < lit));
    }, { pinned: false });
  }
}

function heroScene() {
  const hero = $('.hs-hero'), dome = $('#hero-dome'), media = $('.hs-hero-media'), chrome = $$('.tour-mini, .hs-hero-link');
  const motion = domeMotion(dome);
  let covered = false;
  addScene(hero, p => {
    const t = ease(segment(p, 0, .82));
    motion.apply(t);
    media.style.transform = `scale(${(1 + t * .1).toFixed(4)})`;
    chrome.forEach(element => { element.style.opacity = (1 - segment(p, 0, .18)).toFixed(3); element.inert = p > .18; });
    hero.dataset.headerNow = t > .5 ? 'dark' : 'light';
    const nowCovered = t > .96;
    if (nowCovered !== covered) { covered = nowCovered; dispatchEvent(new CustomEvent('hero-cover', { detail: covered })); }
  }, { setup: motion.setup });
}

function growScene() {
  const section = $('.hs-grow'), pin = $('.grow-pin'), frameEl = $('.grow-frame'), image = $('img', frameEl), before = $('.grow-before'), over = $('.grow-over');
  const overLines = $$('[data-lines]', over);
  addScene(pin, p => {
    const g = ease(segment(p, .12, .62));
    const w0 = Math.min(vw * (vw > vh ? .3 : .7), 460), h0 = w0 * .64;
    const w = lerp(w0, vw, g), h = lerp(h0, vh, g);
    const cy = lerp(vh * .38, vh / 2, g);
    const top = cy - h / 2, left = (vw - w) / 2;
    frameEl.style.clipPath = `inset(${top.toFixed(1)}px ${left.toFixed(1)}px ${(vh - top - h).toFixed(1)}px ${left.toFixed(1)}px)`;
    image.style.transform = `scale(${lerp(1.22, 1, g).toFixed(4)})`;
    const fade = segment(p, .1, .3);
    before.style.opacity = (1 - fade).toFixed(3);
    before.style.transform = `translate3d(0, ${(-50 * fade).toFixed(1)}px, 0)`;
    before.style.top = `${(vh * .38 + h0 / 2 + 34).toFixed(0)}px`;
    over.style.opacity = segment(p, .6, .7).toFixed(3);
    overLines.forEach(element => element.classList.toggle('in', p > .62));
    section.dataset.headerNow = g > .55 ? 'light' : 'dark';
  });
}

function acrossScene() {
  const section = $('.hs-across'), track = $('.across-track');
  const drifting = $$('[data-drift]', section), floating = $$('.w1, .w2, .w3, .pearl-photo, .pearl-country', section);
  let travel = 0, positions = [], stopY = 0;
  // The page holds once the area map has slid fully into view.
  addStop('area', () => stopY);
  addScene(section, p => {
    track.style.transform = travel ? `translate3d(${(-travel * p).toFixed(1)}px, 0, 0)` : '';
    for (const item of positions) {
      const centre = item.left + item.width / 2 - travel * p;
      const offset = (centre - vw / 2) / vw;
      item.element.style.translate = `${(offset * item.speed).toFixed(1)}px 0`;
    }
    drifting.forEach(element => { element.style.translate = `0 ${((p - .5) * Number(element.dataset.drift)).toFixed(1)}px`; });
  }, {
    setup() {
      track.style.transform = 'none';
      const top = section.getBoundingClientRect().top + scrollY;
      if (phone.matches) {
        // Stacked: no pinning or sideways travel; the list reads top to bottom.
        travel = 0; positions = []; section.style.height = '';
        floating.forEach(element => { element.style.translate = ''; });
        stopY = $('#area-map').getBoundingClientRect().top + scrollY - 64;
        return;
      }
      travel = Math.max(0, track.scrollWidth - vw);
      section.style.height = `${travel + vh}px`;
      stopY = top + travel;
      const trackLeft = track.getBoundingClientRect().left;
      const speeds = { w1: -90, w2: 70, w3: -40, 'pearl-photo': 120, 'pearl-country': -140 };
      positions = floating.map(element => {
        element.style.translate = '';
        const box = element.getBoundingClientRect();
        return { element, left: box.left - trackLeft, width: box.width, speed: speeds[[...element.classList].find(name => name in speeds)] || 0 };
      });
    }
  });
}

function cloudsScene() {
  const section = $('.hs-clouds'), strip = $('.clouds-strip'), board = $('#plan-board'), back = $('.clouds-edge-back');
  let edge = 0, total = 0, stopY = 0, ready = false;
  // The page holds once the clouds have cleared, with the plan's controls showing.
  addStop('plan', () => stopY, { anchor: '#master-plan' });
  addScene(section, p => {
    const start = -vh * .45, end = -total;
    const t = ease(segment(p, 0, .92));
    strip.style.transform = `translate3d(0, ${lerp(start, end, t).toFixed(1)}px, 0)`;
    back.style.transform = `translate3d(0, ${((1 - t) * 60).toFixed(1)}px, 0)`;
    board.style.setProperty('--scroll-scale', lerp(1.28, 1.02, segment(p, .4, 1)).toFixed(4));
    section.classList.toggle('is-clear', p > .82);
    const nowReady = p > .9;
    if (nowReady !== ready) { ready = nowReady; dispatchEvent(new CustomEvent('plan-ready', { detail: ready })); }
    section.dataset.headerNow = 'dark';
  }, {
    setup() {
      edge = vw * 900 / 2400;
      strip.style.setProperty('--edge', `${edge}px`);
      total = vh + edge + vh + edge;
      stopY = section.getBoundingClientRect().top + scrollY + Math.max(1, section.offsetHeight - vh) * .96;
    }
  });
}

/* The details: a sliver of rendering opens, the word spells itself out. */
function kindsScene() {
  $$('.kind').forEach(item => {
    const photo = $('.kind-photo', item), letters = $$('.kind-word span', item), meta = $('.kind-meta', item);
    addScene(item, p => {
      const open = ease(segment(p, .12, .5));
      // From a slanted sliver to the full frame.
      const a = lerp(47, 0, open), b = lerp(53, 100, open), c = lerp(51, 100, open), d = lerp(45, 0, open);
      photo.style.clipPath = `polygon(${a}% 0, ${b}% 0, ${c}% 100%, ${d}% 100%)`;
      photo.style.transform = `translate3d(0, ${((.5 - p) * 80).toFixed(1)}px, 0)`;
      letters.forEach((letter, i) => {
        const shown = easeOut(segment(p, .2 + i * .035, .34 + i * .035));
        letter.style.opacity = (.12 + shown * .88).toFixed(3);
        letter.style.transform = `translate3d(0, ${((1 - shown) * 40).toFixed(1)}px, 0)`;
      });
      meta.style.transform = `translate3d(0, ${((.5 - p) * 140).toFixed(1)}px, 0)`;
    }, { pinned: false });
  });
}

function duskScene() {
  const section = $('.hs-dusk'), image = $('.dusk-media img'), items = $$('#dusk-list li'), note = $('.dusk-note');
  const dome = $('#dusk-dome'), inner = $('.dome-two-inner'), list = $('#dusk-list');
  const motion = domeMotion(dome, { peek: 0 });
  addScene(section, p => {
    image.style.transform = `scale(${lerp(1.14, 1, segment(p, 0, .5)).toFixed(4)})`;
    const step = segment(p, .04, .46) * items.length;
    items.forEach((item, i) => item.className = i < Math.floor(step) ? 'past' : i === Math.floor(step) ? 'on' : '');
    const t = ease(segment(p, .5, .9));
    motion.apply(t);
    list.style.opacity = note.style.opacity = (segment(p, .08, .18) * (1 - segment(p, .5, .62))).toFixed(3);
    inner.style.opacity = segment(p, .7, .86).toFixed(3);
    inner.style.transform = `translate3d(-50%, calc(-50% + ${((1 - segment(p, .7, .95)) * 70).toFixed(1)}px), 0)`;
    section.dataset.headerNow = t > .5 ? 'dark' : 'light';
  }, { setup: motion.setup });
}

function flowScenes() {
  for (const section of $$('.hs-statement, .hs-plum, .hs-gallery')) {
    const drifting = $$('[data-drift]', section);
    addScene(section, p => drifting.forEach(element => {
      element.style.translate = `0 ${((p - .5) * Number(element.dataset.drift)).toFixed(1)}px`;
    }), { pinned: false });
  }
  const swing = $('.swing-card');
  addScene(swing, p => {
    const t = easeOut(segment(p, .05, .5));
    swing.style.transform = `translate3d(${((1 - t) * 34).toFixed(2)}vw, 0, 0) rotate(${((1 - t) * 9).toFixed(2)}deg)`;
    swing.style.opacity = (.2 + t * .8).toFixed(3);
  }, { pinned: false });
}

/* Statements reveal line by line, each line sliding up from behind a mask. */
function setupLines() {
  const elements = $$('[data-lines]');
  const split = element => {
    if (!element.dataset.text) element.dataset.text = element.textContent.trim().replace(/\s+/g, ' ');
    const words = element.dataset.text.split(' ');
    element.innerHTML = words.map(word => `<span class="lw">${escapeHTML(word)}</span>`).join(' ');
    const lines = [];
    let top = null, current = [];
    for (const word of $$('.lw', element)) {
      if (top === null || Math.abs(word.offsetTop - top) > 3) { if (current.length) lines.push(current); current = []; top = word.offsetTop; }
      current.push(word.textContent);
    }
    if (current.length) lines.push(current);
    element.innerHTML = lines.map((line, i) => `<span class="ln" style="--l:${i}"><span class="ln-i">${escapeHTML(line.join(' '))}</span></span>`).join('');
  };
  const splitAll = () => elements.forEach(split);
  splitAll();
  let width = innerWidth, timer;
  addEventListener('resize', () => {
    if (innerWidth === width) return;
    width = innerWidth; clearTimeout(timer); timer = setTimeout(splitAll, 200);
  });
  const watched = elements.filter(element => !element.closest('.grow-over'));
  if (reducedMotion.matches || !('IntersectionObserver' in window)) { elements.forEach(element => element.classList.add('in')); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); }
  }), { threshold: .25 });
  watched.forEach(element => observer.observe(element));
}

/* Same-page links glide rather than jump. */
function setupAnchors() {
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    header.classList.remove('nav-open');
    $('.hs-menu-toggle')?.setAttribute('aria-expanded', 'false');
    // A map's link lands on its stop, already cleared and ready to explore.
    const stop = stops.find(item => item.anchor === href);
    if (stop && goToStop(stop.id)) return;
    // Leave room for the fixed header above anything but the top of the page.
    const offset = target.id === 'top' ? 0 : 110;
    smooth.to(target.getBoundingClientRect().top + scrollY - offset);
  });
}

export function setupScenes() {
  smooth = setupSmoothScroll();
  setupAnchors();
  if (reducedMotion.matches) {
    document.documentElement.classList.add('static-story');
    setupLines();
    $$('[data-fill] .fw').forEach(span => span.classList.add('lit'));
    addEventListener('scroll', () => updateHeader(scrollY), { passive: true });
    measure();
    return smooth;
  }
  fillScene();
  heroScene();
  growScene();
  acrossScene();
  cloudsScene();
  kindsScene();
  duskScene();
  flowScenes();
  if (!finePointer.matches) setupTouchStops();
  gauge?.addEventListener('click', () => {
    // Continue past the map without scrolling the gauge full.
    if (!hold) return;
    const stop = hold.stop;
    stop.armed = false;
    endHold();
    smooth.to(stop.y() + vh);
  });
  document.fonts.ready.then(() => { setupLines(); measure(); });
  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', measure, { passive: true });
  phone.addEventListener('change', measure);
  addEventListener('load', measure, { once: true });
  new ResizeObserver(() => measure()).observe($('main'));
  // Late images and fonts can nudge the layout; re-measure once things settle.
  let settle;
  $('main').addEventListener('load', () => { clearTimeout(settle); settle = setTimeout(measure, 150); }, true);
  [1000, 3000].forEach(delay => setTimeout(measure, delay));
  measure();
  return smooth;
}
