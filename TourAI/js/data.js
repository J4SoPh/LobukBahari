/* ============================================================
   LOBUK BAHARI — Berkas konten (bawaan) + pemuatan konten aktif
   SDD 5.1 / KNF-04: konten terpisah dari logika.
   ------------------------------------------------------------
   Bagian akhir berkas ini memuat "LobukStore": pemuat konten
   aktif. Bila admin pernah menyimpan perubahan lewat admin.html,
   salinan itu diterapkan ke LOBUK sebelum main.js/chatbot.js
   membaca, sehingga seluruh halaman otomatis memakai versi baru.
   ============================================================ */
"use strict";

var LOBUK = {

  profil: {
    namaDesa: "Desa Lobuk", kecamatan: "Bluto", kabupaten: "Sumenep", provinsi: "Jawa Timur",
    destinasiUtama: "Pantai Matahari",
    deskripsi: "Desa Lobuk adalah desa pesisir di Kecamatan Bluto, Kabupaten Sumenep, Jawa Timur. Perairannya menyimpan Pantai Matahari — pantai yang dikenal lewat panorama matahari terbit, matahari terbenam, dan jembatan kayunya. Situs ini menjadi pintu informasi tunggal bagi calon wisatawan yang ingin mengenal potensi wisata bahari desa.",
    deskripsiPendek: "Pintu informasi resmi wisata bahari Desa Lobuk, Kecamatan Bluto, Kabupaten Sumenep.",
    status: "siap"
  },

  dayaTarik: [
    { id: "fajar", judul: "Matahari Terbit di Garis Laut", ringkas: "Langit fajar berlapis warna di atas garis laut menjadi daya tarik utama Pantai Matahari.", deskripsi: "Nama Pantai Matahari berangkat dari pertunjukan langitnya. Saat fajar, cakrawala berubah berlapis — dari biru tua, ungu, hingga jingga dan emas — sementara matahari naik perlahan dari garis laut. Siluet perahu nelayan yang berangkat pagi menambah kedalaman pemandangan. Waktu terbaik adalah sebelum matahari terbit hingga sekitar satu jam sesudahnya.", foto: "img/fajar-matahari.svg", kategori: "fajar", status: "siap" },
    { id: "senja", judul: "Senja di Pesisir Lobuk", ringkas: "Matahari terbenam memantulkan warna hangat di permukaan air dan pasir basah.", deskripsi: "Menjelang sore, cahaya melunak dan langit pesisir kembali berlapis warna. Pasir yang basah memantulkan gradasi jingga, menciptakan bidang cermin alami bagi fotografer. Suasana sore di pesisir cenderung tenang, cocok untuk berjalan santai maupun duduk menikmati pergantian hari.", foto: "img/senja-pesisir.svg", kategori: "senja", status: "siap" },
    { id: "jembatan", judul: "Jembatan Kayu", ringkas: "Jembatan kayu menjadi penanda visual Pantai Matahari dan titik pandang ke arah laut.", deskripsi: "Struktur jembatan kayu adalah salah satu elemen yang paling dikenali dari Pantai Matahari. Garis papannya mengarah ke laut sehingga menjadi komposisi alami untuk foto, sekaligus titik pandang untuk menikmati fajar maupun senja. Kondisi dan akses jembatan sebaiknya dikonfirmasi kepada pengelola sebelum berkunjung.", foto: "img/jembatan-kayu.svg", kategori: "struktur", status: "siap" },
    { id: "nelayan", judul: "Denyut Kehidupan Nelayan", ringkas: "Perahu, jaring, dan aktivitas pagi warga pesisir adalah wajah keseharian Desa Lobuk.", deskripsi: "Wisata bahari Desa Lobuk tidak hanya soal panorama. Kehidupan warga pesisir — perahu yang berangkat dini hari, jaring yang dijemur, dan hasil laut yang diolah di halaman rumah — merupakan daya tarik budaya yang autentik. Menghormati ritme kerja warga dan meminta izin sebelum memotret adalah etika dasar berkunjung.", foto: "img/perahu-nelayan.svg", kategori: "kehidupan", status: "siap" }
  ],

  fasilitas: [
    { nama: "Area Parkir", ikon: "🅿️", keterangan: "Keberadaan, lokasi, dan tarif parkir menunggu konfirmasi pengelola.", status: "tunggu" },
    { nama: "Toilet & Kamar Bilas", ikon: "🚿", keterangan: "Jumlah unit, kondisi, dan biaya penggunaan belum terdata.", status: "tunggu" },
    { nama: "Warung Makan", ikon: "🍚", keterangan: "Daftar warung, menu, dan jam buka menunggu pendataan bersama desa.", status: "tunggu" },
    { nama: "Musala", ikon: "🕌", keterangan: "Lokasi musala terdekat dari area pantai belum dikonfirmasi.", status: "tunggu" },
    { nama: "Gazebo & Tempat Duduk", ikon: "⛱️", keterangan: "Ketersediaan tempat berteduh di area pantai belum terdata.", status: "tunggu" },
    { nama: "Area Berkemah", ikon: "⛺", keterangan: "Izin dan ketersediaan area berkemah perlu konfirmasi pengelola.", status: "tunggu" },
    { nama: "Penyewaan Peralatan", ikon: "🎣", keterangan: "Jenis peralatan yang dapat disewa dan tarifnya belum tersedia.", status: "tunggu" },
    { nama: "Pos Informasi & Keamanan", ikon: "ℹ️", keterangan: "Keberadaan pos pengelola dan petugas keselamatan belum dikonfirmasi.", status: "tunggu" }
  ],

  aktivitas: [
    { id: "terbit", nama: "Menikmati matahari terbit", ikon: "🌅", durasi: 1.5, jendela: [{ awal: 300, akhir: 420 }], waktu: "05.00–07.00", keterangan: "Datang sebelum fajar untuk melihat langit berlapis warna.", status: "umum" },
    { id: "jembatan", nama: "Menyusuri jembatan kayu", ikon: "🌉", durasi: 1, jendela: [{ awal: 300, akhir: 1080 }], waktu: "05.00–18.00", keterangan: "Periksa kondisi papan dan pagar sebelum menaiki jembatan.", status: "umum" },
    { id: "foto", nama: "Fotografi lanskap", ikon: "📷", durasi: 2, jendela: [{ awal: 300, akhir: 450 }, { awal: 960, akhir: 1110 }], waktu: "05.00–07.30 & 16.00–18.30", keterangan: "Cahaya terbaik saat golden hour pagi dan sore.", status: "umum" },
    { id: "jalan", nama: "Berjalan di tepi pantai", ikon: "👣", durasi: 1, jendela: [{ awal: 360, akhir: 1080 }], waktu: "06.00–18.00", keterangan: "Gunakan alas kaki nyaman; hindari area berkarang licin.", status: "umum" },
    { id: "mancing", nama: "Memancing", ikon: "🎣", durasi: 2, jendela: [{ awal: 360, akhir: 900 }], waktu: "06.00–15.00", keterangan: "Spot dan aturan setempat mohon dikonfirmasi ke pengelola.", status: "umum" },
    { id: "amati", nama: "Mengamati aktivitas nelayan", ikon: "⛵", durasi: 1, jendela: [{ awal: 300, akhir: 540 }], waktu: "05.00–09.00", keterangan: "Minta izin sebelum memotret atau mendekat ke perahu.", status: "umum" },
    { id: "terbenam", nama: "Menikmati matahari terbenam", ikon: "🌇", durasi: 1.5, jendela: [{ awal: 960, akhir: 1110 }], waktu: "16.00–18.30", keterangan: "Pasir basah memantulkan warna langit menjelang petang.", status: "umum" },
    { id: "kuliner", nama: "Menikmati kuliner pesisir", ikon: "🍤", durasi: 1, jendela: [{ awal: 660, akhir: 1140 }], waktu: "11.00–19.00", keterangan: "Ketersediaan warung di sekitar pantai belum terdata.", status: "umum" }
  ],

  lokasi: {
    alamat: "Desa Lobuk, Kecamatan Bluto, Kabupaten Sumenep, Jawa Timur",
    embedApiDasar: "https://www.google.com/maps/embed/v1/",
    petaKlasikDasar: "https://maps.google.com/maps",
    petaLuarDasar: "https://maps.google.com/maps",
    kunciApi: "", koordinat: null, zoomAwal: 16, tinggiAwal: 520, jenisAwal: "satelit", sumberAwal: "api",
    jenisPeta: [
      { kode: "satelit", nama: "Satelit", ikon: "🛰️", api: true, klasik: "k", embed: "satellite" },
      { kode: "hybrid", nama: "Satelit + label", ikon: "🏷️", api: false, klasik: "h", embed: "satellite" },
      { kode: "peta", nama: "Peta jalan", ikon: "🗺️", api: true, klasik: "m", embed: "roadmap" },
      { kode: "terrain", nama: "Terrain", ikon: "⛰️", api: false, klasik: "p", embed: "roadmap" }
    ],
    skema: "img/peta-skema.svg",
    titik: [
      { id: "desa", nama: "Desa Lobuk", kueri: "Desa Lobuk, Bluto, Sumenep, Jawa Timur", zoom: 16, detail: "Wilayah desa pesisir lokasi Pantai Matahari. Citra satelit menampilkan garis pantai dan permukiman warga.", status: "siap" },
      { id: "pantai", nama: "Pantai Matahari", kueri: "Pantai Matahari Lobuk Bluto Sumenep", zoom: 17, detail: "Pencarian nama destinasi pada citra satelit. Titik koordinat resmi belum tersedia dari mitra; masukkan koordinat resmi bila sudah diperoleh.", status: "tunggu" },
      { id: "kec", nama: "Kecamatan Bluto", kueri: "Kecamatan Bluto, Sumenep, Jawa Timur", zoom: 13, detail: "Kecamatan pesisir di Kabupaten Sumenep yang menaungi Desa Lobuk.", status: "siap" },
      { id: "kab", nama: "Kabupaten Sumenep", kueri: "Kabupaten Sumenep, Jawa Timur", zoom: 10, detail: "Wilayah administratif di ujung timur Pulau Madura tempat Desa Lobuk berada.", status: "siap" }
    ],
    petunjukAkses: [
      { tahap: "Menuju Pulau Madura", detail: "Dari Surabaya, penyeberangan umum melalui Jembatan Suramadu menuju Bangkalan.", status: "umum" },
      { tahap: "Lintas Madura ke Sumenep", detail: "Melanjutkan perjalanan darat melintasi Bangkalan, Sampang, dan Pamekasan menuju Kabupaten Sumenep.", status: "umum" },
      { tahap: "Menuju Kecamatan Bluto", detail: "Dari pusat Kabupaten Sumenep menuju Kecamatan Bluto yang berada di wilayah pesisir selatan.", status: "umum" },
      { tahap: "Menuju Desa Lobuk & Pantai Matahari", detail: "Rute detail, kondisi jalan, waktu tempuh, dan biaya perjalanan menunggu data resmi Pemerintah Desa Lobuk.", status: "tunggu" }
    ]
  },

  produkLokal: [
    { nama: "Hasil Laut Segar", ikon: "🐟", deskripsi: "Tangkapan nelayan pesisir seperti ikan pelagis dan hasil laut lain yang dijual segar di sekitar desa.", status: "umum" },
    { nama: "Ikan Kering & Asin", ikon: "🧂", deskripsi: "Pengolahan tradisional dengan penjemuran matahari — cara awet yang umum di kampung nelayan Madura.", status: "umum" },
    { nama: "Olahan Hasil Laut", ikon: "🍘", deskripsi: "Produk turunan seperti kerupuk ikan, petis, atau olahan bernilai tambah dari dapur rumah tangga.", status: "umum" },
    { nama: "Kerajinan Bahan Alami", ikon: "🐚", deskripsi: "Pemanfaatan bahan pesisir menjadi cendera mata oleh kelompok usaha warga.", status: "umum" },
    { nama: "Kuliner Pesisir", ikon: "🍢", deskripsi: "Hidangan berbahan hasil laut yang diolah warung dan dapur warga untuk pengunjung.", status: "umum" }
  ],
  catatanProduk: "Daftar produk, nama pelaku usaha, harga, dan foto resmi belum tersedia. Uraian di atas adalah gambaran umum potensi ekonomi masyarakat pesisir, bukan daftar produk terverifikasi Desa Lobuk.",

  kontak: {
    pengelola: "Pengelola Pantai Matahari & Pemerintah Desa Lobuk",
    telepon: null, whatsapp: null, email: null, mediaSosial: null, jamLayanan: null,
    alamat: "Kantor Desa Lobuk, Kecamatan Bluto, Kabupaten Sumenep, Jawa Timur",
    catatan: "Kontak resmi belum tersedia. Sesuai SDD, kolom ini tidak diisi dengan dugaan. Silakan gunakan penyusun pesan di halaman ini untuk menyiapkan pertanyaan, lalu sampaikan melalui kanal resmi desa."
  },

  galeri: [
    { file: "img/desa_lobuk.jpg", keterangan: "Pantai di Desa Lobuk", kategori: "Pantai", sumber: "https://dolandolen.com/label/desa-lobuk" },
    { file: "img/sunset1.png", keterangan: "Sunset di Pantai Matahari", kategori: "Sunset", sumber: "https://suaraindonesia.co.id/news/wisata/63df0dac2686a/pesona-sunset-di-pantai-matahari-lobuk-cikal-bakal-wisata-spot-pancing-pertama-di-sumenep" },
    { file: "img/pantai_matahari.png", keterangan: "Pantai Matahari", kategori: "Pantai", sumber: "https://www.its.ac.id/stkk/desa-lobuk-coba/" },
    { file: "img/dermaga-senja.svg", keterangan: "Siluet dermaga saat senja", kategori: "senja", sumber: "ilustrasi" },
    { file: "img/senja-pesisir.svg", keterangan: "Matahari terbenam di pesisir Lobuk", kategori: "senja", sumber: "ilustrasi" },
    { file: "img/perahu-nelayan.svg", keterangan: "Perahu nelayan di tepi pantai", kategori: "kehidupan", sumber: "ilustrasi" },
    { file: "img/pasir-karang.svg", keterangan: "Pasir dan formasi karang", kategori: "pantai", sumber: "ilustrasi" },
    { file: "img/laut-teduh.svg", keterangan: "Laut teduh pada siang hari", kategori: "pantai", sumber: "ilustrasi" }
  ],
  catatanGaleri: "Foto asli destinasi belum tersedia dari mitra (SDD Lampiran A). Galeri sementara menampilkan ilustrasi suasana yang dibuat khusus untuk prototipe ini. Setiap foto asli yang diterima cukup diletakkan di folder img/ lalu didaftarkan pada bagian galeri melalui panel admin.",

  kesiapanData: [
    { id: "foto", label: "Foto destinasi & izin penggunaan", sumber: "Pengelola Pantai Matahari", pertanyaan: "Bolehkah kami menerima foto Pantai Matahari beserta izin penggunaannya untuk website promosi desa?" },
    { id: "jam", label: "Jam operasional", sumber: "Pengelola", pertanyaan: "Pukul berapa area Pantai Matahari buka dan tutup, dan apakah ada hari tertentu tutup?" },
    { id: "tarif", label: "Tarif tiket & parkir", sumber: "Pengelola", pertanyaan: "Berapa tarif masuk dan parkir resmi, serta apakah ada tarif berbeda untuk rombongan atau anak-anak?" },
    { id: "fasilitas", label: "Daftar fasilitas yang benar-benar ada", sumber: "Pengelola", pertanyaan: "Fasilitas apa saja yang benar-benar tersedia di area pantai beserta kondisinya saat ini?" },
    { id: "kontak", label: "Kontak resmi (telepon, WhatsApp, media sosial)", sumber: "Pemdes Lobuk & Pengelola", pertanyaan: "Nomor dan kanal resmi mana yang boleh kami tampilkan untuk calon wisatawan?" },
    { id: "akses", label: "Petunjuk akses & titik peta", sumber: "Pemerintah Desa Lobuk", pertanyaan: "Bagaimana rute menuju lokasi, kondisi jalan, dan titik koordinat resmi Pantai Matahari?" },
    { id: "produk", label: "Daftar produk lokal & pelaku usaha", sumber: "Pemdes Lobuk & Pelaku Usaha", pertanyaan: "Produk lokal apa saja yang dapat dipromosikan, dan siapa pelaku usaha yang bersedia dicantumkan?" }
  ],
  dataTerverifikasi: [
    "Identitas wilayah: Desa Lobuk, Kecamatan Bluto, Kabupaten Sumenep",
    "Nama destinasi utama: Pantai Matahari",
    "Daya tarik umum: matahari terbit, matahari terbenam, jembatan kayu"
  ],

  slangKamus: {
    "gmn": "bagaimana", "gimana": "bagaimana", "bagaiman": "bagaimana", "gimana ya": "bagaimana",
    "dmn": "di mana", "dimana": "di mana", "dimanakah": "di mana", "dimna": "di mana", "dmana": "di mana",
    "brp": "berapa", "brapa": "berapa", "brpa": "berapa", "berapaa": "berapa", "berpa": "berapa",
    "kpn": "kapan", "kesana": "ke sana", "ksana": "ke sana", "kesini": "ke sini",
    "ga": "tidak", "gak": "tidak", "gk": "tidak", "nggak": "tidak", "ngga": "tidak", "enggak": "tidak", "tdk": "tidak",
    "bgt": "sangat", "banget": "sangat", "pengen": "ingin", "pingin": "ingin", "pgn": "ingin",
    "liat": "lihat", "liaat": "lihat", "tmpt": "tempat", "tmpat": "tempat", "jl": "jalan", "jln": "jalan",
    "no": "nomor", "nomer": "nomor", "nmr": "nomor",
    "telp": "telepon", "tlp": "telepon", "telpon": "telepon", "telfon": "telepon",
    "wa": "whatsapp", "wassap": "whatsapp", "wasap": "whatsapp", "whatsap": "whatsapp", "watsap": "whatsapp", "watshap": "whatsapp",
    "snorkling": "snorkeling", "snorkel": "snorkeling", "snorkelling": "snorkeling", "snorkelin": "snorkeling",
    "sunrice": "sunrise", "sunrize": "sunrise", "senset": "sunset", "sunshet": "sunset",
    "makasi": "makasih", "makasihh": "makasih", "terimakasih": "terima kasih", "trimakasih": "terima kasih",
    "tq": "terima kasih", "ty": "terima kasih", "nginap": "menginap", "nginep": "menginap",
    "hrg": "harga", "hrga": "harga", "tkt": "tiket", "bs": "bisa", "bsa": "bisa", "byk": "banyak", "bnyk": "banyak",
    "org": "orang", "orng": "orang", "ank": "anak", "pake": "pakai", "pk": "pakai", "cm": "cuma", "cuman": "cuma",
    "sd": "sudah", "sdh": "sudah", "udah": "sudah", "udh": "sudah", "blm": "belum",
    "utk": "untuk", "untk": "untuk", "dgn": "dengan", "dg": "dengan",
    "sy": "saya", "sya": "saya", "aku": "saya", "km": "kamu", "kmu": "kamu",
    "jg": "juga", "jga": "juga", "aja": "saja", "pls": "tolong", "plz": "tolong",
    "inpo": "informasi", "info": "informasi", "ok": "oke", "okelah": "oke",
    "jalan2": "jalan jalan", "foto2": "foto", "makan2": "makan"
  },

  kataKunciDirapikan: [
    { kata: "wa", alasan: "Dua huruf; sebagai substring cocok pada waktu, bawah, jawab, tawa.", pengganti: "whatsapp · nomor wa · no wa (frasa) + kamus slang wa→whatsapp" },
    { kata: "hi", alasan: "Sebagai substring cocok pada lihat, hitam, lebih, hilang.", pengganti: "halo · hai · hei · hey (dicocokkan per kata utuh)" },
    { kata: "api", alasan: "Bermakna ganda (api/unggun) dan substring pada apik.", pengganti: "kunci api · api key · embed api · maps api (frasa)" },
    { kata: "data", alasan: "Sebagai substring cocok pada datang; terlalu umum.", pengganti: "status data · data resmi · data lengkap (frasa)" },
    { kata: "jam", alasan: "Substring pada jamu, jamah, jambu; bermakna ganda.", pengganti: "jam buka · jam berapa · jam operasional (frasa)" },
    { kata: "buka", alasan: "Substring pada bukaan; terlalu umum di banyak kalimat.", pengganti: "jam buka · sudah buka · kapan buka (frasa)" },
    { kata: "tutup", alasan: "Terlalu umum tanpa konteks waktu.", pengganti: "jam tutup · tutup jam (frasa)" },
    { kata: "ikan", alasan: "Substring pada perikanan, pelikan; terlalu umum.", pengganti: "ikan asin · ikan kering · hasil laut · spot mancing (frasa)" },
    { kata: "masuk", alasan: "Terlalu umum; bukan penanda tarif yang kuat.", pengganti: "tiket masuk · harga masuk · biaya masuk (frasa)" },
    { kata: "main", alasan: "Substring pada mainan; terlalu umum.", pengganti: "main apa · tempat main · bisa ngapain (frasa)" },
    { kata: "desa", alasan: "Substring pada desain; terlalu umum.", pengganti: "profil desa · desa lobuk · tentang desa (frasa)" },
    { kata: "belum", alasan: "Muncul pada hampir semua kalimat penyangkalan.", pengganti: "belum lengkap · belum tersedia (frasa)" },
    { kata: "resmi", alasan: "Kata sifat umum, bukan penanda topik.", pengganti: "data resmi · kontak resmi (frasa)" },
    { kata: "status", alasan: "Terlalu umum tanpa kata pendamping.", pengganti: "status data (frasa)" },
    { kata: "pagi / siang / sore / malam", alasan: "Kata waktu umum memicu sapaan palsu pada kalimat lain.", pengganti: "selamat pagi · selamat siang · selamat sore · selamat malam (frasa)" },
    { kata: "bisa apa", alasan: "Bertabrakan dengan intent aktivitas.", pengganti: "dipindah ke intent bantuan; aktivitas memakai bisa ngapain" }
  ],

  jawabanFallback: "<p>Maaf, saya belum memahami pertanyaan itu. 🙏</p><p>Coba tanyakan dengan kata lain, misalnya <b>“di mana letak pantainya”</b>, <b>“jam buka pantai”</b>, <b>“ada toilet tidak”</b>, atau <b>“nomor pengelola”</b>. Anda juga bisa memilih topik di bawah ini.</p><div class='kotak-info'>Chatbot ini mencocokkan <b>kata utuh</b>, bukan potongan huruf, dan belum memahami konteks percakapan sebelumnya. Untuk hal resmi yang belum terdata, silakan hubungi pengelola.</div>",

  saranCepat: ["Lokasi pantai", "Daya tarik", "Jam buka", "Harga tiket", "Fasilitas", "Aktivitas", "Oleh-oleh", "Kontak pengelola"],

  chatbotIntents: [
    { id: "lokasi", topik: "Lokasi & alamat", priority: 1, ringkas: "Letak administratif Pantai Matahari dan cara membuka peta.",
      keywords: ["lokasi","alamat","letak","letaknya","posisi","posisinya","koordinat","titik","titik lokasi","wilayah","daerah","daerah mana","sebelah mana","di mana","dimana","di kecamatan mana","lokasi pantai","alamat pantai","letak pantai","posisi pantai","dimana letaknya","dimana lokasinya","pantainya di mana","pantai di mana","desa lobuk","lobuk","bluto","sumenep","madura","peta","maps","map","google maps","share loc","shareloc","share location","bagi lokasi","tempat pantai","pantai mana"],
      reply: "<p>📍 <b>Pantai Matahari</b> berada di <b>Desa Lobuk, Kecamatan Bluto, Kabupaten Sumenep, Jawa Timur</b>.</p><div class='kotak-info'>Titik koordinat resmi pantai belum tersedia dari mitra. Halaman Lokasi menampilkan citra satelit berdasarkan nama wilayah, dan menyediakan kolom koordinat bila data resmi sudah diperoleh.</div><a class='tautan-chip' href='lokasi.html'>🛰️ Buka peta satelit</a><a class='tautan-chip' href='lokasi.html'>🧭 Etape perjalanan</a>",
      saran: ["Cara ke sana", "Peta satelit", "Profil Desa Lobuk"] },
    { id: "akses", topik: "Akses & perjalanan", priority: 2, ringkas: "Gambaran rute lintas Madura menuju Desa Lobuk.",
      keywords: ["akses","rute","jalur","arah","menuju","ke sana","cara ke","cara ke sana","cara menuju","cara sampai","rute ke","arah ke","petunjuk jalan","petunjuk akses","navigasi","gps","transport","transportasi","angkutan","kendaraan","perjalanan","jalan","jalanan","kondisi jalan","jarak","tempuh","waktu tempuh","berapa jam","berapa lama","berapa jauh","naik apa","naik bus","bus","travel","mobil","motor","kapal","perahu","speedboat","dermaga","pelabuhan","suramadu","surabaya","dari surabaya","dari sumenep","sampai sana","nyampe"],
      reply: "<p>🧭 Gambaran umum perjalanan menuju Desa Lobuk:</p><ul><li>Surabaya → <b>Jembatan Suramadu</b> → Bangkalan</li><li>Lintas Madura: Bangkalan → Sampang → Pamekasan → <b>Kabupaten Sumenep</b></li><li>Pusat Sumenep → <b>Kecamatan Bluto</b> (wilayah pesisir selatan)</li><li>Bluto → <b>Desa Lobuk</b> → Pantai Matahari</li></ul><div class='kotak-info'>Rute detail, kondisi jalan terkini, waktu tempuh, dan biaya <b>menunggu data resmi Pemerintah Desa Lobuk</b> — tidak kami isi dengan perkiraan.</div><a class='tautan-chip' href='lokasi.html'>🧭 Buka etape & peta</a>",
      saran: ["Lokasi pantai", "Kontak pengelola", "Susun jadwal kunjungan"] },
    { id: "dayaTarik", topik: "Daya tarik pantai", priority: 3, ringkas: "Fajar, senja, jembatan kayu, dan kehidupan nelayan.",
      keywords: ["daya tarik","menarik","pemandangan","pemandangannya","panorama","view","indah","cantik","bagus","keindahan","pesona","sunrise","matahari terbit","terbit","fajar","subuh","sunset","matahari terbenam","terbenam","senja","jam sunrise","jam sunset","sunrise jam","sunset jam","jam berapa sunrise","jam berapa sunset","jembatan","jembatan kayu","karang","pasir","pantai","laut","pesisir","pantai matahari","spot foto","spot","instagramable","estetik","worth it","layak","recommended","rekomendasi pantai","apa yang bagus","kehidupan nelayan","bagus tidak"],
      reply: "<p>🌅 Daya tarik utama <b>Pantai Matahari</b>:</p><ul><li><b>Matahari terbit</b> — langit berlapis warna di atas garis laut, sekitar 05.00–07.00</li><li><b>Matahari terbenam</b> — pantulan jingga di pasir basah, sekitar 16.00–18.30</li><li><b>Jembatan kayu</b> — penanda visual dan titik pandang ke laut</li><li><b>Kehidupan nelayan</b> — perahu berangkat dini hari, jaring dijemur, hasil laut diolah di halaman rumah</li></ul><div class='kotak-info'>Jendela waktu di atas adalah waktu cahaya terbaik, bukan jam operasional resmi.</div><a class='tautan-chip' href='tentang.html'>📖 Tentang wisata</a><a class='tautan-chip' href='galeri.html'>🖼️ Galeri suasana</a>",
      saran: ["Waktu terbaik berkunjung", "Aktivitas", "Galeri foto"] },
    { id: "fasilitas", topik: "Fasilitas pengunjung", priority: 4, ringkas: "Daftar fasilitas yang masih perlu diverifikasi bersama pengelola.",
      keywords: ["fasilitas","fasilitasnya","fasilitas apa","apa saja fasilitasnya","toilet","wc","kamar mandi","kamar bilas","bilas","parkir","parkiran","warung","warung makan","jajan","musala","mushola","musholla","masjid","tempat sholat","sholat","gazebo","saung","bangku","tempat duduk","berteduh","sewa","penyewaan","sewa alat","sewa perahu","pelampung","life jacket","pos","pos informasi","listrik","colokan","charger","sinyal","signal","internet","wifi","air bersih","air tawar","tenda","camping","berkemah","area camping","ada toilet","ada warung","ada parkir","ada musala"],
      reply: "<p>⛱️ Fasilitas yang <b>sedang diverifikasi</b> bersama pengelola: area parkir, toilet & kamar bilas, warung makan, musala, gazebo, area berkemah, penyewaan peralatan, serta pos informasi.</p><div class='kotak-info'>Sesuai prinsip sistem ini, kami <b>tidak menyatakan fasilitas sudah tersedia</b> sebelum ada konfirmasi resmi. Setiap butir ditampilkan dengan status “menunggu mitra”.</div><a class='tautan-chip' href='fasilitas.html'>⛱️ Status fasilitas</a><a class='tautan-chip' href='kontak.html'>📞 Tanyakan ke pengelola</a>",
      saran: ["Penginapan", "Harga tiket", "Kontak pengelola"] },
    { id: "penginapan", topik: "Penginapan", priority: 5, ringkas: "Pilihan menginap di sekitar desa dan status datanya.",
      keywords: ["penginapan","homestay","home stay","hotel","losmen","villa","resort","menginap","inap","bermalam","semalam","dua malam","menginap di mana","stay","staycation","kamar","sewa kamar","booking kamar","pesan kamar","pondokan","tempat menginap","bisa menginap"],
      reply: "<p>🏠 Untuk menginap, pilihan yang umum di desa pesisir adalah <b>homestay warga</b>, losmen, atau penginapan kecil di sekitar Kecamatan Bluto.</p><div class='kotak-info'>Daftar penginapan, tarif, dan kontak pemilik di Desa Lobuk <b>belum terdata</b>. Kami tidak menampilkan angka perkiraan. Untuk fajar, banyak wisatawan memilih berangkat subuh dari Sumenep daripada menginap.</div><a class='tautan-chip' href='kontak.html'>📞 Tanyakan penginapan</a><a class='tautan-chip' href='fasilitas.html'>⛱️ Lihat fasilitas</a>",
      saran: ["Waktu terbaik berkunjung", "Harga tiket", "Susun jadwal kunjungan"] },
    { id: "aktivitas", topik: "Aktivitas & rencana", priority: 6, ringkas: "Kegiatan wisata dan penyusun jadwal kunjungan.",
      keywords: ["aktivitas","kegiatan","kegiatannya","kegiatan apa","ngapain","ngapain saja","bisa ngapain","main apa","tempat main","bisa main","melakukan","acara","susun acara","rencana","itinerary","jadwal","jadwal kunjungan","susun jadwal","susun rencana","sehari","setengah hari","satu hari","dua hari","2 hari","3 hari","berenang","renang","main air","bermain pasir","main pasir","snorkeling","menyelam","diving","fotografi","berfoto","foto foto","jalan jalan","jalan santai","trekking","bersantai","santai","healing","piknik","keluarga","anak","romantis","pasangan","wisata apa"],
      reply: "<p>🎯 Kegiatan yang dapat dilakukan di Pantai Matahari:</p><ul><li>Menikmati <b>matahari terbit</b> (05.00–07.00) dan <b>terbenam</b> (16.00–18.30)</li><li>Menyusuri <b>jembatan kayu</b> dan berjalan di tepi pantai</li><li><b>Fotografi lanskap</b> saat golden hour</li><li><b>Memancing</b> serta mengamati aktivitas nelayan</li><li>Bermain pasir bersama keluarga dan menikmati kuliner pesisir</li></ul><div class='kotak-info'>Perencana kunjungan menyusun jadwal otomatis mengikuti jendela waktu tiap kegiatan, lalu dapat <b>diekspor sebagai tabel PNG/JPG</b>.</div><a class='tautan-chip' href='fasilitas.html#perencana'>🧭 Susun jadwal</a><a class='tautan-chip' href='fasilitas.html#studio'>🖼️ Studio ekspor</a>",
      saran: ["Memancing", "Waktu terbaik berkunjung", "Ekspor jadwal"] },
    { id: "memancing", topik: "Memancing", priority: 7, ringkas: "Memancing di area pesisir dan hal yang perlu dikonfirmasi.",
      keywords: ["mancing","memancing","pancing","spot mancing","spot pancing","tempat mancing","mancing mania","alat pancing","joran","umpan","boleh mancing","izin mancing","mancing di pantai","memancing di","hasil mancing"],
      reply: "<p>🎣 Memancing adalah kegiatan yang umum dilakukan di area pesisir seperti Desa Lobuk, biasanya <b>pagi hingga siang</b> saat angin belum kencang.</p><div class='kotak-info'>Spot yang diizinkan, aturan setempat, dan ketersediaan alat sewa <b>belum terdata</b>. Mohon konfirmasi kepada pengelola sebelum memancing, dan hindari area karang yang licin.</div><a class='tautan-chip' href='fasilitas.html'>🎯 Lihat aktivitas lain</a><a class='tautan-chip' href='kontak.html'>📞 Tanyakan spot</a>",
      saran: ["Keselamatan", "Waktu terbaik berkunjung", "Fasilitas"] },
    { id: "jamBuka", topik: "Jam operasional", priority: 8, ringkas: "Jam buka resmi belum tersedia; jendela cahaya bukan jam buka.",
      keywords: ["jam buka","jam berapa","jam operasional","operasional","buka jam","tutup jam","jam tutup","buka kapan","kapan buka","sudah buka","belum buka","mulai buka","buka 24 jam","24 jam","buka setiap hari","hari libur buka","jadwal buka","jam kunjungan","jam masuk","jam pelayanan","jam berapa buka","buka sampai jam"],
      reply: "<p>🕗 <b>Jam operasional resmi Pantai Matahari belum tersedia.</b></p><div class='kotak-info'>Data ini termasuk yang menunggu konfirmasi pengelola (SDD Lampiran A), sehingga tidak kami isi dengan perkiraan. Perlu dibedakan: <b>jendela waktu terbaik</b> (fajar 05.00–07.00, senja 16.00–18.30) adalah waktu cahaya, <b>bukan</b> jam buka resmi.</div><a class='tautan-chip' href='kontak.html'>📞 Tanyakan jam buka</a><a class='tautan-chip' href='fasilitas.html'>🕐 Jendela waktu kegiatan</a>",
      saran: ["Waktu terbaik berkunjung", "Harga tiket", "Kontak pengelola"] },
    { id: "tiket", topik: "Tiket & biaya", priority: 9, ringkas: "Tarif resmi belum tersedia; tidak ditampilkan sebagai dugaan.",
      keywords: ["tiket","karcis","harga","harganya","tarif","tarifnya","biaya","biayanya","bayar","tiket masuk","harga masuk","biaya masuk","harga tiket","harga tiket masuk","biaya parkir","tarif parkir","masuk berapa","berapa rupiah","berapa duit","duit","gratis","murah","mahal","budget","anggaran","ongkos","rp"],
      reply: "<p>🎫 <b>Tarif tiket masuk dan parkir belum tersedia.</b></p><div class='kotak-info'>Kami sengaja tidak menampilkan angka perkiraan agar tidak menyesatkan wisatawan. Tarif resmi akan ditampilkan setelah diperoleh dari pengelola Pantai Matahari. Halaman Kontak menyediakan penyusun pesan untuk menanyakannya.</div><a class='tautan-chip' href='kontak.html'>📞 Tanyakan tarif resmi</a><a class='tautan-chip' href='kontak.html#checklist'>📋 Checklist data mitra</a>",
      saran: ["Jam buka", "Fasilitas", "Kontak pengelola"] },
    { id: "waktuTerbaik", topik: "Waktu terbaik", priority: 10, ringkas: "Musim, cuaca, dan jam kunjungan yang disarankan.",
      keywords: ["waktu terbaik","kapan terbaik","kapan bagus","terbaik kapan","musim","musim hujan","musim kemarau","musim apa","cuaca","hujan","panas","cerah","berawan","angin","ombak","pasang","surut","pasang surut","bulan apa","bulan berapa","kapan ke sana","kapan datang","datang kapan","pagi atau sore","sore atau pagi","ramai","sepi","ramai pengunjung","akhir pekan","weekend","liburan","kapan sebaiknya"],
      reply: "<p>🗓️ <b>Waktu terbaik berkunjung:</b> umumnya <b>April–Oktober</b> (musim kemarau) saat langit bersih dan laut lebih tenang. November–Maret tetap bisa, namun cek cuaca lebih dulu.</p><ul><li><b>Fajar 05.00–07.00</b> — matahari terbit, perahu nelayan berangkat</li><li><b>Siang</b> — bermain pasir, kuliner, memancing</li><li><b>Senja 16.00–18.30</b> — golden hour di jembatan kayu dan karang</li></ul><div class='kotak-info'>Ini gambaran umum pesisir, bukan prakiraan cuaca resmi. Selalu periksa cuaca sebelum berangkat.</div><a class='tautan-chip' href='fasilitas.html#perencana'>🧭 Susun jadwal</a><a class='tautan-chip' href='tentang.html'>📖 Daya tarik</a>",
      saran: ["Daya tarik", "Keselamatan", "Susun jadwal kunjungan"] },
    { id: "produkLokal", topik: "Produk lokal", priority: 11, ringkas: "Potensi ekonomi warga dan gambaran produk pesisir.",
      keywords: ["produk","produk lokal","oleh oleh","buah tangan","souvenir","suvenir","cendera mata","umkm","usaha warga","ekonomi","ekonomi warga","kuliner","makanan","jajanan","ikan asin","ikan kering","hasil laut","kerupuk","kerupuk ikan","petis","dodol","rumput laut","kerajinan","kerang","batik","vco","minyak kelapa","belanja","beli apa","bawa pulang","jual apa","dagangan","warung warga"],
      reply: "<p>🧺 Potensi ekonomi masyarakat pesisir Lobuk umumnya meliputi <b>hasil laut segar</b>, <b>ikan kering/asin</b>, <b>olahan hasil laut</b> (kerupuk ikan, petis), <b>kerajinan bahan alami</b>, dan <b>kuliner pesisir</b>.</p><div class='kotak-info'>Daftar produk, nama pelaku usaha, harga, dan foto resmi <b>belum tersedia</b>. Uraian tersebut gambaran umum potensi pesisir, bukan daftar terverifikasi Desa Lobuk.</div><a class='tautan-chip' href='produk.html'>🧺 Buka Produk Lokal</a>",
      saran: ["Fasilitas", "Profil Desa Lobuk", "Kontak pengelola"] },
    { id: "kontak", topik: "Kontak pengelola", priority: 12, ringkas: "Kanal resmi belum tersedia; tersedia penyusun pesan.",
      keywords: ["kontak","hubungi","menghubungi","bisa dihubungi","telepon","nomor","no hp","nomor hp","hp","whatsapp","nomor whatsapp","nomor wa","no wa","chat pengelola","pengelola","pokdarwis","pemdes","pemerintah desa","kantor desa","sekretariat","email","surel","gmail","instagram","ig","facebook","fb","media sosial","sosmed","admin","petugas","pemandu","guide","pemandu wisata","kontak resmi","nomor pengelola","minta nomor"],
      reply: "<p>📞 Pengelola: <b>Pengelola Pantai Matahari &amp; Pemerintah Desa Lobuk</b>, Kecamatan Bluto, Kabupaten Sumenep.</p><div class='kotak-info'>Nomor telepon, WhatsApp, surel, dan media sosial resmi <b>belum tersedia</b> dan tidak kami isi dengan dugaan. Halaman Kontak menyediakan <b>penyusun pesan</b> agar pertanyaan Anda rapi dan siap disampaikan melalui kanal resmi desa.</div><a class='tautan-chip' href='kontak.html'>📞 Buka halaman Kontak</a><a class='tautan-chip' href='kontak.html#checklist'>📋 Checklist data</a>",
      saran: ["Harga tiket", "Jam buka", "Akses ke lokasi"] },
    { id: "galeri", topik: "Galeri", priority: 13, ringkas: "Ilustrasi suasana destinasi; foto asli menunggu mitra.",
      keywords: ["galeri","gallery","foto","gambar","potret","dokumentasi","album","kumpulan foto","lihat foto","minta foto","foto pantai","gambar pantai","foto asli","ilustrasi","unggah","upload","kirim foto"],
      reply: "<p>🖼️ Galeri menampilkan <b>ilustrasi suasana</b> Pantai Matahari: fajar, gradasi langit, jembatan kayu, dermaga senja, perahu nelayan, pasir berkarang, dan laut teduh.</p><div class='kotak-info'>Foto asli destinasi menunggu dari mitra. Setiap gambar dapat dibuka besar, ditelusuri dengan tombol panah, dan diunduh.</div><a class='tautan-chip' href='galeri.html'>🖼️ Buka Galeri</a>",
      saran: ["Daya tarik", "Lokasi pantai", "Kontak pengelola"] },
    { id: "petaSatelit", topik: "Peta & citra satelit", priority: 14, ringkas: "Maps Embed API, jenis tampilan, dan jatuh-balik tanpa kunci.",
      keywords: ["satelit","citra satelit","satellite","embed","embed api","maps api","google maps api","api key","kunci api","zoom","tampilan peta","peta jalan","terrain","hybrid","peta satelit","peta interaktif","peta lokasi","skema","layar penuh","fullscreen","sematan","peta google"],
      reply: "<p>🛰️ Halaman Lokasi menyematkan <b>Google Maps Embed API</b> dengan tampilan <b>satelit</b>. Tersedia pula pilihan satelit berlabel, peta jalan, dan terrain, serta kendali zoom dan tinggi peta.</p><div class='kotak-info'>Bila kunci API belum diisi, sistem otomatis memakai sematan Google Maps tanpa kunci agar peta tetap tampil. Titik koordinat resmi pantai dapat dimasukkan bila sudah diperoleh dari desa.</div><a class='tautan-chip' href='lokasi.html'>🛰️ Buka peta satelit</a>",
      saran: ["Lokasi pantai", "Akses ke lokasi", "Status data"] },
    { id: "ekspor", topik: "Ekspor jadwal", priority: 15, ringkas: "Tabel jadwal dapat diunduh sebagai PNG atau JPG.",
      keywords: ["ekspor","export","unduh","download","simpan","simpan jadwal","simpan rencana","cetak","print","png","jpg","jpeg","gambar jadwal","tabel jadwal","jadwal gambar","salin","copy","salin jadwal","salin tabel","ukuran huruf","font","huruf kecil","huruf besar","kebesaran","kekecilan","resolusi","skala"],
      reply: "<p>🖼️ Jadwal kunjungan dapat diubah menjadi <b>tabel jadwal</b> lalu disimpan sebagai <b>PNG atau JPG</b>.</p><div class='kotak-info'>Studio Ekspor menyediakan kendali <b>ukuran huruf</b>, <b>kerapatan baris</b>, <b>lebar dokumen</b>, tema, format, dan skala resolusi — atur sampai tabel benar-benar terbaca, lalu unduh atau salin gambarnya.</div><a class='tautan-chip' href='fasilitas.html#studio'>🖼️ Buka Studio Ekspor</a><a class='tautan-chip' href='fasilitas.html#perencana'>🧭 Susun jadwal dulu</a>",
      saran: ["Susun jadwal kunjungan", "Aktivitas", "Waktu terbaik berkunjung"] },
    { id: "keselamatan", topik: "Keselamatan", priority: 16, ringkas: "Tips aman di pesisir dan nomor darurat nasional.",
      keywords: ["aman","keamanan","keselamatan","bahaya","berbahaya","risiko","darurat","emergency","sar","basarnas","ambulans","polisi","rumah sakit","rsud","puskesmas","aman untuk anak","boleh anak","anak kecil","balita","lansia","bumil","ibu hamil","berenang aman","arus","rip current","pelampung anak","tips aman","hati hati","jaga keselamatan","nomor darurat"],
      reply: "<p>🦺 <b>Utamakan keselamatan di pesisir:</b></p><ul><li>Selalu awasi anak dan gunakan <b>pelampung</b> saat bermain air</li><li>Hindari tepi karang yang licin; pakai alas kaki bersol kuat</li><li>Jangan berenang sendirian atau saat angin kencang</li><li>Ikuti arahan pemandu saat berada di perahu</li></ul><div class='kotak-info'>Nomor darurat nasional: <b>115</b> (Basarnas) · <b>118</b> (ambulans) · <b>110</b> (polisi). Fasilitas keselamatan di lokasi masih menunggu konfirmasi pengelola.</div><a class='tautan-chip' href='fasilitas.html'>⛱️ Lihat fasilitas</a><a class='tautan-chip' href='kontak.html'>📞 Hubungi pengelola</a>",
      saran: ["Fasilitas", "Waktu terbaik berkunjung", "Memancing"] },
    { id: "profilDesa", topik: "Profil desa", priority: 17, ringkas: "Identitas wilayah dan kehidupan masyarakat Lobuk.",
      keywords: ["profil","profil desa","tentang desa","tentang lobuk","sejarah","asal usul","penduduk","warga","mata pencaharian","nelayan","kehidupan warga","budaya","tradisi","adat","kearifan","potensi desa","gambaran desa","informasi desa","tentang wisata","desa apa"],
      reply: "<p>🏝️ <b>Desa Lobuk</b> adalah desa pesisir di <b>Kecamatan Bluto, Kabupaten Sumenep, Jawa Timur</b>, di ujung timur Pulau Madura.</p><p>Sebagian besar warga menggantungkan hidup pada laut: melaut dini hari, mengolah ikan kering dan kerupuk di halaman rumah, serta merawat perahu di tepi pantai. Di antara denyut itu tersimpan <b>Pantai Matahari</b> dengan jembatan kayu dan langit fajar yang berlapis warna.</p><a class='tautan-chip' href='index.html'>🏠 Beranda</a><a class='tautan-chip' href='tentang.html'>📖 Tentang wisata</a>",
      saran: ["Daya tarik", "Produk lokal", "Lokasi pantai"] },
    { id: "statusData", topik: "Status kelengkapan data", priority: 18, ringkas: "Pemisahan informasi terverifikasi dan yang menunggu mitra.",
      keywords: ["status data","data resmi","data lengkap","belum lengkap","kapan lengkap","verifikasi","terverifikasi","menunggu mitra","mitra","belum tersedia","data kosong","kenapa kosong","kenapa belum","sumber data","dari mana datanya","checklist","kelengkapan","akurasi","valid","tebak","dugaan"],
      reply: "<p>📋 Sistem ini memisahkan informasi yang <b>sudah pasti</b> dari yang <b>menunggu konfirmasi mitra</b>.</p><ul><li><b>Sudah pasti:</b> identitas wilayah, nama destinasi, daya tarik umum</li><li><b>Menunggu:</b> foto asli, jam operasional, tarif, daftar fasilitas, kontak resmi, titik koordinat, daftar produk lokal</li></ul><div class='kotak-info'>Butir yang belum siap tidak ditampilkan sebagai dugaan. Progres pengumpulan dapat dicentang pada checklist di halaman Kontak.</div><a class='tautan-chip' href='kontak.html#checklist'>📋 Buka checklist</a>",
      saran: ["Kontak pengelola", "Harga tiket", "Jam buka"] },
    { id: "sapaan", topik: "Sapaan", priority: 19, ringkas: "Salam pembuka dan tawaran bantuan.",
      keywords: ["halo","hallo","haloo","helo","hello","hai","hay","hei","hey","hi","hii","hy","salam","assalamualaikum","permisi","selamat pagi","selamat siang","selamat sore","selamat malam","apa kabar","halo bot","hai bot"],
      reply: "<p>Halo! 👋 Saya <b>asisten wisata Desa Lobuk</b>.</p><p>Saya bisa membantu menjelaskan <b>Pantai Matahari</b> — lokasi, daya tarik, akses, aktivitas, fasilitas, hingga cara menyimpan jadwal kunjungan sebagai gambar. Apa yang ingin Anda ketahui?</p>",
      saran: ["Lokasi pantai", "Daya tarik", "Jam buka", "Harga tiket"] },
    { id: "terimaKasih", topik: "Penutup", priority: 20, ringkas: "Ucapan penutup.",
      keywords: ["terima kasih","makasih","makasih banyak","thanks","thank you","sip","mantap","oke","baiklah","siap","keren","bagus sekali","membantu","sangat membantu","sampai jumpa","dadah","bye"],
      reply: "<p>Sama-sama! 🌅 Semoga informasi ini membantu rencana kunjungan Anda ke <b>Pantai Matahari, Desa Lobuk</b>.</p><p>Jangan ragu bertanya lagi kapan saja.</p>",
      saran: ["Susun jadwal kunjungan", "Galeri foto", "Kontak pengelola"] },
    { id: "bantuan", topik: "Bantuan & topik", priority: 21, ringkas: "Daftar topik yang dapat dijawab chatbot.",
      keywords: ["bantuan","help","tolong","bingung","tidak mengerti","bisa apa","kamu bisa apa","apa yang bisa","menu","topik","daftar topik","cara pakai","cara menggunakan","panduan","fitur","bisa bantu apa"],
      reply: "<p>🧭 Saya dapat menjawab topik berikut:</p><ul><li><b>Lokasi & peta</b> — alamat, citra satelit, koordinat</li><li><b>Akses</b> — gambaran rute lintas Madura</li><li><b>Daya tarik</b> — fajar, senja, jembatan kayu</li><li><b>Aktivitas & jadwal</b> — kegiatan dan penyusun rencana</li><li><b>Fasilitas, penginapan, tiket, jam buka</b> — beserta status datanya</li><li><b>Produk lokal, kontak, keselamatan, galeri, ekspor jadwal</b></li></ul><div class='kotak-info'>Pilih salah satu tombol saran di bawah, atau tulis pertanyaan dengan bahasa sehari-hari.</div>",
      saran: ["Lokasi pantai", "Aktivitas", "Fasilitas", "Kontak pengelola"] }
  ],

  ujiChatbot: [
    { id: "UJ-09", kelompok: "SDD", nama: "Widget terbuka dengan sambutan", jenis: "dom-buka", masukan: "—", harap: null, bukan: null },
    { id: "UJ-10", kelompok: "SDD", nama: "Kata kunci tunggal", jenis: "intent", masukan: "lokasi", harap: "lokasi", bukan: null },
    { id: "UJ-11", kelompok: "SDD", nama: "Kalimat lengkap", jenis: "intent", masukan: "di mana letak pantainya?", harap: "lokasi", bukan: null },
    { id: "UJ-12", kelompok: "SDD", nama: "Tombol saran cepat", jenis: "dom-saran", masukan: "Fasilitas", harap: "fasilitas", bukan: null },
    { id: "UJ-13", kelompok: "SDD", nama: "Di luar kata kunci → fallback", jenis: "intent", masukan: "asdf qwer zxcv", harap: null, bukan: null },
    { id: "UJ-14", kelompok: "SDD", nama: "Input kosong tidak terkirim", jenis: "dom-kosong", masukan: "   ", harap: null, bukan: null },
    { id: "RG-01", kelompok: "Regresi kata utuh", nama: "“wa” tidak lagi cocok pada “waktu”", jenis: "intent", masukan: "berapa lama waktu tempuhnya?", harap: "akses", bukan: "kontak" },
    { id: "RG-02", kelompok: "Regresi kata utuh", nama: "“hi” tidak lagi cocok pada “lihat”", jenis: "intent", masukan: "lihat foto di bawah", harap: "galeri", bukan: "sapaan" },
    { id: "RG-03", kelompok: "Regresi kata utuh", nama: "“data” tidak lagi cocok pada “datang”", jenis: "intent", masukan: "saya datang besok", harap: null, bukan: "statusData" },
    { id: "RG-04", kelompok: "Regresi kata utuh", nama: "“jam” tidak lagi cocok pada “jamu”", jenis: "intent", masukan: "jamu tradisional", harap: null, bukan: "jamBuka" },
    { id: "RG-05", kelompok: "Regresi kata utuh", nama: "“gambar” tidak cocok pada “gambaran”", jenis: "intent", masukan: "gambaran umum", harap: null, bukan: "galeri" },
    { id: "RG-06", kelompok: "Regresi kata utuh", nama: "“bisa apa” tidak lagi memicu aktivitas", jenis: "intent", masukan: "kamu bisa apa", harap: "bantuan", bukan: "aktivitas" },
    { id: "RG-07", kelompok: "Regresi kata utuh", nama: "Frasa waktu mengalahkan kata tunggal", jenis: "intent", masukan: "sunset jam berapa", harap: "dayaTarik", bukan: "jamBuka" },
    { id: "BH-01", kelompok: "Bahasa sehari-hari", nama: "Singkatan gmn + kesana", jenis: "intent", masukan: "gmn cara kesana", harap: "akses", bukan: null },
    { id: "BH-02", kelompok: "Bahasa sehari-hari", nama: "Singkatan brp + hrg", jenis: "intent", masukan: "brp hrg tiket", harap: "tiket", bukan: null },
    { id: "BH-03", kelompok: "Bahasa sehari-hari", nama: "dimana tanpa spasi + akhiran -nya", jenis: "intent", masukan: "lokasinya dimana", harap: "lokasi", bukan: null },
    { id: "BH-04", kelompok: "Bahasa sehari-hari", nama: "wa → whatsapp", jenis: "intent", masukan: "wa nya berapa", harap: "kontak", bukan: null },
    { id: "BH-05", kelompok: "Bahasa sehari-hari", nama: "Salah ketik snorkling", jenis: "intent", masukan: "snorkling", harap: "aktivitas", bukan: null },
    { id: "BH-06", kelompok: "Bahasa sehari-hari", nama: "nginap → menginap", jenis: "intent", masukan: "mau nginap semalam", harap: "penginapan", bukan: null },
    { id: "BH-07", kelompok: "Bahasa sehari-hari", nama: "gak → tidak, frasa ada toilet", jenis: "intent", masukan: "ada toilet gak", harap: "fasilitas", bukan: null },
    { id: "BH-08", kelompok: "Bahasa sehari-hari", nama: "makasih ya", jenis: "intent", masukan: "makasih ya", harap: "terimaKasih", bukan: null },
    { id: "BH-09", kelompok: "Bahasa sehari-hari", nama: "Akhiran posesif -nya pada tiket", jenis: "intent", masukan: "tiketnya berapa", harap: "tiket", bukan: null },
    { id: "BH-10", kelompok: "Bahasa sehari-hari", nama: "Frasa perjalanan berapa jam", jenis: "intent", masukan: "perjalanan berapa jam", harap: "akses", bukan: null },
    { id: "KF-01", kelompok: "Cakupan kebutuhan", nama: "Profil desa (KF-01)", jenis: "intent", masukan: "profil desa lobuk", harap: "profilDesa", bukan: null },
    { id: "KF-03", kelompok: "Cakupan kebutuhan", nama: "Galeri foto (KF-03)", jenis: "intent", masukan: "minta foto pantai", harap: "galeri", bukan: null },
    { id: "KF-05", kelompok: "Cakupan kebutuhan", nama: "Peta satelit (KF-05)", jenis: "intent", masukan: "peta satelit", harap: "petaSatelit", bukan: "lokasi" },
    { id: "KF-06", kelompok: "Cakupan kebutuhan", nama: "Oleh-oleh (KF-06)", jenis: "intent", masukan: "oleh oleh khas sini", harap: "produkLokal", bukan: null },
    { id: "KF-07", kelompok: "Cakupan kebutuhan", nama: "Nomor pengelola (KF-07)", jenis: "intent", masukan: "nomor pengelola", harap: "kontak", bukan: null },
    { id: "KF-08a", kelompok: "Cakupan kebutuhan", nama: "Keselamatan anak", jenis: "intent", masukan: "aman buat anak kecil", harap: "keselamatan", bukan: null },
    { id: "KF-08b", kelompok: "Cakupan kebutuhan", nama: "Ekspor jadwal PNG", jenis: "intent", masukan: "unduh jadwal png", harap: "ekspor", bukan: null },
    { id: "KF-08c", kelompok: "Cakupan kebutuhan", nama: "Status kelengkapan data", jenis: "intent", masukan: "kapan data lengkap", harap: "statusData", bukan: null },
    { id: "KF-08d", kelompok: "Cakupan kebutuhan", nama: "Sapaan pembuka", jenis: "intent", masukan: "halo", harap: "sapaan", bukan: null },
    { id: "KF-08e", kelompok: "Cakupan kebutuhan", nama: "Memancing", jenis: "intent", masukan: "spot mancing di pantai", harap: "memancing", bukan: null }
  ]
};

/* ============================================================
   LobukStore — pemuat konten aktif (dipakai semua halaman).
   Menerapkan salinan hasil suntingan admin bila ada.
   Teks blok ini juga dipakai tombol "Ekspor data.js" di admin.
   ============================================================ */
window.LobukStore=(function(){
var K="lobuk_konten_v1",B=JSON.parse(JSON.stringify(LOBUK)),L=[];
function salin(o){return JSON.parse(JSON.stringify(o))}
function ob(v){return v&&typeof v==="object"&&!Array.isArray(v)}
function gabung(a,b){
if(b===undefined)return salin(a);
if(Array.isArray(a))return Array.isArray(b)?salin(b):salin(a);
if(ob(a)){var o={};Object.keys(a).forEach(function(k){o[k]=gabung(a[k],ob(b)?b[k]:undefined)});if(ob(b))Object.keys(b).forEach(function(k){if(!(k in o))o[k]=salin(b[k])});return o}
return b;}
function terap(x){var n=gabung(B,x);Object.keys(LOBUK).forEach(function(k){delete LOBUK[k]});Object.keys(n).forEach(function(k){LOBUK[k]=n[k]})}
function muat(){try{var s=localStorage.getItem(K);if(s)terap(JSON.parse(s))}catch(e){}}
function simpan(){try{localStorage.setItem(K,JSON.stringify(LOBUK));return{ok:true}}catch(e){return{ok:false,pesan:"Penyimpanan peramban penuh atau diblokir."}}}
function reset(){try{localStorage.removeItem(K)}catch(e){}terap(B)}
function ambil(p){return String(p).split(".").reduce(function(o,k){return o==null?undefined:o[k]},LOBUK)}
function tulis(p,v){var k=String(p).split("."),u=k.pop(),o=k.reduce(function(a,x){if(a[x]==null)a[x]={};return a[x]},LOBUK);o[u]=v}
function siarkan(){L.forEach(function(f){try{f(LOBUK)}catch(e){}});try{document.dispatchEvent(new CustomEvent("lobuk-konten-ubah"))}catch(e){}}
muat();
return{kunci:K,bawaan:B,aktif:function(){return LOBUK},salin:salin,gabung:gabung,terapkan:function(x){terap(x);siarkan()},simpan:function(){var r=simpan();siarkan();return r},reset:function(){reset();siarkan()},ambil:ambil,tulis:tulis,dengar:function(f){L.push(f)},siarkan:siarkan,adaTersimpan:function(){try{return !!localStorage.getItem(K)}catch(e){return false}}}
})();