/* Import real data from CSV / Excel.
   Everything runs in the viewer's browser: files are read locally, never uploaded.
   Sales rows (any granularity, even one row per transaction) are summed into the
   same day × outlet/region × sales channel × menu item cube the demo uses, so the
   attribution engine runs unchanged. */
(function () {
  const MI = (window.MI = window.MI || {});
  const cal = MI.cal;
  const DAY = cal.DAY;
  const X = (MI.importer = {});

  // ---------- field definitions (+ header synonyms for auto-mapping) ----------
  X.SALES_FIELDS = [
    { key: "date", required: true, syn: ["tanggal", "tgl", "date", "hari", "day", "waktu", "tanggal transaksi", "transaction date", "order date", "business date", "created at", "datetime"] },
    { key: "revenue", required: true, syn: ["penjualan", "omzet", "omset", "revenue", "sales", "gross sales", "penjualan kotor", "gross", "total", "total penjualan", "amount", "nominal", "subtotal", "pendapatan", "nilai", "net sales"] },
    { key: "region", syn: ["outlet", "cabang", "store", "toko", "branch", "region", "wilayah", "kota", "city", "area", "lokasi", "location", "kitchen", "dapur"] },
    { key: "channel", syn: ["channel", "kanal", "sumber", "source", "platform", "sales type", "sales channel", "tipe order", "order type", "jenis order", "aplikasi", "marketplace"] },
    { key: "item", syn: ["menu", "item", "produk", "product", "sku", "nama produk", "product name", "nama menu", "nama item", "item name"] },
    { key: "orders", syn: ["jumlah order", "order", "orders", "transaksi", "transactions", "jumlah transaksi", "qty", "quantity", "jumlah", "bill", "struk"] },
    { key: "discount", syn: ["diskon", "discount", "potongan", "promo amount", "voucher amount", "subsidi", "nilai diskon", "discount amount"] },
    { key: "code", syn: ["kode promo", "kode", "voucher", "promo code", "kode voucher", "coupon", "kupon", "code", "voucher code"] },
  ];
  X.EVENT_FIELDS = [
    { key: "date", required: true, syn: ["tanggal", "tanggal mulai", "tanggal posting", "start", "start date", "date", "posting date", "mulai", "tgl"] },
    { key: "name", required: true, syn: ["nama", "name", "kol", "handle", "influencer", "akun", "account", "campaign", "kampanye", "event", "nama event"] },
    { key: "type", syn: ["jenis", "type", "tipe", "kategori", "category", "jenis event"] },
    { key: "platform", syn: ["platform", "media", "channel", "kanal", "sosmed"] },
    { key: "cost", syn: ["biaya", "cost", "fee", "budget", "harga", "spend", "rate card", "ratecard"] },
    { key: "code", syn: ["kode promo", "kode", "voucher", "promo code", "kode voucher", "code", "coupon"] },
    { key: "end", syn: ["tanggal selesai", "selesai", "end", "end date", "sampai", "berakhir"] },
    { key: "regions", syn: ["wilayah", "region", "regions", "outlet", "cabang", "kota", "area", "target", "target wilayah", "lokasi"] },
    { key: "item", syn: ["menu", "item", "produk", "product", "menu dipromosikan", "promoted item"] },
  ];

  const norm = (h) => String(h == null ? "" : h).toLowerCase().replace(/[_\-./]+/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

  X.guessMap = function (headers, fields) {
    const H = headers.map(norm);
    const used = new Set();
    const map = {};
    fields.forEach((f) => {
      let best = -1,
        bestScore = 0;
      H.forEach((h, i) => {
        if (used.has(i) || !h) return;
        let sc = 0;
        f.syn.forEach((s, k) => {
          const w = 1 - k * 0.01; // earlier synonyms win ties
          if (h === s) sc = Math.max(sc, 3 * w);
          else if ((" " + h + " ").includes(" " + s + " ")) sc = Math.max(sc, 2 * w);
          else if (s.length >= 4 && h.includes(s)) sc = Math.max(sc, 1 * w);
        });
        if (sc > bestScore) {
          bestScore = sc;
          best = i;
        }
      });
      if (best >= 0) {
        map[f.key] = best;
        used.add(best);
      }
    });
    return map;
  };

  // ---------- file reading ----------
  X.parseCSV = function (text) {
    text = text.replace(/^﻿/, "");
    const first = text.slice(0, text.indexOf("\n") > 0 ? text.indexOf("\n") : text.length);
    const cands = [",", ";", "\t", "|"];
    let delim = ",",
      max = -1;
    cands.forEach((c) => {
      let n = 0,
        q = false;
      for (const ch of first) {
        if (ch === '"') q = !q;
        else if (ch === c && !q) n++;
      }
      if (n > max) {
        max = n;
        delim = c;
      }
    });
    const rows = [];
    let row = [],
      f = "",
      q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            f += '"';
            i++;
          } else q = false;
        } else f += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) {
        row.push(f);
        f = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(f);
        f = "";
        if (row.some((x) => x !== "")) rows.push(row);
        row = [];
      } else f += ch;
    }
    row.push(f);
    if (row.some((x) => x !== "")) rows.push(row);
    return rows;
  };

  // SheetJS is ~1 MB, so it loads only when someone picks an Excel file
  let xlsxPromise = null;
  X.ensureXLSX = function () {
    if (window.XLSX) return Promise.resolve();
    if (!xlsxPromise)
      xlsxPromise = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        s.onload = () => res();
        s.onerror = () => {
          xlsxPromise = null;
          rej(new Error("excel_unavailable"));
        };
        document.head.appendChild(s);
      });
    return xlsxPromise;
  };

  // offer a generated file: the viewer's download capability, else a plain link (local preview)
  X.download = async function (filename, text) {
    try {
      const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
      if (dl) {
        await dl.save({ filename, data: text });
        return "saved";
      }
    } catch (e) {
      if (e && e.code === "declined") return "declined";
    }
    try {
      const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return "link";
    } catch (e) {
      return "failed";
    }
  };

  X.readFile = async function (file) {
    const name = file.name || "file";
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "csv" || ext === "txt" || ext === "tsv") {
      const text = await file.text();
      return { name, sheets: [{ name, rows: X.parseCSV(text) }] };
    }
    await X.ensureXLSX();
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    return {
      name,
      sheets: wb.SheetNames.map((sn) => ({ name: sn, rows: XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: "" }).filter((r) => r.some((c) => c !== "" && c != null)) })),
    };
  };

  // first row that looks like a header (≥2 text cells), within the first 10 rows
  X.headerRow = function (rows) {
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const r = rows[i];
      const txt = r.filter((c) => typeof c === "string" && c.trim() && isNaN(Number(c.replace(/[.,\s]/g, ""))));
      if (txt.length >= 2) return i;
    }
    return 0;
  };

  // ---------- value parsing ----------
  const MONTHS = { jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mar: 3, maret: 3, march: 3, apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7, agu: 8, agt: 8, ags: 8, agustus: 8, aug: 8, august: 8, sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, oct: 10, october: 10, nov: 11, november: 11, des: 12, desember: 12, dec: 12, december: 12 };
  const pad = (n) => String(n).padStart(2, "0");
  const ok = (y, m, d) => y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;

  // decide day/month order from the sample: any first part > 12 → D/M; any second part > 12 → M/D
  X.dateOrder = function (values) {
    let dmy = 0,
      mdy = 0;
    values.forEach((v) => {
      const m = typeof v === "string" && v.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
      if (!m) return;
      if (+m[1] > 12) dmy++;
      if (+m[2] > 12) mdy++;
    });
    if (mdy > dmy) return { order: "mdy", ambiguous: false };
    return { order: "dmy", ambiguous: dmy === 0 && values.some((v) => typeof v === "string" && /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(v.trim())) };
  };

  X.parseDate = function (v, order) {
    if (v == null || v === "") return null;
    if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
    if (typeof v === "number") {
      if (v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * DAY).toISOString().slice(0, 10); // Excel serial
      return null;
    }
    const s = String(v).trim();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return ok(+m[1], +m[2], +m[3]) ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : null;
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (m) {
      let y = +m[3];
      if (y < 100) y += 2000;
      const [d, mo] = order === "mdy" ? [+m[2], +m[1]] : [+m[1], +m[2]];
      return ok(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
    }
    m = s.match(/^(?:[A-Za-z]+,?\s+)?(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})/);
    if (m && MONTHS[m[2].toLowerCase()]) return ok(+m[3], MONTHS[m[2].toLowerCase()], +m[1]) ? `${m[3]}-${pad(MONTHS[m[2].toLowerCase()])}-${pad(m[1])}` : null;
    m = s.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
    if (m && MONTHS[m[1].toLowerCase()]) return ok(+m[3], MONTHS[m[1].toLowerCase()], +m[2]) ? `${m[3]}-${pad(MONTHS[m[1].toLowerCase()])}-${pad(m[2])}` : null;
    return null;
  };

  // "Rp 1.250.000" · "1,250,000" · "1.250.000,50" · "(25.000)" · 1250000
  X.parseNum = function (v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    let s = String(v).trim();
    let neg = false;
    if (/^\(.*\)$/.test(s)) {
      neg = true;
      s = s.slice(1, -1);
    }
    s = s.replace(/rp|idr/gi, "").replace(/[\s ]/g, "");
    if (s.startsWith("-") || s.startsWith("−")) {
      neg = !neg;
      s = s.slice(1);
    }
    const hasDot = s.includes("."),
      hasComma = s.includes(",");
    if (hasDot && hasComma) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (hasDot) {
      if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    } else if (hasComma) {
      s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
    }
    if (!/^\d*\.?\d+$/.test(s)) return null;
    const n = parseFloat(s);
    return isFinite(n) ? (neg ? -n : n) : null;
  };

  const cellText = (v) => (v == null ? "" : v instanceof Date ? X.parseDate(v) : String(v).trim());

  // ---------- rows → records ----------
  X.readSales = function (rows, hdr, map, forced) {
    const body = rows.slice(hdr + 1);
    const ord = forced || X.dateOrder(body.slice(0, 2000).map((r) => r[map.date]));
    const out = [];
    const skipped = { date: 0, revenue: 0 };
    const examples = [];
    body.forEach((r, i) => {
      const date = X.parseDate(r[map.date], ord.order);
      const rev = X.parseNum(r[map.revenue]);
      if (!date || rev == null) {
        if (!date) skipped.date++;
        else skipped.revenue++;
        if (examples.length < 3) examples.push({ row: hdr + i + 2, value: !date ? r[map.date] : r[map.revenue], field: !date ? "date" : "revenue" });
        return;
      }
      out.push({
        date,
        region: map.region != null ? cellText(r[map.region]) || null : null,
        channel: map.channel != null ? cellText(r[map.channel]) || null : null,
        item: map.item != null ? cellText(r[map.item]) || null : null,
        revenue: rev,
        orders: map.orders != null ? X.parseNum(r[map.orders]) || 0 : null,
        discount: map.discount != null ? Math.abs(X.parseNum(r[map.discount]) || 0) : null,
        code: map.code != null ? cellText(r[map.code]).toUpperCase() || null : null,
      });
    });
    return { rows: out, skipped, examples, dateOrder: ord, total: body.length };
  };

  const TYPE_SYN = {
    kol: ["kol", "post kol", "kol post", "influencer", "endorse", "endorsement", "creator", "konten", "content"],
    promo: ["promo", "promo aplikasi", "app promo", "diskon", "discount", "voucher", "flash sale", "cashback"],
    ads: ["ads", "ad", "iklan", "iklan burst", "ad burst", "meta", "meta ads", "tiktok ads", "google ads", "grabads", "gofood ads", "paid"],
    offline: ["offline", "sampling", "event", "activation", "aktivasi", "bazaar", "banner", "pameran"],
  };
  X.normType = function (v, name) {
    const s = norm(v);
    for (const t in TYPE_SYN) if (TYPE_SYN[t].includes(s)) return t;
    for (const t in TYPE_SYN) if (TYPE_SYN[t].some((x) => x.length > 3 && s.includes(x))) return t;
    return String(name || "").trim().startsWith("@") ? "kol" : s ? "promo" : "kol";
  };
  X.normPlatform = function (v) {
    const s = norm(v);
    if (!s) return null;
    if (s === "ig" || s.includes("instagram") || s === "reels") return "IG";
    if (s === "tiktok" || s === "tt" || s === "tik tok") return "TikTok";
    if (s.includes("youtube") || s === "yt") return "YouTube";
    return String(v).trim();
  };

  X.readEvents = function (rows, hdr, map, forced) {
    const body = rows.slice(hdr + 1);
    const ord = forced || X.dateOrder(body.slice(0, 500).map((r) => r[map.date]));
    const out = [];
    const skipped = { date: 0, name: 0 };
    const examples = [];
    body.forEach((r, i) => {
      const date = X.parseDate(r[map.date], ord.order);
      const name = cellText(r[map.name]);
      if (!date || !name) {
        if (!date) skipped.date++;
        else skipped.name++;
        if (examples.length < 3) examples.push({ row: hdr + i + 2, value: !date ? r[map.date] : r[map.name], field: !date ? "date" : "name" });
        return;
      }
      out.push({
        date,
        end: map.end != null ? X.parseDate(r[map.end], ord.order) : null,
        name,
        type: X.normType(map.type != null ? r[map.type] : "", name),
        platform: map.platform != null ? X.normPlatform(r[map.platform]) : null,
        cost: map.cost != null ? Math.max(0, X.parseNum(r[map.cost]) || 0) : 0,
        code: map.code != null ? cellText(r[map.code]).toUpperCase() || null : null,
        regions: map.regions != null ? cellText(r[map.regions]) : "",
        item: map.item != null ? cellText(r[map.item]) : "",
      });
    });
    return { rows: out, skipped, examples, dateOrder: ord, total: body.length };
  };

  // ---------- records → workspace ----------
  const COMMISSION = [
    [/gofood|grabfood|shopeefood|gojek|grab|maxim|airasia food/i, 0.2],
    [/tiktok/i, 0.08],
    [/shopee|lazada/i, 0.09],
    [/tokopedia|blibli|bukalapak/i, 0.07],
    [/distribut|reseller|retail|agen|grosir|wholesale/i, 0.25],
  ];
  const guessCommission = (name) => {
    for (const [re, v] of COMMISSION) if (re.test(name)) return v;
    return 0;
  };
  const KIND_AOV = { cafe: 50000, cpg: 75000, cloud: 38000 };
  const LIMIT = { region: 24, channel: 10, item: 15 };
  const MAX_DAYS = 1100;

  X.MIN_DAYS = 35;

  X.buildWorkspace = function (o) {
    const { name, kind, sales, events, labels } = o;
    const warnings = [];
    const prev = { start: cal.START, nd: cal.ND };
    let rows = sales.rows;
    let maxD = "",
      minD = "9999";
    rows.forEach((r) => {
      if (r.date > maxD) maxD = r.date;
      if (r.date < minD) minD = r.date;
    });
    const end = Date.parse(maxD + "T00:00:00Z");
    let start = Date.parse(minD + "T00:00:00Z");
    let nd = Math.round((end - start) / DAY) + 1;
    if (nd > MAX_DAYS) {
      start = end - (MAX_DAYS - 1) * DAY;
      nd = MAX_DAYS;
      const cut = new Date(start).toISOString().slice(0, 10);
      rows = rows.filter((r) => r.date >= cut);
      warnings.push({ key: "w_trimmed", vars: { d: MAX_DAYS } });
    }
    cal.set(start, nd);

    // dimension lists: biggest values first, the long tail folded into "Other"
    const dim = (key, single) => {
      const tot = new Map();
      rows.forEach((r) => {
        const v = r[key];
        if (v != null) tot.set(v, (tot.get(v) || 0) + r.revenue);
      });
      if (!tot.size) return { list: [single], index: () => 0, folded: 0 };
      const sorted = [...tot.entries()].sort((a, b) => b[1] - a[1]).map((x) => x[0]);
      const lim = LIMIT[key];
      const keep = sorted.length > lim ? sorted.slice(0, lim - 1) : sorted;
      const folded = sorted.length - keep.length;
      const list = folded ? keep.concat([labels.other]) : keep.slice();
      const pos = new Map(keep.map((v, i) => [v, i]));
      const fallback = folded ? list.length - 1 : null;
      return { list, index: (v) => (v == null ? (fallback != null ? fallback : 0) : pos.has(v) ? pos.get(v) : fallback != null ? fallback : 0), folded };
    };
    const dR = dim("region", labels.allRegions),
      dC = dim("channel", labels.allChannels),
      dI = dim("item", labels.allItems);
    if (dR.folded) warnings.push({ key: "w_folded", vars: { n: dR.folded, what: labels.regionWord } });
    if (dC.folded) warnings.push({ key: "w_folded", vars: { n: dC.folded, what: labels.channelWord } });
    if (dI.folded) warnings.push({ key: "w_folded", vars: { n: dI.folded, what: labels.itemWord } });
    const R = dR.list.length,
      C = dC.list.length,
      I = dI.list.length;
    const gross = new Float64Array(nd * R * C * I);
    const at = (d, ri, ci, ii) => ((d * R + ri) * C + ci) * I + ii;
    const hasDisc = rows.some((r) => r.discount != null);
    const disc = hasDisc ? new Float64Array(nd * C) : null;
    const codes = new Map();
    const dayHas = new Uint8Array(nd);
    let revenue = 0,
      orders = 0;
    const rTot = new Array(R).fill(0),
      cTot = new Array(C).fill(0),
      iTot = new Array(I).fill(0);
    rows.forEach((r) => {
      const d = cal.idx(r.date);
      if (d < 0 || d >= nd) return;
      const ri = dR.index(r.region),
        ci = dC.index(r.channel),
        ii = dI.index(r.item);
      gross[at(d, ri, ci, ii)] += r.revenue;
      dayHas[d] = 1;
      revenue += r.revenue;
      orders += r.orders || 0;
      rTot[ri] += r.revenue;
      cTot[ci] += r.revenue;
      iTot[ii] += r.revenue;
      if (disc && r.discount) disc[d * C + ci] += r.discount;
      if (r.code) {
        let c = codes.get(r.code);
        if (!c) codes.set(r.code, (c = { rev: new Map(), disc: new Map() }));
        c.rev.set(d, (c.rev.get(d) || 0) + r.revenue);
        if (r.discount) c.disc.set(d, (c.disc.get(d) || 0) + r.discount);
      }
    });
    const missing = nd - dayHas.reduce((s, x) => s + x, 0);
    if (missing > 0) warnings.push({ key: "w_missing", vars: { n: missing } });
    if (nd < 56) warnings.push({ key: "w_short", vars: { n: nd } });
    if (sales.dateOrder && sales.dateOrder.ambiguous) warnings.push({ key: "w_ambiguous" });
    const share = (arr) => {
      const s = arr.reduce((a, b) => a + b, 0) || 1;
      return arr.map((x) => Math.max(0.0001, x / s));
    };
    const chShare = share(cTot);
    const kindName = labels.kinds[kind];
    const def = {
      id: "imp-" + Date.now().toString(36),
      name,
      kind,
      imported: true,
      kindLabel: { id: "Data impor · " + kindName.id, en: "Imported · " + kindName.en },
      aov: orders > 0 ? revenue / orders : KIND_AOV[kind],
      codePrefix: "",
      regions: dR.list.map((n, i) => ({ name: n, share: share(rTot)[i] })),
      channels: dC.list.map((n, i) => ({ name: n, short: n, share: chShare[i], commission: guessCommission(n) })),
      items: dI.list.map((n, i) => ({ name: n, share: share(iTot)[i] })),
      kolMix: { IG: chShare, TikTok: chShare },
      adsMix: chShare,
    };
    if (!(orders > 0)) warnings.push({ key: "w_no_orders", vars: { aov: def.aov } });

    // events
    const kols = [];
    const evs = [];
    let nextId = 0,
      evSkipped = 0,
      codeMatched = 0,
      codeMissing = 0;
    const findRegions = (txt) => {
      const s = String(txt || "").trim();
      if (!s || /^(semua|all|nasional|national|\*)$/i.test(s)) return dR.list.map((_, i) => i);
      const parts = s.split(/[;,|/]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
      const hit = dR.list.map((n, i) => (parts.some((p) => n.toLowerCase() === p || n.toLowerCase().includes(p)) ? i : -1)).filter((i) => i >= 0);
      return hit.length ? hit : dR.list.map((_, i) => i);
    };
    const findItem = (txt) => {
      const s = String(txt || "").trim().toLowerCase();
      if (!s) return null;
      const i = dI.list.findIndex((n) => n.toLowerCase() === s);
      return i >= 0 ? i : (j => (j >= 0 ? j : null))(dI.list.findIndex((n) => n.toLowerCase().includes(s)));
    };
    (events ? events.rows : []).forEach((r) => {
      const s = cal.idx(r.date);
      if (s < 0) {
        evSkipped++;
        return;
      }
      const e = { id: "e" + nextId++, type: r.type, start: s, end: s, cost: r.cost, regions: findRegions(r.regions), item: findItem(r.item), views: null, likes: null, comments: null, shares: null, code: r.code };
      if (r.end && r.type !== "kol") e.end = Math.max(s, cal.idx(r.end));
      if (r.type === "kol") {
        const h = r.name.startsWith("@") ? r.name : "@" + r.name.replace(/\s+/g, "").toLowerCase();
        let k = kols.find((x) => x.handle.toLowerCase() === h.toLowerCase());
        if (!k) {
          k = { id: def.id + "-k" + kols.length, i: kols.length, handle: h, platform: r.platform || "IG", tier: "—", followers: 0, regions: e.regions.slice(), fee: r.cost, posts: [] };
          kols.push(k);
        }
        e.kolId = k.id;
        e.platform = r.platform || k.platform;
        k.posts.push(e.id);
      } else {
        e.name = { id: r.name, en: r.name };
        e.platform = r.platform || (r.type === "ads" ? "Ads" : r.type === "offline" ? "Offline" : "Promo");
        if (r.type === "promo") {
          const p = String(r.platform || r.name).toLowerCase();
          const ci = dC.list.findIndex((n) => p.includes(n.toLowerCase()) || n.toLowerCase().includes(p));
          e.channel = ci >= 0 ? ci : null;
        }
      }
      if (e.code) {
        const c = codes.get(e.code);
        if (c) {
          codeMatched++;
          e.codeRev = [];
          e.codeDisc = [];
          for (let j = 0; j < 45; j++) {
            e.codeRev[j] = c.rev.get(s + j) || 0;
            e.codeDisc[j] = c.disc.get(s + j) || 0;
          }
        } else if (s <= nd - 1) codeMissing++;
      }
      evs.push(e);
    });
    if (codeMissing) warnings.push({ key: "w_code_missing", vars: { n: codeMissing } });
    evs.sort((a, b) => a.start - b.start);

    const ws = {
      def,
      id: def.id,
      name,
      kind,
      imported: true,
      R,
      C,
      I,
      gross,
      at,
      disc,
      dtype: Array.from({ length: nd + 120 }, (_, i) => cal.dayType(i, kind)),
      kols,
      events: evs,
      alwaysOn: [],
      nextId,
      start,
      nd,
    };
    ws.report = { rows: rows.length, revenue, start: cal.iso(0), end: cal.iso(nd - 1), nd, R, C, I, events: evs.length, kols: kols.length, evSkipped, codeMatched, hasDisc, hasOrders: orders > 0, warnings };
    cal.set(prev.start, prev.nd);
    return ws;
  };

  X.register = function (ws) {
    MI.imported[ws.id] = ws;
  };
  X.remove = function (id) {
    delete MI.imported[id];
    X.forget(id);
  };

  // ---------- keep on this device (localStorage, opt-in) ----------
  const KEY = "mi:imported";
  X.serialize = function (ws) {
    const idx = [],
      val = [];
    ws.gross.forEach((v, i) => {
      if (v) {
        idx.push(i);
        val.push(Math.round(v));
      }
    });
    const strip = (e) => {
      const o = {};
      for (const k in e) if (k[0] !== "_" && k !== "truth") o[k] = e[k];
      return o;
    };
    return JSON.stringify({ v: 1, def: ws.def, R: ws.R, C: ws.C, I: ws.I, start: ws.start, nd: ws.nd, idx, val, disc: ws.disc ? Array.from(ws.disc, Math.round) : null, kols: ws.kols, events: ws.events.map(strip), nextId: ws.nextId, report: ws.report });
  };
  X.restore = function (json) {
    const o = JSON.parse(json);
    const prev = { start: cal.START, nd: cal.ND };
    cal.set(o.start, o.nd);
    const gross = new Float64Array(o.nd * o.R * o.C * o.I);
    o.idx.forEach((i, k) => (gross[i] = o.val[k]));
    const { R, C, I } = o;
    const ws = {
      def: o.def,
      id: o.def.id,
      name: o.def.name,
      kind: o.def.kind,
      imported: true,
      R,
      C,
      I,
      gross,
      at: (d, ri, ci, ii) => ((d * R + ri) * C + ci) * I + ii,
      disc: o.disc ? Float64Array.from(o.disc) : null,
      dtype: Array.from({ length: o.nd + 120 }, (_, i) => cal.dayType(i, o.def.kind)),
      kols: o.kols,
      events: o.events,
      alwaysOn: [],
      nextId: o.nextId,
      start: o.start,
      nd: o.nd,
      report: o.report,
    };
    cal.set(prev.start, prev.nd);
    return ws;
  };
  X.save = function (ws) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "{}");
      all[ws.id] = X.serialize(ws);
      const s = JSON.stringify(all);
      if (s.length > 4.5e6) return false;
      localStorage.setItem(KEY, s);
      return true;
    } catch (e) {
      return false;
    }
  };
  X.forget = function (id) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "{}");
      delete all[id];
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) {}
  };
  X.isSaved = function (id) {
    try {
      return !!JSON.parse(localStorage.getItem(KEY) || "{}")[id];
    } catch (e) {
      return false;
    }
  };
  X.loadSaved = function () {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "{}");
      for (const id in all) {
        try {
          X.register(X.restore(all[id]));
        } catch (e) {}
      }
    } catch (e) {}
  };

  // ---------- CSV writing: templates and a full example built from the demo café ----------
  const csvCell = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  X.toCSV = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";

  X.TEMPLATE_SALES = [
    ["tanggal", "outlet", "channel", "menu", "penjualan", "jumlah_order", "diskon", "kode_promo"],
    ["07/10/2026", "Jakarta - Kemang", "Dine-in", "Es Kopi Susu", "1250000", "48", "0", ""],
    ["07/10/2026", "Jakarta - Kemang", "GoFood", "Es Kopi Susu", "830000", "29", "0", ""],
    ["07/10/2026", "Jakarta - Kemang", "GoFood", "Es Kopi Susu", "212000", "8", "42400", "SENJARARA"],
  ];
  X.TEMPLATE_EVENTS = [
    ["tanggal", "tanggal_selesai", "jenis", "nama", "platform", "biaya", "kode_promo", "wilayah", "menu"],
    ["07/10/2026", "", "KOL", "@rara.ngopi", "Instagram", "6000000", "SENJARARA", "Jakarta - Kemang", "Es Kopi Susu"],
    ["25/10/2026", "29/10/2026", "Promo", "Promo Gajian GoFood 25%", "GoFood", "26000000", "", "Semua", ""],
    ["15/06/2026", "24/06/2026", "Iklan", "Meta Ads - Launch Kopi Pandan", "Meta", "32000000", "", "Semua", "Kopi Pandan"],
  ];

  X.sampleFiles = function () {
    const prev = { start: cal.START, nd: cal.ND };
    const ws = MI.getWorkspace("kopi");
    cal.set(ws.start, ws.nd);
    const D = ws.def;
    const dmy = (i) => {
      const s = cal.iso(i);
      return s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4);
    };
    // copy the cube, then move promo-code sales into their own rows
    const g = Float64Array.from(ws.gross);
    const discCell = new Float64Array(g.length);
    const extra = [];
    ws.events.forEach((e) => {
      if (e.start > ws.nd - 1 || !e.codeDisc) return;
      e.codeDisc.forEach((dv, j) => {
        const d = e.start + j;
        if (d > ws.nd - 1) return;
        if (e.type === "kol" && e.codeRev[j]) {
          const r = e.regions[0],
            c = 1 + (j % (ws.C - 1)),
            i = e.item;
          const cell = ws.at(d, r, c, i);
          const rev = Math.min(e.codeRev[j], g[cell] * 0.9);
          g[cell] -= rev;
          extra.push([dmy(d), D.regions[r].name, D.channels[c].name, D.items[i].name, Math.round(rev), Math.max(1, Math.round(rev / D.aov)), Math.round(rev * 0.2), e.code]);
        } else if (e.type === "promo" && e.channel != null) {
          // spread the subsidy over that channel's rows for the day
          let tot = 0;
          for (let r = 0; r < ws.R; r++) for (let i = 0; i < ws.I; i++) tot += g[ws.at(d, r, e.channel, i)];
          for (let r = 0; r < ws.R; r++) for (let i = 0; i < ws.I; i++) {
            const cell = ws.at(d, r, e.channel, i);
            discCell[cell] += (dv * g[cell]) / (tot || 1);
          }
        }
      });
    });
    const sales = [X.TEMPLATE_SALES[0]];
    for (let d = 0; d < ws.nd; d++)
      for (let r = 0; r < ws.R; r++)
        for (let c = 0; c < ws.C; c++)
          for (let i = 0; i < ws.I; i++) {
            const cell = ws.at(d, r, c, i);
            const v = Math.round(g[cell]);
            sales.push([dmy(d), D.regions[r].name, D.channels[c].name, D.items[i].name, v, Math.max(1, Math.round(v / D.aov)), Math.round(discCell[cell]), ""]);
          }
    extra.forEach((x) => sales.push(x));
    const typeName = { kol: "KOL", promo: "Promo", ads: "Iklan", offline: "Offline" };
    const evRows = [X.TEMPLATE_EVENTS[0]];
    ws.events.forEach((e) => {
      const k = e.kolId ? ws.kols.find((x) => x.id === e.kolId) : null;
      evRows.push([dmy(e.start), e.end > e.start ? dmy(e.end) : "", typeName[e.type], k ? k.handle : e.name.id, e.platform === "IG" ? "Instagram" : e.platform, e.cost, e.code || "", e.regions.length === ws.R ? "Semua" : e.regions.map((r) => D.regions[r].name).join("; "), e.item != null ? D.items[e.item].name : ""]);
    });
    cal.set(prev.start, prev.nd);
    return { sales: X.toCSV(sales), events: X.toCSV(evRows) };
  };
})();
