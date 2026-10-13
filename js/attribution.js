/* Attribution engine. Pure functions over the workspace cube + settings.
   Expected sales (baseline) = median of the same weekday over the previous
   N clean weeks (days without any marketing event in that region), each
   reference de-seasonalised by its day-type factor (payday, holiday, twin-date),
   then re-seasonalised for the target day. */
(function () {
  const MI = (window.MI = window.MI || {});
  const A = (MI.attr = {});

  A.defaults = function (ws) {
    return {
      win: { TikTok: 6, IG: 8 },
      adsTail: 3,
      offlineTail: 3,
      baselineWeeks: 6,
      commission: ws.def.channels.map((c) => c.commission),
    };
  };

  const median = (a) => {
    if (!a.length) return NaN;
    const s = a.slice().sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  A.median = median;

  A.window = function (ev, S) {
    if (ev.type === "kol") return [ev.start, ev.start + (S.win[ev.platform] || 7) - 1];
    if (ev.type === "ads") return [ev.start, ev.end + S.adsTail];
    if (ev.type === "offline") return [ev.start, ev.end + S.offlineTail];
    return [ev.start, ev.end];
  };

  // series of one region, optionally restricted to one channel / one item
  A.series = function (ws, ri, ci, ii) {
    const ND = MI.cal.ND;
    const out = new Float64Array(ND);
    const { C, I, gross, at } = ws;
    for (let d = 0; d < ND; d++) {
      let s = 0;
      for (let c = 0; c < C; c++) {
        if (ci != null && c !== ci) continue;
        for (let i = 0; i < I; i++) {
          if (ii != null && i !== ii) continue;
          s += gross[at(d, ri, c, i)];
        }
      }
      out[d] = s;
    }
    return out;
  };

  // day-type factors estimated from clean history
  A.factors = function (S, clean, dtype) {
    const ND = MI.cal.ND;
    const ratios = { payday: [], holiday: [], double: [] };
    for (let d = 0; d < ND; d++) {
      const t = dtype[d];
      if (t === "normal" || !clean[d]) continue;
      const nb = [];
      for (let k = -3; k <= 3; k++) {
        const j = d + 7 * k;
        if (k === 0 || j < 0 || j >= ND) continue;
        if (clean[j] && dtype[j] === "normal") nb.push(S[j]);
      }
      if (nb.length >= 2) ratios[t].push(S[d] / median(nb));
    }
    const F = { normal: 1 };
    for (const t in ratios) F[t] = ratios[t].length ? median(ratios[t]) : 1;
    return F;
  };

  A.baseline = function (S, clean, dtype, weeks) {
    const ND = MI.cal.ND;
    const F = A.factors(S, clean, dtype);
    const B = new Float64Array(ND).fill(NaN);
    for (let d = 0; d < ND; d++) {
      let refs = [];
      for (let k = 1; k <= 12 && refs.length < weeks; k++) {
        const j = d - 7 * k;
        if (j < 0) break;
        if (clean[j]) refs.push(S[j] / F[dtype[j]]);
      }
      if (refs.length < 2) {
        refs = [];
        for (let k = 1; k <= weeks; k++) {
          const j = d - 7 * k;
          if (j >= 0) refs.push(S[j] / F[dtype[j]]);
        }
      }
      if (refs.length >= 2) B[d] = median(refs) * F[dtype[d]];
    }
    // level correction: a median of past weeks lags a growing (or shrinking) business,
    // so calibrate it on the clean days of the previous 4 weeks (8 if too few)
    const L = new Float64Array(ND).fill(1);
    for (let d = 0; d < ND; d++) {
      let r = [];
      for (const span of [28, 56]) {
        r = [];
        for (let j = Math.max(0, d - span); j < d; j++) if (clean[j] && !isNaN(B[j]) && B[j] > 0) r.push(S[j] / B[j]);
        if (r.length >= 6) break;
      }
      if (r.length >= 6) L[d] = median(r);
    }
    for (let d = 0; d < ND; d++) if (!isNaN(B[d])) B[d] *= L[d];
    return { B, F, L };
  };

  // ---------- model ----------
  A.build = function (ws, S) {
    if (ws.start) MI.cal.set(ws.start, ws.nd);
    const ND = MI.cal.ND;
    const today = ND - 1;
    const R = ws.R;
    const live = ws.events.filter((e) => e.start <= today);
    live.forEach((e) => (e._win = A.window(e, S)));
    ws.events.forEach((e) => (e._win = A.window(e, S)));

    // clean masks per region
    const clean = Array.from({ length: R }, () => new Uint8Array(ND).fill(1));
    live.forEach((e) => {
      const [a, b] = e._win;
      e.regions.forEach((r) => {
        for (let d = a; d <= Math.min(b, today); d++) clean[r][d] = 0;
      });
    });

    const regS = [],
      regB = [],
      regF = [];
    for (let r = 0; r < R; r++) {
      regS[r] = A.series(ws, r);
      const { B, F } = A.baseline(regS[r], clean[r], ws.dtype, S.baselineWeeks);
      regB[r] = B;
      regF[r] = F;
    }

    const M = { ws, S, today, clean, regS, regB, regF, live, cache: {} };

    // clusters: overlapping windows that share at least one region
    const parent = {};
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    live.forEach((e) => (parent[e.id] = e.id));
    for (let i = 0; i < live.length; i++)
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i],
          b = live[j];
        if (a._win[0] <= b._win[1] && b._win[0] <= a._win[1] && a.regions.some((r) => b.regions.includes(r)))
          parent[find(a.id)] = find(b.id);
      }
    const groups = {};
    live.forEach((e) => (groups[find(e.id)] = groups[find(e.id)] || []).push(e));
    M.clusters = [];
    Object.values(groups).forEach((members) => {
      if (members.length < 2) return;
      const c = { id: "c" + members[0].id, members };
      members.forEach((m) => (m._cluster = c));
      M.clusters.push(c);
    });
    live.forEach((e) => {
      if (!members(e)) e._cluster = null;
    });
    function members(e) {
      return M.clusters.some((c) => c.members.includes(e));
    }

    // residual noise per region on clean days
    M.sigma = regS.map((Sr, r) => {
      const res = [];
      for (let d = 35; d <= today; d++) if (clean[r][d] && !isNaN(regB[r][d])) res.push(Sr[d] - regB[r][d]);
      const m = median(res);
      return 1.4826 * median(res.map((x) => Math.abs(x - m)));
    });

    M.impact = {};
    live.forEach((e) => (M.impact[e.id] = A.impact(M, [e])));
    M.clusters.forEach((c) => (M.impact[c.id] = A.impact(M, c.members)));
    return M;
  };

  // noise of an n-day total for a scope: spread of (actual − expected) summed over
  // n-day blocks of normal weeks (days clean in every scope region).
  // Using block sums captures day-to-day correlation of the errors.
  A.scopeNoise = function (M, regions, n) {
    const key = "sig:" + regions.join(",") + ":" + n;
    if (M.cache[key] != null) return M.cache[key];
    const ok = (d) => regions.every((r) => M.clean[r][d] && !isNaN(M.regB[r][d]));
    const res = (d) => regions.reduce((s, r) => s + M.regS[r][d] - M.regB[r][d], 0);
    const sums = [];
    for (let d = 35; d + n - 1 <= M.today; d++) {
      let s = 0,
        good = true;
      for (let j = d; j < d + n; j++) {
        if (!ok(j)) {
          good = false;
          break;
        }
        s += res(j);
      }
      if (good) {
        sums.push(s);
        d += Math.max(0, Math.floor(n / 2) - 1); // half-overlapping blocks
      }
    }
    let sig;
    if (sums.length >= 6) {
      const m = median(sums);
      // ×1.25: event windows lean on older reference weeks than normal days do
      sig = 1.25 * 1.4826 * median(sums.map((x) => Math.abs(x - m)));
    } else sig = Math.sqrt(regions.reduce((s, r) => s + M.sigma[r] ** 2, 0)) * Math.sqrt(n) * 1.6;
    return (M.cache[key] = sig);
  };

  // impact of one event, or of a cluster of overlapping events (pooled, not split)
  A.impact = function (M, evs) {
    const { ws, S, today, regS, regB } = M;
    const a = Math.min(...evs.map((e) => e._win[0]));
    const b0 = Math.max(...evs.map((e) => e._win[1]));
    const b = Math.min(b0, today);
    const regions = [...new Set(evs.flatMap((e) => e.regions))].sort();
    const daily = [];
    let actual = 0,
      base = 0;
    for (let d = a; d <= b; d++) {
      let s = 0,
        bb = 0;
      regions.forEach((r) => {
        s += regS[r][d];
        bb += regB[r][d];
      });
      daily.push({ d, actual: s, base: bb, lift: s - bb });
      actual += s;
      base += bb;
    }
    const lift = actual - base;
    const n = daily.length;

    const noise = A.scopeNoise(M, regions, n);
    const z = noise > 0 ? lift / noise : 0;
    const conf = z >= 2 ? "high" : z >= 1 ? "medium" : "low";

    // direct (promo-code) revenue inside the window
    let direct = 0,
      disc = 0,
      truth = 0;
    evs.forEach((e) => {
      for (let d = a; d <= b; d++) {
        const j = d - e.start;
        if (j < 0) continue;
        if (e.codeRev && e.codeRev[j]) direct += e.codeRev[j];
        if (e.codeDisc && e.codeDisc[j]) disc += e.codeDisc[j];
        if (e.truth && e.truth.daily[j]) truth += e.truth.daily[j];
      }
    });

    // commission mix: scope's sales-channel shares in the 28 days before the window
    const chTot = new Array(ws.C).fill(0);
    for (let d = Math.max(0, a - 28); d < a; d++)
      regions.forEach((r) => {
        for (let c = 0; c < ws.C; c++) for (let i = 0; i < ws.I; i++) chTot[c] += ws.gross[ws.at(d, r, c, i)];
      });
    const tot = chTot.reduce((x, y) => x + y, 0) || 1;
    const commRate = chTot.reduce((s, v, c) => s + (v / tot) * S.commission[c], 0);

    const fee = evs.reduce((s, e) => s + e.cost, 0);
    const kolDisc = evs.some((e) => e.type === "kol") ? disc : 0;
    const cost = fee + kolDisc; // promo subsidies already are the fee
    const netIncr = lift * (1 - commRate);
    const incrOrders = lift / ws.def.aov;
    const wasted = direct > 0 && direct > Math.max(lift, 0) ? 0.2 * (direct - Math.max(lift, 0)) : 0;

    return {
      a,
      b,
      b0,
      inProgress: b0 > today,
      regions,
      daily,
      actual,
      base,
      lift,
      liftPct: base > 0 ? lift / base : 0,
      direct,
      halo: lift - direct,
      disc,
      fee,
      cost,
      commRate,
      netIncr,
      iroasGross: fee > 0 ? lift / fee : null,
      iroasNet: cost > 0 ? netIncr / cost : null,
      incrOrders,
      cpio: incrOrders > 0.5 ? cost / incrOrders : null,
      noise,
      z,
      conf,
      wasted,
      truth,
      todayLift: b0 >= today && a <= today ? daily[daily.length - 1].lift : null,
      todayDay: today - a,
    };
  };

  // breakdown of an event's lift by region, sales channel and item (lazy, cached)
  A.breakdown = function (M, key, evs) {
    if (M.cache[key]) return M.cache[key];
    const { ws, S, clean, today } = M;
    const im = M.impact[key];
    const a = im.a,
      b = im.b;
    const sumLift = (Sr, Br) => {
      let s = 0,
        bb = 0;
      for (let d = a; d <= b; d++) {
        s += Sr[d];
        bb += Br[d];
      }
      return { lift: s - bb, pct: bb > 0 ? (s - bb) / bb : 0, base: bb };
    };
    const byRegion = ws.def.regions.map((rg, r) => ({
      name: rg.name,
      inScope: im.regions.includes(r),
      ...sumLift(M.regS[r], M.regB[r]),
    }));
    const byChannel = ws.def.channels.map((ch, c) => {
      let lift = 0,
        base = 0;
      im.regions.forEach((r) => {
        const Sr = A.series(ws, r, c, null);
        const { B } = A.baseline(Sr, clean[r], ws.dtype, S.baselineWeeks);
        const x = sumLift(Sr, B);
        lift += x.lift;
        base += x.base;
      });
      return { name: ch.short, lift, pct: base > 0 ? lift / base : 0 };
    });
    const byItem = ws.def.items.map((it, i) => {
      let lift = 0,
        base = 0;
      im.regions.forEach((r) => {
        const Sr = A.series(ws, r, null, i);
        const { B } = A.baseline(Sr, clean[r], ws.dtype, S.baselineWeeks);
        const x = sumLift(Sr, B);
        lift += x.lift;
        base += x.base;
      });
      return { name: it.name, lift, pct: base > 0 ? lift / base : 0, promoted: evs.some((e) => e.item === i) };
    });
    return (M.cache[key] = { byRegion, byChannel, byItem });
  };

  // totals across regions for a day range
  A.total = function (M, arr, a, b) {
    let s = 0;
    for (let d = a; d <= b; d++) for (let r = 0; r < M.ws.R; r++) s += arr[r][d];
    return s;
  };

  // gross, commission, discounts and net per sales channel in a day range
  A.salesChannels = function (M, a, b) {
    const { ws, S } = M;
    const rows = ws.def.channels.map((ch, c) => ({ name: ch.short, full: ch.name, gross: 0, comm: 0, disc: 0 }));
    for (let d = a; d <= b; d++)
      for (let r = 0; r < ws.R; r++)
        for (let c = 0; c < ws.C; c++) for (let i = 0; i < ws.I; i++) rows[c].gross += ws.gross[ws.at(d, r, c, i)];
    rows.forEach((x, c) => (x.comm = x.gross * S.commission[c]));
    if (ws.disc) {
      // imported data: discounts come straight from the sales file (day × channel)
      for (let d = a; d <= b; d++) for (let c = 0; c < ws.C; c++) rows[c].disc += ws.disc[d * ws.C + c];
    } else {
      // demo data: promo subsidy on its channel, KOL code discount spread by KOL channel mix
      M.live.forEach((e) => {
        if (!e.codeDisc) return;
        e.codeDisc.forEach((v, j) => {
          const d = e.start + j;
          if (d < a || d > b || !v) return;
          if (e.type === "promo" && e.channel != null) rows[e.channel].disc += v;
          else {
            const mix = ws.def.kolMix[e.platform] || ws.def.kolMix.IG || ws.def.channels.map((c) => c.share);
            const s = mix.reduce((x, y) => x + y, 0);
            mix.forEach((m, c) => (rows[c].disc += (v * m) / s));
          }
        });
      });
    }
    rows.forEach((x) => (x.net = x.gross - x.comm - x.disc));
    return rows;
  };

  // daily marketing spend by bucket (event fees on start day, always-on spread daily)
  A.spendDaily = function (M) {
    const ND = MI.cal.ND;
    const { ws } = M;
    const buckets = { kol: new Float64Array(ND), promo: new Float64Array(ND), ads: new Float64Array(ND), offline: new Float64Array(ND), always: new Float64Array(ND) };
    M.live.forEach((e) => {
      if (e.type === "promo") {
        const days = e.end - e.start + 1;
        for (let d = e.start; d <= Math.min(e.end, M.today); d++) buckets.promo[d] += e.cost / days;
      } else buckets[e.type][e.start] += e.cost;
    });
    ws.alwaysOn.forEach((ao) => ao.daily.forEach((v, d) => (buckets.always[d] += v)));
    return buckets;
  };

  // KOL leaderboard: incremental metrics from solo posts only (overlaps are flagged, never split)
  A.leaderboard = function (M, a, b) {
    const { ws } = M;
    return ws.kols.map((k) => {
      const posts = M.live.filter((e) => e.kolId === k.id && e.start >= a && e.start <= b);
      const solo = posts.filter((e) => !e._cluster);
      const shared = posts.filter((e) => e._cluster);
      const sum = (arr, f) => arr.reduce((s, e) => s + f(M.impact[e.id], e), 0);
      const lift = sum(solo, (im) => im.lift);
      const netIncr = sum(solo, (im) => im.netIncr);
      const cost = sum(solo, (im) => im.cost);
      const fee = sum(posts, (im, e) => e.cost);
      const direct = sum(posts, (im) => im.direct);
      const views = posts.reduce((s, e) => s + (e.views || 0), 0);
      const eng = posts.reduce((s, e) => s + (e.likes || 0) + (e.comments || 0) + (e.shares || 0), 0);
      const varSum = solo.reduce((s, e) => {
        const im = M.impact[e.id];
        return s + im.noise ** 2;
      }, 0);
      const z = varSum > 0 ? lift / Math.sqrt(varSum) : 0;
      const wasted = sum(posts, (im) => im.wasted);
      const incrOrders = lift / ws.def.aov;
      return {
        k,
        posts,
        solo,
        shared,
        fee,
        views,
        er: views ? eng / views : null,
        cpm: views ? (fee / views) * 1000 : null,
        direct,
        lift: solo.length ? lift : null,
        halo: solo.length ? lift - sum(solo, (im) => im.direct) : null,
        netIncr: solo.length ? netIncr : null,
        iroasNet: solo.length && cost > 0 ? netIncr / cost : null,
        cpio: solo.length && incrOrders > 0.5 ? cost / incrOrders : null,
        conf: !solo.length ? null : z >= 2 ? "high" : z >= 1 ? "medium" : "low",
        wasted,
      };
    }).filter((x) => x.posts.length);
  };

  // accuracy self-test against injected truth (console: MI.attr.selfTest())
  A.selfTest = function (M) {
    const rows = M.live
      .filter((e) => !e._cluster && e.truth && !M.impact[e.id].inProgress)
      .map((e) => {
        const im = M.impact[e.id];
        return { id: e.id, type: e.type, est: im.lift, truth: im.truth, err: (im.lift - im.truth) / im.truth, z: (im.lift - im.truth) / im.noise, conf: im.conf };
      });
    const high = rows.filter((r) => r.conf === "high");
    return {
      n: rows.length,
      medianAbsErrAll: median(rows.map((r) => Math.abs(r.err))),
      medianAbsErrHigh: median(high.map((r) => Math.abs(r.err))),
      nHigh: high.length,
      within2sigma: rows.filter((r) => Math.abs(r.z) <= 2).length / (rows.length || 1),
      rows,
    };
  };
})();
