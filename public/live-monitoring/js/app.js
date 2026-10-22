/* Live Monitoring dashboard: rendering and behaviour.
   One state object (S) drives every panel. All data comes from js/data.js (demo fixtures). */
(function () {
  'use strict';
  var D = window.SBData, CFG = D.CFG;
  var R = window.SB_ROUTES || { global: { overview: '../global-dashboard/index.html#overview', risk: '../global-dashboard/index.html#risk', alerts: '../global-dashboard/index.html#alerts', org: '../global-dashboard/index.html#org', health: '../global-dashboard/index.html#health', settings: '../global-dashboard/index.html#settings', docs: '../global-dashboard/index.html#docs', signout: '../global-dashboard/index.html#signout' }, monitoring: './index.html' };

  var S = { station: 'SB-DEMO-001', scenario: 'B', range: '15m', rows: 10, tab: 'feed', hover: null, menu: null, pollMsg: '', polling: false };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ICONS = window.SB_ICONS || {};
  var ico = function (n, c) { return '<svg class="msi' + (c ? ' ' + c : '') + '" width="1em" height="1em" viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="' + (ICONS[n] || '') + '"/></svg>'; };
  var f1 = function (n) { return Number(n).toFixed(1); };

  function dlFile(name, text, type) {
    var u = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 1500);
  }
  function csvOf(rows) { return rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); }

  /* ---------- status vocabulary (text + icon + colour; never colour alone) ---------- */
  var TONE = {
    ok: 'bg-secondary-container/25 text-secondary border-secondary/40',
    warn: 'bg-warning-dark/20 text-warning-dark border-warning-dark/40',
    bad: 'bg-error-container/40 text-error border-error/60',
    mute: 'bg-surface-container-high text-outline border-outline-variant',
    info: 'bg-surface-container-high text-accent-lavender border-outline-variant'
  };
  var ST = {
    normal: { label: 'NORMAL • WITHIN BASELINE', tone: 'ok', icon: 'check_circle', dot: 'bg-secondary', glow: 'bg-secondary/15', val: 'text-on-surface' },
    caution: { label: 'CAUTION • DEMO THRESHOLD', tone: 'warn', icon: 'warning', dot: 'bg-warning-dark', glow: 'bg-warning-dark/15', val: 'text-warning-dark' },
    high: { label: 'HIGH WATER • DEMO ESCALATION', tone: 'bad', icon: 'emergency', dot: 'bg-error', glow: 'bg-error/25', val: 'text-error' },
    stale: { label: 'STALE DATA • LINK DEGRADED', tone: 'warn', icon: 'wifi_off', dot: 'bg-warning-dark', glow: 'bg-warning-dark/10', val: 'text-warning-dark' },
    offline: { label: 'OFFLINE • NO RECENT DATA', tone: 'bad', icon: 'cloud_off', dot: 'bg-error', glow: 'bg-error/15', val: 'text-error' },
    fault: { label: 'SENSOR FAULT • ECHO TIMEOUT', tone: 'bad', icon: 'error', dot: 'bg-error', glow: 'bg-error/20', val: 'text-error' },
    apierr: { label: 'BACKEND TIMEOUT 504 (SIMULATED)', tone: 'mute', icon: 'cloud_off', dot: 'bg-outline', glow: 'bg-outline/10', val: 'text-outline' },
    pending: { label: 'AWAITING FIRMWARE PROVISION', tone: 'info', icon: 'hourglass_empty', dot: 'bg-accent-lavender', glow: 'bg-accent-lavender/10', val: 'text-accent-lavender' }
  };
  var THR = { normal: ['ok', 'NORMAL'], caution: ['warn', 'CAUTION'], high: ['bad', 'HIGH WATER'], fault: ['bad', 'INVALID'] };
  var badge = function (tone, text, extra) { return '<span class="inline-flex items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 font-mono text-[10px] font-bold ' + TONE[tone] + (extra ? ' ' + extra : '') + '">' + text + '</span>'; };
  var CARD = 'rounded-xl border border-outline-dark bg-surface-container-dark/90 p-4 shadow-lg';
  var BTN = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-xs font-medium text-accent-lavender transition-colors hover:bg-surface-container-highest-dark';
  var BTN_P = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-3 py-2 text-xs font-bold text-on-primary-container shadow-md transition hover:brightness-110 active:scale-95';

  function cur() { return D.view(S.station, S.scenario); }
  function ageLine(v) {
    if (v.observedAt == null) return 'No observation received';
    return 'Observed at ' + D.hms(v.observedAt) + ' UTC (' + D.ageText(v.ageSec) + ' before reference time ' + D.hm(CFG.asOf) + ')';
  }

  /* ---------- navigation ---------- */
  function navItems() {
    return [['Global Overview', R.global.overview], ['Live Monitoring', R.monitoring, true], ['Location Risk & Impact', R.global.risk],
      ['Alerts & Incidents', R.global.alerts], ['Org Intelligence', R.global.org], ['System Health', R.global.health]];
  }
  function renderNav() {
    var links = navItems().map(function (n) {
      var on = n[2];
      return '<a href="' + n[1] + '"' + (on ? ' aria-current="page"' : '') + ' class="whitespace-nowrap rounded-lg px-2.5 py-1 text-label-md ' + (on ? 'border-b-2 border-primary font-semibold text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface') + '">' + esc(n[0]) + '</a>';
    });
    $('nav').innerHTML = links.join('');
    $('mobileNav').innerHTML = '<ul class="space-y-1">' + navItems().map(function (n) {
      var on = n[2];
      return '<li><a href="' + n[1] + '"' + (on ? ' aria-current="page"' : '') + ' class="block rounded-lg px-3 py-2 text-sm ' + (on ? 'bg-primary-container/30 font-semibold text-primary' : 'text-on-surface-variant hover:bg-surface-container') + '">' + esc(n[0]) + '</a></li>';
    }).join('') + '</ul>';
    $('brand').setAttribute('href', R.global.overview);
  }

  /* ---------- top controls ---------- */
  function renderStationSelect() {
    $('stationSelect').innerHTML = D.STATIONS.map(function (s) { return '<option value="' + s.id + '"' + (s.id === S.station ? ' selected' : '') + '>' + esc(s.id + ' — ' + s.option) + '</option>'; }).join('');
    $('stationList').innerHTML = D.STATIONS.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('');
  }
  function renderScenarioBar() {
    var hint = { C: 'hover:border-error text-error', D: 'hover:border-warning-dark text-warning-dark', E: 'hover:border-error text-on-surface-variant', F: 'hover:border-outline text-outline', G: 'hover:border-outline text-outline' };
    $('scenarioBar').innerHTML = D.SCENARIOS.map(function (sc) {
      var on = sc.key === S.scenario;
      return '<button type="button" data-scn="' + sc.key + '" aria-pressed="' + on + '" class="whitespace-nowrap rounded border px-2.5 py-1 font-mono text-[11px] transition-colors ' + (on ? 'border-primary bg-primary-container/40 font-semibold text-accent-lavender shadow-sm' : 'border-outline-variant bg-surface-container-high hover:border-primary ' + (hint[sc.key] || 'text-on-surface')) + '">' + esc(sc.btn) + '</button>';
    }).join('');
  }
  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem('sb-theme', mode); } catch (e) { /* storage unavailable */ }
    var on = 'bg-primary-container text-on-primary-container shadow', off = 'text-on-surface-variant hover:text-on-surface';
    [['themeDark', 'dark'], ['themeLight', 'light']].forEach(function (p) {
      var b = $(p[0]), act = p[1] === mode;
      b.setAttribute('aria-pressed', String(act));
      b.className = 'flex items-center rounded-full px-2 py-1 text-xs transition-colors ' + (act ? on : off);
    });
  }
  function conditions(v) {
    var out = [];
    if (v.status === 'high') out.push(['bad', 'High water (demo threshold)', 'Depth ' + f1(v.depth) + ' cm is above ' + f1(CFG.high) + ' cm.']);
    else if (v.status === 'caution') out.push(['warn', 'Caution threshold exceeded', 'Depth ' + f1(v.depth) + ' cm is above ' + f1(CFG.caution) + ' cm.']);
    else if (v.status === 'stale') out.push(['warn', 'Data is stale', 'No packet for ' + D.ageText(v.ageSec) + ' (limit ' + CFG.staleSec + ' s). Last reading is not current.']);
    else if (v.status === 'offline') out.push(['bad', 'Station offline', 'No packet for ' + D.ageText(v.ageSec) + '. The last reading is shown for reference only.']);
    else if (v.status === 'fault') out.push(['bad', 'Sensor fault', 'Echo timeout. Readings are rejected, not shown as water depth.']);
    else if (v.status === 'apierr') out.push(['mute', 'Backend unreachable (simulated)', 'The station state cannot be confirmed.']);
    else if (v.status === 'pending') out.push(['info', 'Awaiting first sync', 'The device has not been provisioned yet.']);
    return out;
  }
  function renderNotif(v) {
    var c = conditions(v);
    $('notifDot').classList.toggle('hidden', !c.length);
    $('notifPanel').innerHTML = '<p class="mb-2 text-xs font-bold">Notifications for ' + esc(v.station.id) + '</p>'
      + (c.length ? '<ul class="space-y-2">' + c.map(function (x) { return '<li class="rounded-lg border p-2.5 text-xs ' + TONE[x[0]] + '"><b class="block">' + esc(x[1]) + '</b><span class="text-on-surface-variant">' + esc(x[2]) + '</span></li>'; }).join('') + '</ul>'
        : '<p class="rounded-lg bg-surface-container-high p-3 text-xs text-on-surface-variant">No active conditions for this station.</p>')
      + '<p class="mt-2 text-[11px] text-outline">Derived from the current demo state. Nothing is sent.</p>'
      + '<div class="mt-2 flex flex-wrap gap-2 border-t border-outline-variant/60 pt-2 text-xs"><a class="font-semibold text-primary hover:underline" href="' + R.global.alerts + '">Open Alerts &amp; Incidents</a><a class="font-semibold text-primary hover:underline" href="' + R.global.health + '">Open System Health</a></div>';
  }
  function renderAccount() {
    var item = function (t, h, i) { return '<a href="' + h + '" class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface">' + ico(i, 'text-[16px]') + t + '</a>'; };
    $('accountPanel').innerHTML = '<div class="border-b border-outline-variant/60 px-3 pb-2 pt-1"><p class="text-xs font-bold">Monitoring operator (demo)</p><p class="text-[11px] text-outline">No sign-in is configured in this prototype.</p></div>'
      + item('Settings', R.global.settings, 'settings') + item('Documentation & help', R.global.docs, 'help') + item('Sign out', R.global.signout, 'logout');
  }
  function renderSync(v) {
    var s = ST[v.status], text;
    if (v.status === 'normal' || v.status === 'caution' || v.status === 'high' || v.status === 'fault') text = 'Last packet ' + D.ageText(v.ageSec) + ' old';
    else if (v.status === 'stale' || v.status === 'offline') text = 'No packet for ' + D.ageText(v.ageSec);
    else if (v.status === 'apierr') text = 'Backend unreachable (simulated)';
    else text = 'Waiting for first sync';
    $('syncPill').innerHTML = '<span class="h-2 w-2 rounded-full ' + s.dot + '" aria-hidden="true"></span><span class="font-mono text-[11px] text-on-surface-variant">ESP32 bridge (fixture) • <span class="font-semibold text-on-surface">' + esc(S.pollMsg || text) + '</span></span>';
    $('pollIcon').classList.toggle('rotate-180', S.polling);
  }

  /* ---------- identity strip ---------- */
  function renderIdentity(v) {
    var st = v.station, synthetic = st.mode === 'synthetic';
    $('identity').innerHTML = '<div class="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-warning-dark/40 bg-warning-dark/10 px-3 py-2 text-xs text-warning-dark" role="note"><b>Demonstration fixture.</b><span class="font-normal text-on-surface-variant">Every value on this page is generated for design review. Nothing is measured by a device, and this is not an official warning.</span></div>'
      + '<div class="' + CARD + ' relative overflow-hidden"><div class="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary-container/10 blur-3xl" aria-hidden="true"></div>'
      + '<div class="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div class="space-y-1.5"><div class="flex flex-wrap items-center gap-2">'
      + '<span class="rounded border border-primary/50 bg-primary-container/30 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-accent-lavender">NODE IDENTIFIER</span>'
      + '<h1 class="text-headline-lg">' + esc(st.id) + ' — ' + esc(st.name) + '</h1>'
      + badge(synthetic ? 'warn' : 'info', synthetic ? 'SYNTHETIC TEST FIXTURE' : 'DEMONSTRATION FIXTURE', 'rounded-full uppercase tracking-wider') + '</div>'
      + '<p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant"><span class="flex items-center gap-1">' + ico('location_on', 'text-[15px] text-outline') + esc(st.loc) + '</span><span class="font-mono text-outline">(' + esc(st.coords) + ')</span><span class="text-outline" aria-hidden="true">•</span><span class="flex items-center gap-1 font-mono text-xs">' + ico('memory', 'text-[15px] text-accent-teal-bright') + esc(st.hw) + '</span></p></div>'
      + '<div class="flex flex-wrap items-center gap-3"><div class="rounded-lg border border-outline-variant/60 bg-surface-container-high/60 px-3 py-2 text-right"><div class="text-label-sm uppercase tracking-wider text-outline">Reference datum (H_ref)</div><div class="font-mono text-sm font-bold text-accent-lavender">' + f1(CFG.datum) + ' cm <span class="text-[11px] font-normal text-on-surface-variant">(bed to horn)</span></div></div>'
      + '<div class="rounded-lg border border-outline-variant/60 bg-surface-container-high/60 px-3 py-2 text-right"><div class="text-label-sm uppercase tracking-wider text-outline">Uplink</div><div class="flex items-center justify-end gap-1 font-mono text-sm font-bold text-accent-teal-bright">' + ico('wifi', 'text-[14px]') + esc(st.uplink) + '</div></div></div></div></div>';
  }

  /* ---------- hero cards ---------- */
  function rowsFor(v) { return D.rows(v); }
  function renderHero(v) {
    var s = ST[v.status], isOk = v.kind === 'ok', rowsAll = rowsFor(v), last = null, i;
    for (i = 0; i < rowsAll.length; i++) if (rowsAll[i].snr != null) { last = rowsAll[i]; break; }
    var depthTxt = v.status === 'fault' ? 'ERR' : v.depth == null ? '--' : f1(v.depth);
    var distTxt = v.distance == null ? '--' : f1(v.distance);
    var hasDepth = v.depth != null && v.status !== 'fault' && v.status !== 'pending';
    var gaugePct = hasDepth ? Math.max(2, Math.min(100, v.depth / 21.5 * 100)) : (v.status === 'pending' ? 4 : 0);
    var waterTxt = hasDepth ? f1(v.depth) + ' cm' + (v.status === 'stale' || v.status === 'offline' ? ' (last known)' : '') : v.status === 'fault' ? 'Echo lost' : v.status === 'pending' ? 'Zero calibration' : 'No stream';
    var trendTone = v.status === 'high' ? 'bad' : v.status === 'caution' || v.status === 'stale' ? 'warn' : v.status === 'normal' ? 'ok' : 'mute';

    var A = '<article class="' + CARD + ' relative flex flex-col justify-between overflow-hidden lg:col-span-5" aria-label="Current water depth"><div class="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full blur-2xl ' + s.glow + '" aria-hidden="true"></div><div class="relative">'
      + '<div class="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 class="flex items-center gap-2 text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">' + ico('water_ph', 'text-[20px] text-secondary') + 'Current water depth</h2>'
      + badge(trendTone, ico(v.tIcon, 'text-[13px]') + esc(v.trend), '') + '</div>'
      + '<div class="my-2 flex flex-wrap items-baseline gap-3"><div class="flex items-center gap-2"><span class="inline-block h-3.5 w-3.5 rounded-full shadow-lg ' + s.dot + (isOk ? ' pulse-halo-animation' : '') + '" aria-hidden="true"></span><span class="font-mono text-display-lg font-extrabold tracking-tight ' + s.val + '" id="depthValue">' + depthTxt + '</span></div><span class="text-headline-md font-semibold text-outline">cm</span>'
      + '<span class="ml-auto flex items-center gap-1 rounded border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider ' + TONE[s.tone] + '">' + ico(s.icon, 'text-[14px]') + s.label + '</span></div>'
      + '<p class="mb-4 flex flex-wrap items-center gap-x-2 text-xs text-on-surface-variant"><span>Demo thresholds: caution &gt; ' + f1(CFG.caution) + ' cm</span><span class="text-outline" aria-hidden="true">•</span><span>high water &gt; ' + f1(CFG.high) + ' cm</span></p>'
      + '<div class="relative flex h-48 flex-col justify-between overflow-hidden rounded-lg border border-outline-variant/70 bg-surface-container-lowest/80 p-3">'
      + '<div class="z-10 flex items-center justify-between gap-2 border-b border-outline-variant/60 bg-surface-container-lowest/90 pb-1.5"><span class="flex items-center gap-2 font-mono text-[11px] font-semibold text-accent-lavender">' + ico('sensors', 'text-[16px]') + 'Ultrasonic transducer (datum ' + f1(CFG.datum) + ' cm)</span><span class="font-mono text-[10px] text-secondary">Schematic</span></div>'
      + '<div class="relative my-1 w-full flex-1 overflow-hidden">'
      + (isOk ? '<div class="ultrasonic-sweep pointer-events-none absolute inset-x-12 top-0 flex h-20 flex-col items-center justify-around opacity-75" aria-hidden="true"><div class="h-0.5 w-16 rounded-full bg-accent-teal-bright/40"></div><div class="h-0.5 w-24 rounded-full bg-accent-teal-bright/50"></div><div class="h-0.5 w-32 rounded-full bg-accent-teal-bright/60"></div></div>' : '')
      + '<div class="pointer-events-none absolute flex w-full items-center justify-between border-b border-dashed border-warning-dark/80 px-2" style="bottom:' + (CFG.caution / 21.5 * 100).toFixed(1) + '%"><span class="bg-surface-container-lowest/90 px-1 font-mono text-[9px] font-bold text-warning-dark">Caution line: ' + f1(CFG.caution) + ' cm</span></div>'
      + '<div class="pointer-events-none absolute flex w-full items-center justify-between border-b border-dashed border-error/80 px-2" style="bottom:' + (CFG.high / 21.5 * 100).toFixed(1) + '%"><span class="bg-surface-container-lowest/90 px-1 font-mono text-[9px] font-bold text-error">High water: ' + f1(CFG.high) + ' cm</span></div>'
      + '<div id="gaugeWater" class="absolute inset-x-0 bottom-0 flex items-start justify-center border-t-2 border-secondary bg-gradient-to-t from-secondary/40 via-primary-container/30 to-secondary/60 transition-all duration-700" style="height:' + gaugePct.toFixed(1) + '%"><span class="-mt-3 flex items-center gap-1 rounded border border-secondary/40 bg-surface-dark-dim/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-secondary"><span class="h-1.5 w-1.5 rounded-full bg-secondary"></span>Meniscus: ' + esc(waterTxt) + '</span></div></div>'
      + '<div class="z-10 flex items-center justify-between border-t border-outline-variant/80 bg-surface-container-lowest/90 pt-1 font-mono text-[10px] text-outline"><span>Channel bed (0.0 cm depth)</span><span>Gauge scale 0 to 21.5 cm</span></div></div></div>'
      + '<div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-3 font-mono text-xs text-on-surface-variant"><span>' + esc(ageLine(v)) + '</span><span class="flex items-center gap-1 text-outline">' + ico('info', 'text-[13px]') + (v.obsNo ? 'Fixture observation #' + v.obsNo : 'No observation') + '</span></div></article>';

    var snr = last ? f1(last.snr) + '% (' + last.rssi + ' dBm)' : 'Unknown';
    var filt = v.status === 'fault' ? ['bad', 'FAIL • echo timeout'] : (v.status === 'apierr' || v.status === 'pending') ? ['mute', 'Unknown'] : ['ok', 'PASS' + (v.status === 'stale' || v.status === 'offline' ? ' (last packet)' : '')];
    var bounds = v.status === 'fault' ? 'Out of bounds (' + f1(v.distance) + ' cm)' : (v.status === 'apierr' || v.status === 'pending') ? 'Not evaluated' : '[' + f1(CFG.distMin) + ' – ' + f1(CFG.distMax) + ' cm] nominal';
    var B = '<article class="' + CARD + ' flex flex-col justify-between lg:col-span-3" aria-label="Sensor-to-water distance"><div>'
      + '<div class="mb-2 flex items-center gap-2"><h2 class="flex items-center gap-2 text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">' + ico('straighten', 'text-[20px] text-accent-lavender') + 'Sensor-to-water distance</h2></div>'
      + '<div class="my-3"><div class="flex items-baseline gap-2"><span class="font-mono text-display-lg font-extrabold tracking-tight" id="distValue">' + distTxt + '</span><span class="text-headline-md font-semibold text-outline">cm</span></div>'
      + '<p class="mt-1 flex items-center gap-1 font-mono text-xs text-on-surface-variant">' + (v.status === 'fault' ? ico('error', 'text-[13px] text-error') + 'Raw reading rejected' : v.distance == null ? ico('cloud_off', 'text-[13px] text-outline') + 'No data from backend' : ico('check_circle', 'text-[13px] text-accent-teal-bright') + 'Raw ultrasonic time of flight') + '</p></div>'
      + '<div class="my-3 space-y-1.5 rounded-lg border border-outline-variant bg-surface-container-high/60 p-2.5"><div class="text-label-sm font-semibold uppercase tracking-wider text-outline">Calculation</div><div class="overflow-x-auto rounded border border-outline-dark bg-surface-dark-dim/90 p-2 font-mono text-xs text-accent-lavender"><div class="text-[10px] text-outline">water_depth = datum − distance</div><div class="mt-1 text-[12px] font-bold text-on-surface"><span class="' + s.val + '">' + (v.status === 'fault' ? 'Invalid' : v.depth == null ? '--' : f1(v.depth) + ' cm') + '</span> = ' + f1(CFG.datum) + ' cm − <span class="text-accent-teal-bright">' + (v.distance == null ? '--' : f1(v.distance) + ' cm') + '</span></div></div></div>'
      + '<dl class="mt-4 space-y-2 font-mono text-xs"><div class="flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-1"><dt class="text-on-surface-variant">Signal quality:</dt><dd class="font-bold text-secondary">' + esc(snr) + '</dd></div>'
      + '<div class="flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-1"><dt class="text-on-surface-variant">Filter validation:</dt><dd class="font-bold ' + (filt[0] === 'ok' ? 'text-accent-teal-bright' : filt[0] === 'bad' ? 'text-error' : 'text-outline') + '">' + esc(filt[1]) + '</dd></div>'
      + '<div class="flex items-center justify-between gap-2"><dt class="text-on-surface-variant">Physical bounds:</dt><dd class="text-right">' + esc(bounds) + '</dd></div></dl></div>'
      + '<p class="mt-4 flex items-center gap-1 border-t border-outline-variant/40 pt-3 font-mono text-[11px] text-outline">' + ico('shield', 'text-[14px]') + 'Generated demo values, not measured</p></article>';

    var H = health(v);
    var C = '<article class="' + CARD + ' flex flex-col justify-between lg:col-span-4" aria-label="Station health"><div><div class="mb-2 flex items-center justify-between gap-2"><h2 class="flex items-center gap-2 text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">' + ico('health_and_safety', 'text-[20px] text-secondary') + 'Station health &amp; telemetry audit</h2><span class="font-mono text-[10px] text-outline">4-POINT CHECK</span></div><ul class="mt-2 space-y-2.5">'
      + H.map(function (h) { return '<li class="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-high/50 p-2.5"><div class="flex items-center gap-2"><span class="' + h.iconCls + '">' + ico(h.icon, 'text-[18px]') + '</span><div><div class="text-[11px] font-semibold">' + h.title + '</div><div class="font-mono text-[10px] text-on-surface-variant">' + esc(h.sub) + '</div></div></div>' + badge(h.tone, h.badge) + '</li>'; }).join('')
      + '</ul></div><div class="mt-3 flex items-center justify-between border-t border-outline-variant/40 pt-3 font-mono text-[11px] text-outline"><span>Firmware: v2.4.1 (fixture)</span><span>Heartbeat: 3 s (design)</span></div></article>';
    $('hero').innerHTML = A + B + C;
  }
  function health(v) {
    var k = v.status, live = (k === 'normal' || k === 'caution' || k === 'high');
    var conn = live || k === 'fault' ? ['ONLINE', 'ok', '100% heartbeat • 3 s interval'] : k === 'stale' || k === 'offline' ? ['OFFLINE', 'bad', 'No heartbeat for ' + D.ageText(v.ageSec)] : k === 'apierr' ? ['UNREACHABLE', 'mute', 'API gateway unavailable'] : ['PAIRING', 'info', 'Handshake in progress'];
    var valid = live ? ['VALID', 'ok', 'Physical range checks passed'] : k === 'fault' ? ['INVALID', 'bad', 'Distance ' + f1(v.distance) + ' cm is out of range'] : k === 'stale' || k === 'offline' ? ['AGED', 'warn', 'Last reading passed, now outdated'] : k === 'apierr' ? ['UNKNOWN', 'mute', 'Cannot be confirmed'] : ['PENDING', 'info', 'No reading to validate'];
    var fresh = live ? ['FRESH', 'ok', D.ageText(v.ageSec) + ' latency (limit ' + CFG.staleSec + ' s)'] : k === 'stale' || k === 'offline' ? ['STALE', 'warn', D.ageText(v.ageSec) + ' latency (limit ' + CFG.staleSec + ' s)'] : k === 'fault' ? ['DEGRADED', 'bad', 'Transducer error on this node'] : k === 'apierr' ? ['STALE', 'mute', 'API gateway unavailable'] : ['PENDING', 'info', 'Handshake in progress'];
    var power = live || k === 'fault' ? ['94% CHG', 'warn', '3.82 V (LiFePO4) • solar +420 mA (fixture)'] : k === 'stale' || k === 'offline' ? ['LAST KNOWN', 'mute', 'Last reported 3.79 V'] : ['UNKNOWN', 'mute', 'Not reporting'];
    var mk = function (title, d, icon, iconCls) { return { title: title, badge: d[0], tone: d[1], sub: d[2], icon: icon, iconCls: iconCls }; };
    return [mk('Device connectivity', conn, conn[1] === 'ok' ? 'cloud_done' : 'cloud_off', conn[1] === 'ok' ? 'text-secondary' : conn[1] === 'bad' ? 'text-error' : 'text-outline'),
      mk('Measurement validity', valid, valid[1] === 'ok' ? 'check_circle' : 'error', valid[1] === 'ok' ? 'text-accent-teal-bright' : valid[1] === 'bad' ? 'text-error' : valid[1] === 'warn' ? 'text-warning-dark' : 'text-outline'),
      mk('Data freshness', fresh, 'timer', fresh[1] === 'ok' ? 'text-secondary' : fresh[1] === 'warn' ? 'text-warning-dark' : fresh[1] === 'bad' ? 'text-error' : 'text-outline'),
      mk('Power & energy harvester', power, 'solar_power', 'text-warning-dark')];
  }

  /* ---------- history chart ---------- */
  var CH = { L: 60, R: 980, T: 30, B: 230, W: 1000 };
  function measureChart() { var w = Math.round($('history').getBoundingClientRect().width - 34); CH.W = Math.max(320, w || 1000); CH.R = CH.W - 20; }
  function chartGeom(v) {
    var ser = D.series(v, S.range), pts = ser.points, maxD = 0, i;
    for (i = 0; i < pts.length; i++) if (pts[i].depth != null && pts[i].depth > maxD) maxD = pts[i].depth;
    var yMax = Math.max(16, Math.ceil((maxD + 1) / 4) * 4);
    return { ser: ser, pts: pts, yMax: yMax,
      x: function (t) { return CH.L + (t - ser.start) / (ser.end - ser.start) * (CH.R - CH.L); },
      y: function (d) { return CH.B - d / yMax * (CH.B - CH.T); } };
  }
  function renderHistory(v) {
    measureChart();
    var g = chartGeom(v), pts = g.pts, i, svg = '', valid = pts.filter(function (p) { return !p.invalid; });
    for (i = 0; i <= 4; i++) {
      var val = g.yMax * i / 4, yy = g.y(val);
      svg += '<line x1="' + CH.L + '" x2="' + CH.R + '" y1="' + yy + '" y2="' + yy + '" stroke="rgb(var(--lm-outline-dark))" stroke-dasharray="' + (i ? '3 3' : '0') + '"/><text x="' + (CH.L - 8) + '" y="' + (yy + 4) + '" text-anchor="end" style="fill:rgb(var(--lm-outline));font:10px JetBrains Mono,monospace">' + val.toFixed(0) + ' cm</text>';
    }
    [[CFG.caution, '--lm-warning-dark', 'Caution ' + f1(CFG.caution) + ' cm'], [CFG.high, '--lm-error', 'High water ' + f1(CFG.high) + ' cm']].forEach(function (t) {
      svg += '<line x1="' + CH.L + '" x2="' + CH.R + '" y1="' + g.y(t[0]) + '" y2="' + g.y(t[0]) + '" style="stroke:rgb(var(' + t[1] + '))" stroke-dasharray="6 4"/><text x="' + (CH.R - 4) + '" y="' + (g.y(t[0]) - 5) + '" text-anchor="end" style="fill:rgb(var(' + t[1] + '));font:700 10px JetBrains Mono,monospace">' + t[2] + '</text>';
    });
    var narrow = CH.W < 600;
    for (i = 0; i <= 4; i += (narrow ? 2 : 1)) {
      var tt = g.ser.start + (g.ser.end - g.ser.start) * i / 4;
      svg += '<text x="' + g.x(tt) + '" y="' + (CH.B + 20) + '" text-anchor="' + (i === 0 ? 'start' : i === 4 ? 'end' : 'middle') + '" style="fill:rgb(var(--lm-outline));font:10px JetBrains Mono,monospace">' + D.hm(tt) + (i === 4 && !narrow ? ' UTC (ref.)' : i === 4 ? ' UTC' : '') + '</text>';
    }
    if (v.kind === 'stale' && v.observedAt) {
      svg += '<rect x="' + g.x(v.observedAt) + '" y="' + CH.T + '" width="' + (CH.R - g.x(v.observedAt)) + '" height="' + (CH.B - CH.T) + '" style="fill:rgb(var(--lm-warning-dark))" opacity=".08"/><text x="' + (CH.R - 6) + '" y="' + (CH.T + 16) + '" text-anchor="end" style="fill:rgb(var(--lm-warning-dark));font:700 11px JetBrains Mono,monospace">No data for ' + D.ageText(v.ageSec) + '</text>';
    }
    if (valid.length) {
      var d = valid.map(function (p, k) { return (k ? 'L' : 'M') + g.x(p.t).toFixed(1) + ' ' + g.y(p.depth).toFixed(1); }).join(' ');
      svg += '<defs><linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" style="stop-color:rgb(var(--lm-primary));stop-opacity:.35"/><stop offset="100%" style="stop-color:rgb(var(--lm-primary));stop-opacity:0"/></linearGradient></defs>'
        + '<path d="' + d + ' L' + g.x(valid[valid.length - 1].t).toFixed(1) + ' ' + CH.B + ' L' + g.x(valid[0].t).toFixed(1) + ' ' + CH.B + ' Z" fill="url(#areaGrad)"/>'
        + '<path d="' + d + '" fill="none" style="stroke:rgb(var(--lm-primary))" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      valid.forEach(function (p, k) { if (k % 3 === 0 || k === valid.length - 1) svg += '<circle cx="' + g.x(p.t).toFixed(1) + '" cy="' + g.y(p.depth).toFixed(1) + '" r="' + (k === valid.length - 1 ? 5 : 3.5) + '" style="fill:rgb(var(' + (k === valid.length - 1 ? '--lm-accent-teal-bright' : '--lm-primary') + '));stroke:rgb(var(--lm-surface-dark))" stroke-width="2"/>'; });
    }
    pts.forEach(function (p) { if (p.invalid) svg += '<path d="M' + (g.x(p.t) - 4) + ' ' + (CH.B - 4) + 'l8 8m0-8l-8 8" style="stroke:rgb(var(--lm-error))" stroke-width="2"/>'; });
    svg += '<g id="hoverMark"></g>';

    var empty = !pts.length, emptyMsg = v.status === 'apierr' ? ['cloud_off', 'History unavailable', 'The backend did not respond (simulated 504). No history can be shown.'] : D.hasHistory(v) ? ['schedule', 'No observations in this window', 'The last observation was ' + D.ageText(v.ageSec) + ' before the reference time. Choose a longer range.'] : ['hourglass_empty', 'No history yet', 'This station has not reported any observation.'];
    $('history').innerHTML = '<div class="' + CARD + '"><div class="mb-4 flex flex-col justify-between gap-2 border-b border-outline-variant/40 pb-3 md:flex-row md:items-center"><div><h2 class="flex items-center gap-2 text-headline-md">' + ico('show_chart', 'text-[20px] text-primary') + 'Water-level history</h2><p class="mt-0.5 text-body-sm text-on-surface-variant">Generated demo series with the demo caution and high-water thresholds. Use the left and right arrow keys, or hover, to inspect a point.</p></div>'
      + '<div class="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-high/80 p-1 text-xs" role="group" aria-label="Time range">' + D.RANGES.map(function (r) { var on = r.key === S.range; return '<button type="button" data-range="' + r.key + '" aria-pressed="' + on + '" class="rounded px-2.5 py-1 transition-all ' + (on ? 'bg-primary-container font-semibold text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface') + '">' + r.label + '</button>'; }).join('') + '</div></div>'
      + (empty ? '<div class="grid h-60 place-items-center rounded-lg border border-dashed border-outline-variant text-center text-body-sm text-on-surface-variant"><div>' + ico(emptyMsg[0], 'mb-1 text-[28px] text-outline') + '<b class="block text-on-surface">' + emptyMsg[1] + '</b>' + emptyMsg[2] + '</div></div>'
        : '<div id="chartWrap" class="relative h-72 w-full select-none" tabindex="0" role="img" aria-label="Water depth over time. ' + valid.length + ' points. Use left and right arrow keys to inspect values."><svg id="chartSvg" class="h-full w-full overflow-visible" viewBox="0 0 ' + CH.W + ' 260">' + svg + '</svg><div id="chartHud" aria-live="polite" class="pointer-events-none absolute right-4 top-2 rounded-lg border border-primary/40 bg-surface-container-dark/95 p-2.5 text-xs shadow-xl"></div></div>')
      + '</div>';
    if (!empty) setHover(valid.length - 1, true);
  }
  function setHover(idx, silent) {
    var v = cur(), g = chartGeom(v), valid = g.pts.filter(function (p) { return !p.invalid; });
    if (!valid.length) return;
    idx = Math.max(0, Math.min(valid.length - 1, idx)); S.hover = idx;
    var p = valid[idx], m = $('hoverMark'), hud = $('chartHud');
    if (m) m.innerHTML = '<line x1="' + g.x(p.t) + '" x2="' + g.x(p.t) + '" y1="' + CH.T + '" y2="' + CH.B + '" style="stroke:rgb(var(--lm-primary))" stroke-dasharray="3 3"/><circle cx="' + g.x(p.t) + '" cy="' + g.y(p.depth) + '" r="6" style="fill:rgb(var(--lm-accent-teal-bright));stroke:rgb(var(--lm-surface-dark))" stroke-width="3"/>';
    if (hud) {
      var th = D.thresholdOf(p.depth), tone = th === 'high' ? 'bad' : th === 'caution' ? 'warn' : 'ok';
      hud.innerHTML = '<div class="mb-1 font-mono text-[10px] text-outline">' + D.hms(p.t) + ' UTC' + (idx === valid.length - 1 ? ' • latest valid' : '') + '</div><div class="flex items-center gap-3"><span class="font-mono text-sm font-bold">Depth: <span class="' + (th === 'high' ? 'text-error' : th === 'caution' ? 'text-warning-dark' : 'text-secondary') + '">' + f1(p.depth) + ' cm</span></span><span class="font-mono text-[11px] text-accent-teal-bright">Dist: ' + f1(p.distance) + ' cm</span></div><div class="mt-1 flex items-center gap-1 text-[10px] text-on-surface-variant"><span class="h-1.5 w-1.5 rounded-full ' + (tone === 'bad' ? 'bg-error' : tone === 'warn' ? 'bg-warning-dark' : 'bg-secondary') + '" aria-hidden="true"></span>' + (th === 'high' ? 'Above high-water demo threshold' : th === 'caution' ? 'Above caution demo threshold' : 'Within baseline') + '</div>';
    }
  }

  /* ---------- calibration + measurements ---------- */
  function calibrationPayload() {
    return { station: S.station, note: 'Demo configuration. Nothing is pushed to a device.', reference_height_cm: CFG.datum, caution_threshold_cm: CFG.caution, high_water_threshold_cm: CFG.high, valid_distance_cm: [CFG.distMin, CFG.distMax], stale_timeout_s: CFG.staleSec };
  }
  function renderCalibration() {
    var p = function (l, val, cls) { return '<div class="flex items-center justify-between gap-2 rounded border border-outline-variant/50 bg-surface-container-high/60 p-2"><dt class="text-on-surface-variant">' + l + '</dt><dd class="font-bold ' + (cls || '') + '">' + val + '</dd></div>'; };
    $('calibration').innerHTML = '<div class="' + CARD + ' h-full space-y-4"><div class="flex items-center justify-between gap-2 border-b border-outline-variant/40 pb-1"><h2 class="flex items-center gap-2 text-headline-md">' + ico('tune', 'text-[18px] text-accent-lavender') + 'Calibration &amp; thresholds</h2><span class="rounded border border-outline-variant bg-surface-container-highest-dark px-2 py-0.5 font-mono text-[10px] text-primary">DEMO • READ-ONLY</span></div>'
      + '<p class="text-body-sm text-on-surface-variant">Parameters the station would hold for local evaluation before transmission. These are demonstration values, not surveyed settings.</p>'
      + '<dl class="space-y-2.5 font-mono text-xs">' + p('Reference height (H_ref):', f1(CFG.datum) + ' cm', 'text-accent-lavender') + p('Caution threshold:', f1(CFG.caution) + ' cm (advisory)', 'text-warning-dark') + p('High-water threshold:', f1(CFG.high) + ' cm (critical)', 'text-error') + p('Valid distance range:', f1(CFG.distMin) + ' to ' + f1(CFG.distMax) + ' cm', '') + p('Stale-data timeout:', CFG.staleSec + ' seconds', 'text-secondary') + '</dl>'
      + '<button type="button" data-act="calib" class="' + BTN + ' w-full">' + ico('system_update_alt', 'text-[15px]') + 'Preview calibration payload</button></div>';
  }
  function renderMeasurements(v) {
    var all = rowsFor(v), shown = all.slice(0, S.rows);
    var body = shown.length ? shown.map(function (r, k) {
      var t = THR[r.state] || THR.normal, bad = r.state === 'fault';
      return '<tr class="hover:bg-surface-container-high/40"><td class="px-3 py-2 font-semibold">' + (k === 0 ? '<span class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent-teal-bright align-middle" aria-hidden="true"></span>' : '') + D.hms(r.t) + '</td>'
        + '<td class="px-3 py-2 font-bold ' + (r.state === 'high' ? 'text-error' : r.state === 'caution' ? 'text-warning-dark' : bad ? 'text-error' : 'text-secondary') + '">' + (r.depth == null ? 'Invalid' : f1(r.depth) + ' cm') + '</td>'
        + '<td class="px-3 py-2 text-on-surface-variant">' + f1(r.distance) + ' cm</td><td class="px-3 py-2 text-secondary">' + (r.snr == null ? '—' : f1(r.snr) + '% (' + r.rssi + ' dBm)') + '</td>'
        + '<td class="px-3 py-2 ' + (bad ? 'text-error' : 'text-accent-teal-bright') + '">' + esc(r.flag) + '</td><td class="px-3 py-2">' + badge(t[0], t[1]) + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="px-3 py-10 text-center font-sans text-body-sm text-on-surface-variant"><b class="block text-on-surface">' + (v.status === 'apierr' ? 'Measurements unavailable' : 'No observations yet') + '</b>' + (v.status === 'apierr' ? 'The backend did not respond (simulated 504).' : 'This station has not reported a reading.') + '</td></tr>';
    var th = function (t) { return '<th scope="col" class="px-3 py-2.5 font-semibold">' + t + '</th>'; };
    $('measurements').innerHTML = '<div class="' + CARD + ' flex h-full flex-col justify-between"><div><div class="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/40 pb-1"><h2 class="flex items-center gap-2 text-headline-md">' + ico('table_chart', 'text-[20px] text-secondary') + 'Recent measurements</h2>'
      + '<div class="flex items-center gap-2 font-mono text-xs text-outline"><span>BUFFER: ' + CFG.bufferRecords + ' RECORDS</span><span aria-hidden="true">•</span><button type="button" data-act="csv" class="flex items-center gap-0.5 text-accent-teal-bright hover:underline"' + (all.length ? '' : ' disabled') + '>' + ico('download', 'text-[14px]') + 'CSV</button></div></div>'
      + '<div class="custom-scrollbar overflow-x-auto"><table class="w-full border-collapse text-left font-mono text-xs"><thead><tr class="border-b border-outline-variant/80 bg-surface-container-lowest/50 text-[10px] uppercase tracking-wider text-outline">' + th('Observation (UTC)') + th('Water depth') + th('Sensor distance') + th('Signal') + th('Quality flag') + th('Threshold state') + '</tr></thead><tbody class="divide-y divide-outline-variant/30 text-[11px]">' + body + '</tbody></table></div></div>'
      + '<div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-2 font-mono text-xs text-outline"><span role="status">Showing ' + shown.length + ' of ' + all.length + ' generated fixture records</span><span class="flex items-center gap-3">'
      + (all.length > S.rows ? '<button type="button" data-act="more" class="text-primary hover:underline">Show 10 more</button>' : '') + '<button type="button" data-act="rawlog" class="flex items-center gap-1 text-primary hover:underline"' + (all.length ? '' : ' disabled') + '>Inspect raw log stream' + ico('open_in_new', 'text-[13px]') + '</button></span></div></div>';
  }

  /* ---------- side drawer ---------- */
  var TABS = [['feed', 'Telemetry feed', 'radar'], ['hazards', 'Hazards layer', 'layers'], ['ecmwf', 'ECMWF data', 'cloud'], ['noaa', 'NOAA forecasts', 'satellite_alt'], ['export', 'Export hub', 'download']];
  function rawLines(v, n) {
    return rowsFor(v).slice(0, n).map(function (r) {
      return D.hms(r.t) + ' [SUB] /node/' + v.station.id + '/telemetry {"raw_mm":' + Math.round(r.distance * 10) + ',"v_bat":3820}' + '\n' + D.hms(r.t) + ' QA: ' + (r.state === 'fault' ? 'FAIL echo_timeout' : 'ok') + '\n' + D.hms(r.t) + ' >> depth_cm: ' + (r.depth == null ? 'invalid' : f1(r.depth));
    }).join('\n');
  }
  function notConnected(title, text, link) {
    return '<div class="rounded-lg border border-dashed border-outline-variant p-3 text-xs"><p class="mb-1 flex items-center gap-1.5 font-bold">' + ico('cloud_off', 'text-[16px] text-outline') + title + '</p><p class="text-on-surface-variant">' + text + '</p>' + (link ? '<a class="mt-2 inline-block font-semibold text-primary hover:underline" href="' + link[1] + '">' + link[0] + '</a>' : '') + '</div>';
  }
  function renderDrawer(v) {
    var panel;
    if (S.tab === 'feed') {
      var lines = rawLines(v, 2);
      panel = '<div class="space-y-2 rounded-lg border border-outline-variant/50 bg-surface-container-high/40 p-3"><div class="flex items-center justify-between text-xs"><span class="font-mono font-bold">Echo stream (fixture)</span><span class="h-2 w-2 rounded-full ' + ST[v.status].dot + '" aria-hidden="true"></span></div>'
        + (lines ? '<pre class="custom-scrollbar max-h-40 overflow-auto rounded bg-surface-dark-dim p-2 font-mono text-[10px] leading-relaxed text-accent-lavender/90">' + esc(lines) + '</pre>' : '<p class="rounded bg-surface-dark-dim p-2 font-mono text-[10px] text-outline">No packets. ' + (v.status === 'apierr' ? 'Backend unreachable (simulated).' : 'Station has not reported.') + '</p>') + '</div>';
    } else if (S.tab === 'hazards') {
      panel = '<ul class="space-y-2 text-xs">' + [['Fluvial flood', 'Station fixture ' + v.station.id, 'ok'], ['Surface water', 'Not connected', 'mute'], ['Urban heat', 'Not connected', 'mute'], ['Active fire', 'Not connected', 'mute']].map(function (h) { return '<li class="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-high/40 p-2.5"><span class="font-semibold">' + h[0] + '</span>' + badge(h[2], esc(h[1])) + '</li>'; }).join('') + '</ul><p class="mt-2 text-[11px] text-outline">Hazard layers on the map live in the Global Overview.</p><a class="mt-1 inline-block text-xs font-semibold text-primary hover:underline" href="' + R.global.overview + '">Open Global Overview</a>';
    } else if (S.tab === 'ecmwf') {
      panel = notConnected('ECMWF forecast data: not connected', 'No credentials or API are configured, so no forecast is shown. Nothing on this tab is estimated.', ['Open System Health', R.global.health]);
    } else if (S.tab === 'noaa') {
      panel = notConnected('NOAA forecasts: not connected', 'No feed is configured. For stations in the UK, the national meteorological service is the relevant authority.', ['Open System Health', R.global.health]);
    } else {
      panel = '<div class="space-y-2"><button type="button" data-act="briefing" class="' + BTN + ' w-full justify-start">' + ico('description', 'text-[16px]') + 'Station briefing (.txt)</button><button type="button" data-act="csv" class="' + BTN + ' w-full justify-start"' + (rowsFor(v).length ? '' : ' disabled') + '>' + ico('table_chart', 'text-[16px]') + 'Measurements (.csv)</button><button type="button" data-act="snapshot" class="' + BTN + ' w-full justify-start">' + ico('data_object', 'text-[16px]') + 'Station snapshot (.json)</button><button type="button" data-act="calibjson" class="' + BTN + ' w-full justify-start">' + ico('tune', 'text-[16px]') + 'Calibration payload (.json)</button></div><p class="mt-2 text-[11px] text-outline">Exports contain demonstration data only.</p>';
    }
    $('drawer').innerHTML = '<div class="flex h-full flex-col justify-between gap-4"><div><div class="flex items-center gap-2 border-b border-outline-variant/40 pb-2"><span class="grid h-8 w-8 place-items-center rounded-full bg-primary-container text-on-primary-container">' + ico('satellite_alt', 'text-[18px]') + '</span><div><h2 class="text-sm font-bold">Live analytics feed</h2><p class="text-label-sm uppercase tracking-wider text-outline">Demo data</p></div></div>'
      + '<div class="mt-3 flex flex-wrap gap-1.5 2xl:flex-col 2xl:flex-nowrap" role="tablist" aria-label="Analytics feed sections">' + TABS.map(function (t) { var on = t[0] === S.tab; return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + on + '" class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-label-sm ' + (on ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface') + '">' + ico(t[2], 'text-[18px]') + '<span>' + t[1] + '</span></button>'; }).join('') + '</div>'
      + '<div class="mt-4" role="tabpanel">' + panel + '</div></div>'
      + '<div class="space-y-2 border-t border-outline-variant/40 pt-3"><button type="button" data-act="briefing" class="' + BTN_P + ' w-full">' + ico('download', 'text-[16px]') + 'Export briefing</button>'
      + '<a class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-label-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface" href="' + R.global.health + '">' + ico('health_and_safety', 'text-[18px]') + 'System Health</a>'
      + '<a class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-label-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface" href="' + R.global.settings + '">' + ico('settings', 'text-[18px]') + 'Settings</a></div></div>';
  }

  /* ---------- dialogs and exports ---------- */
  function openDialog(title, bodyHtml, actionsHtml) {
    var d = $('dlg');
    d.innerHTML = '<div class="space-y-3 p-5"><div class="flex items-center justify-between"><h2 class="text-headline-md">' + esc(title) + '</h2><button type="button" data-act="closedlg" class="rounded p-1 text-outline hover:bg-surface-container" aria-label="Close">' + ico('close', 'text-[20px]') + '</button></div>' + bodyHtml + '<div class="flex flex-wrap justify-end gap-2 pt-1">' + (actionsHtml || '') + '<button type="button" data-act="closedlg" class="' + BTN + '">Close</button></div></div>';
    if (d.showModal && !d.open) d.showModal();
  }
  function briefing(v) {
    var c = conditions(v);
    return ['SignalBridge Live Monitoring briefing', 'DEMONSTRATION FIXTURE. Not measured by a device. Not an official warning.', '',
      'Station: ' + v.station.id + ' - ' + v.station.name, 'Location: ' + v.station.loc, 'Scenario: ' + v.scenario.btn, 'Status: ' + ST[v.status].label,
      'Water depth: ' + (v.depth == null || v.status === 'fault' ? 'not available' : f1(v.depth) + ' cm'), 'Sensor distance: ' + (v.distance == null ? 'not available' : f1(v.distance) + ' cm'),
      ageLine(v), 'Thresholds (demo): caution > ' + f1(CFG.caution) + ' cm, high water > ' + f1(CFG.high) + ' cm; stale after ' + CFG.staleSec + ' s',
      '', 'Conditions:'].concat(c.length ? c.map(function (x) { return '- ' + x[1] + ': ' + x[2]; }) : ['- None']).concat(['', 'Follow your national meteorological and emergency authorities for official guidance.']).join('\n');
  }
  function measurementsCsv(v) {
    return csvOf([['station_id', 'observation_utc', 'water_depth_cm', 'sensor_distance_cm', 'snr_pct', 'rssi_dbm', 'quality_flag', 'threshold_state', 'fixture']].concat(rowsFor(v).map(function (r) {
      return [v.station.id, new Date(r.t).toISOString(), r.depth == null ? '' : f1(r.depth), f1(r.distance), r.snr == null ? '' : f1(r.snr), r.rssi == null ? '' : r.rssi, r.flag, r.state, 'true'];
    })));
  }
  function snapshot(v) {
    return JSON.stringify({ label: 'Demonstration fixture', reference_time: new Date(CFG.asOf).toISOString(), station: v.station, scenario: v.scenario.key, status: v.status, water_depth_cm: v.depth, sensor_distance_cm: v.distance, observed_at: v.observedAt ? new Date(v.observedAt).toISOString() : null, thresholds: calibrationPayload() }, null, 2);
  }

  /* ---------- orchestration ---------- */
  function renderAll() {
    var v = cur();
    renderScenarioBar(); renderSync(v); renderNotif(v); renderIdentity(v); renderHero(v); renderHistory(v); renderCalibration(); renderMeasurements(v); renderDrawer(v);
  }
  function selectStation(id, fromHash) {
    var st = D.stationById(id); if (!st) return false;
    S.station = id; S.scenario = st.def; S.rows = 10; S.pollMsg = '';
    $('stationSelect').value = id;
    if (!fromHash && window.history && history.replaceState) history.replaceState(null, '', '#' + id);
    renderAll(); return true;
  }
  function setMenu(name) {
    S.menu = S.menu === name ? null : name;
    [['notif', 'notifBtn', 'notifPanel'], ['account', 'accountBtn', 'accountPanel'], ['mobile', 'menuBtn', 'mobileNav']].forEach(function (m) {
      var open = S.menu === m[0]; $(m[2]).hidden = !open; $(m[1]).setAttribute('aria-expanded', String(open));
    });
  }
  function closeMenus(focusBack) {
    var was = S.menu; S.menu = was; if (was) { setMenu(was); if (focusBack) { var id = { notif: 'notifBtn', account: 'accountBtn', mobile: 'menuBtn' }[was]; if (id) $(id).focus(); } }
  }

  function init() {
    // static icons in the shell
    Array.prototype.forEach.call(document.querySelectorAll('i[data-icon]'), function (el) {
      var span = document.createElement('span'); span.innerHTML = ico(el.getAttribute('data-icon'), el.className);
      var svg = span.firstChild; if (el.id) svg.id = el.id;
      el.parentNode.replaceChild(svg, el);
    });
    renderNav(); renderStationSelect(); renderAccount();
    var h = decodeURIComponent((location.hash || '').slice(1)); if (h && D.stationById(h)) { S.station = h; S.scenario = D.stationById(h).def; }
    $('stationSelect').value = S.station;
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    renderAll();

    $('stationSelect').addEventListener('change', function (e) { selectStation(e.target.value); });
    window.addEventListener('hashchange', function () { var id = decodeURIComponent(location.hash.slice(1)); if (D.stationById(id) && id !== S.station) selectStation(id, true); });
    $('stationSearch').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('stationQ').value.trim().toLowerCase(), hit = null;
      if (q) D.STATIONS.forEach(function (s) { if (!hit && (s.id.toLowerCase().indexOf(q) > -1 || s.name.toLowerCase().indexOf(q) > -1 || s.loc.toLowerCase().indexOf(q) > -1)) hit = s; });
      if (hit) { selectStation(hit.id); $('searchMsg').textContent = ''; $('stationQ').value = ''; }
      else $('searchMsg').textContent = q ? 'No station matches “' + $('stationQ').value.trim() + '”.' : 'Type a station ID, name or location.';
    });
    $('stationQ').addEventListener('input', function () { $('searchMsg').textContent = ''; });
    $('stationQ').addEventListener('change', function () { var s = D.stationById($('stationQ').value.trim()); if (s) { selectStation(s.id); $('stationQ').value = ''; } });
    $('pollBtn').addEventListener('click', function () {
      if (S.polling) return;
      S.polling = true; S.pollMsg = 'Querying…'; renderSync(cur());
      setTimeout(function () { S.polling = false; S.pollMsg = 'Simulated poll at ' + D.hms(Date.now()) + ' UTC, no device contacted'; renderSync(cur()); }, 700);
    });

    document.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-theme-set]'))) { setTheme(el.getAttribute('data-theme-set')); return; }
      if ((el = t.closest('[data-menu]'))) { setMenu(el.getAttribute('data-menu')); return; }
      if (S.menu && !t.closest('[data-menu-root]') && !t.closest('#mobileNav')) setMenu(S.menu);
      if ((el = t.closest('[data-scn]'))) { S.scenario = el.getAttribute('data-scn'); S.rows = 10; S.pollMsg = ''; renderAll(); var b = document.querySelector('[data-scn="' + S.scenario + '"]'); if (b) b.focus(); return; }
      if ((el = t.closest('[data-range]'))) { S.range = el.getAttribute('data-range'); renderHistory(cur()); var rb = document.querySelector('[data-range="' + S.range + '"]'); if (rb) rb.focus(); return; }
      if ((el = t.closest('[data-tab]'))) { S.tab = el.getAttribute('data-tab'); renderDrawer(cur()); var tb = document.querySelector('[data-tab="' + S.tab + '"]'); if (tb) tb.focus(); return; }
      if ((el = t.closest('[data-act]'))) {
        var v = cur(), a = el.getAttribute('data-act');
        if (a === 'closedlg') $('dlg').close();
        else if (a === 'more') { S.rows = Math.min(CFG.bufferRecords, S.rows + 10); renderMeasurements(v); }
        else if (a === 'csv') dlFile('signalbridge-' + v.station.id + '-measurements-demo.csv', measurementsCsv(v), 'text/csv;charset=utf-8');
        else if (a === 'briefing') dlFile('signalbridge-' + v.station.id + '-briefing-demo.txt', briefing(v), 'text/plain;charset=utf-8');
        else if (a === 'snapshot') dlFile('signalbridge-' + v.station.id + '-snapshot-demo.json', snapshot(v), 'application/json');
        else if (a === 'calibjson') dlFile('signalbridge-' + v.station.id + '-calibration-demo.json', JSON.stringify(calibrationPayload(), null, 2), 'application/json');
        else if (a === 'calib') openDialog('Calibration payload preview', '<p class="text-body-sm text-on-surface-variant"><b class="text-warning-dark">Nothing is pushed.</b> No device connection exists in this prototype. This is the payload that would be sent.</p><pre class="custom-scrollbar max-h-72 overflow-auto rounded-lg bg-surface-dark-dim p-3 font-mono text-xs text-accent-lavender">' + esc(JSON.stringify(calibrationPayload(), null, 2)) + '</pre>', '<button type="button" data-act="calibjson" class="' + BTN_P + '">Download JSON</button>');
        else if (a === 'rawlog') openDialog('Raw log stream (fixture)', '<p class="text-body-sm text-on-surface-variant">Generated lines for ' + esc(v.station.id) + '. They were not received from a device.</p><pre class="custom-scrollbar max-h-80 overflow-auto rounded-lg bg-surface-dark-dim p-3 font-mono text-[11px] leading-relaxed text-accent-lavender">' + esc(rawLines(v, 15)) + '</pre>', '<button type="button" data-act="logdl" class="' + BTN_P + '">Download .log</button>');
        else if (a === 'logdl') dlFile('signalbridge-' + v.station.id + '-raw-demo.log', rawLines(v, CFG.bufferRecords), 'text/plain;charset=utf-8');
      }
    });
    var rz = null;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { var w = $('history').getBoundingClientRect().width; if (Math.abs(w - 34 - CH.W) > 8) renderHistory(cur()); }, 150); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && S.menu) closeMenus(true);
      var w = e.target && e.target.id === 'chartWrap';
      if (w && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); setHover((S.hover == null ? 0 : S.hover) + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    document.addEventListener('pointermove', function (e) {
      var wrap = $('chartWrap'); if (!wrap || !wrap.contains(e.target)) return;
      var v = cur(), g = chartGeom(v), valid = g.pts.filter(function (p) { return !p.invalid; }), r = wrap.getBoundingClientRect();
      if (!valid.length || !r.width) return;
      var vx = (e.clientX - r.left) / r.width * CH.W, best = 0, bd = 1e9;
      valid.forEach(function (p, k) { var dd = Math.abs(g.x(p.t) - vx); if (dd < bd) { bd = dd; best = k; } });
      setHover(best);
    });
  }
  init();
})();
