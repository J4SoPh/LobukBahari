/* ============================================================
   LOBUK BAHARI — Gerbang masuk panel admin (sisi klien)
   ------------------------------------------------------------
   Yang dilakukan modul ini:
   • Pembuatan akun admin pada pemakaian pertama (tanpa sandi bawaan).
   • Verifikasi sandi dengan SHA-256 bergaram dan diulang 24.000 kali,
     dihitung bertahap agar antarmuka tidak membeku.
   • Sesi dengan batas waktu diam, dapat dipilih 15–120 menit.
   • Pemblokiran sementara setelah lima percobaan gagal.
   • Kunci pemulihan sekali tampil untuk menyetel ulang sandi.
   • Catatan audit masuk, gagal, keluar, terkunci, dan ubah sandi.
   ------------------------------------------------------------
   BATAS YANG HARUS DIPAHAMI: seluruh proses berjalan di peramban.
   Gerbang ini menghalangi pemakaian panel pada perangkat ini, bukan
   melindungi berkas di hosting. js/data.js tetap dapat dibaca publik.
   Perlindungan sesungguhnya memerlukan autentikasi di server atau
   proteksi folder dari penyedia hosting.
   ============================================================ */
(function () {
  "use strict";

  var K_AKUN = "lobuk_admin_akun_v2";
  var K_SESI = "lobuk_admin_sesi_v2";
  var K_AUDIT = "lobuk_admin_audit_v2";
  var K_DURASI = "lobuk_admin_durasi_v2";
  var ITER = 24000;
  var MAKS_GAGAL = 5;
  var JENDELA_GAGAL = 10 * 60 * 1000;
  var TANGGA_KUNCI = [60, 120, 300, 600];

  /* ---------- utilitas ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function baca(k, f) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } }
  function tulis(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function buang(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function acakByte(n) {
    var a = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    return a;
  }
  function keHex(b) { var s = ""; for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? "0" : "") + b[i].toString(16); return s; }
  function dariHex(h) { var n = h.length >> 1, a = new Uint8Array(n); for (var i = 0; i < n; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
  function utf8(s) {
    if (window.TextEncoder) return new TextEncoder().encode(s);
    var out = [], i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 128) out.push(c);
      else if (c < 2048) { out.push(192 | (c >> 6), 128 | (c & 63)); }
      else { out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63)); }
    }
    return new Uint8Array(out);
  }

  /* ---------- SHA-256 (mandiri, berjalan di file:// maupun http(s)) ---------- */
  var K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function putar(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
  function sha256(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length, total = Math.ceil((l + 9) / 64) * 64;
    var buf = new Uint8Array(total);
    buf.set(bytes); buf[l] = 0x80;
    var dv = new DataView(buf.buffer), bit = l * 8;
    dv.setUint32(total - 4, bit >>> 0, false);
    dv.setUint32(total - 8, Math.floor(bit / 4294967296), false);
    var w = new Uint32Array(64), i, off;
    for (off = 0; off < total; off += 64) {
      for (i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
      for (i = 16; i < 64; i++) {
        var x = w[i - 15], y = w[i - 2];
        var s0 = (putar(x, 7) ^ putar(x, 18) ^ (x >>> 3)) >>> 0;
        var s1 = (putar(y, 17) ^ putar(y, 19) ^ (y >>> 10)) >>> 0;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = (putar(e, 6) ^ putar(e, 11) ^ putar(e, 25)) >>> 0;
        var ch = ((e & f) ^ (~e & g)) >>> 0;
        var t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
        var S0 = (putar(a, 2) ^ putar(a, 13) ^ putar(a, 22)) >>> 0;
        var mj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        var t2 = (S0 + mj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    var out = new Uint8Array(32), ov = new DataView(out.buffer);
    for (i = 0; i < 8; i++) ov.setUint32(i * 4, H[i], false);
    return out;
  }
  function kdf(sandi, garamHex, iter, kemajuan) {
    return new Promise(function (selesai) {
      var garam = dariHex(garamHex), sb = utf8(String(sandi));
      var awal = new Uint8Array(garam.length + sb.length);
      awal.set(garam); awal.set(sb, garam.length);
      var d = sha256(awal), i = 1;
      function potong() {
        var akhir = Math.min(iter, i + 1500);
        for (; i < akhir; i++) {
          var next = new Uint8Array(32 + garam.length);
          next.set(d); next.set(garam, 32);
          d = sha256(next);
        }
        if (kemajuan) kemajuan(Math.round(i / iter * 100));
        if (i < iter) setTimeout(potong, 0); else selesai(keHex(d));
      }
      potong();
    });
  }
  var ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function kunciPemulihanBaru() {
    var b = acakByte(20), s = "";
    for (var i = 0; i < 20; i++) s += ABC[b[i] % 32];
    return s.match(/.{1,5}/g).join("-");
  }
  function normalKunci(s) { return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function kekuatan(s) {
    s = String(s || "");
    var skor = 0;
    if (s.length >= 8) skor++;
    if (s.length >= 12) skor++;
    if (/[a-z]/.test(s) && /[A-Z]/.test(s)) skor++;
    if (/\d/.test(s)) skor++;
    if (/[^\w\s]/.test(s)) skor++;
    return Math.min(4, skor);
  }

  /* ---------- catatan audit ---------- */
  function audit(jenis, catatan) {
    var a = baca(K_AUDIT, []);
    a.unshift({ ts: Date.now(), jenis: jenis, catatan: catatan || "" });
    tulis(K_AUDIT, a.slice(0, 80));
  }

  /* ---------- sesi ---------- */
  function durasi() { var v = parseInt(localStorage.getItem(K_DURASI) || "60", 10); return [15, 30, 60, 120].indexOf(v) >= 0 ? v : 60; }
  function setDurasi(m) { try { localStorage.setItem(K_DURASI, String(m)); } catch (e) { } var s = sesi(); if (s.aktif) perpanjang(); }
  function sesi() {
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem(K_SESI)); } catch (e) { }
    if (!s || !s.exp) return { aktif: false, sisa: 0, pengguna: null };
    var sisa = Math.max(0, s.exp - Date.now());
    return { aktif: sisa > 0, sisa: sisa, pengguna: s.u, exp: s.exp, mulai: s.mulai };
  }
  function bukaSesi(u) {
    var now = Date.now();
    try { sessionStorage.setItem(K_SESI, JSON.stringify({ u: u, mulai: now, exp: now + durasi() * 60000 })); } catch (e) { }
  }
  function perpanjang() {
    var s = sesi(); if (!s.aktif) return;
    try { sessionStorage.setItem(K_SESI, JSON.stringify({ u: s.pengguna, mulai: s.mulai, exp: Date.now() + durasi() * 60000 })); } catch (e) { }
  }
  function tutupSesi(alasan) {
    var s = sesi();
    buang(K_SESI);
    if (s.aktif) audit("keluar", alasan || "keluar manual");
    tampilGerbang(alasan);
    try { document.dispatchEvent(new CustomEvent("lobuk-auth-keluar", { detail: { alasan: alasan || "manual" } })); } catch (e) { }
  }

  /* ---------- keadaan akun ---------- */
  function akun() { return baca(K_AKUN, null); }
  function adaAkun() { var a = akun(); return !!(a && a.hash && a.garam); }
  function sisaKunci() { var a = akun(); if (!a || !a.kunciSampai) return 0; return Math.max(0, a.kunciSampai - Date.now()); }
  function catatGagal() {
    var a = akun(); if (!a) return 0;
    var now = Date.now();
    a.gagal = (a.gagal || []).filter(function (t) { return now - t < JENDELA_GAGAL; });
    a.gagal.push(now);
    var lebih = a.gagal.length - MAKS_GAGAL;
    if (lebih >= 0) {
      var detik = TANGGA_KUNCI[Math.min(TANGGA_KUNCI.length - 1, lebih)];
      a.kunciSampai = now + detik * 1000;
      a.gagal = [];
      a.tingkatKunci = Math.min(TANGGA_KUNCI.length - 1, lebih + 1);
      tulis(K_AKUN, a);
      audit("terkunci", "Percobaan gagal berulang; jeda " + detik + " detik");
      return detik;
    }
    tulis(K_AKUN, a);
    return 0;
  }
  function bersihGagal() { var a = akun(); if (!a) return; a.gagal = []; a.kunciSampai = 0; a.tingkatKunci = 0; tulis(K_AKUN, a); }

  /* ---------- pemandangan senja pada gerbang ---------- */
  function senja() {
    var W = 1200, H = 900, hor = 560, laut = H - hor, sx = 780, sy = hor - 10, sr = 92;
    function omb(y, a) { var d = "M0 " + y; for (var i = 0; i < 14; i++) d += " q90 " + (i % 2 ? a : -a) + " 180 0"; return d + " V" + H + " H0 Z"; }
    var bintang = "";
    for (var i = 0; i < 16; i++) bintang += "<circle class='la-kedip' style='animation-delay:" + (i % 7) * .45 + "s' cx='" + Math.round((i * 149) % W) + "' cy='" + (Math.round((i * 71) % 230) + 16) + "' r='" + (1.5 + (i % 3) * .5).toFixed(1) + "'/>";
    var tiang = "";
    for (var t = 0; t < 5; t++) { var x = 720 + t * 96; tiang += "<path d='M" + x + " 742h18v158h-18z'/>"; }
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMid slice' aria-hidden='true'>" +
      "<defs><linearGradient id='laL' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#04182a'/><stop offset='.3' stop-color='#0E5A8A'/><stop offset='.56' stop-color='#C2456B'/><stop offset='.79' stop-color='#E8563F'/><stop offset='1' stop-color='#F29F3D'/></linearGradient>" +
      "<linearGradient id='laS' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#E8894A'/><stop offset='.4' stop-color='#12719F'/><stop offset='1' stop-color='#04182a'/></linearGradient>" +
      "<radialGradient id='laG'><stop offset='0' stop-color='#FFC864' stop-opacity='.95'/><stop offset='1' stop-color='#FFC864' stop-opacity='0'/></radialGradient>" +
      "<linearGradient id='laR' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#FFC864' stop-opacity='.85'/><stop offset='1' stop-color='#FFC864' stop-opacity='0'/></linearGradient></defs>" +
      "<rect width='" + W + "' height='" + hor + "' fill='url(#laL)'/>" +
      "<g fill='#FDF6EC'>" + bintang + "</g>" +
      "<circle class='la-pijar' cx='" + sx + "' cy='" + sy + "' r='230' fill='url(#laG)'/>" +
      "<circle cx='" + sx + "' cy='" + sy + "' r='" + sr + "' fill='#FFC864'/>" +
      "<g class='la-hanyut' fill='#E8B8C8' opacity='.4'><ellipse cx='240' cy='210' rx='140' ry='17'/><ellipse cx='350' cy='188' rx='84' ry='11'/><ellipse cx='1010' cy='300' rx='150' ry='15'/></g>" +
      "<path d='M0 " + hor + "q130 -40 280 -16t270 -22 260 14V" + hor + "z' fill='#04182a' opacity='.55'/>" +
      "<rect y='" + hor + "' width='" + W + "' height='" + laut + "' fill='url(#laS)'/>" +
      "<rect class='la-kilau' x='" + (sx - 78) + "' y='" + hor + "' width='156' height='" + laut + "' fill='url(#laR)'/>" +
      "<g fill='#083A5C'><path class='la-ombak' style='animation-duration:34s' d='" + omb(hor + 44, 12) + "' opacity='.55'/>" +
      "<path class='la-ombak' style='animation-duration:23s' d='" + omb(hor + 104, 16) + "' opacity='.78'/>" +
      "<path class='la-ombak' style='animation-duration:15s' d='" + omb(hor + 184, 20) + "'/></g>" +
      "<g class='la-apung' fill='#04182a' transform='translate(250 700)'><path d='M-70 0q70 26 140 0l-17 24q-53 16 -106 0z'/><path d='M-4 -2v-56' stroke='#04182a' stroke-width='6'/><path d='M-4 -58l45 40h-45z'/></g>" +
      "<g fill='#04182a'><path d='M1200 900V722H700v20h500v158z'/>" + tiang + "<path d='M700 710h500v11H700z' opacity='.85'/></g>" +
      "<g stroke='#2A1830' stroke-width='4' fill='none' stroke-linecap='round' opacity='.75'><path d='M470 250q13 -13 26 0t26 0'/><path d='M556 214q11 -11 22 0t22 0'/></g></svg>";
  }

  /* ---------- gaya gerbang ---------- */
  function gaya() {
    if (document.getElementById("la-gaya")) return;
    var s = document.createElement("style");
    s.id = "la-gaya";
    s.textContent =
      "body.la-terkunci{overflow:hidden}" +
      "#laGerbang{position:fixed;inset:0;z-index:3000;display:grid;grid-template-columns:1.05fr .95fr;background:#04182a;font-family:'Plus Jakarta Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff}" +
      "#laGerbang[hidden]{display:none!important}" +
      ".la-seni{position:relative;overflow:hidden}" +
      ".la-seni svg{position:absolute;inset:0;width:100%;height:100%}" +
      ".la-seni-tutup{position:absolute;inset:0;background:linear-gradient(100deg,rgba(4,24,42,.86),rgba(4,24,42,.4) 62%,rgba(4,24,42,.72));}" +
      ".la-seni-isi{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:44px 46px}" +
      ".la-merek{display:flex;align-items:center;gap:11px;font-weight:800;font-size:19px;margin-bottom:auto}" +
      ".la-merek span.b{color:#FFC864}" +
      ".la-merek .logo{width:38px;height:38px;border-radius:9px;background:linear-gradient(135deg,#0E5A8A,#12719F);display:grid;place-items:center;font-size:19px;box-shadow:0 8px 22px rgba(4,24,42,.5)}" +
      ".la-seni-isi h2{font-size:clamp(26px,3vw,38px);line-height:1.14;margin:0 0 12px;letter-spacing:-.02em;max-width:20ch;text-shadow:0 4px 26px rgba(4,24,42,.6)}" +
      ".la-seni-isi h2 em{font-style:normal;background:linear-gradient(100deg,#FFC864,#F29F3D 55%,#E8563F);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}" +
      ".la-seni-isi p{color:rgba(255,255,255,.84);font-size:14px;max-width:46ch;margin:0 0 18px;font-weight:300}" +
      ".la-poin{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}" +
      ".la-poin li{display:flex;gap:10px;align-items:flex-start;font-size:12.8px;color:rgba(255,255,255,.8)}" +
      ".la-poin i{font-style:normal;flex:none;width:22px;height:22px;border-radius:6px;background:rgba(255,200,100,.16);border:1px solid rgba(255,200,100,.4);display:grid;place-items:center;font-size:11px}" +
      ".la-sisi{position:relative;display:grid;place-items:center;padding:32px 30px;overflow-y:auto;background:radial-gradient(120% 90% at 100% 0%,#0b3552 0%,#04182a 62%)}" +
      ".la-sisi::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.05;background-image:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.85\" numOctaves=\"2\"/></filter><rect width=\"140\" height=\"140\" filter=\"url(%23n)\"/></svg>')}" +
      ".la-kartu{position:relative;z-index:1;width:min(430px,100%);background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:28px;backdrop-filter:blur(16px);box-shadow:0 30px 80px rgba(0,0,0,.5)}" +
      ".la-kartu>*{opacity:0;transform:translateY(14px);animation:laNaik .6s cubic-bezier(.2,.7,.2,1) forwards}" +
      ".la-kartu>*:nth-child(2){animation-delay:.07s}.la-kartu>*:nth-child(3){animation-delay:.13s}.la-kartu>*:nth-child(4){animation-delay:.19s}.la-kartu>*:nth-child(5){animation-delay:.25s}.la-kartu>*:nth-child(6){animation-delay:.31s}" +
      "@keyframes laNaik{to{opacity:1;transform:none}}" +
      ".la-ikon{width:52px;height:52px;border-radius:13px;background:linear-gradient(135deg,#FFC864,#F29F3D 55%,#E8563F);display:grid;place-items:center;font-size:25px;margin-bottom:14px;box-shadow:0 10px 26px rgba(242,159,61,.32)}" +
      ".la-kartu h1{font-size:23px;margin:0 0 6px;letter-spacing:-.02em}" +
      ".la-kartu .la-sub{font-size:13px;color:rgba(255,255,255,.74);margin:0 0 20px;line-height:1.55}" +
      ".la-grup{margin-bottom:14px}" +
      ".la-lbl{display:block;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:6px}" +
      ".la-input{width:100%;padding:12px 14px;border-radius:9px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:14px;font-family:inherit;transition:.18s}" +
      ".la-input::placeholder{color:rgba(255,255,255,.4)}" +
      ".la-input:focus{outline:none;border-color:#F29F3D;background:rgba(255,255,255,.12);box-shadow:0 0 0 3px rgba(242,159,61,.18)}" +
      ".la-input.la-salah{border-color:#ff7a6b;background:rgba(226,86,63,.16)}" +
      ".la-baris{display:flex;gap:8px}" +
      ".la-baris .la-input{flex:1;min-width:0}" +
      ".la-mata{flex:none;width:44px;border-radius:9px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:15px;cursor:pointer}" +
      ".la-mata:hover{border-color:#F29F3D;color:#FFC864}" +
      ".la-ukur{display:flex;gap:4px;margin-top:7px}" +
      ".la-ukur i{flex:1;height:5px;border-radius:999px;background:rgba(255,255,255,.16)}" +
      ".la-ukur i.on1{background:#ff7a6b}.la-ukur i.on2{background:#F29F3D}.la-ukur i.on3{background:#7FB4D4}.la-ukur i.on4{background:#5fd39a}" +
      ".la-kuat{font-size:11px;color:rgba(255,255,255,.62);margin-top:5px}" +
      ".la-tombol{width:100%;border:0;border-radius:9px;padding:13px 18px;font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;background:linear-gradient(135deg,#FFC864,#F29F3D 55%,#E8563F);color:#04182a;box-shadow:0 10px 26px rgba(242,159,61,.32);transition:transform .16s}" +
      ".la-tombol:hover{transform:translateY(-2px)}" +
      ".la-tombol[disabled]{opacity:.55;cursor:progress;transform:none}" +
      ".la-tautan{display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between;margin-top:14px}" +
      ".la-tautan button{background:none;border:0;color:#FFC864;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;text-decoration:underline;padding:0}" +
      ".la-tautan button:hover{color:#fff}" +
      ".la-pesan{border-radius:9px;padding:10px 13px;font-size:12.5px;margin-bottom:14px;line-height:1.55}" +
      ".la-pesan.gagal{background:rgba(226,86,63,.18);border-left:3px solid #ff7a6b;color:#ffd8d2}" +
      ".la-pesan.info{background:rgba(18,113,159,.22);border-left:3px solid #7FB4D4;color:#d6ecf7}" +
      ".la-pesan.ok{background:rgba(31,138,95,.2);border-left:3px solid #5fd39a;color:#d5f4e5}" +
      ".la-catatan{margin-top:18px;padding-top:14px;border-top:1px dashed rgba(255,255,255,.18);font-size:11px;color:rgba(255,255,255,.56);line-height:1.6}" +
      ".la-kunci{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:16px;letter-spacing:.1em;background:rgba(255,200,100,.14);border:1px dashed rgba(255,200,100,.5);color:#FFC864;border-radius:9px;padding:13px;text-align:center;word-break:break-all;margin-bottom:10px}" +
      ".la-progres{height:5px;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden;margin-top:10px}" +
      ".la-progres i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7FB4D4,#F29F3D);transition:width .12s}" +
      ".la-sesi-pil{display:flex;gap:6px;margin-top:6px}" +
      ".la-sesi-pil button{flex:1;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:rgba(255,255,255,.74);border-radius:8px;padding:8px 4px;font-size:11.5px;font-weight:700;font-family:inherit;cursor:pointer}" +
      ".la-sesi-pil button.aktif{background:linear-gradient(135deg,#FFC864,#F29F3D);color:#04182a;border-color:transparent}" +
      ".la-sisi::-webkit-scrollbar{width:10px}" +
      ".la-sisi::-webkit-scrollbar-track{background:rgba(255,255,255,.06)}" +
      ".la-sisi::-webkit-scrollbar-thumb{background:linear-gradient(#7FB4D4,#F29F3D);border-radius:8px}" +
      ".la-sisi{scrollbar-width:thin;scrollbar-color:#7FB4D4 rgba(255,255,255,.06)}" +
      ".la-ombak{animation:laJalan linear infinite}" +
      "@keyframes laJalan{to{transform:translateX(-1260px)}}" +
      ".la-apung{animation:laApung 7s ease-in-out infinite;transform-origin:center}" +
      "@keyframes laApung{0%,100%{transform:translate(250px,700px) rotate(-1deg)}50%{transform:translate(250px,690px) rotate(1.4deg)}}" +
      ".la-pijar{animation:laPijar 8s ease-in-out infinite}" +
      "@keyframes laPijar{0%,100%{opacity:.7}50%{opacity:1}}" +
      ".la-kedip{animation:laKedip 3.6s ease-in-out infinite}" +
      "@keyframes laKedip{0%,100%{opacity:.15}50%{opacity:.9}}" +
      ".la-kilau{animation:laKilau 6s ease-in-out infinite}" +
      "@keyframes laKilau{0%,100%{opacity:.35}50%{opacity:.75}}" +
      ".la-hanyut{animation:laHanyut 70s linear infinite}" +
      "@keyframes laHanyut{to{transform:translateX(140px)}}" +
      "@media (max-width:900px){#laGerbang{grid-template-columns:1fr}.la-seni{display:none}.la-sisi{padding:24px 18px}}" +
      "@media (prefers-reduced-motion:reduce){#laGerbang *{animation:none!important;transition:none!important}.la-kartu>*{opacity:1;transform:none}}";
    document.head.appendChild(s);
  }

  /* ---------- kerangka gerbang ---------- */
  var gerbang, mode = "masuk", kunciTerakhir = null, hitungTimer = null;
  function pasang() {
    if (gerbang) return;
    gaya();
    gerbang = document.createElement("div");
    gerbang.id = "laGerbang";
    gerbang.setAttribute("role", "dialog");
    gerbang.setAttribute("aria-modal", "true");
    gerbang.setAttribute("aria-label", "Gerbang masuk panel admin");
    gerbang.hidden = true;
    gerbang.innerHTML =
      "<div class='la-seni'>" + senja() + "<div class='la-seni-tutup'></div><div class='la-seni-isi'>" +
      "<div class='la-merek'><span class='logo'>🌅</span><span>Lobuk<span class='b'>Bahari</span></span></div>" +
      "<h2>Ruang kerja <em>pengelola konten</em></h2>" +
      "<p>Panel ini menyunting seluruh isi situs wisata bahari Desa Lobuk — galeri, daya tarik, fasilitas, lokasi, produk, kontak, dan kata kunci chatbot.</p>" +
      "<ul class='la-poin'>" +
      "<li><i>🔒</i><span>Sandi disimpan sebagai nilai acak bergaram, bukan teks terbaca.</span></li>" +
      "<li><i>⏱</i><span>Sesi berakhir sendiri bila panel ditinggalkan tanpa aktivitas.</span></li>" +
      "<li><i>🧾</i><span>Setiap masuk, gagal, dan keluar tercatat pada riwayat audit.</span></li>" +
      "</ul></div></div>" +
      "<div class='la-sisi'><div class='la-kartu' id='laKartu'></div></div>";
    document.body.appendChild(gerbang);
    gerbang.addEventListener("click", tanganiKlik);
    gerbang.addEventListener("input", tanganiInput);
    gerbang.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var t = e.target;
      if (!t.classList || !t.classList.contains("la-input")) return;
      e.preventDefault();
      var utama = $("#laAksi", gerbang); if (utama) utama.click();
    });
  }
  function latarAktif(v) {
    ["header.top", ".tata", "#bilahBulk", "#laci", "#laciTirai", "#notifikasi"].forEach(function (sel) {
      var el = $(sel); if (!el) return;
      try { el.inert = v; } catch (e) { }
      if (v) el.setAttribute("aria-hidden", "true"); else el.removeAttribute("aria-hidden");
    });
    document.body.classList.toggle("la-terkunci", v);
  }
  function tampilGerbang(alasan) {
    pasang();
    mode = adaAkun() ? "masuk" : "buat";
    gerbang.hidden = false;
    latarAktif(true);
    gambarKartu(alasan);
    mulaiHitung();
  }
  function sembunyiGerbang() {
    if (!gerbang) return;
    gerbang.hidden = true;
    latarAktif(false);
    if (hitungTimer) { clearInterval(hitungTimer); hitungTimer = null; }
  }
  function mulaiHitung() {
    if (hitungTimer) clearInterval(hitungTimer);
    hitungTimer = setInterval(function () {
      var el = $("#laHitung", gerbang);
      var s = sisaKunci();
      if (el) {
        if (s > 0) el.textContent = "Coba lagi dalam " + Math.ceil(s / 1000) + " detik.";
        else { el.textContent = ""; gambarKartu(); }
      }
      var sesiEl = $("#laSesiSisa");
      if (sesiEl) {
        var ss = sesi();
        sesiEl.textContent = ss.aktif ? formatSisa(ss.sisa) : "berakhir";
      }
      if (sesi().aktif === false && gerbang && gerbang.hidden && adaAkun()) tutupSesi("diam");
    }, 1000);
  }
  function formatSisa(ms) {
    var d = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(d / 60), s = d % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function pesan(html, jenis) { return html ? "<div class='la-pesan " + (jenis || "info") + '">' + html + "</div>" : ""; }

  function gambarKartu(alasan, tambahan) {
    var kartu = $("#laKartu", gerbang); if (!kartu) return;
    var a = akun(), kunci = sisaKunci(), html = "";
    if (mode === "buat") {
      html = "<div class='la-ikon'>🛡️</div><h1>Buat akun pengelola</h1>" +
        "<p class='la-sub'>Belum ada akun admin di peramban ini. Tetapkan nama pengguna dan sandi untuk mulai menyunting konten. Tidak ada sandi bawaan.</p>" +
        (tambahan || "") +
        "<div class='la-grup'><label class='la-lbl' for='laUser'>Nama pengguna</label><input class='la-input' id='laUser' type='text' autocomplete='username' value='admin' spellcheck='false'></div>" +
        "<div class='la-grup'><label class='la-lbl' for='laSandi'>Sandi (minimal 8 karakter)</label><div class='la-baris'><input class='la-input' id='laSandi' type='password' autocomplete='new-password'><button type='button' class='la-mata' data-mata='laSandi' aria-label='Tampilkan sandi'>👁</button></div>" +
        "<div class='la-ukur' id='laUkur'><i></i><i></i><i></i><i></i></div><div class='la-kuat' id='laKuat'>Kekuatan sandi: —</div></div>" +
        "<div class='la-grup'><label class='la-lbl' for='laSandi2'>Ulangi sandi</label><input class='la-input' id='laSandi2' type='password' autocomplete='new-password'></div>" +
        "<div class='la-grup'><span class='la-lbl'>Batas waktu diam sesi</span><div class='la-sesi-pil' id='laDurasi'>" +
        [15, 30, 60, 120].map(function (m) { return "<button type='button' data-durasi='" + m + "'" + (durasi() === m ? " class='aktif'" : "") + ">" + m + " mnt</button>"; }).join("") + "</div></div>" +
        "<button class='la-tombol' id='laAksi' type='button' data-aksi='buat'>Buat akun &amp; masuk</button>" +
        "<div class='la-catatan'>Gerbang ini berjalan di peramban Anda. Ia menghalangi pemakaian panel pada perangkat ini, tetapi tidak melindungi berkas di hosting — <b>js/data.js tetap dapat dibaca publik</b>. Untuk perlindungan sesungguhnya, gunakan proteksi folder dari penyedia hosting atau autentikasi di server.</div>";
    } else if (mode === "pemulihan") {
      html = "<div class='la-ikon'>🗝️</div><h1>Setel ulang dengan kunci</h1>" +
        "<p class='la-sub'>Masukkan kunci pemulihan yang unduh saat membuat akun, lalu tetapkan sandi baru.</p>" +
        (tambahan || "") +
        "<div class='la-grup'><label class='la-lbl' for='laKunci'>Kunci pemulihan</label><input class='la-input' id='laKunci' type='text' placeholder='XXXXX-XXXXX-XXXXX-XXXXX' spellcheck='false' autocomplete='off' style='font-family:ui-monospace,Menlo,Consolas,monospace;letter-spacing:.08em'></div>" +
        "<div class='la-grup'><label class='la-lbl' for='laSandi'>Sandi baru</label><div class='la-baris'><input class='la-input' id='laSandi' type='password' autocomplete='new-password'><button type='button' class='la-mata' data-mata='laSandi' aria-label='Tampilkan sandi'>👁</button></div>" +
        "<div class='la-ukur' id='laUkur'><i></i><i></i><i></i><i></i></div><div class='la-kuat' id='laKuat'>Kekuatan sandi: —</div></div>" +
        "<div class='la-grup'><label class='la-lbl' for='laSandi2'>Ulangi sandi baru</label><input class='la-input' id='laSandi2' type='password' autocomplete='new-password'></div>" +
        "<button class='la-tombol' id='laAksi' type='button' data-aksi='pemulihan'>Setel ulang sandi</button>" +
        "<div class='la-tautan'><button type='button' data-mode='masuk'>← Kembali ke masuk</button></div>" +
        "<div class='la-catatan'>Kunci pemulihan hanya berlaku di peramban tempat akun dibuat. Bila kunci hilang dan sandi lupa, akun di perangkat ini dapat dihapus lewat tombol di bawah — konten situs tidak ikut terhapus.<br><button type='button' data-aksi='hapus-akun' style='background:none;border:0;color:#ff9d90;font-weight:700;text-decoration:underline;cursor:pointer;font-family:inherit;font-size:11px;padding:6px 0 0'>Hapus akun di perangkat ini</button></div>";
    } else if (mode === "kunci") {
      html = "<div class='la-ikon'>🔑</div><h1>Kunci pemulihan baru</h1>" +
        "<p class='la-sub'>Simpan kunci ini sekarang. Ia hanya ditampilkan satu kali dan diperlukan bila sandi terlupa.</p>" +
        (tambahan || "") +
        "<div class='la-kunci' id='laKunciTampil'>" + esc(kunciTerakhir || "") + "</div>" +
        "<div class='la-baris' style='margin-bottom:14px'><button class='la-tombol' type='button' data-aksi='salin-kunci' style='flex:1'>📋 Salin</button><button class='la-tombol' type='button' data-aksi='unduh-kunci' style='flex:1;background:rgba(255,255,255,.14);color:#fff;box-shadow:none;border:1.5px solid rgba(255,255,255,.3)'>⬇ Unduh</button></div>" +
        "<button class='la-tombol' id='laAksi' type='button' data-aksi='lanjut'>Saya sudah menyimpan →</button>" +
        "<div class='la-catatan'>Simpan di tempat terpisah dari perangkat ini. Siapa pun yang memegang kunci ini dapat menyetel ulang sandi panel di peramban yang sama.</div>";
    } else {
      var terkunci = kunci > 0;
      html = "<div class='la-ikon'>🔐</div><h1>Masuk panel admin</h1>" +
        "<p class='la-sub'>Kelola konten wisata bahari Desa Lobuk. Sesi berakhir otomatis setelah " + durasi() + " menit tanpa aktivitas.</p>" +
        (alasan === "diam" ? pesan("Sesi berakhir karena tidak ada aktivitas. Silakan masuk kembali.", "info") : "") +
        (alasan === "manual" ? pesan("Anda telah keluar dari panel.", "ok") : "") +
        (tambahan || "") +
        (terkunci ? pesan("Terlalu banyak percobaan gagal. <b id='laHitung'>Coba lagi dalam " + Math.ceil(kunci / 1000) + " detik.</b>", "gagal") : "<div class='la-kuat' id='laHitung' style='margin-bottom:8px'></div>") +
        "<div class='la-grup'><label class='la-lbl' for='laUser'>Nama pengguna</label><input class='la-input' id='laUser' type='text' autocomplete='username' spellcheck='false' value='" + esc((a && a.pengguna) || "admin") + "'" + (terkunci ? " disabled" : "") + "></div>" +
        "<div class='la-grup'><label class='la-lbl' for='laSandi'>Sandi</label><div class='la-baris'><input class='la-input' id='laSandi' type='password' autocomplete='current-password'" + (terkunci ? " disabled" : "") + "><button type='button' class='la-mata' data-mata='laSandi' aria-label='Tampilkan sandi'" + (terkunci ? " disabled" : "") + ">👁</button></div></div>" +
        "<button class='la-tombol' id='laAksi' type='button' data-aksi='masuk'" + (terkunci ? " disabled" : "") + ">Masuk</button>" +
        "<div class='la-tautan'><button type='button' data-mode='pemulihan'>Lupa sandi?</button><a href='index.html' style='color:#FFC864;font-size:12px;font-weight:700;text-decoration:underline'>← Kembali ke situs</a></div>" +
        "<div class='la-catatan'>Gerbang sisi klien: menghalangi pemakaian panel di perangkat ini, bukan melindungi berkas di hosting.Untuk perlindungan nyata, aktifkan proteksi folder pada penyedia hosting.</div>";
    }
    kartu.innerHTML = html;
    var fokus = $("#laSandi", kartu) || $("#laUser", kartu) || $("#laKunci", kartu) || $("#laAksi", kartu);
    if (fokus && !fokus.disabled) setTimeout(function () { fokus.focus(); }, 120);
    perbaruiKuat();
  }

  function perbaruiKuat() {
    var s = $("#laSandi", gerbang), uk = $("#laUkur", gerbang), kt = $("#laKuat", gerbang);
    if (!s || !uk || !kt) return;
    var k = kekuatan(s.value), label = ["terlalu lemah", "lemah", "cukup", "kuat", "sangat kuat"][k];
    $$("i", uk).forEach(function (el, i) { el.className = i < k ? "on" + k : ""; });
    kt.textContent = "Kekuatan sandi: " + (s.value ? label : "—");
  }
  function sibuk(v, teks) {
    var t = $("#laAksi", gerbang); if (!t) return;
    t.disabled = v;
    if (v) { t.dataset.teks = t.textContent; t.textContent = teks || "Memproses…"; }
    else if (t.dataset.teks) t.textContent = t.dataset.teks;
    var p = $("#laProgres", gerbang);
    if (v && !p) { var d = document.createElement("div"); d.className = "la-progres"; d.id = "laProgres"; d.innerHTML = "<i></i>"; t.parentNode.insertBefore(d, t.nextSibling); }
    if (!v && p) p.remove();
  }
  function progres(p) { var el = $("#laProgres i", gerbang); if (el) el.style.width = p + "%"; }
  function gagal(teks, id) {
    gambarKartu(null, pesan(teks, "gagal"));
    if (id) { var el = $("#" + id, gerbang); if (el) { el.classList.add("la-salah"); el.focus(); } }
  }
  function unduhTeks(nama, isi) {
    var b = new Blob([isi], { type: "text/plain;charset=utf-8" }), u = URL.createObjectURL(b);
    var a = document.createElement("a"); a.href = u; a.download = nama; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 800);
  }
  function salin(teks) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(teks);
    return new Promise(function (ok, no) {
      var ta = document.createElement("textarea"); ta.value = teks; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var berhasil = false; try { berhasil = document.execCommand("copy"); } catch (e) { }
      ta.remove(); berhasil ? ok() : no();
    });
  }

  /* ---------- tindakan ---------- */
  function tanganiInput(e) {
    if (e.target.id === "laSandi") perbaruiKuat();
    if (e.target.classList.contains("la-input")) e.target.classList.remove("la-salah");
  }
  function tanganiKlik(e) {
    var t = e.target;
    var mata = t.closest("[data-mata]");
    if (mata && !mata.disabled) {
      var inp = $("#" + mata.getAttribute("data-mata"), gerbang);
      if (inp) { var lihat = inp.type === "password"; inp.type = lihat ? "text" : "password"; mata.textContent = lihat ? "🙈" : "👁"; mata.setAttribute("aria-label", lihat ? "Sembunyikan sandi" : "Tampilkan sandi"); inp.focus(); }
      return;
    }
    var md = t.closest("[data-mode]"); if (md) { mode = md.getAttribute("data-mode"); gambarKartu(); return; }
    var du = t.closest("[data-durasi]"); if (du) { setDurasi(+du.getAttribute("data-durasi")); $$("[data-durasi]", gerbang).forEach(function (x) { x.classList.toggle("aktif", x === du); }); return; }
    var ak = t.closest("[data-aksi]"); if (!ak || ak.disabled) return;
    var aksi = ak.getAttribute("data-aksi");
    if (aksi === "buat") return buatAkun();
    if (aksi === "masuk") return masuk();
    if (aksi === "pemulihan") return pemulihan();
    if (aksi === "hapus-akun") return hapusAkun();
    if (aksi === "salin-kunci") { salin(kunciTerakhir || "").then(function () { ak.textContent = "✓ Tersalin"; setTimeout(function () { ak.textContent = "📋 Salin"; }, 1600); }, function () { ak.textContent = "Gagal menyalin"; }); return; }
    if (aksi === "unduh-kunci") { unduhTeks("kunci-pemulihan-lobuk-admin.txt", "KUNCI PEMULIHAN PANEL ADMIN — LOBUK BAHARI\n\n" + (kunciTerakhir || "") + "\n\nNama pengguna: " + ((akun() || {}).pengguna || "admin") + "\nDibuat: " + new Date().toLocaleString("id-ID") + "\n\nKunci ini hanya berlaku pada peramban tempat akun dibuat.\nSimpan terpisah dari perangkat. Jangan bagikan kepada pihak lain.\n"); return; }
    if (aksi === "lanjut") { kunciTerakhir = null; mode = "masuk"; gambarKartu(null, pesan("Akun siap. Silakan masuk dengan sandi yang baru dibuat.", "ok")); return; }
  }

  function buatAkun() {
    var u = ($("#laUser", gerbang) || {}).value || "", s = ($("#laSandi", gerbang) || {}).value || "", s2 = ($("#laSandi2", gerbang) || {}).value || "";
    u = u.trim();
    if (u.length < 3) return gagal("Nama pengguna minimal 3 karakter.", "laUser");
    if (/\s/.test(u)) return gagal("Nama pengguna tidak boleh memuat spasi.", "laUser");
    if (s.length < 8) return gagal("Sandi minimal 8 karakter.", "laSandi");
    if (kekuatan(s) < 2) return gagal("Sandi terlalu lemah. Campur huruf besar, huruf kecil, angka, atau simbol.", "laSandi");
    if (s !== s2) return gagal("Pengulangan sandi tidak sama.", "laSandi2");
    sibuk(true, "Menyiapkan akun…");
    var garam = keHex(acakByte(16)), gp = keHex(acakByte(16)), kunci = kunciPemulihanBaru();
    kdf(s, garam, ITER, progres).then(function (hash) {
      return kdf(normalKunci(kunci), gp, ITER, progres).then(function (hp) {
        var a = { v: 2, pengguna: u, garam: garam, hash: hash, iter: ITER, metode: "sha256x", dibuat: Date.now(), diubah: Date.now(), garamPemulihan: gp, hashPemulihan: hp, gagal: [], kunciSampai: 0, tingkatKunci: 0 };
        if (!tulis(K_AKUN, a)) { sibuk(false); return gagal("Penyimpanan peramban penuh atau diblokir. Akun tidak dapat dibuat."); }
        audit("buat-akun", "Akun " + u + " dibuat");
        kunciTerakhir = kunci; mode = "kunci"; sibuk(false); gambarKartu();
      });
    });
  }

  function masuk() {
    if (sisaKunci() > 0) return;
    var a = akun(); if (!a) { mode = "buat"; return gambarKartu(); }
    var u = (($("#laUser", gerbang) || {}).value || "").trim(), s = ($("#laSandi", gerbang) || {}).value || "";
    if (!u) return gagal("Nama pengguna wajib diisi.", "laUser");
    if (!s) return gagal("Sandi wajib diisi.", "laSandi");
    sibuk(true, "Memverifikasi…");
    kdf(s, a.garam, a.iter || ITER, progres).then(function (hash) {
      sibuk(false);
      if (u.toLowerCase() !== String(a.pengguna).toLowerCase() || hash !== a.hash) {
        var jeda = catatGagal();
        audit("gagal", "Percobaan masuk untuk “" + u + "”");
        if (jeda) { mode = "masuk"; return gambarKartu(); }
        var sisa = MAKS_GAGAL - ((akun() || {}).gagal || []).length;
        return gagal("Nama pengguna atau sandi tidak cocok. Sisa percobaan sebelum jeda: <b>" + Math.max(0, sisa) + "</b>.", "laSandi");
      }
      bersihGagal();
      bukaSesi(a.pengguna);
      audit("masuk", "Masuk sebagai " + a.pengguna);
      sembunyiGerbang();
      try { document.dispatchEvent(new CustomEvent("lobuk-auth-masuk", { detail: { pengguna: a.pengguna } })); } catch (e) { }
    });
  }

  function pemulihan() {
    var a = akun(); if (!a) { mode = "buat"; return gambarKartu(); }
    var k = normalKunci(($("#laKunci", gerbang) || {}).value || ""), s = ($("#laSandi", gerbang) || {}).value || "", s2 = ($("#laSandi2", gerbang) || {}).value || "";
    if (k.length < 16) return gagal("Kunci pemulihan tidak lengkap.", "laKunci");
    if (s.length < 8) return gagal("Sandi baru minimal 8 karakter.", "laSandi");
    if (kekuatan(s) < 2) return gagal("Sandi baru terlalu lemah.", "laSandi");
    if (s !== s2) return gagal("Pengulangan sandi baru tidak sama.", "laSandi2");
    sibuk(true, "Memeriksa kunci…");
    kdf(k, a.garamPemulihan, a.iter || ITER, progres).then(function (hk) {
      if (hk !== a.hashPemulihan) { sibuk(false); audit("gagal", "Kunci pemulihan salah"); return gagal("Kunci pemulihan tidak cocok dengan akun di peramban ini.", "laKunci"); }
      var garam = keHex(acakByte(16));
      return kdf(s, garam, a.iter || ITER, progres).then(function (hash) {
        a.garam = garam; a.hash = hash; a.diubah = Date.now(); a.gagal = []; a.kunciSampai = 0; a.tingkatKunci = 0;
        tulis(K_AKUN, a);
        audit("pemulihan", "Sandi disetel ulang dengan kunci pemulihan");
        sibuk(false); mode = "masuk";
        gambarKartu(null, pesan("Sandi berhasil disetel ulang. Silakan masuk dengan sandi baru.", "ok"));
      });
    });
  }

  function hapusAkun() {
    if (!window.confirm("Hapus akun admin di peramban ini?\n\nKonten situs dan suntingan lokal TIDAK ikut terhapus. Panel akan kembali ke langkah pembuatan akun.")) return;
    buang(K_AKUN); buang(K_SESI);
    audit("hapus-akun", "Akun dihapus dari peramban ini");
    mode = "buat"; gambarKartu(null, pesan("Akun dihapus. Buat akun baru untuk memakai panel kembali.", "info"));
  }

  /* ---------- API publik ---------- */
  var siapResolve;
  var siap = new Promise(function (r) { siapResolve = r; });
  window.LobukAuth = {
    siap: siap,
    adaAkun: adaAkun,
    sesi: sesi,
    durasi: durasi,
    setDurasi: function (m) { setDurasi(m); },
    sisaKunci: sisaKunci,
    kekuatan: kekuatan,
    audit: function () { return baca(K_AUDIT, []); },
    hapusAudit: function () { tulis(K_AUDIT, []); },
    masuk: function () { tampilGerbang(); },
    keluar: function () { tutupSesi("manual"); },
    kunciSekarang: function () { tutupSesi("manual"); },
    pengguna: function () { var a = akun(); return a ? a.pengguna : null; },
    dibuat: function () { var a = akun(); return a ? a.dibuat : null; },
    diubah: function () { var a = akun(); return a ? a.diubah : null; },
    gantiSandi: function (lama, baru) {
      var a = akun();
      if (!a) return Promise.resolve({ ok: false, pesan: "Belum ada akun." });
      if (String(baru || "").length < 8) return Promise.resolve({ ok: false, pesan: "Sandi baru minimal 8 karakter." });
      if (kekuatan(baru) < 2) return Promise.resolve({ ok: false, pesan: "Sandi baru terlalu lemah." });
      return kdf(lama, a.garam, a.iter || ITER).then(function (h) {
        if (h !== a.hash) { audit("gagal", "Ubah sandi ditolak: sandi lama salah"); return { ok: false, pesan: "Sandi lama tidak cocok." }; }
        var garam = keHex(acakByte(16));
        return kdf(baru, garam, a.iter || ITER).then(function (hash) {
          a.garam = garam; a.hash = hash; a.diubah = Date.now(); tulis(K_AKUN, a);
          perpanjang(); audit("ubah-sandi", "Sandi diperbarui");
          return { ok: true };
        });
      });
    },
    kunciPemulihanBaru: function (sandi) {
      var a = akun();
      if (!a) return Promise.resolve({ ok: false, pesan: "Belum ada akun." });
      return kdf(sandi, a.garam, a.iter || ITER).then(function (h) {
        if (h !== a.hash) return { ok: false, pesan: "Sandi tidak cocok." };
        var kunci = kunciPemulihanBaru(), gp = keHex(acakByte(16));
        return kdf(normalKunci(kunci), gp, a.iter || ITER).then(function (hp) {
          a.garamPemulihan = gp; a.hashPemulihan = hp; tulis(K_AKUN, a);
          audit("pemulihan", "Kunci pemulihan dibuat ulang");
          return { ok: true, kunci: kunci };
        });
      });
    },
    unduhKunci: function (kunci) {
      unduhTeks("kunci-pemulihan-lobuk-admin.txt", "KUNCI PEMULIHAN PANEL ADMIN — LOBUK BAHARI\n\n" + kunci + "\n\nNama pengguna: " + (window.LobukAuth.pengguna() || "admin") + "\nDibuat: " + new Date().toLocaleString("id-ID") + "\n\nKunci ini hanya berlaku pada peramban tempat akun dibuat.\nSimpan terpisah dari perangkat. Jangan bagikan kepada pihak lain.\n");
    },
    hapusAkun: function (sandi) {
      var a = akun();
      if (!a) return Promise.resolve({ ok: false, pesan: "Belum ada akun." });
      return kdf(sandi, a.garam, a.iter || ITER).then(function (h) {
        if (h !== a.hash) return { ok: false, pesan: "Sandi tidak cocok." };
        buang(K_AKUN); buang(K_SESI);
        audit("hapus-akun", "Akun dihapus dari pengaturan");
        tampilGerbang();
        try { document.dispatchEvent(new CustomEvent("lobuk-auth-keluar", { detail: { alasan: "hapus-akun" } })); } catch (e) { }
        return { ok: true };
      });
    }
  };

  /* ---------- pemasangan & penjaga sesi ---------- */
  var terakhirAktivitas = 0;
  function aktivitas() {
    var now = Date.now();
    if (now - terakhirAktivitas < 15000) return;
    terakhirAktivitas = now;
    if (sesi().aktif) perpanjang();
  }
  function mulai() {
    pasang();
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) { document.addEventListener(ev, aktivitas, { passive: true }); });
    if (adaAkun() && sesi().aktif) { sembunyiGerbang(); mulaiHitung(); }
    else tampilGerbang(adaAkun() ? "diam" : null);
    siapResolve(true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulai); else mulai();
})();