import "./App.css";
import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

export default function App() {
  type SharePlatform = "facebook" | "whatsapp" | "telegram" | "x";
  const smartLabSectionIds = new Set([
    "smartlab-hero",
    "smartlab-pengenalan",
    "smartlab-pengguna",
    "smartlab-cara",
    "smartlab-status",
    "smartlab-falsafah",
    "smartlab-pengiktirafan",
  ]);
  const eduTrackSectionIds = new Set(["edutrack-post"]);
  const eduSlotSectionIds = new Set(["eduslot-post"]);
  const smartLabHiddenSectionIds = new Set([
    "smartlab-cara",
    "smartlab-status",
    "smartlab-falsafah",
  ]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<"home" | "inovasi">("home");
  const [readMore, setReadMore] = useState(false);
  const [eduTrackReadMore, setEduTrackReadMore] = useState(false);
  const [eduSlotReadMore, setEduSlotReadMore] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hashTarget = window.location.hash.replace(/^#/, "");
    const shouldOpenInovasi =
      params.get("page") === "inovasi" ||
      smartLabSectionIds.has(hashTarget) ||
      eduTrackSectionIds.has(hashTarget) ||
      eduSlotSectionIds.has(hashTarget);

    if (shouldOpenInovasi) {
      setCurrentPage("inovasi");
    }

    if (smartLabHiddenSectionIds.has(hashTarget)) {
      setReadMore(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hashTarget = window.location.hash.replace(/^#/, "");
    if (!hashTarget) {
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById(hashTarget)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [currentPage, readMore, eduTrackReadMore, eduSlotReadMore]);

  const navigateTo = (page: "home" | "inovasi") => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_geh40rw",
        "template_0j2wfq8",
        e.currentTarget,
        "FORdocXs1Pm5WQ8zT"
      )
      .then(
        (result) => {
          console.log(result.text);
          alert("Mesej berjaya dihantar!");
          setName("");
          setEmail("");
          setMessage("");
        },
        (error) => {
          console.log(error.text);
          alert("Ralat menghantar mesej. Sila cuba lagi.");
        }
      );
  };

  const sharePlatforms: Array<{ platform: SharePlatform; label: string }> = [
    { platform: "facebook", label: "Facebook" },
    { platform: "whatsapp", label: "WhatsApp" },
    { platform: "telegram", label: "Telegram" },
    { platform: "x", label: "X" },
  ];

  const getShareUrl = (anchor: string) => {
    if (typeof window === "undefined") {
      return anchor;
    }

    const targetId = anchor.replace(/^#/, "");
    const appUrl = new URL(window.location.href);
    appUrl.hash = "";
    appUrl.search = "";
    appUrl.searchParams.set("page", "inovasi");
    if (targetId) {
      appUrl.hash = targetId;
    }

    const shareLandingUrl = new URL(window.location.href);
    shareLandingUrl.hash = "";
    shareLandingUrl.search = "";
    shareLandingUrl.pathname =
      shareLandingUrl.pathname.replace(/\/[^/]*$/, "/") +
      (eduTrackSectionIds.has(targetId)
        ? "share-edutrack.html"
        : eduSlotSectionIds.has(targetId)
          ? "share-eduslot.html"
          : "share-smartlab.html");
    shareLandingUrl.searchParams.set("target", targetId);

    if (
      smartLabSectionIds.has(targetId) ||
      eduTrackSectionIds.has(targetId) ||
      eduSlotSectionIds.has(targetId)
    ) {
      return shareLandingUrl.toString();
    }

    return appUrl.toString();
  };

  const openSocialShare = (platform: SharePlatform, title: string, anchor: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const url = encodeURIComponent(getShareUrl(anchor));
    const text = encodeURIComponent(`Jom lihat ${title} di CikguSTEM.`);

    const shareLinkByPlatform: Record<SharePlatform, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      x: `https://x.com/intent/tweet?url=${url}&text=${text}`,
    };

    window.open(shareLinkByPlatform[platform], "_blank", "noopener,noreferrer");
  };

  const copyShareLink = async (anchor: string) => {
    const url = getShareUrl(anchor);

    try {
      await navigator.clipboard.writeText(url);
      alert("Pautan berjaya disalin.");
    } catch {
      window.prompt("Salin pautan ini:", url);
    }
  };

  const ShareBar = ({ title, anchor }: { title: string; anchor: string }) => (
    <div className="share-row" aria-label={`Kongsi ${title}`}>
      <span className="share-row__label">Kongsi:</span>
      {sharePlatforms.map(({ platform, label }) => (
        <button
          type="button"
          key={`${anchor}-${platform}`}
          className={`share-row__btn share-row__btn--${platform}`}
          onClick={() => openSocialShare(platform, title, anchor)}
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        className="share-row__btn share-row__btn--copy"
        onClick={() => copyShareLink(anchor)}
      >
        Salin Link
      </button>
    </div>
  );

  const cards = [
    {
      title: "Seni Smart Lab",
      text: "Sistem tempahan eksperimen makmal untuk pengurusan aktiviti makmal sains secara lebih teratur, cekap dan profesional.",
      link: "https://senismartlab.cikgustem.com",
      button: "Buka Sistem",
    },
    {
      title: "Inovasi STEM",
      text: "Pembangunan projek STEM, idea inovasi, Micro:bit dan penyelesaian pendidikan yang relevan dengan dunia sebenar.",
      link: "#focus",
      button: "Lihat Fokus",
    },
    {
      title: "Portfolio Pendidikan",
      text: "Ruang profesional untuk mempamerkan perjalanan Najib Jaafar sebagai guru, tech educator dan inovator pendidikan.",
      link: "#about",
      button: "Kenali Saya",
    },
  ];

  const focusAreas = [
    "Teknologi dalam pendidikan sains",
    "Pembangunan inovasi STEM dan projek sekolah",
    "Sistem digital untuk guru dan murid",
    "Perkongsian amalan terbaik PdP abad ke-21",
  ];

  const achievements = [
    "Johan pertandingan Inovasi cetakan 3D Malaysia Techlympics Zon Selatan Peringkat Kebangsaan 2022",
    "Johan Pertandingan Inovasi Sungai Kim Kim Peringkat Kebangsaan 2022",
    "Pingat Emas Karnival Kreatif dan Inovasi PdPc Kebangsaan 2019",
    "Google Certified Educator Level 2",
    "Anugerah Perkhidmatan Cemerlang 2017",
    "Panel ICT Bengkel Pembinaan Bahan Tambahan Digital Buku Teks Peringkat Kebangsaan",
  ];

  const gallery = [
    "/gallery1.jpg",
    "/gallery2.jpg",
    "/gallery3.jpg",
    "/gallery4.jpg",
  ];

  return (
    <div className="page">
      <nav className="navbar">
        <div
          className="navbar__brand"
          style={{ cursor: "pointer" }}
          onClick={() => navigateTo("home")}
        >
          CIKGUSTEM
        </div>
        <button
          className="navbar__toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`navbar__links ${mobileMenuOpen ? "navbar__links--active" : ""}`}>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>Tentang</a>
          <a href="#focus" onClick={() => setMobileMenuOpen(false)}>Fokus</a>
          <a href="#achievements" onClick={() => setMobileMenuOpen(false)}>Pencapaian</a>
          <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Galeri</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Hubungi</a>
          <button
            className={`navbar__inovasi-btn${currentPage === "inovasi" ? " navbar__inovasi-btn--active" : ""}`}
            onClick={() => navigateTo("inovasi")}
          >
            Inovasi
          </button>
        </div>
      </nav>

      {currentPage === "inovasi" ? (
        /* ─────────────── PAGE INOVASI ─────────────── */
        <div className="inovasi-page">

          {/* ── HERO ── */}
          <div id="smartlab-hero" className="inovasi-page__hero">
            <div className="inovasi-page__hero-glow inovasi-page__hero-glow--one"></div>
            <div className="inovasi-page__hero-glow inovasi-page__hero-glow--two"></div>
            <div className="inovasi-page__hero-content">
              <span className="section__label">Produk Inovasi Terbaru</span>
              <h1>SmartLab</h1>
              <p className="inovasi-page__tagline">
                Mengurus eksperimen makmal dengan lebih mudah dan sistematik
              </p>
              <div className="inovasi-page__hero-actions">
                <a href="https://senismartlab.cikgustem.com" className="btn btn--primary" target="_blank" rel="noreferrer">
                  Cuba SmartLab
                </a>
                <button className="btn btn--secondary" onClick={() => navigateTo("home")}>
                  ← Kembali ke Utama
                </button>
              </div>
              <ShareBar title="SmartLab" anchor="#smartlab-hero" />
            </div>
          </div>

          {/* ── BLOK 1: Teks kiri | Gambar kanan (Login screenshot) ── */}
          <div id="smartlab-pengenalan" className="inovasi-story">
            <div className="inovasi-story__text">
              <p className="section__label">Tentang SmartLab</p>
              <h2>Satu penyelesaian, dibina dari pengalaman sebenar</h2>
              <p>
                SmartLab ialah sebuah web apps yang dibangunkan khusus untuk membantu
                guru sains merancang dan mengurus eksperimen makmal dengan lebih teratur.
              </p>
              <p>
                Ia bermula daripada satu keperluan yang sangat biasa di sekolah —
                guru perlu menjalankan eksperimen, tetapi penyediaan bahan dan radas
                sering menjadi cabaran. SmartLab dibina untuk membantu menyelesaikan
                masalah tersebut.
              </p>
              <ShareBar title="SmartLab: Pengenalan" anchor="#smartlab-pengenalan" />
            </div>
            <div className="inovasi-story__image">
              <img src="/Daftar akaun.jpg" alt="SmartLab — Daftar Akaun" />
              <span className="inovasi-story__caption">Paparan Daftar Akaun SmartLab</span>
            </div>
          </div>

          {/* ── BLOK 2: Gambar kiri (Dashboard) | Teks kanan ── */}
          <div id="smartlab-pengguna" className="inovasi-story inovasi-story--reverse inovasi-story--alt">
            <div className="inovasi-story__image">
              <img src="/dashboard utama.jpg" alt="SmartLab — Dashboard Utama" />
              <span className="inovasi-story__caption">Dashboard utama SmartLab</span>
            </div>
            <div className="inovasi-story__text">
              <p className="section__label">Smartlab untuk Siapa??</p>
              <h2>Direka untuk semua warga makmal</h2>
              <div className="inovasi-users">
                {["🧑‍🏫 Guru Sains sekolah menengah", "🧪 Pembantu Makmal sekolah", "📋 Ketua Panitia Sains", "🏫 Pentadbir sekolah"].map(u => (
                  <span className="inovasi-user-pill" key={u}>{u}</span>
                ))}
              </div>
              <p>
                SmartLab memastikan eksperimen dapat dirancang lebih awal, bahan
                disediakan dengan tepat, dan proses pengajaran berjalan dengan lebih lancar.
              </p>
              <ShareBar title="SmartLab: Pengguna Sasaran" anchor="#smartlab-pengguna" />
            </div>
          </div>

          {/* ── BUTANG TOGGLE ── */}
          <div className="inovasi-readmore">
            <button
              className={`inovasi-readmore__btn${readMore ? " inovasi-readmore__btn--collapse" : ""}`}
              onClick={() => setReadMore((prev) => !prev)}
            >
              {readMore ? "Lihat Kurang" : "Baca Seterusnya"}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {readMore ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            </button>
          </div>

          {/* ── KANDUNGAN LANJUTAN ── */}
          {readMore && (
            <div className="inovasi-expanded">
              {/* Blok 3: Eksperimen dan Aktiviti */}
              <div id="smartlab-cara" className="inovasi-story">
                <div className="inovasi-story__text">
                  <p className="section__label">Cara Penggunaan</p>
                  <h2>Pilih eksperimen. Sistem uruskan selebihnya.</h2>
                  <p>
                    Melalui SmartLab, guru memilih eksperimen yang ingin dijalankan dan
                    sistem akan menyediakan senarai bahan serta radas yang diperlukan secara
                    automatik.
                  </p>
                  <p>
                    Permintaan dihantar terus kepada pembantu makmal — tiada salah faham,
                    tiada kekurangan bahan.
                  </p>
                  <ShareBar title="SmartLab: Cara Penggunaan" anchor="#smartlab-cara" />
                </div>
                <div className="inovasi-story__image">
                  <img src="/eksperiemen dan aktiviti.jpg" alt="SmartLab — Eksperimen dan Aktiviti" />
                  <span className="inovasi-story__caption">Pilihan eksperimen dan aktiviti dalam SmartLab</span>
                </div>
              </div>

              {/* Blok 4: Senarai Tempahan */}
              <div id="smartlab-status" className="inovasi-story inovasi-story--reverse inovasi-story--alt">
                <div className="inovasi-story__image">
                  <img src="/tempahan saya.jpg" alt="SmartLab — Tempahan Saya" />
                  <span className="inovasi-story__caption">Paparan Tempahan Saya dengan status kelulusan</span>
                </div>
                <div className="inovasi-story__text">
                  <p className="section__label">Rekod & Status</p>
                  <h2>Semua tempahan dalam satu paparan</h2>
                  <p>
                    Guru boleh menyemak status tempahan — sama ada diluluskan atau
                    ditolak — dengan nota daripada pentadbir sekali gus. Setiap rekod
                    boleh dicetak terus dari sistem.
                  </p>
                  <p>
                    Dengan pendekatan ini, pengurusan eksperimen menjadi lebih tersusun
                    dan risiko kesilapan dapat dikurangkan dengan ketara.
                  </p>
                  <ShareBar title="SmartLab: Rekod dan Status" anchor="#smartlab-status" />
                </div>
              </div>

              {/* Blok 5: Borang close-up + prinsip */}
              <div id="smartlab-falsafah" className="inovasi-story">
                <div className="inovasi-story__text">
                  <p className="section__label">Falsafah Reka Bentuk</p>
                  <h2>Dibina oleh guru, untuk guru</h2>
                  <p>
                    SmartLab bukan sekadar satu sistem pengurusan makmal. Ia dibangunkan
                    daripada pengalaman sebenar seorang guru yang berdepan dengan cabaran
                    pengurusan eksperimen di sekolah setiap hari.
                  </p>
                  <p>
                    SmartLab direka dengan satu prinsip yang sangat jelas —{" "}
                    <strong>mudah digunakan oleh guru tanpa memerlukan kemahiran teknikal.</strong>
                  </p>
                  <p>
                    Dengan bantuan teknologi, SmartLab cuba menjadikan pengurusan makmal
                    sekolah lebih sistematik supaya guru boleh memberi lebih fokus kepada
                    perkara yang paling penting — <strong>pembelajaran murid.</strong>
                  </p>
                  <ShareBar title="SmartLab: Falsafah Reka Bentuk" anchor="#smartlab-falsafah" />
                </div>
                <div className="inovasi-story__image">
                  <img src="/tempahan.jpg" alt="SmartLab — Tempahan" />
                  <span className="inovasi-story__caption">Borang tempahan SmartLab</span>
                </div>
              </div>

            </div>
          )}

          {/* ── ANUGERAH ── */}
          <div id="smartlab-pengiktirafan" className="inovasi-awards">
            <p className="section__label" style={{ textAlign: "center", display: "block", marginBottom: "24px" }}>Pengiktirafan</p>
            <div className="inovasi-awards__grid">
              {[
                { icon: "🏆", title: "Johan Inovasi", sub: "Malaysia Techlympics Zon Selatan 2022" },
                { icon: "🥇", title: "Johan Kebangsaan", sub: "Inovasi Sungai Kim Kim 2022" },
                { icon: "🎖️", title: "Pingat Emas", sub: "Karnival Kreatif & Inovasi PdPc 2019" },
              ].map(a => (
                <div className="inovasi-award-card" key={a.title}>
                  <span className="inovasi-award-card__icon">{a.icon}</span>
                  <strong>{a.title}</strong>
                  <p>{a.sub}</p>
                </div>
              ))}
            </div>
            <ShareBar title="SmartLab: Pengiktirafan" anchor="#smartlab-pengiktirafan" />
          </div>

          {/* ── CTA ── */}
          <div className="inovasi-section inovasi-section--cta">
            <div className="cta__box">
              <div>
                <p className="section__label">Cuba Sekarang</p>
                <h2>Akses SmartLab secara percuma</h2>
                <p>Sesuai untuk semua sekolah menengah di Malaysia.</p>
              </div>
              <div className="inovasi-cta__btns">
                <a href="https://senismartlab.cikgustem.com" className="btn btn--primary" target="_blank" rel="noreferrer">
                  Buka SmartLab
                </a>
                <button className="btn btn--secondary" onClick={() => navigateTo("home")}>
                  ← Kembali ke Utama
                </button>
              </div>
            </div>
          </div>

          <section id="edutrack-post" className="eduslot">
            <div className="eduslot__top">
              <div className="eduslot__hero">
                <p className="section__label">Inovasi Terkini</p>
                <h2>EduTrack</h2>
                <p className="eduslot__tagline">
                  Bukan sekadar simpan markah, tetapi membantu guru merancang masa depan murid.
                </p>
                <p className="eduslot__intro">
                  EduTrack dibina dengan satu fokus yang jelas: menjadikan data akademik
                  sebagai alat bimbingan. Apabila markah dimasukkan, sistem terus membantu
                  guru melihat hubungan antara TOV, OTR dan ETR supaya sasaran murid dapat
                  dirancang dengan lebih cepat, lebih jelas dan lebih bermakna.
                </p>
                <ShareBar title="EduTrack" anchor="#edutrack-post" />
                <div className="eduslot__actions">
                  <a
                    href="https://edutrack.cikgustem.com"
                    className="btn btn--primary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buka EduTrack
                  </a>
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => setEduTrackReadMore(true)}
                  >
                    Baca Penerangan
                  </button>
                </div>

                <div className="eduslot__sidecards">
                  <article className="eduslot__card eduslot__card--compact">
                    <h3>Masalah sebenar yang dihadapi guru</h3>
                    <ul>
                      <li>Kebanyakan sistem hanya berhenti pada simpanan markah dan penjanaan laporan</li>
                      <li>Guru masih perlu menilai sasaran dan hala tuju murid secara manual</li>
                    </ul>
                  </article>

                  <article className="eduslot__card eduslot__card--compact">
                    <h3>Bagaimana EduTrack membantu dalam 3 langkah</h3>
                    <ol>
                      <li>Guru masukkan markah semasa.</li>
                      <li>Sistem membaca jurang TOV, OTR dan ETR.</li>
                      <li>Sasaran dibina secara automatik ikut pendekatan yang dipilih.</li>
                    </ol>
                  </article>
                </div>

                <div className="eduslot__grid">
                  <article className="eduslot__card">
                    <h3>Kenapa EduTrack lebih dekat dengan realiti kerja guru</h3>
                    <ul>
                      <li>Guru boleh memilih mod Conservative, Moderate atau Aggressive mengikut potensi murid</li>
                      <li>OTR dibina secara automatik tanpa kiraan berulang yang memenatkan</li>
                      <li>Pentadbir boleh mengawal peperiksaan yang dibuka untuk kemasukan markah</li>
                      <li>Analisis disesuaikan apabila murid berpindah atau tidak mengambil subjek tertentu</li>
                    </ul>
                  </article>
                </div>
              </div>

              <div className="eduslot__showcase eduslot__showcase--panel">
                <div className="eduslot__card eduslot__showcaseCard">
                  <p className="eduslot__showcaseLabel">Idea Teras</p>
                  <h3>
                    Dari TOV ke ETR,
                    <br />
                    sistem bantu bentuk hala tuju murid.
                  </h3>
                  <p>
                    Tidak semua murid perlu dibimbing dengan cara yang sama. Sebab itu
                    EduTrack menyediakan tiga mod sasaran akademik supaya guru boleh memilih
                    pendekatan yang paling sesuai dengan kemampuan dan potensi sebenar murid.
                  </p>
                  <div className="eduslot__showcaseModes">
                    <span>Conservative</span>
                    <span>Moderate</span>
                    <span>Aggressive</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="eduslot__features">
              {[
                "TOV ke ETR dalam satu pandangan",
                "OTR dibina secara automatik",
                "Tiga mod sasaran akademik",
                "Kawalan peperiksaan oleh pentadbir",
                "Analisis adaptif ikut situasi murid",
              ].map((feature) => (
                <span className="eduslot__feature-pill" key={feature}>
                  {feature}
                </span>
              ))}
            </div>

            <div className="eduslot__toggleWrap">
              <button
                className="inovasi-readmore__btn"
                type="button"
                onClick={() => setEduTrackReadMore((prev) => !prev)}
              >
                {eduTrackReadMore ? "Lihat Ringkas" : "Baca Penuh EduTrack"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {eduTrackReadMore ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </button>
            </div>

            {eduTrackReadMore && (
              <div className="eduslot__more">
                <p>
                  Sebagai guru, kita bukan sekadar memasukkan markah. Dalam fikiran kita
                  sentiasa ada persoalan yang lebih besar: sejauh mana murid ini boleh pergi,
                  apakah sasaran yang realistik untuknya, dan bagaimana hendak membimbingnya
                  dari TOV ke ETR dengan lebih terarah.
                </p>
                <p>
                  Namun dalam realiti semasa, banyak sistem hanya berhenti pada penyimpanan
                  data. Markah dimasukkan, laporan dijana, tetapi proses membuat keputusan
                  masih bergantung sepenuhnya kepada guru secara manual. EduTrack dibina
                  untuk mengubah pendekatan itu dengan menjadikan data akademik sebagai alat
                  bimbingan, bukan sekadar rekod.
                </p>
                <p>
                  Melalui fungsi Sasaran Akademik, guru boleh memilih mod Conservative,
                  Moderate atau Aggressive. Berdasarkan pilihan ini, sistem membina OTR
                  secara automatik agar proses headcount tidak lagi menjadi kerja manual
                  yang berulang, tetapi satu proses yang lebih hidup, responsif dan selari
                  dengan kemampuan sebenar murid.
                </p>
                <p>
                  Dalam masa yang sama, kawalan tetap berada di tangan sekolah. Pentadbir
                  boleh menentukan peperiksaan yang dibuka untuk kemasukan markah, manakala
                  analisis akan menyesuaikan bacaan secara automatik apabila murid berpindah
                  atau tidak mengambil subjek tertentu.
                </p>
                <p>
                  Apa yang membezakan EduTrack bukan sekadar teknologinya, tetapi cara ia
                  memahami kerja seorang guru. Masa itu terhad, keputusan perlu dibuat dengan
                  cepat, dan di sebalik setiap data ada seorang murid yang perlu dibimbing.
                  EduTrack dibina supaya data bukan hanya disimpan, tetapi benar-benar
                  digunakan untuk membantu membina masa depan murid.
                </p>
              </div>
            )}
          </section>

          {/* ── INOVASI TERBARU: EDUSLOT ── */}
          <section id="eduslot-post" className="eduslot">
            <div className="eduslot__top">
              <div className="eduslot__hero">
                <p className="section__label">Inovasi Terbaru</p>
                <h2>EduSlot</h2>
                <p className="eduslot__tagline">
                  Sistem tempahan bilik khas sekolah yang lebih mudah, teratur dan telus.
                </p>
                <p className="eduslot__intro">
                  EduSlot dibangunkan untuk menyusun tempahan bilik khas sekolah secara
                  digital supaya tiada pertindihan jadual, tiada kekeliruan tempahan,
                  dan semua pihak dapat melihat penggunaan bilik dengan jelas.
                </p>
                <ShareBar title="EduSlot" anchor="#eduslot-post" />
                <div className="eduslot__actions">
                  <a
                    href="https://eduslot.cikgustem.com"
                    className="btn btn--primary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buka EduSlot
                  </a>
                  <button
                    className="btn btn--secondary"
                    onClick={() => setEduSlotReadMore(true)}
                  >
                    Lihat Penerangan
                  </button>
                </div>

                <div className="eduslot__sidecards">
                  <article className="eduslot__card eduslot__card--compact">
                    <h3>Masalah yang selalu berlaku di sekolah</h3>
                    <ul>
                      <li>Pertindihan tempahan bilik tanpa disedari</li>
                      <li>Jadual tidak jelas antara guru dan pentadbir</li>
                    </ul>
                  </article>

                  <article className="eduslot__card eduslot__card--compact">
                    <h3>Bagaimana EduSlot berfungsi dalam 3 langkah</h3>
                    <ol>
                      <li>Pilih bilik khas.</li>
                      <li>Pilih tarikh dan masa.</li>
                      <li>Hantar tempahan.</li>
                    </ol>
                  </article>
                </div>

                <div className="eduslot__grid">
                  <article className="eduslot__card">
                    <h3>Kenapa EduSlot sesuai untuk semua sekolah</h3>
                    <ul>
                      <li>Mudah digunakan tanpa latihan teknikal kompleks</li>
                      <li>Boleh diakses melalui komputer, tablet dan telefon</li>
                      <li>Setiap sekolah boleh ada pentadbir sendiri</li>
                      <li>Membantu pengurusan bilik jadi lebih telus</li>
                    </ul>
                  </article>
                </div>
              </div>

              <div className="eduslot__showcase">
                <img src="/eduslot-1.png" alt="EduSlot Paparan Sistem" />
                <span>Paparan sistem EduSlot</span>
              </div>
            </div>

            <div className="eduslot__features">
              {[
                "Elak pertindihan tempahan bilik",
                "Paparan jadual penggunaan bilik secara real-time",
                "Pentadbir boleh memantau semua tempahan",
                "Sistem ringkas dan mesra guru",
                "Rekod penggunaan bilik lebih teratur",
              ].map((feature) => (
                <span className="eduslot__feature-pill" key={feature}>
                  {feature}
                </span>
              ))}
            </div>

            <div className="eduslot__toggleWrap">
              <button
                className="inovasi-readmore__btn"
                onClick={() => setEduSlotReadMore((prev) => !prev)}
              >
                {eduSlotReadMore ? "Lihat Ringkas" : "Baca Penuh EduSlot"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {eduSlotReadMore ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </button>
            </div>

            {eduSlotReadMore && (
              <div className="eduslot__more">
                <p>
                  Di kebanyakan sekolah, tempahan bilik khas masih menggunakan cara
                  manual seperti buku log, papan putih, atau pesanan WhatsApp. Dari
                  situ lahirnya EduSlot sebagai satu sistem yang lebih kemas dan telus.
                </p>
                <p>
                  Pengurusan bilik khas melibatkan banyak perkara kecil yang boleh
                  jadi rumit jika tidak diurus dengan baik: siapa menempah, bilik mana
                  tersedia, waktu penggunaan, kelulusan pentadbir dan rekod penggunaan.
                </p>
                <p>
                  EduSlot boleh digunakan untuk makmal komputer, makmal sains, bilik
                  mesyuarat, auditorium, studio muzik, studio seni dan bilik khas mata
                  pelajaran. Matlamatnya jelas: guru kurang terbeban dengan isu jadual,
                  dan lebih fokus kepada pengajaran serta pembelajaran murid.
                </p>
              </div>
            )}
          </section>

          <footer className="footer">
            <p>© 2026 Najib Jaafar • cikgustem.com</p>
            <p>STEM Educator • Innovation • Education Technology</p>
          </footer>
        </div>
      ) : (
        <>
      <section className="hero">
  <div className="hero__glow hero__glow--one"></div>
  <div className="hero__glow hero__glow--two"></div>

  <div className="hero__content">
    <div className="badge">CIKGUSTEM.COM • Profil Profesional</div>

    <h1>Najib Jaafar</h1>

    <p className="subtitle">
      Tech Educator • Portfolio Educator • STEM Innovator
    </p>
    <p className="handle">•sciencelabproduction• </p>
    <div className="hero__badges">
  <span>Google Certified Educator</span>
  <span>National Innovation Award</span>
  <span>STEM Innovator</span>
</div>

    <p className="intro">
      Guru Sains yang memberi fokus kepada inovasi STEM, pembangunan
      sistem digital pendidikan dan pembinaan pengalaman pembelajaran
      yang lebih bermakna untuk guru serta pelajar di era digital.
    </p>

    <div className="hero__buttons">
      <a
        href="https://senismartlab.cikgustem.com"
        className="btn btn--primary"
        target="_blank"
        rel="noreferrer"
      >
        Buka Seni Smart Lab
      </a>
      <a href="#about" className="btn btn--secondary">
        Kenali Saya
      </a>
    </div>

    <div className="hero__stats">
      <div className="hero__stat">
        <h3>STEM</h3>
        <p>Inovasi pendidikan & projek sekolah</p>
      </div>
      <div className="hero__stat">
        <h3>EdTech</h3>
        <p>Pembangunan sistem digital untuk guru</p>
      </div>
      <div className="hero__stat">
        <h3>Portfolio</h3>
        <p>Perkongsian pencapaian dan amalan terbaik</p>
      </div>
    </div>
  </div>

  <div className="hero__imageWrap">
    <div className="hero__imageFrame">
      <img src="/najib.jpg" alt="Najib Jaafar" className="hero__image" />
    </div>

    <div className="hero__card hero__card--floating">
      <span>Peranan</span>
      <h3>Guru Sains & Tech Educator</h3>
      <p>
        Menggabungkan pendidikan, teknologi dan inovasi STEM untuk
        membina ekosistem pembelajaran yang lebih tersusun, kreatif dan
        berimpak tinggi.
      </p>
    </div>
  </div>
</section>
<section className="section projects">

  <div className="section__header">
    <p className="section__label">Projek Utama</p>
    <h2>Platform dan inovasi yang dibangunkan melalui CikguSTEM</h2>
  </div>

  <div className="cards">

    <div className="card">
      <h3>Seni Smart Lab</h3>
      <p>
        Sistem tempahan eksperimen makmal yang membantu guru merancang
        penggunaan makmal secara lebih sistematik dan teratur.
      </p>
      <a href="https://senismartlab.cikgustem.com">
        Buka Sistem →
      </a>
    </div>

    <div className="card">
      <h3>Inovasi STEM Sekolah</h3>
      <p>
        Projek STEM yang menggabungkan teknologi, eksperimen dan
        penyelesaian dunia sebenar untuk murid.
      </p>
    </div>

    <div className="card">
      <h3>EdTech Builder</h3>
      <p>
        Pembangunan aplikasi digital pendidikan untuk memudahkan
        pengurusan makmal, PdP dan inovasi sekolah.
      </p>
    </div>

  </div>

</section>

      <section className="section cards">
        {cards.map((card) => (
          <div className="card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <a
              href={card.link}
              {...(card.link.startsWith("http")
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {card.button} →
            </a>
          </div>
        ))}
      </section>

      <section id="about" className="section about">
        <div className="section__header">
          <p className="section__label">Tentang Saya</p>
          <h2>
            Profil profesional yang menggabungkan pendidikan, teknologi dan
            inovasi.
          </h2>
        </div>

        <div className="about__grid">
          <div className="about__box">
            Saya merupakan seorang guru sains yang berminat dalam inovasi STEM,
            pembangunan teknologi pendidikan dan penciptaan pengalaman
            pembelajaran yang lebih berkesan untuk murid.
          </div>

          <div className="about__box">
            Melalui cikgustem.com, saya menghimpunkan portfolio profesional,
            projek pendidikan, inovasi sekolah dan aplikasi digital yang dibina
            untuk menyokong komuniti guru.
          </div>

          <div className="about__box">
            Laman ini juga menjadi pusat kepada projek-projek utama seperti
            Seni Smart Lab serta inisiatif masa depan dalam bidang STEM, EdTech
            dan pembangunan pendidikan digital.
          </div>
        </div>
      </section>

      <section id="focus" className="section focus">
        <div className="section__header">
          <p className="section__label">Fokus Utama</p>
          <h2>Bidang yang sedang dibangunkan melalui CikguSTEM</h2>
        </div>

        <div className="focus__grid">
          {focusAreas.map((item) => (
            <div className="focus__item" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="achievements" className="section achievements">
        <div className="section__header">
          <p className="section__label">Pencapaian</p>
          <h2>Antara pengalaman dan pencapaian profesional</h2>
        </div>

        <div className="achievement__list">
          {achievements.map((item) => (
            <div className="achievement__item" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="gallery" className="section gallery">
        <div className="section__header">
          <p className="section__label">Galeri Aktiviti</p>
          <h2>Aktiviti STEM, inovasi dan penglibatan pendidikan</h2>
        </div>

        <div className="gallery__grid">
          {gallery.map((img, index) => (
            <div className="gallery__item" key={img}>
              <img src={img} alt={`Galeri ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="section cta">
        <div className="cta__box">
          <div>
            <p className="section__label">Portal Utama</p>
            <h2>
              cikgustem.com dibina sebagai pusat identiti profesional dan
              ekosistem digital pendidikan.
            </h2>
            <p>
              Dari sini, pelawat boleh mengenali latar belakang Najib Jaafar,
              melihat projek utama dan mengakses aplikasi seperti Seni Smart
              Lab.
            </p>
          </div>

          <a
            href="https://senismartlab.cikgustem.com"
            className="btn btn--primary"
            target="_blank"
            rel="noreferrer"
          >
            Lawati Seni Smart Lab
          </a>
        </div>
      </section>

      <section id="contact" className="section contact">
        <div className="section__header">
          <p className="section__label">Hubungi Saya</p>
          <h2>Untuk kerjasama, pertanyaan atau perkongsian idea</h2>
        </div>

        <div className="contact__grid">
          <div className="contact__info">
            <div className="contact__item">
              <h3>Email</h3>
              <p>najibnoor87@gmail.com</p>
            </div>
            <div className="contact__item">
              <h3>YouTube</h3>
              <p>Science Lab Production</p>
            </div>
            <div className="contact__item">
              <h3>Laman Web</h3>
              <p>cikgustem.com</p>
            </div>
          </div>

          <div className="contact__form">
            <form onSubmit={sendEmail}>
              <div className="form__group">
                <label htmlFor="name">Nama</label>
                <input
                  type="text"
                  id="name"
                  name="from_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form__group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="from_email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form__group">
                <label htmlFor="message">Mesej</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn--primary">
                Hantar Mesej
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">

  <p>© 2026 Najib Jaafar • cikgustem.com</p>

  <p>
    STEM Educator • Innovation • Education Technology
  </p>

</footer>
        </>
      )}
    </div>
  );
}