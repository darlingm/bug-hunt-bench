/* Subscriber cost: what a run costs someone on a $100-or-more plan rather than
   on the API.

   Most readers of this board pay a flat subscription, not list rates, and a
   subscription's weekly allowance holds many times its fee in API-priced usage
   - about 52 times for Claude, 27 for OpenAI - so a list-rate dollar figure
   ranks two subscriptions against each other wrongly. This is the other
   reading of the same column: the run's cost_usd divided by its plan's
   multiplier, the share of the fee the run uses.

   THE MULTIPLIERS ARE THE ONE HAND-KEPT INPUT ON THIS SITE. They live in
   data/subscriber-rates.json with their sources, not in benchmark.json, because
   they are not a measurement of any run here - they are a judgment about the
   plans, drawn from other people's measurements that disagree with each other.
   That is also why the reader can change them, and why the link carries the
   change: a shared view must say which multipliers it was drawn with.

   Nothing here touches cost_usd. Subscriber cost is stamped beside it as
   `subscriber_cost`, and a run with no subscription rate carries null, which
   every view already knows how to show as a dash. */

import { el, fmtDate } from './format.js?v=b13c489aa2';

/** An unavailable or incomplete rates file leaves both pages usable in API mode. */
export async function loadSubscriberRates() {
  try {
    const response = await fetch('/data/subscriber-rates.json', { cache: 'no-cache' });
    if (!response.ok) return null;
    const data = await response.json();
    if (!Number.isFinite(data?.reference_plan_usd_month) || data.reference_plan_usd_month <= 0
      || !Array.isArray(data.rates) || !data.rates.length
      || !data.rates.every((r) => r?.id && r.vendor && r.harness
        && Number.isFinite(r.multiplier) && parseMultiplier(r.multiplier) !== null)) return null;
    return data;
  } catch {
    return null;
  }
}

/** The URL parameter that carries a reader's own multiplier for one rate. Not
    x_: ?x= is a map's log / linear scale, and the two must not read alike. */
export const rateParam = (id) => `rate_${id}`;

/* A multiplier is a ratio of dollars to dollars, so anything that is not a
   positive, finite number is refused - and so is anything absurd, because a
   typo of 5200 for 52 would otherwise redraw the whole board as free. */
const MULT_MIN = 1;
const MULT_MAX = 500;

/** A usable multiplier from a string or number, or null. */
export function parseMultiplier(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < MULT_MIN || n > MULT_MAX) return null;
  return n;
}

/** The rate that covers a run, or null. A rate covers a run when the vendor and
    the harness both match exactly - Opus through a gateway is not on a Claude
    plan - and, for a rate that names a model prefix, the model too. A rate with
    a prefix beats one without, so Fable is never priced as "other Claude". */
export function rateFor(run, rates) {
  if (!rates) return null;
  const route = rates.rates.filter((r) => r.vendor === run.vendor && r.harness === run.harness);
  const model = String(run.model || '');
  return route.find((r) => r.model_prefix && model.startsWith(r.model_prefix))
    || route.find((r) => !r.model_prefix)
    || null;
}

const fmtMult = (n) => `×${n}`;

/** The file's own multipliers, by rate id. */
export function defaultMultipliers(rates) {
  const out = {};
  if (rates) rates.rates.forEach((r) => { out[r.id] = r.multiplier; });
  return out;
}

/** True when any multiplier in force is not the file's own. */
export function isCustom(rates, mult) {
  return Boolean(rates) && rates.rates.some((r) => mult[r.id] !== r.multiplier);
}

/** Stamp `subscriber_cost` on every run, with what it was priced at and its
    share of the reference plan's week - the subscriber's own unit, "this used
    5% of my week" - for the chart tooltip. Recomputed whenever a multiplier
    changes; cost_usd is never written. */
export function stampSubscriberCost(runs, rates, mult) {
  const weeklyFee = rates ? rates.reference_plan_usd_month * 12 / 52 : null;
  runs.forEach((r) => {
    const rate = rateFor(r, rates);
    const has = Number.isFinite(r.cost_usd);
    r.subscriber_rate = rate ? rate.id : null;
    r.subscriber_cost = rate && has ? r.cost_usd / mult[rate.id] : null;
    r.subscriber_basis = rate ? `${rate.label} ${fmtMult(mult[rate.id])}` : null;
    r.subscriber_week = r.subscriber_cost === null ? null : r.subscriber_cost / weeklyFee;
  });
}

export function fmtShare(v) {
  if (v === null || v === undefined) return '—';
  if (v === 0) return '0%';
  const pct = v * 100;
  return `${pct < 0.1 ? '<0.1' : pct < 10 ? pct.toFixed(1) : pct.toFixed(0)}%`;
}

/* The multipliers in force, as the sentence names them. A reader's own figure
   says so beside it, with the file's figure for comparison, so a screenshot of
   a view drawn with someone's own numbers can never pass for the defaults. */
function multiplierList(rates, mult, shown) {
  return rates.rates
    .filter((r) => !shown || shown.has(r.id))
    .map((r) => (mult[r.id] === r.multiplier
      ? `${r.label} ${fmtMult(mult[r.id])}`
      : `${r.label} ${fmtMult(mult[r.id])} (custom, default ${fmtMult(r.multiplier)})`));
}

function listWords(items) {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** What the figure IS, said once for the runs on screen: the definition with
    the multipliers in force, then which runs have no rate. Returns two groups
    of segments - plain text, or text with an href - so the key can render
    links and the PNG export can render the same words flat, and so a chart
    can put the definition with its plot and the rest in its footer. A map
    omits missing estimates, and a logarithmic map also omits genuine zeros. */
export function subscriberSentence(runs, rates, mult, methodLink, scale = null) {
  const covered = runs.filter((r) => r.subscriber_rate);
  const shown = new Set(covered.map((r) => r.subscriber_rate));
  const names = multiplierList(rates, mult, shown.size ? shown : null);
  const definition = [
    { text: `${rates.definition} Multipliers as of ${fmtDate(rates.as_of)} are ${listWords(names)}` },
    methodLink ? { text: ' (' } : null,
    methodLink ? { text: 'how the multipliers were set', href: methodLink } : null,
    methodLink ? { text: ')' } : null,
    { text: '.' },
  ].filter(Boolean);

  const gaps = [
    [runs.length - covered.length, 'without a matching subscription rate'],
    [covered.filter((r) => r.subscriber_cost === null).length, 'without a recorded API cost'],
    [scale === 'log' ? covered.filter((r) => r.subscriber_cost === 0).length : 0, 'at zero on the logarithmic axis'],
  ].filter(([n]) => n > 0).map(([n, why]) => `${n} run${n === 1 ? '' : 's'} ${why}`);
  const rule = runs.length > covered.length
    ? ' Subscriber cost requires a recorded API cost on a supported route (Anthropic in Claude Code or OpenAI in Codex CLI).' : '';
  const coverage = gaps.length
    ? [{ text: `${scale ? 'The chart omits' : 'A dash marks'} ${listWords(gaps)}.${rule}` }] : [];
  return { definition, coverage };
}

/** The multiplier fields: one per rate, labelled from the data file, with a
    reset that only exists while something differs from it. */
export function renderRateFields(host, rates, state, onChange) {
  host.textContent = '';
  rates.rates.forEach((r) => {
    const input = el('input', {
      type: 'number',
      class: 'costbasis__input',
      min: String(MULT_MIN),
      max: String(MULT_MAX),
      step: 'any',
      inputmode: 'decimal',
      value: String(state.mult[r.id]),
      'aria-label': `${r.name}: API-priced dollars per dollar of plan fee (default ${r.multiplier})`,
      'data-rate': r.id,
    });
    // live while the figure is usable; put back on leave if it never became one
    input.addEventListener('input', () => {
      const v = parseMultiplier(input.value);
      if (v !== null && v !== state.mult[r.id]) onChange(r.id, v);
    });
    input.addEventListener('blur', () => {
      input.value = String(state.mult[r.id]);
    });
    host.appendChild(el('label', { class: 'costbasis__rate', title: r.plans }, [
      el('span', { class: 'costbasis__name', text: r.label }),
      el('span', { class: 'costbasis__times', text: '×', 'aria-hidden': 'true' }),
      input,
    ]));
  });
  const reset = el('button', {
    type: 'button', class: 'linkbtn costbasis__reset', text: 'Reset', hidden: !isCustom(rates, state.mult),
  });
  reset.addEventListener('click', () => onChange(null, null));
  host.appendChild(reset);
}

/** Keep the fields in step with state without rebuilding them, so a reader
    typing into one never loses the caret to a re-render. */
export function syncRateFields(host, rates, mult) {
  host.querySelectorAll('input[data-rate]').forEach((input) => {
    if (document.activeElement === input) return;
    input.value = String(mult[input.dataset.rate]);
  });
  const reset = host.querySelector('.costbasis__reset');
  if (reset) reset.hidden = !isCustom(rates, mult);
}
