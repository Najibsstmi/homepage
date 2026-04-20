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
  const journeySectionIds = new Set([
    "journey-padang-line",
    "journey-microbit",
    "journey-mudball",
    "journey-plc",
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
  const [currentPage, setCurrentPage] = useState<"home" | "inovasi" | "modul">("home");
  const [readMore, setReadMore] = useState(false);
  const [eduTrackReadMore, setEduTrackReadMore] = useState(false);
  const [eduSlotReadMore, setEduSlotReadMore] = useState(false);
  const [totalVisitors, setTotalVisitors] = useState<string>("...");

  const ReadMore = ({
    children,
    open,
    onToggle,
    expandLabel = "Ketahui Lebih Lanjut",
    collapseLabel = "Lihat Ringkas",
    className = "",
    contentClassName = "",
  }: {
    children: React.ReactNode;
    open?: boolean;
    onToggle?: () => void;
    expandLabel?: string;
    collapseLabel?: string;
    className?: string;
    contentClassName?: string;
  }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = typeof open === "boolean";
    const isOpen = isControlled ? open : internalOpen;

    const handleToggle = () => {
      if (isControlled) {
        onToggle?.();
        return;
      }

      setInternalOpen((prev) => !prev);
    };

    return (
      <div className={`read-more ${className}`.trim()}>
        <div
          className={`read-more__content ${contentClassName} ${
            isOpen ? "" : "read-more__content--collapsed"
          }`.trim()}
        >
          {children}
          {!isOpen && <div className="read-more__fade" aria-hidden="true"></div>}
        </div>

        <div className="read-more__toggle">
          <button
            className={`inovasi-readmore__btn${isOpen ? " inovasi-readmore__btn--collapse" : ""}`}
            type="button"
            onClick={handleToggle}
          >
            {isOpen ? collapseLabel : expandLabel}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
            </svg>
          </button>
        </div>
      </div>
    );
  };

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
    const shouldOpenModul = params.get("page") === "modul";

    if (shouldOpenInovasi) {
      setCurrentPage("inovasi");
    } else if (shouldOpenModul) {
      setCurrentPage("modul");
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

  useEffect(() => {
    const fetchVisitorCount = async () => {
      try {
        const response = await fetch("https://cikgustem.goatcounter.com/counter/TOTAL.json");

        if (!response.ok) {
          throw new Error("Failed to fetch visitor count");
        }

        const data = await response.json();
        const count = Number(data?.count_unique ?? data?.count ?? 0);

        setTotalVisitors(count.toLocaleString("en-MY"));
      } catch (error) {
        console.error("Visitor counter error:", error);
        setTotalVisitors("1k");
      }
    };

    fetchVisitorCount();
  }, []);

  const navigateTo = (page: "home" | "inovasi" | "modul") => {
    setCurrentPage(page);
    setMobileMenuOpen(false);

    if (typeof window !== "undefined") {
      if (page === "home") {
        const homeUrl = new URL(window.location.href);
        homeUrl.searchParams.delete("page");
        homeUrl.hash = "";
        window.history.replaceState(null, "", `${homeUrl.pathname}${homeUrl.search}`);
      } else {
        const targetUrl = new URL(window.location.href);
        targetUrl.searchParams.set("page", page);
        window.history.replaceState(
          null,
          "",
          `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
        );
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToHomeSection = (sectionId: string) => {
    setCurrentPage("home");
    setMobileMenuOpen(false);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${sectionId}`);
    }

    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 180);
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

    const isInovasiTarget =
      smartLabSectionIds.has(targetId) ||
      eduTrackSectionIds.has(targetId) ||
      eduSlotSectionIds.has(targetId);

    const isJourneyTarget = journeySectionIds.has(targetId);

    const appUrl = new URL(window.location.href);
    appUrl.hash = "";
    appUrl.search = "";

    if (isInovasiTarget) {
      appUrl.searchParams.set("page", "inovasi");
    }

    if (targetId) {
      appUrl.hash = targetId;
    }

    const shareLandingUrl = new URL(window.location.href);
    shareLandingUrl.hash = "";
    shareLandingUrl.search = "";

    const landingFile = eduTrackSectionIds.has(targetId)
      ? "share-edutrack.html"
      : eduSlotSectionIds.has(targetId)
      ? "share-eduslot.html"
      : smartLabSectionIds.has(targetId)
      ? "share-smartlab.html"
      : isJourneyTarget
      ? "share-journey.html"
      : "";

    if (landingFile) {
      shareLandingUrl.pathname =
        shareLandingUrl.pathname.replace(/\/[^/]*$/, "/") + landingFile;
      shareLandingUrl.searchParams.set("target", targetId);
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
          <a href="#about" onClick={() => goToHomeSection("about")}>Tentang</a>
          <a href="#journey" onClick={() => goToHomeSection("journey")}>Perjalanan</a>
          <a href="#achievements" onClick={() => goToHomeSection("achievements")}>Pencapaian</a>
          <button
            className={`navbar__inovasi-btn${currentPage === "modul" ? " navbar__inovasi-btn--active" : ""}`}
            onClick={() => navigateTo("modul")}
          >
            Modul
          </button>
          <a href="#gallery" onClick={() => goToHomeSection("gallery")}>Galeri</a>
          <a href="#contact" onClick={() => goToHomeSection("contact")}>Hubungi</a>
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
              {readMore ? "Lihat Ringkas" : "Ketahui Lebih Lanjut"}
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

              <div className="eduslot__showcase">
                <img src="/edutrack (1).jpg" alt="EduTrack paparan utama sistem" />
                <span>Paparan utama EduTrack dengan fokus kepada analisis akademik murid</span>
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

            <div className="edutrack__gallery edutrack__gallery--preview">
              {[
                {
                  src: "/edutrack (2).jpg",
                  alt: "EduTrack paparan analisis peperiksaan",
                  caption: "Analisis peperiksaan dalam satu paparan",
                },
                {
                  src: "/edutrack (3).jpg",
                  alt: "EduTrack paparan sasaran akademik murid",
                  caption: "Sasaran akademik yang lebih tersusun",
                },
                {
                  src: "/edutrack (4).jpg",
                  alt: "EduTrack paparan headcount dan unjuran",
                  caption: "Headcount dan unjuran yang lebih jelas",
                },
              ].map((image) => (
                <figure className="edutrack__galleryItem" key={image.src}>
                  <img src={image.src} alt={image.alt} />
                  <figcaption>{image.caption}</figcaption>
                </figure>
              ))}
            </div>

            <ReadMore
              open={eduTrackReadMore}
              onToggle={() => setEduTrackReadMore((prev) => !prev)}
              className="eduslot__toggleWrap"
              contentClassName="eduslot__more"
            >
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
                <div className="edutrack__inlineVisual">
                  <img src="/edutrack (5).jpg" alt="EduTrack paparan data dan penetapan sasaran" />
                  <div className="edutrack__inlineVisualText">
                    <p className="eduslot__showcaseLabel">Sorotan Sistem</p>
                    <h3>Data tidak berhenti pada laporan, tetapi diterjemah menjadi tindakan.</h3>
                    <p>
                      Melalui paparan yang tersusun, guru boleh membaca prestasi semasa,
                      memahami jurang pencapaian dan menetapkan sasaran dengan lebih yakin.
                    </p>
                  </div>
                </div>
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
                <div className="edutrack__gallery edutrack__gallery--detail">
                  {[
                    {
                      src: "/edutrack (6).jpg",
                      alt: "EduTrack paparan pengurusan peperiksaan",
                      caption: "Kawalan peperiksaan diurus dengan lebih terancang",
                    },
                    {
                      src: "/edutrack (7).jpg",
                      alt: "EduTrack paparan analisis murid",
                      caption: "Analisis disesuaikan mengikut situasi sebenar murid",
                    },
                  ].map((image) => (
                    <figure className="edutrack__galleryItem" key={image.src}>
                      <img src={image.src} alt={image.alt} />
                      <figcaption>{image.caption}</figcaption>
                    </figure>
                  ))}
                </div>
                <p>
                  Apa yang membezakan EduTrack bukan sekadar teknologinya, tetapi cara ia
                  memahami kerja seorang guru. Masa itu terhad, keputusan perlu dibuat dengan
                  cepat, dan di sebalik setiap data ada seorang murid yang perlu dibimbing.
                  EduTrack dibina supaya data bukan hanya disimpan, tetapi benar-benar
                  digunakan untuk membantu membina masa depan murid.
                </p>
            </ReadMore>
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

            <ReadMore
              open={eduSlotReadMore}
              onToggle={() => setEduSlotReadMore((prev) => !prev)}
              className="eduslot__toggleWrap"
              contentClassName="eduslot__more"
            >
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
            </ReadMore>
          </section>

          <footer className="footer">
            <p>© 2026 Najib Jaafar • cikgustem.com</p>
            <p>STEM Educator • Innovation • Education Technology</p>
          </footer>
        </div>
      ) : currentPage === "modul" ? (
        <main className="modulesPage">
          <section className="modulesHero">
            <span className="modulesKicker">Modul</span>
            <h1>Modul Amalan Harian Sains</h1>
            <p>
              Modul Amalan Harian Sains (AHS) merupakan bahan pendidikan yang dibangunkan
              secara rasmi oleh Panel Perunding Mata Pelajaran (PPMP) Sains Negeri Johor
              di bawah Jabatan Pendidikan Negeri Johor. Edisi 2025 ini direka khusus untuk
              membantu murid Tingkatan 4 dan Tingkatan 5 menguasai silibus Sains melalui
              pendekatan yang lebih ringkas, teratur dan berfokus kepada kefahaman sebenar.
              Kandungannya merangkumi nota padat, penggunaan mnemonik dan akronim,
              penekanan kepada soalan lazim peperiksaan, serta rajah dan visual yang membantu
              murid memahami konsep saintifik dengan lebih jelas.
            </p>
          </section>

          <section className="modulesGrid">
            <article className="moduleCard">
              <div className="moduleMeta">
                <span className="moduleTag">Sains</span>
                <span className="moduleTag">Tingkatan 4</span>
              </div>

              <h3>Tingkatan 4</h3>

              <p>
                Fokus kepada pengukuhan konsep asas melalui nota padat, latihan harian
                dan aplikasi sains yang dekat dengan situasi kehidupan seharian.
              </p>

              <a href="/modules/sains/t4/%28AHS%29%20MODUL%20AMALAN%20HARIAN%20SAINS%20TINGKATAN%204.pdf" target="_blank" rel="noreferrer">
                Buka Modul →
              </a>
            </article>

            <article className="moduleCard">
              <div className="moduleMeta">
                <span className="moduleTag">Sains</span>
                <span className="moduleTag">Tingkatan 5</span>
              </div>

              <h3>Tingkatan 5</h3>

              <p>
                Fokus kepada pengukuhan konsep, aplikasi dan persediaan peperiksaan
                melalui ulang kaji berstruktur serta latihan pada topik penting.
              </p>

              <a href="/modules/sains/t5/%28AHS%29%20MODUL%20AMALAN%20HARIAN%20SAINS%20TINGKATAN%205.pdf" target="_blank" rel="noreferrer">
                Buka Modul →
              </a>
            </article>
          </section>
        </main>
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

      <section id="journey" className="section section-block">
        <div className="section-heading">
          <span className="section-kicker">Perjalanan & Fokus Saya</span>
          <h2>
            Dari bilik darjah, ke inovasi yang benar-benar membantu guru dan murid.
          </h2>
          <p>
            Saya percaya pendidikan yang bermakna bukan sekadar menyampaikan isi pelajaran,
            tetapi membina hala tuju, keyakinan dan potensi murid secara tersusun.
            Sebagai guru Sains, saya melihat sendiri bagaimana cabaran sebenar di sekolah
            sering memerlukan penyelesaian yang lebih praktikal, lebih jelas dan lebih dekat
            dengan realiti tugas guru.
          </p>
        </div>

        <div className="journey-grid">
          <div className="journey-card">
            <h3>Di dalam kelas</h3>
            <p>
              Saya memberi fokus kepada pengajaran Sains yang lebih hidup, berstruktur dan
              relevan dengan dunia sebenar. Aktiviti pembelajaran bukan hanya untuk faham
              konsep, tetapi untuk membina pemikiran, kemahiran menyelesaikan masalah dan
              minat murid terhadap STEM.
            </p>
          </div>

          <div className="journey-card">
            <h3>Di luar buku teks</h3>
            <p>
              Saya aktif membangunkan projek, aktiviti dan pengalaman pembelajaran yang
              menghubungkan murid dengan inovasi, eksperimen, teknologi dan kreativiti.
              Daripada projek STEM hinggalah kepada program sekolah, saya percaya murid belajar
              paling baik apabila mereka terlibat secara aktif.
            </p>
          </div>

          <div className="journey-card">
            <h3>Dalam sistem & inovasi</h3>
            <p>
              Daripada pengalaman sebenar sebagai guru, saya mula membangunkan penyelesaian
              digital seperti SmartLab dan EduTrack supaya kerja guru menjadi lebih teratur,
              keputusan lebih tepat, dan pengurusan pembelajaran murid dapat dibuat dengan
              lebih berfokus.
            </p>
          </div>
        </div>

        <article id="journey-padang-line" className="journey-post">
          <div className="journey-post__header">
            <div>
              <span className="section-kicker">Catatan Guru</span>
              <h3>
                Kadang-kadang, pembelajaran paling bermakna bermula di tempat yang langsung
                tidak kita sangka.
              </h3>
              <ShareBar title="Perjalanan Guru di Padang" anchor="#journey-padang-line" />
            </div>
          </div>

          <div className="journey-post__lead">
            <div className="journey-post__text">
              <p>
                Hari ini, saya tidak berada di dalam makmal Sains. Tiada eksperimen,
                tiada radas, tiada graf untuk dianalisis.
              </p>
              <p>
                Sebaliknya, saya berada di padang — memegang pita ukur, menanda garisan,
                dan memastikan setiap ukuran tepat. Sebagai guru, peranan saya tidak terhad
                kepada satu subjek sahaja. Selain mengajar Sains, saya juga memikul
                tanggungjawab sebagai guru Pendidikan Jasmani.
              </p>
              <p>
                Sedang saya menyiapkan garisan padang, perhatian saya tertarik kepada satu
                tompokan kuning yang pelik di permukaan tanah. Pada mulanya, ia kelihatan
                seperti kotoran biasa. Namun, sebagai seorang guru Sains, rasa ingin tahu itu
                sukar untuk diabaikan.
              </p>
            </div>

            <figure className="journey-post__heroImage">
              <img src="/gelek padang (1).jpg" alt="Aktiviti menanda garisan padang di sekolah" />
              <figcaption>Di padang juga, pemerhatian saintifik boleh bermula tanpa dirancang.</figcaption>
            </figure>
          </div>

          <ReadMore className="journey-post__readmore" contentClassName="journey-post__more">
            <div className="journey-post__gallery">
              {[
                {
                  src: "/gelek padang (2).jpg",
                  alt: "Permukaan padang sekolah ketika kerja pengukuran dibuat",
                  caption: "Ketepatan ukuran juga sebahagian daripada disiplin sains.",
                },
                {
                  src: "/gelek padang (3).jpg",
                  alt: "Tompokan kuning unik di atas tanah padang sekolah",
                  caption: "Daripada tompokan kecil, lahir persoalan yang besar.",
                },
                {
                  src: "/gelek padang (4).jpg",
                  alt: "Paparan dekat organisma slime mold di padang sekolah",
                  caption: "Dog vomit slime mold, organisma unik yang jarang diperhatikan.",
                },
              ].map((image) => (
                <figure className="journey-post__galleryItem" key={image.src}>
                  <img src={image.src} alt={image.alt} />
                  <figcaption>{image.caption}</figcaption>
                </figure>
              ))}
            </div>

            <div className="journey-post__body">
              <p>
                Rupa-rupanya, itu ialah sejenis organisma yang dikenali sebagai dog vomit slime
                mold — satu bentuk kulat unik yang jarang kita perasan walaupun ia wujud di
                persekitaran kita.
              </p>
              <p>
                Situasi ini mengingatkan saya bahawa Sains tidak hanya berlaku di dalam makmal.
                Ia sentiasa ada di sekeliling kita — di tanah, di udara, dan dalam perkara kecil
                yang sering kita abaikan.
              </p>
              <p>
                Membina garisan padang mungkin kelihatan seperti tugas teknikal biasa, tetapi di
                situlah prinsip sains dan pemerhatian bergabung. Daripada ketepatan ukuran
                hinggalah kepada penemuan kecil seperti ini, semuanya menjadi sebahagian daripada
                pengalaman pembelajaran.
              </p>

              <div className="journey-post__inlineVisual">
                <img src="/gelek padang (5).jpg" alt="Aktiviti di padang yang berkait dengan pemerhatian sains" />
                <div>
                  <span className="section-kicker">Sains Di Sekeliling Kita</span>
                  <h4>Pembelajaran sebenar kadang-kadang muncul ketika kita sedang menjalankan tugas biasa.</h4>
                  <p>
                    Sebagai guru, saya percaya pembelajaran sebenar berlaku apabila kita sentiasa
                    peka dan ingin tahu. Sama ada di dalam kelas atau di luar, setiap detik boleh
                    menjadi peluang untuk memahami dunia dengan lebih mendalam.
                  </p>
                </div>
              </div>

              <p>
                Dan mungkin, daripada perkara sekecil ini, lahir rasa ingin tahu yang lebih besar
                — bukan sahaja dalam diri saya, tetapi juga dalam diri murid-murid yang saya
                bimbing.
              </p>
            </div>

            <div className="journey-post__gallery journey-post__gallery--end">
              {[
                {
                  src: "/gelek padang (6).jpg",
                  alt: "Keadaan padang sekolah selepas kerja menanda selesai",
                  caption: "Tugas di luar kelas juga boleh menjadi ruang refleksi pendidikan.",
                },
                {
                  src: "/gelek padang (7).jpg",
                  alt: "Suasana padang sekolah sebagai ruang pembelajaran tidak formal",
                  caption: "Dari padang ke bilik darjah, rasa ingin tahu tetap membawa makna.",
                },
              ].map((image) => (
                <figure className="journey-post__galleryItem" key={image.src}>
                  <img src={image.src} alt={image.alt} />
                  <figcaption>{image.caption}</figcaption>
                </figure>
              ))}
            </div>

            <div className="journey-post__shareFooter">
              <ShareBar title="Perjalanan Guru di Padang" anchor="#journey-padang-line" />
            </div>
          </ReadMore>
        </article>

        <div className="journey-highlight">
          <h3>Apa yang saya perjuangkan dalam pendidikan</h3>
          <ul>
            <li>Pengajaran Sains yang aktif, jelas dan berimpak</li>
            <li>Inovasi STEM yang relevan dengan keperluan sebenar sekolah</li>
            <li>Sistem digital yang memudahkan tugas guru</li>
            <li>Pembinaan hala tuju akademik murid melalui data dan strategi</li>
          </ul>
        </div>

        <div className="journey-bridge">
          <p>
            Semua ini bukan bermula daripada idea atas kertas, tetapi daripada pengalaman
            sebenar di sekolah. Sebab itu setiap inovasi yang saya bangunkan sentiasa berpunca
            daripada satu soalan yang sama: bagaimana kita boleh menjadikan kerja guru lebih
            mudah dan pembelajaran murid lebih bermakna?
          </p>
          <button onClick={() => navigateTo("inovasi")} className="secondary-btn">
            Lihat Inovasi Saya
          </button>
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

      <section id="stats" className="statsSection">
        <div className="statsShell">
          <div className="statsHeading">
            <span className="statsKicker">Sorotan Ringkas</span>
            <h2>Perjalanan, inovasi dan impak yang sedang berkembang</h2>
            <p>
              Website ini menghimpunkan perkongsian saya sebagai guru, projek inovasi
              pendidikan dan pengalaman sebenar di sekolah.
            </p>
          </div>

          <div className="statsGrid">
            <article className="statCard statsCard statCardPrimary">
              <p className="statValue">{totalVisitors}+</p>
              <p className="statLabel">Pelawat</p>
              <span className="statHint">telah singgah ke CikguSTEM</span>
            </article>

            <article className="statCard statsCard">
              <p className="statValue">3</p>
              <p className="statLabel">Inovasi Utama</p>
              <span className="statHint">SmartLab, EduTrack dan EduSlot</span>
            </article>

            <article className="statCard statsCard">
              <p className="statValue">20+</p>
              <p className="statLabel">Aktiviti &amp; Perkongsian</p>
              <span className="statHint">pengalaman guru di bilik darjah dan luar kelas</span>
            </article>

            <article className="statCard statsCard">
              <p className="statValue">2</p>
              <p className="statLabel">Bidang Pengajaran</p>
              <span className="statHint">Sains dan Pendidikan Jasmani</span>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" className="section contact contactSection">
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

          <div className="contact__form contactCard">
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