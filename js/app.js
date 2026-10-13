/* App shell, routing, pages and charts. */
(function () {
  const MI = window.MI;
  const I = MI.i18n;
  const t = I.t;
  const A = MI.attr;
  const cal = MI.cal;
  let TODAY = cal.ND - 1;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem("mi:" + k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("mi:" + k, JSON.stringify(v));
      } catch (e) {}
    },
  };

  const state = {
    ws: store.get("ws", "kopi"),
    lang: store.get("lang", "id"),
    range: store.get("range", 90),
    route: "overview",
    eventId: null,
    kolSort: { key: "iroasNet", dir: -1 },
    kolPlat: "all",
    kolTier: "all",
    openKol: null,
    calYM: null,
    imp: { sales: null, events: null, name: "", kind: "cafe", remember: false, error: "", busy: false, done: null },
    logType: "all",
    showForm: false,
    toast: "",
    settings: {},
  };
  if (MI.importer) MI.importer.loadSaved();
  if (!MI.listWorkspaces().some((d) => d.id === state.ws)) state.ws = "kopi";
  if (![30, 90, 180].includes(state.range)) state.range = 90;
  I.lang = state.lang === "en" ? "en" : "id";

  let ws, M;
  function model() {
    if (!MI.listWorkspaces().some((d) => d.id === state.ws)) state.ws = "kopi";
    ws = MI.getWorkspace(state.ws);
    cal.set(ws.start, ws.nd);
    TODAY = cal.ND - 1;
    if (state.calYM == null || state.calYM > cal.ym(TODAY + 60) || state.calYM < cal.ym(0)) state.calYM = cal.ym(TODAY);
    if (!state.settings[ws.id]) state.settings[ws.id] = A.defaults(ws);
    M = A.build(ws, state.settings[ws.id]);
    MI.model = M;
  }

  // ---------- icons ----------
  const svg = (p, sw = 1.9) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICON = {
    overview: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    kol: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18.5 14.8c1.6.8 2.6 2.6 3 5.2"/>'),
    event: svg('<path d="M3 20h18"/><path d="M5 16l4-5 3 3 6-8"/><path d="M15 6h3v3"/>'),
    channels: svg('<path d="M12 3v9l7 4"/><circle cx="12" cy="12" r="9"/>'),
    log: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', 1.6),
    import: svg('<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17"/>'),
    explain: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.3-2.5 4"/><path d="M12 17.3h.01"/>', 2),
    file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.2),
    chev: svg('<path d="M7 10l5 5 5-5"/>'),
    left: svg('<path d="M15 6l-6 6 6 6"/>'),
    right: svg('<path d="M9 6l6 6-6 6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 2.2),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 2),
    warn: svg('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17h.01"/>', 2),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>', 2),
    t_kol: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>'),
    t_promo: svg('<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
    t_ads: svg('<path d="M3 10v4h4l6 5V5L7 10z"/><path d="M17 8.5a5 5 0 0 1 0 7"/>'),
    t_offline: svg('<path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-6h6v6"/>'),
  };

  // ---------- helpers ----------
  const range = () => [Math.max(0, TODAY - state.range + 1), TODAY];
  const kolOf = (e) => ws.kols.find((k) => k.id === e.kolId);
  const evName = (e) => (e.type === "kol" ? kolOf(e).handle : e.name[I.lang] || e.name.id || e.name);
  const regionsLabel = (regs) => (regs.length === ws.R ? t("everywhere") : regs.map((r) => ws.def.regions[r].name).join(", "));
  const statusOf = (e) => (e.start > TODAY ? "planned" : e._win[1] >= TODAY ? "live" : "done");
  const unitKey = (e) => (e._cluster ? e._cluster.id : e.id);
  const unitEvs = (e) => (e._cluster ? e._cluster.members : [e]);
  const typeChip = (e) => `<span class="chip t-${e.type}">${t("type_" + e.type)}</span>`;
  const confBadge = (c) => (c ? `<span class="badge c-${c}" title="${esc(t("conf_help"))}">${t("conf_" + c)}</span>` : "");
  const statusBadge = (s) => `<span class="badge b-${s}">${t("st_" + s)}</span>`;
  const sharedBadge = () => `<span class="badge b-shared">${t("shared")}</span>`;
  const delta = (cur, prev) => {
    if (prev == null || !isFinite(prev) || prev === 0) return "";
    const d = (cur - prev) / Math.abs(prev);
    const cls = Math.abs(d) < 0.005 ? "flat" : d > 0 ? "up" : "down";
    return `<span class="delta ${cls}">${d > 0 ? "▲" : d < 0 ? "▼" : ""} ${I.pct(Math.abs(d))}</span>`;
  };
  const sumGross = (a, b) => {
    let s = 0;
    if (a < 0) return null;
    for (let d = a; d <= b; d++) for (let r = 0; r < ws.R; r++) s += M.regS[r][d];
    return s;
  };

  // event "units": solo events and overlap clusters, each counted once
  function units(a, b) {
    const seen = new Set();
    const out = [];
    M.live.forEach((e) => {
      const key = unitKey(e);
      if (seen.has(key)) return;
      seen.add(key);
      const im = M.impact[key];
      if (im.a >= a && im.a <= b) out.push({ key, evs: unitEvs(e), im });
    });
    return out;
  }

  // ---------- charts ----------
  let charts = [];
  function destroyCharts() {
    charts.forEach((c) => c.destroy());
    charts = [];
  }
  function mkChart(id, cfg) {
    const el = document.getElementById(id);
    if (!el || !window.Chart) return null;
    const c = new Chart(el, cfg);
    charts.push(c);
    return c;
  }
  function chartDefaults() {
    if (!window.Chart) return;
    Chart.defaults.font.family = css("--font");
    Chart.defaults.font.size = 11.5;
    Chart.defaults.color = css("--muted");
    Chart.defaults.borderColor = css("--grid");
    Chart.defaults.animation = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 350 };
    Chart.defaults.plugins.legend.display = false;
    Object.assign(Chart.defaults.plugins.tooltip, {
      backgroundColor: css("--card"),
      titleColor: css("--ink"),
      bodyColor: css("--ink-2"),
      footerColor: css("--ink-2"),
      borderColor: css("--line-2"),
      borderWidth: 1,
      padding: 10,
      cornerRadius: 10,
      boxPadding: 4,
      usePointStyle: true,
    });
  }
  const alpha = (hex, a) => {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const typeColor = (type) => css("--" + type);

  // draws window bands, a horizontal reference line and clickable event dots
  const overlayPlugin = {
    id: "overlay",
    beforeDatasetsDraw(chart, args, o) {
      const { ctx, chartArea: ca, scales } = chart;
      const x = scales.x;
      if (o.bands && x) {
        const half = x.getPixelForValue(1) - x.getPixelForValue(0);
        o.bands.forEach((b) => {
          const x0 = Math.max(ca.left, x.getPixelForValue(b.from) - half / 2);
          const x1 = Math.min(ca.right, x.getPixelForValue(b.to) + half / 2);
          if (x1 <= x0) return;
          ctx.save();
          ctx.fillStyle = b.color;
          ctx.fillRect(x0, ca.top, x1 - x0, ca.bottom - ca.top);
          ctx.restore();
        });
      }
      if (o.hline != null && scales.y) {
        const y = scales.y.getPixelForValue(o.hline.value);
        if (y >= ca.top && y <= ca.bottom) {
          ctx.save();
          ctx.strokeStyle = o.hline.color;
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ca.left, y);
          ctx.lineTo(ca.right, y);
          ctx.stroke();
          if (o.hline.label) {
            ctx.setLineDash([]);
            ctx.fillStyle = o.hline.color;
            ctx.font = `600 11px ${css("--font")}`;
            ctx.textAlign = "right";
            ctx.fillText(o.hline.label, ca.right - 4, y - 6);
          }
          ctx.restore();
        }
      }
    },
    afterDatasetsDraw(chart, args, o) {
      if (!o.markers) return;
      const { ctx, chartArea: ca, scales } = chart;
      const pos = [];
      const stack = {};
      o.markers.forEach((m) => {
        const px = scales.x.getPixelForValue(m.x);
        if (px < ca.left - 1 || px > ca.right + 1) return;
        const k = Math.round(px);
        stack[k] = (stack[k] || 0) + 1;
        const py = ca.top - 9 - (stack[k] - 1) * 11;
        ctx.save();
        ctx.strokeStyle = alpha(m.color, 0.35);
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(px, ca.top);
        ctx.lineTo(px, ca.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = m.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = css("--card");
        ctx.stroke();
        ctx.restore();
        pos.push({ x: px, y: py, m });
      });
      chart.$markers = pos;
    },
  };
  const markerHit = (chart, e) => (chart.$markers || []).find((p) => Math.hypot(p.x - e.x, p.y - e.y) < 10);

  // ---------- shell ----------
  const NAV = ["overview", "kol", "event", "channels", "log", "import", "explain", "settings"];
  const NAV_SPLIT = 5; // pages after this index sit in the lower group
  function renderShell() {
    document.documentElement.lang = I.lang;
    const def = ws.def;
    $("#wsMenu").innerHTML = `<button class="ws-btn" id="wsBtn" aria-haspopup="true" aria-expanded="false"><span class="ws-ico ${ws.imported ? "imp" : ""}">${esc(def.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase())}</span><span style="min-width:0;flex:1"><span class="ws-name" style="display:block">${esc(def.name)}</span><span class="ws-kind">${esc(def.kindLabel[I.lang])}</span></span>${ICON.chev.replace("<svg", '<svg style="width:16px;height:16px;color:var(--muted)"')}</button>`;
    $("#nav").innerHTML = NAV.map((n, i) => (i === NAV_SPLIT ? '<div class="nav-sep" role="separator"></div>' : "") + `<a href="#${n}" ${state.route === n ? 'aria-current="page"' : ""}>${ICON[n]}<span>${t("nav_" + n)}</span></a>`).join("");
    $("#footName").textContent = t("team");
    $("#footSub").textContent = def.name;
    $("#search").placeholder = t("search");
    $("#asof").textContent = (I.lang === "id" ? "Data s/d " : "Data to ") + I.date(TODAY, { dow: true }) + " " + cal.year(TODAY);
    $("#sampleBadge").textContent = ws.imported ? t("imported_data") : t("sample_data");
    $("#sampleBadge").classList.toggle("pill-imp", !!ws.imported);
    $("#rangeSeg").innerHTML = [30, 90, 180].map((r) => `<button data-range="${r}" aria-pressed="${state.range === r}">${t("range_" + r)}</button>`).join("");
    $("#langBtn").textContent = t("lang");
    $("#langBtn").setAttribute("aria-label", I.lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia");
    $("#fab").setAttribute("aria-label", t("chat_title"));
    $("#menuBtn").setAttribute("aria-label", t("menu"));
  }

  function wsPopover() {
    const pop = document.createElement("div");
    pop.className = "ws-pop";
    pop.innerHTML =
      `<div class="lbl">${t("workspaces")}</div>` +
      MI.listWorkspaces()
        .map((d) => `<button data-ws="${d.id}" aria-current="${d.id === state.ws}"><span class="ws-ico ${d.imported ? "imp" : ""}">${esc(d.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase())}</span><span style="min-width:0"><span class="ws-name" style="display:block">${esc(d.name)}</span><span class="ws-kind">${esc(d.kindLabel[I.lang])}</span></span></button>`)
        .join("") +
      `<a class="ws-add" href="#import">${ICON.import}<span>${t("imp_add_ws")}</span></a>`;
    return pop;
  }

  // ---------- router ----------
  function parseHash() {
    const h = (location.hash || "").replace("#", "");
    if (h.startsWith("event-")) {
      state.route = "event";
      state.eventId = h.slice(6);
    } else if (NAV.includes(h)) state.route = h;
    else state.route = store.get("route", "overview");
  }
  function go(route, id) {
    const h = route === "event" && id ? "event-" + id : route;
    if (location.hash.replace("#", "") === h) render();
    else location.hash = h;
  }

  function render() {
    destroyCharts();
    chartDefaults();
    renderShell();
    store.set("route", state.route);
    const v = $("#view");
    const fn = { overview: pageOverview, kol: pageKol, event: pageEvent, channels: pageChannels, log: pageLog, import: pageImport, explain: (el) => MI.explain.render(el, { I, t, esc, go, css, ICON, ws, M, TODAY }), settings: pageSettings }[state.route] || pageOverview;
    v.innerHTML = "";
    fn(v);
    $("#side").classList.remove("open");
    removeScrim();
  }

  // ---------- Overview ----------
  function featuredPost() {
    const posts = M.live.filter((e) => e.type === "kol" && e.start <= TODAY - 4).sort((x, y) => y.start - x.start);
    return posts[0] || M.live.filter((e) => e.type === "kol").slice(-1)[0];
  }

  function pageOverview(v) {
    const [a, b] = range();
    const pa = a - state.range,
      pb = a - 1;
    const f = featuredPost();
    let headline = "";
    if (f) {
      const im = M.impact[unitKey(f)];
      const k = kolOf(f);
      let s = t("headline", {
        who: `<b>${esc(k.handle)}</b>`,
        plat: f.platform,
        date: I.date(f.start, { dow: true }),
        lift: `<b>${I.rp(im.lift, { sign: true })}</b>`,
        pct: I.pct(im.liftPct, { sign: true }),
        where: esc(regionsLabel(im.regions)),
      });
      let small = im.conf === "low" ? t("headline_low") : im.todayLift != null ? t("headline_today", { d: im.todayDay, x: I.rp(im.todayLift) }) : t("headline_done");
      small += " · " + t("col_conf") + ": " + t("conf_" + im.conf) + (f._cluster ? " · " + t("shared") : "") + " · " + t("m_roas_net") + " " + I.x(im.iroasNet);
      headline = `<section class="card headline" aria-label="${t("latest_post")}"><div style="min-width:0;flex:1"><div class="eyebrow">${t("latest_post")}</div><p class="big">${s}</p><p class="small">${small}</p></div><a class="btn" href="#event-${f.id}">${t("see_detail")} ${ICON.right.replace("<svg", '<svg style="width:15px;height:15px"')}</a></section>`;
    }

    // KPIs
    const gCur = sumGross(a, b),
      gPrev = sumGross(pa, pb);
    const sp = A.spendDaily(M);
    const sumSpend = (x, y) => {
      if (x < 0) return null;
      let s = 0;
      for (let d = x; d <= y; d++) for (const k in sp) s += sp[k][d];
      return s;
    };
    const spCur = sumSpend(a, b),
      spPrev = sumSpend(pa, pb);
    const uCur = units(a, b),
      uPrev = pa >= 0 ? units(pa, pb) : null;
    const agg = (us) => (us ? us.reduce((o, u) => ((o.lift += u.im.lift), (o.net += u.im.netIncr), (o.cost += u.im.cost), o), { lift: 0, net: 0, cost: 0 }) : null);
    const eCur = agg(uCur),
      ePrev = agg(uPrev);
    const netRev = A.salesChannels(M, a, b).reduce((s, x) => s + x.net, 0);
    const kpis = [
      { l: t("kpi_rev"), v: I.rp(gCur), d: delta(gCur, gPrev), n: t("vs_prev") },
      { l: t("kpi_spend"), v: I.rp(spCur), d: delta(spCur, spPrev), n: t("mer_note") + ": " + I.x(netRev / spCur) },
      { l: t("kpi_incr"), v: I.rp(eCur.lift), d: ePrev ? delta(eCur.lift, ePrev.lift) : "", n: uCur.length + " event · " + t("vs_prev") },
      { l: t("kpi_roas"), v: I.x(eCur.net / eCur.cost), d: ePrev && ePrev.cost ? delta(eCur.net / eCur.cost, ePrev.net / ePrev.cost) : "", n: (I.lang === "id" ? "Tambahan bersih ÷ biaya event" : "Net extra ÷ event cost") },
    ];
    const kpiHtml = `<section class="card"><div class="card-h"><div><h2>${t("kpi_title")}</h2><div class="sub">${I.date(a)} – ${I.date(b)}</div></div></div><div class="kpis">${kpis.map((k) => `<div class="kpi"><div class="kpi-l">${k.l}</div><div class="kpi-v">${k.v}${k.d}</div><div class="kpi-n">${k.n}</div></div>`).join("")}</div></section>`;

    // top KOLs
    const lb = A.leaderboard(M, a, b).filter((x) => x.iroasNet != null && x.conf !== "low").sort((x, y) => y.iroasNet - x.iroasNet).slice(0, 5);
    const maxR = Math.max(1, ...lb.map((x) => x.iroasNet));
    const topHtml = lb.length
      ? `<div class="bars">${lb.map((x, i) => `<button class="bar-row" data-kol="${x.k.id}"><span class="name">${esc(x.k.handle)}<small>${x.k.platform}${x.k.followers ? " · " + x.k.tier : ""} · ${x.solo.length} ${t("solo")}</small></span><span class="bar-track"><span class="bar-fill ${i === 0 ? "hi" : ""}" style="width:${Math.max(3, (Math.max(0, x.iroasNet) / maxR) * 100)}%"></span></span><span class="bar-val">${I.x(x.iroasNet)}</span></button>`).join("")}</div>`
      : `<p class="empty">${t("none")}</p>`;

    // upcoming
    const weekStart = TODAY - ((cal.dow(TODAY) + 6) % 7);
    const weekDays = Array.from({ length: 7 }, (_, i) => weekStart + i);
    const allEv = ws.events;
    const liveNow = allEv.filter((e) => e.start <= TODAY && e._win[1] >= TODAY);
    const next = allEv.filter((e) => e.start > TODAY).sort((x, y) => x.start - y.start).slice(0, 4);
    const evItem = (e) => {
      const st = statusOf(e);
      const when = st === "planned" ? I.date(e.start, { dow: true }) : t("day") + " " + (TODAY - e.start);
      return `<button class="ev-item t-${e.type}" data-ev="${e.id}" ${st === "planned" ? 'data-planned="1"' : ""}><span class="ico">${ICON["t_" + e.type]}</span><span style="min-width:0"><span class="tt" style="display:block">${esc(evName(e))}</span><span class="meta">${t("type_" + e.type)} · ${esc(e.platform)} · ${I.rp(e.cost)}</span></span><span class="when">${when}</span></button>`;
    };
    const upHtml = `<div class="week">${weekDays.map((d) => `<div><div class="d">${t("dow")[cal.dow(d)]}</div><div class="n ${d === TODAY ? "today" : ""} ${allEv.some((e) => e.start === d) && d !== TODAY ? "has" : ""}">${cal.dom(d)}</div></div>`).join("")}</div>
      <div class="ev-list">${liveNow.length ? `<div class="ev-sep">${t("today")} · ${t("st_live")}</div>` + liveNow.map(evItem).join("") : ""}${next.length ? `<div class="ev-sep">${t("st_planned")}</div>` + next.map(evItem).join("") : ""}${!liveNow.length && !next.length ? `<p class="empty">${t("no_upcoming")}</p>` : ""}</div>`;

    // monthly extra sales (last 6 months)
    const months = [];
    for (let m = Math.max(cal.ym(0), cal.ym(TODAY) - 5); m <= cal.ym(TODAY); m++) months.push(m);
    const allU = units(0, TODAY);
    const monthVals = months.map((m) => allU.filter((u) => cal.ym(u.im.a) === m).reduce((s, u) => s + u.im.lift, 0));
    const last30 = units(TODAY - 29, TODAY).reduce((s, u) => s + u.im.lift, 0);
    const prev30 = units(TODAY - 59, TODAY - 30).reduce((s, u) => s + u.im.lift, 0);

    v.innerHTML = `
      <div class="head"><div><h1>${t("ov_title")}</h1><p class="sub">${t("ov_sub")}</p></div><div class="actions"><button class="btn btn-primary" data-add>${ICON.plus} ${t("add_event")}</button></div></div>
      ${headline}
      ${kpiHtml}
      <div class="grid g-2-1">
        <section class="card"><div class="card-h"><div><h2>${t("chart_actual_exp")}</h2><div class="sub">${t("chart_actual_exp_sub")}</div></div></div>
          <div class="legend"><span><span class="sw-line" style="border-color:var(--teal)"></span>${t("actual")}</span><span><span class="sw-dash" style="border-color:var(--muted)"></span>${t("expected")}</span><span><span class="sw" style="background:var(--coral);opacity:.45"></span>${t("lift")}</span>${["kol", "promo", "ads", "offline"].map((x) => `<span><span class="dot" style="background:var(--${x})"></span>${t("type_" + x)}</span>`).join("")}</div>
          <div class="chart" style="height:300px"><canvas id="ovMain" role="img" aria-label="${esc(t("chart_actual_exp"))}"></canvas></div></section>
        <section class="card"><div class="card-h"><div><h2>${t("top_kol")}</h2><div class="sub">${t("top_kol_sub")}</div></div><div class="right"><a class="link" href="#kol">${t("open")}</a></div></div>${topHtml}</section>
      </div>
      <div class="grid g-1-1">
        <section class="card"><div class="card-h"><div><h2>${t("monthly_incr")}</h2><div class="sub">${I.lang === "id" ? "30 hari terakhir" : "Last 30 days"}</div></div></div>
          <div class="flex" style="margin-bottom:10px"><span class="hero-n">${I.rp(last30)}</span>${delta(last30, prev30)}<span class="muted" style="font-size:12.5px">${I.lang === "id" ? "vs 30 hari sebelumnya" : "vs previous 30 days"}</span></div>
          <div class="legend"><span><span class="sw-dash" style="border-color:var(--ink-2)"></span>${t("avg")} ${I.rp(monthVals.reduce((s, x) => s + x, 0) / monthVals.length)}</span><span><span class="sw" style="background:var(--coral)"></span>${t("month_names")[cal.mon(TODAY)]} (${I.lang === "id" ? "s/d hari ini" : "to date"})</span></div>
          <div class="chart" style="height:220px"><canvas id="ovMonthly" role="img" aria-label="${esc(t("monthly_incr"))}"></canvas></div></section>
        <section class="card"><div class="card-h"><div><h2>${t("upcoming")}</h2><div class="sub">${t("dow")[cal.dow(TODAY)]}, ${I.date(TODAY)}</div></div><div class="right"><a class="link" href="#log">${t("open")}</a></div></div>${upHtml}</section>
      </div>`;

    // main chart
    const labels = [],
      act = [],
      exp = [],
      liftAct = [];
    const winDays = new Set();
    M.live.forEach((e) => {
      for (let d = e._win[0]; d <= Math.min(e._win[1], TODAY); d++) winDays.add(d);
    });
    for (let d = a; d <= b; d++) {
      labels.push(I.date(d));
      let s = 0,
        bb = 0;
      for (let r = 0; r < ws.R; r++) {
        s += M.regS[r][d];
        bb += M.regB[r][d];
      }
      act.push(s);
      exp.push(isNaN(bb) ? null : bb);
      liftAct.push(winDays.has(d) ? s : null);
    }
    const evByIdx = {};
    const markers = [];
    M.live.forEach((e) => {
      if (e.start < a || e.start > b) return;
      const i = e.start - a;
      (evByIdx[i] = evByIdx[i] || []).push(e);
      markers.push({ x: i, color: typeColor(e.type), id: e.id });
    });
    const teal = css("--teal"),
      coral = css("--coral"),
      muted = css("--muted");
    const ch = mkChart("ovMain", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: t("expected"), data: exp, borderColor: muted, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, tension: 0.25 },
          { label: "lift", data: liftAct, borderWidth: 0, pointRadius: 0, fill: { target: 0, above: alpha(coral, 0.38), below: "transparent" }, tension: 0.25, spanGaps: false },
          { label: t("actual"), data: act, borderColor: teal, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: teal, tension: 0.25 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 22 } },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
          y: { grid: { color: css("--grid") }, border: { display: false }, ticks: { callback: (v) => I.rp(v), maxTicksLimit: 5 } },
        },
        plugins: {
          overlay: { markers },
          tooltip: {
            filter: (it) => it.dataset.label !== "lift",
            callbacks: {
              label: (c) => " " + c.dataset.label + ": " + I.rp(c.raw),
              footer: (items) => {
                const i = items[0].dataIndex;
                const evs = evByIdx[i] || [];
                const lines = [];
                if (items.length >= 2 && exp[i] != null) lines.push((I.lang === "id" ? "Selisih: " : "Gap: ") + I.rp(act[i] - exp[i], { sign: true }));
                evs.forEach((e) => lines.push("● " + t("type_" + e.type) + ": " + evName(e)));
                return lines;
              },
            },
          },
        },
        onClick: (e, els, chart) => {
          const hit = markerHit(chart, e);
          if (hit) go("event", hit.m.id);
        },
        onHover: (e, els, chart) => {
          e.native.target.style.cursor = markerHit(chart, e) ? "pointer" : "default";
        },
      },
      plugins: [overlayPlugin],
    });

    // monthly bars
    const avg = monthVals.reduce((s, x) => s + x, 0) / monthVals.length;
    mkChart("ovMonthly", {
      type: "bar",
      data: {
        labels: months.map((m) => t("month_names")[m % 12]),
        datasets: [{ data: monthVals, backgroundColor: months.map((m, i) => (i === months.length - 1 ? coral : css("--sunk"))), borderColor: months.map((m, i) => (i === months.length - 1 ? coral : css("--line-2"))), borderWidth: 1, borderRadius: 8, borderSkipped: false, maxBarThickness: 46 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { grid: { display: false } }, y: { grid: { color: css("--grid") }, border: { display: false }, ticks: { callback: (v) => I.rp(v), maxTicksLimit: 4 } } },
        plugins: {
          overlay: { hline: { value: avg, color: css("--ink-2") } },
          tooltip: { callbacks: { label: (c) => " " + I.rp(c.raw) + (c.dataIndex === months.length - 1 ? (I.lang === "id" ? " (s/d hari ini)" : " (to date)") : "") } },
        },
      },
      plugins: [overlayPlugin],
    });
  }

  // ---------- KOL Performance ----------
  function pageKol(v) {
    const [a, b] = range();
    let lb = A.leaderboard(M, a, b).filter((x) => (state.kolPlat === "all" || x.k.platform === state.kolPlat) && (state.kolTier === "all" || x.k.tier === state.kolTier));
    const { key, dir } = state.kolSort;
    const val = (x) => (key === "handle" ? x.k.handle : key === "posts" ? x.posts.length : key === "conf" ? { high: 3, medium: 2, low: 1 }[x.conf] || 0 : x[key]);
    lb.sort((x, y) => {
      const p = val(x),
        q = val(y);
      if (p == null && q == null) return 0;
      if (p == null) return 1;
      if (q == null) return -1;
      return (typeof p === "string" ? p.localeCompare(q) : p - q) * dir;
    });
    const cols = [
      ["handle", t("col_kol"), "left"],
      ["posts", t("col_posts")],
      ["fee", t("col_fee")],
      ["lift", t("col_lift")],
      ["iroasNet", t("col_roas")],
      ["conf", t("col_conf"), "left"],
      ["direct", t("col_direct")],
      ["halo", t("col_halo")],
      ["cpio", t("col_cpio")],
      ["views", t("col_views")],
      ["er", t("col_er")],
      ["cpm", t("col_cpm")],
    ];
    const th = cols.map(([k, l, c]) => `<th class="${c || ""}" ${key === k ? `aria-sort="${dir > 0 ? "ascending" : "descending"}"` : ""}><button data-sort="${k}">${l}${key === k ? (dir > 0 ? " ↑" : " ↓") : ""}</button></th>`).join("");
    const rows = lb
      .map((x) => {
        const dim = x.conf === "low" ? "dim" : "";
        let html = `<tr class="clickable" data-kolrow="${x.k.id}" aria-expanded="${state.openKol === x.k.id}">
        <td class="left"><span class="who"><b>${esc(x.k.handle)}</b><span class="tags"><span class="plat">${x.k.platform}</span><span class="muted" style="font-size:12px">${x.k.followers ? x.k.tier + " · " + I.num(x.k.followers) : ""}</span>${x.wasted > 0 ? `<span class="badge b-wasted">${t("wasted_flag")}</span>` : ""}</span></span></td>
        <td>${x.solo.length} ${t("solo")}${x.shared.length ? `<br><span class="muted">${x.shared.length} ${t("shared")}</span>` : ""}</td>
        <td>${I.rp(x.fee)}</td>
        <td class="${dim}">${x.lift == null ? `<span class="muted">${t("only_shared")}</span>` : I.rp(x.lift)}</td>
        <td class="${dim}"><b>${I.x(x.iroasNet)}</b></td>
        <td class="left">${confBadge(x.conf)}</td>
        <td>${I.rp(x.direct)}</td>
        <td class="${dim}">${I.rp(x.halo)}</td>
        <td class="${dim}">${I.rp(x.cpio)}</td>
        <td>${I.num(x.views)}</td><td>${I.pct(x.er)}</td><td>${I.rp(x.cpm)}</td></tr>`;
        if (state.openKol === x.k.id) {
          html += `<tr class="sub-row"><td colspan="${cols.length}"><div style="display:grid;gap:6px">${x.posts
            .map((e) => {
              const im = M.impact[unitKey(e)];
              return `<div class="flex"><b style="min-width:86px">${I.date(e.start, { dow: true })}</b><span class="plat">${e.platform}</span><span class="muted">${esc(e.code)}</span><span>${t("col_lift")}: <b>${I.rp(im.lift, { sign: true })}</b> (${I.pct(im.liftPct, { sign: true })})</span>${confBadge(im.conf)}${e._cluster ? sharedBadge() : ""}${im.wasted > 0 ? `<span class="badge b-wasted">${t("wasted_flag")}</span>` : ""}<a class="link" href="#event-${e.id}">${t("open")}</a></div>`;
            })
            .join("")}</div></td></tr>`;
        }
        return html;
      })
      .join("");

    v.innerHTML = `
      <div class="head"><div><h1>${t("kol_title")}</h1><p class="sub">${t("kol_sub")}</p></div>
        <div class="actions"><div class="seg" role="group" aria-label="${t("platform")}">${["all", "IG", "TikTok"].map((p) => `<button data-plat="${p}" aria-pressed="${state.kolPlat === p}">${p === "all" ? t("all") : p}</button>`).join("")}</div>
        <div class="seg" role="group" aria-label="${t("tier")}">${["all", "nano", "micro", "macro", "mega"].map((p) => `<button data-tier="${p}" aria-pressed="${state.kolTier === p}">${p === "all" ? t("all") : p}</button>`).join("")}</div></div></div>
      <section class="card"><div class="card-h"><div><h2>${t("scatter_title")}</h2><div class="sub">${t("scatter_sub")}</div></div></div>
        <div class="legend"><span><span class="dot" style="background:var(--s1)"></span>Instagram (●)</span><span><span class="dot" style="background:var(--s3)"></span>TikTok (▲)</span><span><span class="sw-dash" style="border-color:var(--ink-2)"></span>${t("breakeven")}</span></div>
        <div class="chart" style="height:300px"><canvas id="kolScatter" role="img" aria-label="${esc(t("scatter_title"))}"></canvas></div></section>
      <section class="card"><div class="table-wrap"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${rows || `<tr><td colspan="${cols.length}" class="empty">${t("none")}</td></tr>`}</tbody></table></div></section>`;

    // scatter of solo posts
    const pts = { IG: [], TikTok: [] };
    lb.forEach((x) =>
      x.solo.forEach((e) => {
        const im = M.impact[e.id];
        if (im.iroasNet == null) return;
        pts[e.platform].push({ x: im.cost, y: im.iroasNet, e, im });
      }),
    );
    const ds = (p, color, style) => ({
      label: p,
      data: pts[p],
      pointStyle: style,
      pointRadius: 7,
      pointHoverRadius: 9,
      borderWidth: 2,
      borderColor: color,
      backgroundColor: pts[p].map((q) => (q.im.conf === "low" ? "transparent" : color)),
    });
    const allY = [...pts.IG, ...pts.TikTok].map((q) => q.y);
    mkChart("kolScatter", {
      type: "scatter",
      data: { datasets: [ds("IG", css("--s1"), "circle"), ds("TikTok", css("--s3"), "triangle")] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 8 },
        scales: {
          x: { type: "logarithmic", grid: { color: css("--grid") }, title: { display: true, text: I.lang === "id" ? "Biaya (fee + diskon kode), skala log" : "Cost (fee + code discount), log scale" }, ticks: { autoSkip: false, maxRotation: 0, callback: (v) => ([1e6, 3e6, 1e7, 3e7, 1e8].includes(v) ? I.rp(v) : "") }, afterBuildTicks: (ax) => { ax.ticks = [1e6, 3e6, 1e7, 3e7, 1e8].filter((v) => v >= ax.min && v <= ax.max).map((v) => ({ value: v })); } },
          y: { grid: { color: css("--grid") }, border: { display: false }, suggestedMin: Math.min(0, ...allY) - 0.5, suggestedMax: Math.max(3, ...allY) + 0.5, title: { display: true, text: t("col_roas") }, ticks: { callback: (v) => I.x(v) } },
        },
        plugins: {
          overlay: { hline: { value: 1, color: css("--ink-2"), label: t("breakeven") } },
          tooltip: {
            callbacks: {
              title: (items) => {
                const q = items[0].raw;
                return kolOf(q.e).handle + " · " + I.date(q.e.start);
              },
              label: (c) => {
                const q = c.raw;
                return [" " + t("col_roas") + ": " + I.x(q.y), " " + t("col_spend") + ": " + I.rp(q.x), " " + t("col_lift") + ": " + I.rp(q.im.lift), " " + t("col_conf") + ": " + t("conf_" + q.im.conf)];
              },
            },
          },
        },
        onClick: (e, els) => {
          if (els[0]) {
            const q = pts[els[0].datasetIndex === 0 ? "IG" : "TikTok"][els[0].index];
            go("event", q.e.id);
          }
        },
        onHover: (e, els) => (e.native.target.style.cursor = els.length ? "pointer" : "default"),
      },
      plugins: [overlayPlugin],
    });
  }

  // ---------- Event Impact ----------
  function signedBars(items, opts = {}) {
    const max = Math.max(1, ...items.map((x) => Math.abs(x.lift)));
    return `<div class="bars">${items
      .map(
        (x) => `<div class="bar-row"><span class="name" title="${esc(x.name)}">${esc(x.name)}${x.tag ? `<small>${x.tag}</small>` : ""}</span><span class="bar-track"><span class="bar-fill ${x.lift < 0 ? "neg" : x.hi ? "hi" : opts.muted && !x.inScope ? "muted" : "pos"}" style="width:${Math.max(2, (Math.abs(x.lift) / max) * 100)}%"></span></span><span class="bar-val">${I.rp(x.lift, { sign: true })} <span class="muted" style="font-weight:400">${I.pct(x.pct, { sign: true })}</span></span></div>`,
      )
      .join("")}</div>`;
  }

  function pageEvent(v) {
    const live = M.live.slice().sort((x, y) => y.start - x.start);
    let e = live.find((x) => x.id === state.eventId);
    if (!e) {
      const planned = ws.events.find((x) => x.id === state.eventId);
      if (planned) return pagePlanned(v, planned);
      e = featuredPost() || live[0];
    }
    if (!e) {
      v.innerHTML = `<div class="head"><div><h1>${t("ev_title")}</h1></div></div><section class="card"><p class="empty">${t("no_events")}</p><div class="flex" style="justify-content:center"><button class="btn btn-primary" data-add>${ICON.plus} ${t("add_event")}</button></div></section>`;
      return;
    }
    state.eventId = e.id;
    const key = unitKey(e);
    const evs = unitEvs(e);
    const im = M.impact[key];
    const st = statusOf(e);
    const i = live.indexOf(e);
    const prev = live[i + 1],
      next = live[i - 1];
    const k = e.type === "kol" ? kolOf(e) : null;
    const dateTxt = e.end > e.start ? I.date(e.start, { dow: true }) + " – " + I.date(e.end, { dow: true }) : I.date(e.start, { dow: true });
    const bd = A.breakdown(M, key, evs);
    const low = im.conf === "low";

    const clusterNote = e._cluster
      ? `<div class="note">${ICON.info}<div>${t("cluster_warn")}<div class="flex" style="margin-top:6px">${t("cluster_with")}: ${e._cluster.members
          .filter((m) => m !== e)
          .map((m) => `<a class="chip t-${m.type}" href="#event-${m.id}">${esc(evName(m))} · ${I.date(m.start)}</a>`)
          .join("")}</div></div></div>`
      : "";
    const wastedNote = im.wasted > 0 ? `<div class="note warn">${ICON.warn}<div><b>${t("wasted_flag")}.</b> ${t("wasted_text", { x: I.rp(im.wasted) })}</div></div>` : "";
    const lowNote = low ? `<div class="note" style="background:var(--sunk);color:var(--ink-2)">${ICON.info}<div>${t("not_detectable")}</div></div>` : "";

    const stats = [
      { l: t("m_incr"), v: I.rp(im.lift, { sign: true }), n: (I.lang === "id" ? "hari " : "days ") + "0–" + (im.b - im.a) + (im.inProgress ? " · " + t("in_progress") : ""), hi: !low },
      { l: t("m_liftpct"), v: I.pct(im.liftPct, { sign: true }), n: I.rp(im.base) + " " + (I.lang === "id" ? "perkiraan" : "expected") },
      { l: t("m_direct"), v: I.rp(im.direct), n: e.code ? esc(evs.map((x) => x.code).filter(Boolean).join(", ")) : e.type === "promo" ? (I.lang === "id" ? "order dengan promo" : "orders using the promo") : "—" },
      { l: t("m_halo"), v: I.rp(im.halo, { sign: true }), n: I.lang === "id" ? "tambahan tanpa kode" : "extra without code" },
      { l: t("m_roas_net"), v: I.x(im.iroasNet), n: t("m_roas_gross") + " " + I.x(im.iroasGross) },
      { l: t("m_cpio"), v: I.rp(im.cpio), n: I.num(im.incrOrders) + " order" },
    ];
    if (im.todayLift != null) stats.push({ l: t("m_today") + " (" + t("day").toLowerCase() + " " + im.todayDay + ")", v: I.rp(im.todayLift, { sign: true }), n: I.date(TODAY) });

    const r = M.S;
    const calc = [
      t("calc_line1", { a: I.rp(im.actual), b: I.rp(im.base), c: I.rp(im.lift, { sign: true }), p: I.pct(im.liftPct, { sign: true }) }),
      t("calc_line2", { d: I.rp(im.direct), h: I.rp(im.halo, { sign: true }) }),
      t("calc_line3", { f: I.rp(im.fee), x: I.rp(im.cost - im.fee), t: I.rp(im.cost), r: I.pct(im.commRate), n: I.rp(im.netIncr, { sign: true }) }),
      t("calc_line4", { n: I.rp(im.netIncr, { sign: true }), t: I.rp(im.cost), roas: I.x(im.iroasNet), z: (I.lang === "id" ? String(Math.round(im.z * 10) / 10).replace(".", ",") : Math.round(im.z * 10) / 10), s: I.rp(im.noise) }),
    ];

    v.innerHTML = `
      <div class="head"><div><h1>${t("ev_title")}</h1></div>
        <div class="actions ev-nav"><label class="sr-only" for="evSel">${t("ev_pick")}</label><select id="evSel">${live.map((x) => `<option value="${x.id}" ${x === e ? "selected" : ""}>${I.date(x.start)} · ${esc(evName(x))} · ${t("type_" + x.type)}</option>`).join("")}</select>
        <button class="icon-btn" data-ev="${prev ? prev.id : ""}" ${prev ? "" : "disabled"} aria-label="${t("ev_prev")}">${ICON.left}</button><button class="icon-btn" data-ev="${next ? next.id : ""}" ${next ? "" : "disabled"} aria-label="${t("ev_next")}">${ICON.right}</button></div></div>
      <section class="card row-gap" style="gap:14px">
        <div class="ev-header">${typeChip(e)}<span class="title">${esc(evName(e))}</span>${statusBadge(st)}${confBadge(im.conf)}${e._cluster ? sharedBadge() : ""}${im.wasted > 0 ? `<span class="badge b-wasted">${t("wasted_flag")}</span>` : ""}</div>
        <div class="ev-header"><span class="meta"><span>${dateTxt}</span>·<span class="plat">${esc(e.platform)}</span>${k && k.followers ? `· <span>${k.tier} · ${I.num(k.followers)} followers</span>` : ""}· <span>${t("col_spend")} ${I.rp(e.cost)}</span>${e.code ? `· <span>${t("col_code")} <b>${esc(e.code)}</b></span>` : ""}· <span>${esc(regionsLabel(e.regions))}</span>${e.item != null ? `· <span>${esc(ws.def.items[e.item].name)}</span>` : ""}${e.views ? `· <span>${I.num(e.views)} views · ER ${I.pct((e.likes + e.comments + e.shares) / e.views)}</span>` : ""}</span></div>
        ${clusterNote}${wastedNote}${lowNote}
        <div class="stats">${stats.map((s) => `<div class="stat ${s.hi ? "hi" : ""}"><div class="l">${s.l}</div><div class="v">${s.v}</div><div class="n">${s.n}</div></div>`).join("")}</div>
        <details class="calc"><summary>${t("how_calc")}</summary><ol>${calc.map((c) => `<li>${c}</li>`).join("")}</ol></details>
      </section>
      <div class="grid g-2-1">
        <section class="card"><div class="card-h"><div><h2>${t("chart_window")}</h2><div class="sub">${esc(regionsLabel(im.regions))} · ${I.lang === "id" ? "area abu-abu = jendela atribusi, titik = event" : "grey area = attribution window, dots = events"}</div></div></div>
          <div class="legend"><span><span class="sw-line" style="border-color:var(--teal)"></span>${t("actual")}</span><span><span class="sw-dash" style="border-color:var(--muted)"></span>${t("expected")}</span><span><span class="sw" style="background:var(--coral);opacity:.45"></span>${t("lift")}</span></div>
          <div class="chart" style="height:280px"><canvas id="evWin" role="img" aria-label="${esc(t("chart_window"))}"></canvas></div></section>
        <section class="card"><div class="card-h"><div><h2>${t("chart_daily_lift")}</h2><div class="sub">${I.lang === "id" ? "Hari ke-0 = hari event dimulai" : "Day 0 = event start"}</div></div></div>
          <div class="chart" style="height:280px"><canvas id="evDaily" role="img" aria-label="${esc(t("chart_daily_lift"))}"></canvas></div></section>
      </div>
      <div class="grid g-3">
        <section class="card"><div class="card-h"><h2>${t("by_region")}</h2></div>${signedBars(bd.byRegion.map((x, r) => ({ ...x, tag: x.inScope ? t("in_scope") : otherEventsIn(r, im, evs) ? (I.lang === "id" ? "ada event lain" : "other events running") : (I.lang === "id" ? "pembanding (tanpa event)" : "comparison (no events)") })), { muted: true })}</section>
        <section class="card"><div class="card-h"><h2>${t("by_channel")}</h2></div>${signedBars(bd.byChannel)}</section>
        <section class="card"><div class="card-h"><h2>${t("by_item")}</h2></div>${signedBars(bd.byItem.map((x) => ({ ...x, hi: x.promoted && x.lift > 0, tag: x.promoted ? t("promoted") : "" })))}</section>
      </div>`;

    // window chart
    const from = Math.max(0, im.a - 14),
      to = Math.min(TODAY, im.b0 + 3);
    const labels = [],
      act = [],
      exp = [],
      liftAct = [];
    for (let d = from; d <= to; d++) {
      labels.push(I.date(d));
      let s = 0,
        bb = 0;
      im.regions.forEach((r) => {
        s += M.regS[r][d];
        bb += M.regB[r][d];
      });
      act.push(s);
      exp.push(isNaN(bb) ? null : bb);
      liftAct.push(d >= im.a && d <= im.b ? s : null);
    }
    const teal = css("--teal"),
      coral = css("--coral"),
      muted = css("--muted");
    mkChart("evWin", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: t("expected"), data: exp, borderColor: muted, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, tension: 0.2 },
          { label: "lift", data: liftAct, borderWidth: 0, pointRadius: 0, fill: { target: 0, above: alpha(coral, 0.4), below: alpha(css("--bad"), 0.15) }, tension: 0.2 },
          { label: t("actual"), data: act, borderColor: teal, borderWidth: 2, pointRadius: 2, pointBackgroundColor: teal, tension: 0.2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 18 } },
        interaction: { mode: "index", intersect: false },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } }, y: { grid: { color: css("--grid") }, border: { display: false }, ticks: { callback: (v) => I.rp(v), maxTicksLimit: 5 } } },
        plugins: {
          overlay: { bands: [{ from: im.a - from, to: im.b - from, color: alpha(css("--ink"), 0.04) }], markers: M.live.filter((x) => x.start >= from && x.start <= to && x.regions.some((r) => im.regions.includes(r))).map((x) => ({ x: x.start - from, color: typeColor(x.type), id: x.id })) },
          tooltip: {
            filter: (it) => it.dataset.label !== "lift",
            callbacks: {
              label: (c) => " " + c.dataset.label + ": " + I.rp(c.raw),
              footer: (items) => M.live.filter((x) => x.start === from + items[0].dataIndex && x.regions.some((r) => im.regions.includes(r))).map((x) => "● " + t("type_" + x.type) + ": " + evName(x)),
            },
          },
        },
        onClick: (ev, els, chart) => {
          const hit = markerHit(chart, ev);
          if (hit) go("event", hit.m.id);
        },
        onHover: (ev, els, chart) => (ev.native.target.style.cursor = markerHit(chart, ev) ? "pointer" : "default"),
      },
      plugins: [overlayPlugin],
    });

    // daily lift bars across the full window
    const n = im.b0 - im.a + 1;
    const dl = Array.from({ length: n }, (_, j) => (im.daily[j] ? im.daily[j].lift : null));
    mkChart("evDaily", {
      type: "bar",
      data: {
        labels: dl.map((_, j) => t("day") + " " + j),
        datasets: [{ data: dl, backgroundColor: dl.map((x, j) => (im.a + j === TODAY ? coral : x < 0 ? alpha(css("--bad"), 0.7) : teal)), borderRadius: 6, borderSkipped: false, maxBarThickness: 34 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } }, y: { grid: { color: css("--grid") }, border: { display: false }, ticks: { callback: (v) => I.rp(v), maxTicksLimit: 5 } } },
        plugins: { tooltip: { callbacks: { title: (it) => it[0].label + " · " + I.date(im.a + it[0].dataIndex, { dow: true }) + (im.a + it[0].dataIndex === TODAY ? " · " + t("today") : ""), label: (c) => (c.raw == null ? " —" : " " + I.rp(c.raw, { sign: true })) } } },
      },
    });
  }

  // did any other event touch region r during this impact window?
  function otherEventsIn(r, im, evs) {
    return M.live.some((x) => !evs.includes(x) && x.regions.includes(r) && x._win[0] <= im.b && x._win[1] >= im.a);
  }

  function pagePlanned(v, e) {
    v.innerHTML = `<div class="head"><div><h1>${t("ev_title")}</h1></div></div>
      <section class="card row-gap" style="gap:12px"><div class="ev-header">${typeChip(e)}<span class="title">${esc(evName(e))}</span>${statusBadge("planned")}</div>
      <div class="meta muted">${I.date(e.start, { dow: true })} · ${esc(e.platform)} · ${t("col_spend")} ${I.rp(e.cost)}${e.code ? " · " + esc(e.code) : ""} · ${esc(regionsLabel(e.regions))}</div>
      <div class="note">${ICON.info}<div>${I.lang === "id" ? `Event ini belum dimulai. Hasilnya muncul di sini mulai ${I.date(e.start, { dow: true })}, dibandingkan dengan perkiraan penjualan untuk ${esc(regionsLabel(e.regions))}.` : `This event hasn't started. Results appear here from ${I.date(e.start, { dow: true })}, measured against expected sales for ${esc(regionsLabel(e.regions))}.`}</div></div></section>`;
  }

  // ---------- Channels & Spend ----------
  function pageChannels(v) {
    const [a, b] = range();
    const us = units(a, b);
    const rows = [];
    const bucket = (type) => us.filter((u) => u.evs.length === 1 && u.evs[0].type === type);
    ["kol", "promo", "ads", "offline"].forEach((type) => {
      const list = bucket(type);
      if (!list.length) return;
      const s = list.reduce((o, u) => ((o.cost += u.im.cost), (o.lift += u.im.lift), (o.net += u.im.netIncr), o), { cost: 0, lift: 0, net: 0 });
      rows.push({ name: t("row_" + type), n: list.length, ...s, method: "measured", type });
    });
    const shared = us.filter((u) => u.evs.length > 1);
    if (shared.length) {
      const s = shared.reduce((o, u) => ((o.cost += u.im.cost), (o.lift += u.im.lift), (o.net += u.im.netIncr), o), { cost: 0, lift: 0, net: 0 });
      rows.push({ name: t("row_shared"), n: shared.length, ...s, method: "shared" });
    }
    const sc = A.salesChannels(M, a, b);
    const grossAll = sc.reduce((s, x) => s + x.gross, 0);
    const avgComm = sc.reduce((s, x) => s + x.comm, 0) / grossAll;
    ws.alwaysOn.forEach((ao) => {
      let cost = 0;
      for (let d = a; d <= b; d++) cost += ao.daily[d];
      rows.push({ name: t("row_always", { x: ao.name }), cost, lift: cost * ao.claimed, net: cost * ao.claimed * (1 - avgComm), method: "platform" });
    });
    rows.forEach((r) => (r.roas = r.cost > 0 ? r.net / r.cost : null));
    const maxRoas = Math.max(1.5, ...rows.map((r) => r.roas || 0));

    v.innerHTML = `
      <div class="head"><div><h1>${t("ch_title")}</h1><p class="sub">${t("ch_sub")}</p></div></div>
      <section class="card"><div class="card-h"><div><h2>${t("mkt_channels")}</h2><div class="sub">${I.date(a)} – ${I.date(b)}</div></div></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th class="left">${t("col_channel")}</th><th>${t("col_spend")}</th><th>${t("col_incr")}</th><th>${t("col_net")}</th><th class="left" style="min-width:150px">${t("col_roas")}</th><th class="left">${t("col_method")}</th></tr></thead><tbody>
        ${rows
          .map(
            (r) => `<tr><td class="left"><b>${esc(r.name)}</b>${r.n ? ` <span class="muted">· ${r.n}</span>` : ""}</td><td>${I.rp(r.cost)}</td><td>${I.rp(r.lift)}</td><td>${I.rp(r.net)}</td>
          <td class="left"><div class="flex" style="flex-wrap:nowrap"><span class="bar-track" style="flex:1;min-width:60px"><span class="bar-fill ${r.method === "platform" ? "muted" : r.roas < 1 ? "neg" : "pos"}" style="width:${Math.max(2, (Math.max(0, r.roas || 0) / maxRoas) * 100)}%"></span><span class="bar-mark" style="left:${(1 / maxRoas) * 100}%"></span></span><b style="min-width:44px;text-align:right">${I.x(r.roas)}</b></div></td>
          <td class="left"><span class="badge ${r.method === "measured" ? "c-high" : r.method === "shared" ? "b-shared" : "c-low"} b-noDot">${t("method_" + r.method)}</span></td></tr>`,
          )
          .join("")}</tbody></table></div>
        <div class="note" style="margin-top:14px;background:var(--sunk);color:var(--ink-2)">${ICON.info}<div>${t("platform_note")} ${I.lang === "id" ? "Garis tegak pada bar = balik modal (1×)." : "The tick on each bar marks break-even (1×)."}</div></div></section>
      <div class="grid g-1-1">
        <section class="card"><div class="card-h"><h2>${t("weekly_spend")}</h2></div>
          <div class="legend">${[["always", "--s1", I.lang === "id" ? "Iklan always-on" : "Always-on ads"], ["kol", "--s2", t("row_kol")], ["promo", "--s3", t("row_promo")], ["ads", "--s4", t("row_ads")], ["offline", "--s5", t("row_offline")]].map(([k, c, l]) => `<span><span class="sw" style="background:var(${c})"></span>${l}</span>`).join("")}</div>
          <div class="chart" style="height:260px"><canvas id="chSpend" role="img" aria-label="${esc(t("weekly_spend"))}"></canvas></div></section>
        <section class="card"><div class="card-h"><div><h2>${t("weekly_mer")}</h2><div class="sub">${I.lang === "id" ? "Penjualan bersih ÷ semua biaya marketing, 4 minggu bergulir" : "Net sales ÷ all marketing spend, rolling 4 weeks"}</div></div></div>
          <div class="chart" style="height:260px;margin-top:28px"><canvas id="chMer" role="img" aria-label="${esc(t("weekly_mer"))}"></canvas></div></section>
      </div>
      <section class="card"><div class="card-h"><h2>${t("sales_channels")}</h2></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th class="left">${t("col_channel")}</th><th>${t("col_gross")}</th><th>${t("col_comm")}</th><th>${t("col_disc")}</th><th>${t("col_netrev")}</th><th class="left" style="min-width:180px">% ${t("col_netrev")}</th></tr></thead><tbody>
        ${sc.map((x) => `<tr><td class="left"><b>${esc(x.full)}</b></td><td>${I.rp(x.gross)}</td><td>${I.rp(-x.comm)}</td><td>${I.rp(-x.disc)}</td><td><b>${I.rp(x.net)}</b></td><td class="left"><div class="flex" style="flex-wrap:nowrap"><span class="bar-track" style="flex:1;min-width:80px"><span class="bar-fill pos" style="width:${(x.net / x.gross) * 100}%"></span></span><span style="min-width:44px;text-align:right">${I.pct(x.net / x.gross, { dec: 0 })}</span></div></td></tr>`).join("")}
        </tbody></table></div></section>`;

    // weekly buckets (weeks starting Monday)
    const sp = A.spendDaily(M);
    const weeks = [];
    for (let d = a; d <= b; d++) {
      const ws0 = d - ((cal.dow(d) + 6) % 7);
      let w = weeks[weeks.length - 1];
      if (!w || w.start !== ws0) weeks.push((w = { start: ws0, always: 0, kol: 0, promo: 0, ads: 0, offline: 0, net: 0 }));
      for (const k in sp) w[k] += sp[k][d];
    }
    // MER per week = trailing 28 days (event fees land on one day, so single weeks are too lumpy)
    weeks.forEach((w) => {
      const e = Math.min(w.start + 6, b),
        s = Math.max(0, e - 27);
      w.net = A.salesChannels(M, s, e).reduce((x, y) => x + y.net, 0);
      w.spend = w.always + w.kol + w.promo + w.ads + w.offline;
      let sp28 = 0;
      for (let d = s; d <= e; d++) for (const k in sp) sp28 += sp[k][d];
      w.mer = sp28 > 0 ? w.net / sp28 : null;
    });
    const labels = weeks.map((w) => I.date(Math.max(w.start, a)));
    const order = [["always", "--s1", I.lang === "id" ? "Iklan always-on" : "Always-on ads"], ["kol", "--s2", t("row_kol")], ["promo", "--s3", t("row_promo")], ["ads", "--s4", t("row_ads")], ["offline", "--s5", t("row_offline")]];
    const card = css("--card");
    mkChart("chSpend", {
      type: "bar",
      data: { labels, datasets: order.map(([k, c, l]) => ({ label: l, data: weeks.map((w) => w[k]), backgroundColor: css(c), borderColor: card, borderWidth: { top: 2 }, borderSkipped: false, maxBarThickness: 28 })) },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: { x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, maxTicksLimit: 8 } }, y: { stacked: true, grid: { color: css("--grid") }, border: { display: false }, ticks: { callback: (v) => I.rp(v), maxTicksLimit: 5 } } },
        plugins: { tooltip: { callbacks: { title: (it) => (I.lang === "id" ? "Minggu " : "Week of ") + it[0].label, label: (c) => (c.raw ? " " + c.dataset.label + ": " + I.rp(c.raw) : null), footer: (it) => "Total: " + I.rp(weeks[it[0].dataIndex].spend) } } },
      },
    });
    mkChart("chMer", {
      type: "line",
      data: { labels, datasets: [{ label: "MER", data: weeks.map((w) => w.mer), borderColor: css("--teal"), backgroundColor: alpha(css("--teal"), 0.1), fill: true, borderWidth: 2, pointRadius: 3, pointBackgroundColor: css("--teal"), tension: 0.3 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, maxTicksLimit: 8 } }, y: { grid: { color: css("--grid") }, border: { display: false }, beginAtZero: true, ticks: { callback: (v) => I.x(v), maxTicksLimit: 5 } } },
        plugins: { tooltip: { callbacks: { title: (it) => (I.lang === "id" ? "Minggu " : "Week of ") + it[0].label, label: (c) => " MER: " + I.x(c.raw) + (I.lang === "id" ? " (28 hari)" : " (28 days)") } } },
      },
    });
  }

  // ---------- Log & Calendar ----------
  function resultClass(e) {
    if (statusOf(e) === "planned") return "";
    const im = M.impact[unitKey(e)];
    if (im.conf === "low") return "neutral";
    return im.iroasNet >= 1 ? "ok" : "poor";
  }

  function pageLog(v) {
    const ymv = state.calYM;
    const m = ymv % 12,
      y = Math.floor(ymv / 12);
    const first = MI.cal.idx(`${y}-${String(m + 1).padStart(2, "0")}-01`);
    const startCell = first - ((cal.dow(first) + 6) % 7);
    const cells = [];
    for (let d = startCell; d < startCell + 42; d++) {
      if (d > startCell + 34 && cal.mon(d) !== m) break;
      cells.push(d);
    }
    const dowOrder = [1, 2, 3, 4, 5, 6, 0];
    const evOn = (d) => ws.events.filter((e) => e.start === d);
    const list = ws.events.filter((e) => state.logType === "all" || e.type === state.logType).slice().sort((x, y) => y.start - x.start);

    const D = ws.def;
    const fv = state.formVals || {};
    const form = state.showForm
      ? `<section class="card" id="formCard"><div class="card-h"><div><h2>${t("form_title")}</h2><div class="sub">${t("form_note")}</div></div></div>
      <form class="ev-form" id="evForm" novalidate>
        <div class="field"><label for="f_type">${t("form_type")}</label><select id="f_type">${["kol", "promo", "ads", "offline"].map((x) => `<option value="${x}" ${fv.type === x ? "selected" : ""}>${t("type_" + x)}</option>`).join("")}</select></div>
        <div class="field" data-for="kol"><label for="f_kol">${t("form_kol")}</label><select id="f_kol"><option value="">— ${t("form_new_kol")} —</option>${ws.kols.map((k) => `<option value="${k.id}">${esc(k.handle)} · ${k.platform}</option>`).join("")}</select></div>
        <div class="field" data-for="kol"><label for="f_newkol">${t("form_new_kol")}</label><input id="f_newkol" placeholder="@handle"></div>
        <div class="field" data-for="kol"><label for="f_plat">${t("form_platform")}</label><select id="f_plat"><option>IG</option><option>TikTok</option></select></div>
        <div class="field" data-for="promo ads offline"><label for="f_name">${t("form_name")}</label><input id="f_name"></div>
        <div class="field" data-for="promo"><label for="f_ch">${t("form_channel")}</label><select id="f_ch">${D.channels.map((c, i) => (c.commission > 0 ? `<option value="${i}">${esc(c.short)}</option>` : "")).join("") || D.channels.map((c, i) => `<option value="${i}">${esc(c.short)}</option>`).join("")}</select></div>
        <div class="field" data-for="ads offline"><label for="f_aplat">${t("form_platform")}</label><input id="f_aplat" placeholder="Meta / TikTok Ads / Offline"></div>
        <div class="field"><label for="f_date">${t("form_date")}</label><input id="f_date" type="date" min="${cal.iso(0)}" max="${cal.iso(TODAY + 120)}" value="${cal.iso(TODAY + 3)}"></div>
        <div class="field" data-for="promo ads offline"><label for="f_end">${t("form_end")}</label><input id="f_end" type="date" min="${cal.iso(0)}" max="${cal.iso(TODAY + 120)}" value="${cal.iso(TODAY + 5)}"></div>
        <div class="field"><label for="f_cost">${t("form_cost")}</label><input id="f_cost" type="number" min="0" step="100000" inputmode="numeric" placeholder="5000000"><span class="err" id="e_cost" hidden></span></div>
        <div class="field" data-for="kol"><label for="f_code">${t("form_code")}</label><input id="f_code" placeholder="${esc(D.codePrefix || "KODE")}…"></div>
        <div class="field"><label for="f_item">${t("form_item")}</label><select id="f_item"><option value="">—</option>${D.items.map((it, i) => `<option value="${i}">${esc(it.name)}</option>`).join("")}</select></div>
        <div class="field" style="grid-column:1/-1"><span class="lab">${t("form_regions")}</span><div class="checks">${D.regions.map((rg, i) => `<label><input type="checkbox" name="f_reg" value="${i}" checked> ${esc(rg.name)}</label>`).join("")}</div><span class="err" id="e_reg" hidden></span></div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">${t("form_save")}</button><button class="btn" type="button" data-cancel>${t("form_cancel")}</button><span class="err" id="e_name" hidden style="color:var(--bad);font-size:12.5px"></span></div>
      </form></section>`
      : "";

    v.innerHTML = `
      <div class="head"><div><h1>${t("log_title")}</h1><p class="sub">${t("log_sub")}</p></div><div class="actions"><button class="btn btn-primary" data-add>${ICON.plus} ${t("add_event")}</button></div></div>
      ${state.toast ? `<p class="toast" role="status">${esc(state.toast)}</p>` : ""}
      ${form}
      <section class="card"><div class="card-h"><div class="cal-head"><button class="icon-btn" data-cal="-1" aria-label="${t("ev_prev")}" ${ymv <= cal.ym(0) ? "disabled" : ""}>${ICON.left}</button><h2 style="min-width:150px;text-align:center">${t("month_long")[m]} ${y}</h2><button class="icon-btn" data-cal="1" aria-label="${t("ev_next")}" ${ymv >= cal.ym(TODAY + 60) ? "disabled" : ""}>${ICON.right}</button></div>
        <div class="right legend" style="margin:0">${["kol", "promo", "ads", "offline"].map((x) => `<span class="chip t-${x}">${t("type_" + x)}</span>`).join("")}</div></div>
        <div style="overflow-x:auto"><div class="cal" style="min-width:560px">${dowOrder.map((d) => `<div class="dh">${t("dow")[d]}</div>`).join("")}
        ${cells.map((d) => `<div class="c ${cal.mon(d) !== m ? "out" : ""} ${d === TODAY ? "today" : ""}"><span class="dn">${cal.dom(d)}</span>${evOn(d).map((e) => `<button class="chip t-${e.type} ${resultClass(e)}" data-ev="${e.id}" title="${esc(evName(e))} · ${t("type_" + e.type)}">${esc(evName(e))}</button>`).join("")}</div>`).join("")}</div></div>
        <div class="legend" style="margin:10px 0 0"><span><span class="sw" style="background:var(--good)"></span>${I.lang === "id" ? "ROAS bersih ≥ 1×" : "Net ROAS ≥ 1×"}</span><span><span class="sw" style="background:var(--bad)"></span>${I.lang === "id" ? "ROAS bersih < 1×" : "Net ROAS < 1×"}</span><span><span class="sw" style="background:var(--muted)"></span>${t("conf_low")}</span></div></section>
      <section class="card"><div class="card-h"><h2>${I.lang === "id" ? "Semua event" : "All events"}</h2><div class="right"><div class="seg" role="group">${["all", "kol", "promo", "ads", "offline"].map((x) => `<button data-logtype="${x}" aria-pressed="${state.logType === x}">${x === "all" ? t("all") : t("type_" + x)}</button>`).join("")}</div></div></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th class="left">${t("col_date")}</th><th class="left">${t("col_event")}</th><th class="left">${t("col_type")}</th><th class="left">${t("col_code")}</th><th class="left">${t("col_scope")}</th><th>${t("col_spend")}</th><th>${t("col_lift")}</th><th>${t("col_roas")}</th><th class="left">${t("col_status")}</th></tr></thead><tbody>
        ${list
          .map((e) => {
            const st = statusOf(e);
            const im = st === "planned" ? null : M.impact[unitKey(e)];
            return `<tr class="clickable" data-ev="${e.id}"><td class="left">${I.date(e.start, { dow: true })}</td><td class="left"><b>${esc(evName(e))}</b> <span class="plat">${esc(e.platform)}</span></td><td class="left">${typeChip(e)}</td><td class="left">${esc(e.code || "—")}</td><td class="left" style="white-space:normal;min-width:120px">${esc(regionsLabel(e.regions))}</td><td>${I.rp(e.cost)}</td><td>${im ? I.rp(im.lift, { sign: true }) : "—"}</td><td>${im ? `<b>${I.x(im.iroasNet)}</b>` : "—"}</td><td class="left"><span class="flex" style="flex-wrap:nowrap">${statusBadge(st)}${im ? confBadge(im.conf) : ""}${e._cluster ? sharedBadge() : ""}</span></td></tr>`;
          })
          .join("")}</tbody></table></div></section>`;
    state.toast = "";
    if (state.showForm) syncForm();
  }

  function syncForm() {
    const type = $("#f_type").value;
    $$("#evForm [data-for]").forEach((f) => (f.hidden = !f.dataset.for.split(" ").includes(type)));
    const kolSel = $("#f_kol");
    if (kolSel) {
      const k = ws.kols.find((x) => x.id === kolSel.value);
      $("#f_newkol").closest(".field").hidden = type !== "kol" || !!k;
      if (k) {
        $("#f_plat").value = k.platform;
        if (!$("#f_cost").value) $("#f_cost").value = k.fee;
        $$('input[name="f_reg"]').forEach((c) => (c.checked = k.regions.includes(+c.value)));
      }
    }
  }

  function submitForm(ev) {
    ev.preventDefault();
    const type = $("#f_type").value;
    const cost = Number($("#f_cost").value);
    const regs = $$('input[name="f_reg"]:checked').map((c) => +c.value);
    const kolId = $("#f_kol").value;
    const newKol = $("#f_newkol").value.trim();
    const name = $("#f_name").value.trim();
    const errs = { e_cost: !(cost > 0) ? t("form_err_cost") : "", e_reg: !regs.length ? t("form_err_region") : "", e_name: type === "kol" ? (!kolId && !newKol ? t("form_err_name") : "") : !name ? t("form_err_name") : "" };
    let bad = false;
    for (const id in errs) {
      const el = document.getElementById(id);
      el.textContent = errs[id];
      el.hidden = !errs[id];
      if (errs[id]) bad = true;
    }
    if (bad) return;
    const start = cal.idx($("#f_date").value);
    const endRaw = cal.idx($("#f_end").value);
    const itemV = $("#f_item").value;
    const e = { id: "e" + ws.nextId++, type, start, end: type === "kol" ? start : Math.max(start, isNaN(endRaw) ? start : endRaw), cost, regions: regs, item: itemV === "" ? null : +itemV, views: null, likes: null, comments: null, shares: null };
    if (isNaN(start)) return;
    if (type === "kol") {
      let k = ws.kols.find((x) => x.id === kolId);
      if (!k) {
        const h = "@" + newKol.replace(/^@/, "");
        k = { id: ws.id + "-k" + ws.kols.length, i: ws.kols.length, handle: h, platform: $("#f_plat").value, tier: "micro", followers: 0, regions: regs, fee: cost, posts: [] };
        ws.kols.push(k);
      }
      e.kolId = k.id;
      e.platform = $("#f_plat").value;
      e.code = $("#f_code").value.trim().toUpperCase() || null;
    } else if (type === "promo") {
      e.name = { id: name, en: name };
      e.channel = +$("#f_ch").value;
      e.platform = ws.def.channels[e.channel].short;
    } else {
      e.name = { id: name, en: name };
      e.platform = $("#f_aplat").value.trim() || (type === "ads" ? "Meta" : "Offline");
    }
    ws.events.push(e);
    ws.events.sort((x, y) => x.start - y.start);
    state.showForm = false;
    model();
    state.toast = t("form_saved");
    if (e.start <= TODAY) go("event", e.id);
    else {
      state.calYM = cal.ym(e.start);
      render();
    }
  }

  // ---------- Import ----------
  const X = MI.importer;
  const impFields = (kind) => (kind === "sales" ? X.SALES_FIELDS : X.EVENT_FIELDS);

  function setImpFile(kind, parsed) {
    const first = parsed.sheets.findIndex((sh) => sh.rows.length > 1);
    const p = { name: parsed.name, sheets: parsed.sheets, sheet: first >= 0 ? first : 0 };
    impSheet(p, kind);
    state.imp[kind] = p;
    if (kind === "sales" && !state.imp.name) state.imp.name = parsed.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    state.imp.done = null;
    state.imp.error = "";
  }
  function impSheet(p, kind) {
    const rows = p.sheets[p.sheet].rows;
    p.hdr = X.headerRow(rows);
    p.map = X.guessMap(rows[p.hdr] || [], impFields(kind));
    p.cache = null;
  }
  // full read of a file with the current mapping (cached until the mapping changes)
  function impRead(kind) {
    const p = state.imp[kind];
    const key = p.sheet + "|" + JSON.stringify(p.map);
    if (p.cache && p.cache.key === key) return p.cache.res;
    const rows = p.sheets[p.sheet].rows;
    const res = kind === "sales" ? X.readSales(rows, p.hdr, p.map) : X.readEvents(rows, p.hdr, p.map);
    p.cache = { key, res };
    return res;
  }
  async function loadImpFile(kind, file) {
    if (!file) return;
    state.imp.error = "";
    state.imp.busy = kind;
    render();
    try {
      setImpFile(kind, await X.readFile(file));
    } catch (e) {
      state.imp.error = t(e && e.message === "excel_unavailable" ? "imp_excel_err" : "imp_read_err");
    }
    state.imp.busy = false;
    render();
  }
  const impLabels = () => ({
    other: t("other"),
    allRegions: t("all_outlets"),
    allChannels: t("all_channels"),
    allItems: t("all_items"),
    regionWord: t("word_region"),
    channelWord: t("word_channel"),
    itemWord: t("word_item"),
    kinds: { cafe: { id: "Kafe", en: "Café" }, cpg: { id: "Kemasan", en: "Packaged" }, cloud: { id: "Cloud kitchen", en: "Cloud kitchen" } },
  });
  const warnText = (w) => t(w.key, Object.assign({}, w.vars, w.vars && w.vars.aov ? { aov: I.rp(w.vars.aov) } : {}));

  function impBlock(kind) {
    const p = state.imp[kind];
    const fields = impFields(kind);
    const tplName = kind === "sales" ? "template_penjualan.csv" : "template_event.csv";
    if (state.imp.busy === kind) return `<p class="muted" role="status">${t("imp_building")}</p>`;
    if (!p) {
      return `<label class="drop" data-drop="${kind}"><input type="file" class="sr-only" accept=".csv,.tsv,.txt,.xlsx,.xls" data-file="${kind}">${ICON.file}<span><b>${t("imp_drop")} <span class="link">${t("imp_choose")}</span></b><br><span class="muted">${t("imp_formats")}</span></span></label>
        <div class="flex" style="margin-top:12px"><button class="btn" data-tpl="${kind}">${ICON.import} ${t("imp_template")}</button></div>
        <details class="calc" style="margin-top:14px"><summary>${t("imp_fields_title")}</summary><div class="fields-ref">${fields.map((f) => `<div><b>${t("f_" + f.key)}</b>${f.required ? ` <span class="req">${t("imp_required")}</span>` : ""}<span class="muted">${esc(t("h_" + f.key))}</span></div>`).join("")}</div></details>`;
    }
    const rows = p.sheets[p.sheet].rows;
    const hdr = rows[p.hdr] || [];
    const body = rows.slice(p.hdr + 1);
    const sample = (ci) => {
      for (const r of body.length > 5000 ? body.slice(0, 5000) : body) {
        const v = r[ci];
        if (v !== "" && v != null) return v instanceof Date ? X.parseDate(v) : String(v).slice(0, 30);
      }
      return "";
    };
    const opts = (sel) => `<option value="">${t("imp_none_col")}</option>` + hdr.map((h, i) => `<option value="${i}" ${sel === i ? "selected" : ""}>${esc(String(h === "" || h == null ? "#" + (i + 1) : h))}</option>`).join("");
    const head = `<div class="file-row">${ICON.file}<span style="min-width:0"><b class="fname">${esc(p.name)}</b><span class="muted">${t("imp_rows", { n: I.num(body.length) })}</span></span>
      ${p.sheets.length > 1 ? `<label class="sr-only" for="imp_sheet_${kind}">${t("imp_sheet")}</label><select id="imp_sheet_${kind}" data-sheet="${kind}">${p.sheets.map((sh, i) => `<option value="${i}" ${i === p.sheet ? "selected" : ""}>${t("imp_sheet")}: ${esc(sh.name)}</option>`).join("")}</select>` : ""}
      <button class="btn" data-impclear="${kind}">${t("imp_remove")}</button></div>`;
    const mapping = `<h3 style="margin:16px 0 2px">${t("imp_mapping")}</h3><p class="muted" style="margin-bottom:10px">${t("imp_mapping_sub")}</p>
      <div class="map-grid">${fields.map((f) => `<div class="field"><label for="m_${kind}_${f.key}">${t("f_" + f.key)}${f.required ? ` <span class="req">${t("imp_required")}</span>` : ""}</label><select id="m_${kind}_${f.key}" data-map="${kind}:${f.key}">${opts(p.map[f.key])}</select><span class="hint">${p.map[f.key] != null ? `${t("imp_example")}: <b>${esc(sample(p.map[f.key]))}</b>` : esc(t("h_" + f.key))}</span></div>`).join("")}</div>`;
    const missing = fields.filter((f) => f.required && p.map[f.key] == null);
    let preview = "";
    if (!missing.length) {
      const res = impRead(kind);
      const cols = kind === "sales" ? ["date", "region", "channel", "item", "revenue", "orders", "discount", "code"] : ["date", "type", "name", "platform", "cost", "code", "end", "regions", "item"];
      const shown = cols.filter((c) => fields.find((f) => f.key === c).required || c === "type" || p.map[c] != null);
      const fmt = (c, v) => (v == null || v === "" ? "—" : c === "revenue" || c === "discount" || c === "cost" ? I.rp(v) : c === "type" ? t("type_" + v) : esc(String(v)));
      const issues = Object.entries(res.skipped)
        .filter(([, n]) => n)
        .map(([why, n]) => `<li>${t("imp_skipped", { n: I.num(n), why: t("why_" + why) })}</li>`)
        .join("");
      const ex = res.examples.map((x) => t("imp_row_ex", { r: x.row, v: esc(String(x.value instanceof Date ? X.parseDate(x.value) : x.value == null ? "" : x.value).slice(0, 30)) })).join(" · ");
      preview = `<h3 style="margin:18px 0 8px">${t("imp_preview")} <span class="muted" style="font-weight:500">· ${t("imp_rows", { n: I.num(res.rows.length) })}</span></h3>
        <div class="table-wrap"><table class="tbl"><thead><tr>${shown.map((c) => `<th class="left">${c === "type" ? t("col_type") : t("f_" + c)}</th>`).join("")}</tr></thead><tbody>${res.rows
          .slice(0, 5)
          .map((r) => `<tr>${shown.map((c) => `<td class="left">${fmt(c, r[c])}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>
        ${issues ? `<div class="note warn" style="margin-top:12px">${ICON.warn}<div><ul class="plain">${issues}</ul>${ex ? `<div style="margin-top:4px">${ex}</div>` : ""}</div></div>` : ""}
        ${res.dateOrder && res.dateOrder.ambiguous ? `<p class="muted" style="margin-top:8px">${t("w_ambiguous")}</p>` : ""}`;
    } else preview = `<p class="err-text" style="margin-top:12px">${t("imp_need_cols", { x: missing.map((f) => t("f_" + f.key)).join(", ") })}</p>`;
    return head + mapping + preview;
  }

  function pageImport(v) {
    const im = state.imp;
    const done = im.done && MI.imported[im.done.id];
    const list = Object.values(MI.imported);
    const doneHtml = done
      ? `<section class="card done-card"><div class="flex"><span class="ok-dot">${ICON.check}</span><div style="min-width:0;flex:1"><h2>${t("imp_done")}: ${esc(done.name)}</h2><p class="muted">${t("imp_done_sub", { rows: I.num(done.report.rows), from: done.report.start, to: done.report.end, days: done.report.nd, r: done.R, c: done.C, i: done.I, e: done.report.events })}</p></div><a class="btn btn-primary" href="#overview">${t("imp_open")} ${ICON.right.replace("<svg", '<svg style="width:15px;height:15px"')}</a></div>
        ${done.report.warnings.length ? `<ul class="plain warn-list">${done.report.warnings.map((w) => `<li>${ICON.info}<span>${esc(warnText(w))}</span></li>`).join("")}</ul>` : ""}</section>`
      : "";
    v.innerHTML = `
      <div class="head"><div><h1>${t("imp_title")}</h1><p class="sub">${t("imp_sub")}</p></div><div class="actions"><button class="btn" data-sample>${t("imp_try_sample")}</button><button class="btn" data-dlsample>${ICON.import} ${t("imp_dl_sample")}</button></div></div>
      <div class="note privacy">${ICON.lock}<div>${t("imp_privacy")}</div></div>
      ${im.note ? `<p class="toast" role="status">${esc(im.note)}</p>` : ""}
      ${doneHtml}
      <section class="card step"><div class="card-h"><span class="step-n">1</span><div><h2>${t("imp_step1")}</h2><div class="sub">${t("imp_step1_sub")}</div></div></div>${impBlock("sales")}</section>
      <section class="card step"><div class="card-h"><span class="step-n">2</span><div><h2>${t("imp_step2")}</h2><div class="sub">${t("imp_step2_sub")}</div></div></div>${impBlock("events")}</section>
      <section class="card step"><div class="card-h"><span class="step-n">3</span><div><h2>${t("imp_step3")}</h2></div></div>
        <div class="set-grid">
          <div class="field"><label for="imp_name">${t("imp_ws_name")}</label><input id="imp_name" value="${esc(im.name)}" placeholder="${esc(I.lang === "id" ? "Contoh: Kopi Senja (data asli)" : "e.g. Kopi Senja (real data)")}"></div>
          <div class="field"><label for="imp_kind">${t("imp_kind")}</label><select id="imp_kind">${["cafe", "cpg", "cloud"].map((k) => `<option value="${k}" ${im.kind === k ? "selected" : ""}>${t("kind_" + k)}</option>`).join("")}</select><span class="hint">${t("imp_kind_help")}</span></div>
        </div>
        <label class="check-row"><input type="checkbox" id="imp_remember" ${im.remember ? "checked" : ""}><span><b>${t("imp_remember")}</b><br><span class="muted">${t("imp_remember_help")}</span></span></label>
        <div class="form-actions" style="margin-top:14px"><button class="btn btn-primary" data-impbuild ${im.busy ? "disabled" : ""}>${im.busy === "build" ? t("imp_building") : t("imp_build")}</button>${im.error ? `<span class="err-text" role="alert">${esc(im.error)}</span>` : ""}</div>
      </section>
      ${list.length ? `<section class="card"><div class="card-h"><h2>${t("imp_existing")}</h2></div><div class="imp-list">${list.map((w) => `<div class="imp-row"><span class="ws-ico imp">${esc(w.name.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase())}</span><span style="min-width:0;flex:1"><b>${esc(w.name)}</b><span class="muted" style="display:block;font-size:12.5px">${w.report.start} – ${w.report.end} · ${t("imp_rows", { n: I.num(w.report.rows) })} · ${X.isSaved(w.id) ? t("imp_saved_dev") : t("imp_not_saved")}</span></span><button class="btn" data-ws="${w.id}">${t("open")}</button><button class="btn" data-impdel="${w.id}">${t("imp_delete")}</button></div>`).join("")}</div></section>` : ""}`;
    im.note = "";
  }

  function buildImport() {
    const im = state.imp;
    im.name = ($("#imp_name").value || "").trim() || im.name || (I.lang === "id" ? "Data saya" : "My data");
    im.kind = $("#imp_kind").value;
    im.remember = $("#imp_remember").checked;
    const fail = (msg) => {
      im.error = msg;
      im.busy = false;
      render();
    };
    if (!im.sales) return fail(t("imp_need_sales"));
    for (const kind of ["sales", "events"]) {
      if (!im[kind]) continue;
      const miss = impFields(kind).filter((f) => f.required && im[kind].map[f.key] == null);
      if (miss.length) return fail(t("imp_need_cols", { x: miss.map((f) => t("f_" + f.key)).join(", ") }));
    }
    const sales = impRead("sales");
    if (!sales.rows.length) return fail(t("imp_no_rows"));
    let lo = "9999",
      hi = "";
    sales.rows.forEach((r) => {
      if (r.date < lo) lo = r.date;
      if (r.date > hi) hi = r.date;
    });
    const days = Math.round((Date.parse(hi) - Date.parse(lo)) / cal.DAY) + 1;
    if (days < X.MIN_DAYS) return fail(t("imp_too_short", { n: days, m: X.MIN_DAYS }));
    const events = im.events ? impRead("events") : null;
    const nws = X.buildWorkspace({ name: im.name, kind: im.kind, sales, events, labels: impLabels() });
    X.register(nws);
    if (im.remember) X.save(nws);
    state.ws = nws.id;
    store.set("ws", state.ws);
    state.eventId = null;
    state.openKol = null;
    state.calYM = null;
    chat.turns = [];
    model();
    im.done = { id: nws.id };
    im.sales = im.events = null;
    im.name = "";
    im.error = "";
    im.busy = false;
    render();
    window.scrollTo(0, 0);
  }

  // ---------- Settings ----------
  function pageSettings(v) {
    const S = M.S;
    const D = ws.def;
    const fac = (F) => ["payday", "holiday", "double"].filter((k) => k !== "double" || ws.kind === "cpg").map((k) => `${t(k)} ${I.x(F[k])}`).join(" · ");
    const special = [];
    MI.cal.HOLIDAYS.forEach((h) => {
      const d = cal.idx(h[0]);
      if (d >= 0 && d <= TODAY + 60) special.push([d, I.lang === "id" ? h[1] : h[2]]);
    });
    if (ws.kind === "cpg")
      for (let d = 0; d <= TODAY + 60; d++) if (cal.dom(d) === cal.mon(d) + 1) special.push([d, t("double") + " " + cal.dom(d) + "." + cal.dom(d)]);
    special.sort((x, y) => x[0] - y[0]);
    v.innerHTML = `
      <div class="head"><div><h1>${t("set_title")}</h1><p class="sub">${t("set_sub")}</p></div><div class="actions"><button class="btn" data-reset>${t("set_reset")}</button></div></div>
      <section class="card"><div class="card-h"><div><h2>${t("set_windows")}</h2><div class="sub">${t("set_windows_help")}</div></div></div>
        <div class="set-grid">
          <div class="field"><label for="s_tt">${t("set_tiktok")}</label><input id="s_tt" type="number" min="1" max="21" value="${S.win.TikTok}"><span class="hint">${t("day")} 0–${S.win.TikTok - 1}</span></div>
          <div class="field"><label for="s_ig">${t("set_ig")}</label><input id="s_ig" type="number" min="1" max="21" value="${S.win.IG}"><span class="hint">${t("day")} 0–${S.win.IG - 1}</span></div>
          <div class="field"><label for="s_ads">${t("set_ads")}</label><input id="s_ads" type="number" min="0" max="14" value="${S.adsTail}"></div>
          <div class="field"><label for="s_off">${t("set_offline")}</label><input id="s_off" type="number" min="0" max="14" value="${S.offlineTail}"></div>
          <div class="field"><span class="lab">${t("set_promo")}</span><span class="hint">${I.lang === "id" ? "Tidak bisa diubah" : "Fixed"}</span></div>
        </div></section>
      <div class="grid g-1-1">
        <section class="card"><div class="card-h"><div><h2>${t("set_baseline")}</h2><div class="sub">${t("set_baseline_help")}</div></div></div>
          <div class="field" style="max-width:240px"><label for="s_weeks">${t("set_weeks")}</label><select id="s_weeks">${[4, 5, 6, 7, 8].map((w) => `<option ${S.baselineWeeks === w ? "selected" : ""}>${w}</option>`).join("")}</select></div>
          <h3 style="margin:18px 0 8px">${t("factor")}</h3>
          <div class="days-list">${D.regions.map((rg, r) => `<div><span>${esc(rg.name)}</span><span class="muted">${fac(M.regF[r])}</span></div>`).join("")}</div>
          <h3 style="margin:18px 0 6px">${t("set_conf")}</h3><p class="muted">${t("set_conf_help")}</p></section>
        <section class="card"><div class="card-h"><div><h2>${t("set_comm")}</h2><div class="sub">${t("set_comm_help")}</div></div></div>
          <div class="set-grid">${D.channels.map((c, i) => `<div class="field"><label for="s_c${i}">${esc(c.name)} (%)</label><input id="s_c${i}" data-comm="${i}" type="number" min="0" max="60" step="0.5" value="${Math.round(S.commission[i] * 1000) / 10}"></div>`).join("")}</div></section>
      </div>
      <section class="card"><div class="card-h"><div><h2>${t("set_days")}</h2><div class="sub">${t("set_days_help")}</div></div></div>
        <div class="days-list">${special.map(([d, n]) => `<div><span>${esc(n)}</span><span class="muted">${I.date(d, { dow: true })} ${cal.year(d)}</span></div>`).join("")}</div></section>`;
  }

  function applySettings() {
    const S = M.S;
    const num = (id, lo, hi, dflt) => {
      const x = Math.round(Number($(id).value));
      return isFinite(x) ? Math.min(hi, Math.max(lo, x)) : dflt;
    };
    S.win.TikTok = num("#s_tt", 1, 21, 6);
    S.win.IG = num("#s_ig", 1, 21, 8);
    S.adsTail = num("#s_ads", 0, 14, 3);
    S.offlineTail = num("#s_off", 0, 14, 3);
    S.baselineWeeks = +$("#s_weeks").value;
    $$("[data-comm]").forEach((el) => {
      const x = Number(el.value);
      if (isFinite(x)) S.commission[+el.dataset.comm] = Math.min(60, Math.max(0, x)) / 100;
    });
    const focusId = document.activeElement && document.activeElement.id;
    model();
    render();
    if (focusId && document.getElementById(focusId)) document.getElementById(focusId).focus();
  }

  // ---------- search ----------
  function doSearch(q) {
    const pop = $("#searchPop");
    q = q.trim().toLowerCase();
    if (!q) {
      pop.hidden = true;
      return;
    }
    const res = [];
    ws.kols.forEach((k) => k.handle.toLowerCase().includes(q) && res.push(`<button data-kol="${k.id}"><span class="plat">KOL</span>${esc(k.handle)} <span class="muted">${k.platform} · ${k.tier}</span></button>`));
    ws.events
      .filter((e) => evName(e).toLowerCase().includes(q) || (e.code || "").toLowerCase().includes(q))
      .slice(-8)
      .reverse()
      .forEach((e) => res.push(`<button data-ev="${e.id}">${typeChip(e)}${esc(evName(e))} <span class="muted">${I.date(e.start)}</span></button>`));
    pop.innerHTML = res.length ? res.slice(0, 12).join("") : `<p class="muted" style="padding:8px">${t("none")}</p>`;
    pop.hidden = false;
  }

  // ---------- chat ----------
  const chat = { open: false, turns: [], busy: false, ctl: null, sample: undefined };
  if (window.claude && window.claude.use) {
    window.claude
      .use("sample")
      .then((s) => (chat.sample = s || null))
      .catch(() => (chat.sample = null));
  } else chat.sample = null;

  function contextSummary() {
    const [a, b] = range();
    const lb = A.leaderboard(M, a, b);
    const us = units(a, b);
    const r0 = (x) => (x == null || !isFinite(x) ? null : Math.round(x));
    const r2 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 100) / 100);
    const sc = A.salesChannels(M, a, b);
    return JSON.stringify({
      brand: ws.name,
      business: ws.def.kindLabel.en,
      today: cal.iso(TODAY),
      period: [cal.iso(a), cal.iso(b)],
      currency: "IDR",
      regions: ws.def.regions.map((x) => x.name),
      method: "Extra sales = actual − expected; expected = median same weekday of prior event-free weeks, adjusted for payday/holiday/twin dates, level-calibrated. Overlapping events are pooled, not split. Confidence: high z≥2, medium 1–2, low <1 (not detectable). Net ROAS = extra sales after channel commission ÷ (fee + code discount).",
      salesChannels: sc.map((x) => ({ channel: x.full, gross: r0(x.gross), commission: r0(x.comm), discounts: r0(x.disc), net: r0(x.net) })),
      kols: lb.map((x) => ({ handle: x.k.handle, platform: x.k.platform, tier: x.k.tier, posts: x.posts.length, soloPosts: x.solo.length, fee: r0(x.fee), views: x.views, codeSales: r0(x.direct), extraSales: r0(x.lift), netRoas: r2(x.iroasNet), confidence: x.conf, wastedDiscount: r0(x.wasted) })),
      events: us.map((u) => ({
        events: u.evs.map((e) => ({ name: evName(e), type: e.type, platform: e.platform, start: cal.iso(e.start), cost: e.cost, code: e.code || null })),
        pooled: u.evs.length > 1,
        windowEnd: cal.iso(u.im.b0),
        inProgress: u.im.inProgress,
        regions: u.im.regions.map((r) => ws.def.regions[r].name),
        extraSales: r0(u.im.lift),
        liftPct: r2(u.im.liftPct),
        codeSales: r0(u.im.direct),
        todayExtra: r0(u.im.todayLift),
        netRoas: r2(u.im.iroasNet),
        confidence: u.im.conf,
        wastedDiscount: r0(u.im.wasted),
      })),
      alwaysOnAds: ws.alwaysOn.map((x) => ({ name: x.name, monthlySpend: x.monthly, platformClaimedRoas: x.claimed })),
    });
  }

  function scripted(q) {
    const [a, b] = range();
    const id = I.lang === "id";
    if (q === "q1") {
      const lb = A.leaderboard(M, a, b).filter((x) => x.iroasNet != null && x.conf !== "low").sort((x, y) => y.iroasNet - x.iroasNet);
      if (!lb.length) return t("none");
      const top = lb[0],
        big = lb.slice().sort((x, y) => y.lift - x.lift)[0];
      return id
        ? `${top.k.handle} paling efisien: ROAS bersih ${I.x(top.iroasNet)} dari ${top.solo.length} post sendiri, tambahan ${I.rp(top.lift)}.` + (big !== top ? ` Tambahan terbesar dari ${big.k.handle} (${I.rp(big.lift)}), tapi ROAS bersihnya ${I.x(big.iroasNet)}.` : "")
        : `${top.k.handle} is the most efficient: net ROAS ${I.x(top.iroasNet)} from ${top.solo.length} solo post(s), ${I.rp(top.lift)} extra sales.` + (big !== top ? ` The biggest absolute lift came from ${big.k.handle} (${I.rp(big.lift)}) at a net ROAS of ${I.x(big.iroasNet)}.` : "");
    }
    if (q === "q2") {
      const f = featuredPost();
      if (!f) return t("none");
      const im = M.impact[unitKey(f)];
      const k = kolOf(f);
      let s = t("headline", { who: k.handle, plat: f.platform, date: I.date(f.start, { dow: true }), lift: I.rp(im.lift, { sign: true }), pct: I.pct(im.liftPct, { sign: true }), where: regionsLabel(im.regions) });
      s += " " + (im.todayLift != null ? t("headline_today", { d: im.todayDay, x: I.rp(im.todayLift) }) : t("headline_done"));
      s += " " + t("col_conf") + ": " + t("conf_" + im.conf) + ".";
      return s;
    }
    if (q === "q3") {
      const m0 = cal.idx("2026-10-01");
      const us = units(m0, TODAY);
      const net = us.reduce((s, u) => s + u.im.netIncr, 0),
        cost = us.reduce((s, u) => s + u.im.cost, 0);
      return id ? `Sejak 1 Okt: ${us.length} event, biaya ${I.rp(cost)}, tambahan bersih ${I.rp(net)} → ROAS bersih ${I.x(cost ? net / cost : null)}. Beberapa event masih berjalan, jadi angkanya bisa naik.` : `Since Oct 1: ${us.length} events, ${I.rp(cost)} cost, ${I.rp(net)} net extra sales → net ROAS ${I.x(cost ? net / cost : null)}. Some events are still running, so this can rise.`;
    }
    if (q === "q4") {
      const us = units(0, TODAY).filter((u) => u.im.wasted > 0).sort((x, y) => y.im.wasted - x.im.wasted);
      if (!us.length) return id ? "Tidak ada event dengan diskon terbuang." : "No events wasted discount.";
      return (id ? "Diskon terbuang (penjualan kode > tambahan penjualan):\n" : "Wasted discount (code sales > extra sales):\n") + us.slice(0, 5).map((u) => `• ${u.evs.map(evName).join(" + ")} (${I.date(u.im.a)}): ${I.rp(u.im.wasted)}`).join("\n");
    }
    return t("chat_offline");
  }

  function renderChat() {
    const root = $("#chatRoot");
    if (!chat.open) {
      root.innerHTML = "";
      return;
    }
    root.innerHTML = `<div class="scrim" data-chatclose></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="${t("chat_title")}">
      <div class="drawer-h"><h2>${t("chat_title")}</h2><span class="pill">${esc(ws.name)}</span><button class="icon-btn" style="margin-left:auto" data-chatclose aria-label="${t("form_cancel")}">${ICON.close}</button></div>
      <div class="drawer-b" id="chatBody"><p class="muted">${t("chat_intro")}</p><div class="qs">${["q1", "q2", "q3", "q4"].map((q) => `<button data-q="${q}">${t(q)}</button>`).join("")}</div></div>
      <form class="drawer-f" id="chatForm"><label class="sr-only" for="chatIn">${t("chat_placeholder")}</label><input id="chatIn" placeholder="${t("chat_placeholder")}" autocomplete="off"><button class="btn btn-primary" id="chatSend" type="submit">${t("chat_send")}</button></form></aside>`;
    const body = $("#chatBody");
    chat.turns.forEach((m) => {
      const d = document.createElement("div");
      d.className = "msg " + (m.role === "user" ? "u" : "a") + (m.err ? " err" : "");
      d.textContent = m.content;
      body.appendChild(d);
    });
    body.scrollTop = body.scrollHeight;
    setTimeout(() => $("#chatIn") && $("#chatIn").focus(), 30);
  }

  function addMsg(role, content, err) {
    const body = $("#chatBody");
    const d = document.createElement("div");
    d.className = "msg " + (role === "user" ? "u" : "a") + (err ? " err" : "");
    d.textContent = content;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }

  async function ask(text, qKey) {
    if (chat.busy || !text.trim()) return;
    chat.turns.push({ role: "user", content: text });
    addMsg("user", text);
    if (!chat.sample) {
      const ans = qKey ? scripted(qKey) : t("chat_offline");
      chat.turns.push({ role: "assistant", content: ans, local: true });
      addMsg("assistant", ans);
      return;
    }
    chat.busy = true;
    const bubble = addMsg("assistant", t("chat_thinking"));
    const btn = $("#chatSend");
    btn.textContent = t("chat_stop");
    btn.type = "button";
    chat.ctl = new AbortController();
    btn.onclick = () => chat.ctl && chat.ctl.abort();
    const rules = `You are the analyst inside a marketing dashboard for an Indonesian F&B brand. Answer in ${I.lang === "id" ? "Bahasa Indonesia" : "English"}, in at most 6 short sentences or bullets, plain text (no markdown headings or tables). Use only the JSON data below. Write money as Rupiah (e.g. ${I.lang === "id" ? "Rp 12,5 jt" : "Rp 12.5M"}). Always mention confidence when you cite an event's extra sales, and say "not detectable" for low confidence instead of treating the number as real. Overlapping events are pooled; never split their credit. If the data can't answer, say what's missing.\n\nDATA:\n${contextSummary()}`;
    const history = chat.turns.filter((m) => !m.err && !m.local).slice(-8);
    try {
      const { text: ans } = await chat.sample([{ role: "user", content: rules }, ...history], {
        cache: false,
        signal: chat.ctl.signal,
        onText: ({ text }) => (bubble.textContent = text),
      });
      chat.turns.push({ role: "assistant", content: ans });
    } catch (e) {
      const code = e && e.code;
      if (code === "cancelled") {
        bubble.textContent = (e.text || "").trim() || "—";
      } else {
        const fallback = qKey ? scripted(qKey) : null;
        if (code === "not_granted" || code === "sampling_disabled" || code === "not_declared" || code === "capability_disabled" || code === "capability_removed") chat.sample = null;
        if (fallback) {
          bubble.textContent = fallback;
          chat.turns.push({ role: "assistant", content: fallback, local: true });
        } else {
          bubble.textContent = chat.sample ? t("chat_err") : t("chat_denied");
          bubble.classList.add("err");
          chat.turns.push({ role: "assistant", content: bubble.textContent, err: true });
        }
      }
    } finally {
      chat.busy = false;
      chat.ctl = null;
      if ($("#chatSend")) {
        btn.textContent = t("chat_send");
        btn.onclick = null;
        setTimeout(() => (btn.type = "submit"), 0);
      }
    }
  }

  // ---------- events ----------
  function removeScrim() {
    const s = $("#navScrim");
    if (s) s.remove();
  }
  document.addEventListener("click", (e) => {
    const tg = e.target;
    const c = (sel) => tg.closest(sel);
    let el;
    if ((el = c("#wsBtn"))) {
      const menu = $("#wsMenu");
      const open = menu.querySelector(".ws-pop");
      if (open) {
        open.remove();
        el.setAttribute("aria-expanded", "false");
      } else {
        menu.appendChild(wsPopover());
        el.setAttribute("aria-expanded", "true");
      }
      return;
    }
    if ((el = c("[data-tpl]"))) {
      const k = el.dataset.tpl;
      X.download(k === "sales" ? "template_penjualan.csv" : "template_event.csv", X.toCSV(k === "sales" ? X.TEMPLATE_SALES : X.TEMPLATE_EVENTS)).then((r) => {
        if (r === "declined") {
          state.imp.note = t("dl_declined");
          render();
        }
      });
      return;
    }
    if (c("[data-sample]")) {
      const f = X.sampleFiles();
      setImpFile("sales", { name: "contoh_penjualan_kopi_senja.csv", sheets: [{ name: "csv", rows: X.parseCSV(f.sales) }] });
      setImpFile("events", { name: "contoh_event_kopi_senja.csv", sheets: [{ name: "csv", rows: X.parseCSV(f.events) }] });
      state.imp.name = I.lang === "id" ? "Kopi Senja (contoh impor)" : "Kopi Senja (sample import)";
      state.imp.kind = "cafe";
      render();
      return;
    }
    if (c("[data-dlsample]")) {
      const f = X.sampleFiles();
      X.download("contoh_penjualan_kopi_senja.csv", f.sales).then((r) => (r === "declined" ? null : X.download("contoh_event_kopi_senja.csv", f.events)));
      return;
    }
    if ((el = c("[data-impclear]"))) {
      state.imp[el.dataset.impclear] = null;
      render();
      return;
    }
    if (c("[data-impbuild]")) {
      state.imp.busy = "build";
      const b = c("[data-impbuild]");
      b.disabled = true;
      b.textContent = t("imp_building");
      setTimeout(buildImport, 30);
      return;
    }
    if ((el = c("[data-impdel]"))) {
      X.remove(el.dataset.impdel);
      if (state.imp.done && state.imp.done.id === el.dataset.impdel) state.imp.done = null;
      if (state.ws === el.dataset.impdel) {
        state.ws = "kopi";
        store.set("ws", state.ws);
        state.calYM = null;
        model();
      }
      render();
      return;
    }
    if ((el = c("[data-ws]"))) {
      state.ws = el.dataset.ws;
      state.calYM = null;
      store.set("ws", state.ws);
      state.eventId = null;
      state.openKol = null;
      chat.turns = [];
      model();
      render();
      return;
    }
    if (!c("#wsMenu")) {
      const p = $(".ws-pop");
      if (p) p.remove();
    }
    if (!c(".search")) $("#searchPop").hidden = true;
    if ((el = c("[data-range]"))) {
      state.range = +el.dataset.range;
      store.set("range", state.range);
      render();
      return;
    }
    if (c("#langBtn")) {
      I.lang = state.lang = I.lang === "id" ? "en" : "id";
      store.set("lang", state.lang);
      render();
      if (chat.open) renderChat();
      return;
    }
    if (c("#menuBtn")) {
      $("#side").classList.add("open");
      const s = document.createElement("div");
      s.className = "scrim";
      s.id = "navScrim";
      s.addEventListener("click", () => {
        $("#side").classList.remove("open");
        removeScrim();
      });
      document.body.appendChild(s);
      return;
    }
    if ((el = c("[data-add]"))) {
      state.showForm = true;
      if (state.route !== "log") go("log");
      else render();
      setTimeout(() => {
        const f = $("#formCard");
        if (f) f.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 40);
      return;
    }
    if (c("[data-cancel]")) {
      state.showForm = false;
      render();
      return;
    }
    if ((el = c("[data-ev]"))) {
      if (!el.dataset.ev) return;
      $("#searchPop").hidden = true;
      if (chat.open) return;
      go("event", el.dataset.ev);
      return;
    }
    if ((el = c("[data-kol]"))) {
      state.openKol = el.dataset.kol;
      $("#searchPop").hidden = true;
      state.kolPlat = "all";
      state.kolTier = "all";
      go("kol");
      return;
    }
    if ((el = c("[data-kolrow]"))) {
      state.openKol = state.openKol === el.dataset.kolrow ? null : el.dataset.kolrow;
      if (tg.closest("a")) return;
      render();
      return;
    }
    if ((el = c("[data-sort]"))) {
      const k = el.dataset.sort;
      state.kolSort = state.kolSort.key === k ? { key: k, dir: -state.kolSort.dir } : { key: k, dir: k === "handle" || k === "cpio" || k === "cpm" ? 1 : -1 };
      render();
      return;
    }
    if ((el = c("[data-plat]"))) {
      state.kolPlat = el.dataset.plat;
      render();
      return;
    }
    if ((el = c("[data-tier]"))) {
      state.kolTier = el.dataset.tier;
      render();
      return;
    }
    if ((el = c("[data-cal]"))) {
      state.calYM = Math.min(cal.ym(TODAY + 60), Math.max(cal.ym(0), state.calYM + +el.dataset.cal));
      render();
      return;
    }
    if ((el = c("[data-logtype]"))) {
      state.logType = el.dataset.logtype;
      render();
      return;
    }
    if (c("[data-reset]")) {
      state.settings[ws.id] = A.defaults(ws);
      model();
      render();
      return;
    }
    if (c("#fab")) {
      chat.open = true;
      renderChat();
      return;
    }
    if (c("[data-chatclose]")) {
      chat.open = false;
      if (chat.ctl) chat.ctl.abort();
      renderChat();
      $("#fab").focus();
      return;
    }
    if ((el = c("[data-q]"))) {
      ask(t(el.dataset.q), el.dataset.q);
      return;
    }
  });
  document.addEventListener("change", (e) => {
    const tg = e.target;
    if (tg.dataset && tg.dataset.file) return loadImpFile(tg.dataset.file, tg.files && tg.files[0]);
    if (tg.dataset && tg.dataset.map) {
      const [kind, key] = tg.dataset.map.split(":");
      const p = state.imp[kind];
      // a column can feed only one field
      for (const k in p.map) if (p.map[k] === +tg.value && k !== key && tg.value !== "") delete p.map[k];
      if (tg.value === "") delete p.map[key];
      else p.map[key] = +tg.value;
      render();
      const back = document.getElementById(tg.id);
      if (back) back.focus();
      return;
    }
    if (tg.dataset && tg.dataset.sheet) {
      const p = state.imp[tg.dataset.sheet];
      p.sheet = +tg.value;
      impSheet(p, tg.dataset.sheet);
      render();
      return;
    }
    if (tg.id === "imp_name") return void (state.imp.name = tg.value);
    if (tg.id === "imp_kind") return void (state.imp.kind = tg.value);
    if (tg.id === "imp_remember") return void (state.imp.remember = tg.checked);
    if (e.target.id === "evSel") go("event", e.target.value);
    else if (e.target.closest("#evForm")) syncForm();
    else if (e.target.closest(".set-grid, #s_weeks") || e.target.id === "s_weeks") applySettings();
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id === "evForm") submitForm(e);
    if (e.target.id === "chatForm") {
      e.preventDefault();
      const inp = $("#chatIn");
      const v = inp.value;
      inp.value = "";
      ask(v);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (chat.open) {
        chat.open = false;
        if (chat.ctl) chat.ctl.abort();
        renderChat();
      }
      $("#searchPop").hidden = true;
      const p = $(".ws-pop");
      if (p) p.remove();
      $("#side").classList.remove("open");
      removeScrim();
    }
  });
  $("#search").addEventListener("input", (e) => doSearch(e.target.value));
  // drag & drop onto the import drop zones
  document.addEventListener("dragover", (e) => {
    const z = e.target.closest && e.target.closest("[data-drop]");
    if (!z) return;
    e.preventDefault();
    z.classList.add("over");
  });
  document.addEventListener("dragleave", (e) => {
    const z = e.target.closest && e.target.closest("[data-drop]");
    if (z) z.classList.remove("over");
  });
  document.addEventListener("drop", (e) => {
    const z = e.target.closest && e.target.closest("[data-drop]");
    if (!z) return;
    e.preventDefault();
    loadImpFile(z.dataset.drop, e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  window.addEventListener("hashchange", () => {
    parseHash();
    render();
    window.scrollTo(0, 0);
  });
  // re-draw charts when the theme changes
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(() => render());
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ---------- boot ----------
  model();
  parseHash();
  render();
  MI.selfTest = () => A.selfTest(M);
})();
