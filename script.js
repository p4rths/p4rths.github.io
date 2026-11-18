const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- Header & mobile nav ----------
const header = $('#header'), burger = $('#burger'), navLinks = $('#navLinks');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 40), { passive: true });
burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => { navLinks.classList.remove('open'); burger.classList.remove('open'); }));

// ---------- Form sending ----------
// To make callback requests email the business: get a free access key at https://web3forms.com
// (enter the business email, the key arrives by email) and paste it below.
// With no key, the form runs in demo mode (it validates and confirms but sends nothing).
const FORM_KEY = '21521aab-cf28-4564-8185-65b5e9c673b5';
const toFormData = obj => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, v)); return fd; };
async function sendForm(subject, data) {
  if (!FORM_KEY) { console.info('[demo mode] would send:', subject, data); await new Promise(r => setTimeout(r, 700)); return true; }
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { Accept: 'application/json' }, // FormData = no CORS preflight, works even from file://
    body: toFormData({ access_key: FORM_KEY, subject, from_name: 'Dolor Home website', ...data }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || 'Send failed');
  return true;
}
let lockedEstimate = null; // set by the estimator's "Lock in this price" button

// ---------- Quote form ----------
const quote = $('#quote');
$('#qZip').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });
quote.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('button[type=submit]', quote);
  const msg = $('#qMsg');
  const checks = [
    [$('#qService'), v => v !== ''],
    [$('#qName'), v => v.trim().length > 1],
    [$('#qPhone'), v => v.replace(/\D/g, '').length >= 10],
    [$('#qZip'), v => /^\d{5}$/.test(v)],
  ];
  let ok = true;
  checks.forEach(([el, test]) => { const bad = !test(el.value); el.classList.toggle('error', bad); if (bad) ok = false; });
  if (!ok) { msg.className = 'form-msg err'; msg.textContent = 'Please check the highlighted fields.'; return; }
  const urgent = $('#qUrgent').checked;
  const data = {
    name: $('#qName').value.trim(),
    phone: $('#qPhone').value.trim(),
    service: $('#qService').value,
    zip: $('#qZip').value,
    emergency: urgent ? 'YES' : 'No',
    estimate: lockedEstimate || 'n/a',
  };
  btn.disabled = true; btn.textContent = 'Sending…'; msg.textContent = '';
  try {
    await sendForm(`${urgent ? '🚨 EMERGENCY ' : ''}Callback request: ${data.name} (${data.service})`, data);
    msg.className = 'form-msg ok';
    msg.textContent = urgent
      ? `🚨 Emergency logged. A technician will call ${data.phone} in under 5 minutes.`
      : `Thanks ${data.name.split(' ')[0]}! We'll call you back within 15 minutes.`;
    quote.reset(); lockedEstimate = null;
  } catch (err) {
    msg.className = 'form-msg err';
    msg.textContent = 'Sorry, that didn\'t go through. Please call (555) 010-6070.';
  } finally {
    btn.disabled = false; btn.textContent = 'Call me back';
  }
});
$$('input, select', quote).forEach(el => el.addEventListener('input', () => el.classList.remove('error')));

// ---------- Animated counters ----------
const counterIO = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target, target = +el.dataset.count, suffix = el.dataset.suffix || '';
  const start = performance.now(), dur = 1600;
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  counterIO.unobserve(el);
}), { threshold: .6 });
$$('[data-count]').forEach(el => counterIO.observe(el));

// ---------- Price estimator (edit ranges to the client's real prices) ----------
const PRICES = {
  leak:   { base: [150, 350],  each: [90, 200],  unit: 'leak' },
  drain:  { base: [120, 250],  each: [80, 150],  unit: 'drain' },
  heater: { base: [1200, 2400], each: [1100, 2200], unit: 'heater' },
  outlet: { base: [120, 200],  each: [45, 90],   unit: 'outlet' },
  panel:  { base: [1800, 3500], each: [1500, 3000], unit: 'panel' },
  light:  { base: [150, 280],  each: [70, 140],  unit: 'fixture' },
};
const eJob = $('#eJob'), eQty = $('#eQty'), eResult = $('#eResult');
let mult = 1;
const money = n => '$' + (Math.round(n / 10) * 10).toLocaleString();
function estimate() {
  const p = PRICES[eJob.value], q = +eQty.value;
  const lo = (p.base[0] + p.each[0] * (q - 1)) * mult;
  const hi = (p.base[1] + p.each[1] * (q - 1)) * mult;
  $('#eQtyOut').textContent = `${q} ${p.unit}${q > 1 ? 's' : ''}`;
  eResult.textContent = `${money(lo)} – ${money(hi)}`;
  $('#eNote').textContent = mult > 1 ? 'Includes priority scheduling surcharge' : 'Parts & labour included';
  eResult.classList.add('bump'); setTimeout(() => eResult.classList.remove('bump'), 180);
}
eJob.addEventListener('change', estimate);
eQty.addEventListener('input', estimate);
$$('#eWhen button').forEach(b => b.addEventListener('click', () => {
  $$('#eWhen button').forEach(x => x.classList.toggle('active', x === b));
  mult = +b.dataset.m; estimate();
}));
estimate();

// "Lock in this price" → carry the estimate into the callback form
const JOB_TO_SERVICE = { leak: 'Leak or burst pipe', drain: 'Blocked drain', heater: 'Water heater', outlet: 'Electrical fault', panel: 'Rewiring / panel upgrade', light: 'Something else' };
$('#estimate .btn').addEventListener('click', () => {
  lockedEstimate = `${eJob.options[eJob.selectedIndex].text}, ${$('#eQtyOut').textContent}, ${$('#eWhen .active').textContent}: ${eResult.textContent}`;
  $('#qService').value = JOB_TO_SERVICE[eJob.value];
  $('#qService').classList.remove('error');
  const msg = $('#qMsg'); msg.className = 'form-msg ok'; msg.textContent = `Estimate locked: ${eResult.textContent}. Add your details below.`;
  setTimeout(() => $('#qName').focus({ preventScroll: true }), 600);
});

// ---------- FAQ: only one open at a time ----------
$$('#faqList details').forEach(d => d.addEventListener('toggle', () => {
  if (d.open) $$('#faqList details').forEach(o => { if (o !== d) o.open = false; });
}));

// ---------- Scroll reveal ----------
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
}), { threshold: .1 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });

$('#year').textContent = new Date().getFullYear();
