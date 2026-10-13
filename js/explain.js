/* "How it works" — a plain-language explainer for the marketing team.
   Every graphic is drawn to scale from the small example numbers next to it. */
(function () {
  const MI = (window.MI = window.MI || {});

  const TXT = {
    id: {
      eyebrow: "Cara kerja",
      title: "Apakah penjualan ini akan terjadi tanpa marketing?",
      lead: "Itu satu-satunya pertanyaan yang dijawab dashboard ini. Kami membandingkan penjualan yang benar-benar terjadi dengan perkiraan penjualan kalau tidak ada post KOL, promo, atau iklan. Selisihnya adalah efek marketing Anda.",
      hero_post: "Post KOL",
      hero_extra: "Penjualan tambahan",
      hero_exp: "Perkiraan tanpa marketing",
      hero_act: "Penjualan aktual",
      quick_title: "Dalam 30 detik",
      q1t: "Aktual − Perkiraan = Tambahan",
      q1b: "Penjualan yang muncul karena event, bukan karena hari Sabtu atau tanggal gajian.",
      q2t: "Tambahan bersih ÷ Biaya = ROAS bersih",
      q2b: "Berapa rupiah kembali untuk setiap Rp 1 yang dikeluarkan, setelah komisi aplikasi dan diskon.",
      q3t: "Keyakinan: Tinggi, Sedang, Tidak terdeteksi",
      q3b: "Apakah tambahannya cukup besar dibanding naik-turun normal harian, atau hanya kebetulan.",
      steps_title: "Enam langkah, dari log sampai ROAS",
      s1t: "Catat setiap aktivitas marketing",
      s1b: "Setiap post KOL, promo aplikasi, iklan dan aktivitas offline masuk ke Log. Event yang tidak dicatat akan terlihat seperti lonjakan penjualan tanpa penjelasan, dan bisa membuat event lain terlihat lebih bagus dari kenyataannya.",
      s1_list: ["Tanggal (dan jam) posting", "Biaya atau fee", "Kode promo unik per KOL", "Wilayah atau outlet target", "Menu yang dipromosikan"],
      s1_week: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
      s1_c1: "Post KOL",
      s1_c2: "Promo GoFood",
      s1_c3: "Iklan Meta",
      s2t: "Hitung perkiraan penjualan",
      s2b: "Untuk hari Rabu ini, kami melihat hari Rabu di 6 minggu sebelumnya. Minggu yang ada event-nya dilewati, karena penjualannya sudah tidak normal. Kami ambil nilai tengahnya (median), lalu sesuaikan untuk tanggal gajian, hari libur dan tanggal kembar marketplace.",
      s2_w: "Rab",
      s2_skip: "ada event",
      s2_med: "median",
      s2_pay: "gajian",
      s2_this: "Rabu ini",
      s2_note: "Median dipakai karena satu hari yang aneh (hujan deras, outlet tutup) tidak menggeser hasilnya.",
      s3t: "Ukur selisihnya selama jendela atribusi",
      s3b: "Efek post tidak berhenti di hari posting. Kami menjumlahkan selisih aktual dan perkiraan selama beberapa hari: TikTok biasanya cepat naik dan cepat turun, Instagram lebih lama. Panjang jendela bisa diubah di Pengaturan.",
      s3_day: "Hari",
      s3_out: "di luar jendela",
      s4t: "Pisahkan penjualan langsung dan halo",
      s4b: "Penjualan dengan kode promo adalah bukti langsung. Tapi banyak orang menonton video lalu datang atau pesan GoFood tanpa kode. Itu halo. Kalau penjualan dengan kode justru lebih besar dari total tambahan, berarti kode dipakai pelanggan yang memang akan membeli. Diskonnya terbuang.",
      s4_good: "Post sehat",
      s4_bad: "Diskon terbuang",
      s4_direct: "Langsung (kode)",
      s4_halo: "Halo",
      s4_extra: "Tambahan",
      s4_code: "Penjualan kode",
      s4_anyway: "tetap akan membeli",
      s5t: "Cek apakah efeknya nyata",
      s5b: "Penjualan selalu naik-turun sendiri. Kami mengukur seberapa besar naik-turun normal selama jendela yang sama di minggu-minggu tanpa event, lalu membandingkannya dengan tambahan penjualan.",
      s5_try: "Coba geser: berapa tambahan penjualannya?",
      s5_swing: "Naik-turun normal (8 hari)",
      s5_extra: "Tambahan",
      s5_hi: "Tinggi: tambahan lebih dari 2× naik-turun normal. Bisa dipercaya.",
      s5_med: "Sedang: 1–2× naik-turun normal. Kemungkinan nyata, tapi hati-hati.",
      s5_low: "Tidak terdeteksi: lebih kecil dari naik-turun normal. Bisa jadi kebetulan, jadi angkanya tidak dipakai untuk peringkat.",
      s6t: "Hitung uangnya",
      s6b: "Tambahan penjualan kotor dipotong komisi aplikasi (GoFood, GrabFood, marketplace). Hasilnya dibagi total biaya: fee KOL ditambah diskon yang diberikan lewat kode. Itu ROAS bersih. Di atas 1× berarti balik modal.",
      s6_gross: "Tambahan kotor",
      s6_comm: "Komisi",
      s6_net: "Tambahan bersih",
      s6_cost: "Biaya",
      s6_fee: "fee",
      s6_disc: "diskon",
      s6_eq: "ROAS bersih",
      ov_title: "Kalau dua event tumpang-tindih",
      ov_body: "Kalau post KOL dan promo GoFood berjalan di minggu dan wilayah yang sama, tidak ada cara jujur untuk membagi tambahan penjualannya. Jadi kami tidak membaginya. Keduanya ditandai \"bersama\", tambahannya dilaporkan sebagai satu angka, dan peringkat KOL hanya memakai post yang berdiri sendiri.",
      ov_a: "Post KOL",
      ov_b: "Promo GoFood",
      ov_pool: "Dihitung bersama, tidak dibagi",
      lim_title: "Yang tidak bisa dijawab",
      lim: [
        ["Iklan always-on", "Iklan yang jalan setiap hari sudah masuk ke perkiraan, jadi efeknya tidak terlihat sebagai tambahan. Angkanya adalah klaim platform iklan."],
        ["KOL kecil satu per satu", "Post nano sering terlalu kecil untuk dibedakan dari naik-turun normal. Lihat totalnya beberapa post sekaligus."],
        ["Kejadian di luar data", "Pesaing buka promo, outlet kehabisan stok, hujan seharian, atau Ramadan. Catat di Log kalau ada yang besar."],
        ["Efek jangka panjang", "Kami mengukur hari-hari setelah event. Efek ke merek dalam beberapa bulan tidak terukur di sini."],
      ],
      gl_title: "Kamus singkat",
      gl: [
        ["Perkiraan (baseline)", "Penjualan yang kami harapkan terjadi tanpa event."],
        ["Tambahan (lift)", "Aktual dikurangi perkiraan, dijumlah selama jendela atribusi."],
        ["Jendela atribusi", "Berapa hari setelah event penjualan masih dihitung sebagai efeknya."],
        ["Langsung", "Penjualan yang memakai kode promo event itu."],
        ["Halo", "Tambahan penjualan tanpa kode."],
        ["ROAS bersih", "Tambahan setelah komisi ÷ (fee + diskon kode)."],
        ["MER", "Semua penjualan bersih ÷ semua biaya marketing."],
        ["Keyakinan", "Seberapa jelas tambahan dibanding naik-turun normal."],
      ],
      ck_title: "Supaya angkanya bisa dipercaya",
      ck: ["Satu kode promo unik untuk setiap KOL dan setiap post", "Catat tanggal posting yang sebenarnya, bukan tanggal kontrak", "Isi wilayah target. KOL Bandung tidak perlu dibandingkan dengan Surabaya", "Beri jarak antar event di wilayah yang sama kalau ingin hasil yang bersih", "Pakai minimal 8 minggu data penjualan", "Impor ulang data setiap minggu"],
      cta_import: "Impor data penjualan",
      cta_overview: "Lihat ringkasan",
      ex_note: "Semua angka di halaman ini adalah contoh.",
    },
    en: {
      eyebrow: "How it works",
      title: "Would these sales have happened anyway?",
      lead: "That's the one question this dashboard answers. We compare the sales that actually happened with the sales we'd expect if there had been no KOL post, promo or ad. The difference is the effect of your marketing.",
      hero_post: "KOL post",
      hero_extra: "Extra sales",
      hero_exp: "Expected without marketing",
      hero_act: "Actual sales",
      quick_title: "In 30 seconds",
      q1t: "Actual − Expected = Extra",
      q1b: "Sales that came from the event, not from it being a Saturday or payday.",
      q2t: "Net extra ÷ Cost = Net ROAS",
      q2b: "How many rupiah come back for every Rp 1 spent, after app commission and discounts.",
      q3t: "Confidence: High, Medium, Not detectable",
      q3b: "Whether the extra is big compared with normal day-to-day swings, or could be chance.",
      steps_title: "Six steps, from the log to ROAS",
      s1t: "Log every marketing activity",
      s1b: "Every KOL post, app promo, ad and offline activity goes into the Log. An event that isn't logged looks like an unexplained sales spike, and can make other events look better than they were.",
      s1_list: ["Post date (and time)", "Cost or fee", "A unique promo code per KOL", "Target regions or outlets", "The promoted menu item"],
      s1_week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      s1_c1: "KOL post",
      s1_c2: "GoFood promo",
      s1_c3: "Meta ads",
      s2t: "Work out expected sales",
      s2b: "For this Wednesday, we look at the Wednesdays of the previous 6 weeks. Weeks that had an event are skipped, because their sales weren't normal. We take the middle value (the median), then adjust for payday, public holidays and marketplace twin dates.",
      s2_w: "Wed",
      s2_skip: "had event",
      s2_med: "median",
      s2_pay: "payday",
      s2_this: "This Wed",
      s2_note: "We use the median so one odd day (heavy rain, an outlet closed) doesn't move the result.",
      s3t: "Measure the gap over the attribution window",
      s3b: "A post's effect doesn't stop on the day it goes up. We add up the gap between actual and expected over several days: TikTok usually rises and fades fast, Instagram lasts longer. You can change the window length in Settings.",
      s3_day: "Day",
      s3_out: "outside window",
      s4t: "Split direct sales from halo",
      s4b: "Sales with the promo code are direct proof. But many people watch the video and then walk in or order on GoFood without the code. That's halo. If code sales are bigger than the total extra, the code went to customers who would have bought anyway. The discount was wasted.",
      s4_good: "Healthy post",
      s4_bad: "Wasted discount",
      s4_direct: "Direct (code)",
      s4_halo: "Halo",
      s4_extra: "Extra",
      s4_code: "Code sales",
      s4_anyway: "would have bought anyway",
      s5t: "Check the effect is real",
      s5b: "Sales always move up and down on their own. We measure how big the normal swing is over the same window in weeks without events, and compare it with the extra sales.",
      s5_try: "Try it: how big is the extra?",
      s5_swing: "Normal swing (8 days)",
      s5_extra: "Extra",
      s5_hi: "High: the extra is more than 2× the normal swing. Trust it.",
      s5_med: "Medium: 1–2× the normal swing. Probably real, but be careful.",
      s5_low: "Not detectable: smaller than the normal swing. It could be chance, so it isn't used in rankings.",
      s6t: "Do the money",
      s6b: "Gross extra sales lose the app commission (GoFood, GrabFood, marketplaces). What's left is divided by the total cost: the KOL fee plus the discount given through the code. That's net ROAS. Above 1× pays back.",
      s6_gross: "Gross extra",
      s6_comm: "Commission",
      s6_net: "Net extra",
      s6_cost: "Cost",
      s6_fee: "fee",
      s6_disc: "discount",
      s6_eq: "Net ROAS",
      ov_title: "When two events overlap",
      ov_body: "If a KOL post and a GoFood promo run in the same week and region, there's no honest way to split the extra sales between them. So we don't. Both are marked \"shared\", the extra is reported as one number, and KOL rankings use only posts that ran on their own.",
      ov_a: "KOL post",
      ov_b: "GoFood promo",
      ov_pool: "Counted together, not split",
      lim_title: "What it can't tell you",
      lim: [
        ["Always-on ads", "Ads that run every day are already inside the expected line, so they don't show up as extra. Their figures are the ad platform's claims."],
        ["Small KOLs one at a time", "Nano posts are often too small to tell apart from normal swings. Look at several posts together."],
        ["Things outside the data", "A competitor's promo, a stock-out, a day of heavy rain, or Ramadan. Note big ones in the Log."],
        ["Long-term brand effects", "We measure the days after an event. Effects on the brand over months aren't measured here."],
      ],
      gl_title: "Quick glossary",
      gl: [
        ["Expected (baseline)", "Sales we'd expect without the event."],
        ["Extra (lift)", "Actual minus expected, summed over the attribution window."],
        ["Attribution window", "How many days after an event its sales still count."],
        ["Direct", "Sales that used the event's promo code."],
        ["Halo", "Extra sales without the code."],
        ["Net ROAS", "Extra after commission ÷ (fee + code discount)."],
        ["MER", "All net sales ÷ all marketing spend."],
        ["Confidence", "How clearly the extra stands out from normal swings."],
      ],
      ck_title: "So the numbers can be trusted",
      ck: ["One unique promo code per KOL and per post", "Log the real post date, not the contract date", "Fill in target regions. A Bandung KOL shouldn't be judged on Surabaya", "Space out events in the same region when you want a clean read", "Use at least 8 weeks of sales data", "Re-import the data every week"],
      cta_import: "Import sales data",
      cta_overview: "See the overview",
      ex_note: "All numbers on this page are examples.",
    },
  };

  const f1 = (x) => Math.round(x * 10) / 10;

  // ---------- graphics ----------
  function hero(T, rp) {
    const W = 720,
      H = 270,
      L = 52,
      R = 16,
      Tp = 34,
      B = 34;
    const wk = [42, 43, 45, 47, 54, 66, 62]; // Mon..Sun, Rp jt
    const noise = [1.2, -0.8, 0.6, -1.1, 0.9, -0.5, 1.4, -0.6, 0.3, -1.2, 0.8, 0.4, -0.9, 1.1, 0.2, -0.4, 0.7, -0.3, 0.5, -0.8, 1.0, -0.2, 0.6, -1.0, 0.4, 0.9, -0.6, 0.3];
    const post = 16;
    const lift = [3, 9, 8, 6, 4.5, 3, 2, 1];
    const n = 28;
    const exp = Array.from({ length: n }, (_, i) => wk[i % 7] * (1 + i * 0.002));
    const act = exp.map((v, i) => v + noise[i] + (i >= post && i < post + lift.length ? lift[i - post] : 0));
    const y0 = 30,
      y1 = 80;
    const x = (i) => L + (i * (W - L - R)) / (n - 1);
    const y = (v) => Tp + ((y1 - v) * (H - Tp - B)) / (y1 - y0);
    const path = (arr) => arr.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
    let area = "";
    for (let i = post; i < post + lift.length; i++) area += (i === post ? "M" : "L") + x(i).toFixed(1) + " " + y(act[i]).toFixed(1);
    for (let i = post + lift.length - 1; i >= post; i--) area += "L" + x(i).toFixed(1) + " " + y(exp[i]).toFixed(1);
    const grid = [40, 60, 80].map((v) => `<line class="xg-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="xg-t" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${rp(v * 1e6)}</text>`).join("");
    const weeks = [0, 7, 14, 21].map((i, k) => `<text class="xg-t" x="${x(i + 3)}" y="${H - 10}" text-anchor="middle">${T.s3_day === "Hari" ? "Minggu " : "Week "}${k + 1}</text>`).join("");
    const cx = x(post + 3),
      cy = (y(act[post + 2]) + y(exp[post + 2])) / 2;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="hx-t"><title id="hx-t">${T.hero_act} vs ${T.hero_exp}</title>
      ${grid}${weeks}
      <path class="xg-lift" d="${area}Z"/>
      <path class="xg-exp" d="${path(exp)}"/>
      <path class="xg-act" d="${path(act)}"/>
      <line class="xg-mark" x1="${x(post)}" x2="${x(post)}" y1="${Tp - 6}" y2="${H - B}"/>
      <circle class="xg-kol xg-pulse" cx="${x(post)}" cy="${Tp - 10}" r="6"/>
      <text class="xg-b" x="${x(post) + 12}" y="${Tp - 6}">${T.hero_post}</text>
      <line class="xg-lead" x1="${cx}" y1="${cy}" x2="${cx + 70}" y2="${y(77)}"/>
      <text class="xg-b xg-coraltext" x="${cx + 74}" y="${y(77) + 4}">${T.hero_extra}</text>
    </svg>`;
  }

  function weekStrip(T) {
    const W = 420,
      H = 150,
      cw = (W - 20) / 7;
    const chips = [
      [2, 1, "kol", T.s1_c1],
      [4, 3, "promo", T.s1_c2],
      [0, 7, "ads", T.s1_c3],
    ];
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T.s1t}">
      ${T.s1_week.map((d, i) => `<text class="xg-t" x="${10 + cw * i + cw / 2}" y="16" text-anchor="middle">${d}</text><rect class="xg-cell" x="${10 + cw * i + 2}" y="24" width="${cw - 4}" height="${H - 30}" rx="8"/>`).join("")}
      ${chips.map(([d, len, ty, label], k) => `<rect class="xg-${ty}bg" x="${10 + cw * d + 5}" y="${36 + k * 34}" width="${cw * len - 10}" height="26" rx="7"/><text class="xg-chip xg-${ty}ink" x="${10 + cw * d + 13}" y="${53 + k * 34}">${label}</text>`).join("")}
    </svg>`;
  }

  function baseline(T, rp) {
    const W = 420,
      H = 250,
      L = 14,
      B = 46,
      Tp = 44;
    const vals = [46, 47, 58, 45, 61, 48];
    const skip = [false, false, true, false, true, false];
    const clean = vals.filter((_, i) => !skip[i]).sort((a, b) => a - b);
    const med = (clean[1] + clean[2]) / 2;
    const pay = 1.12;
    const exp = med * pay;
    const max = 66;
    const bw = 38,
      gap = 12;
    const y = (v) => H - B - (v * (H - B - Tp)) / max;
    const bars = vals
      .map((v, i) => {
        const bx = L + i * (bw + gap);
        return `<rect class="${skip[i] ? "xg-hatch" : "xg-sunkbar"}" x="${bx}" y="${y(v)}" width="${bw}" height="${H - B - y(v)}" rx="6"/>
        <text class="xg-t" x="${bx + bw / 2}" y="${H - B + 16}" text-anchor="middle">${T.s2_w} −${6 - i}</text>
        ${skip[i] ? `<text class="xg-t xg-badtext" x="${bx + bw / 2}" y="${H - B + 31}" text-anchor="middle">${T.s2_skip}</text>` : `<text class="xg-t" x="${bx + bw / 2}" y="${y(v) - 6}" text-anchor="middle">${v}</text>`}`;
      })
      .join("");
    const mx0 = L - 4,
      mx1 = L + 6 * (bw + gap) - gap + 4;
    const ex = W - 60;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T.s2t}">
      <defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="xg-hatchbg"/><line x1="0" y1="0" x2="0" y2="7" class="xg-hatchline"/></pattern></defs>
      ${bars}
      <line class="xg-medline" x1="${mx0}" x2="${ex + 46}" y1="${y(med)}" y2="${y(med)}"/>
      <line class="xg-medline" x1="${L}" x2="${L + 26}" y1="10" y2="10"/><text class="xg-b" x="${L + 34}" y="14">${T.s2_med} ${rp(med * 1e6)}</text>
      <rect class="xg-tealbar" x="${ex}" y="${y(med)}" width="46" height="${H - B - y(med)}" rx="0"/>
      <rect class="xg-limebar" x="${ex}" y="${y(exp)}" width="46" height="${y(med) - y(exp)}" rx="6"/>
      <text class="xg-chip xg-limeink" x="${ex + 23}" y="${y(exp) + (y(med) - y(exp)) / 2 + 4}" text-anchor="middle">×${String(pay).replace(".", T.s3_day === "Hari" ? "," : ".")}</text>
      <text class="xg-b" x="${ex + 23}" y="${y(exp) - 8}" text-anchor="middle">${rp(exp * 1e6)}</text>
      <text class="xg-t" x="${ex + 23}" y="${H - B + 16}" text-anchor="middle">${T.s2_this}</text>
      <text class="xg-t xg-limetext" x="${ex + 23}" y="${H - B + 31}" text-anchor="middle">+ ${T.s2_pay}</text>
    </svg>`;
  }

  function windowBars(T, rp) {
    const W = 420,
      H = 220,
      L = 10,
      B = 30,
      Tp = 64;
    const v = [3, 9, 8, 6, 4.5, 3, 2, 1, 0.5, 0.3];
    const max = 10;
    const bw = (W - L * 2) / v.length;
    const y = (x) => H - B - (x * (H - B - Tp)) / max;
    const bx = (i) => L + i * bw;
    const brk = (a, b, yy, cls, label) => `<path class="${cls}" d="M${bx(a) + 4} ${yy + 8} V${yy} H${bx(b + 1) - 4} V${yy + 8}"/><text class="xg-chip ${cls}-t" x="${(bx(a) + bx(b + 1)) / 2}" y="${yy - 6}" text-anchor="middle">${label}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T.s3t}">
      ${brk(0, 7, 34, "xg-ig", "Instagram · " + T.s3_day.toLowerCase() + " 0–7")}
      ${brk(0, 5, 54, "xg-tt", "TikTok · " + T.s3_day.toLowerCase() + " 0–5")}
      ${v.map((x, i) => `<rect class="${i <= 7 ? "xg-coralbar" : "xg-sunkbar"}" x="${bx(i) + 5}" y="${y(x)}" width="${bw - 10}" height="${H - B - y(x)}" rx="5"/><text class="xg-t" x="${bx(i) + bw / 2}" y="${H - 10}" text-anchor="middle">${i}</text>`).join("")}
      <line class="xg-axisline" x1="${L}" x2="${W - L}" y1="${H - B}" y2="${H - B}"/>
      <text class="xg-t" x="${W - L}" y="${y(2.2)}" text-anchor="end">${T.s3_out}</text>
    </svg>`;
  }

  function split(T, rp) {
    const W = 420,
      H = 220,
      L = 0;
    const max = 42;
    const sx = (v) => (v * (W - 20)) / max;
    const row = (yy, segs) => {
      let x0 = L;
      return segs
        .map(([v, cls, label, inside]) => {
          const w = sx(v);
          const out = `<rect class="${cls}" x="${x0}" y="${yy}" width="${Math.max(0, w - 2)}" height="30" rx="6"/>${label ? `<text class="xg-chip ${inside}" x="${x0 + 10}" y="${yy + 20}">${label}</text>` : ""}`;
          x0 += w;
          return out;
        })
        .join("");
    };
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T.s4t}">
      <text class="xg-b" x="0" y="16">${T.s4_good}</text>
      ${row(26, [
        [12, "xg-coralbar", rp(12e6), "xg-oncoral"],
        [28, "xg-tealbar", T.s4_halo + " " + rp(28e6), "xg-onfill"],
      ])}
      <text class="xg-t" x="0" y="74">${T.s4_direct} + ${T.s4_halo.toLowerCase()} = ${T.s4_extra.toLowerCase()} ${rp(40e6)}</text>
      <text class="xg-b" x="0" y="116">${T.s4_bad}</text>
      ${row(126, [[10, "xg-tealbar", rp(10e6), "xg-onfill"]])}
      <text class="xg-t" x="${sx(10) + 8}" y="146">${T.s4_extra}</text>
      ${row(162, [
        [10, "xg-coralbar", "", ""],
        [20, "xg-hatchbad", "", ""],
      ])}
      <text class="xg-chip xg-oncoral" x="10" y="182">${rp(30e6)}</text>
      <text class="xg-t" x="${sx(30) + 8}" y="182">${T.s4_code}</text>
      <text class="xg-t xg-badtext" x="${sx(10) + 6}" y="210">${rp(20e6)} ${T.s4_anyway}</text>
    </svg>`;
  }

  function waterfall(T, rp, x) {
    const W = 420,
      H = 240,
      Tp = 30,
      B = 40;
    const gross = 40,
      comm = 6,
      net = 34,
      fee = 10,
      disc = 2.4,
      cost = fee + disc;
    const max = 44;
    const y = (v) => H - B - (v * (H - B - Tp)) / max;
    const bw = 70,
      gap = 30;
    const bx = (i) => 10 + i * (bw + gap);
    const lbl = (i, v, txt) => `<text class="xg-b" x="${bx(i) + bw / 2}" y="${y(v) - 8}" text-anchor="middle">${txt}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T.s6t}">
      <rect class="xg-tealbar" x="${bx(0)}" y="${y(gross)}" width="${bw}" height="${H - B - y(gross)}" rx="6"/>${lbl(0, gross, rp(gross * 1e6))}
      <line class="xg-lead" x1="${bx(0) + bw}" x2="${bx(1)}" y1="${y(gross)}" y2="${y(gross)}"/>
      <rect class="xg-badbar" x="${bx(1)}" y="${y(gross)}" width="${bw}" height="${y(net) - y(gross)}" rx="4"/><text class="xg-b xg-badtext" x="${bx(1) + bw / 2}" y="${y(gross) - 8}" text-anchor="middle">−${rp(comm * 1e6)}</text>
      <line class="xg-lead" x1="${bx(1) + bw}" x2="${bx(2)}" y1="${y(net)}" y2="${y(net)}"/>
      <rect class="xg-tealdark" x="${bx(2)}" y="${y(net)}" width="${bw}" height="${H - B - y(net)}" rx="6"/>${lbl(2, net, rp(net * 1e6))}
      <rect class="xg-sunkbar" x="${bx(3)}" y="${y(fee)}" width="${bw}" height="${H - B - y(fee)}" rx="0"/>
      <rect class="xg-coralbar" x="${bx(3)}" y="${y(cost)}" width="${bw}" height="${y(fee) - y(cost)}" rx="4"/>${lbl(3, cost, rp(cost * 1e6))}
      <line class="xg-axisline" x1="0" x2="${W}" y1="${H - B}" y2="${H - B}"/>
      ${[T.s6_gross, T.s6_comm, T.s6_net, T.s6_cost].map((t, i) => `<text class="xg-t" x="${bx(i) + bw / 2}" y="${H - B + 17}" text-anchor="middle">${t}</text>`).join("")}
      <text class="xg-t" x="${bx(3) + bw / 2}" y="${H - B + 32}" text-anchor="middle">${T.s6_fee} + ${T.s6_disc}</text>
    </svg>`;
  }

  function overlap(T, rp) {
    const W = 560,
      H = 150,
      L = 10;
    const n = 16,
      cw = (W - 2 * L) / n;
    const bar = (a, b, yy, cls, ink, label) => `<rect class="${cls}" x="${L + a * cw + 2}" y="${yy}" width="${(b - a + 1) * cw - 4}" height="28" rx="7"/><text class="xg-chip ${ink}" x="${L + a * cw + 12}" y="${yy + 19}">${label}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T.ov_title}">
      ${Array.from({ length: n }, (_, i) => `<rect class="xg-cell" x="${L + i * cw + 1}" y="8" width="${cw - 2}" height="${H - 16}" rx="5"/>`).join("")}
      ${bar(2, 9, 22, "xg-kolbg", "xg-kolink", T.ov_a)}
      ${bar(7, 12, 58, "xg-promobg", "xg-promoink", T.ov_b)}
      <path class="xg-pool" d="M${L + 2 * cw + 2} 100 V112 H${L + 13 * cw - 2} V100"/>
      <text class="xg-b" x="${L + 7.5 * cw}" y="134" text-anchor="middle">${T.ov_pool}: ${rp(55e6, { sign: true })}</text>
    </svg>`;
  }

  // ---------- page ----------
  MI.explain = {
    render(v, ctx) {
      const { I, esc, ICON } = ctx;
      const T = TXT[I.lang] || TXT.id;
      const rp = (n, o) => I.rp(n, o);
      const step = (n, title, body, graphic, extra = "") => `<section class="ex-step"><div class="ex-text"><span class="ex-n">${n}</span><h2>${title}</h2><p>${body}</p>${extra}</div><figure class="ex-fig">${graphic}</figure></section>`;
      v.innerHTML = `<article class="ex">
        <header class="ex-hero">
          <p class="ex-eyebrow">${T.eyebrow}</p>
          <h1>${T.title}</h1>
          <p class="ex-lead">${T.lead}</p>
          <figure class="ex-fig ex-herofig">${hero(T, rp)}
            <figcaption class="legend"><span><span class="sw-line" style="border-color:var(--teal)"></span>${T.hero_act}</span><span><span class="sw-dash" style="border-color:var(--muted)"></span>${T.hero_exp}</span><span><span class="sw" style="background:var(--coral);opacity:.5"></span>${T.hero_extra}</span></figcaption>
          </figure>
        </header>

        <section><h2 class="ex-h2">${T.quick_title}</h2>
          <div class="ex-quick">
            <div class="ex-q"><div class="ex-qi xg-qa">−</div><h3>${T.q1t}</h3><p>${T.q1b}</p></div>
            <div class="ex-q"><div class="ex-qi xg-qb">÷</div><h3>${T.q2t}</h3><p>${T.q2b}</p></div>
            <div class="ex-q"><div class="ex-qi xg-qc">✓</div><h3>${T.q3t}</h3><p>${T.q3b}</p></div>
          </div>
        </section>

        <h2 class="ex-h2">${T.steps_title}</h2>
        ${step(1, T.s1t, T.s1b, weekStrip(T), `<ul class="ex-list">${T.s1_list.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`)}
        ${step(2, T.s2t, T.s2b, baseline(T, rp), `<p class="ex-aside">${T.s2_note}</p>`)}
        ${step(3, T.s3t, T.s3b, windowBars(T, rp))}
        ${step(4, T.s4t, T.s4b, split(T, rp))}
        ${step(
          5,
          T.s5t,
          T.s5b,
          `<div class="ex-try"><label for="exSlider"><b>${T.s5_try}</b></label>
            <div class="ex-try-row"><input type="range" id="exSlider" min="0" max="30" step="1" value="12"><output id="exOut" for="exSlider"></output></div>
            <svg viewBox="0 0 420 92" role="img" aria-label="${T.s5t}" id="exConfSvg"></svg>
            <p id="exConfMsg" class="ex-confmsg" role="status"></p></div>`,
        )}
        ${step(6, T.s6t, T.s6b, waterfall(T, rp), `<div class="ex-eq"><span>${rp(34e6)} ÷ ${rp(12.4e6)}</span><b>= ${I.x(34 / 12.4)}</b><span class="muted">${T.s6_eq}</span></div>`)}

        <section class="ex-band"><div class="ex-text"><h2>${T.ov_title}</h2><p>${T.ov_body}</p></div><figure class="ex-fig">${overlap(T, rp)}</figure></section>

        <div class="ex-two">
          <section class="card"><h2 class="ex-h3">${T.lim_title}</h2><div class="ex-lims">${T.lim.map(([h, b]) => `<div><h3>${h}</h3><p>${b}</p></div>`).join("")}</div></section>
          <section class="card"><h2 class="ex-h3">${T.ck_title}</h2><ul class="ex-list ex-check">${T.ck.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul></section>
        </div>

        <section class="card"><h2 class="ex-h3">${T.gl_title}</h2><dl class="ex-gl">${T.gl.map(([d, b]) => `<div><dt>${d}</dt><dd>${b}</dd></div>`).join("")}</dl></section>

        <div class="ex-cta"><a class="btn btn-primary" href="#import">${ICON.import} ${T.cta_import}</a><a class="btn" href="#overview">${T.cta_overview}</a><span class="muted">${T.ex_note}</span></div>
      </article>`;

      // interactive confidence meter: normal swing Rp 8 jt over the window
      const swing = 8;
      const svg = v.querySelector("#exConfSvg");
      const out = v.querySelector("#exOut");
      const msg = v.querySelector("#exConfMsg");
      const slider = v.querySelector("#exSlider");
      const draw = () => {
        const val = +slider.value;
        const max = 30,
          W = 420,
          x = (n) => 4 + (n * (W - 8)) / max;
        const z = val / swing;
        const lvl = z >= 2 ? "high" : z >= 1 ? "medium" : "low";
        out.textContent = rp(val * 1e6);
        svg.innerHTML = `<rect class="xg-zone-low" x="${x(0)}" y="10" width="${x(swing) - x(0)}" height="22" rx="4"/><rect class="xg-zone-med" x="${x(swing)}" y="10" width="${x(swing * 2) - x(swing)}" height="22"/><rect class="xg-zone-hi" x="${x(swing * 2)}" y="10" width="${x(max) - x(swing * 2)}" height="22" rx="4"/>
          <text class="xg-t" x="${x(swing) - 4}" y="48" text-anchor="end">1× = ${rp(swing * 1e6)}</text><text class="xg-t" x="${x(swing * 2) - 4}" y="48" text-anchor="end">2×</text>
          <rect class="xg-coralbar" x="${x(0)}" y="58" width="${Math.max(2, x(val) - x(0))}" height="24" rx="6"/>
          <text class="xg-b" x="${Math.min(x(val) + 8, W - 4)}" y="75" ${x(val) > W - 90 ? 'text-anchor="end"' : ""}>${T.s5_extra} ${rp(val * 1e6)}</text>`;
        msg.className = "ex-confmsg c-" + lvl;
        msg.textContent = T["s5_" + (lvl === "high" ? "hi" : lvl === "medium" ? "med" : "low")];
      };
      slider.addEventListener("input", draw);
      draw();
    },
  };
})();
