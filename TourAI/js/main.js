/* ============================================================
   LOBUK BAHARI — Modul Antarmuka (SDD 7)
   Header kanonik + pemandangan matahari terbenam yang sama di
   semua halaman, galeri, perencana kunjungan berjendela waktu,
   tabel jadwal, studio ekspor PNG/JPG, dan peta Google Maps
   Embed API dengan jatuh-balik sematan tanpa kunci.
   ============================================================ */
(function () {
  "use strict";

  var D = window.LOBUK || {};
  var akar = document.documentElement;

  /* ---------- Utilitas ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function ada(v, f) { return (v === undefined || v === null) ? f : v; }
  var LS = {
    get: function (k, f) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  function notif(pesan, jenis, aksi) {
    var wadah = $("#notifikasi");
    if (!wadah) { wadah = document.createElement("div"); wadah.id = "notifikasi"; document.body.appendChild(wadah); }
    var el = document.createElement("div");
    el.className = "notif " + (jenis || "");
    el.innerHTML = "<span>" + esc(pesan) + "</span>";
    if (aksi) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = aksi.label;
      b.addEventListener("click", function () { aksi.fn(); el.remove(); });
      el.appendChild(b);
    }
    wadah.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .4s"; el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 420);
    }, aksi ? 6500 : 3200);
  }
  function salin(teks, pesan) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = teks; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      notif(ok ? (pesan || "Tersalin ke papan klip") : "Gagal menyalin — silakan salin manual", ok ? "" : "gagal");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(teks).then(function () { notif(pesan || "Tersalin ke papan klip"); }, fallback);
    } else { fallback(); }
  }
  function unduhData(nama, url) {
    var a = document.createElement("a");
    a.href = url; a.download = nama; document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); }, 400);
  }
  function unduhTeks(nama, isi) {
    var blob = new Blob([isi], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    unduhData(nama, url);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }
  function lencana(status) {
    if (status === "siap") return "<span class='lencana l-siap'>Terverifikasi</span>";
    if (status === "umum") return "<span class='lencana l-umum'>Gambaran umum</span>";
    if (status === "bebas") return "<span class='lencana l-bebas'>Waktu bebas</span>";
    return "<span class='lencana l-tunggu'>Menunggu mitra</span>";
  }
  function jam(menit) {
    var m = Math.max(0, Math.round(menit));
    var h = Math.floor(m / 60) % 24, mm = m % 60;
    return (h < 10 ? "0" : "") + h + "." + (mm < 10 ? "0" : "") + mm;
  }
  function durasiTeks(menit) {
    var m = Math.round(menit), h = Math.floor(m / 60), s = m % 60;
    if (h && s) return h + "j " + s + "m";
    if (h) return h + " jam";
    return s + " menit";
  }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "jadwal";
  }
  window.LobukUI = { $: $, $$: $$, esc: esc, notif: notif, salin: salin, LS: LS };

  /* ============================================================
     HEADER KANONIK — identik di semua halaman
     ============================================================ */
  var MENU = [
    ["index.html", "beranda", "Beranda"],
    ["tentang.html", "tentang", "Tentang Wisata"],
    ["galeri.html", "galeri", "Galeri"],
    ["fasilitas.html", "fasilitas", "Fasilitas &amp; Aktivitas"],
    ["lokasi.html", "lokasi", "Lokasi"],
    ["produk.html", "produk", "Produk Lokal"],
    ["kontak.html", "kontak", "Kontak"]
  ];
  function halamanAktif() {
    var berkas = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!berkas || berkas === "/") berkas = "index.html";
    for (var i = 0; i < MENU.length; i++) if (MENU[i][0] === berkas) return MENU[i][1];
    return document.body.getAttribute("data-page") || "beranda";
  }
  function pasangHeader() {
    var lama = $("nav.navbar"); if (lama) lama.parentNode.removeChild(lama);
    var nav = $("header.nav");
    if (!nav) {
      nav = document.createElement("header");
      nav.className = "nav"; nav.id = "nav";
      var acuan = $("#progres");
      if (acuan && acuan.nextSibling) document.body.insertBefore(nav, acuan.nextSibling);
      else document.body.insertBefore(nav, document.body.firstChild);
    }
    var aktif = halamanAktif();
    nav.innerHTML = "<div class='nav-in'>" +
      "<a class='brand' href='index.html'><img src='img/favicon.svg' alt='' width='36' height='36'><span>Lobuk<b>Bahari</b></span></a>" +
      "<button class='burger' id='burger' type='button' aria-label='Buka menu' aria-expanded='false' aria-controls='menu'><span></span><span></span><span></span></button>" +
      "<nav class='menu' id='menu' aria-label='Navigasi utama'>" +
      MENU.map(function (m) {
        return "<a href='" + m[0] + "' data-nav='" + m[1] + "'" + (m[1] === aktif ? " class='is-active' aria-current='page'" : "") + ">" + m[2] + "</a>";
      }).join("") +
      "<button class='nav-chat' type='button' data-chat-open='true'>💬 Chatbot</button>" +
      "</nav></div>";
    if (!$("#progres")) {
      var p = document.createElement("div");
      p.className = "progres"; p.id = "progres"; p.setAttribute("aria-hidden", "true");
      document.body.insertBefore(p, document.body.firstChild);
    }
    if (!$("#keatas")) {
      var k = document.createElement("button");
      k.id = "keatas"; k.type = "button"; k.setAttribute("aria-label", "Kembali ke atas"); k.textContent = "↑";
      document.body.appendChild(k);
    }
    document.body.setAttribute("data-page", aktif);
  }

  /* ============================================================
     PEMANDANGAN MATAHARI TERBENAM
     Satu generator untuk hero beranda dan banner semua halaman.
     ============================================================ */
  var sceneUID = 0;
  function pemandangan(mode) {
    var uid = "pn" + (++sceneUID);
    var W = 1440;
    var H = mode === "penuh" ? 760 : 440;
    var hor = Math.round(H * 0.618);
    var laut = H - hor;
    var sunX = Math.round(W * 0.63);
    var sunY = hor - Math.round(H * 0.012);
    var sunR = Math.round(H * 0.098);
    var glowR = Math.round(H * 0.237);

    function gelombang(y, amp) {
      var d = "M0 " + y;
      for (var i = 0; i < 16; i++) d += " q90 " + (i % 2 ? amp : -amp) + " 180 0";
      return d + " V" + H + " H0 Z";
    }
    var bintang = "";
    for (var s = 0; s < 12; s++) {
      var bx = Math.round((s * 137.5) % W);
      var by = Math.round((s * 61.7) % (hor * 0.42)) + 12;
      bintang += "<circle class='kedip' style='--kd:" + (3 + (s % 5) * 0.6).toFixed(1) + "s;animation-delay:" + (s % 6) * 0.4 + "s' cx='" + bx + "' cy='" + by + "' r='" + (1.7 + (s % 3) * 0.4).toFixed(1) + "'/>";
    }
    var burungY = Math.round(hor * 0.38);
    var deckY = Math.round(hor + laut * 0.53);
    var perahuY = Math.round(hor + laut * 0.42);
    var tiang = "";
    for (var t = 0; t < 5; t++) {
      var tx = Math.round(W * 0.625) + t * Math.round(W * 0.077);
      tiang += "<path d='M" + tx + " " + (deckY + 18) + "h16v" + (H - deckY - 18) + "h-16z'/>";
    }
    var skalaPerahu = (H / 760).toFixed(3);

    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMid slice' role='img' aria-label='Ilustrasi matahari terbenam di Pantai Matahari, Desa Lobuk, dengan jembatan kayu dan perahu nelayan'>" +
      "<defs>" +
        "<linearGradient id='" + uid + "l' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#06263C'/><stop offset='.32' stop-color='#0E5A8A'/><stop offset='.58' stop-color='#C2456B'/><stop offset='.8' stop-color='#E8563F'/><stop offset='1' stop-color='#F29F3D'/></linearGradient>" +
        "<linearGradient id='" + uid + "s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#E8894A'/><stop offset='.38' stop-color='#12719F'/><stop offset='1' stop-color='#06263C'/></linearGradient>" +
        "<radialGradient id='" + uid + "g'><stop offset='0' stop-color='#FFC864' stop-opacity='.95'/><stop offset='1' stop-color='#FFC864' stop-opacity='0'/></radialGradient>" +
        "<linearGradient id='" + uid + "r' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#FFC864' stop-opacity='.8'/><stop offset='1' stop-color='#FFC864' stop-opacity='0'/></linearGradient>" +
      "</defs>" +
      "<rect width='" + W + "' height='" + hor + "' fill='url(#" + uid + "l)'/>" +
      "<g class='lyr' data-depth='0.05' fill='#FDF6EC'>" + bintang + "</g>" +
      "<g class='lyr' data-depth='0.12'><circle class='pijar' cx='" + sunX + "' cy='" + sunY + "' r='" + glowR + "' fill='url(#" + uid + "g)'/><circle cx='" + sunX + "' cy='" + sunY + "' r='" + sunR + "' fill='#FFC864'/></g>" +
      "<g class='lyr hanyut' data-depth='0.2' fill='#E8B8C8' opacity='.42'>" +
        "<ellipse cx='260' cy='" + Math.round(hor * 0.36) + "' rx='130' ry='" + Math.round(H * 0.024) + "'/>" +
        "<ellipse cx='360' cy='" + Math.round(hor * 0.32) + "' rx='80' ry='" + Math.round(H * 0.016) + "'/>" +
        "<ellipse cx='1150' cy='" + Math.round(hor * 0.51) + "' rx='150' ry='" + Math.round(H * 0.021) + "'/>" +
        "<ellipse cx='1270' cy='" + Math.round(hor * 0.47) + "' rx='90' ry='" + Math.round(H * 0.014) + "'/>" +
      "</g>" +
      "<g class='lyr' data-depth='0.1' fill='#06263C' opacity='.5'>" +
        "<path d='M0 " + hor + "q120 " + (-Math.round(H * 0.045)) + " 260 " + (-Math.round(H * 0.018)) + "t250 " + (-Math.round(H * 0.024)) + " 240 " + Math.round(H * 0.016) + "V" + hor + "z'/>" +
        "<path d='M1180 " + hor + "q80 " + (-Math.round(H * 0.04)) + " 160 " + (-Math.round(H * 0.011)) + "t100 " + (-Math.round(H * 0.005)) + "v" + Math.round(H * 0.016) + "z'/>" +
      "</g>" +
      "<rect y='" + hor + "' width='" + W + "' height='" + laut + "' fill='url(#" + uid + "s)'/>" +
      "<rect class='kilau' x='" + (sunX - Math.round(sunR * 0.84)) + "' y='" + hor + "' width='" + Math.round(sunR * 1.68) + "' height='" + laut + "' fill='url(#" + uid + "r)'/>" +
      "<g fill='#083A5C'>" +
        "<path class='ombak' style='--laju:34s' d='" + gelombang(hor + Math.round(laut * 0.13), Math.round(H * 0.016)) + "' opacity='.55'/>" +
        "<path class='ombak' style='--laju:23s' d='" + gelombang(hor + Math.round(laut * 0.3), Math.round(H * 0.021)) + "' opacity='.75'/>" +
        "<path class='ombak' style='--laju:15s' d='" + gelombang(hor + Math.round(laut * 0.54), Math.round(H * 0.026)) + "'/>" +
      "</g>" +
      "<g class='lyr' data-depth='0.34'>" +
        "<g class='apung' fill='#06263C' transform='translate(" + Math.round(W * 0.21) + " " + perahuY + ") scale(" + skalaPerahu + ")'>" +
          "<path d='M-66 0q66 24 132 0l-16 22q-50 15 -100 0z'/>" +
          "<path d='M-4 -2v-52' stroke='#06263C' stroke-width='5'/><path d='M-4 -54l42 38h-42z'/>" +
        "</g>" +
        "<g fill='#06263C'>" +
          "<path d='M" + W + " " + H + "V" + deckY + "H" + Math.round(W * 0.6) + "v20h" + Math.round(W * 0.4) + "v" + (H - deckY - 20) + "z'/>" +
          tiang +
          "<path d='M" + Math.round(W * 0.6) + " " + (deckY - 12) + "h" + Math.round(W * 0.4) + "v10H" + Math.round(W * 0.6) + "z' opacity='.8'/>" +
        "</g>" +
      "</g>" +
      "<g class='lyr' data-depth='0.16' stroke='#2A1830' stroke-width='4' fill='none' stroke-linecap='round' opacity='.8'>" +
        "<path d='M540 " + burungY + "q12 -12 24 0t24 0'/>" +
        "<path d='M620 " + (burungY - 32) + "q10 -10 20 0t20 0'/>" +
        "<path d='M590 " + (burungY + 42) + "q9 -9 18 0t18 0'/>" +
      "</g>" +
    "</svg>";
  }
  function pasangPemandangan() {
    $$("[data-scene]").forEach(function (wadah) {
      if (wadah.getAttribute("data-siap") === "1") return;
      wadah.innerHTML = pemandangan(wadah.getAttribute("data-scene") === "penuh" ? "penuh" : "kepala");
      wadah.setAttribute("data-siap", "1");
    });
  }

  /* ---------- Navigasi ---------- */
  function initNavigasi() {
    var burger = $("#burger"), menu = $("#menu"), nav = $("#nav"), progres = $("#progres"), keatas = $("#keatas");
    if (burger && menu) {
      burger.addEventListener("click", function () {
        var buka = document.body.classList.toggle("menu-open");
        burger.setAttribute("aria-expanded", buka ? "true" : "false");
        burger.setAttribute("aria-label", buka ? "Tutup menu" : "Buka menu");
      });
      $$("a", menu).forEach(function (a) {
        a.addEventListener("click", function () {
          document.body.classList.remove("menu-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        document.body.classList.remove("menu-open");
        if (burger) { burger.setAttribute("aria-expanded", "false"); burger.focus(); }
      }
    });
    var ticking = false;
    function saatGulir() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.pageYOffset || akar.scrollTop || 0;
        var maks = akar.scrollHeight - window.innerHeight;
        if (progres) progres.style.width = (maks > 0 ? (y / maks) * 100 : 0) + "%";
        if (nav) nav.classList.toggle("is-stuck", y > 8);
        if (keatas) keatas.classList.toggle("tampil", y > 620);
        parallax(y);
      });
    }
    window.addEventListener("scroll", saatGulir, { passive: true });
    saatGulir();
    if (keatas) keatas.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- Parallax pemandangan ---------- */
  var wadahScene = [];
  function initParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    wadahScene = $$(".hero, .kepala").filter(function (w) { return $$("[data-depth]", w).length; });
    wadahScene.forEach(function (w) {
      var lapis = $$("[data-depth]", w);
      w.addEventListener("pointermove", function (e) {
        var r = w.getBoundingClientRect();
        var dx = (e.clientX - r.width / 2) / r.width;
        var y = window.pageYOffset || 0;
        var atas = w.getBoundingClientRect().top + y;
        var rel = Math.max(0, y - atas);
        lapis.forEach(function (l) {
          var d = parseFloat(l.getAttribute("data-depth")) || 0;
          l.style.transform = "translate3d(" + (-dx * d * 60).toFixed(1) + "px," + (rel * d * 0.26).toFixed(1) + "px,0)";
        });
      });
      w.addEventListener("pointerleave", function () {
        var y = window.pageYOffset || 0;
        var atas = w.getBoundingClientRect().top + y;
        var rel = Math.max(0, y - atas);
        lapis.forEach(function (l) {
          var d = parseFloat(l.getAttribute("data-depth")) || 0;
          l.style.transform = "translate3d(0," + (rel * d * 0.26).toFixed(1) + "px,0)";
        });
      });
    });
  }
  function parallax(y) {
    if (!wadahScene.length) return;
    wadahScene.forEach(function (w) {
      var atas = w.getBoundingClientRect().top + y;
      if (y > atas + w.offsetHeight + 200 || y + window.innerHeight < atas) return;
      var rel = Math.max(0, y - atas);
      $$("[data-depth]", w).forEach(function (l) {
        var d = parseFloat(l.getAttribute("data-depth")) || 0;
        l.style.transform = "translate3d(0," + (rel * d * 0.26).toFixed(1) + "px,0)";
      });
    });
  }

  /* ---------- Pengungkapan saat gulir ---------- */
  function semuaTerlihat() { $$(".muncul").forEach(function (e) { e.classList.add("masuk"); }); }
  function initMuncul() {
    var daftar = $$(".muncul"); if (!daftar.length) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { semuaTerlihat(); return; }
    var pengamat = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("masuk"); pengamat.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    daftar.forEach(function (e) { pengamat.observe(e); });
    akar.classList.add("siaga");
    setTimeout(semuaTerlihat, 1800);
  }
  window.addEventListener("error", function () { akar.classList.remove("siaga"); semuaTerlihat(); });

  /* ---------- Konten ---------- */
  function initRingkasan() {
    var wadah = $("#ringkasanDaya"); if (!wadah) return;
    wadah.innerHTML = ada(D.dayaTarik, []).map(function (d, i) {
      return "<article class='kartu muncul' style='--tunda:" + (i * 0.07) + "s'>" +
        "<div class='kartu-gambar'><img src='" + d.foto + "' alt='" + esc(d.judul) + "' loading='lazy'>" +
        "<span class='pita'>" + esc(d.kategori) + "</span></div>" +
        "<div class='kartu-isi'><h3>" + esc(d.judul) + "</h3><p>" + esc(d.ringkas) + "</p>" +
        "<div class='kartu-kaki'>" + lencana(d.status) + "<a href='tentang.html#" + d.id + "'>Selengkapnya →</a></div></div></article>";
    }).join("");
  }
  function initDayaBaris() {
    var wadah = $("#dayaBaris"); if (!wadah) return;
    wadah.innerHTML = ada(D.dayaTarik, []).map(function (d, i) {
      return "<section class='baris-daya muncul' id='" + d.id + "'>" +
        "<div class='daya-media'><img src='" + d.foto + "' alt='" + esc(d.judul) + "' loading='lazy'></div>" +
        "<div class='daya-teks'><div class='daya-nomor'>DAYA TARIK " + (i + 1 < 10 ? "0" : "") + (i + 1) + "</div>" +
        "<h3>" + esc(d.judul) + "</h3><p>" + esc(d.deskripsi) + "</p>" +
        "<div style='display:flex;gap:9px;flex-wrap:wrap;margin-top:14px'>" + lencana(d.status) +
        "<a class='btn btn-garis btn-kecil' href='galeri.html'>Lihat di galeri</a></div></div></section>";
    }).join("");
  }

  /* ---------- Galeri ---------- */
  var gSaring = "semua", gDaftar = [], gIndex = 0;
  function gambarGaleri() {
    var kisi = $("#galeriKisi"); if (!kisi) return;
    gDaftar = ada(D.galeri, []).filter(function (g) { return gSaring === "semua" || g.kategori === gSaring; });
    if (!gDaftar.length) { kisi.innerHTML = "<div class='kosong' style='grid-column:1/-1'><b>Belum ada gambar pada kategori ini</b>Coba pilih kategori lain.</div>"; return; }
    kisi.innerHTML = gDaftar.map(function (g, i) {
      return "<button type='button' class='gkartu' data-i='" + i + "' aria-label='Perbesar " + esc(g.keterangan) + "'>" +
        "<img src='" + g.file + "' alt='" + esc(g.keterangan) + "' loading='lazy'><span class='pita'>Gambar</span>" +
        "<span class='gkartu-tutup'>" + esc(g.keterangan) + "<small>" + esc(g.kategori) + "</small></span></button>";
    }).join("");
  }
  function tampilCahaya() {
    var g = gDaftar[gIndex]; if (!g) return;
    $("#cPanggung").innerHTML = "<img src='" + g.file + "' alt='" + esc(g.keterangan) + "'>";
    $("#cKet").innerHTML = "<b>" + esc(g.keterangan) + "</b><small>Foto suasana · kategori " + esc(g.kategori) + " · Desa Lobuk</small>";
    $("#cHitung").textContent = (gIndex + 1) + " / " + gDaftar.length;
  }
  function bukaCahaya(i) {
    var c = $("#cahaya"); if (!c || !gDaftar.length) return;
    gIndex = i; tampilCahaya(); c.classList.add("buka");
    document.body.style.overflow = "hidden"; $("#cTutup").focus();
  }
  function geserCahaya(d) { gIndex = (gIndex + d + gDaftar.length) % gDaftar.length; tampilCahaya(); }
  function tutupCahaya() { var c = $("#cahaya"); if (c) c.classList.remove("buka"); document.body.style.overflow = ""; }
  function initGaleri() {
    var kisi = $("#galeriKisi"); if (!kisi) return;
    var kategori = ["semua"];
    ada(D.galeri, []).forEach(function (g) { if (kategori.indexOf(g.kategori) < 0) kategori.push(g.kategori); });
    var bar = $("#galeriSaring");
    if (bar) {
      bar.innerHTML = kategori.map(function (k) {
        return "<button type='button' class='tombol-saring" + (k === "semua" ? " aktif" : "") + "' data-k='" + k + "'>" +
          (k === "semua" ? "Semua (" + ada(D.galeri, []).length + ")" : k.charAt(0).toUpperCase() + k.slice(1)) + "</button>";
      }).join("");
      bar.addEventListener("click", function (e) {
        var b = e.target.closest("[data-k]"); if (!b) return;
        gSaring = b.getAttribute("data-k");
        $$(".tombol-saring", bar).forEach(function (x) { x.classList.toggle("aktif", x === b); });
        gambarGaleri();
      });
    }
    gambarGaleri();
    kisi.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]"); if (!b) return;
      bukaCahaya(parseInt(b.getAttribute("data-i"), 10));
    });
    var cahaya = $("#cahaya"); if (!cahaya) return;
    cahaya.addEventListener("click", function (e) { if (e.target === cahaya) tutupCahaya(); });
    $("#cTutup").addEventListener("click", tutupCahaya);
    $("#cPrev").addEventListener("click", function () { geserCahaya(-1); });
    $("#cNext").addEventListener("click", function () { geserCahaya(1); });
    $("#cUnduh").addEventListener("click", function () {
      var g = gDaftar[gIndex]; if (!g) return;
      unduhData(g.file.split("/").pop(), g.file); notif("Mengunduh " + g.keterangan);
    });
    document.addEventListener("keydown", function (e) {
      if (!cahaya.classList.contains("buka")) return;
      if (e.key === "Escape") tutupCahaya();
      if (e.key === "ArrowRight") geserCahaya(1);
      if (e.key === "ArrowLeft") geserCahaya(-1);
    });
  }

  /* ---------- Fasilitas & aktivitas ---------- */
  var fCari = "";
  function initFasilitas() {
    var fw = $("#fasilitasKisi"), aw = $("#aktivitasKisi");
    if (!fw || !aw) return;
    var tab = $("#faTab"), cari = $("#faCari");
    function gambar() {
      var q = fCari.toLowerCase();
      var fs = ada(D.fasilitas, []).filter(function (f) { return (f.nama + " " + f.keterangan).toLowerCase().indexOf(q) >= 0; });
      var as = ada(D.aktivitas, []).filter(function (a) { return (a.nama + " " + a.keterangan + " " + a.waktu).toLowerCase().indexOf(q) >= 0; });
      fw.innerHTML = fs.length ? fs.map(function (f) {
        return "<div class='fkartu'><span class='fikon'>" + f.ikon + "</span><div><h3>" + esc(f.nama) + "</h3><p>" + esc(f.keterangan) + "</p>" + lencana(f.status) + "</div></div>";
      }).join("") : "<div class='kosong' style='grid-column:1/-1'><b>Tidak ditemukan</b>Coba kata kunci lain.</div>";
      aw.innerHTML = as.length ? as.map(function (a) {
        return "<div class='fkartu'><span class='fikon'>" + a.ikon + "</span><div><h3>" + esc(a.nama) + "</h3><p>" + esc(a.keterangan) + "</p>" +
          "<div style='display:flex;gap:7px;flex-wrap:wrap'>" + lencana(a.status) + "<span class='chip'>⏱️ ±" + a.durasi + " jam</span><span class='chip'>🕐 " + esc(a.waktu) + "</span></div></div></div>";
      }).join("") : "<div class='kosong' style='grid-column:1/-1'><b>Tidak ditemukan</b>Coba kata kunci lain.</div>";
      var hf = $("#hitungFasilitas"), ha = $("#hitungAktivitas");
      if (hf) hf.textContent = fs.length;
      if (ha) ha.textContent = as.length;
    }
    if (tab) tab.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]"); if (!b) return;
      var t = b.getAttribute("data-tab");
      $$("button", tab).forEach(function (x) { x.classList.toggle("aktif", x === b); });
      $("#panelFasilitas").hidden = t !== "fasilitas";
      $("#panelAktivitas").hidden = t !== "aktivitas";
    });
    if (cari) cari.addEventListener("input", function () { fCari = cari.value.trim(); gambar(); });
    gambar();
  }

  /* ============================================================
     PERENCANA KUNJUNGAN — penjadwalan jendela waktu
     ============================================================ */
  var RENCANA_KEY = "lobuk_rencana_v2";
  var JAM_DATANG = { fajar: 300, pagi: 480, siang: 780, senja: 960 };
  var LABEL_DATANG = { fajar: "Fajar · 05.00", pagi: "Pagi · 08.00", siang: "Siang · 13.00", senja: "Senja · 16.00" };
  var JEDA = 15, MAKS_JAM = 14, MIN_JAM = 2;
  var rencana = { waktu: "fajar", jam: 13, pilih: ["terbit", "jembatan", "kuliner", "terbenam"], catatan: "", judul: "Rencana Kunjungan Pantai Matahari" };
  var tampilan = "linimasa", hasil = null;

  function lebarJendela(a) { return ada(a.jendela, []).reduce(function (t, w) { return t + (w.akhir - w.awal); }, 0); }
  function awalJendela(a) { var w = ada(a.jendela, []); return w.length ? w[0].awal : 0; }
  function bentrok(mulai, akhir, terisi) {
    for (var i = 0; i < terisi.length; i++) {
      var b = terisi[i];
      if (mulai < b.akhir + JEDA && akhir + JEDA > b.mulai) return true;
    }
    return false;
  }
  function cariSlot(a, terisi, awal, batas) {
    var dur = Math.round(a.durasi * 60), kandidat = [];
    ada(a.jendela, []).forEach(function (w) {
      var s = Math.max(w.awal, awal);
      if (s + dur <= w.akhir) kandidat.push(s);
      terisi.forEach(function (b) {
        var s2 = Math.max(b.akhir + JEDA, w.awal, awal);
        if (s2 + dur <= w.akhir) kandidat.push(s2);
      });
    });
    kandidat.sort(function (x, y) { return x - y; });
    for (var i = 0; i < kandidat.length; i++) {
      var s3 = kandidat[i], e = s3 + dur;
      if (e > batas) continue;
      if (!bentrok(s3, e, terisi)) return { mulai: s3, akhir: e };
    }
    return null;
  }
  function hitungJadwal(waktu, jamAlokasi, pilihan) {
    var awal = JAM_DATANG[waktu], batas = awal + jamAlokasi * 60;
    var dipilih = ada(D.aktivitas, []).filter(function (a) { return pilihan.indexOf(a.id) >= 0; });
    var urut = function (a, b) {
      var d = awalJendela(a) - awalJendela(b);
      return d !== 0 ? d : lebarJendela(a) - lebarJendela(b);
    };
    var terkunci = dipilih.filter(function (a) { return lebarJendela(a) <= 300; }).sort(urut);
    var lentur = dipilih.filter(function (a) { return lebarJendela(a) > 300; }).sort(urut);
    var terisi = [], gagal = [];
    function tempatkan(a) {
      var slot = cariSlot(a, terisi, awal, batas);
      if (slot) { terisi.push({ a: a, mulai: slot.mulai, akhir: slot.akhir }); return; }
      var alasan;
      if (cariSlot(a, terisi, awal, awal + MAKS_JAM * 60)) alasan = "Alokasi durasi belum menjangkau jendela waktu terbaiknya (" + a.waktu + ").";
      else if (cariSlot(a, [], awal, awal + MAKS_JAM * 60)) alasan = "Jendela waktunya bertabrakan dengan kegiatan lain yang sudah dipilih.";
      else alasan = "Waktu kedatangan sudah melewati jendela kegiatan ini (" + a.waktu + ").";
      gagal.push({ a: a, alasan: alasan });
    }
    terkunci.forEach(tempatkan);
    lentur.forEach(tempatkan);
    terisi.sort(function (x, y) { return x.mulai - y.mulai; });
    var baris = [], kursor = awal;
    terisi.forEach(function (b) {
      if (b.mulai > kursor) baris.push({ jenis: "jeda", mulai: kursor, akhir: b.mulai });
      baris.push({ jenis: "giat", a: b.a, mulai: b.mulai, akhir: b.akhir });
      kursor = b.akhir;
    });
    return {
      awal: awal, batas: batas, baris: baris, gagal: gagal,
      selesai: terisi.length ? terisi[terisi.length - 1].akhir : awal,
      jumlah: terisi.length, waktu: waktu, jam: jamAlokasi
    };
  }
  function htmlPerbaikan(h) {
    if (!h.gagal.length) return "";
    return "<div class='perbaikan'><h4>⚠️ " + h.gagal.length + " kegiatan belum masuk jadwal</h4><ul>" +
      h.gagal.map(function (g) { return "<li><b>" + esc(g.a.nama) + "</b> — " + esc(g.alasan) + "</li>"; }).join("") +
      "</ul><div class='perbaikan-aksi'>" +
      "<button type='button' class='btn btn-laut btn-kecil' id='fixOtomatis'>✨ Sesuaikan otomatis</button>" +
      "<button type='button' class='btn btn-garis btn-kecil' id='fixFajar'>🌅 Datang saat fajar</button>" +
      "<button type='button' class='btn btn-garis btn-kecil' id='fixBuang'>Lepaskan yang bentrok</button>" +
      "</div></div>";
  }
  function htmlLinimasa(h) {
    if (!h.baris.length) return "<div class='kosong'><b>Belum ada kegiatan terpilih</b>Centang kegiatan pada panel di samping untuk menyusun jadwal.</div>";
    return "<div class='linimasa'>" + h.baris.map(function (b) {
      if (b.jenis === "jeda") {
        return "<div class='lm-item jeda'><div class='lm-waktu'>" + jam(b.mulai) + "<br>" + jam(b.akhir) + "</div><div class='lm-rel'></div>" +
          "<div class='lm-isi'><div class='lm-judul'>Waktu bebas · " + durasiTeks(b.akhir - b.mulai) + "</div>" +
          "<div class='lm-ket'>Menunggu jendela kegiatan berikutnya. Bisa diisi istirahat atau kegiatan lain dari panel.</div></div></div>";
      }
      return "<div class='lm-item'><div class='lm-waktu'>" + jam(b.mulai) + "<br>" + jam(b.akhir) + "</div><div class='lm-rel'></div>" +
        "<div class='lm-isi'><div class='lm-judul'>" + b.a.ikon + " " + esc(b.a.nama) + "</div>" +
        "<div class='lm-ket'>" + esc(b.a.keterangan) + "</div>" +
        "<div style='margin-top:7px;display:flex;gap:6px;flex-wrap:wrap'><span class='chip'>⏱️ " + durasiTeks(b.akhir - b.mulai) + "</span><span class='chip'>🕐 " + esc(b.a.waktu) + "</span></div></div></div>";
    }).join("") + "</div>";
  }
  function htmlTabel(h) {
    if (!h.baris.length) return "<div class='kosong'><b>Belum ada kegiatan terpilih</b>Pilih kegiatan untuk membuat tabel jadwal.</div>";
    var no = 0;
    var isi = h.baris.map(function (b) {
      if (b.jenis === "jeda") {
        return "<tr class='jeda'><td class='kol-no'>—</td><td class='kol-waktu'>" + jam(b.mulai) + "–" + jam(b.akhir) + "</td>" +
          "<td><div class='nama'>Waktu bebas (" + durasiTeks(b.akhir - b.mulai) + ")</div><div class='ket'>Menunggu jendela kegiatan berikutnya</div></td>" +
          "<td class='kol-status'>" + lencana("bebas") + "</td></tr>";
      }
      no++;
      return "<tr><td class='kol-no'>" + no + "</td><td class='kol-waktu'>" + jam(b.mulai) + "–" + jam(b.akhir) + "</td>" +
        "<td><div class='nama'>" + esc(b.a.nama) + "</div><div class='ket'>" + esc(b.a.keterangan) + "</div></td>" +
        "<td class='kol-status'>" + lencana("siap") + "</td></tr>";
    }).join("");
    return "<div class='tabel-gulir'><table class='tabel-jadwal'>" +
      "<caption>Tabel jadwal · " + esc(rencana.judul) + " · Desa Lobuk, Kec. Bluto, Kab. Sumenep</caption>" +
      "<thead><tr><th class='kol-no'>No</th><th class='kol-waktu'>Waktu</th><th>Kegiatan &amp; keterangan</th><th class='kol-status'>Status</th></tr></thead>" +
      "<tbody>" + isi + "</tbody></table></div>" +
      "<div class='tabel-kaki'><span>🕐 Datang " + jam(h.awal) + "</span><span>🏁 Selesai " + jam(h.selesai) + "</span><span>📋 " + h.jumlah + " kegiatan</span>" +
      "<button type='button' class='btn btn-garis btn-kecil' id='salinTabel'>📋 Salin tabel</button></div>";
  }
  function teksTabel() {
    var h = hasil || hitungJadwal(rencana.waktu, rencana.jam, rencana.pilih);
    var baris = h.baris.map(function (b) {
      return b.jenis === "jeda"
        ? jam(b.mulai) + "–" + jam(b.akhir) + "  (waktu bebas " + durasiTeks(b.akhir - b.mulai) + ")"
        : jam(b.mulai) + "–" + jam(b.akhir) + "  " + b.a.nama;
    });
    var gagal = h.gagal.map(function (g) { return "- " + g.a.nama + ": " + g.alasan; });
    return rencana.judul.toUpperCase() + "\nPantai Matahari · Desa Lobuk, Kec. Bluto, Kab. Sumenep\n" +
      "Datang " + jam(h.awal) + " · Selesai " + (h.jumlah ? jam(h.selesai) : "-") + " · Alokasi " + h.jam + " jam\n\n" +
      (baris.length ? baris.join("\n") : "(belum ada kegiatan)") +
      (gagal.length ? "\n\nBelum masuk jadwal:\n" + gagal.join("\n") : "") +
      (rencana.catatan.trim() ? "\n\nCatatan: " + rencana.catatan.trim() : "") +
      "\n\nJendela waktu = waktu cahaya terbaik, bukan jam operasional resmi.";
  }
  function bangunRencana() {
    var out = $("#rencanaKeluaran"); if (!out) return;
    hasil = hitungJadwal(rencana.waktu, rencana.jam, rencana.pilih);
    var h = hasil;
    var html = "<div class='ringkasan'>" +
      "<div>Waktu datang<b>" + jam(h.awal) + "</b></div>" +
      "<div>Perkiraan selesai<b>" + (h.jumlah ? jam(h.selesai) : "—") + "</b></div>" +
      "<div>Kegiatan<b>" + h.jumlah + " terjadwal</b></div>" +
      "<div>Alokasi<b>" + h.jam + " jam</b></div>" +
      "<div>Rentang terpakai<b>" + (h.jumlah ? durasiTeks(h.selesai - h.awal) : "—") + "</b></div></div>";
    html += htmlPerbaikan(h);
    html += (tampilan === "tabel" ? htmlTabel(h) : htmlLinimasa(h));
    if (rencana.catatan.trim()) html += "<div class='catatan' style='margin-top:14px'>📝 <b>Catatan:</b> " + esc(rencana.catatan) + "</div>";
    html += "<div class='catatan' style='margin-top:14px'>Jendela waktu kegiatan adalah waktu cahaya terbaik di pesisir, <b>bukan jam operasional resmi</b>. Jam buka, tarif, dan fasilitas masih menunggu konfirmasi pengelola Pantai Matahari.</div>";
    out.innerHTML = html;
    var fo = $("#fixOtomatis"); if (fo) fo.addEventListener("click", sesuaikanOtomatis);
    var ff = $("#fixFajar"); if (ff) ff.addEventListener("click", function () { setWaktu("fajar"); notif("Kedatangan diubah ke fajar (05.00)", "info"); });
    var fb = $("#fixBuang"); if (fb) fb.addEventListener("click", function () {
      hasil.gagal.forEach(function (g) { var i = rencana.pilih.indexOf(g.a.id); if (i >= 0) rencana.pilih.splice(i, 1); });
      sinkronPilihan(); bangunRencana(); notif("Kegiatan yang bentrok dilepaskan", "info");
    });
    var st = $("#salinTabel"); if (st) st.addEventListener("click", function () { salin(teksTabel(), "Tabel jadwal tersalin"); });
    gambarStudio();
  }
  function setWaktu(w) {
    rencana.waktu = w;
    $$("#segWaktu button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-w") === w); });
    bangunRencana();
  }
  function setJam(v) {
    rencana.jam = Math.max(MIN_JAM, Math.min(MAKS_JAM, v));
    $("#jamNilai").textContent = rencana.jam + " jam";
    bangunRencana();
  }
  function sinkronPilihan() {
    $$("#perencanaPilihan .pilih").forEach(function (b) {
      var on = rencana.pilih.indexOf(b.getAttribute("data-a")) >= 0;
      b.classList.toggle("aktif", on); $(".kotak", b).textContent = on ? "✓" : "";
    });
  }
  function sesuaikanOtomatis() {
    for (var h = rencana.jam; h <= MAKS_JAM; h++) {
      if (hitungJadwal(rencana.waktu, h, rencana.pilih).gagal.length === 0) { setJam(h); notif("Alokasi disesuaikan menjadi " + h + " jam"); return; }
    }
    var urutan = ["fajar", "pagi", "siang", "senja"];
    for (var i = 0; i < urutan.length; i++) {
      for (var hh = MIN_JAM; hh <= MAKS_JAM; hh++) {
        if (hitungJadwal(urutan[i], hh, rencana.pilih).gagal.length === 0) {
          rencana.waktu = urutan[i];
          $$("#segWaktu button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-w") === urutan[i]); });
          setJam(hh); notif("Disesuaikan: datang " + LABEL_DATANG[urutan[i]] + ", alokasi " + hh + " jam"); return;
        }
      }
    }
    notif("Kombinasi ini bertabrakan. Lepaskan salah satu kegiatan yang berebut jendela waktu.", "gagal");
  }
  function gambarDrafRencana() {
    var wadah = $("#rencanaDraf"); if (!wadah) return;
    var daftar = LS.get(RENCANA_KEY, []);
    if (!daftar.length) { wadah.innerHTML = "<p style='font-size:13px;color:var(--tinta-2)'>Belum ada rencana tersimpan. Tekan <b>Simpan &amp; Buat Tabel</b> untuk menyimpan sekaligus membuat tabel jadwal dan gambar.</p>"; return; }
    wadah.innerHTML = daftar.map(function (d) {
      return "<div class='draf'><div class='tumbuh'><b>" + esc(d.nama) + "</b><small>" + new Date(d.ts).toLocaleString("id-ID") + " · " + d.state.pilih.length + " kegiatan · " + d.state.jam + " jam</small></div>" +
        "<button type='button' class='btn btn-garis btn-kecil' data-muat='" + d.id + "'>Muat</button>" +
        "<button type='button' class='btn btn-garis btn-kecil' data-salin='" + d.id + "'>Salin</button>" +
        "<button type='button' class='btn btn-bahaya btn-kecil' data-hapus='" + d.id + "' aria-label='Hapus rencana'>🗑</button></div>";
    }).join("");
  }
  function muatRencana(d) {
    rencana = { waktu: d.state.waktu, jam: d.state.jam, pilih: d.state.pilih.slice(), catatan: d.state.catatan || "", judul: d.state.judul || d.nama };
    $("#jamNilai").textContent = rencana.jam + " jam";
    $("#rencanaCatatan").value = rencana.catatan;
    $("#rencanaNama").value = d.nama;
    if ($("#studioJudul")) $("#studioJudul").value = rencana.judul;
    $$("#segWaktu button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-w") === rencana.waktu); });
    sinkronPilihan(); bangunRencana();
  }
  function initPerencana() {
    var wadah = $("#perencanaPilihan"); if (!wadah) return;
    wadah.innerHTML = ada(D.aktivitas, []).map(function (a) {
      var on = rencana.pilih.indexOf(a.id) >= 0;
      return "<button type='button' class='pilih" + (on ? " aktif" : "") + "' data-a='" + a.id + "'>" +
        "<span class='kotak'>" + (on ? "✓" : "") + "</span><span class='tumbuh'>" + a.ikon + " " + esc(a.nama) +
        "<small>🕐 " + esc(a.waktu) + "</small></span><span class='dur'>" + a.durasi + "j</span></button>";
    }).join("");
    wadah.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      var id = b.getAttribute("data-a"), pos = rencana.pilih.indexOf(id);
      if (pos >= 0) rencana.pilih.splice(pos, 1); else rencana.pilih.push(id);
      b.classList.toggle("aktif", pos < 0); $(".kotak", b).textContent = pos < 0 ? "✓" : "";
      bangunRencana();
    });
    $("#segWaktu").addEventListener("click", function (e) { var b = e.target.closest("[data-w]"); if (b) setWaktu(b.getAttribute("data-w")); });
    $("#jamKurang").addEventListener("click", function () { setJam(rencana.jam - 1); });
    $("#jamTambah").addEventListener("click", function () { setJam(rencana.jam + 1); });
    $("#presetJam").addEventListener("click", function (e) { var b = e.target.closest("[data-jam]"); if (b) setJam(parseInt(b.getAttribute("data-jam"), 10)); });
    $("#segTampilan").addEventListener("click", function (e) {
      var b = e.target.closest("[data-view]"); if (!b) return;
      tampilan = b.getAttribute("data-view");
      $$("#segTampilan button").forEach(function (x) { x.classList.toggle("aktif", x === b); });
      bangunRencana();
    });
    $("#rencanaCatatan").addEventListener("input", function () { rencana.catatan = this.value; bangunRencana(); });
    $("#rencanaReset").addEventListener("click", function () {
      rencana = { waktu: "fajar", jam: 13, pilih: ["terbit", "jembatan", "kuliner", "terbenam"], catatan: "", judul: "Rencana Kunjungan Pantai Matahari" };
      $("#jamNilai").textContent = "13 jam"; $("#rencanaCatatan").value = ""; $("#rencanaNama").value = "";
      if ($("#studioJudul")) $("#studioJudul").value = rencana.judul;
      $$("#segWaktu button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-w") === "fajar"); });
      sinkronPilihan(); bangunRencana(); notif("Rencana dikembalikan ke setelan awal", "info");
    });
    $("#rencanaSalin").addEventListener("click", function () {
      if (!hasil || !hasil.baris.length) { notif("Pilih minimal satu kegiatan dulu", "gagal"); return; }
      salin(teksTabel(), "Jadwal tersalin sebagai teks");
    });
    $("#rencanaSimpan").addEventListener("click", function () {
      var nama = $("#rencanaNama");
      if (!nama.value.trim()) { nama.classList.add("salah"); nama.focus(); notif("Beri nama rencana sebelum menyimpan", "gagal"); return; }
      if (!hasil || !hasil.baris.length) { notif("Pilih minimal satu kegiatan", "gagal"); return; }
      nama.classList.remove("salah");
      rencana.judul = nama.value.trim();
      if ($("#studioJudul")) $("#studioJudul").value = rencana.judul;
      var daftar = LS.get(RENCANA_KEY, []);
      daftar.unshift({ id: "r" + Date.now(), nama: nama.value.trim(), ts: Date.now(), state: { waktu: rencana.waktu, jam: rencana.jam, pilih: rencana.pilih.slice(), catatan: rencana.catatan, judul: rencana.judul } });
      LS.set(RENCANA_KEY, daftar.slice(0, 12));
      gambarDrafRencana();
      tampilan = "tabel";
      $$("#segTampilan button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-view") === "tabel"); });
      bangunRencana();
      notif("Tersimpan. Tabel jadwal & gambar siap di Studio Ekspor.");
      var studio = $("#studio"); if (studio) studio.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#rencanaNama").addEventListener("input", function () { this.classList.remove("salah"); });
    $("#rencanaDraf").addEventListener("click", function (e) {
      var m = e.target.closest("[data-muat]"), s = e.target.closest("[data-salin]"), h = e.target.closest("[data-hapus]");
      var list = LS.get(RENCANA_KEY, []);
      if (m) { var d = list.filter(function (x) { return x.id === m.getAttribute("data-muat"); })[0]; if (d) { muatRencana(d); notif("Rencana “" + d.nama + "” dimuat"); } }
      if (s) {
        var ds = list.filter(function (x) { return x.id === s.getAttribute("data-salin"); })[0];
        if (ds) {
          var hh = hitungJadwal(ds.state.waktu, ds.state.jam, ds.state.pilih);
          salin((ds.state.judul || ds.nama).toUpperCase() + "\nPantai Matahari · Desa Lobuk\n\n" + hh.baris.map(function (b) {
            return jam(b.mulai) + "–" + jam(b.akhir) + "  " + (b.jenis === "jeda" ? "(waktu bebas)" : b.a.nama);
          }).join("\n"), "Rencana tersalin");
        }
      }
      if (h) {
        var id = h.getAttribute("data-hapus"), idx = -1;
        list.forEach(function (x, i) { if (x.id === id) idx = i; });
        if (idx < 0) return;
        var rm = list.splice(idx, 1)[0]; LS.set(RENCANA_KEY, list); gambarDrafRencana();
        notif("Rencana dihapus", "info", { label: "Urungkan", fn: function () { var k = LS.get(RENCANA_KEY, []); k.splice(idx, 0, rm); LS.set(RENCANA_KEY, k); gambarDrafRencana(); notif("Rencana dikembalikan"); } });
      }
    });
    gambarDrafRencana();
    bangunRencana();
  }

  /* ============================================================
     STUDIO EKSPOR — tata letak terukur tunggal, lalu digambar
     ============================================================ */
  var TEMA = {
    fajar: { nama: "Fajar", langit: ["#06263C", "#0E5A8A", "#C2456B", "#E8563F", "#F29F3D"], matahari: "#FFC864" },
    senja: { nama: "Senja", langit: ["#083A5C", "#7A3B6E", "#E0576B", "#F29F3D"], matahari: "#FFD98A" },
    siang: { nama: "Siang", langit: ["#0E5A8A", "#12719F", "#7FB4D4"], matahari: "#FFF0C4" }
  };
  var ekspor = { tema: "fajar", format: "png", skala: 2, kualitas: 92, huruf: 100, rapat: "normal", lebar: 1080, keterangan: true, catatan: true, bebas: true };
  var pratinjauZoom = 100, pratinjauMode = "pas";
  var studioTimer = null, kanvasStudio = null, ukuranPoster = { lebar: 0, tinggi: 0 };

  function fontT(c, ukuran, bobot) {
    c.font = (bobot || 400) + " " + ukuran.toFixed(2) + 'px "Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, sans-serif';
  }
  function bungkusTeks(c, teks, maks) {
    var keluar = [];
    String(teks).split("\n").forEach(function (p) {
      var kata = p.split(/\s+/).filter(Boolean);
      if (!kata.length) { keluar.push(""); return; }
      var cur = "";
      kata.forEach(function (k) {
        var uji = cur ? cur + " " + k : k;
        if (c.measureText(uji).width <= maks) { cur = uji; return; }
        if (cur) { keluar.push(cur); cur = ""; }
        while (c.measureText(k).width > maks && k.length > 1) {
          var lo = 1, hi = k.length, potong = 1;
          while (lo <= hi) {
            var mid = (lo + hi) >> 1;
            if (c.measureText(k.slice(0, mid)).width <= maks) { potong = mid; lo = mid + 1; } else { hi = mid - 1; }
          }
          keluar.push(k.slice(0, potong)); k = k.slice(potong);
        }
        cur = k;
      });
      if (cur) keluar.push(cur);
    });
    return keluar.length ? keluar : [""];
  }
  function kotakBulat(c, x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + rr, y);
    c.lineTo(x + w - rr, y); c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr); c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h); c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr); c.quadraticCurveTo(x, y, x + rr, y);
    c.closePath();
  }
  function tataLetak(c, o, h) {
    var W = o.lebar, fs = o.huruf / 100;
    var rap = { padat: 0.82, normal: 1, lega: 1.2 }[o.rapat] || 1;
    var P = Math.round(W * 0.05), dalam = W - P * 2;
    var F = {
      label: 10.5 * fs, judul: 25 * fs, sub: 13.5 * fs, tgl: 11 * fs,
      metaLabel: 9.5 * fs, metaNilai: 17 * fs, th: 9.5 * fs, no: 11.5 * fs, waktu: 12 * fs,
      nama: 14 * fs, ket: 11 * fs, badge: 9.5 * fs,
      blokJudul: 12.5 * fs, blokIsi: 11.5 * fs, kakiJudul: 11 * fs, kakiIsi: 10 * fs
    };
    var LH = { judul: F.judul * 1.24, nama: F.nama * 1.36 * rap, ket: F.ket * 1.42 * rap, blok: F.blokIsi * 1.45 * rap, kaki: F.kakiIsi * 1.45 };
    var padSel = Math.round(11 * fs);
    var kolNo = Math.round(40 * fs), kolWaktu = Math.round(112 * fs), kolStatus = Math.round(104 * fs);
    var kolGiat = dalam - kolNo - kolWaktu - kolStatus;
    var teksMaks = kolGiat - padSel * 2 - 4;

    fontT(c, F.judul, 800);
    var judulBaris = bungkusTeks(c, o.judul || "Rencana Kunjungan", dalam - 170 * fs);
    var kepalaT = Math.round(26 * fs + 14 * fs + judulBaris.length * LH.judul + 10 * fs + F.sub * 1.5 + 8 * fs + F.tgl * 1.5 + 24 * fs);
    var metaT = Math.round(74 * fs);
    var meta = [["WAKTU DATANG", jam(h.awal)], ["SELESAI", h.jumlah ? jam(h.selesai) : "—"], ["KEGIATAN", h.jumlah + " terjadwal"], ["ALOKASI", h.jam + " jam"]];

    var daftarBaris = h.baris.filter(function (b) { return o.bebas || b.jenis !== "jeda"; });
    var baris = daftarBaris.map(function (b) {
      var jeda = b.jenis === "jeda";
      fontT(c, F.nama, jeda ? 600 : 700);
      var nama = bungkusTeks(c, jeda ? "Waktu bebas · " + durasiTeks(b.akhir - b.mulai) : b.a.nama, teksMaks);
      var ket = [];
      if (o.keterangan) {
        fontT(c, F.ket, 400);
        ket = bungkusTeks(c, jeda ? "Menunggu jendela kegiatan berikutnya" : b.a.keterangan, teksMaks);
      }
      var padAtas = Math.round(10 * fs * rap), padBawah = Math.round(10 * fs * rap);
      var t = padAtas + nama.length * LH.nama + (ket.length ? 4 * fs + ket.length * LH.ket : 0) + padBawah;
      return { b: b, jeda: jeda, nama: nama, ket: ket, tinggi: Math.max(Math.round(38 * fs), Math.round(t)), padAtas: padAtas };
    });
    var kepalaTabelT = Math.round(30 * fs), kosongT = Math.round(56 * fs);
    var tabelT = kepalaTabelT + (baris.length ? baris.reduce(function (t, r) { return t + r.tinggi; }, 0) : kosongT);

    var gagal = h.gagal.map(function (g) {
      fontT(c, F.blokIsi, 400);
      return { g: g, baris: bungkusTeks(c, g.a.nama + " — " + g.alasan, dalam - 44 * fs) };
    });
    var gagalT = gagal.length ? Math.round(16 * fs + F.blokJudul * 1.5 + 8 * fs + gagal.reduce(function (t, x) { return t + x.baris.length * LH.blok + 6 * fs; }, 0) + 12 * fs) : 0;

    var catatanBaris = [];
    if (o.catatan && rencana.catatan.trim()) { fontT(c, F.blokIsi, 400); catatanBaris = bungkusTeks(c, rencana.catatan.trim(), dalam - 44 * fs); }
    var catatanT = catatanBaris.length ? Math.round(14 * fs + F.blokJudul * 1.5 + 6 * fs + catatanBaris.length * LH.blok + 14 * fs) : 0;

    fontT(c, F.kakiIsi, 400);
    var kakiBaris = bungkusTeks(c, "Jendela waktu kegiatan adalah waktu cahaya terbaik di pesisir, bukan jam operasional resmi. Jam buka, tarif tiket, fasilitas, dan kontak pengelola masih menunggu konfirmasi resmi Pemerintah Desa Lobuk dan pengelola Pantai Matahari.", dalam).slice(0, 3);
    var kakiT = Math.round(20 * fs + F.kakiJudul * 1.5 + 8 * fs + kakiBaris.length * LH.kaki + 20 * fs);

    var jarak = Math.round(18 * fs);
    var H = kepalaT + metaT + jarak + tabelT + (gagalT ? jarak + gagalT : 0) + (catatanT ? jarak + catatanT : 0) + jarak + kakiT;
    return {
      W: W, H: H, P: P, dalam: dalam, F: F, LH: LH, fs: fs, padSel: padSel,
      kol: { no: kolNo, waktu: kolWaktu, giat: kolGiat, status: kolStatus },
      kepala: { tinggi: kepalaT, judul: judulBaris },
      meta: { tinggi: metaT, items: meta },
      tabel: { kepalaTinggi: kepalaTabelT, baris: baris, kosongTinggi: kosongT },
      gagal: { tinggi: gagalT, items: gagal },
      catatan: { tinggi: catatanT, baris: catatanBaris },
      kaki: { tinggi: kakiT, baris: kakiBaris }, jarak: jarak
    };
  }
  function gambarPoster(kanvas, o, h) {
    var ukur = document.createElement("canvas").getContext("2d");
    var L = tataLetak(ukur, o, h);
    var skala = o.skala;
    kanvas.width = Math.round(L.W * skala);
    kanvas.height = Math.round(L.H * skala);
    var c = kanvas.getContext("2d");
    c.setTransform(skala, 0, 0, skala, 0, 0);
    c.textBaseline = "alphabetic";
    c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, L.W, L.H);

    var P = L.P, dalam = L.dalam, F = L.F, LH = L.LH, fs = L.fs;
    var t = TEMA[o.tema] || TEMA.fajar;
    var g = c.createLinearGradient(0, 0, L.W, L.kepala.tinggi);
    t.langit.forEach(function (w, i) { g.addColorStop(i / (t.langit.length - 1), w); });
    c.fillStyle = g; c.fillRect(0, 0, L.W, L.kepala.tinggi);
    var sx = L.W - P - 52 * fs, sy = L.kepala.tinggi - 44 * fs;
    var glow = c.createRadialGradient(sx, sy, 4, sx, sy, 100 * fs);
    glow.addColorStop(0, "rgba(255,200,100,.8)"); glow.addColorStop(1, "rgba(255,200,100,0)");
    c.fillStyle = glow; c.beginPath(); c.arc(sx, sy, 100 * fs, 0, Math.PI * 2); c.fill();
    c.fillStyle = t.matahari; c.beginPath(); c.arc(sx, sy, 30 * fs, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(255,255,255,.24)"; c.lineWidth = 2;
    for (var wv = 0; wv < 3; wv++) {
      var yy = L.kepala.tinggi - 22 * fs + wv * 8 * fs;
      c.beginPath(); c.moveTo(0, yy);
      for (var x = 0; x <= L.W; x += 54) c.quadraticCurveTo(x + 27, yy + (wv % 2 ? 6 : -6), x + 54, yy);
      c.stroke();
    }
    var y = 26 * fs;
    c.fillStyle = "rgba(255,255,255,.8)"; fontT(c, F.label, 800);
    c.fillText("SISTEM INFORMASI WISATA BAHARI DESA LOBUK", P, y + F.label);
    y += F.label + 14 * fs;
    c.fillStyle = "#FFFFFF"; fontT(c, F.judul, 800);
    L.kepala.judul.forEach(function (b) { c.fillText(b, P, y + F.judul * 0.92); y += LH.judul; });
    y += 10 * fs;
    c.fillStyle = "rgba(255,255,255,.9)"; fontT(c, F.sub, 500);
    c.fillText("Pantai Matahari · Desa Lobuk, Kec. Bluto, Kab. Sumenep", P, y + F.sub);
    y += F.sub * 1.5 + 8 * fs;
    c.fillStyle = "rgba(255,255,255,.66)"; fontT(c, F.tgl, 500);
    c.fillText("Disusun " + new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), P, y + F.tgl);

    y = L.kepala.tinggi;
    c.fillStyle = "#EEF4F8"; c.fillRect(0, y, L.W, L.meta.tinggi);
    var lw = dalam / 4;
    L.meta.items.forEach(function (m, i) {
      var mx = P + i * lw;
      if (i) { c.strokeStyle = "#D8E4EC"; c.lineWidth = 1; c.beginPath(); c.moveTo(mx - 12 * fs, y + 18 * fs); c.lineTo(mx - 12 * fs, y + L.meta.tinggi - 18 * fs); c.stroke(); }
      c.fillStyle = "#5B6B78"; fontT(c, F.metaLabel, 800); c.fillText(m[0], mx, y + 28 * fs);
      c.fillStyle = "#0E5A8A"; fontT(c, F.metaNilai, 800); c.fillText(m[1], mx, y + 54 * fs);
    });
    y += L.meta.tinggi + L.jarak;

    var tabelY = y;
    c.fillStyle = "#0E5A8A"; c.fillRect(P, y, dalam, L.tabel.kepalaTinggi);
    c.fillStyle = "#FFFFFF"; fontT(c, F.th, 800);
    var bx = P + L.padSel;
    c.fillText("NO", bx, y + L.tabel.kepalaTinggi * 0.66);
    c.fillText("WAKTU", P + L.kol.no + L.padSel, y + L.tabel.kepalaTinggi * 0.66);
    c.fillText("KEGIATAN", P + L.kol.no + L.kol.waktu + L.padSel, y + L.tabel.kepalaTinggi * 0.66);
    c.fillText("STATUS", P + L.kol.no + L.kol.waktu + L.kol.giat + L.padSel, y + L.tabel.kepalaTinggi * 0.66);
    y += L.tabel.kepalaTinggi;

    if (!L.tabel.baris.length) {
      c.fillStyle = "#F7FBFD"; c.fillRect(P, y, dalam, L.tabel.kosongTinggi);
      c.fillStyle = "#5B6B78"; fontT(c, F.nama, 600);
      c.fillText("Belum ada kegiatan terpilih pada rencana ini.", P + L.padSel, y + L.tabel.kosongTinggi * 0.6);
      y += L.tabel.kosongTinggi;
    }
    var nomor = 0;
    L.tabel.baris.forEach(function (r, i) {
      c.fillStyle = r.jeda ? "#FBF0DC" : (i % 2 ? "#F7FBFD" : "#FFFFFF");
      c.fillRect(P, y, dalam, r.tinggi);
      c.strokeStyle = "#DCEBF4"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(P, y + r.tinggi - 0.5); c.lineTo(P + dalam, y + r.tinggi - 0.5); c.stroke();
      var ty = y + r.padAtas;
      c.fillStyle = r.jeda ? "#C77A16" : "#8A98A3"; fontT(c, F.no, 800);
      c.fillText(r.jeda ? "—" : String(++nomor), bx, ty + F.no);
      c.fillStyle = r.jeda ? "#C77A16" : "#0E5A8A"; fontT(c, F.waktu, 800);
      c.fillText(jam(r.b.mulai), P + L.kol.no + L.padSel, ty + F.waktu);
      c.fillText(jam(r.b.akhir), P + L.kol.no + L.padSel, ty + F.waktu + F.waktu * 1.45);
      var tx = P + L.kol.no + L.kol.waktu + L.padSel, ny = ty;
      c.fillStyle = r.jeda ? "#7A4B08" : "#1F2933"; fontT(c, F.nama, r.jeda ? 600 : 700);
      r.nama.forEach(function (b) { c.fillText(b, tx, ny + F.nama * 0.95); ny += LH.nama; });
      if (r.ket.length) {
        ny += 4 * fs;
        c.fillStyle = r.jeda ? "#9A6A1E" : "#5B6B78"; fontT(c, F.ket, 400);
        r.ket.forEach(function (b) { c.fillText(b, tx, ny + F.ket * 0.95); ny += LH.ket; });
      }
      var qx = P + L.kol.no + L.kol.waktu + L.kol.giat + L.padSel;
      var label = r.jeda ? "Waktu bebas" : "Terjadwal";
      fontT(c, F.badge, 800);
      var bw = c.measureText(label).width + 22 * fs, bh = 19 * fs;
      c.fillStyle = r.jeda ? "#F1E8D8" : "#E4F3EC";
      kotakBulat(c, qx, ty, bw, bh, bh / 2); c.fill();
      c.fillStyle = r.jeda ? "#C97D22" : "#1F8A5F";
      c.beginPath(); c.arc(qx + 10 * fs, ty + bh / 2, 3 * fs, 0, Math.PI * 2); c.fill();
      c.fillText(label, qx + 17 * fs, ty + bh / 2 + F.badge * 0.36);
      y += r.tinggi;
    });
    c.strokeStyle = "#D8E4EC"; c.lineWidth = 1.5;
    c.strokeRect(P, tabelY, dalam, y - tabelY);

    if (L.gagal.tinggi) {
      y += L.jarak;
      c.fillStyle = "#FBE9E6"; kotakBulat(c, P, y, dalam, L.gagal.tinggi, 8); c.fill();
      var gy = y + 16 * fs;
      c.fillStyle = "#C2412D"; fontT(c, F.blokJudul, 800);
      c.fillText("Belum masuk jadwal (" + L.gagal.items.length + ")", P + 20 * fs, gy + F.blokJudul);
      gy += F.blokJudul * 1.5 + 8 * fs;
      c.fillStyle = "#7C2D1F"; fontT(c, F.blokIsi, 400);
      L.gagal.items.forEach(function (gb) {
        gb.baris.forEach(function (b, k) { c.fillText((k === 0 ? "• " : "   ") + b, P + 20 * fs, gy + F.blokIsi * 0.95); gy += LH.blok; });
        gy += 6 * fs;
      });
      y += L.gagal.tinggi;
    }
    if (L.catatan.tinggi) {
      y += L.jarak;
      c.fillStyle = "#E3EFF6"; kotakBulat(c, P, y, dalam, L.catatan.tinggi, 8); c.fill();
      c.fillStyle = "#12719F"; c.fillRect(P, y, 4, L.catatan.tinggi);
      var cy = y + 14 * fs;
      c.fillStyle = "#14506F"; fontT(c, F.blokJudul, 800);
      c.fillText("CATATAN", P + 20 * fs, cy + F.blokJudul);
      cy += F.blokJudul * 1.5 + 6 * fs;
      fontT(c, F.blokIsi, 400);
      L.catatan.baris.forEach(function (b) { c.fillText(b, P + 20 * fs, cy + F.blokIsi * 0.95); cy += LH.blok; });
      y += L.catatan.tinggi;
    }
    y += L.jarak;
    c.fillStyle = "#06263C"; c.fillRect(0, y, L.W, L.kaki.tinggi);
    var fy = y + 20 * fs;
    c.fillStyle = "#FFC864"; fontT(c, F.kakiJudul, 800);
    c.fillText("LOBUK BAHARI", P, fy + F.kakiJudul);
    fy += F.kakiJudul * 1.5 + 8 * fs;
    c.fillStyle = "rgba(255,255,255,.72)"; fontT(c, F.kakiIsi, 400);
    L.kaki.baris.forEach(function (b) { c.fillText(b, P, fy + F.kakiIsi * 0.95); fy += LH.kaki; });

    return { lebar: kanvas.width, tinggi: kanvas.height };
  }
  function siapFont() {
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) return document.fonts.ready.catch(function () { });
    return Promise.resolve();
  }
  function terapZoomPratinjau() {
    var img = $("#studioPratinjau"); if (!img) return;
    if (pratinjauMode === "piksel") img.style.width = ukuranPoster.lebar + "px";
    else img.style.width = pratinjauZoom + "%";
    var z = $("#zoomPratinjauNilai");
    if (z) z.textContent = pratinjauMode === "piksel" ? "1:1 px" : pratinjauZoom + "%";
  }
  function gambarStudio() {
    var img = $("#studioPratinjau"); if (!img) return;
    if (studioTimer) clearTimeout(studioTimer);
    studioTimer = setTimeout(function () {
      studioTimer = null;
      siapFont().then(function () {
        try {
          if (!kanvasStudio) kanvasStudio = document.createElement("canvas");
          var h = hasil || hitungJadwal(rencana.waktu, rencana.jam, rencana.pilih);
          var o = {
            tema: ekspor.tema, skala: ekspor.skala, huruf: ekspor.huruf, rapat: ekspor.rapat,
            lebar: ekspor.lebar, keterangan: ekspor.keterangan, catatan: ekspor.catatan, bebas: ekspor.bebas,
            judul: ($("#studioJudul") && $("#studioJudul").value.trim()) || rencana.judul
          };
          ukuranPoster = gambarPoster(kanvasStudio, o, h);
          var mime = ekspor.format === "jpg" ? "image/jpeg" : "image/png";
          img.src = kanvasStudio.toDataURL(mime, ekspor.format === "jpg" ? ekspor.kualitas / 100 : undefined);
          img.alt = "Pratinjau tabel jadwal kunjungan " + o.judul;
          terapZoomPratinjau();
          $("#studioUkuran").textContent = ukuranPoster.lebar + " × " + ukuranPoster.tinggi + " px · " +
            (ekspor.format === "jpg" ? "JPG" : "PNG") + " · huruf " + ekspor.huruf + "%";
        } catch (e) { $("#studioUkuran").textContent = "Pratinjau gagal dibuat"; }
      });
    }, 110);
  }
  function initStudio() {
    if (!$("#studioPratinjau")) return;
    $("#studioJudul").value = rencana.judul;
    $("#studioJudul").addEventListener("input", gambarStudio);
    $("#segTema").addEventListener("click", function (e) {
      var b = e.target.closest("[data-tema]"); if (!b) return;
      ekspor.tema = b.getAttribute("data-tema");
      $$("#segTema button").forEach(function (x) { x.classList.toggle("aktif", x === b); });
      gambarStudio();
    });
    $("#segFormat").addEventListener("click", function (e) {
      var b = e.target.closest("[data-format]"); if (!b) return;
      ekspor.format = b.getAttribute("data-format");
      $$("#segFormat button").forEach(function (x) { x.classList.toggle("aktif", x === b); });
      $("#studioKualitas").disabled = ekspor.format !== "jpg";
      $("#unduhLabel").textContent = ekspor.format === "jpg" ? "⬇ Unduh JPG" : "⬇ Unduh PNG";
      gambarStudio();
    });
    $("#segSkala").addEventListener("click", function (e) {
      var b = e.target.closest("[data-skala]"); if (!b) return;
      ekspor.skala = parseInt(b.getAttribute("data-skala"), 10);
      $$("#segSkala button").forEach(function (x) { x.classList.toggle("aktif", x === b); });
      gambarStudio();
    });
    $("#segRapat").addEventListener("click", function (e) {
      var b = e.target.closest("[data-rapat]"); if (!b) return;
      ekspor.rapat = b.getAttribute("data-rapat");
      $$("#segRapat button").forEach(function (x) { x.classList.toggle("aktif", x === b); });
      gambarStudio();
    });
    $("#segLebar").addEventListener("click", function (e) {
      var b = e.target.closest("[data-lebar]"); if (!b) return;
      ekspor.lebar = parseInt(b.getAttribute("data-lebar"), 10);
      $$("#segLebar button").forEach(function (x) { x.classList.toggle("aktif", x === b); });
      gambarStudio();
    });
    $("#studioHuruf").addEventListener("input", function () {
      ekspor.huruf = parseInt(this.value, 10);
      $("#nilaiHuruf").textContent = ekspor.huruf + "%";
      gambarStudio();
    });
    $("#studioKualitas").addEventListener("input", function () {
      ekspor.kualitas = parseInt(this.value, 10);
      $("#nilaiKualitas").textContent = ekspor.kualitas + "%";
      gambarStudio();
    });
    [["studioKet", "keterangan"], ["studioCatatan", "catatan"], ["studioBebas", "bebas"]].forEach(function (p) {
      $("#" + p[0]).addEventListener("change", function () { ekspor[p[1]] = this.checked; gambarStudio(); });
    });
    $("#segZoomPratinjau").addEventListener("click", function (e) {
      var b = e.target.closest("[data-zoom]"); if (!b) return;
      var v = b.getAttribute("data-zoom");
      pratinjauMode = v === "piksel" ? "piksel" : "pas";
      if (v !== "piksel") pratinjauZoom = parseInt(v, 10);
      $$("#segZoomPratinjau button").forEach(function (x) { x.classList.toggle("aktif", x === b); });
      $("#zoomPratinjau").value = pratinjauZoom;
      $("#zoomPratinjau").disabled = pratinjauMode === "piksel";
      terapZoomPratinjau();
    });
    $("#zoomPratinjau").addEventListener("input", function () {
      pratinjauMode = "pas"; pratinjauZoom = parseInt(this.value, 10);
      $$("#segZoomPratinjau button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-zoom") === String(pratinjauZoom)); });
      this.disabled = false; terapZoomPratinjau();
    });
    $("#studioAcak").addEventListener("click", function () {
      var kunci = Object.keys(TEMA);
      ekspor.tema = kunci[Math.floor(Math.random() * kunci.length)];
      $$("#segTema button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-tema") === ekspor.tema); });
      gambarStudio(); notif("Tema header: " + TEMA[ekspor.tema].nama, "info");
    });
    $("#studioReset").addEventListener("click", function () {
      ekspor = { tema: "fajar", format: "png", skala: 2, kualitas: 92, huruf: 100, rapat: "normal", lebar: 1080, keterangan: true, catatan: true, bebas: true };
      $$("#segTema button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-tema") === "fajar"); });
      $$("#segFormat button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-format") === "png"); });
      $$("#segSkala button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-skala") === "2"); });
      $$("#segRapat button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-rapat") === "normal"); });
      $$("#segLebar button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-lebar") === "1080"); });
      $("#studioKualitas").value = 92; $("#studioKualitas").disabled = true; $("#nilaiKualitas").textContent = "92%";
      $("#studioHuruf").value = 100; $("#nilaiHuruf").textContent = "100%";
      $("#studioKet").checked = true; $("#studioCatatan").checked = true; $("#studioBebas").checked = true;
      $("#studioJudul").value = rencana.judul;
      $("#unduhLabel").textContent = "⬇ Unduh PNG";
      pratinjauMode = "pas"; pratinjauZoom = 100; $("#zoomPratinjau").value = 100; $("#zoomPratinjau").disabled = false;
      $$("#segZoomPratinjau button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-zoom") === "100"); });
      gambarStudio(); notif("Setelan ekspor dikembalikan", "info");
    });
    $("#studioUnduh").addEventListener("click", function () {
      if (!kanvasStudio) { notif("Pratinjau belum siap", "gagal"); return; }
      try {
        var mime = ekspor.format === "jpg" ? "image/jpeg" : "image/png";
        var url = kanvasStudio.toDataURL(mime, ekspor.format === "jpg" ? ekspor.kualitas / 100 : undefined);
        unduhData(slug($("#studioJudul").value || rencana.judul) + "-lobuk." + (ekspor.format === "jpg" ? "jpg" : "png"), url);
        notif("Tabel jadwal diunduh sebagai " + (ekspor.format === "jpg" ? "JPG" : "PNG"));
      } catch (e) { notif("Gagal membuat berkas gambar", "gagal"); }
    });
    $("#studioSalin").addEventListener("click", function () {
      if (!kanvasStudio) { notif("Pratinjau belum siap", "gagal"); return; }
      if (!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write)) { notif("Peramban ini tidak mendukung salin gambar. Gunakan Unduh.", "gagal"); return; }
      kanvasStudio.toBlob(function (blob) {
        if (!blob) { notif("Gagal menyiapkan gambar", "gagal"); return; }
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(function () { notif("Gambar jadwal tersalin ke papan klip"); }, function () { notif("Salin gambar ditolak peramban. Gunakan Unduh.", "gagal"); });
      }, "image/png");
    });
    gambarStudio();
  }

  /* ============================================================
     LOKASI — Google Maps Embed API (place / view, satellite)
     Jatuh-balik: sematan klasik tanpa kunci, lalu skema luring.
     ============================================================ */
  var KUNCI_KEY = "lobuk_maps_api_key_v1";
  var TITIK_KEY = "lobuk_titik_resmi_v1";
  function initLokasi() {
    var bingkai = $("#petaBingkai"); if (!bingkai) return;
    var L = ada(D.lokasi, {}), titik = ada(L.titik, []), jenisDaftar = ada(L.jenisPeta, []);
    var frame = $("#petaFrame"), tirai = $("#petaTirai"), skema = $("#petaSkema");
    var aktif = titik.length ? titik[0].id : null;
    var sumber = ada(L.sumberAwal, "api");
    var jenis = ada(L.jenisAwal, "satelit");
    var zoom = ada(L.zoomAwal, 16);
    var tinggi = ada(L.tinggiAwal, 520);
    var kunci = LS.get(KUNCI_KEY, ada(L.kunciApi, "")) || "";
    var resmi = LS.get(TITIK_KEY, null);
    var timer = null, kunciTampak = false;

    var segJenis = $("#segJenis");
    function gambarJenis() {
      var apiAktif = sumber === "api" && !!kunci;
      segJenis.innerHTML = jenisDaftar.map(function (j) {
        var mati = apiAktif && !j.api;
        return "<button type='button'" + (j.kode === jenis ? " class='aktif'" : "") + (mati ? " disabled title='Embed API hanya mendukung Satelit dan Peta jalan'" : "") + " data-j='" + j.kode + "'>" + j.ikon + " " + esc(j.nama) + "</button>";
      }).join("");
    }
    function target() { return titik.filter(function (x) { return x.id === aktif; })[0] || titik[0]; }
    function jenisObj() { return jenisDaftar.filter(function (x) { return x.kode === jenis; })[0] || jenisDaftar[0]; }
    function pusat() { return resmi ? (resmi.lat.toFixed(6) + "," + resmi.lng.toFixed(6)) : null; }
    function pakaiApi() { return sumber === "api" && !!kunci; }
    function urlSemat() {
      var t = target(), jo = jenisObj(), c = pusat();
      if (pakaiApi()) {
        var dasar = ada(L.embedApiDasar, "https://www.google.com/maps/embed/v1/");
        var k = "key=" + encodeURIComponent(kunci) + "&zoom=" + zoom + "&maptype=" + jo.embed + "&language=id";
        return c ? dasar + "view?" + k + "&center=" + encodeURIComponent(c)
                 : dasar + "place?" + k + "&q=" + encodeURIComponent(t.kueri);
      }
      var q = c || t.kueri;
      return ada(L.petaKlasikDasar, "https://maps.google.com/maps") + "?q=" + encodeURIComponent(q) +
        "&t=" + jo.klasik + "&z=" + zoom + "&hl=id&ie=UTF8&iwloc=&output=embed";
    }
    function urlLuar() {
      var t = target(), jo = jenisObj(), q = pusat() || t.kueri;
      return ada(L.petaLuarDasar, "https://maps.google.com/maps") + "?q=" + encodeURIComponent(q) + "&t=" + jo.klasik + "&z=" + zoom + "&hl=id";
    }
    function labelSumber() {
      if (sumber === "skema") return "Skema luring";
      if (pakaiApi()) return "Maps Embed API";
      return sumber === "api" ? "Klasik · kunci belum ada" : "Klasik tanpa kunci";
    }
    function muat() {
      var t = target(); if (!t) return;
      if (pakaiApi() && !jenisObj().api) jenis = "satelit";
      gambarJenis();
      bingkai.style.setProperty("--tinggi", tinggi + "px");
      $("#zoomNilai").textContent = zoom;
      $("#tinggiNilai").textContent = tinggi + " px";
      $("#petaJudul").textContent = resmi ? "Titik resmi Pantai Matahari" : t.nama;
      $("#petaSub").textContent = labelSumber() + " · " + jenisObj().nama + " · zoom " + zoom +
        (resmi ? " · " + resmi.lat.toFixed(5) + ", " + resmi.lng.toFixed(5) : "");
      $("#petaModeBadge").textContent = labelSumber();
      $("#petaBuka").href = urlLuar();
      $("#kunciStatus").innerHTML = kunci
        ? "<span class='lencana l-siap'>Kunci tersimpan</span>"
        : "<span class='lencana l-tunggu'>Kunci belum diisi</span>";
      $("#lokasiDetail").innerHTML = "<h3>" + esc(resmi ? "Titik resmi pantai" : t.nama) + "</h3><p>" +
        esc(resmi ? "Peta dipusatkan pada koordinat resmi yang dimasukkan pengelola: " + resmi.lat.toFixed(6) + ", " + resmi.lng.toFixed(6) + "." : t.detail) +
        "</p><div style='margin-top:12px'>" + lencana(resmi ? "siap" : t.status) + "</div>";
      $$("#lokasiTitik .titik").forEach(function (b) { b.classList.toggle("aktif", !resmi && b.getAttribute("data-t") === aktif); });
      $("#titikStatus").textContent = resmi ? "Titik koordinat resmi aktif" : "Memakai nama wilayah";

      if (sumber === "skema") {
        frame.hidden = true; frame.removeAttribute("src");
        skema.hidden = false; tirai.hidden = true;
        if (timer) { clearTimeout(timer); timer = null; }
        $("#petaStatus").textContent = "Skema luring aktif · tidak berskala";
        return;
      }
      skema.hidden = true; frame.hidden = false; tirai.hidden = false;
      tirai.innerHTML = "<div><b>Memuat " + esc(jenisObj().nama.toLowerCase()) + " Google Maps…</b><p>" +
        (pakaiApi() ? "Maps Embed API aktif. Perlu koneksi internet." : "Sematan tanpa kunci aktif. Perlu koneksi internet.") +
        " Bila tidak muncul, buka langsung di Google Maps atau pakai skema luring.</p></div>";
      $("#petaStatus").textContent = "Memuat " + labelSumber().toLowerCase();
      frame.src = urlSemat();
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        if (!tirai.hidden) {
          tirai.innerHTML = "<div><b>Peta belum termuat</b><p>" +
            (pakaiApi()
              ? "Kunci API mungkin belum aktif untuk Maps Embed API, atau jaringan terbatas. Periksa kunci, ganti ke mode tanpa kunci, atau buka di Google Maps."
              : "Koneksi terbatas atau layanan peta menunda sematan. Buka di Google Maps atau pakai skema luring.") +
            "</p></div>";
          $("#petaStatus").textContent = "Sematan tertunda";
        }
      }, 9000);
    }
    frame.addEventListener("load", function () {
      if (timer) { clearTimeout(timer); timer = null; }
      tirai.hidden = true;
      $("#petaStatus").textContent = labelSumber() + " · " + jenisObj().nama + " termuat";
    });
    frame.addEventListener("error", function () {
      tirai.hidden = false;
      tirai.innerHTML = "<div><b>Peta gagal dimuat</b><p>Gunakan “Buka di Google Maps”, mode tanpa kunci, atau skema luring.</p></div>";
      $("#petaStatus").textContent = "Peta gagal dimuat";
    });

    var wadah = $("#lokasiTitik");
    wadah.innerHTML = titik.map(function (t, i) {
      return "<button type='button' class='titik" + (t.id === aktif ? " aktif" : "") + "' data-t='" + t.id + "'>" +
        "<span class='titik-n'>" + (i + 1) + "</span><span><b>" + esc(t.nama) + "</b><small>" +
        (t.status === "siap" ? "Citra satelit wilayah" : "Pencarian nama destinasi") + "</small></span></button>";
    }).join("");
    wadah.addEventListener("click", function (e) {
      var b = e.target.closest("[data-t]"); if (!b) return;
      aktif = b.getAttribute("data-t");
      var t = target(); if (t) zoom = t.zoom;
      if (resmi) { resmi = null; LS.set(TITIK_KEY, null); $("#latInput").value = ""; $("#lngInput").value = ""; }
      muat();
    });
    segJenis.addEventListener("click", function (e) {
      var b = e.target.closest("[data-j]"); if (!b || b.disabled) return;
      jenis = b.getAttribute("data-j");
      if (sumber === "skema") sumber = kunci ? "api" : "klasik";
      $$("#segSumber button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-s") === sumber); });
      muat();
    });
    $("#segSumber").addEventListener("click", function (e) {
      var b = e.target.closest("[data-s]"); if (!b) return;
      sumber = b.getAttribute("data-s");
      $$("#segSumber button").forEach(function (x) { x.classList.toggle("aktif", x === b); });
      if (sumber === "api" && !kunci) {
        notif("Kunci API belum diisi — sementara memakai sematan tanpa kunci.", "info");
        $("#apiKunci").focus();
      }
      muat();
    });
    $("#zoomKurang").addEventListener("click", function () { zoom = Math.max(3, zoom - 1); muat(); });
    $("#zoomTambah").addEventListener("click", function () { zoom = Math.min(21, zoom + 1); muat(); });
    $("#tinggiKurang").addEventListener("click", function () { tinggi = Math.max(320, tinggi - 60); muat(); });
    $("#tinggiTambah").addEventListener("click", function () { tinggi = Math.min(860, tinggi + 60); muat(); });
    $("#petaUlang").addEventListener("click", function () {
      if (sumber === "skema") sumber = kunci ? "api" : "klasik";
      $$("#segSumber button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-s") === sumber); });
      muat(); notif("Memuat ulang peta", "info");
    });
    $("#petaPenuh").addEventListener("click", function () {
      if (bingkai.requestFullscreen) bingkai.requestFullscreen().catch(function () { notif("Layar penuh ditolak peramban", "gagal"); });
      else notif("Peramban ini tidak mendukung layar penuh", "gagal");
    });
    $("#petaSalinTautan").addEventListener("click", function () { salin(urlLuar(), "Tautan peta tersalin"); });
    $("#petaSalinSemat").addEventListener("click", function () {
      salin('<iframe src="' + urlSemat() + '" width="100%" height="' + tinggi + '" style="border:0" loading="lazy" allowfullscreen title="Peta Desa Lobuk"></iframe>', "Kode sematan tersalin");
    });
    $("#kunciLihat").addEventListener("click", function () {
      kunciTampak = !kunciTampak;
      $("#apiKunci").type = kunciTampak ? "text" : "password";
      this.textContent = kunciTampak ? "🙈" : "👁";
      this.setAttribute("aria-label", kunciTampak ? "Sembunyikan kunci" : "Tampilkan kunci");
    });
    $("#kunciSimpan").addEventListener("click", function () {
      var v = $("#apiKunci").value.trim();
      if (v.length < 20) { $("#apiKunci").classList.add("salah"); notif("Kunci API tampak terlalu pendek. Tempel kunci Maps Embed API yang lengkap.", "gagal"); return; }
      $("#apiKunci").classList.remove("salah");
      kunci = v; LS.set(KUNCI_KEY, kunci);
      sumber = "api";
      $$("#segSumber button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-s") === "api"); });
      muat(); notif("Kunci API tersimpan. Maps Embed API diaktifkan.");
    });
    $("#kunciHapus").addEventListener("click", function () {
      if (!kunci) { notif("Belum ada kunci tersimpan", "info"); return; }
      var lama = kunci;
      kunci = ""; LS.set(KUNCI_KEY, ""); $("#apiKunci").value = "";
      muat();
      notif("Kunci API dihapus. Peta kembali ke sematan tanpa kunci.", "info", {
        label: "Urungkan", fn: function () {
          kunci = lama; LS.set(KUNCI_KEY, lama); $("#apiKunci").value = lama;
          sumber = "api";
          $$("#segSumber button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-s") === "api"); });
          muat(); notif("Kunci API dikembalikan");
        }
      });
    });
    $("#apiKunci").addEventListener("input", function () { this.classList.remove("salah"); });
    $("#apiKunci").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#kunciSimpan").click(); } });
    $("#titikTerap").addEventListener("click", function () {
      var lat = parseFloat(String($("#latInput").value).replace(",", "."));
      var lng = parseFloat(String($("#lngInput").value).replace(",", "."));
      if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        $("#latInput").classList.add("salah"); $("#lngInput").classList.add("salah");
        notif("Koordinat tidak valid. Lintang −90…90, bujur −180…180.", "gagal"); return;
      }
      $("#latInput").classList.remove("salah"); $("#lngInput").classList.remove("salah");
      resmi = { lat: lat, lng: lng }; LS.set(TITIK_KEY, resmi);
      zoom = Math.max(zoom, 17);
      if (sumber === "skema") sumber = kunci ? "api" : "klasik";
      $$("#segSumber button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-s") === sumber); });
      muat(); notif("Peta dipusatkan pada koordinat resmi");
    });
    $("#titikHapus").addEventListener("click", function () {
      if (!resmi) { notif("Belum ada titik koordinat resmi", "info"); return; }
      var lama = resmi;
      resmi = null; LS.set(TITIK_KEY, null);
      $("#latInput").value = ""; $("#lngInput").value = "";
      muat();
      notif("Titik resmi dihapus", "info", {
        label: "Urungkan", fn: function () {
          resmi = lama; LS.set(TITIK_KEY, lama);
          $("#latInput").value = lama.lat; $("#lngInput").value = lama.lng;
          muat(); notif("Titik resmi dikembalikan");
        }
      });
    });
    ["latInput", "lngInput"].forEach(function (id) {
      $("#" + id).addEventListener("input", function () { this.classList.remove("salah"); });
    });
    if (kunci) $("#apiKunci").value = kunci;
    if (resmi) { $("#latInput").value = resmi.lat; $("#lngInput").value = resmi.lng; }
    $$("#segSumber button").forEach(function (x) { x.classList.toggle("aktif", x.getAttribute("data-s") === sumber); });

    var et = $("#lokasiEtape");
    if (et) et.innerHTML = ada(L.petunjukAkses, []).map(function (p, i) {
      return "<div class='etap'><span class='etap-n'>" + (i + 1) + "</span><div><b>" + esc(p.tahap) + "</b><p>" + esc(p.detail) + "</p>" + lencana(p.status) + "</div></div>";
    }).join("");
    var alamat = $("#lokasiAlamat"); if (alamat) alamat.textContent = ada(L.alamat, "");
    var sb = $("#salinAlamat"); if (sb) sb.addEventListener("click", function () { salin(ada(L.alamat, ""), "Alamat tersalin"); });
    muat();
  }

  /* ---------- Produk ---------- */
  function initProduk() {
    var wadah = $("#produkKisi"); if (!wadah) return;
    wadah.innerHTML = ada(D.produkLokal, []).map(function (p, i) {
      return "<article class='kartu muncul' style='--tunda:" + (i * 0.06) + "s'><div class='kartu-isi'>" +
        "<div class='fikon' style='width:52px;height:52px;font-size:24px'>" + p.ikon + "</div>" +
        "<h3>" + esc(p.nama) + "</h3><p>" + esc(p.deskripsi) + "</p>" +
        "<div class='kartu-kaki'>" + lencana(p.status) + "</div></div></article>";
    }).join("");
    var cat = $("#catatanProduk"); if (cat) cat.textContent = ada(D.catatanProduk, "");
  }

  /* ---------- Kesiapan data ---------- */
  var CENTANG_KEY = "lobuk_checklist_v1";
  function initKesiapan() {
    var wadah = $("#kesiapanRingkas"); if (!wadah) return;
    var butir = ada(D.kesiapanData, []), tetap = ada(D.dataTerverifikasi, []);
    function gambar() {
      var dicentang = LS.get(CENTANG_KEY, []);
      var total = butir.length + tetap.length, siap = tetap.length + dicentang.length;
      var persen = total ? Math.round((siap / total) * 100) : 0;
      wadah.innerHTML = "<div class='ukur-angka'><span>" + siap + " dari " + total + " butir informasi siap</span><span>" + persen + "%</span></div>" +
        "<div class='ukur'><div class='ukur-isi' style='width:" + persen + "%'></div></div>" +
        "<p style='font-size:13px;color:var(--tinta-2);margin-top:10px'>Butir yang belum siap tidak ditampilkan sebagai dugaan. Centang progres pengumpulan data di halaman Kontak.</p>" +
        "<div style='display:flex;gap:9px;flex-wrap:wrap;margin-top:14px'><a class='btn btn-laut btn-kecil' href='kontak.html#checklist'>Buka checklist data</a>" +
        "<button type='button' class='btn btn-garis btn-kecil' id='lihatTunggu'>Lihat yang menunggu</button></div>" +
        "<div id='daftarTunggu' hidden style='margin-top:14px'></div>";
      $("#lihatTunggu").addEventListener("click", function () {
        var d = $("#daftarTunggu"), buka = d.hasAttribute("hidden");
        if (!buka) { d.setAttribute("hidden", ""); this.textContent = "Lihat yang menunggu"; return; }
        var belum = butir.filter(function (x) { return dicentang.indexOf(x.id) < 0; });
        d.innerHTML = belum.length
          ? "<ul style='font-size:13.5px;color:var(--tinta-2)'>" + belum.map(function (x) { return "<li><b style='color:var(--tinta)'>" + esc(x.label) + "</b> — " + esc(x.sumber) + "</li>"; }).join("") + "</ul>"
          : "<p style='font-size:13.5px;color:var(--sukses)'><b>Semua butir data mitra sudah terkumpul.</b></p>";
        d.removeAttribute("hidden"); this.textContent = "Sembunyikan daftar";
      });
    }
    gambar();
    window.addEventListener("storage", gambar);
  }

  /* ---------- Kontak ---------- */
  var PESAN_KEY = "lobuk_pesan_v1";
  function gambarDrafPesan() {
    var wadah = $("#pesanDraf"); if (!wadah) return;
    var daftar = LS.get(PESAN_KEY, []);
    if (!daftar.length) { wadah.innerHTML = "<p style='font-size:13px;color:var(--tinta-2)'>Belum ada pesan tersusun.</p>"; return; }
    wadah.innerHTML = daftar.map(function (d) {
      return "<div class='draf'><div class='tumbuh'><b>" + esc(d.topik) + "</b><small>" + esc(d.nama) + " · " + new Date(d.ts).toLocaleString("id-ID") + "</small></div>" +
        "<button type='button' class='btn btn-garis btn-kecil' data-salin='" + d.id + "'>Salin</button>" +
        "<button type='button' class='btn btn-bahaya btn-kecil' data-hapus='" + d.id + "' aria-label='Hapus pesan'>🗑</button></div>";
    }).join("");
  }
  function initKontak() {
    var form = $("#formPesan"); if (!form) return;
    var K = ada(D.kontak, {}), topik = $("#pesanTopik");
    ada(D.kesiapanData, []).forEach(function (k) {
      var o = document.createElement("option"); o.value = k.label; o.textContent = k.label; topik.appendChild(o);
    });
    ["pesanNama", "pesanIsi"].forEach(function (id) {
      $("#" + id).addEventListener("input", function () { this.closest(".grup").classList.remove("gagal"); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nama = $("#pesanNama"), isi = $("#pesanIsi"), ok = true;
      if (!nama.value.trim()) { nama.closest(".grup").classList.add("gagal"); ok = false; }
      if (isi.value.trim().length < 10) { isi.closest(".grup").classList.add("gagal"); ok = false; }
      if (!ok) { notif("Lengkapi kolom yang ditandai", "gagal"); return; }
      var teks = "Kepada Yth. " + ada(K.pengelola, "Pengelola Pantai Matahari") + "\n" + ada(K.alamat, "") + "\n\n" +
        "Perihal: " + topik.value + "\nNama pengirim: " + nama.value.trim() +
        ($("#pesanKontak").value.trim() ? "\nKontak balik: " + $("#pesanKontak").value.trim() : "") +
        "\n\n" + isi.value.trim() + "\n\nDisusun melalui Sistem Informasi Wisata Bahari Desa Lobuk.";
      $("#hasilPesan").value = teks; $("#hasilWrap").hidden = false;
      var daftar = LS.get(PESAN_KEY, []);
      daftar.unshift({ id: "p" + Date.now(), nama: nama.value.trim(), topik: topik.value, teks: teks, ts: Date.now() });
      LS.set(PESAN_KEY, daftar.slice(0, 12));
      gambarDrafPesan(); notif("Pesan tersusun — silakan salin atau unduh");
      $("#hasilWrap").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    $("#salinPesan").addEventListener("click", function () { salin($("#hasilPesan").value, "Pesan tersalin"); });
    $("#unduhPesan").addEventListener("click", function () { unduhTeks("pesan-pengelola-lobuk.txt", $("#hasilPesan").value); notif("Berkas pesan diunduh"); });
    $("#resetPesan").addEventListener("click", function () { form.reset(); $("#hasilWrap").hidden = true; notif("Formulir dikosongkan", "info"); });
    $("#pesanDraf").addEventListener("click", function (e) {
      var s = e.target.closest("[data-salin]"), h = e.target.closest("[data-hapus]");
      var list = LS.get(PESAN_KEY, []);
      if (s) { var d = list.filter(function (x) { return x.id === s.getAttribute("data-salin"); })[0]; if (d) salin(d.teks, "Pesan tersalin"); }
      if (h) {
        var id = h.getAttribute("data-hapus"), idx = -1;
        list.forEach(function (x, i) { if (x.id === id) idx = i; });
        if (idx < 0) return;
        var rm = list.splice(idx, 1)[0]; LS.set(PESAN_KEY, list); gambarDrafPesan();
        notif("Pesan dihapus", "info", { label: "Urungkan", fn: function () { var k = LS.get(PESAN_KEY, []); k.splice(idx, 0, rm); LS.set(PESAN_KEY, k); gambarDrafPesan(); notif("Pesan dikembalikan"); } });
      }
    });
    gambarDrafPesan();
  }
  function initChecklist() {
    var wadah = $("#checklistMitra"); if (!wadah) return;
    var butir = ada(D.kesiapanData, []);
    var cincin = $("#cincinIsi"), angka = $("#cincinAngka"), keliling = 2 * Math.PI * 42;
    if (cincin) { cincin.style.strokeDasharray = keliling; cincin.style.strokeDashoffset = keliling; }
    function gambar() {
      var dicentang = LS.get(CENTANG_KEY, []);
      wadah.innerHTML = butir.map(function (k) {
        var on = dicentang.indexOf(k.id) >= 0;
        return "<div class='centang" + (on ? " aktif" : "") + "' data-c='" + k.id + "' role='checkbox' tabindex='0' aria-checked='" + on + "'>" +
          "<span class='kotak2'>" + (on ? "✓" : "") + "</span><span><b>" + esc(k.label) + "</b><small>Sumber: " + esc(k.sumber) + "</small></span></div>";
      }).join("");
      var persen = butir.length ? Math.round((dicentang.length / butir.length) * 100) : 0;
      if (cincin) cincin.style.strokeDashoffset = keliling * (1 - persen / 100);
      if (angka) angka.textContent = persen + "%";
      var ket = $("#checklistKet");
      if (ket) ket.textContent = dicentang.length + " dari " + butir.length + " butir data mitra telah diperoleh";
    }
    function toggle(id) {
      var list = LS.get(CENTANG_KEY, []), pos = list.indexOf(id);
      if (pos >= 0) list.splice(pos, 1); else list.push(id);
      LS.set(CENTANG_KEY, list); gambar();
    }
    wadah.addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (b) toggle(b.getAttribute("data-c")); });
    wadah.addEventListener("keydown", function (e) {
      if (e.key !== " " && e.key !== "Enter") return;
      var b = e.target.closest("[data-c]"); if (!b) return;
      e.preventDefault(); toggle(b.getAttribute("data-c"));
    });
    $("#checklistEkspor").addEventListener("click", function () {
      var dicentang = LS.get(CENTANG_KEY, []);
      unduhTeks("checklist-data-lobuk.txt",
        "CHECKLIST KELENGKAPAN DATA MITRA\nSistem Informasi Wisata Bahari Desa Lobuk\nKecamatan Bluto, Kabupaten Sumenep\n\n" +
        butir.map(function (k) {
          return (dicentang.indexOf(k.id) >= 0 ? "[x] " : "[ ] ") + k.label + " — sumber: " + k.sumber + "\n    Pertanyaan: " + k.pertanyaan;
        }).join("\n") + "\n\nSudah terverifikasi:\n" + ada(D.dataTerverifikasi, []).map(function (x) { return "- " + x; }).join("\n"));
      notif("Checklist diunduh");
    });
    $("#checklistReset").addEventListener("click", function () {
      var lama = LS.get(CENTANG_KEY, []);
      if (!lama.length) { notif("Checklist memang masih kosong", "info"); return; }
      LS.set(CENTANG_KEY, []); gambar();
      notif("Checklist dikosongkan", "info", { label: "Urungkan", fn: function () { LS.set(CENTANG_KEY, lama); gambar(); notif("Progres dikembalikan"); } });
    });
    gambar();
  }
  function initPertanyaan() {
    var wadah = $("#daftarPertanyaan"); if (!wadah) return;
    var butir = ada(D.kesiapanData, []);
    wadah.innerHTML = butir.map(function (k, i) {
      return "<div class='etap'><span class='etap-n'>" + (i + 1) + "</span><div><b>" + esc(k.label) + "</b><p>“" + esc(k.pertanyaan) + "”</p><span class='chip'>Sumber: " + esc(k.sumber) + "</span></div></div>";
    }).join("");
    $("#salinPertanyaan").addEventListener("click", function () {
      salin("DAFTAR PERTANYAAN UNTUK MITRA\nDesa Lobuk, Kecamatan Bluto, Kabupaten Sumenep\n\n" +
        butir.map(function (k, i) { return (i + 1) + ". " + k.pertanyaan + " (" + k.sumber + ")"; }).join("\n"),
        "Daftar pertanyaan tersalin");
    });
  }
  function initInfoKontak() {
    var wadah = $("#infoKontak"); if (!wadah) return;
    var k = ada(D.kontak, {});
    function baris(ikon, judul, nilai, status) {
      return "<div class='baris-kontak'><i>" + ikon + "</i><div><b>" + esc(judul) + "</b><span>" +
        (nilai ? esc(nilai) : "Belum tersedia — menunggu konfirmasi resmi") + "</span><div style='margin-top:6px'>" + lencana(status) + "</div></div></div>";
    }
    wadah.innerHTML =
      baris("🏛️", "Pengelola", k.pengelola, "siap") +
      baris("📍", "Alamat sekretariat", k.alamat, "siap") +
      baris("📞", "Telepon / WhatsApp", k.whatsapp, k.whatsapp ? "siap" : "tunggu") +
      baris("✉️", "Surel", k.email, k.email ? "siap" : "tunggu") +
      baris("📱", "Media sosial", k.mediaSosial, k.mediaSosial ? "siap" : "tunggu") +
      baris("🕗", "Jam layanan", k.jamLayanan, k.jamLayanan ? "siap" : "tunggu");
  }
  function initTeks() {
    $$("[data-teks]").forEach(function (el) {
      var kunci = el.getAttribute("data-teks").split("."), nilai = D;
      for (var i = 0; i < kunci.length; i++) { nilai = nilai ? nilai[kunci[i]] : null; }
      if (typeof nilai === "string") el.textContent = nilai;
    });
    $$("#tahun").forEach(function (th) { th.textContent = new Date().getFullYear(); });
  }

  /* ---------- Menjalankan modul ---------- */
  function coba(fn) { try { fn(); } catch (e) { /* isolasi kegagalan modul */ } }
  function mulai() {
    coba(pasangHeader);
    coba(pasangPemandangan);
    coba(initTeks); coba(initNavigasi); coba(initRingkasan); coba(initDayaBaris);
    coba(initGaleri); coba(initFasilitas); coba(initPerencana); coba(initStudio);
    coba(initLokasi); coba(initProduk); coba(initKesiapan); coba(initInfoKontak);
    coba(initKontak); coba(initChecklist); coba(initPertanyaan);
    coba(initParallax); coba(initMuncul);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulai);
  else mulai();
})();