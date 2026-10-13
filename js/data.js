/* Seeded mock data for three demo workspaces.
   Sales are a daily cube: day × region × sales channel × menu item (gross Rupiah).
   Every past marketing event injects a known "true" lift so the attribution
   engine can be checked against ground truth (ev.truth). */
(function () {
  const MI = (window.MI = window.MI || {});

  // ---------- calendar ----------
  // Day indices are relative to the active workspace's first day of data.
  // cal.set() switches the range (demo workspaces and imported data differ).
  const DAY = 86400000;
  const DEMO_START = Date.UTC(2026, 3, 1); // 1 Apr 2026
  const DEMO_END = Date.UTC(2026, 9, 13); // 13 Oct 2026
  const DEMO_ND = Math.round((DEMO_END - DEMO_START) / DAY) + 1;
  const cal = { DAY, START: DEMO_START, ND: DEMO_ND };
  const iso = (i) => new Date(cal.START + i * DAY).toISOString().slice(0, 10);
  const idx = (s) => Math.round((Date.parse(s + "T00:00:00Z") - cal.START) / DAY);
  const dateOf = (i) => new Date(cal.START + i * DAY);
  const dow = (i) => dateOf(i).getUTCDay();
  const dom = (i) => dateOf(i).getUTCDate();
  const mon = (i) => dateOf(i).getUTCMonth();
  const year = (i) => dateOf(i).getUTCFullYear();
  const ym = (i) => year(i) * 12 + mon(i); // absolute month number

  // Indonesian national holidays (approximate dates; Islamic dates can shift by a day)
  const HOLIDAYS = [
    ["2024-01-01", "Tahun Baru", "New Year"],
    ["2024-02-08", "Isra Mikraj", "Isra Mi'raj"],
    ["2024-02-10", "Imlek", "Lunar New Year"],
    ["2024-03-11", "Nyepi", "Nyepi"],
    ["2024-03-29", "Jumat Agung", "Good Friday"],
    ["2024-04-10", "Idul Fitri", "Eid al-Fitr"],
    ["2024-04-11", "Idul Fitri", "Eid al-Fitr"],
    ["2024-05-01", "Hari Buruh", "Labour Day"],
    ["2024-05-09", "Kenaikan Isa Almasih", "Ascension Day"],
    ["2024-05-23", "Waisak", "Vesak"],
    ["2024-06-01", "Hari Lahir Pancasila", "Pancasila Day"],
    ["2024-06-17", "Idul Adha", "Eid al-Adha"],
    ["2024-07-07", "Tahun Baru Islam", "Islamic New Year"],
    ["2024-08-17", "HUT RI", "Independence Day"],
    ["2024-09-16", "Maulid Nabi", "Prophet's Birthday"],
    ["2024-12-25", "Natal", "Christmas"],
    ["2025-01-01", "Tahun Baru", "New Year"],
    ["2025-01-27", "Isra Mikraj", "Isra Mi'raj"],
    ["2025-01-29", "Imlek", "Lunar New Year"],
    ["2025-03-29", "Nyepi", "Nyepi"],
    ["2025-03-31", "Idul Fitri", "Eid al-Fitr"],
    ["2025-04-01", "Idul Fitri", "Eid al-Fitr"],
    ["2025-04-18", "Jumat Agung", "Good Friday"],
    ["2025-05-01", "Hari Buruh", "Labour Day"],
    ["2025-05-12", "Waisak", "Vesak"],
    ["2025-05-29", "Kenaikan Isa Almasih", "Ascension Day"],
    ["2025-06-01", "Hari Lahir Pancasila", "Pancasila Day"],
    ["2025-06-06", "Idul Adha", "Eid al-Adha"],
    ["2025-06-27", "Tahun Baru Islam", "Islamic New Year"],
    ["2025-08-17", "HUT RI", "Independence Day"],
    ["2025-09-05", "Maulid Nabi", "Prophet's Birthday"],
    ["2025-12-25", "Natal", "Christmas"],
    ["2026-01-01", "Tahun Baru", "New Year"],
    ["2026-01-16", "Isra Mikraj", "Isra Mi'raj"],
    ["2026-02-17", "Imlek", "Lunar New Year"],
    ["2026-03-19", "Nyepi", "Nyepi"],
    ["2026-03-20", "Idul Fitri", "Eid al-Fitr"],
    ["2026-03-21", "Idul Fitri", "Eid al-Fitr"],
    ["2026-04-03", "Jumat Agung", "Good Friday"],
    ["2026-05-01", "Hari Buruh", "Labour Day"],
    ["2026-05-14", "Kenaikan Isa Almasih", "Ascension Day"],
    ["2026-05-27", "Idul Adha", "Eid al-Adha"],
    ["2026-05-31", "Waisak", "Vesak"],
    ["2026-06-01", "Hari Lahir Pancasila", "Pancasila Day"],
    ["2026-06-16", "Tahun Baru Islam", "Islamic New Year"],
    ["2026-08-17", "HUT RI", "Independence Day"],
    ["2026-08-25", "Maulid Nabi", "Prophet's Birthday"],
    ["2026-12-25", "Natal", "Christmas"],
  ];
  let holidaySet = new Set();
  cal.set = function (start, nd) {
    cal.START = start;
    cal.ND = nd;
    holidaySet = new Set(HOLIDAYS.map((h) => idx(h[0])));
  };
  cal.set(DEMO_START, DEMO_ND);

  // day type drives the baseline adjustment factors
  function dayType(i, kind) {
    if (holidaySet.has(i)) return "holiday";
    if (kind === "cpg" && dom(i) === mon(i) + 1) return "double"; // 5.5, 6.6 … 12.12
    const d = dom(i);
    if (d >= 25 || d === 1) return "payday";
    return "normal";
  }

  // ---------- seeded random ----------
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    const u = mulberry32(seed);
    return {
      u,
      n() {
        let a = 0;
        while (!a) a = u();
        return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * u());
      },
      range: (a, b) => a + (b - a) * u(),
      int: (a, b) => Math.floor(a + (b - a + 1) * u()),
    };
  }

  // decay of a KOL post's effect (share of total lift per day after posting)
  const DECAY = {
    TikTok: [0.2, 0.3, 0.2, 0.13, 0.08, 0.05, 0.04],
    IG: [0.13, 0.21, 0.18, 0.14, 0.11, 0.09, 0.07, 0.04, 0.03],
  };

  // ---------- workspace definitions ----------
  const DEFS = [
    {
      id: "kopi",
      name: "Kopi Senja",
      kind: "cafe",
      seed: 11,
      kindLabel: { id: "Kafe · 8 outlet", en: "Café chain · 8 outlets" },
      base: 86e6,
      aov: 52000,
      growth: 0.14,
      codePrefix: "SENJA",
      regions: [
        { name: "Jakarta", share: 0.52, outlets: 4 },
        { name: "Bandung", share: 0.26, outlets: 2 },
        { name: "Surabaya", share: 0.22, outlets: 2 },
      ],
      channels: [
        { name: "Dine-in / Takeaway", short: "POS", share: 0.46, commission: 0 },
        { name: "GoFood", short: "GoFood", share: 0.24, commission: 0.2 },
        { name: "GrabFood", short: "GrabFood", share: 0.2, commission: 0.2 },
        { name: "ShopeeFood", short: "ShopeeFood", share: 0.1, commission: 0.2 },
      ],
      items: [
        { name: "Es Kopi Susu Senja", share: 0.34 },
        { name: "Kopi Pandan", share: 0.16 },
        { name: "Matcha Latte", share: 0.16 },
        { name: "Croissant Abon", share: 0.14 },
        { name: "Rice Bowl Sambal Matah", share: 0.2 },
      ],
      weekday: [1.24, 0.84, 0.88, 0.92, 0.96, 1.08, 1.3],
      payday: 1.12,
      holiday: [1.22, 0.98, 0.98, 0.98],
      double: [1, 1, 1, 1],
      kolMix: { TikTok: [0.4, 0.27, 0.22, 0.11], IG: [0.5, 0.23, 0.18, 0.09] },
      adsMix: [0.35, 0.3, 0.25, 0.1],
      gap: [4, 7],
      kols: [
        { h: "rara.ngopi", p: "IG", tier: "micro", f: 48e3, reg: [0], fee: 6e6, eff: 6.0, cs: 0.3, code: "RARA" },
        { h: "jajanbarengdimas", p: "TikTok", tier: "macro", f: 420e3, reg: [0], fee: 25e6, eff: 3.0, cs: 0.22, code: "DIMAS" },
        { h: "kulinerbdg.harian", p: "IG", tier: "micro", f: 61e3, reg: [1], fee: 5e6, eff: 4.2, cs: 0.28, code: "BDGHARIAN" },
        { h: "sobatngopi.sby", p: "TikTok", tier: "micro", f: 37e3, reg: [2], fee: 4e6, eff: 3.6, cs: 0.25, code: "SOBAT" },
        { h: "makanterus.official", p: "TikTok", tier: "mega", f: 2.4e6, reg: [0, 1, 2], fee: 90e6, eff: 1.15, cs: 0.18, code: "MAKANTERUS" },
        { h: "nadiacicip", p: "IG", tier: "macro", f: 310e3, reg: [0], fee: 18e6, eff: 1.7, cs: 0.2, code: "NADIA" },
        { h: "promohunter.jkt", p: "IG", tier: "micro", f: 72e3, reg: [0], fee: 7e6, eff: 0.6, cs: 0.55, cannibal: 2.2, code: "HUNTER" },
        { h: "ngopisore.bdg", p: "TikTok", tier: "nano", f: 8.4e3, reg: [1], fee: 1.2e6, eff: 3.5, cs: 0.3, code: "SORE" },
        { h: "anakkos.jajan", p: "TikTok", tier: "nano", f: 6.1e3, reg: [0], fee: 0.8e6, eff: 4.0, cs: 0.35, code: "ANAKKOS" },
        { h: "bundakuliner.sby", p: "IG", tier: "micro", f: 54e3, reg: [2], fee: 5e6, eff: 2.1, cs: 0.24, code: "BUNDA" },
        { h: "rakareview", p: "TikTok", tier: "macro", f: 190e3, reg: [1], fee: 15e6, eff: 2.6, cs: 0.2, code: "RAKA" },
        { h: "tastejkt.id", p: "TikTok", tier: "micro", f: 83e3, reg: [0], fee: 8e6, eff: 2.0, cs: 0.22, code: "TASTE" },
      ],
      recent: [
        [0, "2026-10-07", 1],
        [3, "2026-10-03", 0],
        [10, "2026-10-11", 4],
      ],
      campaigns: [
        { type: "promo", name: { id: "Promo Gajian GoFood 30%", en: "GoFood payday promo 30%" }, ch: 1, start: "2026-05-25", days: 5, cost: 28e6, eff: 1.6 },
        { type: "promo", name: { id: "GrabFood Diskon Ongkir", en: "GrabFood free delivery" }, ch: 2, start: "2026-07-10", days: 4, cost: 16e6, eff: 2.1 },
        { type: "promo", name: { id: "Promo Gajian GoFood 25%", en: "GoFood payday promo 25%" }, ch: 1, start: "2026-08-25", days: 5, cost: 26e6, eff: 1.3 },
        { type: "promo", name: { id: "ShopeeFood Flash Sale 9.9", en: "ShopeeFood 9.9 flash sale" }, ch: 3, start: "2026-09-09", days: 2, cost: 9e6, eff: 2.4 },
        { type: "ads", platform: "Meta", name: { id: "Meta Ads — Launch Kopi Pandan", en: "Meta Ads — Kopi Pandan launch" }, start: "2026-06-15", days: 10, cost: 32e6, eff: 2.0, item: 1 },
        { type: "offline", platform: "Offline", name: { id: "Sampling di mal Bandung", en: "Mall sampling, Bandung" }, start: "2026-08-08", days: 2, cost: 6e6, eff: 2.8, reg: [1], item: 2 },
      ],
      planned: [
        [5, "2026-10-16"],
        [2, "2026-10-18"],
        [1, "2026-10-23"],
        [8, "2026-10-28"],
        { type: "promo", name: { id: "Promo Gajian GoFood 25%", en: "GoFood payday promo 25%" }, ch: 1, start: "2026-10-25", days: 5, cost: 26e6 },
        [11, "2026-11-04"],
      ],
      alwaysOn: [
        { name: "Meta Ads", platform: "Meta", monthly: 30e6, claimed: 4.8 },
        { name: "TikTok Ads", platform: "TikTok Ads", monthly: 15e6, claimed: 3.9 },
      ],
    },
    {
      id: "keripik",
      name: "Keripik Nusantara",
      kind: "cpg",
      seed: 23,
      kindLabel: { id: "Makanan kemasan · online", en: "Packaged snacks · online" },
      base: 48e6,
      aov: 76000,
      growth: 0.24,
      codePrefix: "KN",
      regions: [
        { name: "Jabodetabek", share: 0.38 },
        { name: "Jawa Barat", share: 0.2 },
        { name: "Jawa Timur", share: 0.2 },
        { name: "Luar Jawa", share: 0.22 },
      ],
      channels: [
        { name: "Shopee", short: "Shopee", share: 0.32, commission: 0.09 },
        { name: "Tokopedia", short: "Tokopedia", share: 0.18, commission: 0.07 },
        { name: "TikTok Shop", short: "TikTok Shop", share: 0.28, commission: 0.08 },
        { name: "Distributor / Retail", short: "Distributor", share: 0.22, commission: 0.25 },
      ],
      items: [
        { name: "Keripik Pedas Level 5", share: 0.35 },
        { name: "Keripik Balado", share: 0.25 },
        { name: "Makaroni Daun Jeruk", share: 0.22 },
        { name: "Paket Hemat 3in1", share: 0.18 },
      ],
      weekday: [1.05, 0.97, 0.98, 0.98, 1.0, 1.0, 1.04],
      payday: 1.18,
      holiday: [1.05, 1.05, 1.05, 0.85],
      double: [1.7, 1.55, 1.6, 1.0],
      kolMix: { TikTok: [0.22, 0.12, 0.6, 0.06], IG: [0.45, 0.25, 0.22, 0.08] },
      adsMix: [0.3, 0.15, 0.5, 0.05],
      gap: [10, 14],
      kols: [
        { h: "pedasmania.id", p: "TikTok", tier: "macro", f: 540e3, reg: "all", fee: 22e6, eff: 3.4, cs: 0.25, code: "PEDAS" },
        { h: "ngemilterus", p: "TikTok", tier: "micro", f: 66e3, reg: "all", fee: 6e6, eff: 5.2, cs: 0.3, code: "NGEMIL" },
        { h: "snackreviewer.indo", p: "IG", tier: "micro", f: 44e3, reg: "all", fee: 4e6, eff: 1.8, cs: 0.25, code: "SNACKREV" },
        { h: "racuntiktok.official", p: "TikTok", tier: "mega", f: 3.1e6, reg: "all", fee: 110e6, eff: 1.6, cs: 0.15, code: "RACUN" },
        { h: "mahasiswa.hemat", p: "TikTok", tier: "nano", f: 9.2e3, reg: "all", fee: 0.9e6, eff: 3.0, cs: 0.3, code: "HEMAT" },
        { h: "dapurlia", p: "IG", tier: "macro", f: 260e3, reg: "all", fee: 16e6, eff: 1.2, cs: 0.2, code: "LIA" },
        { h: "voucherqueen", p: "IG", tier: "micro", f: 90e3, reg: "all", fee: 7e6, eff: 0.5, cs: 0.5, cannibal: 2.4, code: "QUEEN" },
        { h: "jajanankantor", p: "TikTok", tier: "micro", f: 51e3, reg: "all", fee: 5e6, eff: 3.6, cs: 0.28, code: "KANTOR" },
        { h: "mukbang.nusantara", p: "TikTok", tier: "macro", f: 380e3, reg: "all", fee: 20e6, eff: 2.3, cs: 0.2, code: "MUKBANG" },
        { h: "ibuhemat.jatim", p: "IG", tier: "nano", f: 7.5e3, reg: "all", fee: 0.7e6, eff: 2.5, cs: 0.3, code: "IBUHEMAT" },
      ],
      recent: [
        [1, "2026-10-06", 2],
        [8, "2026-10-11", 0],
      ],
      campaigns: [
        { type: "promo", platform: "Shopee", name: { id: "Voucher Toko Shopee 6.6", en: "Shopee 6.6 store voucher" }, ch: 0, start: "2026-06-06", days: 2, cost: 14e6, eff: 1.4 },
        { type: "promo", platform: "TikTok Shop", name: { id: "TikTok Shop Flash Sale 8.8", en: "TikTok Shop 8.8 flash sale" }, ch: 2, start: "2026-08-08", days: 2, cost: 18e6, eff: 2.2 },
        { type: "promo", platform: "Shopee", name: { id: "Voucher Toko Shopee 9.9", en: "Shopee 9.9 store voucher" }, ch: 0, start: "2026-09-09", days: 2, cost: 15e6, eff: 1.2 },
        { type: "ads", platform: "TikTok Ads", name: { id: "TikTok Ads — Makaroni Daun Jeruk", en: "TikTok Ads — Makaroni Daun Jeruk" }, start: "2026-07-14", days: 9, cost: 28e6, eff: 2.4, item: 2 },
      ],
      planned: [
        [3, "2026-10-17"],
        { type: "promo", platform: "Shopee", name: { id: "Voucher Toko Shopee 11.11", en: "Shopee 11.11 store voucher" }, ch: 0, start: "2026-11-11", days: 2, cost: 20e6 },
        [0, "2026-10-24"],
        [7, "2026-11-02"],
      ],
      alwaysOn: [
        { name: "Meta Ads", platform: "Meta", monthly: 45e6, claimed: 3.6 },
        { name: "TikTok Ads", platform: "TikTok Ads", monthly: 40e6, claimed: 4.2 },
      ],
    },
    {
      id: "geprek",
      name: "Dapur Ayam Geprek",
      kind: "cloud",
      seed: 37,
      kindLabel: { id: "Cloud kitchen · 4 dapur", en: "Cloud kitchen · 4 kitchens" },
      base: 34e6,
      aov: 38000,
      growth: 0.05,
      codePrefix: "GEPREK",
      regions: [
        { name: "Jakarta Selatan", share: 0.3 },
        { name: "Jakarta Barat", share: 0.27 },
        { name: "Tangerang", share: 0.22 },
        { name: "Bekasi", share: 0.21 },
      ],
      channels: [
        { name: "GoFood", short: "GoFood", share: 0.45, commission: 0.2 },
        { name: "GrabFood", short: "GrabFood", share: 0.38, commission: 0.2 },
        { name: "ShopeeFood", short: "ShopeeFood", share: 0.17, commission: 0.2 },
      ],
      items: [
        { name: "Ayam Geprek Original", share: 0.38 },
        { name: "Geprek Mozzarella", share: 0.24 },
        { name: "Paket Nasi + Es Teh", share: 0.23 },
        { name: "Kulit Crispy", share: 0.15 },
      ],
      weekday: [1.16, 0.92, 0.92, 0.95, 0.97, 1.08, 1.18],
      payday: 1.1,
      holiday: [1.1, 1.1, 1.1],
      double: [1, 1, 1],
      kolMix: { TikTok: [0.46, 0.36, 0.18], IG: [0.48, 0.36, 0.16] },
      adsMix: [0.5, 0.35, 0.15],
      gap: [4, 7],
      kols: [
        { h: "laperterus.jaksel", p: "TikTok", tier: "micro", f: 58e3, reg: [0], fee: 4e6, eff: 4.8, cs: 0.3, code: "LAPER" },
        { h: "reviewjujur.jkt", p: "TikTok", tier: "macro", f: 290e3, reg: [0, 1], fee: 15e6, eff: 2.4, cs: 0.22, code: "JUJUR" },
        { h: "anakkantor.makan", p: "IG", tier: "micro", f: 35e3, reg: [1], fee: 3.5e6, eff: 3.1, cs: 0.27, code: "KANTOR" },
        { h: "kulinertangerang", p: "IG", tier: "micro", f: 47e3, reg: [2], fee: 3e6, eff: 3.9, cs: 0.25, code: "TNG" },
        { h: "bekasifoodies", p: "TikTok", tier: "micro", f: 41e3, reg: [3], fee: 3e6, eff: 2.2, cs: 0.25, code: "BKS" },
        { h: "pedaslovers.id", p: "TikTok", tier: "mega", f: 1.7e6, reg: [0, 1, 2, 3], fee: 55e6, eff: 1.0, cs: 0.16, code: "PEDASLOVERS" },
        { h: "diskongofood.jkt", p: "IG", tier: "micro", f: 88e3, reg: [0, 1], fee: 5e6, eff: 0.5, cs: 0.55, cannibal: 2.0, code: "DISKON" },
        { h: "ojolstory", p: "TikTok", tier: "nano", f: 7.9e3, reg: [1], fee: 0.6e6, eff: 3.5, cs: 0.3, code: "OJOL" },
        { h: "mbakfoodvlog", p: "IG", tier: "macro", f: 150e3, reg: [0, 2], fee: 10e6, eff: 1.6, cs: 0.2, code: "MBAK" },
        { h: "mukbangpedas.bks", p: "TikTok", tier: "nano", f: 9.6e3, reg: [3], fee: 0.7e6, eff: 3.2, cs: 0.3, code: "MUKBANG" },
      ],
      recent: [
        [0, "2026-10-08", 1],
        [3, "2026-10-10", 2],
      ],
      campaigns: [
        { type: "promo", name: { id: "GoFood Promo Gajian 30%", en: "GoFood payday promo 30%" }, ch: 0, start: "2026-06-26", days: 4, cost: 14e6, eff: 1.7 },
        { type: "promo", name: { id: "GrabFood Hemat Bareng", en: "GrabFood group deal" }, ch: 1, start: "2026-07-21", days: 5, cost: 12e6, eff: 1.3 },
        { type: "promo", name: { id: "ShopeeFood Diskon 9.9", en: "ShopeeFood 9.9 discount" }, ch: 2, start: "2026-09-09", days: 2, cost: 5e6, eff: 2.2 },
        { type: "ads", platform: "GrabAds", name: { id: "GrabAds — Geprek Mozzarella", en: "GrabAds — Geprek Mozzarella" }, start: "2026-08-12", days: 10, cost: 15e6, eff: 2.3, item: 1 },
      ],
      planned: [
        [1, "2026-10-15"],
        [6, "2026-10-20"],
        { type: "promo", name: { id: "GoFood Promo Gajian 30%", en: "GoFood payday promo 30%" }, ch: 0, start: "2026-10-26", days: 4, cost: 14e6 },
        [5, "2026-10-31"],
      ],
      alwaysOn: [
        { name: "Meta Ads", platform: "Meta", monthly: 18e6, claimed: 4.1 },
        { name: "TikTok Ads", platform: "TikTok Ads", monthly: 12e6, claimed: 3.4 },
      ],
    },
  ];

  // ---------- generator ----------
  function normShares(arr) {
    const s = arr.reduce((a, b) => a + b, 0);
    return arr.map((x) => x / s);
  }

  function generate(def) {
    cal.set(DEMO_START, DEMO_ND);
    const ND = cal.ND;
    const R = def.regions.length,
      C = def.channels.length,
      I = def.items.length;
      const r = rng(def.seed);
    const gross = new Float64Array(ND * R * C * I);
    const at = (d, ri, ci, ii) => ((d * R + ri) * C + ci) * I + ii;
    const dtype = Array.from({ length: ND + 60 }, (_, i) => dayType(i, def.kind));

    // baseline sales
    for (let d = 0; d < ND; d++) {
      const t = dtype[d];
      const wk = def.weekday[dow(d)];
      const trend = 1 + (def.growth * d) / ND;
      const dayS = Math.exp(r.n() * 0.03);
      for (let ri = 0; ri < R; ri++) {
        const regS = Math.exp(r.n() * 0.04);
        for (let ci = 0; ci < C; ci++) {
          let tm = 1;
          if (t === "payday") tm = def.payday;
          else if (t === "holiday") tm = def.holiday[ci];
          else if (t === "double") tm = def.double[ci];
          for (let ii = 0; ii < I; ii++) {
            const base = def.base * def.regions[ri].share * def.channels[ci].share * def.items[ii].share;
            gross[at(d, ri, ci, ii)] = base * wk * trend * tm * dayS * regS * Math.exp(r.n() * 0.08);
          }
        }
      }
    }

    // KOLs
    const kols = def.kols.map((k, i) => ({
      id: def.id + "-k" + i,
      i,
      handle: "@" + k.h,
      platform: k.p,
      tier: k.tier,
      followers: k.f,
      regions: k.reg === "all" ? def.regions.map((_, j) => j) : k.reg,
      fee: k.fee,
      _eff: k.eff,
      _cs: k.cs,
      _cannibal: k.cannibal || 0,
      code: k.code,
    }));

    // schedule KOL posts: keep each region mostly free of overlapping windows
    const events = [];
    let eid = 0;
    const regionFree = new Array(R).fill(0);
    const postCount = new Array(kols.length).fill(0);
    let d = 36;
    const lastSched = ND - 1 - 13;
    while (d <= lastSched) {
      const allowOverlap = r.u() < 0.16;
      const cands = kols.filter((k) => allowOverlap || k.regions.every((x) => regionFree[x] <= d));
      if (!cands.length) {
        d++;
        continue;
      }
      const w = cands.map((k) => 1 / Math.pow(1 + postCount[k.i], 2.2));
      let pick = r.u() * w.reduce((a, b) => a + b, 0);
      let k = cands[0];
      for (let j = 0; j < cands.length; j++) {
        pick -= w[j];
        if (pick <= 0) {
          k = cands[j];
          break;
        }
      }
      postCount[k.i]++;
      const len = k.platform === "TikTok" ? 6 : 8;
      k.regions.forEach((x) => (regionFree[x] = Math.max(regionFree[x], d + len)));
      events.push(kolPost(k, d, r.int(0, I - 1)));
      d += r.int(def.gap[0], def.gap[1]);
    }
    def.recent.forEach(([ki, date, item]) => events.push(kolPost(kols[ki], idx(date), item)));

    function kolPost(k, day, item) {
      postCount[k.i] = postCount[k.i] || 0;
      const views = Math.round(k.followers * (k.platform === "TikTok" ? r.range(0.6, 3.2) : r.range(0.25, 1.1)));
      const likes = Math.round(views * r.range(0.03, 0.09));
      const n = events.filter((e) => e.kolId === k.id).length + 1;
      return {
        id: "e" + eid++,
        type: "kol",
        kolId: k.id,
        platform: k.platform,
        start: day,
        end: day,
        cost: k.fee,
        code: def.codePrefix + k.code + (n > 1 ? n : ""),
        regions: k.regions.slice(),
        item,
        views,
        likes,
        comments: Math.round(likes * r.range(0.02, 0.06)),
        shares: Math.round(likes * r.range(0.04, 0.16)),
      };
    }

    def.campaigns.forEach((c) => {
      const s = idx(c.start);
      events.push({
        id: "e" + eid++,
        type: c.type,
        name: c.name,
        platform: c.platform || (c.ch != null ? def.channels[c.ch].short : c.type),
        channel: c.ch != null ? c.ch : null,
        start: s,
        end: s + c.days - 1,
        cost: c.cost,
        regions: c.reg ? c.reg.slice() : def.regions.map((_, j) => j),
        item: c.item != null ? c.item : null,
        _eff: c.eff,
      });
    });

    def.planned.forEach((p) => {
      if (Array.isArray(p)) {
        const k = kols[p[0]];
        const ev = kolPost(k, idx(p[1]), r.int(0, I - 1));
        ev.views = ev.likes = ev.comments = ev.shares = null;
        events.push(ev);
      } else {
        const s = idx(p.start);
        events.push({
          id: "e" + eid++,
          type: p.type,
          name: p.name,
          platform: p.platform || def.channels[p.ch].short,
          channel: p.ch != null ? p.ch : null,
          start: s,
          end: s + p.days - 1,
          cost: p.cost,
          regions: def.regions.map((_, j) => j),
          item: null,
        });
      }
    });

    // inject true lift + promo-code redemptions
    const regShare = normShares(def.regions.map((x) => x.share));
    const itemShare = normShares(def.items.map((x) => x.share));
    events.forEach((ev) => {
      if (ev.start > ND - 1) return;
      let total, curve, chMix, itMix;
      const k = ev.kolId ? kols.find((x) => x.id === ev.kolId) : null;
      if (ev.type === "kol") {
        total = k.fee * k._eff * r.range(0.85, 1.15);
        curve = DECAY[ev.platform];
        chMix = def.kolMix[ev.platform];
        itMix = itemShare.map((s, j) => 0.4 * s + (j === ev.item ? 0.6 : 0));
      } else {
        const days = ev.end - ev.start + 1;
        total = ev.cost * ev._eff * r.range(0.9, 1.1);
        if (ev.type === "promo") {
          curve = Array.from({ length: days }, () => 1);
          chMix = def.channels.map((_, j) => (j === ev.channel ? 1 : 0));
        } else {
          curve = Array.from({ length: days }, (_, j) => (j === 0 ? 0.6 : 1)).concat([0.5, 0.25, 0.1]);
          chMix = ev.type === "offline" ? def.channels.map((_, j) => (j === 0 ? 0.7 : 0.3 / (C - 1))) : def.adsMix;
        }
        itMix = ev.item != null ? itemShare.map((s, j) => 0.5 * s + (j === ev.item ? 0.5 : 0)) : itemShare;
      }
      curve = normShares(curve);
      chMix = normShares(chMix);
      const rw = normShares(def.regions.map((_, j) => (ev.regions.includes(j) ? regShare[j] : 0)));
      ev.truth = { daily: curve.map((w) => total * w), total };
      ev.codeRev = [];
      ev.codeDisc = [];
      curve.forEach((w, j) => {
        const day = ev.start + j;
        if (day > ND - 1) return;
        const amt = total * w;
        for (let ri = 0; ri < R; ri++)
          if (rw[ri] > 0)
            for (let ci = 0; ci < C; ci++)
              if (chMix[ci] > 0)
                for (let ii = 0; ii < I; ii++) gross[at(day, ri, ci, ii)] += amt * rw[ri] * chMix[ci] * itMix[ii];
        if (ev.type === "kol") {
          // direct = share of the true lift that used the code + (for deal-hunter KOLs)
          // existing customers who would have bought anyway but grabbed the code
          const rev = amt * k._cs * r.range(0.8, 1.2) + total * k._cannibal * w * r.range(0.8, 1.2);
          ev.codeRev[j] = rev;
          ev.codeDisc[j] = rev * 0.2;
        } else if (ev.type === "promo") {
          // subsidy is spread evenly; promo orders ≈ subsidy / 30% discount
          ev.codeDisc[j] = ev.cost / curve.length;
          ev.codeRev[j] = ev.cost / curve.length / 0.3;
        }
      });
    });
    kols.forEach((k) => {
      k.posts = events.filter((e) => e.kolId === k.id).map((e) => e.id);
    });

    // always-on ads spend (sits inside the baseline; platform-reported revenue only)
    const alwaysOn = def.alwaysOn.map((a) => ({
      ...a,
      daily: Array.from({ length: ND }, () => (a.monthly / 30) * Math.exp(r.n() * 0.08)),
    }));

    events.sort((a, b) => a.start - b.start);
    return {
      def,
      id: def.id,
      name: def.name,
      kind: def.kind,
      R,
      C,
      I,
      gross,
      at,
      dtype,
      kols,
      events,
      alwaysOn,
      nextId: eid,
      start: DEMO_START,
      nd: DEMO_ND,
    };
  }

  Object.assign(cal, { iso, idx, dow, dom, mon, year, ym, dateOf, HOLIDAYS, dayType, DECAY });
  MI.cal = cal;
  MI.DEFS = DEFS;
  MI.imported = MI.imported || {}; // workspaces built from uploaded files (js/importer.js)
  const cache = {};
  MI.getWorkspace = (id) => MI.imported[id] || (cache[id] = cache[id] || generate(DEFS.find((d) => d.id === id) || DEFS[0]));
  MI.listWorkspaces = () => DEFS.map((d) => ({ id: d.id, name: d.name, kindLabel: d.kindLabel, imported: false })).concat(Object.values(MI.imported).map((w) => ({ id: w.id, name: w.name, kindLabel: w.def.kindLabel, imported: true })));
})();
