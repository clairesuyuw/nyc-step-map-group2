const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const BOROUGH_CENTERS = {
  Manhattan: [40.7831, -73.9712], Brooklyn: [40.6782, -73.9442], Queens: [40.7282, -73.7949],
  Bronx: [40.8448, -73.8648], 'Staten Island': [40.5795, -74.1502]
};
const NEIGHBORHOODS = {
  Manhattan: { 'Upper West Side': [40.787, -73.9754], 'Upper East Side': [40.7736, -73.9566], Midtown: [40.7549, -73.984], 'Lower Manhattan': [40.7075, -74.0113], Harlem: [40.8116, -73.9465] },
  Brooklyn: { Williamsburg: [40.7081, -73.9571], 'Downtown Brooklyn': [40.696, -73.9845], 'Park Slope': [40.671, -73.9814], Bushwick: [40.6958, -73.9171], 'Coney Island': [40.5755, -73.9707] },
  Queens: { Astoria: [40.7644, -73.9235], Flushing: [40.7675, -73.8331], 'Long Island City': [40.7447, -73.9485], 'Jackson Heights': [40.7557, -73.8831], Jamaica: [40.7027, -73.789] },
  Bronx: { Fordham: [40.8615, -73.8906], Riverdale: [40.9006, -73.9068], 'South Bronx': [40.8177, -73.9182], 'Pelham Bay': [40.8506, -73.8331], 'Morris Park': [40.8523, -73.8535] },
  'Staten Island': { 'St. George': [40.6437, -74.0736], Tompkinsville: [40.6378, -74.0776], 'New Dorp': [40.5732, -74.1163], 'Great Kills': [40.5543, -74.1515], Tottenville: [40.5124, -74.251] }
};
const BASE_EVENTS = [
  { time: '07:20', steps: 225 }, { time: '09:10', steps: 620 }, { time: '11:35', steps: 1450 },
  { time: '13:15', steps: 980 }, { time: '16:05', steps: 1860 }, { time: '18:30', steps: 1411 },
  { time: '20:10', steps: 1190 }, { time: '22:05', steps: 700 }
];
const todayKey = () => new Date().toISOString().slice(0, 10);
const relativeDate = daysAgo => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); };
const defaults = {
  version: 3,
  goal: 10000,
  profile: null,
  today: { steps: 8436, areas: ['Manhattan', 'Brooklyn', 'Queens'], events: BASE_EVENTS },
  records: [
    { id: 1, date: relativeDate(1), steps: 11240, areas: ['Manhattan', 'Brooklyn'], goal: 10000 },
    { id: 2, date: relativeDate(2), steps: 9780, areas: ['Queens'], goal: 10000 },
    { id: 3, date: relativeDate(3), steps: 13482, areas: ['Bronx', 'Manhattan'], goal: 10000 },
    { id: 4, date: relativeDate(4), steps: 7260, areas: ['Brooklyn'], goal: 10000 },
    { id: 5, date: relativeDate(5), steps: 10505, areas: ['Staten Island'], goal: 10000 }
  ]
};

const clone = value => JSON.parse(JSON.stringify(value));
let state;
try { state = JSON.parse(localStorage.getItem('nyc-step-map')) || clone(defaults); }
catch { state = clone(defaults); }
state.goal ||= defaults.goal;
state.profile ??= null;
state.today ||= clone(defaults.today);
state.today.areas ||= [];
state.records ||= clone(defaults.records);
if (!state.today.events?.length) state.today.events = scaleEvents(state.today.steps || 0);
delete state.reminders;
state.version = 3;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const formatNumber = number => Number(number).toLocaleString('en-US');
const formatMoney = number => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
const save = () => localStorage.setItem('nyc-step-map', JSON.stringify(state));
const formatDate = date => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
let map;
let mapLayers = [];

function scaleEvents(total) {
  if (!total) return [];
  const baseTotal = BASE_EVENTS.reduce((sum, event) => sum + event.steps, 0);
  let assigned = 0;
  return BASE_EVENTS.map((event, index) => {
    const steps = index === BASE_EVENTS.length - 1 ? total - assigned : Math.round(total * event.steps / baseTotal);
    assigned += steps;
    return { time: event.time, steps };
  });
}

function updateClock() {
  const now = new Date();
  $('#today-date').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  $('#local-time').textContent = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(now);
  const nyHour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/New_York' }).format(now));
  $('#day-period').textContent = nyHour < 12 ? 'morning' : nyHour < 18 ? 'afternoon' : 'evening';
}

function metrics() {
  const heightCm = state.profile?.height || 170;
  const weightKg = state.profile?.weight || 65;
  const strideMeters = heightCm / 100 * 0.413;
  const distanceKm = state.today.steps * strideMeters / 1000;
  const distanceMiles = distanceKm * 0.621371;
  const calories = distanceKm * weightKg * 0.75;
  return { heightCm, weightKg, strideMeters, distanceKm, distanceMiles, calories };
}

function render() {
  const percent = Math.min(100, Math.round(state.today.steps / state.goal * 100));
  const remaining = Math.max(0, state.goal - state.today.steps);
  const reached = state.today.steps >= state.goal;
  const covered = new Set(state.today.areas);
  const data = metrics();
  $('#home-steps').textContent = formatNumber(state.today.steps);
  $('#home-goal-text').textContent = `of ${formatNumber(state.goal)}`;
  $('#ring-desc').textContent = `${formatNumber(state.today.steps)} of ${formatNumber(state.goal)} steps completed`;
  $('#home-ring').style.strokeDashoffset = String(791.68 * (1 - percent / 100));
  $('#goal-status').textContent = reached ? 'GOAL REACHED' : 'ON TRACK';
  $('#goal-status').classList.toggle('done', reached);
  $('#distance').textContent = `${data.distanceMiles.toFixed(1)} mi`;
  $('#area-count').textContent = covered.size;
  const areaLabel = state.profile ? `${state.profile.neighborhood}, ${state.profile.borough}` : 'Choose your main area';
  $('#home-location').textContent = `⌖ ${areaLabel}`;
  $('#home-area-name').textContent = state.profile ? `home: ${state.profile.borough}` : 'NYC boroughs';
  $('#goal-input').value = state.goal;
  $('#goal-preview-value').textContent = formatNumber(state.goal);
  $('#goal-preview-bar').style.width = `${percent}%`;
  $('#remaining-copy').textContent = reached ? `${formatNumber(state.today.steps - state.goal)} steps beyond your goal` : `${formatNumber(remaining)} steps`;
  $('#progress-steps').textContent = formatNumber(state.today.steps);
  $('#progress-goal').textContent = `/ ${formatNumber(state.goal)} steps`;
  $('#percent-label').textContent = `${percent}% COMPLETE`;
  $('#wide-progress').style.width = `${percent}%`;
  $('#progress-message').textContent = reached ? `Goal complete — you went ${formatNumber(state.today.steps - state.goal)} steps beyond it!` : `Just ${formatNumber(remaining)} more steps — about ${Math.ceil(remaining / 120)} city blocks.`;
  $('#borough-score').textContent = `${covered.size}/5`;
  $('#borough-list').innerHTML = BOROUGHS.map(name => `<li class="${covered.has(name) ? 'covered' : ''}"><i></i><span>${name}</span>${state.profile?.borough === name ? '<strong>main area</strong>' : covered.has(name) ? '<strong>covered</strong>' : ''}</li>`).join('');
  renderHistory();
  renderTimeChart();
  renderImpact(data);
  renderMap();
}

function renderTimeChart() {
  const hours = Array(24).fill(0);
  state.today.events.forEach(event => { const hour = Math.max(0, Math.min(23, Number(event.time?.split(':')[0]) || 0)); hours[hour] += Number(event.steps) || 0; });
  const max = Math.max(...hours, 1);
  $('#hour-chart').innerHTML = hours.map((steps, hour) => `<div class="hour-bar-wrap"><span class="hour-value">${steps ? formatNumber(steps) : ''}</span><i class="hour-bar ${steps ? 'has-steps' : ''}" style="height:${Math.max(4, steps / max * 100)}%" title="${hour}:00 — ${formatNumber(steps)} steps"></i></div>`).join('');
  $('#hour-chart').setAttribute('aria-label', `Hourly step chart. ${hours.map((value, hour) => value ? `${hour}:00 ${value} steps` : '').filter(Boolean).join(', ')}`);
  const periods = [
    { name: 'Night', range: '12–6 AM', start: 0, end: 6, icon: '☾' },
    { name: 'Morning', range: '6 AM–12 PM', start: 6, end: 12, icon: '↗' },
    { name: 'Afternoon', range: '12–6 PM', start: 12, end: 18, icon: '◉' },
    { name: 'Evening', range: '6 PM–12 AM', start: 18, end: 24, icon: '✦' }
  ].map(period => ({ ...period, steps: hours.slice(period.start, period.end).reduce((a, b) => a + b, 0) }));
  $('#period-list').innerHTML = periods.map(period => `<article class="period-card"><span class="period-icon">${period.icon}</span><div><span>${period.name}</span><small>${period.range}</small></div><strong>${formatNumber(period.steps)}</strong></article>`).join('');
}

function renderImpact(data) {
  const carCarbonLb = data.distanceMiles * 0.882;
  const transitCarbonLb = data.distanceMiles * 0.16;
  const taxiCarbonLb = data.distanceMiles * 0.97;
  const transitCost = data.distanceMiles > 0 ? 3 : 0;
  const drivingCost = data.distanceMiles * 0.70;
  const taxiCost = data.distanceMiles > 0 ? 4.5 + data.distanceMiles * 3.5 : 0;
  $('#calories-value').textContent = `${Math.round(data.calories)}`;
  $('#carbon-value').textContent = carCarbonLb.toFixed(1);
  $('#impact-distance').textContent = data.distanceMiles.toFixed(1);
  const rows = [
    { icon: 'MTA', mode: 'Subway / bus', detail: 'one base fare', money: transitCost, carbon: transitCarbonLb },
    { icon: 'CAR', mode: 'Personal car', detail: '$0.70 per mile estimate', money: drivingCost, carbon: carCarbonLb },
    { icon: 'TAXI', mode: 'Yellow taxi', detail: 'metered distance, before traffic', money: taxiCost, carbon: taxiCarbonLb }
  ];
  $('#comparison-table').innerHTML = rows.map(row => `<div class="comparison-row"><span class="mode-icon">${row.icon}</span><div><strong>${row.mode}</strong><small>${row.detail}</small></div><div><span>Money saved</span><strong>${formatMoney(row.money)}</strong></div><div><span>Tailpipe CO₂ avoided</span><strong>${row.carbon.toFixed(1)} lb</strong></div></div>`).join('');
  $('#estimate-method').textContent = `Estimated stride: ${data.strideMeters.toFixed(2)} m (height × 0.413). Walking energy: 0.75 kcal per kg per km. Transit assumes one $3.00 base fare; taxi uses the standard $3.00 initial charge, $0.70 per 1/5 mile, plus $1.50 in base surcharges, excluding traffic and other surcharges. Car CO₂ uses the EPA average of 400 g per mile.`;
}

function initMap() {
  if (map || !window.L || !$('#nyc-map')) return;
  map = L.map('nyc-map', { scrollWheelZoom: false, zoomControl: true }).setView([40.7128, -74.006], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
}

function renderMap() {
  initMap();
  if (!map) {
    $('#nyc-map').innerHTML = '<div class="map-fallback">Street map unavailable. Your borough coverage is still listed below.</div>';
    return;
  }
  mapLayers.forEach(layer => map.removeLayer(layer));
  mapLayers = [];
  const covered = new Set(state.today.areas);
  BOROUGHS.forEach(name => {
    const marker = L.circleMarker(BOROUGH_CENTERS[name], { radius: covered.has(name) ? 10 : 6, color: '#17251f', weight: 2, fillColor: covered.has(name) ? '#b9dfca' : '#ebe7da', fillOpacity: 1 }).addTo(map).bindTooltip(`${name}${covered.has(name) ? ' · covered today' : ''}`);
    mapLayers.push(marker);
  });
  if (state.profile) {
    const homeCoordinates = NEIGHBORHOODS[state.profile.borough]?.[state.profile.neighborhood] || BOROUGH_CENTERS[state.profile.borough];
    const home = L.circleMarker(homeCoordinates, { radius: 9, color: '#17251f', weight: 3, fillColor: '#ff6a3d', fillOpacity: 1 }).addTo(map).bindPopup(`<strong>${state.profile.neighborhood}</strong><br>Your main activity area`);
    mapLayers.push(home);
  }
}

function todayRecord() { return { id: 'today', date: todayKey(), steps: state.today.steps, areas: state.today.areas, goal: state.goal }; }

function renderHistory() {
  const filter = $('#history-filter').value;
  const records = [todayRecord(), ...state.records].filter(record => filter === 'all' || (filter === 'goal' ? record.steps >= record.goal : record.steps < record.goal));
  const all = [todayRecord(), ...state.records];
  const total = all.reduce((sum, item) => sum + item.steps, 0);
  const goals = all.filter(item => item.steps >= item.goal).length;
  $('#history-summary').innerHTML = `<div class="summary-chip"><span>Total steps</span><strong>${formatNumber(total)}</strong></div><div class="summary-chip"><span>Goals reached</span><strong>${goals}/${all.length}</strong></div><div class="summary-chip"><span>Boroughs visited</span><strong>${new Set(all.flatMap(item => item.areas)).size}/5</strong></div>`;
  $('#record-list').innerHTML = records.map(record => `<div class="record-row"><span>${record.id === 'today' ? '<strong>Today</strong>' : formatDate(record.date)}</span><strong>${formatNumber(record.steps)}</strong><div class="area-tags">${record.areas.length ? record.areas.map(area => `<span>${area}</span>`).join('') : '<span>None logged</span>'}</div><span class="result-badge ${record.steps >= record.goal ? 'hit' : 'miss'}">${record.steps >= record.goal ? 'Goal reached' : 'Not yet'}</span>${record.id === 'today' ? '<span></span>' : `<button class="icon-button" data-delete="${record.id}" aria-label="Delete record from ${formatDate(record.date)}">×</button>`}</div>`).join('');
  $('#history-empty').hidden = records.length > 0;
  $('#record-list').hidden = records.length === 0;
  $$('[data-delete]').forEach(button => button.addEventListener('click', () => requestDelete(Number(button.dataset.delete))));
}

function showRoute(route) {
  const valid = ['home', 'goals', 'history', 'progress'].includes(route) ? route : 'home';
  $$('.page').forEach(page => { page.hidden = page.id !== valid; page.classList.toggle('active', page.id === valid); });
  $$('.main-nav a').forEach(link => link.toggleAttribute('aria-current', link.dataset.route === valid));
  $('#main-nav').classList.remove('open');
  $('#menu-button').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (valid === 'progress') setTimeout(() => map?.invalidateSize(), 80);
}

function toast(message) {
  $('#toast-copy').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

function fillNeighborhoods(borough, selected = '') {
  const select = $('#neighborhood-select');
  const names = borough ? Object.keys(NEIGHBORHOODS[borough]) : [];
  select.innerHTML = names.length ? `<option value="">Choose a neighborhood</option>${names.map(name => `<option${name === selected ? ' selected' : ''}>${name}</option>`).join('')}` : '<option value="">Choose a borough first</option>';
  select.disabled = !names.length;
}

function openProfile(mode = 'edit') {
  const onboarding = mode === 'onboarding';
  $('#profile-dialog').classList.toggle('onboarding', onboarding);
  $('#profile-title').innerHTML = onboarding ? 'First, tell us<br><em>where you move.</em>' : 'Update your<br><em>walking profile.</em>';
  $('.profile-step').textContent = onboarding ? 'WELCOME TO NYC STEP MAP' : 'PROFILE SETTINGS';
  $('#close-profile').hidden = onboarding;
  const profile = state.profile || {};
  $('#borough-select').value = profile.borough || '';
  fillNeighborhoods(profile.borough, profile.neighborhood);
  $('#height-input').value = profile.height || '';
  $('#weight-input').value = profile.weight || '';
  $('#profile-error').textContent = '';
  if (!$('#profile-dialog').open) $('#profile-dialog').showModal();
}

$$('[data-route]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); location.hash = link.dataset.route; showRoute(link.dataset.route); }));
window.addEventListener('hashchange', () => showRoute(location.hash.slice(1)));
$('#menu-button').addEventListener('click', () => { const open = $('#main-nav').classList.toggle('open'); $('#menu-button').setAttribute('aria-expanded', String(open)); });

$$('[data-open-log]').forEach(button => button.addEventListener('click', () => {
  $('#steps-input').value = '';
  $('#steps-error').textContent = '';
  $('#time-input').value = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/New_York' }).format(new Date());
  $$('#borough-options input').forEach(input => input.checked = input.value === state.profile?.borough);
  $('#log-dialog').showModal();
  setTimeout(() => $('#steps-input').focus(), 20);
}));
$$('[data-close-log]').forEach(button => button.addEventListener('click', () => $('#log-dialog').close()));

$('#log-form').addEventListener('submit', event => {
  event.preventDefault();
  const steps = Number($('#steps-input').value);
  const time = $('#time-input').value;
  if (!Number.isFinite(steps) || steps < 1 || steps > 100000) { $('#steps-error').textContent = 'Enter a step count between 1 and 100,000.'; $('#steps-input').focus(); return; }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { $('#steps-error').textContent = 'Choose the time of this walk.'; $('#time-input').focus(); return; }
  const selectedAreas = $$('#borough-options input:checked').map(input => input.value);
  state.today.steps += Math.round(steps);
  state.today.events.push({ time, steps: Math.round(steps) });
  state.today.areas = [...new Set([...state.today.areas, ...selectedAreas])];
  save(); render(); $('#log-dialog').close(); toast(`${formatNumber(steps)} steps added at ${time}`);
});

$('#profile-button').addEventListener('click', () => openProfile('edit'));
$('#home-location').addEventListener('click', () => openProfile('edit'));
$('#close-profile').addEventListener('click', () => $('#profile-dialog').close());
$('#borough-select').addEventListener('change', event => fillNeighborhoods(event.target.value));
$('#profile-form').addEventListener('submit', event => {
  event.preventDefault();
  const borough = $('#borough-select').value;
  const neighborhood = $('#neighborhood-select').value;
  const height = Number($('#height-input').value);
  const weight = Number($('#weight-input').value);
  if (!borough || !neighborhood || height < 120 || height > 230 || weight < 30 || weight > 250) {
    $('#profile-error').textContent = 'Choose an area and enter a height from 120–230 cm and weight from 30–250 kg.';
    return;
  }
  state.profile = { borough, neighborhood, height: Math.round(height), weight: Math.round(weight * 10) / 10 };
  state.today.areas = [...new Set([...state.today.areas, borough])];
  save(); render(); $('#profile-dialog').close(); toast('Walking profile saved');
});

$$('input[name="quick-goal"]').forEach(radio => radio.addEventListener('change', () => { $('#goal-input').value = radio.value; previewGoal(); }));
$('#goal-input').addEventListener('input', previewGoal);
function previewGoal() { const goal = Number($('#goal-input').value) || 0; $('#goal-preview-value').textContent = formatNumber(goal); $('#goal-preview-bar').style.width = `${Math.min(100, state.today.steps / Math.max(1, goal) * 100)}%`; }

$('#goal-form').addEventListener('submit', event => {
  event.preventDefault();
  const goal = Number($('#goal-input').value);
  if (!Number.isFinite(goal) || goal < 1000 || goal > 50000) { $('#goal-error').textContent = 'Your goal must be between 1,000 and 50,000 steps.'; $('#goal-input').focus(); return; }
  $('#goal-error').textContent = '';
  state.goal = Math.round(goal / 100) * 100;
  save(); render(); toast(`Daily goal set to ${formatNumber(state.goal)} steps`);
});

$('#history-filter').addEventListener('change', renderHistory);
let pendingDelete = null;
function requestDelete(id) { pendingDelete = id; $('#confirm-dialog').showModal(); }
$('#cancel-delete').addEventListener('click', () => { pendingDelete = null; $('#confirm-dialog').close(); });
$('#confirm-delete').addEventListener('click', () => { state.records = state.records.filter(record => record.id !== pendingDelete); save(); render(); $('#confirm-dialog').close(); toast('Record deleted'); pendingDelete = null; });

updateClock();
setInterval(updateClock, 30000);
save();
render();
showRoute(location.hash.slice(1));
if (!state.profile) setTimeout(() => openProfile('onboarding'), 250);
