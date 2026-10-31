// The schools section: step through each stage of school, and open any school or daycare on the area map.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function setupSchools({ showOnMap }) {
  const path = $('#school-path');
  if (!path) return;
  const tabs = $$('[role="tab"]', path), panel = $('#sp-panel');
  const stage = $('#sp-stage'), name = $('#sp-name'), note = $('#sp-note'), mapButton = $('#sp-map');

  function choose(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.classList.toggle('is-past', i < index);
      tab.tabIndex = i === index ? 0 : -1;
    });
    const tab = tabs[index];
    path.style.setProperty('--step', index);
    panel.setAttribute('aria-labelledby', tab.id);
    stage.textContent = $('.sp-stage', tab).textContent;
    name.textContent = tab.dataset.name;
    note.textContent = `Lamar CISD. Place ${tab.dataset.place} on the area map.`;
    mapButton.dataset.place = tab.dataset.place;
    panel.classList.remove('is-swap');
    void panel.offsetWidth;
    panel.classList.add('is-swap');
    if (focus) tab.focus();
  }
  tabs.forEach((tab, i) => tab.addEventListener('click', () => choose(i)));
  // Arrow keys move between stages, as a tab list should.
  path.addEventListener('keydown', event => {
    const current = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
    const next = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined || !event.target.closest('[role="tab"]')) return;
    event.preventDefault();
    choose((next + tabs.length) % tabs.length, true);
  });
  $('#schools').addEventListener('click', event => {
    const button = event.target.closest('button[data-place]:not([role="tab"])');
    if (button) showOnMap(Number(button.dataset.place));
  });
}
