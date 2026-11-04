// Belmont Estates website: pages, search dock, site map, area and school maps, builders, journal, galleries,
// FAQ, forms and the AI concierge. Content comes from content/knowledge.json (the kit's text) and
// js/plan-data.js (the kit's maps).
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DATA = window.BE_DATA, K = null;
  var MAPS = 'https://www.google.com/maps/search/?api=1&query=';
  var HOME_Q = 'Bois D’Arc Lane, Fulshear, TX';
  var HOME_MAP = MAPS + encodeURIComponent(HOME_Q);
  var HOME_DIR = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(HOME_Q);
  var ICON = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
    nav: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 8-8 8-8-8z"/><path d="M9.5 13.5v-3h5M12.5 8.5l2 2-2 2"/></svg>',
    layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/></svg>',
    fit: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20c4-1 5-6 8-8s6-2 8-8"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    water: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c2 0 2-1.5 4.5-1.5S9.5 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15M3 19c2 0 2-1.5 4.5-1.5S9.5 19 12 19s2.5-1.5 4.5-1.5S19 19 21 19M12 4v6M9 7l3-3 3 3"/></svg>',
    trail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20c2-5 9-3 9-8s-6-4-6-8" stroke-dasharray="2.5 2.5"/><circle cx="17" cy="5" r="2"/></svg>',
    park: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l5 7h-3l4 6H6l4-6H7z"/><path d="M12 16v5"/></svg>',
    tree: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="9" r="3.5"/><circle cx="16" cy="9" r="3.5"/><path d="M8 12.5V20M16 12.5V20M3 20h18"/></svg>',
    gate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V8l4-3 4 3v12M12 20V8l4-3 4 3v12M2 20h20"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    compass: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l3 9h-6z" fill="currentColor"/><path d="M12 21l-3-9h6z"/></svg>',
    size: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l8-4 8 4-8 4zM4 8v8l8 4 8-4V8M12 12v8"/></svg>'
  };
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (x) { return null; } }

  // ================= motion: everything reveals as it scrolls in =================
  // Images rise into view bottom to top, headings rise word by word with the script line written in,
  // copy and cards fade up in turn, brushstrokes sweep across and numbers count up. Off for reduced motion.
  var M = !reduce && 'IntersectionObserver' in window && !!window.CSS && CSS.supports('clip-path', 'inset(0 0 0 0)');
  if (M) document.documentElement.classList.add('motion');
  var KINDS = [
    ['split', '.h1, .h2, .h3, .grace-h > span, .crafted-h, .dev-h, .lg-h, .cta-band-h, .grace-card-h'],
    ['write', '.script, .poster-legend-h'],
    ['clip', '.pg-photo, .gather-map .frame, .tile, .rel-tile, .photo-card, .collage figure, .pt-pair figure, .grace-row figure, .arr-pics figure, .dg-thumb, .gal, .vid-poster, .story, .fu-map, .poster-body, .loc-map .am-stage, .inc-map img, .news-card img, .am-card img, .step img, .lg-photo, .crest, .bcard-top'],
    ['sweep', '.deco'],
    ['fade', '.ghost, .dev-year'],
    ['up', '.tbd-stats li, .res-help, .res-cards .know, .res-item, .gather-key li, .gather-map figcaption, .rates, .rates-notes p, .rates-notes h3, .disc li, .tax-calc, .two-col > div > p, .contact-addr, .news-sel, .eyebrow, .lede, .pt-copy > p, .btns, .pt-tabs, .note, .note-pill, .note-card, .chips, .follow, .pt-stats li, .stats li, .dark-stats li, .ticks li, .roads li, .logos li, .logo-strip > p, .statement-sub, .mb-card, .news-card, .am-card, .bcard, .know, .tba, .near, .place-card, .step, .cat, .acc details, .fmx, .areamap, .schoolmap, .first, .lead-form, .inc-card, .fu-card, .nl-copy > p, .nl-form, .nl-side figcaption, .foot-top > *, .foot-mark, .foot-bar, .cols-copy p, .qa-cols p, .tag, .dev-meta, .dev-quote, .dg-dev .btn, .dg-top p, .dg-statement .round-btn, .vid-t, .vid-d, .vid-list, .crafted-card, .grace-card, .collage-card, .arr-card, .cta-band, .poster-top, .poster-logo, .poster-foot, .lg p, .lg .link-arrow, .lg-list li, .am-chips button, .opener p, .arrival p, .dev-sec p, .glance-lead, .head .link-arrow, .faq-tools, .grace-top .lede, .grace-h img, .story-nav']
  ];
  var COUNT = '.pt-stats b, .stats b, .collage-card b, .dark-stats b';
  var NOT_IN = '.hero, .chat, .fmx-body, .fmx-bar, .fmx-sub, .menu, .dock, .viewer, .ask-tip, .tour, .story-track, .vid-list, .poster-body';
  var io = M && new IntersectionObserver(function (es) {
    es.forEach(function (x) {
      var t = x.target;
      if (x.isIntersecting) { if (!t.classList.contains('in')) { t.classList.add('in'); countIn(t); } }
      else if (!t.offsetParent && t.classList.contains('in')) t.classList.remove('in'); // its page was hidden: play again next visit
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.12 });
  function splitWords(el) {
    var i = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
          var o = document.createElement('span'); o.className = 'w'; o.innerHTML = '<span style="--wi:' + (i++) + '">' + esc(w) + '</span>'; frag.appendChild(o);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeName === 'EM') n.style.setProperty('--wi', i++);
    });
  }
  function scan(root) {
    if (!M) return;
    var seen = new Map();
    KINDS.forEach(function (k) {
      $$(k[1], root).forEach(function (el) {
        if (el.hasAttribute('data-m') || (el.parentElement && el.parentElement.closest(NOT_IN + ', [data-m="clip"]'))) return;
        el.setAttribute('data-m', k[0]);
        if (k[0] === 'split') splitWords(el);
        var key = el.parentElement, n = seen.get(key) || 0; seen.set(key, n + 1);
        if (n) el.style.setProperty('--d', (Math.min(n, 8) * 0.08).toFixed(2) + 's');
        // A fully clipped element never counts as on screen, so photos and brushstrokes are checked by position
        if (k[0] === 'clip' || k[0] === 'sweep' || k[0] === 'write') clipped.push(el); else io.observe(el);
      });
    });
    requestAnimationFrame(checkClipped);
  }
  var clipped = [];
  function checkClipped() {
    var vh = innerHeight, show = [], hide = [];
    clipped.forEach(function (el) {
      if (!el.offsetParent) { if (el.classList.contains('in')) hide.push(el); return; }
      if (el.classList.contains('in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > vh * 0.04 && r.width) show.push(el);
    });
    hide.forEach(function (el) { el.classList.remove('in'); });
    show.forEach(function (el) { el.classList.add('in'); });
  }
  function countUp(b, delay) {
    // The number to reach is kept from the first run, so a count that starts again mid-way still ends right
    var src = b.getAttribute('data-to') || b.textContent.trim(), m = /^(\d[\d,]*)(.*)$/.exec(src); if (!m) return;
    b.setAttribute('data-to', src);
    var to = +m[1].replace(/,/g, ''), suf = m[2], t0 = 0, run = (+b.getAttribute('data-run') || 0) + 1;
    b.setAttribute('data-run', run); b.textContent = '0' + suf;
    setTimeout(function () { requestAnimationFrame(function tick(t) { if (+b.getAttribute('data-run') !== run) return; if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1500), e = 1 - Math.pow(1 - k, 3); b.textContent = Math.round(to * e).toLocaleString('en-US') + suf; if (k < 1) requestAnimationFrame(tick); }); }, delay || 0);
  }
  function countIn(el) { $$(COUNT, el).forEach(function (b) { countUp(b, 200); }); }

  // the page curtain: a Juniper panel with the crest covers the move from one page to the next
  var curtain = document.createElement('div');
  curtain.className = 'curtain'; curtain.setAttribute('aria-hidden', 'true'); curtain.innerHTML = '<img src="img/logo-icon.svg" alt="">';
  document.body.appendChild(curtain);
  var curtainBusy = false;
  // reading progress along the top of the screen
  var bar = document.createElement('div'); bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>';
  document.body.appendChild(bar);

  // ================= pages =================
  var views = {}, current = '', onRoute = [];
  var ALIAS = { fulshear: 'relocation', 'site-map': 'explore', homesites: 'available', dev: 'developer', campuses: 'school-map', 'builders-sec': 'builders' };
  $$('.view').forEach(function (v) { views[v.getAttribute('data-page')] = v; });
  function route(now) {
    var h = decodeURIComponent(location.hash.replace(/^#/, '')), parts = h.split('/'), page = ALIAS[parts[0]] || parts[0], anchor = ALIAS[parts[1]] || parts[1], arg = parts[2];
    if (!views[page]) {
      var el = page && document.getElementById(page), v = el && el.closest('.view');
      if (v) { arg = anchor; anchor = page; page = v.getAttribute('data-page'); } else page = 'home';
    }
    var changed = page !== current;
    // Moving to another page: the curtain rises over this one, the page changes behind it, then it lifts away
    if (changed && current && M && now !== true) {
      if (curtainBusy) return;
      curtainBusy = true; setMenu(false);
      curtain.classList.remove('leave'); curtain.classList.add('cover');
      setTimeout(function () {
        curtainBusy = false; route(true);
        curtain.classList.remove('cover'); curtain.classList.add('leave');
        setTimeout(function () { if (!curtainBusy) curtain.classList.remove('leave'); }, 800);
      }, 600);
      return;
    }
    if (changed) {
      Object.keys(views).forEach(function (k) { views[k].hidden = k !== page; });
      current = page;
      document.title = views[page].getAttribute('data-title') || document.title;
      $$('[data-nav]').forEach(function (a) { if (a.getAttribute('data-nav') === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      document.body.setAttribute('data-page', page);
      window.scrollTo({ top: 0, behavior: 'instant' });
      top.classList.remove('hide');
    }
    setMenu(false);
    if (anchor) {
      var target = document.getElementById(anchor);
      if (target) requestAnimationFrame(function () { target.scrollIntoView({ behavior: changed || reduce ? 'instant' : 'smooth', block: 'start' }); });
    }
    onRoute.forEach(function (f) { f(page, anchor, arg); });
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  window.addEventListener('hashchange', function () { route(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); route(); }
  });

  // ================= header, prototype note, menu =================
  var top = $('.top'), lastY = 0;
  addEventListener('scroll', function () {
    var y = scrollY;
    top.classList.toggle('scrolled', y > 40);
    if (menu.hidden) top.classList.toggle('hide', y > lastY && y > 260);
    lastY = y;
  }, { passive: true });
  var proto = $('#proto');
  if (store('be-proto') === 1) proto.hidden = true;
  $('[data-hide-proto]').addEventListener('click', function () { proto.hidden = true; store('be-proto', 1); });
  var menuBtn = $('.top-menu'), menu = $('#menu');
  var menuT;
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', open); document.body.classList.toggle('menu-open', open); clearTimeout(menuT);
    if (open) { menu.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('open'); }); }); }
    else if (!menu.hidden) { menu.classList.remove('open'); menuT = setTimeout(function () { menu.hidden = true; }, M ? 650 : 0); }
  }
  menuBtn.addEventListener('click', function () { var o = menu.hidden || !menu.classList.contains('open'); setMenu(o); if (o) $('a', menu).focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  document.addEventListener('click', function (e) { if (!menu.hidden && !e.target.closest('#menu, .top-menu')) setMenu(false); });

  // ================= viewer: masterplan, area attractions, disclaimer, photos =================
  var viewer = $('#viewer'), vbody = $('.viewer-body', viewer);
  var VIEWS = {
    masterplan: ['Belmont Estates masterplan', '<img src="img/masterplan.webp" width="2400" height="1553" alt="Belmont Estates masterplan, showing homesites by builder, ponds, trails and tree-lined streets"><p class="note">Conceptual rendering. Subject to change without notice.</p>'],
    area: ['Belmont Estates area attractions', '<img src="img/area-attractions.webp" width="2400" height="1600" alt="Belmont Estates area attractions map"><p class="note">Map not to scale.</p>'],
    disclaimer: ['Disclaimer', '<div class="text"><h2>Disclaimer</h2><p>Pricing and availability subject to change without notice. The masterplan is a conceptual rendering, subject to change without notice. Maps are not to scale. Homesite numbers are for this website’s site map only.</p><p>This website is a prototype. Forms don’t send anything yet.</p></div>']
  };
  function openHTML(label, html) {
    vbody.innerHTML = html; viewer.setAttribute('aria-label', label);
    if (!viewer.open) { if (viewer.showModal) viewer.showModal(); else viewer.setAttribute('open', ''); }
  }
  function openView(k) { var v = VIEWS[k]; if (v) openHTML(v[0], v[1]); }
  function closeView() { if (viewer.close) viewer.close(); else viewer.removeAttribute('open'); }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) { e.preventDefault(); openView(b.getAttribute('data-open')); } });
  $('.viewer-x', viewer).addEventListener('click', closeView);
  viewer.addEventListener('click', function (e) { if (e.target === viewer) closeView(); });

  // Social accounts aren't known yet: the links say so instead of going anywhere
  var SOCIAL = [['Facebook', '<path d="M14 8h3V4h-3c-2.5 0-4 1.6-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/>'], ['Instagram', '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".6"/>'], ['YouTube', '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="M10.5 9.5v5l4.5-2.5z"/>']];
  $$('[data-social]').forEach(function (el) {
    el.innerHTML = SOCIAL.map(function (s) { return '<a href="#" class="soc" data-soon="' + s[0] + '" aria-label="Belmont Estates on ' + s[0] + ' (coming soon)" title="The Belmont Estates ' + s[0] + ' page will be linked here."><svg viewBox="0 0 24 24" aria-hidden="true">' + s[1] + '</svg></a>'; }).join('');
  });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-soon]')) e.preventDefault(); });

  // ================= forms (prototype: nothing is sent) =================
  function thanks() { return '<div class="form-done" role="status"><p class="thanks">Thank you</p><p class="for">For your interest</p><p>We can’t wait to help you build your dream home in this beautiful community!</p><small>Prototype: this form doesn’t send anything yet.</small></div>'; }
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-form]'); if (!form) return;
    e.preventDefault();
    var bad = [];
    ['first', 'last', 'email'].forEach(function (n) {
      var el = form.elements.namedItem(n); if (!el) return;
      var ok = el.value.trim() && (n !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.closest('.field').classList.toggle('bad', !ok); if (!ok) bad.push(el);
    });
    var msg = $('.form-msg', form);
    if (bad.length) { msg.hidden = false; msg.textContent = 'Please add your first name, last name and a valid email address.'; bad[0].focus(); return; }
    var box = document.createElement('div'); box.innerHTML = thanks();
    form.innerHTML = ''; form.appendChild(box.firstChild);
  });
  document.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('bad'); });
  function prefill(interest, comment) {
    var sel = $('#f-interest'), com = $('#f-comments');
    if (sel && interest) { var o = $$('option', sel).filter(function (x) { return x.textContent === interest; })[0]; if (o) sel.value = interest; }
    if (com && comment) com.value = comment;
  }
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-interest]'); if (a) setTimeout(function () { prefill(a.getAttribute('data-interest'), a.getAttribute('data-comment')); }, 80); });

  // ================= statements that light up word by word as they scroll past =================
  var lit = $$('[data-highlight]').map(function (p) {
    var words = p.textContent.trim().split(/\s+/);
    p.setAttribute('aria-label', p.textContent.trim());
    p.innerHTML = words.map(function (w) { return '<span class="wd" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
    return { p: p, w: $$('.wd', p) };
  });
  function light() {
    var vh = innerHeight;
    lit.forEach(function (s) {
      if (!s.p.offsetParent) return;
      var r = s.p.getBoundingClientRect(), k = reduce ? 1 : Math.max(0, Math.min(1, (vh * .82 - r.top) / (r.height + vh * .3)));
      var n = Math.round(k * s.w.length);
      s.w.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    });
  }
  addEventListener('scroll', light, { passive: true }); addEventListener('resize', light); onRoute.push(function () { requestAnimationFrame(light); });

  // ================= marquee =================
  $$('[data-marquee]').forEach(function (el) {
    var row = el.getAttribute('data-marquee').split('|').map(function (t) { return '<span>' + t + '</span><img src="img/horseshoe.svg" alt="">'; }).join('');
    el.innerHTML = '<div>' + row + row + '</div><div>' + row + row + '</div>';
  });


  // ================= hero intro, scroll effects and hands-on touches =================
  var hero = $('.hero'), heroFirst = true;
  if (M) {
    var hw = $('.hero-h span');
    hw.innerHTML = hw.textContent.split('').map(function (c, i) { return '<span class="ch" style="--ci:' + i + '">' + esc(c) + '</span>'; }).join('');
    $$('.hero-stats li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  }
  // The photo rises in, UNBRIDLED rises letter by letter, "Living" is written in, then the copy and numbers follow
  var heroPlaying = false;
  function playHero() {
    if (!M || heroPlaying) return;
    heroPlaying = true; hero.classList.remove('ready'); void hero.offsetWidth;
    var start = function () { requestAnimationFrame(function () { heroPlaying = false; hero.classList.add('ready'); $$('.hero-stats b').forEach(function (b, i) { countUp(b, 1900 + i * 140); }); }); };
    var img = $('.hero-img');
    if (heroFirst && img.decode) img.decode().then(start, start); else start();
    heroFirst = false;
  }
  onRoute.push(function (page) { if (page === 'home') { if (!hero.classList.contains('ready')) playHero(); } else hero.classList.remove('ready'); });

  // Three family photos: they play on their own, each rising in from the bottom, and follow the dashes, a drag or the arrow keys
  var slides = $$('.hero-img'), dashes = $$('[data-slide]'), slideAt = 0, slideT = 0, heroHold = false, dragX = null, heroSet = $('.hero-slides');
  function runSlides() {
    clearTimeout(slideT); hero.classList.remove('run'); void hero.offsetWidth;
    if (!M || heroHold || current !== 'home') return;
    hero.classList.add('run');
    slideT = setTimeout(function () { if (scrollY > innerHeight || document.hidden) runSlides(); else showSlide(slideAt + 1); }, 6500);
  }
  function showSlide(i) {
    i = (i + slides.length) % slides.length;
    if (i !== slideAt) {
      slides.forEach(function (im, k) { im.classList.toggle('prev', k === slideAt); im.classList.toggle('on', k === i); });
      dashes.forEach(function (d, k) { d.setAttribute('aria-current', k === i); });
      slideAt = i;
    }
    runSlides();
  }
  var dashBox = $('.hero-dots');
  dashBox.addEventListener('click', function (e) { var b = e.target.closest('[data-slide]'); if (b) showSlide(+b.getAttribute('data-slide')); });
  dashBox.addEventListener('keydown', function (e) { var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); showSlide(slideAt + k); dashes[slideAt].focus(); } });
  dashBox.addEventListener('mouseenter', function () { heroHold = true; runSlides(); });
  dashBox.addEventListener('mouseleave', function () { heroHold = false; runSlides(); });
  hero.addEventListener('dragstart', function (e) { e.preventDefault(); });
  hero.addEventListener('pointerdown', function (e) { if (!e.target.closest('button, a')) dragX = e.clientX; });
  addEventListener('pointerup', function (e) { if (dragX === null) return; var dx = e.clientX - dragX; dragX = null; if (Math.abs(dx) > 50) showSlide(slideAt + (dx < 0 ? 1 : -1)); });
  if (M && matchMedia('(hover: hover)').matches) hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect(); heroSet.style.translate = (((e.clientX - r.left) / r.width - .5) * -22).toFixed(1) + 'px ' + (((e.clientY - r.top) / r.height - .5) * -14).toFixed(1) + 'px';
  });
  onRoute.push(function (page) { if (page === 'home') runSlides(); else clearTimeout(slideT); });
  if (M) {
    requestAnimationFrame(function () { top.classList.add('shown'); });
    setTimeout(function () { $('#dock').classList.add('shown'); $('.ask').classList.add('shown'); }, 1700);
  }

  // Scroll: the progress line, gentle parallax on the script words and brushstrokes, and a ticker that speeds up with you
  var PAR = $$('.ghost, .dev-year, .deco, .hero-img'), mq = [], mqRate = 1, lastS = scrollY, ticking = false;
  function frame() {
    ticking = false;
    var y = scrollY, dy = y - lastS, vh = innerHeight, max = document.documentElement.scrollHeight - vh; lastS = y;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
    if (!M) return;
    checkClipped();
    PAR.forEach(function (el) {
      if (!el.offsetParent) return;
      var r = el.getBoundingClientRect(); if (r.bottom < -300 || r.top > vh + 300) return;
      if (el.classList.contains('hero-img')) { el.style.translate = '0 ' + (Math.min(y, vh) * 0.25).toFixed(1) + 'px'; return; }
      var k = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.translate = el.classList.contains('deco') ? '0 ' + (k * -70).toFixed(1) + 'px' : (k * -90).toFixed(1) + 'px 0';
    });
    if (!mq.length) mq = $$('.mq-track').map(function (t) { return t.getAnimations ? t.getAnimations()[0] : null; }).filter(Boolean);
    mqRate = Math.max(1 + Math.min(5, Math.abs(dy) / 10), 1 + (mqRate - 1) * 0.9);
    mq.forEach(function (a) { a.playbackRate = mqRate; });
    if (mqRate > 1.02) { ticking = true; requestAnimationFrame(frame); }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', function () { requestAnimationFrame(frame); });
  onRoute.push(function () { requestAnimationFrame(frame); setTimeout(frame, 120); });

  // Cards and photos lean toward the pointer with a soft light; round buttons are pulled toward it
  var TILT = '.tile, .rel-tile, .photo-card, .mb-card, .gal, .dg-thumb', MAG = '.round-btn, .ask', tiltEl = null, magEl = null;
  if (M && matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest ? e.target.closest(TILT) : null;
      if (tiltEl && tiltEl !== t) { tiltEl.style.transform = ''; tiltEl = null; }
      if (t) {
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, yy = (e.clientY - r.top) / r.height; tiltEl = t;
        t.style.transform = 'perspective(1000px) rotateX(' + ((.5 - yy) * 5).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 6).toFixed(2) + 'deg)';
        t.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); t.style.setProperty('--my', (yy * 100).toFixed(1) + '%');
      }
      var m = e.target.closest ? e.target.closest(MAG) : null;
      if (magEl && magEl !== m) { magEl.style.translate = ''; magEl = null; }
      if (m) { var q = m.getBoundingClientRect(); magEl = m; m.style.translate = ((e.clientX - q.left - q.width / 2) * .2).toFixed(1) + 'px ' + ((e.clientY - q.top - q.height / 2) * .3).toFixed(1) + 'px'; }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { if (tiltEl) tiltEl.style.transform = ''; if (magEl) magEl.style.translate = ''; tiltEl = magEl = null; });
  }

  // Every photo in a figure can be seen larger
  var XL = 'figure, .photo-card, .am-card, .step, .news-card';
  function addExpand() {
    $$('.collage figure, .pt-pair figure, .grace-row figure, .arr-pics figure, .photo-card, .am-card:not(.noimg), .step').forEach(function (f) {
      if ($('.xl', f)) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'xl'; b.setAttribute('aria-label', 'See this photo larger'); b.innerHTML = ICON.expand; f.appendChild(b);
    });
  }
  addExpand();
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.xl'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var f = b.closest(XL), img = $('img', f), cap = $('figcaption, b, h3', f);
    openHTML(img.alt || 'Photo', '<figure class="lb"><img src="' + (img.currentSrc || img.src) + '" alt="' + esc(img.alt) + '"><figcaption><b>' + esc(cap ? cap.textContent : img.alt) + '</b></figcaption></figure>');
  }, true);
  scan(document);

  // ================= load the kit content, then build everything that uses it =================
  // Route again once it's built: the page has grown, and links like #community/explore/12 need the site map
  route();
  fetch('content/knowledge.json').then(function (r) { return r.json(); }).then(function (k) { K = k; build(); route(); })
    .catch(function () { $$('[data-faq],[data-cats],[data-faq-all]').forEach(function (el) { el.innerHTML = '<p class="faq-empty">The answers couldn’t load. Please refresh the page.</p>'; }); });

  function build() {
    var BY = {}; K.builders.forEach(function (b) { BY[b.id] = b; });
    var COLORS = K.builderColors, CAT = {}; K.categories.forEach(function (c) { CAT[c.id] = c.color; });
    var PLACE = {}; K.places.forEach(function (p) { PLACE[p[0]] = { n: p[0], name: p[1], cat: p[2] }; });
    var LOTS = DATA.plan.lots, counts = {}; LOTS.forEach(function (l) { counts[l.b || 'future'] = (counts[l.b || 'future'] || 0) + 1; });
    var P1 = LOTS.length - counts.future;
    var AM = {}; K.amenities.forEach(function (a) { AM[a.id] = a; });
    var explorers = {}, areamaps = {};
    function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
    function builderName(id) { return BY[id] ? BY[id].name : ''; }
    function showHomesites(f) { go('#homes/available'); setTimeout(function () { if (explorers.homes) explorers.homes.filter(f || {}); }, 60); }

    // ---------- real maps: MapLibre loads only when a map comes near the screen ----------
    var G = window.BE_GEO, PL = window.BE_PLACES, glLoad = null, STREETS = 'https://tiles.openfreemap.org/styles/positron';
    var GLOK = !!G && (function () { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (x) { return false; } })();
    function loadGL() {
      return glLoad || (glLoad = new Promise(function (ok, no) {
        var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'js/vendor/maplibre-gl.css'; document.head.appendChild(l);
        var sc = document.createElement('script'); sc.src = 'js/vendor/maplibre-gl.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc);
      }));
    }
    function whenNear(box, fn) { if (GLOK) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); loadGL().then(fn, function () {}); } }, { rootMargin: '600px' }).observe(box); }
    function boundsOf(pts) { var b = new maplibregl.LngLatBounds(pts[0], pts[0]); pts.forEach(function (q) { b.extend(q); }); return b; }
    function crestMark() { var d = document.createElement('div'); d.className = 'map-crest'; d.innerHTML = '<img src="img/logo-icon.svg" alt="Belmont Estates">'; return d; }
    function parcelLayers(map) {
      map.addSource('parcel', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [G.parcel] } } });
      map.addLayer({ id: 'parcel-fill', type: 'fill', source: 'parcel', paint: { 'fill-color': '#C7B36E', 'fill-opacity': .22 } });
      map.addLayer({ id: 'parcel-line', type: 'line', source: 'parcel', paint: { 'line-color': '#42516B', 'line-width': 2, 'line-dasharray': [2, 1.5] } });
    }

    // ---------- search dock ----------
    var dock = $('#dock');
    dock.addEventListener('submit', function (e) {
      e.preventDefault(); var f = dock.elements;
      showHomesites({ builder: f.b.value, phase: f.p.value });
    });
    // The dock steps aside for the newsletter, the footer and the site maps (they have their own filters)
    var covering = [];
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (x) { var k = covering.indexOf(x.target); if (x.isIntersecting && k < 0) covering.push(x.target); if (!x.isIntersecting && k >= 0) covering.splice(k, 1); });
        dock.classList.toggle('away', covering.length > 0);
      }, { threshold: 0.05 });
      $$('.news-band, .foot, .fmx, .schoolmap, .loc-map').forEach(function (x) { io.observe(x); });
    }

    // ---------- steps ----------
    var STEPS = [
      ['Register your interest', 'Stay connected and we’ll be in touch about homesites and homes at Belmont Estates.', 'img/life-grandpa.webp', '#contact/get-in-touch'],
      ['Explore the homesites', 'See every homesite on the interactive site map, with Phase 1 homesites by builder.', 'img/site-plan.webp', '#community/explore'],
      ['Meet our builders', 'Selected for their distinctive design approach and unrivaled quality construction.', 'img/home-interior.webp', '#homes/builders'],
      ['Build your dream home', 'With 2 acres, you can design the home of your dreams, and our builders are ready to help.', 'img/dream-home.webp', '#homes']
    ];
    var tabs = $('.steps-tabs'), srow = $('[data-steps]');
    if (tabs && srow) {
      tabs.innerHTML = STEPS.map(function (s, i) { return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-step="' + i + '">Step ' + (i + 1) + '</button>'; }).join('');
      srow.innerHTML = STEPS.map(function (s, i) { return '<article class="step' + (i ? '' : ' on') + '" data-step="' + i + '"><small>Step ' + (i + 1) + '</small><h3>' + s[0] + '</h3><p>' + s[1] + '</p><a class="link-arrow" href="' + s[3] + '">Go</a><img src="' + s[2] + '" alt="" loading="lazy"></article>'; }).join('');
      var stepAt = 0, stepHold = false, stepsSeen = false;
      var setStep = function (n) { stepAt = n; $$('[data-step]', tabs).forEach(function (b) { b.setAttribute('aria-selected', +b.getAttribute('data-step') === n); }); $$('.step', srow).forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-step') === n); }); };
      tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-step]'); if (b) setStep(+b.getAttribute('data-step')); });
      srow.addEventListener('mouseover', function (e) { var s = e.target.closest('.step'); if (s && +s.getAttribute('data-step') !== stepAt) setStep(+s.getAttribute('data-step')); });
      // The steps play through on their own while they're on screen, and wait while you point at one
      srow.addEventListener('mouseenter', function () { stepHold = true; }); srow.addEventListener('mouseleave', function () { stepHold = false; });
      srow.addEventListener('focusin', function () { stepHold = true; }); srow.addEventListener('focusout', function () { stepHold = false; });
      if (M) {
        new IntersectionObserver(function (es) { stepsSeen = es[0].isIntersecting; }, { threshold: 0.3 }).observe(srow);
        setInterval(function () { if (stepsSeen && !stepHold && !document.hidden) setStep((stepAt + 1) % STEPS.length); }, 4200);
      }
    }

    // ---------- FAQ ----------
    function faqItem(i, withCat) { var q = K.faq[i]; return '<details data-i="' + i + '"><summary><span>' + (withCat ? '<span class="cat-tag">' + esc(K.cats[q[0]]) + '</span>' : '') + esc(q[1]) + '</span></summary><p>' + esc(q[2]) + '</p></details>'; }
    $$('[data-faq]').forEach(function (el) { el.innerHTML = el.getAttribute('data-faq').split(',').map(function (n) { return faqItem(+n); }).join(''); var d = $('details', el); if (d) d.open = true; });
    $$('[data-faq-total]').forEach(function (el) { el.textContent = (el.getAttribute('data-faq-total') === 'search' ? 'Search all ' : 'Browse ') + K.faq.length + ' answers about the homesites, builders, lifestyle, Fulshear and schools, or ask our concierge.'; });
    var faqCat = -1, faqQ = '', all = $('[data-faq-all]'), count = $('.faq-count');
    function drawFaq() {
      if (!all) return; var q = faqQ.trim().toLowerCase(), html = '', n = 0;
      K.faq.forEach(function (it, i) { if (faqCat !== -1 && it[0] !== faqCat) return; if (q && (it[1] + ' ' + it[2]).toLowerCase().indexOf(q) === -1) return; html += faqItem(i, true); n++; });
      all.innerHTML = html || '<p class="faq-empty">No answer matches that yet. Try another word, or ask the concierge.</p>';
      count.textContent = n + ' of ' + K.faq.length + ' questions';
    }
    function catCount(c) { return K.faq.filter(function (q) { return q[0] === c; }).length; }
    $$('[data-cats]').forEach(function (el) {
      var isFaq = el.getAttribute('data-cats') === 'faq';
      el.innerHTML = K.cats.map(function (c, i) { return '<button type="button" class="cat" data-cat="' + i + '"' + (isFaq ? ' aria-pressed="false"' : '') + '><span>' + esc(c) + '</span><span class="n">' + ('0' + catCount(i)).slice(-2) + '</span></button>'; }).join('') +
        (isFaq ? '<button type="button" class="cat all" data-cat="-1" aria-pressed="true"><span>All questions</span><span class="n">' + K.faq.length + '</span></button>' : '');
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cat]'); if (!b) return;
        setFaqCat(+b.getAttribute('data-cat'));
        if (!isFaq) go('#contact/questions');
      });
    });
    function setFaqCat(c) { faqCat = c; $$('[data-cats="faq"] .cat').forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-cat') === c); }); drawFaq(); }
    var fs = $('#faq-search'); if (fs) fs.addEventListener('input', function () { faqQ = fs.value; drawFaq(); });
    drawFaq();

    // ---------- masterplan poster legend ----------
    $$('[data-legend]').forEach(function (el) {
      el.innerHTML = K.builders.map(function (b) { return '<li><button type="button" data-legend-b="' + b.id + '"><i style="background:' + COLORS[b.id] + '"></i><span>' + esc(b.name) + '<small>' + plural(counts[b.id], 'Phase 1 homesite') + '</small></span></button></li>'; }).join('') +
        '<li><button type="button" data-legend-b="future"><i class="future"></i><span>Future development<small>' + plural(counts.future, 'homesite') + '</small></span></button></li>' +
        '<li><span class="lg-ic">' + ICON.water + '</span><span>Ponds<small>Along the north edge</small></span></li>' +
        '<li><span class="lg-ic">' + ICON.trail + '</span><span>Trails<small>For walking and jogging</small></span></li>' +
        '<li><span class="lg-ic">' + ICON.gate + '</span><span>Entries<small>Two, on the west side</small></span></li>';
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-legend-b]'); if (!b) return; var id = b.getAttribute('data-legend-b');
        go('#community/explore'); setTimeout(function () { explorers.community.filter(id === 'future' ? { phase: 'future' } : { builder: id }); }, 60);
      });
    });

    // ================= interactive site map =================
    var saved = (store('be-saved') || []).filter(function (n) { return n >= 1 && n <= LOTS.length; });
    function isSaved(n) { return saved.indexOf(n) >= 0; }
    function toggleSave(n) {
      if (isSaved(n)) saved.splice(saved.indexOf(n), 1); else saved.push(n);
      store('be-saved', saved);
      Object.keys(explorers).forEach(function (k) { explorers[k].savedChanged(); });
    }
    function lotBox(l) {
      var xs = [], ys = []; l.d.replace(/[MZ]/g, ' ').trim().split(/\s+/).forEach(function (p) { var a = p.split(','); xs.push(+a[0]); ys.push(+a[1]); });
      return [Math.min.apply(0, xs), Math.min.apply(0, ys), Math.max.apply(0, xs), Math.max.apply(0, ys)];
    }
    var BOX = LOTS.map(lotBox);
    function lotThumb(i) {
      var b = BOX[i], w = b[2] - b[0], h = b[3] - b[1], s = Math.max(w, h) * 1.25, x = b[0] + w / 2 - s / 2, y = b[1] + h / 2 - s / 2, l = LOTS[i];
      return '<svg viewBox="' + [x, y, s, s].map(function (v) { return v.toFixed(1); }).join(' ') + '" aria-hidden="true"><path d="' + l.d + '" fill="' + (l.b ? COLORS[l.b] : '#FBF8F1') + '" stroke="#FFFFFF" stroke-width="' + (s / 40).toFixed(2) + '"/><text x="' + l.c[0] + '" y="' + l.c[1] + '" font-size="' + (s / 6).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" fill="' + (l.b === 'autograph' || l.b === 'pib' ? '#FAF8F2' : '#3F4748') + '">' + (i + 1) + '</text></svg>';
    }

    function explorer(el, key) {
      var W = DATA.plan.w, H = DATA.plan.h, VB = [0, 0, W, H], vb = VB.slice();
      var f = { builder: '', phase: '', saved: false }, sort = 'num', tab = 'homesites', layout = 'grid', sel = -1, open = innerWidth < 900, mode = '2d', layer = 'art';
      var builderOpts = K.builders.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join('');
      var pins = [];
      K.amenities.forEach(function (a) { a.at.forEach(function (p, j) { pins.push({ a: a, x: p[0], y: p[1], ll: G ? G.pins[a.id][j] : null }); }); });
      el.innerHTML =
        '<div class="fmx-bar">' +
          '<div class="fmx-seg" role="group" aria-label="View"><button type="button" data-view="map" aria-pressed="true">' + ICON.map + 'Map view</button><button type="button" data-view="plans" aria-pressed="false">Explore plans</button></div>' +
          '<label class="fmx-sel"><span class="sr">Builder</span><select data-f="builder"><option value="">Builder</option>' + builderOpts + '</select></label>' +
          '<label class="fmx-sel"><span class="sr">Phase</span><select data-f="phase"><option value="">Phase</option><option value="1">Phase 1</option><option value="future">Future development</option></select></label>' +
          '<label class="fmx-sel"><span class="sr">Homesite size</span><select data-f="size"><option value="">Homesite size</option><option value="2">2 acres</option></select></label>' +
          '<button type="button" class="fmx-reset">Reset</button>' +
          '<button type="button" class="fmx-fav" aria-pressed="false">' + ICON.heart + 'Favorites <b>0</b></button>' +
        '</div>' +
        '<div class="fmx-sub"><p class="fmx-count" aria-live="polite"></p><label class="fmx-sort">Sort by <select data-sort><option value="num">Homesite number</option><option value="builder">Builder</option><option value="phase">Phase 1 first</option></select></label></div>' +
        '<div class="fmx-body">' +
          '<div class="fmx-map">' +
            '<div class="fmx-canvas"><div class="fmx-plan"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Belmont Estates site map with every homesite">' +
              '<rect class="fmx-ground" width="' + W + '" height="' + H + '"/><image class="fmx-art" href="img/site-plan.webp" width="' + W + '" height="' + H + '"/>' +
              '<g class="fmx-lots">' + LOTS.map(function (l, i) { return '<path class="fmx-lot ' + (l.b || 'future') + '" data-i="' + i + '" d="' + l.d + '" style="--c:' + (l.b ? COLORS[l.b] : '#FBF8F1') + ';--k:' + i + '"/>'; }).join('') + '</g>' +
              '<g class="fmx-nums" text-anchor="middle">' + LOTS.map(function (l, i) { return '<text x="' + l.c[0] + '" y="' + (l.c[1] + 2.4) + '"' + (l.b === 'autograph' || l.b === 'pib' ? ' class="dark"' : '') + '>' + (i + 1) + '</text>'; }).join('') + '</g></svg>' +
              '<div class="fmx-pins">' + pins.map(function (p, k) { return '<button type="button" class="fmx-pin pin-' + p.a.id + '" data-pin="' + k + '" style="--k:' + k + '" aria-label="' + esc(p.a.name) + '">' + ICON[p.a.icon] + '</button>'; }).join('') + '</div>' +
            '</div></div>' +
            '<div class="fmx-glmap"></div>' +
            '<div class="fmx-ctrl"><button type="button" data-c="layers" aria-label="Map layers" aria-expanded="false">' + ICON.layers + '</button>' +
              '<div class="fmx-layers" hidden><button type="button" data-layer="art" aria-pressed="true">Masterplan</button><button type="button" data-layer="flat" aria-pressed="false">Homesites only</button></div>' +
              '<button type="button" data-c="fit" aria-label="Show the whole community">' + ICON.fit + '</button>' +
              '<div class="fmx-zoom"><button type="button" data-z="1" aria-label="Zoom in">+</button><button type="button" data-z="-1" aria-label="Zoom out">−</button></div>' +
              '<button type="button" data-c="north" class="only-gl" aria-label="Reset the map to north up">' + ICON.compass + '</button></div>' +
            '<button type="button" class="fmx-showlist" aria-expanded="false"></button>' +
            '<div class="fmx-legend"><p class="fmx-lh">Legend</p><ul>' +
              K.builders.map(function (b) { return '<li><button type="button" data-lb="' + b.id + '"><i style="background:' + COLORS[b.id] + '"></i>' + esc(b.name) + '<b>' + counts[b.id] + '</b></button></li>'; }).join('') +
              '<li><button type="button" data-lb="future"><i class="future"></i>Future development<b>' + counts.future + '</b></button></li></ul>' +
              '<ul class="fmx-lkey"><li><i class="sel"></i>Selected homesite</li><li><i class="fav">' + ICON.heart + '</i>Saved homesite</li><li><i class="pond"></i>Pond</li><li><i class="trail"></i>Trail</li><li><i class="green"></i>Green space</li><li><i class="bound"></i>Community boundary</li>' +
              K.amenities.filter(function (a) { return a.at.length; }).map(function (a) { return '<li><i class="mk pin-' + a.id + '">' + ICON[a.icon] + '</i>' + esc(a.name) + '</li>'; }).join('') + '</ul></div>' +
            '<button type="button" class="fmx-info" aria-label="Show the legend" title="Legend" aria-pressed="false">' + ICON.info + '</button>' +
            '<div class="fmx-dim" role="group" aria-label="2D or 3D"><button type="button" data-mode="2d" aria-pressed="true">2D</button><button type="button" data-mode="3d" aria-pressed="false">3D</button></div>' +
            '<div class="fmx-hover" hidden></div>' +
          '</div>' +
          '<aside class="fmx-side">' +
            '<div class="fmx-list"><div class="fmx-tabs"><div role="tablist" aria-label="Listings"><button type="button" role="tab" data-tab="homesites" aria-selected="true">Homesites <b>' + LOTS.length + '</b></button><button type="button" role="tab" data-tab="builders" aria-selected="false">Builders <b>' + K.builders.length + '</b></button><button type="button" role="tab" data-tab="amenities" aria-selected="false">Amenities <b>' + K.amenities.length + '</b></button></div>' +
              '<div class="fmx-gl" role="group" aria-label="Layout"><button type="button" data-gl="grid" aria-pressed="true">Grid</button><button type="button" data-gl="list" aria-pressed="false">List</button></div></div><div class="fmx-cards grid"></div></div>' +
            '<div class="fmx-detail" hidden></div>' +
          '</aside>' +
          '<div class="fmx-plans" hidden></div>' +
        '</div>' +
        '<p class="fmx-note">Homesite outlines are traced from the Belmont Estates masterplan (2/25), a conceptual rendering subject to change without notice, and fitted to satellite imagery, so positions are approximate. Homesite numbers are for this map only; homesite details are sample information until our builders release them.</p>';

      var svg = $('.fmx-plan > svg', el), canvas = $('.fmx-canvas', el), plan = $('.fmx-plan', el), hover = $('.fmx-hover', el), cards = $('.fmx-cards', el), detail = $('.fmx-detail', el), list = $('.fmx-list', el), body = $('.fmx-body', el);
      var pinEls = $$('.fmx-pin', el), countEl = $('.fmx-count', el), showBtn = $('.fmx-showlist', el), favBtn = $('.fmx-fav', el), plans = $('.fmx-plans', el);

      function match(i) {
        var b = LOTS[i].b;
        if (f.builder && b !== f.builder) return false;
        if (f.phase === '1' && !b) return false;
        if (f.phase === 'future' && b) return false;
        if (f.saved && !isSaved(i + 1)) return false;
        return true;
      }
      function ids() {
        var r = LOTS.map(function (l, i) { return i; }).filter(match);
        if (sort === 'builder') r.sort(function (a, b) { return (builderName(LOTS[a].b) || '~').localeCompare(builderName(LOTS[b].b) || '~') || a - b; });
        if (sort === 'phase') r.sort(function (a, b) { return (LOTS[a].b ? 0 : 1) - (LOTS[b].b ? 0 : 1) || a - b; });
        return r;
      }
      function statusChip(l) { return l.b ? '<span class="chip p1">Phase 1 · ' + esc(builderName(l.b)) + '</span>' : '<span class="chip fut">Future development</span>'; }
      function heart(n) { return '<button type="button" class="fmx-heart" data-save="' + n + '" aria-pressed="' + isSaved(n) + '" aria-label="' + (isSaved(n) ? 'Remove homesite ' + n + ' from favorites' : 'Save homesite ' + n) + '">' + ICON.heart + '</button>'; }
      function drawCards() {
        if (tab === 'homesites') {
          var r = ids();
          cards.innerHTML = r.length ? r.map(function (i, j) {
            var l = LOTS[i];
            return '<article class="fmx-card' + (i === sel ? ' on' : '') + '" data-i="' + i + '" style="--k:' + Math.min(j, 12) + '"><button type="button" class="fmx-card-main" data-pick="' + i + '"><span class="fmx-thumb">' + lotThumb(i) + '</span><span class="fmx-card-t">Homesite ' + (i + 1) + '</span><span class="fmx-card-m">' + (l.b ? 'Phase 1 · ' + esc(builderName(l.b)) : 'Future development') + '</span><span class="fmx-card-m">2 acres · 87,120 sq ft</span>' + statusChip(l) + '</button>' + heart(i + 1) + '</article>';
          }).join('') : '<p class="fmx-empty">' + (f.saved ? 'No saved homesites yet. Select the heart on any homesite to save it here.' : 'No homesites match these filters. Reset them to see every homesite.') + '</p>';
        } else if (tab === 'builders') {
          cards.innerHTML = K.builders.map(function (b, j) {
            return '<article class="fmx-bcard" style="--k:' + j + '"><div class="fmx-blogo"><img src="' + b.logo + '" alt="' + esc(b.name) + '" width="' + b.w + '" height="' + b.h + '" loading="lazy"></div><p><b>' + esc(b.name) + '</b> is assigned ' + plural(counts[b.id], 'Phase 1 homesite') + ' on the masterplan. Home designs for Belmont Estates’ 2-acre homesites will be listed here as they are released.</p>' +
              '<div class="fmx-acts"><button type="button" class="btn btn-ink" data-only="' + b.id + '">See their homesites</button><a class="link-arrow" href="#homes/builders">About ' + esc(b.name) + '</a><a class="link-arrow" href="#contact/get-in-touch" data-interest="' + esc(b.name) + '">Get updates</a></div></article>';
          }).join('');
        } else {
          cards.innerHTML = K.amenities.map(function (a, j) {
            return '<article class="fmx-acard" style="--k:' + j + '"><button type="button" data-amenity="' + a.id + '"><span class="fmx-aic">' + ICON[a.icon] + '</span><span><b>' + esc(a.name) + '</b><span class="chip">' + esc(a.status) + '</span><span class="fmx-atext">' + esc(a.text) + '</span></span></button></article>';
          }).join('');
        }
        cards.classList.toggle('grid', layout === 'grid' && tab === 'homesites');
      }
      function drawMap() {
        $$('.fmx-lot', el).forEach(function (p) { var i = +p.getAttribute('data-i'); p.classList.toggle('dim', !match(i)); p.classList.toggle('sel', i === sel); p.classList.toggle('fav', isSaved(i + 1)); });
        var n = ids().length;
        countEl.innerHTML = '<b>' + n + '</b> of <b>' + LOTS.length + '</b> homesites' + (f.builder ? ' · ' + esc(builderName(f.builder)) : '') + (f.phase ? ' · ' + (f.phase === '1' ? 'Phase 1' : 'Future development') : '') + (f.saved ? ' · Saved' : '');
        $('[data-f="builder"]', el).value = f.builder; $('[data-f="phase"]', el).value = f.phase;
        favBtn.setAttribute('aria-pressed', f.saved); $('b', favBtn).textContent = saved.length;
        $$('[data-lb]', el).forEach(function (b) { var id = b.getAttribute('data-lb'); b.setAttribute('aria-pressed', id === 'future' ? f.phase === 'future' : f.builder === id); });
        glSync();
      }
      function filter(o) {
        f.builder = o.builder && BY[o.builder] ? o.builder : ''; f.phase = o.phase === '1' || o.phase === 'future' ? o.phase : ''; f.saved = !!o.saved;
        if (f.builder && f.phase === 'future') f.phase = '';
        if (sel >= 0 && !match(sel)) closeDetail();
        setTab('homesites'); setView('map'); drawMap(); drawCards();
        if (o.builder || o.phase) setOpen(true);
      }
      function setTab(t) { tab = t; $$('[data-tab]', el).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === t); }); $('.fmx-gl', el).hidden = t !== 'homesites'; drawCards(); }
      function setOpen(o) {
        open = o; el.classList.toggle('listing', o);
        showBtn.innerHTML = (o ? '' : ICON.chev) + (o ? 'Hide listings' : 'Show listings') + (o ? '<span class="r">' + ICON.chev + '</span>' : '');
        showBtn.setAttribute('aria-expanded', o);
        requestAnimationFrame(apply);
      }
      function setView(v) {
        $$('[data-view]', el).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v); });
        plans.hidden = v !== 'plans'; el.classList.toggle('plans-on', v === 'plans');
        if (v === 'plans' && !plans.innerHTML) plans.innerHTML = '<div class="fmx-plans-in"><h3>Home plans coming soon</h3><p>William David Homes, Toll Brothers, Partners in Building and Autograph Homes will offer designs for Belmont Estates’ 2-acre homesites. Floor plans and elevations will be listed here, grouped by builder, as they are released.</p><div class="fmx-plan-cards">' +
          K.builders.map(function (b) { return '<article><span class="chip">Designs to come</span><div class="fmx-blogo"><img src="' + b.logo + '" alt="' + esc(b.name) + '" width="' + b.w + '" height="' + b.h + '" loading="lazy"></div><p>Plans, elevations, square footage and starting prices from ' + esc(b.name) + ' will appear here.</p><a class="link-arrow" href="#contact/get-in-touch" data-interest="' + esc(b.name) + '" data-comment="Please send me ' + esc(b.name) + ' plan updates for Belmont Estates.">Get plan updates</a></article>'; }).join('') + '</div></div>';
      }
      function closeDetail() { sel = -1; detail.hidden = true; list.hidden = false; drawMap(); $$('.fmx-card', el).forEach(function (c) { c.classList.remove('on'); }); }
      function pick(i, fly) {
        sel = i; var l = LOTS[i], n = i + 1, b = BY[l.b];
        setOpen(true); setView('map'); list.hidden = true; detail.hidden = false; drawMap();
        var bb = BOX[i], cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, s = Math.max(bb[2] - bb[0], bb[3] - bb[1]) * 2.6;
        var scene = '<svg viewBox="' + [cx - s * .8, cy - s / 2, s * 1.6, s].map(function (v) { return v.toFixed(1); }).join(' ') + '" aria-hidden="true"><image href="img/site-plan.webp" width="' + DATA.plan.w + '" height="' + DATA.plan.h + '"/><path d="' + l.d + '" class="hl"/></svg>';
        detail.innerHTML = '<div class="fmx-dh"><div><p class="eyebrow">' + (b ? 'Phase 1 · ' + esc(b.name) : 'Future development') + '</p><h3>Homesite ' + n + '</h3></div><button type="button" class="fmx-x" aria-label="Close homesite ' + n + '">' + ICON.close + '</button></div>' +
          '<div class="fmx-dacts"><a class="btn btn-gold" href="#contact/get-in-touch" data-interest="' + (b ? esc(b.name) : 'Homesites') + '" data-comment="I’m interested in homesite ' + n + (b ? ' (' + esc(b.name) + ')' : '') + ' on the Belmont Estates site map.">Register interest</a>' +
            '<button type="button" class="fmx-dbtn" data-save="' + n + '" aria-pressed="' + isSaved(n) + '">' + ICON.heart + '<span>' + (isSaved(n) ? 'Saved' : 'Save') + '</span></button><button type="button" class="fmx-dbtn" data-share="' + n + '">' + ICON.share + '<span>Share</span></button></div>' +
          '<div class="fmx-dacts two"><a class="fmx-dbtn ink" href="' + lotDir(i) + '" target="_blank" rel="noopener">' + ICON.nav + '<span>Get directions</span></a><a class="fmx-dbtn" href="' + lotMap(i) + '" target="_blank" rel="noopener">' + ICON.pin + '<span>Open in Google Maps</span></a></div>' +
          '<p class="fmx-small">Opens Google Maps at this homesite, so you can see the drive and what is nearby. Streets inside Belmont Estates may not show yet.</p>' +
          '<figure class="fmx-scene">' + scene + '<figcaption>Homesite ' + n + ' on the masterplan.</figcaption></figure>' +
          '<dl class="fmx-stats"><div><dt>Homesite size</dt><dd>2 acres</dd></div><div><dt>Area</dt><dd>87,120 sq ft</dd></div><div><dt>Price</dt><dd>To be announced</dd></div><div><dt>Phase</dt><dd>' + (b ? 'Phase 1' : 'Future development') + '</dd></div><div><dt>Builder</dt><dd>' + (b ? esc(b.name) : 'To be announced') + '</dd></div><div><dt>Homesite</dt><dd>' + n + ' of ' + LOTS.length + '</dd></div></dl>' +
          (b ? '<div class="fmx-dbuilder"><div class="fmx-blogo"><img src="' + b.logo + '" alt="' + esc(b.name) + '" width="' + b.w + '" height="' + b.h + '"></div><div><button type="button" class="link-arrow" data-only="' + l.b + '">See their homesites</button><a class="link-arrow" href="#homes/builders">About ' + esc(b.name) + '</a></div></div>' : '<p class="fmx-small">Builders for the Future Development homesites haven’t been announced. Register your interest to hear first.</p>') +
          '<div class="fmx-dplans"><b>Home plans</b><p>Builder floor plans and elevations for this homesite will appear here as they are released.</p></div>' +
          '<p class="fmx-small">The 2-acre size comes from the Belmont Estates materials. The outline is traced from the masterplan, a conceptual rendering subject to change without notice.</p>';
        detail.scrollTop = 0;
        if (fly && map) map.fitBounds(boundsOf(G.lots[i]), { padding: 90, maxZoom: 17.7, duration: reduce ? 0 : 1000, pitch: map.getPitch(), bearing: map.getBearing() });
        // Zoom so the homesite takes about a fifth of the map's width
        if (fly && !map) { var k = Math.max(.25, Math.min(1, (bb[2] - bb[0]) * 5 / W)); vb = [cx - W * k / 2, cy - H * k / 2, W * k, H * k]; clamp(); apply(); }
      }
      function savedChanged() {
        drawMap(); if (tab === 'homesites') drawCards();
        $$('[data-save]', el).forEach(function (b) { var n = +b.getAttribute('data-save'), on = isSaved(n); b.setAttribute('aria-pressed', on); var t = $('span', b); if (t) t.textContent = on ? 'Saved' : 'Save'; });
      }
      function share(n) {
        var url = location.href.split('#')[0] + (key === 'homes' ? '#homes/available/' : '#community/explore/') + n;
        var t = 'Homesite ' + n + ' at Belmont Estates';
        if (navigator.share) { navigator.share({ title: t, url: url }).catch(function () {}); return; }
        var done = function () { var b = $('[data-share] span', detail); if (b) { b.textContent = 'Link copied'; setTimeout(function () { b.textContent = 'Share'; }, 1800); } };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link', url); }); else prompt('Copy this link', url);
      }
      // The middle of a homesite, for directions
      function lotLL(i) { var g = G.lots[i], x = 0, y = 0, n = g.length - 1; for (var k = 0; k < n; k++) { x += g[k][0]; y += g[k][1]; } return (y / n).toFixed(6) + ',' + (x / n).toFixed(6); }
      function lotDir(i) { return G ? 'https://www.google.com/maps/dir/?api=1&destination=' + lotLL(i) : HOME_DIR; }
      function lotMap(i) { return G ? MAPS + lotLL(i) : HOME_MAP; }
      function flyTo(x, y) { var k = .42; vb = [x - W * k / 2, y - H * k / 2, W * k, H * k]; clamp(); apply(); }
      function apply() {
        if (el.classList.contains('gl')) return;
        svg.setAttribute('viewBox', vb.map(function (v) { return v.toFixed(1); }).join(' '));
        el.classList.toggle('nonum', canvas.clientWidth / vb[2] * 7 < 6.5);
        canvas.classList.toggle('zoomed', vb[2] < VB[2] * .99);
        var r = canvas.clientWidth / canvas.clientHeight, pw = vb[2], ph = vb[3], ox = 0, oy = 0;
        if (r > W / H) { pw = vb[3] * r; ox = (pw - vb[2]) / 2; } else { ph = vb[2] / r; oy = (ph - vb[3]) / 2; }
        pins.forEach(function (p, k) { pinEls[k].style.left = ((p.x - vb[0] + ox) / pw * 100) + '%'; pinEls[k].style.top = ((p.y - vb[1] + oy) / ph * 100) + '%'; });
      }
      function clamp() { var w = Math.max(VB[2] / 6, Math.min(VB[2], vb[2])), h = w * H / W, cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2; vb = [Math.max(0, Math.min(W - w, cx - w / 2)), Math.max(0, Math.min(H - h, cy - h / 2)), w, h]; }
      function zoomAt(k, px, py) { var x = vb[0] + vb[2] * px, y = vb[1] + vb[3] * py; vb[2] /= k; vb[3] /= k; vb[0] = x - vb[2] * px; vb[1] = y - vb[3] * py; clamp(); apply(); }
      function point(e) { var r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }

      // drag to pan, pinch or ctrl+scroll to zoom, tap to select
      var ptrs = {}, drag = null;
      function two() { var a = Object.keys(ptrs).map(function (k) { return ptrs[k]; }); return { d: Math.max(1, Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1])), x: (a[0][0] + a[1][0]) / 2, y: (a[0][1] + a[1][1]) / 2 }; }
      canvas.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.fmx-pin') || mode === '3d') return;
        ptrs[e.pointerId] = [e.clientX, e.clientY]; try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
        drag = Object.keys(ptrs).length > 1 ? { pin: two(), vb: vb.slice() } : { x: e.clientX, y: e.clientY, vb: vb.slice(), moved: false, t: e.target };
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!ptrs[e.pointerId]) {
          if (e.pointerType !== 'mouse') return;
          var p = e.target.closest && e.target.closest('.fmx-lot'); if (!p) { hover.hidden = true; return; }
          var i = +p.getAttribute('data-i'), r = el.querySelector('.fmx-map').getBoundingClientRect();
          hover.innerHTML = '<b>Homesite ' + (i + 1) + '</b>' + (LOTS[i].b ? 'Phase 1 · ' + esc(builderName(LOTS[i].b)) : 'Future development'); hover.hidden = false;
          hover.style.transform = 'translate(' + Math.min(e.clientX - r.left + 14, r.width - hover.offsetWidth - 8) + 'px,' + (e.clientY - r.top + 16) + 'px)';
          return;
        }
        ptrs[e.pointerId] = [e.clientX, e.clientY]; if (!drag) return;
        var rr = canvas.getBoundingClientRect();
        if (drag.pin) { if (Object.keys(ptrs).length < 2) return; var p2 = two(); vb = drag.vb.slice(); zoomAt(p2.d / drag.pin.d, (drag.pin.x - rr.left) / rr.width, (drag.pin.y - rr.top) / rr.height); return; }
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 5) return;
        drag.moved = true; hover.hidden = true; canvas.classList.add('drag');
        var sc = Math.max(vb[2] / rr.width, vb[3] / rr.height);
        vb = [drag.vb[0] - dx * sc, drag.vb[1] - dy * sc, vb[2], vb[3]]; clamp(); apply();
      });
      function up(e) {
        if (!ptrs[e.pointerId]) return; delete ptrs[e.pointerId]; canvas.classList.remove('drag');
        if (drag && !drag.pin && !drag.moved && e.type === 'pointerup') { var p = drag.t.closest && drag.t.closest('.fmx-lot'); if (p) pick(+p.getAttribute('data-i')); }
        drag = null;
      }
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('pointerleave', function () { hover.hidden = true; });
      canvas.addEventListener('click', function (e) { var p = e.target.closest('.fmx-lot'); if (p && mode === '3d') pick(+p.getAttribute('data-i')); });
      canvas.addEventListener('wheel', function (e) { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); var p = point(e); zoomAt(Math.exp(-e.deltaY * .002), p[0], p[1]); }, { passive: false });

      el.addEventListener('change', function (e) {
        var s = e.target.closest('[data-f]');
        if (s) { var o = { builder: f.builder, phase: f.phase, saved: f.saved }; if (s.getAttribute('data-f') !== 'size') o[s.getAttribute('data-f')] = s.value; filter(o); }
        if (e.target.matches('[data-sort]')) { sort = e.target.value; drawCards(); }
      });
      el.addEventListener('click', function (e) {
        var t = e.target, c;
        if ((c = t.closest('[data-view]'))) { setView(c.getAttribute('data-view')); return; }
        if (t.closest('.fmx-reset')) { sort = 'num'; $('[data-sort]', el).value = 'num'; vb = VB.slice(); apply(); closeDetail(); filter({}); if (map) fitAll(); return; }
        if (t.closest('.fmx-fav')) { filter({ builder: f.builder, phase: f.phase, saved: !f.saved }); setOpen(true); return; }
        if ((c = t.closest('[data-save]'))) { toggleSave(+c.getAttribute('data-save')); return; }
        if ((c = t.closest('[data-share]'))) { share(+c.getAttribute('data-share')); return; }
        if ((c = t.closest('[data-pick]'))) { pick(+c.getAttribute('data-pick'), true); return; }
        if ((c = t.closest('[data-only]'))) { closeDetail(); filter({ builder: c.getAttribute('data-only') }); return; }
        if ((c = t.closest('[data-lb]'))) { var id = c.getAttribute('data-lb'); filter(id === 'future' ? (f.phase === 'future' ? {} : { phase: 'future' }) : (f.builder === id ? {} : { builder: id })); return; }
        if ((c = t.closest('[data-tab]'))) { if (sel >= 0) closeDetail(); setTab(c.getAttribute('data-tab')); return; }
        if ((c = t.closest('[data-gl]'))) { layout = c.getAttribute('data-gl'); $$('[data-gl]', el).forEach(function (b) { b.setAttribute('aria-pressed', b === c); }); drawCards(); return; }
        if ((c = t.closest('[data-amenity]'))) { var a = AM[c.getAttribute('data-amenity')]; pulse(a.id); if (map) { if (a.at.length) map.flyTo({ center: G.pins[a.id][0], zoom: 16.1, duration: reduce ? 0 : 1000 }); else fitAll(); } else if (a.at.length) flyTo(a.at[0][0], a.at[0][1]); else { vb = VB.slice(); apply(); el.classList.add('show-streets'); setTimeout(function () { el.classList.remove('show-streets'); }, 2400); } return; }
        if ((c = t.closest('.fmx-pin'))) { var pa = pins[+c.getAttribute('data-pin')].a; setOpen(true); if (sel >= 0) closeDetail(); setTab('amenities'); pulse(pa.id); var card = $('[data-amenity="' + pa.id + '"]', el); if (card) { card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'nearest' }); } return; }
        if (t.closest('.fmx-x')) { closeDetail(); return; }
        if (t.closest('.fmx-showlist')) { setOpen(!open); return; }
        if ((c = t.closest('[data-z]'))) { var up2 = +c.getAttribute('data-z') > 0; if (map) { if (up2) map.zoomIn(); else map.zoomOut(); } else zoomAt(up2 ? 1.6 : 1 / 1.6, .5, .5); return; }
        if ((c = t.closest('[data-c]'))) {
          var k = c.getAttribute('data-c');
          if (k === 'fit') { if (map) fitAll(); else { vb = VB.slice(); apply(); } }
          if (k === 'north' && map) { mode = '2d'; $$('[data-mode]', el).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === '2d'); }); map.easeTo({ bearing: 0, pitch: 0, duration: 700 }); }
          if (k === 'layers') { var m = $('.fmx-layers', el); m.hidden = !m.hidden; c.setAttribute('aria-expanded', !m.hidden); }
          return;
        }
        if ((c = t.closest('[data-layer]')) && map) { setGL(c.getAttribute('data-layer')); $('.fmx-layers', el).hidden = true; return; }
        if ((c = t.closest('[data-layer]'))) { layer = c.getAttribute('data-layer'); el.classList.toggle('flat', layer === 'flat'); $$('[data-layer]', el).forEach(function (b) { b.setAttribute('aria-pressed', b === c); }); $('.fmx-layers', el).hidden = true; return; }
        if ((c = t.closest('.fmx-info'))) { var on = !el.classList.toggle('nolegend'); c.setAttribute('aria-pressed', on); c.setAttribute('aria-label', on ? 'Hide the legend' : 'Show the legend'); return; }
        if ((c = t.closest('[data-mode]'))) {
          mode = c.getAttribute('data-mode'); el.classList.toggle('is3d', mode === '3d');
          $$('[data-mode]', el).forEach(function (b) { b.setAttribute('aria-pressed', b === c); });
          if (map) { map.easeTo({ pitch: mode === '3d' ? 58 : 0, bearing: mode === '3d' ? -18 : 0, duration: reduce ? 0 : 900 }); return; }
          vb = VB.slice(); apply(); return;
        }
      });
      // The real map: streets, plan and satellite. Until it loads, or without WebGL, the plain plan stands in
      var map = null, glLayer = 'streets', glHover = 0;
      function fitAll(ms) { map.fitBounds(boundsOf(G.parcel), { padding: 26, duration: ms === 0 || reduce ? 0 : 900, pitch: mode === '3d' ? 58 : 0, bearing: mode === '3d' ? -18 : 0 }); }
      function glFill(sat) {
        return ['case', ['boolean', ['feature-state', 'sel'], false], .55, ['boolean', ['feature-state', 'wave'], false], .85, ['boolean', ['feature-state', 'hover'], false], .5,
          ['boolean', ['feature-state', 'dim'], false], sat ? .55 : .6, sat ? ['case', ['==', ['get', 'b'], ''], .1, .5] : 0];
      }
      function setGL(m) {
        glLayer = m; var sat = m === 'sat';
        map.setLayoutProperty('b-cover', 'visibility', m === 'plan' ? 'visible' : 'none');
        map.setLayoutProperty('b-sat', 'visibility', sat ? 'visible' : 'none');
        map.setLayoutProperty('b-art', 'visibility', sat ? 'none' : 'visible');
        map.setPaintProperty('b-fill', 'fill-opacity', glFill(sat));
        map.setPaintProperty('b-line', 'line-color', ['case', ['boolean', ['feature-state', 'sel'], false], sat ? '#FFFFFF' : '#343B3C', ['boolean', ['feature-state', 'fav'], false], '#A4572F', sat ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,0)']);
        map.setPaintProperty('b-num', 'text-color', sat ? '#FFFFFF' : '#343B3C');
        map.setPaintProperty('b-num', 'text-halo-color', sat ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.85)');
        map.setPaintProperty('b-edge', 'line-color', sat ? '#F2E6B8' : '#42516B');
        $$('[data-layer]', el).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-layer') === m); });
      }
      function glSync() {
        if (!map) return;
        LOTS.forEach(function (l, i) { map.setFeatureState({ source: 'lots', id: i + 1 }, { dim: !match(i), sel: i === sel, fav: isSaved(i + 1) }); });
        map.setFilter('b-sel', ['==', ['id'], sel + 1]);
      }
      function initGL() {
        map = new maplibregl.Map({ container: $('.fmx-glmap', el), style: STREETS, bounds: boundsOf(G.parcel), fitBoundsOptions: { padding: 26 }, cooperativeGestures: true, attributionControl: { compact: true }, maxPitch: 70 });
        map.once('style.load', function () {
          map.addSource('sat', { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' });
          map.addSource('cover', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] } } });
          map.addSource('art', { type: 'image', url: 'img/site-plan-geo.webp', coordinates: G.art });
          map.addSource('lots', { type: 'geojson', data: { type: 'FeatureCollection', features: LOTS.map(function (l, i) { return { type: 'Feature', id: i + 1, properties: { b: l.b, c: l.b ? COLORS[l.b] : '#FBF8F1' }, geometry: { type: 'Polygon', coordinates: [G.lots[i]] } }; }) } });
          map.addSource('nums', { type: 'geojson', data: { type: 'FeatureCollection', features: LOTS.map(function (l, i) { var q = lotLL(i).split(','); return { type: 'Feature', properties: { n: String(i + 1) }, geometry: { type: 'Point', coordinates: [+q[1], +q[0]] } }; }) } });
          map.addSource('edge', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: G.parcel } } });
          map.addLayer({ id: 'b-cover', type: 'fill', source: 'cover', layout: { visibility: 'none' }, paint: { 'fill-color': '#EFEADF' } });
          map.addLayer({ id: 'b-sat', type: 'raster', source: 'sat', layout: { visibility: 'none' } });
          map.addLayer({ id: 'b-art', type: 'raster', source: 'art', paint: { 'raster-fade-duration': 0 } });
          map.addLayer({ id: 'b-edge', type: 'line', source: 'edge', paint: { 'line-color': '#42516B', 'line-width': 1.6, 'line-dasharray': [3, 2] } });
          map.addLayer({ id: 'b-fill', type: 'fill', source: 'lots', paint: { 'fill-color': ['case', ['boolean', ['feature-state', 'dim'], false], '#3F4748', ['boolean', ['feature-state', 'sel'], false], '#FFFFFF', ['get', 'c']], 'fill-opacity': 0 } });
          map.addLayer({ id: 'b-line', type: 'line', source: 'lots', paint: { 'line-color': 'rgba(255,255,255,0)', 'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 3, ['boolean', ['feature-state', 'fav'], false], 2, 1] } });
          map.addLayer({ id: 'b-sel', type: 'fill-extrusion', source: 'lots', filter: ['==', ['id'], 0], paint: { 'fill-extrusion-color': '#C7B36E', 'fill-extrusion-height': 9, 'fill-extrusion-opacity': .8 } });
          map.addLayer({ id: 'b-num', type: 'symbol', source: 'nums', minzoom: 15, layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 15, 9, 17, 13], 'text-allow-overlap': true }, paint: { 'text-color': '#343B3C', 'text-halo-color': 'rgba(255,255,255,.85)', 'text-halo-width': 1 } });
          pins.forEach(function (q, k) {
            var box = document.createElement('div'); box.className = 'fmx-mk';
            box.innerHTML = '<button type="button" class="fmx-pin pin-' + q.a.id + '" data-pin="' + k + '" style="--k:' + k + '" aria-label="' + esc(q.a.name) + '">' + ICON[q.a.icon] + '</button>';
            new maplibregl.Marker({ element: box, anchor: 'bottom' }).setLngLat(q.ll).addTo(map);
          });
          pinEls = $$('.fmx-glmap .fmx-pin', el);
          map.on('mousemove', 'b-fill', function (e) {
            var id = e.features[0].id; map.getCanvas().style.cursor = 'pointer';
            if (glHover !== id) { if (glHover) map.setFeatureState({ source: 'lots', id: glHover }, { hover: false }); glHover = id; map.setFeatureState({ source: 'lots', id: id }, { hover: true }); }
            hover.innerHTML = '<b>Homesite ' + id + '</b>' + (LOTS[id - 1].b ? 'Phase 1 · ' + esc(builderName(LOTS[id - 1].b)) : 'Future development'); hover.hidden = false;
            hover.style.transform = 'translate(' + Math.min(e.point.x + 14, map.getContainer().clientWidth - hover.offsetWidth - 8) + 'px,' + (e.point.y + 16) + 'px)';
          });
          map.on('mouseleave', 'b-fill', function () { map.getCanvas().style.cursor = ''; hover.hidden = true; if (glHover) map.setFeatureState({ source: 'lots', id: glHover }, { hover: false }); glHover = 0; });
          map.on('click', 'b-fill', function (e) { pick(e.features[0].id - 1); });
          $('.fmx-layers', el).innerHTML = '<button type="button" data-layer="streets" aria-pressed="true">Streets</button><button type="button" data-layer="plan" aria-pressed="false">Plan</button><button type="button" data-layer="sat" aria-pressed="false">Satellite</button>';
          setGL('streets'); el.classList.add('gl'); glSync(); map.resize(); fitAll(0);
          if (M) LOTS.forEach(function (l, i) { setTimeout(function () { map.setFeatureState({ source: 'lots', id: i + 1 }, { wave: true }); }, 500 + i * 18); setTimeout(function () { map.setFeatureState({ source: 'lots', id: i + 1 }, { wave: false }); }, 860 + i * 18); });
          if (sel >= 0) map.fitBounds(boundsOf(G.lots[sel]), { padding: 90, maxZoom: 17.7, duration: 0 });
        });
        if (window.ResizeObserver) new ResizeObserver(function () { map.resize(); }).observe($('.fmx-map', el));
      }
      whenNear(el, initGL);
      function pulse(id) { pinEls.forEach(function (p, k) { p.classList.toggle('pulse', pins[k].a.id === id); }); setTimeout(function () { pinEls.forEach(function (p) { p.classList.remove('pulse'); }); }, 2400); }
      if (window.ResizeObserver) new ResizeObserver(apply).observe(canvas);
      el.classList.add('nolegend'); setOpen(open); setTab('homesites'); drawMap(); apply();
      return { filter: filter, select: function (n) { if (n >= 1 && n <= LOTS.length) { filter({}); pick(n - 1, true); } }, savedChanged: savedChanged, el: el };
    }
    $$('[data-explorer]').forEach(function (el) { var k = el.getAttribute('data-explorer') || 'community'; explorers[k] = explorer(el, k); });
    // #community/explore/12 and #homes/available/12 open that homesite
    onRoute.push(function (page, anchor, arg) {
      var n = parseInt(arg, 10); if (!n) return;
      var ex = page === 'homes' ? explorers.homes : page === 'community' ? explorers.community : null;
      if (ex) setTimeout(function () { ex.select(n); }, 80);
    });

    // ---------- builders ----------
    function bLine(b) { return plural(counts[b.id], 'Phase 1 homesite') + ' on the masterplan'; }
    $$('[data-builder-cards]').forEach(function (el) {
      el.innerHTML = K.builders.map(function (b) {
        return '<article class="mb-card"><div class="mb-top"><span class="mb-lg"><img src="' + b.logo + '" alt="' + esc(b.name) + '" width="' + b.w + '" height="' + b.h + '" loading="lazy"></span><span class="chip light"><i style="background:' + COLORS[b.id] + '"></i>' + bLine(b) + '</span></div><h3>Custom homes on 2-acre homesites</h3><p>With 2 acres, you can design the home of your dreams, and ' + esc(b.name) + ' is ready to help, from a spacious single-story to a stately estate.</p>' +
          '<div class="mb-acts"><a class="btn btn-gold" href="#homes/b-' + b.id + '">Explore Homes</a><a class="mb-line" href="#contact/get-in-touch" data-interest="' + esc(b.name) + '">Get ' + esc(b.name.replace(/ Homes$/, '')) + ' updates</a></div></article>';
      }).join('');
    });
    $$('[data-builder-chips]').forEach(function (el) {
      el.innerHTML = K.builders.map(function (b) { return '<a class="chip-btn" href="#b-' + b.id + '" data-jump="b-' + b.id + '">' + esc(b.name) + '</a>'; }).join('');
      el.addEventListener('click', function (e) { var a = e.target.closest('[data-jump]'); if (!a) return; e.preventDefault(); var t = document.getElementById(a.getAttribute('data-jump')); if (t) t.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'center' }); });
    });
    $$('[data-builders]').forEach(function (el) {
      el.innerHTML = K.builders.map(function (b) {
        return '<article class="bcard" id="b-' + b.id + '"><div class="bcard-top"><span class="chip light">Home designs to come</span><div class="bcard-logo"><img src="' + b.logo + '" alt="' + esc(b.name) + '" width="' + b.w + '" height="' + b.h + '" loading="lazy"></div></div>' +
          '<dl class="bcard-facts"><div><dt>Homesites</dt><dd>' + plural(counts[b.id], 'Phase 1 homesite') + ', 2 acres each</dd></div><div><dt>Pricing</dt><dd>To be announced</dd></div></dl>' +
          '<details class="bcard-more"><summary>Learn more</summary><p>' + esc(b.name) + ' is one of the Belmont Estates family of builders, selected for their distinctive design approach and unrivaled quality construction. Whether you envision a spacious single-story or a stately estate, our builders are known for their quality and creativity.</p></details>' +
          '<div class="bcard-acts"><button type="button" class="btn btn-light" data-show-builder="' + b.id + '">Explore home options</button><a class="btn btn-ink" href="#contact/get-in-touch" data-interest="' + esc(b.name) + '">Get ' + esc(b.name) + ' updates</a></div></article>';
      }).join('');
    });
    document.addEventListener('click', function (e) { var b = e.target.closest('[data-show-builder]'); if (b) showHomesites({ builder: b.getAttribute('data-show-builder') }); });

    // ---------- amenities (Lifestyle) ----------
    var AMIMG = { ponds: 'img/site-plan.webp', trails: 'img/life-running.webp', green: 'img/life-lupines.webp' };
    $$('[data-amenity-cards]').forEach(function (el) {
      var cardsHTML = [{ id: 'home', name: 'Your own wonderland', status: 'Every homesite', icon: 'home', text: 'With your expansive 2-acre homesite, you can create your own wonderland, with space for a pool, play yard, garden and more.', img: 'img/moments-picnic.webp' }].concat(K.amenities.map(function (a) { return { id: a.id, name: a.name, status: a.status, icon: a.icon, text: a.text, img: AMIMG[a.id] }; }));
      el.innerHTML = cardsHTML.map(function (a) {
        return '<article class="am-card' + (a.img ? '' : ' noimg') + '">' + (a.img ? '<img src="' + a.img + '" alt="" loading="lazy">' : '') + '<div><span class="am-ic">' + ICON[a.icon] + '</span><span class="chip">' + esc(a.status) + '</span><h3>' + esc(a.name) + '</h3><p>' + esc(a.text) + '</p><a class="link-arrow" href="#community/explore">See it on the site map</a></div></article>';
      }).join('');
    });

    // ================= area map, school map and the home page map =================
    var LEVEL = { 1: 'Elementary', 2: 'Middle school', 3: 'Junior high', 4: 'High school' };
    var HOME_PICKS = [28, 4, 11, 8, 10, 26, 5];
    function drive(n) { var q = PL && PL.places[n]; return q ? q.mi + ' mi · about ' + q.min + ' min drive' : ''; }
    function areamap(el, mode) {
      var A = DATA.area, pins = Object.keys(A.pins).map(Number), schools = mode === 'schools', homeMode = mode === 'home', cat = 'All', sel = 0;
      var shown = pins.filter(function (n) { return schools ? PLACE[n].cat === 'Schools' : homeMode ? HOME_PICKS.indexOf(n) >= 0 : true; });
      var vb = [0, 0, A.w, A.h];
      if (schools || homeMode) {
        var xs = shown.map(function (n) { return A.pins[n].x; }).concat(A.home.x), ys = shown.map(function (n) { return A.pins[n].y; }).concat(A.home.y);
        var x0 = Math.min.apply(0, xs) - 180, x1 = Math.max.apply(0, xs) + 220, y0 = Math.min.apply(0, ys) - 130, y1 = Math.max.apply(0, ys) + 130, R = homeMode ? 2.2 : 1.3;
        var w = Math.max(x1 - x0, (y1 - y0) * R), h = w / R;
        vb = [Math.max(0, (x0 + x1) / 2 - w / 2), Math.max(0, (y0 + y1) / 2 - h / 2), Math.min(A.w, w), Math.min(A.h, h)];
      }
      var light = { Schools: 1, Medical: 1, Hardware: 1 };
      var svg = '<svg viewBox="' + vb.map(function (v) { return v.toFixed(0); }).join(' ') + '" role="img" aria-label="' + (schools ? 'Map of the schools near Belmont Estates' : 'Belmont Estates area attractions map') + '"><rect x="-500" y="-500" width="' + (A.w + 1000) + '" height="' + (A.h + 1000) + '" fill="#5E7783"/><image href="img/area-roads.svg" width="' + A.w + '" height="' + A.h + '"/>' +
        '<g transform="translate(' + A.home.x + ' ' + A.home.y + ')"><circle r="' + A.home.r + '" fill="#42516B" stroke="#FAF8F2" stroke-width="4"/><image href="img/logo-icon.svg" x="-24" y="-26" width="48" height="52"/></g>' +
        '<text x="' + A.home.x + '" y="' + (A.home.y + A.home.r + 32) + '" text-anchor="middle" font-family="Spectral, Georgia, serif" font-size="26" fill="#FAF8F2" letter-spacing="3">BELMONT ESTATES</text>' +
        shown.map(function (n, j) { var p = A.pins[n]; return '<g class="am-pin' + (light[PLACE[n].cat] ? ' light' : '') + '" data-n="' + n + '" style="--k:' + j + '" tabindex="0" role="button" aria-label="' + esc(PLACE[n].name) + ', ' + PLACE[n].cat + '"><circle class="am-pulse" cx="' + p.x + '" cy="' + p.y + '" r="' + p.r + '"/><circle cx="' + p.x + '" cy="' + p.y + '" r="' + p.r + '" fill="' + p.fill + '" stroke="#FAF8F2" stroke-width="3"/><text x="' + p.x + '" y="' + (p.y + 6) + '" text-anchor="middle">' + n + '</text></g>'; }).join('') + '</svg>';
      if (homeMode) {
        var labels = shown.map(function (n, j) { var p = A.pins[n]; return '<button type="button" class="am-label" data-hp="' + n + '" style="--k:' + j + ';left:' + ((p.x - vb[0]) / vb[2] * 100) + '%;top:' + ((p.y - vb[1]) / vb[3] * 100) + '%"><span class="num" style="background:' + p.fill + '">' + n + '</span>' + esc(PLACE[n].name) + '</button>'; }).join('');
        el.innerHTML = '<div class="am-stage" style="aspect-ratio:' + vb[2] + '/' + vb[3] + '">' + svg + labels + '</div><div class="am-chips">' + shown.map(function (n) { return '<button type="button" data-hp="' + n + '"><span class="num" style="background:' + A.pins[n].fill + '">' + n + '</span>' + esc(PLACE[n].name) + '<small>' + (PL ? PL.places[n].min + ' min' : esc(PLACE[n].cat)) + '</small></button>'; }).join('') + '<button type="button" class="all" data-show-cat="All">Show every place</button></div>';
        var hm = null;
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-hp]'); if (!b) return; var n = +b.getAttribute('data-hp');
          if (!hm) { showPlace(n); return; }
          $$('[data-hp]', el).forEach(function (x) { x.classList.toggle('sel', +x.getAttribute('data-hp') === n); });
          hm.flyTo({ center: PL.places[n].ll, zoom: 13.4, duration: reduce ? 0 : 1100 });
        });
        whenNear(el, function () {
          var stage = $('.am-stage', el), box = document.createElement('div'); box.className = 'am-gl'; stage.appendChild(box);
          var all = shown.map(function (n) { return PL.places[n].ll; }).concat([G.center]);
          hm = new maplibregl.Map({ container: box, style: STREETS, bounds: boundsOf(all), fitBoundsOptions: { padding: { top: 50, bottom: 50, left: 80, right: 300 } }, cooperativeGestures: true, attributionControl: { compact: true } });
          hm.once('style.load', function () {
            parcelLayers(hm);
            new maplibregl.Marker({ element: crestMark(), anchor: 'center' }).setLngLat(G.center).addTo(hm);
            shown.forEach(function (n, j) {
              var d = document.createElement('div'); d.className = 'map-tag';
              d.innerHTML = '<button type="button" data-hp="' + n + '" style="--k:' + j + '"><span class="num" style="background:' + A.pins[n].fill + '">' + n + '</span>' + esc(PLACE[n].name) + '<small>' + PL.places[n].min + ' min</small></button>';
              // Katy Mills sits beside Typhoon Texas, so its label opens the other way
              new maplibregl.Marker({ element: d, anchor: n === 26 ? 'right' : 'left', offset: [n === 26 ? 12 : -12, 0] }).setLngLat(PL.places[n].ll).addTo(hm);
            });
            var ctl = document.createElement('div'); ctl.className = 'mapctl';
            ctl.innerHTML = '<button type="button" data-mz="1" aria-label="Zoom in">+</button><button type="button" data-mz="-1" aria-label="Zoom out">−</button><button type="button" data-mfit aria-label="Show every place">' + ICON.fit + '</button>';
            stage.appendChild(ctl);
            ctl.addEventListener('click', function (e) { var z = e.target.closest('[data-mz]'); if (z) { if (+z.getAttribute('data-mz') > 0) hm.zoomIn(); else hm.zoomOut(); } if (e.target.closest('[data-mfit]')) hm.fitBounds(boundsOf(all), { padding: { top: 50, bottom: 50, left: 80, right: 300 } }); });
            stage.classList.add('gl-on');
            var note = $('[data-loc-note]'); if (note) note.textContent = 'Drive times are approximate, from the Bois D’Arc Lane entry, using OpenStreetMap road data.';
          });
        });
        return {};
      }
      var cats = K.categories.filter(function (c) { return shown.some(function (n) { return PLACE[n].cat === c.id; }); });
      var top = schools
        ? '<div class="am-tabs" role="group" aria-label="School level"><button type="button" data-lv="All" aria-pressed="true">All schools</button>' + [1, 2, 3, 4].map(function (n) { return '<button type="button" data-lv="' + n + '" aria-pressed="false">' + LEVEL[n] + '</button>'; }).join('') + '<a class="am-ext" href="https://www.lamarcisd.net/" target="_blank" rel="noopener">Lamar CISD website ↗</a></div>'
        : '<div class="am-filters" role="group" aria-label="Categories"><button type="button" data-c="All" aria-pressed="true">All <b>' + shown.length + '</b></button>' + cats.map(function (c) { return '<button type="button" data-c="' + esc(c.id) + '" aria-pressed="false"><i style="background:' + c.color + '"></i>' + esc(c.id) + '</button>'; }).join('') + '</div>';
      el.innerHTML = top + '<div class="am-body"><div class="am-stage" style="aspect-ratio:' + vb[2] + '/' + vb[3] + '">' + svg + '</div><aside class="am-side"><div class="am-inner"><div class="am-info" aria-live="polite"></div><ul class="am-list"></ul></div></aside></div>';
      var info = $('.am-info', el), list = $('.am-list', el), lv = 'All';
      function inView(n) { return schools ? (lv === 'All' || +lv === n) : (cat === 'All' || PLACE[n].cat === cat); }
      function draw() {
        $$('[data-c]', el).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-c') === cat); });
        $$('[data-lv]', el).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lv') === String(lv)); });
        $$('.am-pin', el).forEach(function (g) { g.classList.toggle('dim', !inView(+g.getAttribute('data-n'))); });
        var items = shown.filter(inView);
        if (sm) sm.level(lv);
        list.innerHTML = items.map(function (n) {
          return schools
            ? '<li><button type="button" class="sch" data-n="' + n + '" aria-pressed="' + (n === sel) + '"><span class="num" style="background:' + A.pins[n].fill + '">' + n + '</span><span><b>' + esc(PLACE[n].name) + '</b><span class="chip">' + LEVEL[n] + '</span><small>' + (drive(n) || 'Lamar CISD') + '</small></span></button></li>'
            : '<li><button type="button" data-n="' + n + '" aria-pressed="' + (n === sel) + '"><span class="num" style="background:' + A.pins[n].fill + '">' + n + '</span><span>' + esc(PLACE[n].name) + '</span><small>' + PLACE[n].cat + '</small></button></li>';
        }).join('');
        if (!sel || items.indexOf(sel) < 0) {
          sel = 0;
          info.innerHTML = '<b>' + (schools ? items.length + (items.length === 1 ? ' campus' : ' campuses') : plural(items.length, 'place')) + '</b><span>' + (schools ? 'Lamar CISD campuses listed for Belmont Estates. Select one to see it pinned.' : (cat === 'All' ? 'Around Belmont Estates.' : cat + ' around Belmont Estates.') + ' Select one to see details.') + '</span>';
          $$('.am-pin', el).forEach(function (g) { g.classList.remove('sel'); });
        }
      }
      function pick(n) {
        sel = n; var P = PLACE[n];
        $$('.am-pin', el).forEach(function (g) { var on = +g.getAttribute('data-n') === n; g.classList.toggle('sel', on); if (on) g.parentNode.appendChild(g); });
        $$('button[data-n]', list).forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-n') === n); });
        info.innerHTML = '<b>' + esc(P.name) + '</b><span>' + (schools ? LEVEL[n] + ' · Lamar CISD · ' + drive(n) : P.cat + ' · number ' + n + ' on the area map') + '</span><a class="link-arrow" href="' + MAPS + encodeURIComponent(P.name + ', Texas') + '" target="_blank" rel="noopener">Directions</a>';
        if (sm) sm.pick(n);
        info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
      }
      el.addEventListener('click', function (e) {
        var c = e.target.closest('[data-c]'); if (c) { cat = c.getAttribute('data-c'); draw(); return; }
        var l = e.target.closest('[data-lv]'); if (l) { lv = l.getAttribute('data-lv'); draw(); return; }
        var p = e.target.closest('[data-n]'); if (p) pick(+p.getAttribute('data-n'));
      });
      el.addEventListener('keydown', function (e) { var p = e.target.closest('.am-pin'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(+p.getAttribute('data-n')); } });
      // The school map: a real street map with the drive from the community entrance
      var sm = null;
      if (schools) whenNear(el, function () {
        var stage = $('.am-stage', el), box = document.createElement('div'); box.className = 'am-gl'; stage.appendChild(box);
        var pts = shown.map(function (n) { return PL.places[n].ll; }).concat(G.parcel), pad = { top: 40, bottom: 40, left: 60, right: 40 };
        var gm = new maplibregl.Map({ container: box, style: STREETS, bounds: boundsOf(pts), fitBoundsOptions: { padding: pad }, cooperativeGestures: true, attributionControl: { compact: true }, maxPitch: 70 });
        var marks = {};
        gm.once('style.load', function () {
          parcelLayers(gm);
          gm.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: shown.map(function (n) { return { type: 'Feature', id: n, properties: { n: n }, geometry: { type: 'LineString', coordinates: PL.places[n].route } }; }) } });
          gm.addLayer({ id: 'r-case', type: 'line', source: 'routes', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': 6, 'line-opacity': ['case', ['boolean', ['feature-state', 'off'], false], 0, .9] } });
          gm.addLayer({ id: 'r-line', type: 'line', source: 'routes', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['case', ['boolean', ['feature-state', 'sel'], false], '#A4572F', '#C38B53'], 'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 4.5, 3], 'line-opacity': ['case', ['boolean', ['feature-state', 'off'], false], 0, 1] } });
          new maplibregl.Marker({ element: crestMark(), anchor: 'center' }).setLngLat(G.center).addTo(gm);
          shown.forEach(function (n) {
            var d = document.createElement('div'); d.className = 'map-school'; d.innerHTML = '<button type="button" data-n="' + n + '" aria-label="' + esc(PLACE[n].name) + '">' + n + '</button>';
            marks[n] = new maplibregl.Marker({ element: d, anchor: 'center' }).setLngLat(PL.places[n].ll).addTo(gm);
          });
          var ctl = document.createElement('div'); ctl.className = 'mapctl';
          ctl.innerHTML = '<button type="button" data-mz="1" aria-label="Zoom in">+</button><button type="button" data-mz="-1" aria-label="Zoom out">−</button><button type="button" data-mfit aria-label="Show Belmont Estates and all schools">' + ICON.fit + '</button><button type="button" data-mn aria-label="Reset the map to north up">' + ICON.compass + '</button>';
          var dim = document.createElement('div'); dim.className = 'mapdim'; dim.setAttribute('role', 'group'); dim.setAttribute('aria-label', '2D or 3D');
          dim.innerHTML = '<button type="button" data-m3="0" aria-pressed="true">2D</button><button type="button" data-m3="1" aria-pressed="false">3D</button>';
          var inf = document.createElement('button'); inf.type = 'button'; inf.className = 'mapinfo'; inf.setAttribute('aria-label', 'Show the legend'); inf.setAttribute('aria-pressed', 'false'); inf.innerHTML = ICON.info;
          var leg = document.createElement('div'); leg.className = 'maplegend'; leg.hidden = true;
          leg.innerHTML = '<p class="fmx-lh">Legend</p><ul><li><i class="l-home"></i>Belmont Estates</li><li><i class="l-sch"></i>Lamar CISD campus</li><li><i class="l-route"></i>Drive from the entrance</li><li><i class="l-bound"></i>Belmont Estates boundary</li></ul>';
          [ctl, dim, inf, leg].forEach(function (x) { stage.appendChild(x); });
          stage.addEventListener('click', function (e) {
            var z = e.target.closest('[data-mz]'); if (z) { if (+z.getAttribute('data-mz') > 0) gm.zoomIn(); else gm.zoomOut(); return; }
            if (e.target.closest('[data-mfit]')) { gm.fitBounds(boundsOf(pts), { padding: pad, pitch: gm.getPitch(), bearing: gm.getBearing() }); return; }
            if (e.target.closest('[data-mn]')) { gm.easeTo({ bearing: 0, pitch: 0 }); $$('[data-m3]', dim).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m3') === '0'); }); return; }
            var m = e.target.closest('[data-m3]'); if (m) { var on3 = m.getAttribute('data-m3') === '1'; $$('[data-m3]', dim).forEach(function (b) { b.setAttribute('aria-pressed', b === m); }); gm.easeTo({ pitch: on3 ? 58 : 0, bearing: on3 ? -18 : 0, duration: reduce ? 0 : 900 }); return; }
            if (e.target.closest('.mapinfo')) { leg.hidden = !leg.hidden; inf.setAttribute('aria-pressed', !leg.hidden); }
          });
          stage.classList.add('gl-on');
          sm = {
            level: function (v) { shown.forEach(function (n) { var on = v === 'All' || +v === n; gm.setFeatureState({ source: 'routes', id: n }, { off: !on }); marks[n].getElement().classList.toggle('dim', !on); }); },
            pick: function (n) {
              shown.forEach(function (x) { gm.setFeatureState({ source: 'routes', id: x }, { sel: x === n }); marks[x].getElement().classList.toggle('sel', x === n); });
              gm.fitBounds(boundsOf(PL.places[n].route), { padding: 70, maxZoom: 14.6, duration: reduce ? 0 : 1000, pitch: gm.getPitch(), bearing: gm.getBearing() });
            }
          };
        });
        if (window.ResizeObserver) new ResizeObserver(function () { gm.resize(); }).observe(stage);
      });
      draw();
      return { show: function (n) { if (shown.indexOf(n) < 0) return; cat = 'All'; lv = 'All'; draw(); pick(n); }, category: function (c) { cat = CAT[c] ? c : 'All'; draw(); } };
    }
    $$('[data-areamap]').forEach(function (el) { var m = el.getAttribute('data-areamap') || 'area'; areamaps[m] = areamap(el, m); });
    function showPlace(n) { var school = PLACE[n].cat === 'Schools' && current === 'schools'; go(school ? '#schools/school-map' : '#relocation/area-map'); setTimeout(function () { (school ? areamaps.schools : areamaps.area).show(n); }, 80); }
    function showCategory(c) { go('#relocation/area-map'); setTimeout(function () { areamaps.area.category(c); }, 80); }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-place]'); if (b) { showPlace(+b.getAttribute('data-place')); return; }
      var c = e.target.closest('[data-show-cat]'); if (c) showCategory(c.getAttribute('data-show-cat'));
    });
    $$('[data-school-list]').forEach(function (el) {
      el.innerHTML = K.places.filter(function (p) { return p[2] === 'Schools'; }).map(function (p) { return '<li><button type="button" data-school="' + p[0] + '"><span class="num">' + p[0] + '</span>' + esc(p[1]) + '<small>' + LEVEL[p[0]] + '</small></button></li>'; }).join('');
      el.addEventListener('click', function (e) { var b = e.target.closest('[data-school]'); if (!b) return; go('#schools/school-map'); var n = +b.getAttribute('data-school'); setTimeout(function () { areamaps.schools.show(n); }, 80); });
    });

    // ---------- nearby (Lifestyle) and roads (Relocation) ----------
    $$('[data-near]').forEach(function (el) {
      var cs = el.getAttribute('data-near').split(',');
      el.innerHTML = K.places.filter(function (p) { return cs.indexOf(p[2]) >= 0; }).map(function (p) { return '<button type="button" class="near" data-place="' + p[0] + '"><span class="chip">Nearby</span><b>' + esc(p[1]) + '</b><span>' + esc(p[2]) + ' · number ' + p[0] + ' on the area map</span><span class="link-arrow">Show on the area map</span></button>'; }).join('');
    });
    $$('[data-roads]').forEach(function (el) {
      el.innerHTML = K.roads.map(function (r) { return /^(I-10|\d+)$/.test(r) ? '<li>' + (r === '1093' ? 'FM 1093' : r === '359' ? 'FM 359' : r === '1463' ? 'FM 1463' : r === '99' ? 'SH 99' : r === '6' ? 'SH 6' : r) + '</li>' : '<li class="named">' + esc(r) + '</li>'; }).join('');
    });

    // ---------- journal ----------
    function newsCard(n, i) {
      return '<article class="news-card' + (n.soon ? ' soon' : '') + (i === 0 ? ' lead' : '') + '" data-cat="' + esc(n.cat) + '"><a href="' + n.href + '"' + (n.soon ? ' data-interest="All Belmont Estates updates"' : '') + '><img src="' + n.img + '" alt="" loading="lazy"><span class="news-meta"><span>' + esc(n.cat) + '</span><span>' + esc(n.date) + '</span></span><b>' + esc(n.title) + '</b><span class="news-text">' + esc(n.text) + '</span><span class="link-arrow">' + esc(n.cta) + '</span></a></article>';
    }
    $$('[data-news]').forEach(function (grid) {
      var isPage = grid.getAttribute('data-news') === 'page', filt = 'All', month = '';
      var bar = $('[data-news-filter' + (isPage ? '="page"' : '') + ']', grid.closest('section'));
      var cats = ['All'].concat(K.news.map(function (n) { return n.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
      function draw() {
        // The home page shows a lead story and four more: two full rows
        var items = K.news.filter(function (n) { return (filt === 'All' || n.cat === filt) && (!month || n.date === month); });
        if (!isPage) items = items.slice(0, 5);
        grid.innerHTML = items.map(function (n, i) { return newsCard(n, isPage ? -1 : i); }).join('');
        scan(grid);
        if (bar) $$('button', bar).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-nf') === filt); });
        if (catSel) catSel.value = filt === 'All' ? '' : filt;
      }
      var catSel = isPage ? $('[data-news-cat]') : null, monSel = isPage ? $('[data-news-month]') : null;
      if (catSel) {
        catSel.innerHTML = '<option value="">All categories</option>' + cats.slice(1).map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
        monSel.innerHTML = '<option value="">Any month</option>' + K.news.map(function (n) { return n.date; }).filter(function (c, i, a) { return a.indexOf(c) === i; }).map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
        catSel.addEventListener('change', function () { filt = catSel.value || 'All'; draw(); });
        monSel.addEventListener('change', function () { month = monSel.value; draw(); });
      }
      if (bar) {
        bar.innerHTML = cats.map(function (c) { return '<button type="button" class="chip-btn" data-nf="' + esc(c) + '" aria-pressed="false">' + esc(c) + '</button>'; }).join('');
        bar.addEventListener('click', function (e) { var b = e.target.closest('[data-nf]'); if (b) { filt = b.getAttribute('data-nf'); draw(); } });
      }
      draw();
    });
    $$('[data-res-news]').forEach(function (el) {
      el.innerHTML = K.news.filter(function (n) { return !n.soon; }).slice(0, 3).map(function (n) { return '<article class="res-item"><small>' + esc(n.date) + '</small><h3>' + esc(n.title) + '</h3><p>' + esc(n.text) + '</p><a class="link-arrow" href="' + n.href + '">' + esc(n.cta) + '</a></article>'; }).join('');
    });
    $$('[data-story]').forEach(function (el) {
      var items = K.news.filter(function (n) { return !n.soon; }), k = 0;
      el.innerHTML = '<div class="story-track">' + items.map(function (n, i) { return '<article class="story-slide" aria-hidden="' + (i !== 0) + '"><img src="' + n.img + '" alt="" loading="lazy"><div><p class="news-meta"><span>' + esc(n.cat) + '</span><span>' + esc(n.date) + '</span></p><h2 class="h3">' + esc(n.title) + '</h2><p>' + esc(n.text) + '</p><a class="btn btn-ink" href="' + n.href + '">' + esc(n.cta) + '</a></div></article>'; }).join('') + '</div>' +
        '<div class="story-nav"><button type="button" data-sk="-1" aria-label="Previous story">' + ICON.chev + '</button>' + items.map(function (n, i) { return '<button type="button" class="dot" data-sd="' + i + '" aria-label="Story ' + (i + 1) + ': ' + esc(n.title) + '" aria-pressed="' + (i === 0) + '"></button>'; }).join('') + '<button type="button" class="r" data-sk="1" aria-label="Next story">' + ICON.chev + '</button></div>';
      function show(i) { k = (i + items.length) % items.length; $$('.story-slide', el).forEach(function (s, j) { s.setAttribute('aria-hidden', j !== k); }); $$('[data-sd]', el).forEach(function (d, j) { d.setAttribute('aria-pressed', j === k); }); $('.story-track', el).style.transform = 'translateX(' + (-100 * k) + '%)'; }
      el.addEventListener('click', function (e) { var s = e.target.closest('[data-sk]'), d = e.target.closest('[data-sd]'); if (s) show(k + +s.getAttribute('data-sk')); if (d) show(+d.getAttribute('data-sd')); });
    });

    // ---------- videos (on the way) ----------
    var VIDEOS = {
      schools: [['Lamar CISD at a glance', 'An introduction to the school district that serves Belmont Estates.', 'img/schools-classroom.webp'], ['The drive to school', 'From Belmont Estates to the campuses listed for the community.', 'img/moments-garden.webp'], ['Campus tours', 'A look at the Lamar CISD campuses near Belmont Estates.', 'img/life-grandpa.webp'], ['Learning outdoors', 'Learning and play with space to roam.', 'img/life-sprinkler.webp']],
      lifestyle: [['A walk through Belmont Estates', 'A look at the trails, ponds and green space.', 'img/life-running.webp'], ['Ponds and green space', 'Where neighbors meet and Mother Nature’s handiwork shows.', 'img/life-lupines.webp'], ['Outdoors around Fulshear', 'Parks, museums and weekends close by.', 'img/moments-garden.webp']],
      news: [['A first look at Belmont Estates', 'A tour of the masterplan: the homesites, ponds and trails.', 'img/site-plan.webp'], ['Meet William David Homes', 'An introduction from one of our family of builders.', 'img/home-interior.webp'], ['Meet Toll Brothers', 'An introduction from one of our family of builders.', 'img/dream-home.webp'], ['Meet Partners in Building', 'An introduction from one of our family of builders.', 'img/intro-family.webp'], ['Meet Autograph Homes', 'An introduction from one of our family of builders.', 'img/life-grandpa.webp'], ['Around Fulshear', 'Country living, with the conveniences of fast-growing Fulshear down the stretch.', 'img/moments-garden.webp'], ['Community updates', 'Progress at Belmont Estates as it takes shape.', 'img/moments-picnic.webp']]
    };
    $$('[data-videos]').forEach(function (el) {
      var v = VIDEOS[el.getAttribute('data-videos')], k = 0, pad = function (n) { return ('0' + n).slice(-2); };
      el.innerHTML = '<div class="vid-main"><div class="vid-poster"><img alt="" loading="lazy"><span class="chip">Coming soon</span><span class="vid-play" aria-hidden="true">' + ICON.play + '</span></div><p class="vid-t"><span></span><b></b></p><p class="vid-d"></p></div>' +
        '<div class="vid-list"><p class="eyebrow">' + v.length + ' videos</p>' + v.map(function (x, i) { return '<button type="button" data-v="' + i + '" aria-pressed="' + (i === 0) + '"><img src="' + x[2] + '" alt="" loading="lazy"><span><b>' + esc(x[0]) + '</b><small>Coming soon</small></span></button>'; }).join('') + '</div>';
      function show(i) { k = i; var x = v[i], im = $('.vid-poster img', el); im.src = x[2]; im.classList.remove('swap'); void im.offsetWidth; im.classList.add('swap'); $('.vid-t span', el).textContent = pad(i + 1) + ' / ' + pad(v.length); $('.vid-t b', el).textContent = x[0]; $('.vid-d', el).textContent = x[1] + ' Coming soon.'; $$('[data-v]', el).forEach(function (b, j) { b.setAttribute('aria-pressed', j === i); }); }
      el.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (b) show(+b.getAttribute('data-v')); });
      show(0);
    });

    // ---------- photo galleries ----------
    $$('[data-gallery]').forEach(function (el) {
      var ph = K.photos, filt = 'All', cats = ['All'].concat(ph.map(function (p) { return p[2]; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
      el.innerHTML = '<div class="chips">' + cats.map(function (c) { return '<button type="button" class="chip-btn" data-gf="' + c + '" aria-pressed="' + (c === 'All') + '">' + c + '</button>'; }).join('') + '</div><div class="gal-grid"></div>';
      var grid = $('.gal-grid', el);
      function draw() {
        grid.innerHTML = ph.map(function (p, i) { return filt === 'All' || p[2] === filt ? '<button type="button" class="gal" data-g="' + i + '" aria-label="Open photo: ' + esc(p[1]) + '"><img src="' + p[0] + '" alt="' + esc(p[3]) + '" loading="lazy"><span>' + esc(p[1]) + '</span></button>' : ''; }).join('');
        scan(grid);
        $$('[data-gf]', el).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-gf') === filt); });
      }
      function lightbox(i) {
        var vis = ph.map(function (p, j) { return j; }).filter(function (j) { return filt === 'All' || ph[j][2] === filt; }), at = vis.indexOf(i);
        var p = ph[i], prev = vis[(at - 1 + vis.length) % vis.length], next = vis[(at + 1) % vis.length];
        openHTML(p[1], '<figure class="lb"><img src="' + p[0] + '" alt="' + esc(p[3]) + '"><figcaption><b>' + esc(p[1]) + '</b> ' + (at + 1) + ' of ' + vis.length + '</figcaption><div class="lb-nav"><button type="button" data-lb-go="' + prev + '" aria-label="Previous photo">' + ICON.chev + '</button><button type="button" class="r" data-lb-go="' + next + '" aria-label="Next photo">' + ICON.chev + '</button></div></figure>');
        $$('[data-lb-go]', vbody).forEach(function (b) { b.addEventListener('click', function () { lightbox(+b.getAttribute('data-lb-go')); }); });
      }
      el.addEventListener('click', function (e) { var f = e.target.closest('[data-gf]'), g = e.target.closest('[data-g]'); if (f) { filt = f.getAttribute('data-gf'); draw(); } if (g) lightbox(+g.getAttribute('data-g')); });
      draw();
    });

    // ---------- a place to gather: numbered spots on the masterplan ----------
    var GATHER = [['North pond', 430, 62], ['East pond', 640, 62], ['Trail for walking & jogging', 596, 150], ['Green space', 668, 255], ['Tree-lined streets', 470, 233]];
    $$('[data-gather]').forEach(function (fig) {
      var img = $('img', fig), frame = document.createElement('div'); frame.className = 'frame';
      fig.insertBefore(frame, img); frame.appendChild(img);
      frame.insertAdjacentHTML('beforeend', GATHER.map(function (g, i) { return '<button type="button" class="spot" data-spot="' + i + '" style="left:' + (g[1] / 7.05).toFixed(1) + '%;top:' + (g[2] / 2.8).toFixed(1) + '%" aria-label="' + esc(g[0]) + '">' + (i + 1) + '</button>'; }).join(''));
      var key = $('[data-gather-key]');
      key.innerHTML = GATHER.map(function (g, i) { return '<li><button type="button" data-spot="' + i + '"><span>' + (i + 1) + '</span>' + esc(g[0]) + '</button></li>'; }).join('');
      var box = fig.parentElement;
      function spot(i) { $$('[data-spot]', box).forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-spot') === i); }); }
      box.addEventListener('mouseover', function (e) { var b = e.target.closest('[data-spot]'); if (b) spot(+b.getAttribute('data-spot')); });
      box.addEventListener('click', function (e) { var b = e.target.closest('[data-spot]'); if (b) spot(+b.getAttribute('data-spot')); });
      spot(0);
    });
    $$('[data-tax-calc]').forEach(function (f) {
      var out = $('[data-tax-out]', f);
      f.addEventListener('submit', function (e) { e.preventDefault(); });
      f.addEventListener('input', function () {
        var v = parseFloat(f.elements.v.value.replace(/[^0-9.]/g, '')), r = parseFloat(f.elements.r.value.replace(/[^0-9.]/g, ''));
        out.textContent = v > 0 && r > 0 ? '$' + Math.round(v * r / 100).toLocaleString('en-US') + ' a year' : 'Enter a value and a rate';
      });
    });
    $$('[data-short-drive]').forEach(function (p) { if (PL) p.textContent = 'Roberts Middle School is about ' + PL.places[2].min + ' minutes from the Bois D’Arc Lane entry, roughly ' + PL.places[2].mi + ' miles.'; });

    // ================= AI concierge =================
    var chat = $('#chat'), log = $('.chat-log', chat), input = $('#chat-input'), ask = $('.ask'), tip = $('.ask-tip'), started = false, hist = [], line = Promise.resolve(), topic = 'all';
    var AI = /github\.io$|^localhost$|^127\.|^$/.test(location.hostname) && !/[?&]ai=1/.test(location.search) ? '' : '/api/concierge';
    var MARK = '<img src="img/logo-icon.svg" alt="">';
    var PAGE_NAMES = { home: 'Home', community: 'Community', homes: 'Find Your Home', lifestyle: 'Lifestyle', relocation: 'Relocation', schools: 'Schools', residents: 'Residents', hoa: 'HOA & Tax Rates', realtors: 'Realtor Specialist', contact: 'Contact', news: 'News & Updates' };
    var TOPICS = [['all', 'All'], ['homesites', 'Homesites'], ['builders', 'Builders'], ['lifestyle', 'Lifestyle'], ['location', 'Fulshear'], ['schools', 'Schools'], ['buying', 'Next steps']];
    var SUGG = {
      all: ['How big is 2 acres?', 'Give me the tour', 'Who are the builders?', 'What’s nearby?', 'Which schools serve Belmont Estates?', 'How much are homesites?'],
      homesites: ['How big is 2 acres?', 'How many homes will there be?', 'Show me the homesites by builder', 'Open the masterplan'],
      builders: ['Who are the builders?', 'Can I build a single-story home?', 'Show Toll Brothers homesites', 'Who is the developer?'],
      lifestyle: ['What is there to do in the community?', 'What can I do with 2 acres?', 'Parks and museums nearby'],
      location: ['Where is Belmont Estates?', 'Grocery stores nearby', 'Hospitals nearby', 'Which roads are nearby?'],
      schools: ['Which schools serve Belmont Estates?', 'Which school district?', 'Show the school map'],
      buying: ['How do I get updates?', 'How much are homesites?', 'What is the HOA fee?', 'How do I get directions?']
    };
    var CATWORDS = [['Schools', ['schools nearby', 'school map']], ['Medical', ['hospital', 'medical', 'clinic', 'doctor']], ['Grocery', ['grocery', 'groceries', 'supermarket', 'h-e-b', 'heb', 'kroger', 'walmart']], ['Shopping', ['shopping', 'shop', 'mall', 'costco', 'market', 'bella terra']], ['Entertainment', ['entertainment', 'movie', 'cinema', 'waterpark', 'water park', 'typhoon']], ['Daycares', ['daycare', 'day care', 'childcare', 'preschool']], ['Hardware', ['hardware', 'home depot', 'lowe']], ['Museums & Parks', ['museum', 'parks nearby', 'park nearby', 'george ranch', 'jones creek', 'history']]];
    var CATNAME = { Schools: 'schools', Medical: 'hospitals and clinics', Entertainment: 'entertainment spots', Grocery: 'grocery stores', Hardware: 'hardware stores', Daycares: 'daycares', 'Museums & Parks': 'museums and parks', Shopping: 'shopping destinations' };
    function has(q, ws) { return ws.some(function (w) { return q.indexOf(w) >= 0; }); }
    function faqA(i, extra) { var r = { text: K.faq[i][2], src: 'Belmont Estates materials' }; for (var k in extra) r[k] = extra[k]; return r; }
    function builderIn(q) { if (has(q, ['william david', 'wdh'])) return 'wdh'; if (has(q, ['toll'])) return 'toll'; if (has(q, ['partners in building', 'pib'])) return 'pib'; if (has(q, ['autograph'])) return 'autograph'; return ''; }
    function placeIn(q) { var best = 0, len = 0; K.places.forEach(function (p) { var n = p[1].toLowerCase().replace(/’/g, "'"); if (q.indexOf(n) >= 0 && n.length > len) { best = p[0]; len = n.length; } }); return best; }
    var ACT = {
      homesites: function (b) { return { label: b ? 'Show ' + BY[b].name + ' homesites' : 'Open the site map', fn: function () { showHomesites({ builder: b }); } }; },
      masterplan: function () { return { label: 'Open the masterplan', fn: function () { openView('masterplan'); }, ghost: 1 }; },
      place: function (n) { return { label: 'Show on the map', fn: function () { showPlace(n); } }; },
      category: function (c) { return { label: 'See ' + CATNAME[c] + ' on the map', fn: function () { showCategory(c); } }; },
      page: function (p, label) { return { label: label, fn: function () { go('#' + p); } }; },
      directions: function () { return { label: 'Get directions', href: HOME_DIR }; },
      schools: function () { return { label: 'Show the school map', fn: function () { go('#schools/school-map'); } }; }
    };
    function placesW(c) { return function (b) { b.innerHTML = '<div class="w-list">' + K.places.filter(function (p) { return p[2] === c; }).map(function (p) { return '<button type="button" data-wp="' + p[0] + '"><span class="num" style="background:' + CAT[c] + '">' + p[0] + '</span>' + esc(p[1]) + '</button>'; }).join('') + '</div>'; b.addEventListener('click', function (e) { var x = e.target.closest('[data-wp]'); if (x) { if (innerWidth < 700) setChat(false); showPlace(+x.getAttribute('data-wp')); } }); }; }
    function regW(b) {
      b.innerHTML = '<form class="w-reg" novalidate><input name="first" placeholder="First name" aria-label="First name" autocomplete="given-name"><input name="email" type="email" placeholder="Email" aria-label="Email" autocomplete="email"><button type="submit">Keep me posted</button><small>Prototype: nothing is sent yet.</small></form>';
      b.addEventListener('submit', function (e) { e.preventDefault(); var f = e.target, n = f.first.value.trim(), m = f.email.value.trim(); if (!n || !/.+@.+\..+/.test(m)) { (n ? f.email : f.first).focus(); return; } b.innerHTML = '<p><b>Thank you, ' + esc(n) + '.</b> We can’t wait to help you build your dream home in this beautiful community!</p>'; });
    }
    function menuW(b) {
      var T = [['Homesite size', '2 acres, in your units', 'How big is 2 acres?', 'size'], ['Find homes', 'Filter by builder and phase', 'Show me the homesites by builder', 'home'], ['Site map', 'Every homesite, pond and trail', 'Open the site map', 'map'], ['What’s nearby', K.places.length + ' places by category', 'What’s nearby?', 'pin'], ['Guided tour', 'A walk through every page', 'Give me the tour', 'nav'], ['Get updates', 'Hear first about homesites', 'How do I get updates?', 'heart']];
      b.innerHTML = '<div class="w-tools">' + T.map(function (t) { return '<button type="button" data-q="' + esc(t[2]) + '"><i>' + ICON[t[3]] + '</i><b>' + t[0] + '</b><small>' + t[1] + '</small></button>'; }).join('') + '</div>';
      b.addEventListener('click', function (e) { var x = e.target.closest('[data-q]'); if (x) askQ(x.getAttribute('data-q')); });
    }
    // How big 2 acres is: a homesite in 3D, to scale with a football field or tennis courts, in the visitor's units. Drag to turn it.
    function sizeW(b) {
      var U = [['acres', 'Acres', '2 acres'], ['sqft', 'Square feet', '87,120 square feet'], ['m2', 'Square meters', 'About 8,094 square meters'], ['ha', 'Hectares', 'About 0.81 hectares'], ['field', 'Football fields', 'About 1.5 football fields, end zones included'], ['court', 'Tennis courts', 'About 12 tennis courts, with their surrounds']];
      var courts = ''; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) courts += '<rect x="' + (10 + c * 62) + '" y="' + (12 + r * 122) + '" width="60" height="120"/>';
      for (var e2 = 0; e2 < 3; e2++) courts += '<rect x="' + (10 + e2 * 62) + '" y="378" width="60" height="50" opacity=".3"/>';
      b.innerHTML = '<div class="w-lot"><div class="w-lot-3d" aria-hidden="true"><svg viewBox="0 0 200 436"><rect class="lot" width="200" height="436"/><g class="f-field"><rect x="20" y="38" width="160" height="360"/><path d="M20 68h160M20 368h160M20 218h160"/></g><g class="f-court">' + courts + '</g></svg></div>' +
        '<div class="w-units" role="group" aria-label="Units">' + U.map(function (u, i) { return '<button type="button" data-u="' + i + '" aria-pressed="' + (i === 0) + '">' + u[1] + '</button>'; }).join('') + '</div><p class="w-lot-out" aria-live="polite">2 acres</p><small>Every homesite is shown as a 200 by 436 ft rectangle, to scale. Real homesite shapes vary. Drag to turn it.</small></div>';
      var view = $('.w-lot-3d', b), wrap = $('.w-lot', b), out = $('.w-lot-out', b), rot = -28, from = null;
      function turn() { view.style.setProperty('--rz', rot + 'deg'); }
      turn();
      view.addEventListener('pointerdown', function (e) { from = e.clientX; try { view.setPointerCapture(e.pointerId); } catch (x) {} });
      view.addEventListener('pointermove', function (e) { if (from === null) return; rot += (e.clientX - from) * .6; from = e.clientX; turn(); });
      view.addEventListener('pointerup', function () { from = null; });
      b.addEventListener('click', function (e) {
        var x = e.target.closest('[data-u]'); if (!x) return; var u = U[+x.getAttribute('data-u')];
        $$('[data-u]', b).forEach(function (y) { y.setAttribute('aria-pressed', y === x); }); out.textContent = u[2];
        wrap.classList.toggle('show-field', u[0] === 'field'); wrap.classList.toggle('show-court', u[0] === 'court');
      });
    }
    function reply(raw) {
      var q = ' ' + raw.toLowerCase().replace(/[’‘]/g, "'") + ' ', t = raw.trim().toLowerCase();
      for (var i = 0; i < K.faq.length; i++) if (t === K.faq[i][1].toLowerCase()) return faqA(i);
      if (has(q, ['safe', 'crime', 'demographic', 'religio', 'ethnic', ' race', 'kind of people'])) return { text: 'I can’t speak to that. I can help with the homesites, builders, lifestyle, schools and what’s nearby.', widget: menuW };
      if (has(q, [' hi ', 'hello', ' hey ', 'good morning', 'good evening'])) return { text: 'Hello! I’m the Belmont Estates concierge. I can show the homesites by builder, map what’s nearby, find the schools or walk you through the site.', widget: menuW };
      if (has(q, ['what can you', ' help', 'menu', 'options'])) return { text: 'Here’s what I can do:', widget: menuW };
      if (has(q, ['tour', 'show me around', 'walk me through'])) return { text: 'Let’s take a quick guided tour. I’ll move through each page and point out what matters.', actions: [{ label: 'Start the tour', fn: startTour }] };
      var b = builderIn(q);
      if (b && has(q, ['homesite', 'lot', 'show', 'where', 'map'])) return { text: BY[b].name + ' is assigned ' + plural(counts[b], 'Phase 1 homesite') + ' on the masterplan. Here they are on the site map.', src: 'Masterplan', actions: [ACT.homesites(b)] };
      if (has(q, ['favorite', 'favourite', 'saved', 'save a'])) return { text: 'Select the heart on any homesite in the site map to save it. Your favorites stay on this device, and the Favorites button shows only the homesites you saved.', actions: [ACT.homesites('')] };
      if (has(q, ['how many', ' 75 ', '227'])) return faqA(2);
      if (has(q, ['how big', 'size', 'acre', 'large'])) return { text: K.faq[1][2] + ' Here’s what 2 acres looks like. Pick your units, and drag to turn it.', src: 'Belmont Estates materials', widget: sizeW, actions: [ACT.homesites('')] };
      if (has(q, ['by builder', 'site map', 'masterplan', 'master plan', 'phase', 'which homesite', 'available', 'show me the homesites', 'see the homesites'])) return faqA(7, { actions: [ACT.homesites(''), ACT.masterplan()] });
      if (has(q, ['price', 'pricing', 'cost', 'how much', 'afford'])) return faqA(19, { widget: regW });
      if (has(q, ['hoa', 'tax', 'association', ' mud'])) return { text: 'HOA and property tax details for Belmont Estates will be published as they are finalized. Register your interest to be notified.', src: 'Belmont Estates website', widget: regW, actions: [ACT.page('hoa', 'HOA & tax rates')] };
      if (has(q, ['resident', 'homeowner', 'management company'])) return faqA(26, { actions: [ACT.page('residents', 'Open the Residents page')] });
      if (has(q, ['realtor', 'agent', 'broker'])) return { text: 'A dedicated page for real estate professionals is on the way. Register your interest and we’ll share details when they’re available.', src: 'Belmont Estates website', actions: [ACT.page('realtors', 'Realtor Specialist')] };
      if (has(q, ['single-story', 'single story', 'one story', 'custom', 'design', 'floor plan'])) return faqA(5, { actions: [ACT.page('homes/builders', 'Meet the builders')] });
      if (b || has(q, ['builder', 'who builds', 'home builder'])) return faqA(b ? 6 : 4, { actions: [ACT.page('homes/builders', 'Meet the builders'), ACT.homesites(b)] });
      if (has(q, ['developer', 'highten', 'who is developing'])) return faqA(17, { actions: [ACT.page('community/developer', 'About the developer')] });
      if (has(q, ['school map'])) return faqA(16, { actions: [ACT.schools()] });
      if (has(q, ['school', 'lamar', 'isd', 'elementary', 'high school', 'junior high', 'middle school'])) return { text: K.faq[15][2] + ' ' + K.faq[16][2], src: 'Belmont Estates materials', actions: [ACT.schools()] };
      var pl = placeIn(q);
      if (pl) return { text: PLACE[pl].name + ' is on the Belmont Estates area map, under ' + PLACE[pl].cat + ' (number ' + pl + '). The map is not to scale.', src: 'Area attractions map', actions: [ACT.place(pl)] };
      for (var c = 0; c < CATWORDS.length; c++) if (has(q, CATWORDS[c][1])) { var cc = CATWORDS[c][0]; return { text: 'Here are the ' + CATNAME[cc] + ' on the Belmont Estates area map. Select one to find it.', src: 'Area attractions map', widget: placesW(cc), actions: [ACT.category(cc)] }; }
      if (has(q, ['road', 'highway', 'freeway', '1093', 'i-10', 'tollway', 'commute', 'drive'])) return { text: 'Down the stretch from Belmont Estates is FM 1093. The area map also shows I-10, 99, 6, 359, 1463, the Westpark Tollway and Texas Heritage Parkway.', src: 'Area attractions map', actions: [ACT.page('relocation/getting-around', 'See the roads'), ACT.directions()] };
      if (has(q, ['pond', 'lake', 'water'])) return { text: AM.ponds.text, src: 'Masterplan', actions: [ACT.homesites('')] };
      if (has(q, ['trail', 'walking', 'jog', 'green space', 'park', 'amenit', 'community', 'to do'])) return faqA(8, { actions: [ACT.page('lifestyle/amenities', 'See the amenities')] });
      if (has(q, ['pool', 'garden', 'play yard', 'wonderland', 'backyard'])) return faqA(9, { actions: [ACT.page('lifestyle', 'Explore the lifestyle')] });
      if (has(q, ['news', 'update', 'journal', 'video', 'photo'])) return { text: 'The journal has what’s new at Belmont Estates, and videos and photos are on the News & Updates page. Register your interest to hear first.', src: 'Belmont Estates website', actions: [ACT.page('news', 'Open News & Updates')] };
      if (has(q, ['nearby', 'near by', 'around', 'close by', 'attraction', 'area map'])) return faqA(11, { actions: [ACT.page('relocation/area-map', 'Open the area map')] });
      if (has(q, ['when', 'timing', 'move in', 'start', 'begin', 'open'])) return { text: 'The Belmont Estates materials said new homes were slated to begin mid-2025. Register your interest for the latest timing.', src: 'Belmont Estates materials', widget: regW };
      if (has(q, ['direction', 'address', 'visit', 'get there', 'where', 'located', 'location', 'bois', 'fulshear'])) return faqA(10, { actions: [ACT.directions(), ACT.page('relocation/area-map', 'Open the area map')] });
      if (has(q, ['register', 'sign up', 'contact', 'call', 'email', 'phone', 'touch'])) return faqA(18, { widget: regW });
      var ws = q.split(/[^a-z0-9]+/).filter(function (w) { return w.length > 3 && ['what', 'where', 'which', 'about', 'belmont', 'estates', 'there', 'does', 'have', 'will', 'with', 'tell'].indexOf(w) < 0; }), bi = -1, bs = 0;
      K.faq.forEach(function (fq, k) { var bag = (fq[1] + ' ' + fq[2]).toLowerCase(), sc = 0; ws.forEach(function (w) { if (bag.indexOf(w) >= 0) sc++; }); if (sc > bs) { bs = sc; bi = k; } });
      if (bs >= 2) return faqA(bi);
      return { text: 'I don’t have an answer for that in the Belmont Estates materials yet. Register your interest and the team will follow up, or try one of these:', widget: menuW };
    }
    // Claude answers on the live site; the built-in answers above take over when it's unavailable
    function aiTool(r, tool, o) {
      if (tool === 'homesites') r.actions = [ACT.homesites(BY[o] ? o : '')];
      else if (tool === 'masterplan') r.actions = [ACT.masterplan()];
      else if (tool === 'place' && PLACE[+o]) r.actions = [ACT.place(+o)];
      else if (tool === 'category' && CAT[o]) { r.widget = placesW(o); r.actions = [ACT.category(o)]; }
      else if (tool === 'schools') r.actions = [ACT.schools()];
      else if (tool === 'directions') r.actions = [ACT.directions()];
      else if (tool === 'register') r.widget = regW;
      else if (tool === 'tour') r.actions = [{ label: 'Start the tour', fn: startTour }];
      else if (tool === 'menu') r.widget = menuW;
      else if (tool === 'size') r.widget = sizeW;
      else if (tool === 'page' && views[o]) r.actions = [ACT.page(o, 'Open ' + PAGE_NAMES[o])];
      return r;
    }
    function askAI() {
      var ctl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
      return fetch(AI, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: current, messages: hist }), signal: ctl ? ctl.signal : undefined }).then(function (res) {
        clearTimeout(tm);
        return res.json().catch(function () { return {}; }).then(function (d) {
          if (d.off) AI = '';
          if (!res.ok || typeof d.text !== 'string' || !d.text) throw new Error('fallback');
          return aiTool({ text: d.text, src: 'AI answer · Belmont Estates materials', chips: (d.chips || []).slice(0, 3) }, d.tool, d.option);
        });
      }, function (err) { clearTimeout(tm); throw err; });
    }
    function scrollLog() { log.scrollTop = log.scrollHeight; }
    function bot(r) {
      var m = document.createElement('div'); m.className = 'msg bot';
      m.innerHTML = '<span class="av">' + MARK + '</span><div class="bubble"><p></p></div>'; log.appendChild(m);
      var bub = $('.bubble', m); $('p', bub).textContent = r.text;
      if (r.src) { var s = document.createElement('span'); s.className = 'src'; s.textContent = r.src; bub.appendChild(s); }
      if (r.widget) { var w = document.createElement('div'); bub.appendChild(w); r.widget(w); }
      if (r.actions && r.actions.length) { var a = document.createElement('div'); a.className = 'msg-actions'; r.actions.forEach(function (x) { var el = document.createElement(x.href ? 'a' : 'button'); el.textContent = x.label; if (x.ghost) el.className = 'ghost'; if (x.href) { el.href = x.href; el.target = '_blank'; el.rel = 'noopener'; } else { el.type = 'button'; el.addEventListener('click', function () { if (innerWidth < 700) setChat(false); x.fn(); }); } a.appendChild(el); }); bub.appendChild(a); }
      if (r.chips && r.chips.length) { var c = document.createElement('div'); c.className = 'msg-chips'; r.chips.forEach(function (t) { var x = document.createElement('button'); x.type = 'button'; x.textContent = t; x.addEventListener('click', function () { askQ(t); }); c.appendChild(x); }); bub.appendChild(c); }
      scrollLog();
    }
    function askQ(text) {
      if (!text || !text.trim()) return; text = text.trim();
      if (chat.hidden) setChat(true, true);
      line = line.then(function () { return turn(text); }, function () { return turn(text); });
    }
    function turn(text) {
      var u = document.createElement('div'); u.className = 'msg user'; u.textContent = text; log.appendChild(u);
      var ty = document.createElement('div'); ty.className = 'msg bot typing'; ty.innerHTML = '<span class="av">' + MARK + '</span><div class="bubble"><i></i><i></i><i></i></div>'; log.appendChild(ty); scrollLog();
      hist.push({ role: 'user', text: text });
      var local = function () { return new Promise(function (ok) { setTimeout(function () { ok(reply(text)); }, reduce ? 0 : 500); }); };
      return (AI ? askAI().then(null, local) : local()).then(function (r) { ty.remove(); hist.push({ role: 'assistant', text: r.text }); hist = hist.slice(-10); bot(r); });
    }
    function drawSugg() { $('.chat-sugg', chat).innerHTML = SUGG[topic].map(function (s) { return '<button type="button">' + esc(s) + '</button>'; }).join(''); }
    function setChat(open, quiet) {
      chat.hidden = !open; ask.classList.toggle('away', open); ask.setAttribute('aria-expanded', open); tip.hidden = true; document.body.classList.toggle('chat-open', open);
      if (open) { drawSugg(); if (!started) { started = true; if (!quiet) bot({ text: 'Welcome to Belmont Estates. I’m your concierge for the 2-acre homesites, our builders, life in the community and the Fulshear area. Ask me anything, or pick a shortcut:', widget: menuW }); } if (!quiet) setTimeout(function () { input.focus({ preventScroll: true }); }, 200); }
      else ask.focus({ preventScroll: true });
    }
    $('.chat-topics', chat).innerHTML = TOPICS.map(function (t) { return '<button type="button" data-t="' + t[0] + '" aria-pressed="' + (t[0] === 'all') + '">' + t[1] + '</button>'; }).join('');
    $('.chat-topics', chat).addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; topic = b.getAttribute('data-t'); $$('.chat-topics button', chat).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); drawSugg(); });
    $('.chat-sugg', chat).addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) askQ(b.textContent); });
    $('.chat-form', chat).addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; askQ(v); });
    $('.chat-x', chat).addEventListener('click', function () { setChat(false); });
    $('.chat-reset', chat).addEventListener('click', function () { log.innerHTML = ''; hist = []; started = false; setChat(true); });
    ask.addEventListener('click', function () { setChat(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !chat.hidden) setChat(false); });
    document.addEventListener('click', function (e) { var a = e.target.closest('[data-ask]'); if (a) { e.preventDefault(); askQ(a.getAttribute('data-ask')); } });
    setTimeout(function () { try { if (sessionStorage.getItem('be-tip')) return; } catch (x) {} if (chat.hidden) tip.hidden = false; }, 6000);
    tip.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; tip.hidden = true; try { sessionStorage.setItem('be-tip', '1'); } catch (x) {}
      if (b.hasAttribute('data-tip')) askQ(b.getAttribute('data-tip')); else if (b.hasAttribute('data-tip-tour')) startTour();
    });

    scan(document); addExpand();

    // ---------- guided tour ----------
    var TOUR = [
      ['#home', 'Welcome to Belmont Estates: an acreage community in Fulshear with beautiful custom homes and space to roam.'],
      ['#community/explore', 'Every homesite on one map. Switch to satellite, filter by builder, open the listings, save favorites, or tilt the map into 3D.'],
      ['#homes/builders', 'Our family of builders: William David Homes, Toll Brothers, Partners in Building and Autograph Homes.'],
      ['#lifestyle/amenities', 'With your expansive 2-acre homesite, create your own wonderland, with trails, parks and green space close by.'],
      ['#relocation/area-map', 'Everything on the area attractions map: filter by category and find each place.'],
      ['#schools/school-map', 'Belmont Estates is served by Lamar CISD. Here are the campuses listed for the community, with the drive from the entrance.'],
      ['#residents', 'For homeowners: how the community works, who looks after it and where to go for help.'],
      ['#contact/get-in-touch', 'Register your interest. We can’t wait to help you build your dream home in this beautiful community!']
    ];
    var tourEl = $('.tour');
    function startTour() { setChat(false); tourStep(0); }
    function tourStep(i) {
      if (i >= TOUR.length) { tourEl.hidden = true; ask.classList.remove('away'); return; }
      go(TOUR[i][0]); ask.classList.add('away');
      tourEl.hidden = false;
      tourEl.innerHTML = '<small>Guided tour · ' + (i + 1) + ' of ' + TOUR.length + '</small><p>' + TOUR[i][1] + '</p><div class="row"><button type="button" class="next">' + (i === TOUR.length - 1 ? 'Finish' : 'Next') + '</button><button type="button" class="end">End tour</button></div>';
      $('.next', tourEl).addEventListener('click', function () { tourStep(i + 1); });
      $('.end', tourEl).addEventListener('click', function () { tourStep(TOUR.length); });
    }
  }
})();
