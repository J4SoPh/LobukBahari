/* ============================================================
   LOBUK BAHARI — Modul Chatbot · versi 3
   • Mesin pencocokan kata utuh + frasa berbobot (SDD 8).
   • Widget dapat dibesar-kecilkan: pegangan tarik, prasetel
     ukuran, kecilkan/besarkan, ukuran huruf, pindah sisi.
     Geometri tersimpan di peramban.
   • Membaca konten aktif dari window.LOBUK (sudah dimuat oleh
     LobukStore di data.js), sehingga suntingan admin langsung
     terpakai setelah halaman dimuat ulang.
   ============================================================ */
(function () {
  "use strict";

  var D = window.LOBUK || {};
  var UI = window.LobukUI || {};
  var esc = UI.esc || function (s) { return String(s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var KUNCI_CHAT = "lobuk_chat_v2";
  var KUNCI_GEOM = "lobuk_chat_geom_v1";

  var opsi = { mode: "utuh", ambang: 1, bobotFrasa: 3, prioritas: true, slang: true, jejak: false, jeda: 520, saran: 5 };
  var PRASETEL = { kecil: { w: 320, h: 420 }, sedang: { w: 384, h: 566 }, besar: { w: 470, h: 700 }, penuh: { w: 620, h: 860 } };
  var geom = { w: 384, h: 566, fs: 1, preset: "sedang", kecil: false, sisi: "kanan" };
  (function () { try { var g = JSON.parse(localStorage.getItem(KUNCI_GEOM)); if (g) Object.keys(geom).forEach(function (k) { if (g[k] !== undefined) geom[k] = g[k]; }); } catch (e) { } })();
  var simpanGeomTimer = null;
  function simpanGeom() {
    if (simpanGeomTimer) clearTimeout(simpanGeomTimer);
    simpanGeomTimer = setTimeout(function () { simpanGeomTimer = null; try { localStorage.setItem(KUNCI_GEOM, JSON.stringify(geom)); } catch (e) { } }, 220);
  }

  /* ---------- mesin ---------- */
  function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function rapikan(t) { return String(t == null ? "" : t).toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim(); }
  function kamusKeys() { return Object.keys(D.slangKamus || {}).sort(function (a, b) { return b.split(" ").length - a.split(" ").length || b.length - a.length; }); }
  function normalisasiSlang(t) {
    var out = t, keys = kamusKeys();
    for (var i = 0; i < keys.length; i++) {
      var re = new RegExp("\\b" + escapeRe(keys[i]) + "\\b", "g");
      if (re.test(out)) out = out.replace(re, D.slangKamus[keys[i]]);
    }
    return out.replace(/\s+/g, " ").trim();
  }
  function normalizeText(t, pakai) { var b = rapikan(t); if (pakai !== false && opsi.slang) b = normalisasiSlang(b); return b; }
  function akarKata(w) { var a = String(w || ""), p = a.replace(/(nya|ku|mu|lah|kah|pun)$/, ""); return p.length >= 3 ? p : a; }
  function tokensOf(t, p) { var b = normalizeText(t, p); return b ? b.split(" ") : []; }
  function akarTokens(t) { return t.map(akarKata); }
  function cocokFrasa(h, n) {
    if (!n.length || n.length > h.length) return false;
    for (var i = 0; i <= h.length - n.length; i++) { var s = true; for (var j = 0; j < n.length; j++) if (h[i + j] !== n[j]) { s = false; break; } if (s) return true; }
    return false;
  }
  function jelaskan(teks) {
    var asli = String(teks == null ? "" : teks), bersih = normalizeText(asli);
    var tok = bersih ? bersih.split(" ") : [], akar = akarTokens(tok), daftar = D.chatbotIntents || [], nilai = [];
    for (var i = 0; i < daftar.length; i++) {
      var it = daftar[i], kws = it.keywords || [], skor = 0, cocok = [];
      for (var j = 0; j < kws.length; j++) {
        var kb = rapikan(kws[j]); if (!kb) continue;
        var kt = kb.split(" "), frasa = kt.length > 1, bobot = frasa ? opsi.bobotFrasa : 1, kena;
        if (opsi.mode === "substring") kena = bersih.length > 0 && bersih.indexOf(kb) >= 0;
        else if (frasa) kena = cocokFrasa(akar, akarTokens(kt));
        else kena = akar.indexOf(akarKata(kt[0])) >= 0;
        if (kena) { skor += bobot; cocok.push({ kata: kws[j], jenis: frasa ? "frasa" : "kata", bobot: bobot }); }
      }
      nilai.push({ id: it.id, topik: it.topik || it.id, priority: it.priority == null ? 99 : it.priority, skor: skor, cocok: cocok, jumlahKataKunci: kws.length });
    }
    nilai.sort(function (a, b) { if (b.skor !== a.skor) return b.skor - a.skor; return opsi.prioritas ? a.priority - b.priority : 0; });
    var top = nilai.length ? nilai[0].skor : 0;
    var seri = nilai.filter(function (p) { return p.skor === top && p.skor > 0; }).map(function (p) { return p.id; });
    var terpilih = (top >= opsi.ambang && top > 0) ? nilai[0] : null;
    var intent = terpilih ? daftar.filter(function (x) { return x.id === terpilih.id; })[0] : null;
    return { asli: asli, bersih: bersih, token: tok, akar: akar, penilaian: nilai, terpilih: terpilih, intent: intent, fallback: !terpilih, seri: seri, terpakaiSlang: opsi.slang && bersih !== rapikan(asli), mode: opsi.mode, ambang: opsi.ambang, bobotFrasa: opsi.bobotFrasa };
  }
  function getReply(t) { var j = jelaskan(t); return j.intent ? j.intent.reply : (D.jawabanFallback || "Maaf, saya belum memahami pertanyaan itu."); }
  function saranUntuk(j) {
    var pool = (j && j.intent && j.intent.saran && j.intent.saran.length) ? j.intent.saran.slice() : [];
    var umum = D.saranCepat || [];
    for (var i = 0; i < umum.length && pool.length < opsi.saran; i++) if (pool.indexOf(umum[i]) < 0) pool.push(umum[i]);
    return pool.slice(0, Math.max(3, opsi.saran));
  }

  /* ---------- widget ---------- */
  var terbuka = false, sudahSapa = false, panel, kotakPesan, masukan, tombol, barSaran, ukuranBadge, pill;
  var jedaTimer = null;

  function ambilRiwayat() { try { return JSON.parse(sessionStorage.getItem(KUNCI_CHAT)) || []; } catch (e) { return []; } }
  function simpanRiwayat(r) { try { sessionStorage.setItem(KUNCI_CHAT, JSON.stringify(r.slice(-40))); } catch (e) { } }

  function gelembung(html, siapa, jejak) {
    var el = document.createElement("div");
    el.className = "pesan " + (siapa === "pengguna" ? "pakai" : "bot");
    var ex = "";
    if (jejak && siapa === "bot") ex = "<div class='jejak-pesan'>" + (jejak.fallback ? "fallback · tidak ada intent mencapai ambang " + jejak.ambang : "intent <b>" + esc(jejak.terpilih.id) + "</b> · skor " + jejak.terpilih.skor + " · " + esc(jejak.terpilih.cocok.map(function (c) { return c.kata; }).join(", "))) + "</div>";
    el.innerHTML = "<span class='mini'>" + (siapa === "pengguna" ? "🧑" : "🌅") + "</span><div class='gelembung'>" + html + ex + "</div>";
    return el;
  }
  function appendMessage(isi, siapa, simpan, jejak) {
    var el = gelembung(siapa === "pengguna" ? esc(isi) : isi, siapa, jejak);
    kotakPesan.appendChild(el); kotakPesan.scrollTop = kotakPesan.scrollHeight;
    if (simpan !== false) { var r = ambilRiwayat(); r.push({ p: siapa, i: isi }); simpanRiwayat(r); }
    return el;
  }
  function pasangSaran(j) {
    if (!barSaran) return;
    barSaran.innerHTML = saranUntuk(j).map(function (s) { return "<button type='button' data-saran='" + esc(s) + "'>" + esc(s) + "</button>"; }).join("") + "<button type='button' data-bersih='1'>🧹 Bersihkan</button>";
  }
  function sapaan() {
    if (sudahSapa) return; sudahSapa = true;
    appendMessage("<p>Halo! Saya <b>asisten wisata Desa Lobuk</b>. 🌅</p><p>Tanyakan dengan bahasa sehari-hari pun bisa — <i>“pantainya dimana”</i>, <i>“brp tiket masuk”</i>, atau <i>“ada toilet gak”</i>.</p><div class='kotak-info'>Ukuran jendela ini bisa Anda ubah: tarik pegangan di sudut kiri-atas, atau pakai tombol ukuran di kepala jendela.</div>", "bot", false);
    pasangSaran(null);
  }
  function kirim(teks) {
    var nilai = String(typeof teks === "string" ? teks : (masukan ? masukan.value : "")).trim();
    if (!nilai) return false;
    if (masukan) masukan.value = "";
    if (geom.kecil) setKecil(false);
    appendMessage(nilai, "pengguna");
    var t = document.createElement("div");
    t.className = "pesan bot";
    t.innerHTML = "<span class='mini'>🌅</span><div class='gelembung mengetik'><i></i><i></i><i></i></div>";
    kotakPesan.appendChild(t); kotakPesan.scrollTop = kotakPesan.scrollHeight;
    if (jedaTimer) clearTimeout(jedaTimer);
    jedaTimer = setTimeout(function () {
      jedaTimer = null;
      if (t.parentNode) t.parentNode.removeChild(t);
      var j = jelaskan(nilai);
      appendMessage(j.intent ? j.intent.reply : (D.jawabanFallback || ""), "bot", true, opsi.jejak ? j : null);
      pasangSaran(j);
      if (masukan) masukan.focus();
      document.dispatchEvent(new CustomEvent("lobukchat-jawab", { detail: j }));
    }, Math.max(0, opsi.jeda));
    return true;
  }
  function bersihkan() {
    if (!kotakPesan) return;
    kotakPesan.innerHTML = "";
    try { sessionStorage.removeItem(KUNCI_CHAT); } catch (e) { }
    sudahSapa = false; sapaan();
    if (UI.notif) UI.notif("Riwayat percakapan dibersihkan", "info");
  }

  /* ---------- geometri ---------- */
  function batas() {
    var vw = window.innerWidth, vh = window.innerHeight;
    return { minW: Math.min(300, vw - 24), minH: 320, maxW: Math.max(300, vw - 24), maxH: Math.max(360, vh - 92) };
  }
  function terapGeom() {
    if (!panel) return;
    var b = batas(), ponsel = window.innerWidth <= 640;
    geom.w = Math.max(b.minW, Math.min(b.maxW, Math.round(geom.w)));
    geom.h = Math.max(b.minH, Math.min(b.maxH, Math.round(geom.h)));
    geom.fs = Math.max(0.85, Math.min(1.45, geom.fs));
    panel.style.setProperty("--cb-w", geom.w + "px");
    panel.style.setProperty("--cb-h", geom.kecil ? "auto" : geom.h + "px");
    panel.style.setProperty("--cb-fs", geom.fs);
    panel.classList.toggle("kecil", !!geom.kecil);
    panel.classList.toggle("sisi-kiri", geom.sisi === "kiri" && !ponsel);
    panel.setAttribute("data-preset", geom.preset);
    $$(".cb-ukuran button", panel).forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-u") === geom.preset && !geom.kecil); });
    var tk = $("#cbKecil", panel); if (tk) { tk.textContent = geom.kecil ? "▢" : "—"; tk.setAttribute("aria-label", geom.kecil ? "Kembalikan ukuran jendela" : "Kecilkan jendela"); }
    var sf = $("#cbFsNilai", panel); if (sf) sf.textContent = Math.round(geom.fs * 100) + "%";
    var ds = $("#cbSisi", panel); if (ds) { ds.textContent = geom.sisi === "kiri" ? "⇥" : "⇤"; ds.setAttribute("aria-label", geom.sisi === "kiri" ? "Pindahkan ke kanan" : "Pindahkan ke kiri"); }
    if (tombol) tombol.classList.toggle("sisi-kiri", geom.sisi === "kiri" && !ponsel);
    if (kotakPesan) kotakPesan.scrollTop = kotakPesan.scrollHeight;
    simpanGeom();
  }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function $(s, c) { return (c || document).querySelector(s); }
  function setPreset(nama) {
    var p = PRASETEL[nama]; if (!p) return;
    geom.preset = nama; geom.kecil = false;
    var b = batas();
    geom.w = Math.min(p.w, b.maxW); geom.h = Math.min(p.h, b.maxH);
    terapGeom();
  }
  function setKecil(v) { geom.kecil = !!v; terapGeom(); }
  function setFs(d) { geom.fs = Math.round((geom.fs + d) * 100) / 100; terapGeom(); }
  function setSisi() { geom.sisi = geom.sisi === "kiri" ? "kanan" : "kiri"; terapGeom(); }

  function pasangTarik() {
    var peg = $("#cbTarik", panel); if (!peg) return;
    var aktif = false, sx = 0, sy = 0, sw = 0, sh = 0;
    function mulai(e) {
      if (geom.kecil) setKecil(false);
      aktif = true; sx = e.clientX; sy = e.clientY; sw = geom.w; sh = geom.h;
      panel.classList.add("menarik");
      if (ukuranBadge) { ukuranBadge.hidden = false; ukuranBadge.textContent = sw + " × " + sh; }
      try { peg.setPointerCapture(e.pointerId); } catch (err) { }
      e.preventDefault();
    }
    function gerak(e) {
      if (!aktif) return;
      var b = batas(), arah = geom.sisi === "kiri" ? -1 : 1;
      geom.w = Math.max(b.minW, Math.min(b.maxW, sw - arah * (e.clientX - sx)));
      geom.h = Math.max(b.minH, Math.min(b.maxH, sh - (e.clientY - sy)));
      geom.preset = "kustom";
      panel.style.setProperty("--cb-w", geom.w + "px");
      panel.style.setProperty("--cb-h", geom.h + "px");
      if (ukuranBadge) ukuranBadge.textContent = Math.round(geom.w) + " × " + Math.round(geom.h);
      $$(".cb-ukuran button", panel).forEach(function (x) { x.classList.remove("aktif"); });
    }
    function selesai(e) {
      if (!aktif) return;
      aktif = false; panel.classList.remove("menarik");
      if (ukuranBadge) ukuranBadge.hidden = true;
      try { peg.releasePointerCapture(e.pointerId); } catch (err) { }
      terapGeom();
    }
    peg.addEventListener("pointerdown", mulai);
    peg.addEventListener("pointermove", gerak);
    peg.addEventListener("pointerup", selesai);
    peg.addEventListener("pointercancel", selesai);
    peg.addEventListener("keydown", function (e) {
      var langkah = e.shiftKey ? 40 : 16, pakai = true;
      if (e.key === "ArrowLeft") geom.w += (geom.sisi === "kiri" ? -langkah : langkah);
      else if (e.key === "ArrowRight") geom.w -= (geom.sisi === "kiri" ? -langkah : langkah);
      else if (e.key === "ArrowUp") geom.h += langkah;
      else if (e.key === "ArrowDown") geom.h -= langkah;
      else pakai = false;
      if (pakai) { e.preventDefault(); geom.preset = "kustom"; geom.kecil = false; terapGeom(); }
    });
  }

  function buka() {
    if (!panel) return;
    terbuka = true; panel.classList.add("buka"); document.body.classList.add("chat-buka");
    if (tombol) tombol.setAttribute("aria-expanded", "true");
    sapaan(); terapGeom();
    setTimeout(function () { if (masukan && !geom.kecil) masukan.focus(); }, 200);
  }
  function tutup() {
    if (!panel) return;
    terbuka = false; panel.classList.remove("buka"); document.body.classList.remove("chat-buka");
    if (tombol) { tombol.setAttribute("aria-expanded", "false"); tombol.focus(); }
  }

  function gaya() {
    if (document.getElementById("gaya-chatbot-lobuk")) return;
    var s = document.createElement("style");
    s.id = "gaya-chatbot-lobuk";
    s.textContent =
      ".chat-tombol{position:fixed;right:20px;bottom:20px;z-index:1300;display:flex;align-items:center;gap:10px;border:0;border-radius:999px;padding:12px 20px 12px 14px;background:linear-gradient(135deg,#0E5A8A,#12719F);color:#fff;font-weight:700;font-size:14px;font-family:inherit;box-shadow:0 14px 34px rgba(14,90,138,.4);transition:transform .2s,opacity .2s,right .25s,left .25s;cursor:pointer}" +
      ".chat-tombol.sisi-kiri{right:auto;left:20px}" +
      ".chat-tombol:hover{transform:translateY(-3px)}" +
      ".chat-tombol .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#FFC864,#F29F3D 55%,#E8563F);display:grid;place-items:center;font-size:16px}" +
      ".chat-tombol::after{content:'';position:absolute;inset:0;border-radius:999px;border:2px solid #F29F3D;opacity:0;animation:cbDenyut 3.4s ease-out infinite;pointer-events:none}" +
      "@keyframes cbDenyut{0%{opacity:.6;transform:scale(1)}70%{opacity:0;transform:scale(1.16)}100%{opacity:0}}" +
      "body.chat-buka .chat-tombol{transform:scale(.9);opacity:0;pointer-events:none}" +
      ".cb-pill{position:fixed;right:20px;bottom:78px;z-index:1299;display:flex;align-items:center;gap:9px;background:#06263C;color:#fff;border:1px solid rgba(255,255,255,.16);border-left:3px solid #F29F3D;border-radius:999px;padding:8px 14px;font-size:12px;font-family:inherit;box-shadow:0 12px 30px rgba(6,38,60,.35)}" +
      ".cb-pill.sisi-kiri{right:auto;left:20px}" +
      ".cb-pill button{border:0;background:linear-gradient(135deg,#FFC864,#F29F3D);color:#06263C;border-radius:999px;padding:5px 11px;font-weight:800;font-size:11.5px;cursor:pointer;font-family:inherit}" +
      ".chat-panel{position:fixed;right:20px;bottom:20px;z-index:1310;width:var(--cb-w,384px);height:var(--cb-h,566px);max-width:calc(100vw - 24px);max-height:calc(100vh - 92px);display:none;flex-direction:column;background:#06263C;border:1px solid rgba(255,255,255,.16);border-radius:10px;overflow:hidden;box-shadow:0 30px 70px rgba(6,38,60,.5);font-family:inherit;font-size:calc(13.5px * var(--cb-fs,1));transition:width .18s,height .18s,right .25s,left .25s}" +
      ".chat-panel.menarik{transition:none;user-select:none}" +
      ".chat-panel.buka{display:flex}" +
      ".chat-panel.sisi-kiri{right:auto;left:20px}" +
      ".chat-panel.kecil{height:auto}" +
      ".chat-panel.kecil .chat-pesan,.chat-panel.kecil .saran,.chat-panel.kecil .chat-masukan,.chat-panel.kecil .chat-kaki,.chat-panel.kecil .cb-tarik{display:none}" +
      ".cb-tarik{position:absolute;top:0;left:0;width:22px;height:22px;z-index:3;border:0;background:transparent;cursor:nwse-resize;display:grid;place-items:center;padding:0;border-radius:10px 0 8px 0}" +
      ".chat-panel.sisi-kiri .cb-tarik{left:auto;right:0;cursor:nesw-resize;border-radius:0 10px 0 8px}" +
      ".cb-tarik i{width:9px;height:9px;border-left:2px solid rgba(255,255,255,.6);border-top:2px solid rgba(255,255,255,.6);border-radius:2px 0 0 0;display:block}" +
      ".chat-panel.sisi-kiri .cb-tarik i{border-left:0;border-right:2px solid rgba(255,255,255,.6);border-radius:0 2px 0 0}" +
      ".cb-tarik:hover i{border-color:#FFC864}" +
      ".cb-ukur{position:absolute;top:26px;left:10px;z-index:4;background:rgba(6,38,60,.92);border:1px solid rgba(255,255,255,.2);color:#FFC864;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:800;pointer-events:none}" +
      ".chat-panel.sisi-kiri .cb-ukur{left:auto;right:10px}" +
      ".chat-kepala{display:flex;align-items:center;gap:9px;padding:12px 14px 12px 24px;background:linear-gradient(135deg,#083A5C,#0E5A8A);border-bottom:1px solid rgba(255,255,255,.14);color:#fff;flex:none}" +
      ".chat-panel.sisi-kiri .chat-kepala{padding:12px 24px 12px 14px}" +
      ".chat-kepala .avatar{width:2.6em;height:2.6em;flex:none;border-radius:50%;background:linear-gradient(135deg,#FFC864,#F29F3D 55%,#E8563F);display:grid;place-items:center;font-size:1.15em}" +
      ".chat-kepala .teks{min-width:0;flex:1}" +
      ".chat-kepala b{display:block;font-size:1.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".chat-kepala small{font-size:.78em;color:#8FE3B8}" +
      ".cb-ikon{width:2em;height:2em;flex:none;border-radius:7px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff;font-size:.9em;display:grid;place-items:center;cursor:pointer;font-family:inherit;line-height:1}" +
      ".cb-ikon:hover{background:#F29F3D;color:#06263C;border-color:transparent}" +
      ".cb-ikon.tutup:hover{background:#C2412D;color:#fff}" +
      ".cb-bilah{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 12px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.12);flex:none}" +
      ".cb-ukuran{display:flex;gap:3px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:7px;padding:3px}" +
      ".cb-ukuran button{border:0;background:transparent;color:rgba(255,255,255,.72);border-radius:5px;padding:.35em .6em;font-size:.78em;font-weight:800;cursor:pointer;font-family:inherit}" +
      ".cb-ukuran button.aktif{background:linear-gradient(135deg,#FFC864,#F29F3D);color:#06263C}" +
      ".cb-huruf{display:flex;align-items:center;gap:4px;margin-left:auto}" +
      ".cb-huruf b{font-size:.75em;color:#FFC864;min-width:3em;text-align:center}" +
      ".chat-pesan{flex:1;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:11px;background:linear-gradient(180deg,#06263C,#083A5C)}" +
      ".chat-pesan::-webkit-scrollbar{width:10px}" +
      ".chat-pesan::-webkit-scrollbar-track{background:rgba(255,255,255,.06)}" +
      ".chat-pesan::-webkit-scrollbar-thumb{background:linear-gradient(#7FB4D4,#F29F3D);border-radius:8px}" +
      ".chat-pesan::-webkit-scrollbar-thumb:hover{background:linear-gradient(#FFC864,#E8563F)}" +
      ".chat-pesan{scrollbar-width:thin;scrollbar-color:#7FB4D4 rgba(255,255,255,.06)}" +
      ".pesan{display:flex;gap:8px;max-width:90%}" +
      ".pesan.pakai{align-self:flex-end;flex-direction:row-reverse}" +
      ".pesan .mini{width:2em;height:2em;flex:none;border-radius:50%;background:linear-gradient(135deg,#0E5A8A,#12719F);display:grid;place-items:center;font-size:.9em}" +
      ".pesan.pakai .mini{background:linear-gradient(135deg,#FFC864,#F29F3D)}" +
      ".gelembung{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#EAF2F7;border-radius:9px;border-top-left-radius:3px;padding:.75em .95em;font-size:1em;line-height:1.62;overflow-wrap:anywhere}" +
      ".pesan.pakai .gelembung{background:linear-gradient(135deg,#0E5A8A,#12719F);border-color:transparent;color:#fff;border-radius:9px;border-top-right-radius:3px}" +
      ".gelembung b{color:#FFC864}.pesan.pakai .gelembung b{color:#fff}" +
      ".gelembung p{margin:0 0 .55em}.gelembung p:last-child{margin:0}" +
      ".gelembung ul{padding-left:1.2em;margin:.5em 0}.gelembung li{margin-bottom:.28em}" +
      ".gelembung a{color:#FFC864;font-weight:700}" +
      ".kotak-info{background:rgba(18,113,159,.22);border-left:3px solid #7FB4D4;border-radius:6px;padding:.6em .8em;margin:.6em 0;font-size:.9em;color:#CFE6F2}" +
      ".tautan-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(242,159,61,.16);border:1px solid rgba(242,159,61,.45);color:#FFC864;border-radius:999px;padding:.32em .8em;font-size:.86em;font-weight:700;margin:.32em .32em 0 0;text-decoration:none}" +
      ".tautan-chip:hover{background:#F29F3D;color:#06263C}" +
      ".jejak-pesan{margin-top:.6em;padding-top:.5em;border-top:1px dashed rgba(255,255,255,.2);font-size:.78em;color:#9FC6DC}" +
      ".saran{display:flex;gap:6px;overflow-x:auto;padding:9px 12px;border-top:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.03);flex:none}" +
      ".saran::-webkit-scrollbar{height:8px}" +
      ".saran::-webkit-scrollbar-track{background:rgba(255,255,255,.05)}" +
      ".saran::-webkit-scrollbar-thumb{background:#12719F;border-radius:8px}" +
      ".saran button{flex:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#DCEBF4;border-radius:999px;padding:.45em .85em;font-size:.85em;font-weight:600;cursor:pointer;font-family:inherit;transition:.18s}" +
      ".saran button:hover{border-color:#F29F3D;color:#FFC864}" +
      ".chat-masukan{display:flex;gap:8px;padding:11px 12px;border-top:1px solid rgba(255,255,255,.14);background:rgba(6,38,60,.7);flex:none}" +
      ".chat-masukan input{flex:1;min-width:0;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.14);border-radius:999px;padding:.75em 1.1em;color:#fff;font-size:1em;font-family:inherit}" +
      ".chat-masukan input::placeholder{color:rgba(255,255,255,.46)}" +
      ".chat-masukan input:focus{outline:none;border-color:#F29F3D}" +
      ".chat-kirim{width:2.9em;height:2.9em;flex:none;border-radius:50%;border:0;background:linear-gradient(135deg,#FFC864,#F29F3D 55%,#E8563F);color:#06263C;font-size:1em;display:grid;place-items:center;cursor:pointer;transition:transform .18s}" +
      ".chat-kirim:hover{transform:scale(1.07)}" +
      ".chat-kaki{padding:0 12px 9px;font-size:.74em;color:rgba(255,255,255,.46);text-align:center;background:rgba(6,38,60,.7);flex:none}" +
      ".mengetik{display:flex;gap:5px;padding:.9em 1em}" +
      ".mengetik i{width:7px;height:7px;border-radius:50%;background:#7FB4D4;animation:cbKetik 1.3s infinite}" +
      ".mengetik i:nth-child(2){animation-delay:.16s}.mengetik i:nth-child(3){animation-delay:.32s}" +
      "@keyframes cbKetik{0%,60%,100%{transform:none;opacity:.4}30%{transform:translateY(-6px);opacity:1}}" +
      "@media (max-width:640px){.chat-panel{right:0;left:0;bottom:0;width:100%!important;max-width:100%;height:var(--cb-h,566px);max-height:86vh;border-radius:10px 10px 0 0}.chat-panel.kecil{height:auto}.cb-tarik{display:none}.chat-tombol{right:14px;bottom:14px;padding:11px 17px 11px 12px}.chat-tombol.sisi-kiri{left:14px;right:auto}.cb-pill{right:14px;bottom:72px}.cb-pill.sisi-kiri{left:14px;right:auto}}" +
      "@media (prefers-reduced-motion:reduce){.chat-tombol::after,.mengetik i{animation:none!important}.chat-panel{transition:none}}";
    document.head.appendChild(s);
  }

  function initWidget() {
    gaya();
    tombol = document.createElement("button");
    tombol.type = "button"; tombol.className = "chat-tombol";
    tombol.setAttribute("aria-expanded", "false"); tombol.setAttribute("aria-controls", "chatPanel");
    tombol.innerHTML = "<span class='avatar'>🌅</span><span>Tanya Wisata</span>";
    document.body.appendChild(tombol);

    panel = document.createElement("section");
    panel.className = "chat-panel"; panel.id = "chatPanel";
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Chatbot wisata Desa Lobuk");
    panel.innerHTML =
      "<button type='button' class='cb-tarik' id='cbTarik' aria-label='Tarik untuk mengubah ukuran jendela. Gunakan tombol panah untuk mengubah lewat papan ketik.'><i></i></button>" +
      "<span class='cb-ukur' id='cbUkur' hidden></span>" +
      "<header class='chat-kepala'><span class='avatar'>🌅</span><div class='teks'><b>Asisten Wisata Lobuk</b><small>● Pencocokan kata utuh aktif</small></div>" +
      "<button type='button' class='cb-ikon' id='cbKecil' aria-label='Kecilkan jendela'>—</button>" +
      "<button type='button' class='cb-ikon tutup' id='cbTutup' aria-label='Tutup chatbot'>✕</button></header>" +
      "<div class='cb-bilah'>" +
        "<div class='cb-ukuran' role='group' aria-label='Prasetel ukuran jendela'>" +
          "<button type='button' data-u='kecil'>S</button><button type='button' data-u='sedang'>M</button>" +
          "<button type='button' data-u='besar'>L</button><button type='button' data-u='penuh'>XL</button>" +
        "</div>" +
        "<button type='button' class='cb-ikon' id='cbSisi' aria-label='Pindahkan sisi jendela'>⇤</button>" +
        "<div class='cb-huruf'><button type='button' class='cb-ikon' id='cbFsKurang' aria-label='Perkecil huruf'>A−</button>" +
        "<b id='cbFsNilai'>100%</b><button type='button' class='cb-ikon' id='cbFsTambah' aria-label='Perbesar huruf'>A+</button></div>" +
      "</div>" +
      "<div class='chat-pesan' id='chatPesan' aria-live='polite'></div>" +
      "<div class='saran' id='chatSaran'></div>" +
      "<div class='chat-masukan'><input id='chatMasukan' type='text' autocomplete='off' placeholder='Tulis pertanyaan… boleh bahasa sehari-hari' aria-label='Pertanyaan untuk chatbot'>" +
      "<button type='button' class='chat-kirim' id='chatKirim' aria-label='Kirim pesan'>➤</button></div>" +
      "<div class='chat-kaki'>Tarik sudut kiri-atas atau pakai S/M/L/XL untuk mengubah ukuran</div>";
    document.body.appendChild(panel);

    kotakPesan = $("#chatPesan", panel); masukan = $("#chatMasukan", panel);
    barSaran = $("#chatSaran", panel); ukuranBadge = $("#cbUkur", panel);

    pasangSaran(null);
    barSaran.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.getAttribute("data-bersih")) { bersihkan(); return; }
      kirim(b.getAttribute("data-saran") || b.textContent);
    });
    $("#cbTutup", panel).addEventListener("click", tutup);
    $("#cbKecil", panel).addEventListener("click", function () { setKecil(!geom.kecil); });
    $("#cbSisi", panel).addEventListener("click", setSisi);
    $("#cbFsKurang", panel).addEventListener("click", function () { setFs(-0.1); });
    $("#cbFsTambah", panel).addEventListener("click", function () { setFs(0.1); });
    panel.querySelector(".cb-ukuran").addEventListener("click", function (e) {
      var b = e.target.closest("[data-u]"); if (b) setPreset(b.getAttribute("data-u"));
    });
    panel.querySelector(".chat-kepala").addEventListener("dblclick", function (e) {
      if (e.target.closest("button")) return;
      setPreset(geom.preset === "besar" || geom.preset === "penuh" ? "sedang" : "besar");
    });
    $("#chatKirim", panel).addEventListener("click", function () { kirim(); });
    masukan.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); kirim(); } });
    tombol.addEventListener("click", function () { terbuka ? tutup() : buka(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && terbuka) tutup(); });
    window.addEventListener("resize", function () { if (terbuka) terapGeom(); });
    pasangTarik();

    var riwayat = ambilRiwayat();
    if (riwayat.length) { sudahSapa = true; riwayat.forEach(function (r) { appendMessage(r.i, r.p, false); }); }

    document.addEventListener("click", function (e) {
      var p = e.target.closest("[data-chat-open]"); if (!p) return;
      e.preventDefault();
      document.body.classList.remove("menu-open");
      var bg = document.getElementById("burger"); if (bg) bg.setAttribute("aria-expanded", "false");
      buka();
      var t = p.getAttribute("data-chat-open");
      if (t && t !== "true") setTimeout(function () { kirim(t); }, 240);
    });

    /* Pemberitahuan bila admin menyimpan konten baru di tab lain */
    window.addEventListener("storage", function (e) {
      if (!window.LobukStore || e.key !== window.LobukStore.kunci || pill) return;
      pill = document.createElement("div");
      pill.className = "cb-pill" + (geom.sisi === "kiri" ? " sisi-kiri" : "");
      pill.innerHTML = "<span>📝 Konten diperbarui admin</span><button type='button'>Muat ulang</button>";
      pill.querySelector("button").addEventListener("click", function () { location.reload(); });
      document.body.appendChild(pill);
      setTimeout(function () { if (pill && pill.parentNode) { pill.parentNode.removeChild(pill); pill = null; } }, 20000);
    });

    terapGeom();
    document.dispatchEvent(new CustomEvent("lobukchat-siap"));
  }

  window.LobukChat = {
    versi: 3, opsi: opsi,
    setOpsi: function (p) { Object.keys(p || {}).forEach(function (k) { if (k in opsi) opsi[k] = p[k]; }); if (barSaran) pasangSaran(null); return opsi; },
    normalizeText: normalizeText, akarKata: akarKata, tokensOf: tokensOf,
    jelaskan: jelaskan, getReply: getReply, saranUntuk: saranUntuk,
    kirim: kirim, buka: buka, tutup: tutup, bersihkan: bersihkan,
    geometri: function () { return geom; },
    setUkuran: function (w, h) { geom.w = w; geom.h = h; geom.preset = "kustom"; geom.kecil = false; terapGeom(); },
    setPreset: setPreset, setKecil: setKecil, setFs: setFs, setSisi: setSisi,
    get terbuka() { return terbuka; },
    elemen: function () { return { panel: panel, pesan: kotakPesan, masukan: masukan, tombol: tombol, saran: barSaran }; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initWidget);
  else initWidget();
})();