import { setupScenes, goToStop } from './scenes.js';
import { setupExperience } from './experience.js';
import { setupAreaMap } from './areamap.js';
import { setupPlan } from './plan.js';
import { setupSchools } from './schools.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// The maps fill in their content before the scenes measure the page.
const areaMap = setupAreaMap();
setupPlan();
const smooth = setupScenes();
setupExperience({ smooth });
setupSchools({
  showOnMap(id) {
    areaMap.focus(id);
    if (!goToStop('area')) $('#area-map').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }
});

// Header menu on phones
const header = $('#site-header');
const menuToggle = $('.hs-menu-toggle');
menuToggle.addEventListener('click', () => {
  const open = !header.classList.contains('nav-open');
  header.classList.toggle('nav-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !header.classList.contains('nav-open')) return;
  header.classList.remove('nav-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.focus();
});

// About stats count up the first time they arrive
const counters = $$('[data-count]');
const countUp = element => {
  const target = Number(element.dataset.count);
  if (reducedMotion.matches) { element.textContent = target; return; }
  const start = performance.now(), duration = 1400;
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    element.textContent = Math.round(target * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
if ('IntersectionObserver' in window) {
  counters.forEach(element => { if (!reducedMotion.matches) element.textContent = '0'; });
  const watcher = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    countUp(entry.target); watcher.unobserve(entry.target);
  }), { threshold: .6 });
  counters.forEach(element => watcher.observe(element));
}

// Interest list form
const form = $('#connect-form');
const success = $('#connect-success');
const messages = {
  firstName: 'Enter your first name.',
  lastName: 'Enter your last name.',
  email: 'Enter an email address, like name@example.com.',
  zip: 'Enter a 5-digit ZIP code, or leave it blank.',
};
const validate = input => {
  const error = $(`#${input.id}-error`);
  const valid = input.checkValidity();
  input.setAttribute('aria-invalid', String(!valid));
  if (error) error.textContent = valid ? '' : messages[input.name];
  return valid;
};
const checked = $$('input[required], input[pattern]', form);
checked.forEach(input => {
  input.addEventListener('blur', () => { if (input.value) validate(input); });
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validate(input); });
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const invalid = checked.filter(input => !validate(input));
  if (invalid.length) { invalid[0].focus(); return; }

  const data = Object.fromEntries(new FormData(form));
  const endpoint = form.dataset.endpoint;
  if (endpoint) {
    const button = $('button[type="submit"]', form);
    const formError = $('#form-error');
    button.disabled = true;
    formError.textContent = '';
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error(response.statusText);
    } catch {
      button.disabled = false;
      formError.textContent = 'Your details were not sent. Check your connection, then select Join the interest list again.';
      return;
    }
  }

  if (endpoint) $('[data-email]', success).textContent = data.email;
  else {
    // Not connected yet: say so plainly rather than confirm a sign-up that went nowhere.
    $('h3', success).textContent = "Sign-ups aren't connected yet";
    $('p', success).textContent = "This is a preview of the Belmont Estates page, so your details weren't sent or saved. Once the interest list is connected, this message will confirm the sign-up.";
  }
  form.hidden = true;
  success.hidden = false;
  $('h3', success).focus();
});
