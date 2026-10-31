// Motion and interaction layer, ported from the Hidden Stories experience module.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const html = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// The intro plays for a fresh visit to the top of the page; deep links go straight in.
const intro = $('#intro');
const playIntro = Boolean(intro) && !reducedMotion.matches && ['', '#top'].includes(location.hash);
if (playIntro) {
  html.classList.add('intro-on');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
} else { intro?.remove(); html.classList.remove('intro-boot'); }

/* The tour: the entry renderings play like chapters of a film, one view every few seconds. */
const CHAPTER = 4.8;
const chapters = [
  ['THE ENTRY', 'Welcome home', 'the main entry'],
  ['CORNER PLANTINGS', 'In full bloom', 'crape myrtles'],
  ['COLUMN AND TIMBER FENCE', 'Unbridled', 'the Belmont horse'],
  ['STONE MAILBOXES', 'Every detail', 'down every street'],
  ['ACROSS THE LAWN', 'Almost home', 'from the road']
];

function setupTour() {
  const media = $('.hs-hero-media');
  if (!media) return { start() {} };
  const slides = $$('.tour-slide', media);
  const label = $('#room-caption-text'), local = $('#tour-local'), toggle = $('#tour-toggle');
  $('#tour-progress').innerHTML = chapters.map(() => '<i><b></b></i>').join('');
  const bars = $$('#tour-progress b');
  let current = -1, elapsed = 0, last = 0, frame = 0, playing = false, visible = true, covered = false, started = false;
  let userPaused = reducedMotion.matches; // Reduced motion: the tour waits for a press of play.

  function show(index) {
    index = (index + chapters.length) % chapters.length;
    if (index === current) return;
    current = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-on', i === index));
    const [title, phrase, meaning] = chapters[index];
    label.textContent = `0${index + 1} · ${title}`;
    local.innerHTML = `${phrase} <small>— ${meaning}</small>`;
    for (const element of [label, local]) { element.classList.remove('swap'); void element.offsetWidth; element.classList.add('swap'); }
  }
  function paint() {
    bars.forEach((bar, i) => { bar.style.transform = `scaleX(${i < current ? 1 : i === current ? Math.min(1, elapsed / CHAPTER).toFixed(4) : 0})`; });
  }
  function tick(now) {
    frame = 0;
    if (!playing) return;
    if (last) elapsed += (now - last) / 1000;
    last = now;
    if (elapsed >= CHAPTER) { elapsed = 0; show(current + 1); }
    paint();
    frame = requestAnimationFrame(tick);
  }
  function syncToggle() {
    toggle.setAttribute('aria-pressed', String(!playing));
    toggle.setAttribute('aria-label', playing ? 'Pause the tour' : 'Play the tour');
    toggle.classList.toggle('is-paused', !playing);
    media.classList.toggle('is-paused', !playing);
  }
  function play() {
    if (!started || userPaused || !visible || covered || document.hidden || playing) return;
    playing = true; last = 0;
    frame = requestAnimationFrame(tick);
    syncToggle();
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(frame); frame = 0;
    syncToggle();
  }
  function seek(index) { elapsed = 0; show(index); paint(); }
  $('#room-prev').addEventListener('click', () => seek(current - 1));
  $('#room-next').addEventListener('click', () => seek(current + 1));
  toggle.addEventListener('click', () => {
    userPaused = playing;
    if (userPaused) pause(); else { started = true; play(); }
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) play(); else pause();
  }, { threshold: .05 }).observe(media);
  // The dome covering the tour counts as off screen.
  addEventListener('hero-cover', event => { covered = event.detail; if (covered) pause(); else play(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else play(); });
  show(0); paint(); syncToggle();
  return { start() { started = true; play(); } };
}

/* Intro: greeting, then the Belmont crest opens onto the hero card. */
async function runIntro(tour) {
  if (!playIntro) { html.classList.add('hero-ready'); tour.start(); return; }
  const door = $('.intro-door', intro);
  let finished = false;
  // Size the crest from the screen height so the greeting always fits above it,
  // and grow it just far enough to clear every corner of the screen.
  const unit = innerHeight / 90, span = innerWidth / unit;
  door.setAttribute('viewBox', `${(-span / 2).toFixed(3)} -45 ${span.toFixed(3)} 90`);
  door.setAttribute('preserveAspectRatio', 'none');
  intro.style.setProperty('--arch-unit', `${unit}px`);
  const cover = 1.12 * Math.max(innerWidth / (8.4 * unit), 15);
  intro.hidden = false;
  document.body.classList.add('intro-lock');

  const end = fast => {
    if (finished) return;
    finished = true;
    removeEventListener('keydown', onKey);
    removeEventListener('wheel', skip);
    removeEventListener('touchmove', skip);
    tour.start();
    document.body.classList.remove('intro-lock');
    html.classList.remove('intro-on', 'intro-boot');
    html.classList.add('hero-ready');
    intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast ? 420 : 300, fill: 'forwards' }).finished.then(() => intro.remove());
  };
  const skip = () => end(true);
  const onKey = event => { if (['Escape', 'Enter', ' '].includes(event.key)) { event.preventDefault(); skip(); } };
  $('.intro-skip', intro).addEventListener('click', skip);
  addEventListener('keydown', onKey);
  addEventListener('wheel', skip, { passive: true });
  addEventListener('touchmove', skip, { passive: true });

  requestAnimationFrame(() => intro.classList.add('play'));
  await wait(1650); if (finished) return;
  intro.classList.add('open');
  html.classList.add('hero-ready');
  await wait(700); if (finished) return;
  intro.classList.add('leave');
  await door.animate([{ transform: 'scale(1)' }, { transform: `scale(${cover.toFixed(2)})` }], { duration: 1200, easing: 'cubic-bezier(.66,0,.22,1)', fill: 'forwards' }).finished.catch(() => {});
  end(false);
}

/* Cards and section furniture arrive in a staggered cascade. */
const revealGroups = [
  ['rise', '.rv-kicker, .rv-about-copy > p, .rv-learn, .hp-head > *, .hp-connect-copy > *, .footer-top > *, .footer-legal, .footer-bottom'],
  ['card', '.rv-stats > div, .hp-card'],
  ['unveil', '.rv-photo-tall, .rv-photo-small']
];
function setupReveals() {
  const observer = !reducedMotion.matches && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in'); observer.unobserve(entry.target);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' })
    : null;
  html.classList.add('reveals-on');
  for (const [variant, selector] of revealGroups) {
    const counters = new Map();
    for (const element of $$(selector)) {
      const index = counters.get(element.parentElement) || 0;
      counters.set(element.parentElement, index + 1);
      element.dataset.reveal = variant;
      element.style.setProperty('--i', Math.min(index, 7));
      observer ? observer.observe(element) : element.classList.add('is-in');
    }
  }
  // The footer's entry tower draws itself when the statement arrives.
  const statement = $('.footer-statement');
  if (!observer) { statement.classList.add('is-in'); return; }
  new IntersectionObserver(([entry], watcher) => {
    if (entry.isIntersecting) { statement.classList.add('is-in'); watcher.disconnect(); }
  }, { threshold: .3 }).observe(statement);
}

/* Indigo fill: every button and call to action floods from the touch point. */
const fxSelector = '.rv-talk, .rv-start, .rv-learn, .connect-submit, .book-bar-cta, .intro-skip, .site-footer nav a, #room-prev, #room-next, #tour-toggle';
function primeFx(element) {
  if (element.classList.contains('fx')) return;
  element.classList.add('fx');
  if (getComputedStyle(element).position === 'static') element.classList.add('fx-rel');
}
function placeFx(element, event) {
  const box = element.getBoundingClientRect();
  element.style.setProperty('--mx', `${(event.clientX ?? box.left + box.width / 2) - box.left}px`);
  element.style.setProperty('--my', `${(event.clientY ?? box.top + box.height / 2) - box.top}px`);
  element.style.setProperty('--fx-d', `${Math.hypot(box.width, box.height) * 2.2}px`);
}
function setupFx() {
  $$(fxSelector).forEach(primeFx);
  const handle = event => {
    const element = event.target.closest?.(fxSelector);
    if (!element) return;
    primeFx(element); placeFx(element, event);
  };
  document.addEventListener('pointerover', handle, { passive: true });
  document.addEventListener('pointerdown', handle, { passive: true });
  document.addEventListener('focusin', event => { const element = event.target.closest?.(fxSelector); if (element) { primeFx(element); placeFx(element, {}); } });
}

/* Pointer polish: magnetic buttons and a following ring. */
function setupPointer() {
  if (!finePointer.matches || reducedMotion.matches) return;
  const magnetic = '.book-bar-cta, .to-top, .hs-cta, #room-prev, #room-next, #tour-toggle, .rv-talk, .rv-start';
  let magnet = null;
  document.addEventListener('pointermove', event => {
    const target = event.target.closest?.(magnetic);
    if (magnet && magnet !== target) { magnet.style.translate = ''; magnet = null; }
    if (target) {
      const box = target.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) / box.width, y = (event.clientY - box.top - box.height / 2) / box.height;
      target.style.translate = `${(x * Math.min(14, box.width * .18)).toFixed(1)}px ${(y * Math.min(10, box.height * .3)).toFixed(1)}px`;
      magnet = target;
    }
  }, { passive: true });

  const ring = $('.cursor-ring'), ringLabel = $('span', ring);
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, running = false;
  const follow = () => {
    rx += (x - rx) * .2; ry += (y - ry) * .2;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    running = Math.abs(x - rx) + Math.abs(y - ry) > .3;
    if (running) requestAnimationFrame(follow);
  };
  document.addEventListener('pointermove', event => {
    x = event.clientX; y = event.clientY;
    ring.classList.add('on');
    const target = event.target;
    const label = target.closest?.('.kind-photo, .hp-map') ? 'View' : target.closest?.('.hs-hero-media') ? 'Tour' : '';
    ring.classList.toggle('has-label', Boolean(label));
    if (label) ringLabel.textContent = label;
    ring.classList.toggle('hover', !label && Boolean(target.closest?.('a, button, input, textarea, label, [role=button]')));
    if (!running) { running = true; requestAnimationFrame(follow); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => ring.classList.remove('on'));
  document.addEventListener('pointerdown', () => ring.classList.add('press'));
  document.addEventListener('pointerup', () => ring.classList.remove('press'));
}

/* Scroll furniture: progress line, back-to-top ring and the interest-list bar. */
function setupScrollUi(smooth) {
  const bar = $('.scroll-progress i'), toTop = $('#to-top'), ring = $('.to-top-ring', toTop), book = $('#book-bar');
  // The bar steps aside once the builders and interest-list section, or the footer, is on screen.
  const tour = $('.hs-hero'), builders = $('.hp'), footer = $('.site-footer');
  let buildersVisible = false, footerVisible = false, frame = 0, lastY = scrollY, tucked = false;
  const narrow = matchMedia('(max-width: 800px)');
  const watch = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.target === builders) buildersVisible = entry.isIntersecting;
    if (entry.target === footer) footerVisible = entry.isIntersecting;
    update();
  }));
  [builders, footer].forEach(element => watch.observe(element));
  function update() {
    frame = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const progress = Math.min(1, scrollY / max);
    bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    ring.style.strokeDashoffset = (1 - progress).toFixed(4);
    const showTop = scrollY > innerHeight * .9;
    toTop.classList.toggle('show', showTop); toTop.inert = !showTop;
    const y = scrollY;
    if (narrow.matches) { if (y > lastY + 3) tucked = true; else if (y < lastY - 3) tucked = false; } else tucked = false;
    lastY = y;
    const showBook = !tucked && y > tour.offsetTop + tour.offsetHeight - innerHeight * .4 && !buildersVisible && !footerVisible;
    book.classList.toggle('show', showBook); book.inert = !showBook;
    document.body.classList.toggle('book-bar-on', showBook);
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update, { passive: true });
  toTop.addEventListener('click', () => (smooth ? smooth.to(0) : scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' })));
  update();
}

/* Fulshear local time in the header. */
function setupLocalClock() {
  const clock = $('.local-clock');
  if (!clock) return;
  const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', hour12: true });
  const render = () => { clock.textContent = `Fulshear ${timeFormat.format(new Date()).replace(/\s?(AM|PM)/i, (_, half) => ` ${half.toLowerCase()}`)}`; };
  render();
  setInterval(render, 30000);
}

export function setupExperience({ smooth } = {}) {
  const tour = setupTour();
  setupReveals();
  setupFx();
  setupPointer();
  setupScrollUi(smooth);
  setupLocalClock();
  runIntro(tour);
}
