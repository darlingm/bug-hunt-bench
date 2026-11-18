/* The method page: the argument, the caveats, and the definitions.
   Same data file as the board, same theme system, same masthead — a second
   real page, not a route. Nothing here is written twice: the method steps, the
   caveats and every definition are rendered from data/benchmark.json, which is
   why moving them off the board cost no duplication.

   Every term gets a stable id (def-<key>, caveat-<n>) because the board links
   straight at them: a reader who clicks "cost tag" under the table should land
   on that definition, not at the top of this page. */

import { glossaryTerm, fmtDate, el } from './format.js?v=b13c489aa2';
import { initTheme } from './theme.js?v=b13c489aa2';
import { loadSubscriberRates } from './subscriber.js?v=b13c489aa2';

const $ = (id) => document.getElementById(id);

/* The content is fetched, so the browser has already done its hash scroll on an
   empty page by the time the target exists. Do it again once it does. */
function scrollToHash() {
  const id = decodeURIComponent(location.hash.replace('#', ''));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ block: 'start' });
  // a definition term is not focusable by default; make the landing spot announce
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

function render(DATA) {
  const updated = fmtDate(DATA.meta.updated);
  ['hero-updated', 'footer-updated'].forEach((id) => {
    const t = $(id);
    if (!t) return;
    t.setAttribute('datetime', DATA.meta.updated);
    t.textContent = updated;
  });
  if (DATA.meta.source_repo) {
    const src = $('source-link');
    if (src) src.href = DATA.meta.source_repo;
  }
  if (DATA.meta.repo_url) {
    const star = $('star-link');
    if (star) star.href = DATA.meta.repo_url;
  }

  const body = $('method-body');
  body.textContent = '';
  DATA.method.forEach((p, i) => {
    body.appendChild(el('div', { class: 'method-p', id: `step-${i + 1}` }, [
      el('span', { class: 'n', text: String(i + 1) }),
      el('p', { text: p }),
    ]));
  });

  const caveats = $('caveats-body');
  caveats.textContent = '';
  DATA.caveats.forEach((c, i) => {
    caveats.appendChild(el('li', { id: `caveat-${i + 1}`, text: c }));
  });

  const gloss = $('glossary-body');
  gloss.textContent = '';
  Object.entries(DATA.glossary).forEach(([k, v]) => {
    gloss.appendChild(el('dt', { id: `def-${k}`, text: glossaryTerm(k) }));
    gloss.appendChild(el('dd', { text: v }));
  });
}

/* Subscriber cost: the board's second reading of the cost column. Unlike the
   rest of this page it is read from data/subscriber-rates.json, the one input on
   the site kept by hand - which is why every multiplier is printed here with
   what it rests on, and why the section stays hidden if that file is missing
   rather than showing figures from anywhere else. */
function renderSubscriber(RATES) {
  if (!RATES) return;
  const body = $('subscriber-body');
  body.textContent = '';
  body.appendChild(el('p', { class: 'prose__p', text: RATES.definition }));
  body.appendChild(el('p', {
    class: 'prose__p',
    text: `The board uses the same dollar multiplier across the plans listed for each model family. The tooltip expresses weekly quota use for a $${RATES.reference_plan_usd_month}/month reference plan. At twice the monthly fee, the same run uses half that percentage. The default multipliers below are dated ${fmtDate(RATES.as_of)}. You can adjust them on the board and share your settings in the link.`,
  }));

  const dl = $('subscriber-rates');
  dl.textContent = '';
  RATES.rates.forEach((r) => {
    dl.appendChild(el('dt', { id: `rate-${r.id}`, text: `${r.name} ×${r.multiplier}` }));
    const links = Array.isArray(r.sources) ? r.sources.filter((s) => s?.url && s.title) : [];
    const sources = links.flatMap((s, i) => [
      i ? '; ' : '',
      el('a', { href: s.url, rel: 'noopener', target: '_blank' }, [s.title]),
    ]);
    dl.appendChild(el('dd', {}, [
      el('span', { class: 'rate__plans', text: `${r.plans} · runs in ${r.harness}` }),
      typeof r.basis === 'string' ? r.basis : null,
      sources.length ? el('span', { class: 'rate__sources' }, ['Sources: ', ...sources, '.']) : null,
    ]));
  });

  const cav = $('subscriber-caveats');
  cav.textContent = '';
  const caveats = Array.isArray(RATES.caveats) ? RATES.caveats : [];
  caveats.forEach((c, i) => {
    cav.appendChild(el('li', { id: `subscriber-caveat-${i + 1}`, text: c }));
  });
  $('subscriber-cost').hidden = false;
}

async function boot() {
  // the rates file is its own fetch: losing it costs this page one section, never the page
  const ratesReq = loadSubscriberRates();
  const res = await fetch('/data/benchmark.json', { cache: 'no-cache' });
  const DATA = await res.json();
  render(DATA);
  renderSubscriber(await ratesReq);
  initTheme();
  // theme-boot.js marks every page as loading before first paint; the board clears
  // it once drawn, and this page has to as well or it stays loading forever
  document.documentElement.classList.remove('is-loading');
  scrollToHash();
  /* The web fonts land after the first paint and reflow everything above the
     target, so a jump made before they arrive lands short. Do it once more when
     they are in. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scrollToHash);
  window.addEventListener('hashchange', scrollToHash);
}

boot().catch((err) => {
  // a failed load must look failed, not loading
  document.documentElement.classList.remove('is-loading');
  const host = $('method-body');
  if (host) {
    host.textContent = '';
    host.appendChild(el('p', {
      class: 'empty',
      text: 'The benchmark data could not be loaded. Read it directly at data/benchmark.json.',
    }));
  }
  throw err;
});
