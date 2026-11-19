/* ============================================================
   LOBUK BAHARI — Lapisan data admin (CRUD, undo, ekspor/impor)
   Dipakai hanya oleh admin.html. Situs cukup memuat data.js.
   Semua perubahan disimpan di localStorage peramban, lalu dapat
   diekspor menjadi berkas js/data.js untuk penerapan permanen.
   ============================================================ */
(function () {
  "use strict";
  var S = window.LobukStore;
  if (!S) return;

  var RIWAYAT = [];
  var MAKS = 30;
  var KUNCI_TAMPILAN = "lobuk_tampilan_v1";
  var KUNCI_KUNCI = "lobuk_admin_kunci_v1";
  var KUNCI_ATUR = "lobuk_admin_atur_v1";

  function catat(label) {
    RIWAYAT.unshift({ label: label, ts: Date.now(), cuplikan: S.salin(S.aktif()) });
    if (RIWAYAT.length > MAKS) RIWAYAT.pop();
  }
  function sebelum(label) {
    RIWAYAT.unshift({ label: label, ts: Date.now(), cuplikan: S.salin(S.aktif()), belum: true });
    if (RIWAYAT.length > MAKS) RIWAYAT.pop();
  }
  function simpan(label) {
    var r = S.simpan();
    if (r.ok) { var it = RIWAYAT[0]; if (it && it.belum) { it.belum = false; it.label = label; it.ts = Date.now(); } }
    return r;
  }

  function idBaru(prefix, arr, field) {
    field = field || "id";
    var ada = {}, i;
    for (i = 0; i < arr.length; i++) if (arr[i] && arr[i][field] != null) ada[String(arr[i][field])] = 1;
    var dasar = String(prefix || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
    var n = arr.length + 1, calon = dasar + "-" + n;
    while (ada[calon]) { n++; calon = dasar + "-" + n; }
    return calon;
  }

  var API = {
    /* ---------- koleksi ---------- */
    daftar: function (path) { var v = S.ambil(path); return Array.isArray(v) ? v : []; },
    tambah: function (path, item, label) {
      sebelum(label || "Tambah item");
      var arr = S.ambil(path);
      if (!Array.isArray(arr)) { arr = []; S.tulis(path, arr); }
      arr.push(item);
      return simpan(label || "Tambah item");
    },
    ubah: function (path, indeks, item, label) {
      sebelum(label || "Ubah item");
      var arr = S.ambil(path);
      if (!Array.isArray(arr) || indeks < 0 || indeks >= arr.length) return { ok: false, pesan: "Item tidak ditemukan." };
      arr[indeks] = item;
      return simpan(label || "Ubah item");
    },
    hapus: function (path, daftarIndeks, label) {
      var arr = S.ambil(path);
      if (!Array.isArray(arr) || !daftarIndeks.length) return { ok: false, pesan: "Tidak ada yang dihapus." };
      sebelum(label || "Hapus item");
      daftarIndeks.slice().sort(function (a, b) { return b - a; }).forEach(function (i) { if (i >= 0 && i < arr.length) arr.splice(i, 1); });
      return simpan(label || "Hapus " + daftarIndeks.length + " item");
    },
    pindah: function (path, dari, ke, label) {
      var arr = S.ambil(path);
      if (!Array.isArray(arr) || dari === ke || dari < 0 || ke < 0 || dari >= arr.length || ke >= arr.length) return { ok: false };
      sebelum(label || "Ubah urutan");
      var it = arr.splice(dari, 1)[0];
      arr.splice(ke, 0, it);
      return simpan(label || "Ubah urutan");
    },
    gandakan: function (path, indeks, label) {
      var arr = S.ambil(path);
      if (!Array.isArray(arr) || !arr[indeks]) return { ok: false };
      var salinan = S.salin(arr[indeks]);
      if (salinan.id != null) salinan.id = idBaru(salinan.id, arr, "id");
      if (salinan.nama != null) salinan.nama = String(salinan.nama) + " (salinan)";
      if (salinan.judul != null) salinan.judul = String(salinan.judul) + " (salinan)";
      sebelum(label || "Gandakan item");
      arr.splice(indeks + 1, 0, salinan);
      return simpan(label || "Gandakan item");
    },
    /* ---------- dokumen tunggal ---------- */
    tukar: function (path, nilai, label) {
      sebelum(label || "Perbarui " + path);
      S.tulis(path, nilai);
      return simpan(label || "Perbarui " + path);
    },
    /* ---------- peta (objek kunci→nilai) ---------- */
    petaKeDaftar: function (path) {
      var o = S.ambil(path) || {};
      return Object.keys(o).map(function (k) { return { dari: k, ke: o[k] }; });
    },
    daftarKePeta: function (arr) {
      var o = {};
      (arr || []).forEach(function (r) {
        var k = String(r.dari || "").trim().toLowerCase();
        if (k) o[k] = String(r.ke || "").trim().toLowerCase();
      });
      return o;
    },
    /* ---------- undo & riwayat ---------- */
    riwayat: function () { return RIWAYAT.slice(); },
    undo: function (indeks) {
      var i = indeks == null ? 0 : indeks;
      var it = RIWAYAT[i];
      if (!it) return { ok: false, pesan: "Tidak ada yang dapat diurungkan." };
      var kini = S.salin(S.aktif());
      S.terapkan(it.cuplikan);
      var r = S.simpan();
      RIWAYAT.splice(i, 1);
      RIWAYAT.unshift({ label: "Urungkan: " + it.label, ts: Date.now(), cuplikan: kini });
      return r;
    },
    bersihkanRiwayat: function () { RIWAYAT = []; },
    /* ---------- keseluruhan ---------- */
    gantiSemua: function (obj, label) {
      sebelum(label || "Impor konten");
      S.terapkan(obj);
      return simpan(label || "Impor konten");
    },
    resetSemua: function () {
      sebelum("Kembalikan seluruh konten ke bawaan");
      S.reset();
      var r = S.simpan();
      try { localStorage.removeItem(S.kunci); } catch (e) { }
      return r;
    },
    validasi: function (o) {
      var kurang = [];
      if (!o || typeof o !== "object") return { ok: false, pesan: "Berkas bukan objek JSON yang sah." };
      ["profil", "kontak", "lokasi"].forEach(function (k) { if (!o[k] || typeof o[k] !== "object") kurang.push(k); });
      ["dayaTarik", "galeri", "fasilitas", "aktivitas", "produkLokal", "chatbotIntents"].forEach(function (k) { if (!Array.isArray(o[k])) kurang.push(k); });
      if (kurang.length) return { ok: false, pesan: "Bagian berikut hilang atau salah bentuk: " + kurang.join(", ") + "." };
      return { ok: true };
    },
    /* ---------- ekspor ---------- */
    teksJson: function () { return JSON.stringify(S.aktif(), null, 2); },
    teksDataJs: function () {
      var kepala = "/* ============================================================\n" +
        "   LOBUK BAHARI — Berkas konten (hasil ekspor panel admin)\n" +
        "   Diekspor: " + new Date().toLocaleString("id-ID") + "\n" +
        "   Letakkan berkas ini menggantikan js/data.js, lalu unggah\n" +
        "   ulang ke hosting. Bagian akhir memuat pemuat konten aktif.\n" +
        "   ============================================================ */\n\"use strict\";\n\n";
      return kepala + "var LOBUK = " + JSON.stringify(S.aktif(), null, 2) + ";\n\n" + API.SUMBER_BOOTSTRAP + "\n";
    },
    /* ---------- penyimpanan & pengaturan ---------- */
    ukuran: function () {
      var b = 0;
      try { b = (localStorage.getItem(S.kunci) || "").length; } catch (e) { }
      return { byte: b, kb: Math.round(b / 1024), persen: Math.min(100, Math.round(b / (5 * 1024 * 1024) * 100)) };
    },
    atur: function (patch) {
      var a = {};
      try { a = JSON.parse(localStorage.getItem(KUNCI_ATUR)) || {}; } catch (e) { }
      if (patch) { Object.keys(patch).forEach(function (k) { a[k] = patch[k]; }); try { localStorage.setItem(KUNCI_ATUR, JSON.stringify(a)); } catch (e) { } }
      return { lebarGambar: a.lebarGambar || 1200, targetKb: a.targetKb || 200, rapat: a.rapat || "normal", konfirmasiHapus: a.konfirmasiHapus !== false };
    },
    kunciAdmin: function (kode) {
      if (kode === undefined) { try { return localStorage.getItem(KUNCI_KUNCI) || ""; } catch (e) { return ""; } }
      try { if (kode) localStorage.setItem(KUNCI_KUNCI, String(kode)); else localStorage.removeItem(KUNCI_KUNCI); } catch (e) { }
      return kode || "";
    },
    sesiTerbuka: function (v) {
      if (v === undefined) { try { return sessionStorage.getItem("lobuk_admin_sesi") === "1"; } catch (e) { return false; } }
      try { if (v) sessionStorage.setItem("lobuk_admin_sesi", "1"); else sessionStorage.removeItem("lobuk_admin_sesi"); } catch (e) { }
    },
    /* ---------- tampilan tersimpan ---------- */
    tampilan: function (daftar) {
      if (daftar === undefined) { try { return JSON.parse(localStorage.getItem(KUNCI_TAMPILAN)) || []; } catch (e) { return []; } }
      try { localStorage.setItem(KUNCI_TAMPILAN, JSON.stringify(daftar.slice(0, 20))); } catch (e) { }
      return daftar;
    },
    idBaru: idBaru,
    SUMBER_BOOTSTRAP: [
      "/* LobukStore — pemuat konten aktif (dipakai semua halaman). */",
      "window.LobukStore=(function(){",
      "var K=\"lobuk_konten_v1\",B=JSON.parse(JSON.stringify(LOBUK)),L=[];",
      "function salin(o){return JSON.parse(JSON.stringify(o))}",
      "function ob(v){return v&&typeof v===\"object\"&&!Array.isArray(v)}",
      "function gabung(a,b){",
      "if(b===undefined)return salin(a);",
      "if(Array.isArray(a))return Array.isArray(b)?salin(b):salin(a);",
      "if(ob(a)){var o={};Object.keys(a).forEach(function(k){o[k]=gabung(a[k],ob(b)?b[k]:undefined)});if(ob(b))Object.keys(b).forEach(function(k){if(!(k in o))o[k]=salin(b[k])});return o}",
      "return b;}",
      "function terap(x){var n=gabung(B,x);Object.keys(LOBUK).forEach(function(k){delete LOBUK[k]});Object.keys(n).forEach(function(k){LOBUK[k]=n[k]})}",
      "function muat(){try{var s=localStorage.getItem(K);if(s)terap(JSON.parse(s))}catch(e){}}",
      "function simpan(){try{localStorage.setItem(K,JSON.stringify(LOBUK));return{ok:true}}catch(e){return{ok:false,pesan:\"Penyimpanan peramban penuh atau diblokir.\"}}}",
      "function reset(){try{localStorage.removeItem(K)}catch(e){}terap(B)}",
      "function ambil(p){return String(p).split(\".\").reduce(function(o,k){return o==null?undefined:o[k]},LOBUK)}",
      "function tulis(p,v){var k=String(p).split(\".\"),u=k.pop(),o=k.reduce(function(a,x){if(a[x]==null)a[x]={};return a[x]},LOBUK);o[u]=v}",
      "function siarkan(){L.forEach(function(f){try{f(LOBUK)}catch(e){}});try{document.dispatchEvent(new CustomEvent(\"lobuk-konten-ubah\"))}catch(e){}}",
      "muat();",
      "return{kunci:K,bawaan:B,aktif:function(){return LOBUK},salin:salin,gabung:gabung,terapkan:function(x){terap(x);siarkan()},simpan:function(){var r=simpan();siarkan();return r},reset:function(){reset();siarkan()},ambil:ambil,tulis:tulis,dengar:function(f){L.push(f)},siarkan:siarkan,adaTersimpan:function(){try{return !!localStorage.getItem(K)}catch(e){return false}}}",
      "})();"
    ].join("\n")
  };

  window.LobukAdmin = API;
})();