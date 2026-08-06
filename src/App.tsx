import "./App.css";
import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import SimulatorPage from "./pages/SimulatorPage";

const VISITOR_COUNT_FALLBACK = "1,000+";

const formatVisitorCount = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const rawValue = String(value).trim();
  const compactValue = rawValue.match(/^([\d,.]+)\s*([kmb])?$/i);
  const multiplier = compactValue?.[2]?.toLowerCase();
  const normalizedValue = compactValue
    ? compactValue[1].replace(/,/g, "")
    : rawValue.replace(/[^\d.-]/g, "");

  if (!/\d/.test(normalizedValue)) {
    return null;
  }

  const count =
    Number(normalizedValue) *
    (multiplier === "b" ? 1_000_000_000 : multiplier === "m" ? 1_000_000 : multiplier === "k" ? 1_000 : 1);

  if (!Number.isFinite(count)) {
    return null;
  }

  return `${Math.max(0, Math.round(count)).toLocaleString("en-MY")}+`;
};

export default function App() {
  type Page =
    | "home"
    | "about"
    | "inovasi"
    | "modul"
    | "banksoalan"
    | "rpm"
    | "plc"
    | "panitia-sains"
    | "panitia-matematik"
    | "simulator";
  type SharePlatform = "facebook" | "whatsapp" | "telegram" | "x";
  const mrccJourneyId = "journey-sumpit-v1-mrcc-uthm-2026";
  const mrccJourneySlug = "sumpit-v1-naib-johan-mrcc-uthm-2026";
  const mrccJourneyTitle =
    "Sumpit V1 di MRCC UTHM: Naib Johan yang Membawa Kami ke Final Kebangsaan";
  const mrccJourneyCardTitle = "Sumpit V1 Naib Johan MRCC UTHM";
  const mrccJourneyDescription =
    "Catatan perjalanan Cikgu Najib bersama Cikgu Nurulain binti Nardir dan murid pasukan Sumpit V1 sehingga meraih Naib Johan MRCC di UTHM serta melayakkan diri ke final kebangsaan di Perak.";
  const kidPgJourneyId = "journey-edusim-kid-pg-2026";
  const kidPgJourneySlug = "edusim-karnival-inovasi-daerah-pasir-gudang-2026";
  const kidPgJourneyTitle =
    "Dari Bilik Darjah ke Pentas Inovasi: Perjalanan EduSim di KID-PG 2026";
  const kidPgJourneyCardTitle = "EduSim di Karnival Inovasi Daerah Pasir Gudang 2026";
  const kidPgJourneyDescription =
    "Catatan perjalanan Mohd Najib bin Jaafar membawa inovasi EduSim ke Karnival Inovasi Daerah Pasir Gudang 2026 sehingga memenangi Anugerah 3 Minutes Pitching Terbaik dan Anugerah Inovasi Terbaik.";
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
    mrccJourneyId,
    kidPgJourneyId,
    "journey-catatan-seorang-menantu",
    "journey-guru-cemerlang-ksl",
    "journey-padang-line",
    "journey-microbit",
    "journey-mudball",
    "journey-plc",
  ]);
  const eduTrackSectionIds = new Set(["edutrack-post"]);
  const eduSlotSectionIds = new Set(["eduslot-post"]);
  const rpmSectionIds = new Set(["rpm-2026-2035"]);
  const plcSectionIds = new Set(["plc-guru-sains"]);
  const managementPages = new Set<Page>(["panitia-sains", "panitia-matematik"]);
  const smartLabHiddenSectionIds = new Set([
    "smartlab-cara",
    "smartlab-status",
    "smartlab-falsafah",
  ]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [simulatorRouteVersion, setSimulatorRouteVersion] = useState(0);
  const [modulMenuOpen, setModulMenuOpen] = useState(false);
  const [pengurusanMenuOpen, setPengurusanMenuOpen] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const [eduTrackReadMore, setEduTrackReadMore] = useState(false);
  const [eduSlotReadMore, setEduSlotReadMore] = useState(false);
  const [mrccReadMore, setMrccReadMore] = useState(false);
  const [kidPgReadMore, setKidPgReadMore] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [shareNoticeByAnchor, setShareNoticeByAnchor] = useState<Record<string, string>>({});
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
    const pathName = window.location.pathname;
    const targetParam = params.get("target") || "";
    const hashTarget = window.location.hash.replace(/^#/, "") || targetParam;
    const isMrccJourneyTarget =
      hashTarget === mrccJourneyId || pathName.includes(mrccJourneySlug);
    const isKidPgJourneyTarget =
      hashTarget === kidPgJourneyId || pathName.includes(kidPgJourneySlug);
    const shouldOpenInovasi =
      params.get("page") === "inovasi" ||
      smartLabSectionIds.has(hashTarget) ||
      eduTrackSectionIds.has(hashTarget) ||
      eduSlotSectionIds.has(hashTarget);
    const shouldOpenAbout = params.get("page") === "about" || hashTarget === "about";
    const shouldOpenModul = params.get("page") === "modul";
    const shouldOpenBankSoalan = params.get("page") === "banksoalan";
    const shouldOpenRpm = params.get("page") === "rpm" || rpmSectionIds.has(hashTarget);
    const shouldOpenPlc = params.get("page") === "plc" || plcSectionIds.has(hashTarget);
    const shouldOpenPanitiaSains = params.get("page") === "panitia-sains";
    const shouldOpenPanitiaMatematik = params.get("page") === "panitia-matematik";
    const shouldOpenSimulator =
      params.get("page") === "simulator" || pathName.startsWith("/simulator");

    if (shouldOpenInovasi) {
      setCurrentPage("inovasi");
    } else if (shouldOpenSimulator) {
      setCurrentPage("simulator");
    } else if (shouldOpenAbout) {
      setCurrentPage("about");
    } else if (shouldOpenRpm) {
      setCurrentPage("rpm");
    } else if (shouldOpenPlc) {
      setCurrentPage("plc");
    } else if (shouldOpenPanitiaSains) {
      setCurrentPage("panitia-sains");
    } else if (shouldOpenPanitiaMatematik) {
      setCurrentPage("panitia-matematik");
    } else if (shouldOpenBankSoalan) {
      setCurrentPage("banksoalan");
    } else if (shouldOpenModul) {
      setCurrentPage("modul");
    }

    if (smartLabHiddenSectionIds.has(hashTarget)) {
      setReadMore(true);
    }

    if (isMrccJourneyTarget) {
      setMrccReadMore(true);
      document.title = `${mrccJourneyTitle} | CikguSTEM`;
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", mrccJourneyDescription);
      document
        .querySelector('link[rel="canonical"]')
        ?.setAttribute("href", `https://www.cikgustem.com/${mrccJourneySlug}.html`);
    }

    if (isKidPgJourneyTarget) {
      setKidPgReadMore(true);
      document.title = `${kidPgJourneyTitle} | CikguSTEM`;
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", kidPgJourneyDescription);
      document
        .querySelector('link[rel="canonical"]')
        ?.setAttribute("href", `https://www.cikgustem.com/${kidPgJourneySlug}.html`);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const targetParam = params.get("target") || "";
    const hashTarget = window.location.hash.replace(/^#/, "") || targetParam;
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
  }, [currentPage, readMore, eduTrackReadMore, eduSlotReadMore, mrccReadMore, kidPgReadMore]);

  useEffect(() => {
    const fetchVisitorCount = async () => {
      try {
        const response = await fetch("https://cikgustem.goatcounter.com/counter/TOTAL.json");

        if (!response.ok) {
          throw new Error("Failed to fetch visitor count");
        }

        const data = await response.json();
        const count = formatVisitorCount(data?.count_unique ?? data?.count);

        if (!count) {
          throw new Error("Invalid visitor count");
        }

        setTotalVisitors(count);
      } catch (error) {
        console.error("Visitor counter error:", error);
        setTotalVisitors(VISITOR_COUNT_FALLBACK);
      }
    };

    fetchVisitorCount();
  }, []);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setModulMenuOpen(false);
    setPengurusanMenuOpen(false);

    if (typeof window !== "undefined") {
      if (page === "home") {
        const homeUrl = new URL(window.location.href);
        homeUrl.searchParams.delete("page");
        homeUrl.hash = "";
        window.history.replaceState(null, "", `/${homeUrl.search}`);
      } else if (page === "simulator") {
        window.history.replaceState(null, "", "/simulator");
        setSimulatorRouteVersion((version) => version + 1);
      } else {
        const targetUrl = new URL(window.location.href);
        targetUrl.searchParams.set("page", page);
        targetUrl.hash = "";
        window.history.replaceState(
          null,
          "",
          `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
        );
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openSimulator = (path: string) => {
    setCurrentPage("simulator");
    setMobileMenuOpen(false);
    setModulMenuOpen(false);
    setPengurusanMenuOpen(false);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", path);
      setSimulatorRouteVersion((version) => version + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToHomeSection = (sectionId: string) => {
    setCurrentPage("home");
    setMobileMenuOpen(false);
    setModulMenuOpen(false);
    setPengurusanMenuOpen(false);

    if (typeof window !== "undefined") {
      const targetUrl = new URL(window.location.href);
      targetUrl.searchParams.delete("page");
      targetUrl.pathname = "/";
      targetUrl.hash = sectionId;
      window.history.replaceState(
        null,
        "",
        `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
      );
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

    const publicSiteUrl = "https://www.cikgustem.com";
    const targetId = anchor.replace(/^#/, "");

    const isInovasiTarget =
      smartLabSectionIds.has(targetId) ||
      eduTrackSectionIds.has(targetId) ||
      eduSlotSectionIds.has(targetId);

    const isJourneyTarget = journeySectionIds.has(targetId);
    const isRpmTarget = rpmSectionIds.has(targetId);
    const isPlcTarget = plcSectionIds.has(targetId);

    const appUrl = new URL(publicSiteUrl);
    appUrl.hash = "";
    appUrl.search = "";

    if (isInovasiTarget) {
      appUrl.searchParams.set("page", "inovasi");
    }

    if (isRpmTarget) {
      appUrl.searchParams.set("page", "rpm");
    }

    if (isPlcTarget) {
      appUrl.searchParams.set("page", "plc");
    }

    if (targetId) {
      appUrl.hash = targetId;
    }

    const shareLandingUrl = new URL(publicSiteUrl);
    shareLandingUrl.hash = "";
    shareLandingUrl.search = "";

    const landingFile = eduTrackSectionIds.has(targetId)
      ? "share-edutrack.html"
      : eduSlotSectionIds.has(targetId)
      ? "share-eduslot.html"
      : smartLabSectionIds.has(targetId)
      ? "share-smartlab.html"
      : targetId === "journey-catatan-seorang-menantu"
      ? "share-catatan-seorang-menantu.html"
      : targetId === "journey-guru-cemerlang-ksl"
      ? "share-guru-cemerlang.html"
      : targetId === mrccJourneyId
      ? `${mrccJourneySlug}.html`
      : targetId === kidPgJourneyId
      ? `${kidPgJourneySlug}.html`
      : isRpmTarget
      ? "share-rpm-2026-2035.html"
      : isPlcTarget
      ? "share-plc-guru-sains.html"
      : isJourneyTarget
      ? "share-journey.html"
      : "";

    if (landingFile) {
      shareLandingUrl.pathname = `/${landingFile}`;
      if (landingFile === "share-journey.html" && targetId) {
        shareLandingUrl.searchParams.set("target", targetId);
      }
      return shareLandingUrl.toString();
    }

    return appUrl.toString();
  };

  const showShareNotice = (anchor: string, message: string) => {
    setShareNoticeByAnchor((current) => ({
      ...current,
      [anchor]: message,
    }));

    window.setTimeout(() => {
      setShareNoticeByAnchor((current) => {
        const next = { ...current };
        delete next[anchor];
        return next;
      });
    }, 2600);
  };

  const openSocialShare = (platform: SharePlatform, title: string, anchor: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const url = encodeURIComponent(getShareUrl(anchor));
    const text = encodeURIComponent(`Jom lihat ${title} di CikguSTEM.`);

    const shareLinkByPlatform: Record<SharePlatform, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
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
      showShareNotice(anchor, "Pautan telah disalin.");
    } catch {
      window.prompt("Salin pautan ini:", url);
    }
  };

  const nativeShare = async (title: string, anchor: string) => {
    if (!navigator.share) {
      await copyShareLink(anchor);
      return;
    }

    const url = getShareUrl(anchor);

    try {
      await navigator.share({
        title,
        text: `Jom lihat ${title} di CikguSTEM.`,
        url,
      });
      showShareNotice(anchor, "Panel perkongsian dibuka.");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        await copyShareLink(anchor);
      }
    }
  };

  const ShareBar = ({ title, anchor }: { title: string; anchor: string }) => {
    const shareNotice = shareNoticeByAnchor[anchor];

    return (
      <div className="share-row" aria-label={`Kongsi ${title}`}>
        <span className="share-row__label">Kongsi:</span>
        {canNativeShare && (
          <button
            type="button"
            className="share-row__btn share-row__btn--native"
            onClick={() => nativeShare(title, anchor)}
            aria-label={`Kongsi ${title} menggunakan fungsi perkongsian peranti`}
          >
            Kongsi
          </button>
        )}
        {sharePlatforms.map(({ platform, label }) => (
          <button
            type="button"
            key={`${anchor}-${platform}`}
            className={`share-row__btn share-row__btn--${platform}`}
            onClick={() => openSocialShare(platform, title, anchor)}
            aria-label={`Kongsi ${title} melalui ${label}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="share-row__btn share-row__btn--copy"
          onClick={() => copyShareLink(anchor)}
          aria-label={`Salin pautan ${title}`}
        >
          Salin Link
        </button>
        {shareNotice && (
          <span className="share-row__notice" role="status" aria-live="polite">
            {shareNotice}
          </span>
        )}
      </div>
    );
  };

  const menantuImageBase = "/PERJALANAN/Catatan seorang menantu";
  const menantuImages = {
    memorial: `${menantuImageBase}/WhatsApp Image 2026-05-25 at 02.42.31.jpeg`,
    hospitalFarewell: `${menantuImageBase}/WhatsApp Image 2026-05-25 at 04.53.14.jpeg`,
    burial: `${menantuImageBase}/WhatsApp Image 2026-05-25 at 13.32.58.jpeg`,
    familyMemory: `${menantuImageBase}/WhatsApp Image 2026-05-26 at 00.27.30.jpeg`,
    vanJenazah: `${menantuImageBase}/WhatsApp Image 2026-05-26 at 18.31.12.jpeg`,
    ambulanceInside: `${menantuImageBase}/WhatsApp Image 2026-05-30 at 09.42.23.jpeg`,
    ambulanceArrival: `${menantuImageBase}/WhatsApp Image 2026-05-30 at 09.42.24.jpeg`,
  };

  const kidPgImageBase = "/PERJALANAN/KID PASIR GUDANG 2026/webp";
  const kidPgImages = {
    hero: `${kidPgImageBase}/edusim-kipmall-masai-hero.webp`,
    suasana: `${kidPgImageBase}/edusim-kipmall-masai-suasana.webp`,
    pitchingWide: `${kidPgImageBase}/edusim-kipmall-masai-pitching-01.webp`,
    pitchingDemo: `${kidPgImageBase}/edusim-kipmall-masai-pitching-02.webp`,
    reruai: `${kidPgImageBase}/edusim-kipmall-masai-reruai.webp`,
    poster: `${kidPgImageBase}/kid-pg-2026-poster.webp`,
    pempamer: `${kidPgImageBase}/kid-pg-2026-senarai-pempamer.webp`,
    pesertaPitching: `${kidPgImageBase}/kid-pg-2026-senarai-peserta-pitching.webp`,
  };

  const kidPgTags = [
    "EduSim",
    "Inovasi Pendidikan",
    "Simulator Sains",
    "KID-PG 2026",
    "Guru Cemerlang",
    "Kecerdasan Buatan",
    "DELIMa",
    "Teknologi Pendidikan",
  ];

  const mrccImageBase = "/PERJALANAN/MRCC/webp";
  const mrccImages = {
    hero: `${mrccImageBase}/sumpit-v1-mrcc-award-ceremony.webp`,
    judging: `${mrccImageBase}/sumpit-v1-mrcc-presentation-judging.webp`,
    booth: `${mrccImageBase}/sumpit-v1-mrcc-team-booth.webp`,
    fieldTeam: `${mrccImageBase}/sumpit-v1-mrcc-launch-field-team.webp`,
    fieldPrep: `${mrccImageBase}/sumpit-v1-mrcc-field-prep.webp`,
    naibJohan: `${mrccImageBase}/sumpit-v1-mrcc-naib-johan-portrait.webp`,
    launchTeam: `${mrccImageBase}/sumpit-v1-mrcc-launch-team-portrait.webp`,
    rocketCheck: `${mrccImageBase}/sumpit-v1-mrcc-rocket-check.webp`,
    boothTeam: `${mrccImageBase}/sumpit-v1-mrcc-booth-team.webp`,
    boothUthm: `${mrccImageBase}/sumpit-v1-mrcc-booth-uthm.webp`,
  };

  const mrccTags = [
    "MRCC",
    "Sumpit V1",
    "Model Roket",
    "OpenRocket",
    "UTHM",
    "Naib Johan",
    "Solid Fuel 1 km",
    "Final Kebangsaan",
  ];

  const plcVisuals = {
    cover: "/PERKONGSIAN/PLC/kit-plc-cover-crop.jpg",
    focusImproveShare: "/PERKONGSIAN/PLC/kit-plc-focus-improve-share.jpg",
    strategyTools: "/PERKONGSIAN/PLC/kit-plc-strategi-alat.jpg",
    learningWalk: "/PERKONGSIAN/PLC/kit-plc-learning-walk.jpg",
    lessonStudy: "/PERKONGSIAN/PLC/kit-plc-lesson-study.jpg",
    pbd: "/PERKONGSIAN/PLC/kit-plc-pbd.jpg",
  };

  const plcCycleSteps = [
    {
      label: "Focus",
      title: "Kenal pasti isu sebenar",
      text: "Mulakan dengan bukti pembelajaran murid seperti rekod PBD, analisis item, buku amali, pemerhatian kerja kumpulan atau respon murid semasa eksperimen.",
    },
    {
      label: "Improve",
      title: "Baiki PdP secara kolaboratif",
      text: "Pilih satu alat PLC yang sesuai, rancang tindakan kecil, cuba di bilik darjah atau makmal, kemudian lihat semula kesannya kepada pemahaman murid.",
    },
    {
      label: "Share",
      title: "Sebarkan amalan yang menjadi",
      text: "Kongsi bahan, RPH, rubrik, strategi soalan, video pendek atau dapatan data supaya guru Sains lain boleh menyesuaikannya mengikut kelas masing-masing.",
    },
  ];

  const plcScienceMethods = [
    {
      title: "Dialog Prestasi",
      subtitle: "Performance Dialogue",
      bestFor: "Membaca data PBD, UASA, peperiksaan atau ujian topikal.",
      science: "Sesuai untuk melihat topik yang ramai murid belum kuasai, contohnya graf gerakan, elektrik, kadar tindak balas, mikroorganisma atau pewarisan.",
    },
    {
      title: "Kelab Buku",
      subtitle: "Book Club",
      bestFor: "Membina budaya membaca bahan profesional dan pedagogi Sains.",
      science: "Guru boleh membaca bab berkaitan inkuiri, STEM, KBAT, miskonsepsi Sains atau pentaksiran amali, kemudian pilih idea yang boleh dicuba dalam PdP.",
    },
    {
      title: "Kumpulan Belajar Guru",
      subtitle: "Teacher Study Group",
      bestFor: "Mendalami satu isu pengajaran secara berfokus.",
      science: "Contohnya kumpulan kecil panitia mengkaji cara mengajar pemboleh ubah, kemahiran mengeksperimen, pembinaan inferens atau penulisan kesimpulan.",
    },
    {
      title: "Kritikan Video",
      subtitle: "Video Critique",
      bestFor: "Menilai rakaman PdP secara profesional dan berhemah.",
      science: "Rakam sebahagian aktiviti eksperimen atau perbincangan murid, kemudian lihat semula aspek arahan guru, soalan mencungkil idea dan penglibatan murid.",
    },
    {
      title: "Jelajah Pembelajaran",
      subtitle: "Learning Walk",
      bestFor: "Melihat amalan bilik darjah atau makmal tanpa mengganggu PdP.",
      science: "Fokus pemerhatian boleh jadi keselamatan makmal, penggunaan radas, komunikasi kumpulan, catatan pemerhatian atau cara murid membuat justifikasi.",
    },
    {
      title: "Bimbingan Rakan Sekerja",
      subtitle: "Peer Coaching",
      bestFor: "Membantu guru melalui pemerhatian dan maklum balas rakan.",
      science: "Guru boleh meminta rakan melihat satu kemahiran tertentu, seperti demonstrasi radas, pengurusan eksperimen, scaffolding graf atau soalan KBAT.",
    },
    {
      title: "Lesson Study",
      subtitle: "Belajar Menggunakan RPH",
      bestFor: "Membina, mencuba dan memurnikan RPH bersama-sama.",
      science: "Sangat sesuai untuk topik sukar atau aktiviti amali. Satu guru mengajar, rakan lain memerhati respons murid, kemudian RPH dimurnikan.",
    },
    {
      title: "Sesi Perkongsian Guru",
      subtitle: "Teacher Sharing Session",
      bestFor: "Berkongsi amalan pedagogi yang praktikal dan cepat dicuba.",
      science: "Contohnya perkongsian teknik mengajar graf, penggunaan simulasi, cara menanda soalan struktur, idea aktiviti stesen atau bahan ulang kaji topik tertentu.",
    },
    {
      title: "Analisis Data",
      subtitle: "Data Analysis",
      bestFor: "Menukar data mentah kepada pelan intervensi.",
      science: "Panitia boleh analisis item, TP PBD, keputusan amali atau miskonsepsi lazim, kemudian tetapkan kumpulan sasaran dan tindakan susulan.",
    },
    {
      title: "Kumpulan Rakan Kritik",
      subtitle: "Critical Friends Group",
      bestFor: "Mendapat maklum balas jujur dalam suasana saling percaya.",
      science: "Gunakan untuk menyemak RPH, instrumen PBD, rubrik amali, soalan KBAT atau bahan modul sebelum digunakan kepada murid.",
    },
    {
      title: "Induksi dan Pementoran Guru Baharu",
      subtitle: "New Teacher Induction and Mentoring",
      bestFor: "Menyokong guru baharu atau guru yang bertukar opsyen.",
      science: "Mentor boleh membimbing rutin makmal, keselamatan, penyediaan amali, pengurusan buku amali dan strategi mengajar konsep abstrak.",
    },
    {
      title: "Kumpulan Penyelesai Masalah",
      subtitle: "Problem Solving Group",
      bestFor: "Menyelesaikan masalah khusus yang menghalang pembelajaran.",
      science: "Contohnya isu radas tidak cukup, murid lemah menulis inferens, kelas pasif semasa perbincangan atau kerja amali tidak siap mengikut masa.",
    },
    {
      title: "Pasukan Melintang dan Menegak",
      subtitle: "Horizontal and Vertical Teams",
      bestFor: "Menyelaras kandungan antara kelas, tingkatan dan tahap.",
      science: "Guru tingkatan sama boleh selaras bahan dan pentaksiran, manakala guru tingkatan berbeza boleh menyambung kemahiran Sains dari Tingkatan 1 hingga 5.",
    },
  ];

  const plcScienceSituations = [
    {
      title: "Apabila topik Sains sukar dikuasai",
      methods: "Analisis Data + Dialog Prestasi + Lesson Study",
      text: "Gunakan data murid untuk mengenal pasti punca, bina semula PdP bersama rakan, kemudian nilai sama ada pemahaman murid meningkat selepas intervensi.",
    },
    {
      title: "Apabila eksperimen kurang lancar",
      methods: "Learning Walk + Peer Coaching",
      text: "Perhatikan rutin keselamatan, arahan guru, susunan radas dan peranan murid dalam kumpulan. Maklum balas rakan membantu guru membetulkan bahagian yang kecil tetapi kritikal.",
    },
    {
      title: "Apabila panitia mahu selaras PBD",
      methods: "Critical Friends Group + Pasukan Melintang",
      text: "Semak evidens, rubrik, instrumen dan standard prestasi bersama-sama supaya pertimbangan profesional guru lebih konsisten antara kelas.",
    },
    {
      title: "Apabila ada amalan baik yang patut disebar",
      methods: "Teacher Sharing Session + Video Critique",
      text: "Kongsikan strategi yang sudah menjadi, tunjuk bukti pembelajaran murid dan sediakan bahan ringkas supaya guru lain mudah mencuba.",
    },
  ];

  const plcStarterPlan = [
    "Pilih satu isu kecil yang jelas, contohnya murid tidak dapat membezakan pemerhatian dengan inferens.",
    "Bawa bukti ringkas: contoh jawapan murid, data PBD, gambar kerja amali atau catatan pemerhatian guru.",
    "Pilih satu alat PLC yang sesuai dan tetapkan tindakan yang boleh dibuat dalam 1 hingga 2 minggu.",
    "Kumpul semula evidens selepas tindakan, kemudian bincang sama ada strategi itu perlu dikekalkan, diubah atau dikongsi.",
    "Rekodkan aktiviti dalam SPLKPM mengikut ketetapan sekolah supaya pembangunan profesional guru terdokumentasi.",
  ];

  const rpmStrategicCores = [
    {
      number: 1,
      title: "Memastikan Sistem Pendidikan Malaysia yang Terangkum, Dinamik dan Relevan",
      points: [
        "Memperkasa Pendidikan Sains dan Matematik.",
        "Memperkukuh penguasaan Bahasa Melayu dan Bahasa Inggeris.",
        "Menambah baik sistem pentaksiran.",
        "Memastikan struktur persekolahan sentiasa relevan.",
        "Menjadikan sistem pendidikan lebih responsif terhadap perubahan dunia.",
      ],
      teacher: "Guru perlu bersedia dengan perubahan kurikulum, pentaksiran dan pendekatan PdP yang lebih berfokus kepada kompetensi murid, bukan sekadar peperiksaan.",
    },
    {
      number: 2,
      title: "Mengoptimumkan Potensi Setiap Murid Melalui Pengalaman Pembelajaran yang Bermakna",
      points: [
        "Reformasi kurikulum.",
        "Literasi dan numerasi yang kukuh.",
        "Kemahiran abad ke-21.",
        "STEM, TVET, sukan dan seni.",
        "Kesejahteraan fizikal, mental dan sosial murid.",
        "Pembangunan karakter dan jati diri.",
      ],
      teacher: "PdP perlu memberi pengalaman pembelajaran yang autentik, menyeronokkan dan bermakna. Murid bukan sahaja perlu tahu fakta, tetapi mampu berfikir, menyelesaikan masalah dan berkomunikasi dengan baik.",
    },
    {
      number: 3,
      title: "Mentransformasikan Pendidik agar Berkeupayaan Tinggi dan Berorientasikan Masa Hadapan",
      points: [
        "Mengurangkan beban tugas bukan pengajaran.",
        "Meningkatkan kesejahteraan guru.",
        "Memperkasa latihan dan pembangunan profesionalisme berterusan.",
        "Melahirkan pemimpin pendidikan masa hadapan.",
        "Membudayakan penyelidikan dan inovasi pendidikan.",
      ],
      teacher: "Guru perlu sentiasa meningkatkan kompetensi, menguasai teknologi baharu termasuk AI, serta membudayakan amalan refleksi, penyelidikan dan inovasi dalam bilik darjah.",
    },
    {
      number: 4,
      title: "Memantapkan Prasarana Fizikal dan Digital di Semua Institusi Pendidikan KPM",
      points: [
        "Kemudahan sekolah yang selamat dan lestari.",
        "Internet berkelajuan tinggi.",
        "Penggunaan teknologi digital dalam pembelajaran.",
        "Pengurusan data pendidikan yang lebih pintar.",
        "Pembelajaran diperibadikan menggunakan teknologi AI.",
      ],
      teacher: "Guru perlu bersedia memanfaatkan kemudahan digital secara optimum dan mengintegrasikan teknologi dalam PdP untuk meningkatkan keberkesanan pembelajaran.",
    },
    {
      number: 5,
      title: "Mempergiat Sinergi antara Institusi Pendidikan dengan Pihak Berkepentingan",
      points: [
        "Sekolah, ibu bapa dan komuniti.",
        "Alumni dan industri.",
        "NGO serta agensi kerajaan dan swasta.",
      ],
      teacher: "Guru perlu membina jaringan kolaboratif yang dapat membantu memperkayakan pengalaman pembelajaran murid melalui program, mentor industri, STEM outreach dan pembelajaran berasaskan komuniti.",
    },
    {
      number: 6,
      title: "Membudayakan Kemampanan dalam Ekosistem Pendidikan",
      points: [
        "Pendidikan untuk Pembangunan Mampan (ESD).",
        "Teknologi hijau.",
        "Kelestarian alam sekitar.",
        "Pengurusan sumber secara bertanggungjawab.",
        "Murid sebagai agen perubahan masyarakat.",
      ],
      teacher: "Nilai kemampanan perlu diterapkan merentas kurikulum dan kokurikulum. Murid bukan sekadar belajar tentang alam sekitar, tetapi digalakkan mengambil tindakan untuk menyelesaikan isu sebenar di komuniti mereka.",
    },
    {
      number: 7,
      title: "Meningkatkan Kecekapan Tadbir Urus dan Sistem Penyampaian",
      points: [
        "Tadbir urus yang lebih cekap.",
        "Pelaksanaan autonomi sekolah.",
        "Pengoptimuman sumber dan fasiliti.",
        "Pengurusan risiko dan perubahan yang sistematik.",
        "Komunikasi yang lebih telus dan berkesan.",
      ],
      teacher: "Budaya kerja yang lebih cekap, penggunaan data untuk membuat keputusan serta pengurusan sekolah yang lebih fleksibel dijangka menjadi amalan utama dalam tempoh RPM ini.",
    },
  ];

  const rpmTargets = [
    "Semua murid menguasai literasi dan numerasi.",
    "Murid mencapai sekurang-kurangnya gred C bagi BM, BI, Matematik dan Sejarah.",
    "Murid menguasai kemahiran digital.",
    "Murid cergas dari segi fizikal dan sejahtera dari segi emosi.",
    "Murid menguasai dwibahasa.",
    "Murid mampu berfikir secara kritis dan kreatif.",
    "Institusi pendidikan menjadi lebih lestari dan berteknologi tinggi.",
  ];

  const achievements = [
    "Naib Johan MRCC UTHM 2026 - Pasukan Sumpit V1",
    "Johan Pertandingan Inovasi Terbaik Karnival Inovasi Daerah Pasir Gudang 2026",
    "Pembentang 3 Minutes Pitching Terbaik Karnival Inovasi Daerah Pasir Gudang 2026",
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

  type ManagementPageId = "panitia-sains" | "panitia-matematik";
  const managementContent: Record<
    ManagementPageId,
    {
      title: string;
      lead: string;
      tags: string[];
      cards: Array<{ title: string; text: string }>;
    }
  > = {
    "panitia-sains": {
      title: "Panitia Sains",
      lead:
        "Ruang pengurusan untuk menyusun maklumat Panitia Sains seperti carta organisasi, takwim, mesyuarat, program, analisis pencapaian dan evidens aktiviti.",
      tags: ["Sains", "Makmal", "PLC", "PBD"],
      cards: [
        {
          title: "Maklumat Panitia",
          text: "Letakkan senarai guru, ketua panitia, bidang tugas, kelas yang diajar dan dokumen rujukan utama panitia.",
        },
        {
          title: "Program & Aktiviti",
          text: "Susun takwim, program peningkatan akademik, aktiviti makmal, STEM, inovasi dan intervensi murid.",
        },
        {
          title: "Analisis & Evidens",
          text: "Kumpulkan analisis peperiksaan, PBD, laporan post-mortem, minit mesyuarat dan gambar aktiviti panitia.",
        },
      ],
    },
    "panitia-matematik": {
      title: "Panitia Matematik",
      lead:
        "Ruang pengurusan untuk menghimpunkan maklumat Panitia Matematik termasuk guru, program, intervensi, analisis pencapaian dan bahan sokongan pembelajaran.",
      tags: ["Matematik", "Numerasi", "Intervensi", "PBD"],
      cards: [
        {
          title: "Maklumat Panitia",
          text: "Letakkan senarai guru, ketua panitia, pembahagian kelas, bidang tugas dan dokumen pengurusan Matematik.",
        },
        {
          title: "Program & Intervensi",
          text: "Susun aktiviti panitia, program pengukuhan numerasi, bengkel teknik menjawab dan pelan sokongan murid.",
        },
        {
          title: "Analisis & Evidens",
          text: "Kumpulkan data pencapaian, analisis item, laporan program, minit mesyuarat dan evidens pelaksanaan.",
        },
      ],
    },
  };
  const activeManagementContent = managementPages.has(currentPage)
    ? managementContent[currentPage as ManagementPageId]
    : null;

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
          type="button"
          aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`navbar__links ${mobileMenuOpen ? "navbar__links--active" : ""}`}>
          <button
            className={`navbar__linkBtn${currentPage === "about" ? " navbar__linkBtn--active" : ""}`}
            onClick={() => navigateTo("about")}
          >
            Tentang
          </button>
          <button className="navbar__linkBtn" onClick={() => goToHomeSection("journey")}>Perjalanan</button>
          <button
            className={`navbar__edusim-btn${currentPage === "simulator" ? " navbar__edusim-btn--active" : ""}`}
            onClick={() => navigateTo("simulator")}
          >
            EduSim
          </button>
          <button className="navbar__linkBtn" onClick={() => goToHomeSection("achievements")}>Pencapaian</button>

          <div
            className="navDropdown"
            onMouseEnter={() => {
              setPengurusanMenuOpen(true);
              setModulMenuOpen(false);
            }}
            onMouseLeave={() => setPengurusanMenuOpen(false)}
          >
            <button
              className={`navDropdownTrigger${managementPages.has(currentPage) ? " navDropdownTrigger--active" : ""}`}
              type="button"
              aria-haspopup="true"
              aria-expanded={pengurusanMenuOpen}
              onClick={() => {
                setPengurusanMenuOpen((prev) => !prev);
                setModulMenuOpen(false);
              }}
            >
              Pengurusan <span className="navCaret" aria-hidden="true">&#9662;</span>
            </button>

            {pengurusanMenuOpen && (
              <div className="navDropdownMenu">
                <button onClick={() => navigateTo("panitia-sains")}>Panitia Sains</button>
                <button onClick={() => navigateTo("panitia-matematik")}>Panitia Matematik</button>
              </div>
            )}
          </div>

          <div
            className="navDropdown"
            onMouseEnter={() => {
              setModulMenuOpen(true);
              setPengurusanMenuOpen(false);
            }}
            onMouseLeave={() => setModulMenuOpen(false)}
          >
            <button
              className={`navDropdownTrigger${currentPage === "modul" || currentPage === "banksoalan" || currentPage === "rpm" || currentPage === "plc" ? " navDropdownTrigger--active" : ""}`}
              type="button"
              aria-haspopup="true"
              aria-expanded={modulMenuOpen}
              onClick={() => {
                setModulMenuOpen((prev) => !prev);
                setPengurusanMenuOpen(false);
              }}
            >
              Perkongsian <span className="navCaret">▾</span>
            </button>

            {modulMenuOpen && (
              <div className="navDropdownMenu">
                <button onClick={() => navigateTo("modul")}>Modul</button>
                <button onClick={() => navigateTo("banksoalan")}>Bank Soalan</button>
                <button onClick={() => navigateTo("rpm")}>RPM2026-2035</button>
                <button onClick={() => navigateTo("plc")}>PLC Kit</button>
              </div>
            )}
          </div>

          <button className="navbar__linkBtn" onClick={() => goToHomeSection("gallery")}>Galeri</button>
          <button className="navbar__linkBtn" onClick={() => goToHomeSection("contact")}>Hubungi</button>
          <button
            className={`navbar__inovasi-btn${currentPage === "inovasi" ? " navbar__inovasi-btn--active" : ""}`}
            onClick={() => navigateTo("inovasi")}
          >
            Inovasi
          </button>
        </div>
      </nav>

      {currentPage === "simulator" ? (
        <SimulatorPage
          key={simulatorRouteVersion}
          onOpenSimulator={openSimulator}
        />
      ) : currentPage === "inovasi" ? (
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
      ) : activeManagementContent ? (
        <main className="managementPage">
          <section className="managementHero">
            <span className="managementKicker">Pengurusan</span>
            <h1>{activeManagementContent.title}</h1>
            <p>{activeManagementContent.lead}</p>

            <div className="managementTags" aria-label={`Fokus ${activeManagementContent.title}`}>
              {activeManagementContent.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </section>

          <section className="managementGrid" aria-label={`Maklumat ${activeManagementContent.title}`}>
            {activeManagementContent.cards.map((card) => (
              <article className="managementCard" key={card.title}>
                <h2>{card.title}</h2>
                <p>{card.text}</p>
              </article>
            ))}
          </section>

          <section className="managementNote">
            <div>
              <span>Ruang Kemas Kini</span>
              <h2>Maklumat panitia boleh ditambah secara berperingkat.</h2>
              <p>
                Bahagian ini disediakan sebagai tapak pengurusan. Cikgu boleh tambah
                dokumen, pautan, gambar aktiviti, jadual atau laporan rasmi panitia
                mengikut keperluan sekolah.
              </p>
            </div>
            <button type="button" className="btn btn--secondary" onClick={() => navigateTo("home")}>
              Kembali ke Utama
            </button>
          </section>

          <footer className="footer">
            <p>&copy; 2026 Najib Jaafar &bull; cikgustem.com</p>
            <p>STEM Educator &bull; Innovation &bull; Education Technology</p>
          </footer>
        </main>
      ) : currentPage === "about" ? (
        <main className="about-page">
          <section id="about" className="section about about-page__section">
            <div className="section__header">
              <p className="section__label">Tentang Saya</p>
              <h1>
                Profil profesional yang menggabungkan pendidikan, teknologi dan
                inovasi.
              </h1>
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

            <div className="about-page__actions">
              <button type="button" className="btn btn--secondary" onClick={() => navigateTo("home")}>
                Kembali ke Utama
              </button>
            </div>
          </section>

          <footer className="footer">
            <p>&copy; 2026 Najib Jaafar &bull; cikgustem.com</p>
            <p>STEM Educator &bull; Innovation &bull; Education Technology</p>
          </footer>
        </main>
      ) : currentPage === "rpm" ? (
        <main id="rpm-2026-2035" className="rpmPage">
          <article className="rpmArticle" aria-labelledby="rpm-title">
            <header className="rpmHero">
              <span className="rpmEyebrow">Perkongsian Pendidikan • 2026–2035</span>
              <h1 id="rpm-title">Rancangan Pendidikan Malaysia (RPM) 2026–2035</h1>
              <p className="rpmHero__subtitle">Apa yang Guru Perlu Tahu?</p>
              <div className="rpmByline">
                <span>Oleh: Mohd Najib Jaafar</span>
                <span>Guru Cemerlang Sains DG12</span>
              </div>
              <ShareBar title="Rancangan Pendidikan Malaysia (RPM) 2026–2035: Apa yang Guru Perlu Tahu?" anchor="#rpm-2026-2035" />
            </header>

            <section className="rpmSection rpmIntro" aria-labelledby="rpm-pengenalan">
              <span className="rpmSection__number">01</span>
              <div>
                <h2 id="rpm-pengenalan">Pengenalan</h2>
                <p>
                  Kementerian Pendidikan Malaysia (KPM) telah melancarkan <strong>Rancangan Pendidikan Malaysia (RPM) 2026–2035</strong> sebagai hala tuju baharu pendidikan negara untuk tempoh 10 tahun akan datang. RPM ini membawa visi <strong>“Pendidikan Bermutu, Insan Terdidik, Negara Sejahtera”</strong> dengan matlamat melahirkan murid yang <strong>beradab, berilmu, berkemahiran, berdaya tahan dan berkeyakinan</strong> berteraskan Falsafah Pendidikan Kebangsaan.
                </p>
                <blockquote>“Merapatkan Jurang, Meningkatkan Mutu, Meraih Kejayaan Bersama.”</blockquote>
                <p>
                  Sebagai guru, kita tidak perlu menghafal keseluruhan dokumen RPM. Memahami <strong>7 Teras Strategik RPM</strong> sudah memadai untuk melihat ke mana arah pendidikan Malaysia sedang bergerak.
                </p>
              </div>
            </section>

            <figure className="rpmPoster rpmPoster--featured">
              <img src="/PERKONGSIAN/RPM/LETAK%201.jpg" alt="Kerangka RPM 2026–2035 merangkumi visi, misi, matlamat dan tumpuan utama" />
              <figcaption>Kerangka, visi, misi dan matlamat RPM 2026–2035.</figcaption>
            </figure>

            <section className="rpmSection rpmCores" aria-labelledby="rpm-teras">
              <span className="rpmSection__number">02</span>
              <div>
                <h2 id="rpm-teras">7 Teras Strategik RPM 2026–2035</h2>
                <p className="rpmSection__lead">Tujuh teras ini merangkumi sistem, murid, pendidik, prasarana, kerjasama, kemampanan dan tadbir urus pendidikan.</p>
              </div>
            </section>

            <figure className="rpmPoster">
              <img src="/PERKONGSIAN/RPM/LETAK%202.jpg" alt="Infografik tujuh teras strategik RPM 2026–2035" />
              <figcaption>Ringkasan tujuh teras strategik RPM 2026–2035.</figcaption>
            </figure>

            <div className="rpmCoreGrid">
              {rpmStrategicCores.map((core) => (
                <section className="rpmCoreCard" key={core.number}>
                  <div className="rpmCoreCard__heading">
                    <span>Teras {core.number}</span>
                    <h3>{core.title}</h3>
                  </div>
                  <ul>
                    {core.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                  <div className="rpmTeacherNote">
                    <strong>Apa maksudnya kepada guru?</strong>
                    <p>{core.teacher}</p>
                  </div>
                </section>
              ))}
            </div>

            <section className="rpmSection rpmTargets" aria-labelledby="rpm-sasaran">
              <span className="rpmSection__number">03</span>
              <div>
                <h2 id="rpm-sasaran">Sasaran Besar RPM Menjelang 2035</h2>
                <p className="rpmSection__lead">Apabila RPM mencapai matlamatnya, KPM mensasarkan agar:</p>
                <ul className="rpmChecklist">
                  {rpmTargets.map((target) => <li key={target}>{target}</li>)}
                </ul>
              </div>
            </section>

            <section className="rpmReflection" aria-labelledby="rpm-refleksi">
              <span className="rpmEyebrow">Refleksi Seorang Guru</span>
              <h2 id="rpm-refleksi">Menterjemahkan aspirasi kepada pengalaman harian</h2>
              <p>
                Sebagai seorang guru, saya melihat RPM 2026–2035 bukan sekadar dokumen dasar, tetapi satu gambaran tentang <strong>murid yang ingin kita lahirkan pada masa hadapan</strong>.
              </p>
              <p>
                Jika sebelum ini kejayaan sering diukur melalui keputusan peperiksaan semata-mata, RPM membawa pendekatan yang lebih menyeluruh. Murid yang kita bentuk perlu menjadi insan yang:
              </p>
              <p className="rpmReflection__values">Beradab. Berilmu. Berkemahiran. Berdaya tahan. Berkeyakinan.</p>
              <p>
                Akhirnya, kejayaan RPM bukan bergantung kepada dokumen atau dasar semata-mata, tetapi kepada sejauh mana guru mampu menterjemahkan aspirasi ini ke dalam pengalaman pembelajaran harian di bilik darjah.
              </p>
              <blockquote>
                “Setiap kali kita merancang PdP yang bermakna, menggalakkan murid berfikir, meneroka dan menyelesaikan masalah, sebenarnya kita sedang menyumbang kepada kejayaan RPM 2026–2035.”
              </blockquote>
            </section>

            <p className="rpmSource"><strong>Sumber:</strong> Rancangan Pendidikan Malaysia (RPM) 2026–2035, Kementerian Pendidikan Malaysia.</p>

            <div className="journey-post__shareFooter rpmShareFooter">
              <ShareBar title="Rancangan Pendidikan Malaysia (RPM) 2026–2035: Apa yang Guru Perlu Tahu?" anchor="#rpm-2026-2035" />
            </div>
          </article>
        </main>
      ) : currentPage === "plc" ? (
        <main id="plc-guru-sains" className="plcPage">
          <article className="plcArticle" aria-labelledby="plc-title">
            <header className="plcHero">
              <div className="plcHero__content">
                <span className="plcEyebrow">Perkongsian Profesional</span>
                <h1 id="plc-title">PLC Guru Sains</h1>
                <p className="plcHero__subtitle">
                  Sinopsis dan kaedah Professional Learning Community berdasarkan KIT PLC KPM,
                  disesuaikan untuk amalan guru Sains di Malaysia.
                </p>
                <div className="plcHero__meta">
                  <span>Fokus: panitia Sains, PdP, PBD dan amali</span>
                  <span>Rujukan: KIT PLC KPM 2019</span>
                </div>
                <ShareBar title="PLC Guru Sains: Kaedah PLC yang boleh diamalkan guru Sains" anchor="#plc-guru-sains" />
              </div>

              <figure className="plcHero__visual">
                <img src={plcVisuals.cover} alt="Petikan muka depan KIT PLC Kementerian Pendidikan Malaysia" />
                <figcaption>Petikan visual daripada KIT PLC KPM sebagai rujukan utama posting ini.</figcaption>
              </figure>
            </header>

            <section className="plcIntro" aria-labelledby="plc-sinopsis">
              <div>
                <span className="plcSectionNumber">01</span>
                <h2 id="plc-sinopsis">Sinopsis Ringkas PLC</h2>
                <p>
                  Professional Learning Community atau PLC ialah komuniti guru yang bekerja
                  secara kolaboratif dan berterusan untuk meningkatkan kualiti pengajaran,
                  seterusnya memberi kesan kepada pembelajaran murid. Dalam konteks guru
                  Sains, PLC bukan sekadar mesyuarat panitia atau laporan aktiviti. PLC
                  sepatutnya menjadi ruang profesional untuk guru meneliti bukti pembelajaran
                  murid, membincangkan punca masalah, mencuba strategi PdP yang lebih sesuai
                  dan berkongsi amalan yang terbukti membantu murid.
                </p>
                <p>
                  KIT PLC KPM menggariskan idea utama PLC iaitu memastikan pembelajaran murid,
                  mengukuhkan kolaborasi guru dan memberi fokus kepada pencapaian. Melalui
                  kitaran Focus, Improve dan Share, guru Sains boleh menjadikan PLC sebagai
                  amalan kecil tetapi konsisten: kenal pasti isu, baiki tindakan PdP, kemudian
                  kongsikan dapatan kepada rakan sejawat.
                </p>
              </div>

              <figure className="plcInlineFigure">
                <img src={plcVisuals.focusImproveShare} alt="Konsep Focus Improve Share daripada KIT PLC" />
                <figcaption>Konsep asas PLC: Focus, Improve dan Share.</figcaption>
              </figure>
            </section>

            <section className="plcCycle" aria-labelledby="plc-kitaran">
              <span className="plcSectionNumber">02</span>
              <div>
                <h2 id="plc-kitaran">Kitaran PLC Untuk Guru Sains</h2>
                <p className="plcLead">
                  Cara paling mudah untuk memulakan PLC ialah bermula dengan satu masalah
                  pembelajaran yang nyata. Guru tidak perlu menunggu program besar. Satu isu
                  kecil yang dibincang, diuji dan dikongsi sudah cukup untuk menghidupkan
                  budaya PLC.
                </p>
                <div className="plcCycleGrid">
                  {plcCycleSteps.map((step) => (
                    <article className="plcCycleCard" key={step.label}>
                      <span>{step.label}</span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="plcVisualBand" aria-label="Strategi dan alat kolaboratif PLC">
              <figure>
                <img src={plcVisuals.strategyTools} alt="Strategi dan alat kolaboratif dalam KIT PLC" />
                <figcaption>Strategi dan alat kolaboratif yang menjadi asas pilihan aktiviti PLC.</figcaption>
              </figure>
              <div>
                <h2>Memilih Kaedah PLC Yang Sesuai</h2>
                <p>
                  Setiap alat PLC ada fungsi tersendiri. Guru Sains boleh memilih kaedah
                  berdasarkan isu yang sedang berlaku: isu data murid, isu amali, isu
                  pedagogi, keperluan guru baharu atau keperluan menyelaras pentaksiran.
                </p>
              </div>
            </section>

            <section className="plcMethods" aria-labelledby="plc-kaedah">
              <span className="plcSectionNumber">03</span>
              <h2 id="plc-kaedah">13 Kaedah PLC Untuk Panitia Sains</h2>
              <p className="plcLead">
                Berikut ialah kaedah dalam KIT PLC yang boleh diterjemahkan kepada amalan
                harian guru Sains di sekolah.
              </p>

              <div className="plcMethodGrid">
                {plcScienceMethods.map((method) => (
                  <article className="plcMethodCard" key={method.title}>
                    <span>{method.subtitle}</span>
                    <h3>{method.title}</h3>
                    <p><strong>Bila sesuai:</strong> {method.bestFor}</p>
                    <p><strong>Contoh Sains:</strong> {method.science}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="plcSplit" aria-labelledby="plc-amali">
              <div className="plcSplit__text">
                <span className="plcSectionNumber">04</span>
                <h2 id="plc-amali">PLC Dalam Bilik Darjah dan Makmal</h2>
                <p>
                  Dalam subjek Sains, banyak isu PdP boleh dilihat secara terus melalui
                  tindakan murid: cara mereka menggunakan radas, menulis pemerhatian,
                  mentafsir graf, membina inferens atau menghubungkan konsep dengan fenomena
                  sebenar. Sebab itu PLC sangat sesuai diamalkan bersama bukti yang konkrit,
                  bukan sekadar andaian guru.
                </p>
                <p>
                  Learning Walk dan Peer Coaching boleh membantu guru melihat rutin makmal
                  dengan lebih jelas. Lesson Study pula membantu panitia membina satu
                  pengalaman pembelajaran yang lebih kemas, diuji dan diperbaiki berdasarkan
                  respons sebenar murid.
                </p>
              </div>

              <div className="plcSplit__figures">
                <figure>
                  <img src={plcVisuals.learningWalk} alt="Petikan Learning Walk daripada KIT PLC" />
                  <figcaption>Learning Walk sesuai untuk pemerhatian berfokus terhadap aktiviti murid.</figcaption>
                </figure>
                <figure>
                  <img src={plcVisuals.lessonStudy} alt="Petikan Lesson Study daripada KIT PLC" />
                  <figcaption>Lesson Study membantu guru merancang, mencuba dan memurnikan RPH.</figcaption>
                </figure>
              </div>
            </section>

            <section className="plcSituations" aria-labelledby="plc-situasi">
              <span className="plcSectionNumber">05</span>
              <h2 id="plc-situasi">Contoh Situasi PLC Untuk Guru Sains</h2>
              <div className="plcSituationGrid">
                {plcScienceSituations.map((item) => (
                  <article className="plcSituationCard" key={item.title}>
                    <h3>{item.title}</h3>
                    <span>{item.methods}</span>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="plcPbd" aria-labelledby="plc-pbd">
              <figure>
                <img src={plcVisuals.pbd} alt="Petikan KIT PLC berkaitan PLC sebagai platform pelaksanaan PBD" />
                <figcaption>PLC boleh menyokong keberkesanan PBD apabila evidens murid dibincang secara kolaboratif.</figcaption>
              </figure>
              <div>
                <span className="plcSectionNumber">06</span>
                <h2 id="plc-pbd">PLC Sebagai Sokongan PBD</h2>
                <p>
                  PBD memerlukan pertimbangan profesional guru. Melalui PLC, guru Sains boleh
                  menyemak evidens murid bersama rakan panitia, menyelaraskan kefahaman
                  terhadap Standard Prestasi dan merancang intervensi yang lebih tepat.
                </p>
                <p>
                  Contohnya, jika ramai murid berada pada tahap penguasaan rendah dalam
                  kemahiran mengeksperimen, panitia boleh memilih satu strategi PLC,
                  melaksanakan tindakan susulan dan melihat semula evidens selepas beberapa
                  minggu.
                </p>
              </div>
            </section>

            <section className="plcStarter" aria-labelledby="plc-mula">
              <div>
                <span className="plcSectionNumber">07</span>
                <h2 id="plc-mula">Cadangan Mula Untuk Panitia Sains</h2>
                <p className="plcLead">
                  Jika panitia mahu memulakan PLC dengan mudah, gunakan aliran ringkas ini.
                  Pilih isu kecil, bina tindakan kecil dan semak kesannya dengan bukti.
                </p>
              </div>
              <ol>
                {plcStarterPlan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="plcClosing" aria-labelledby="plc-refleksi">
              <span className="plcEyebrow">Refleksi Guru Sains</span>
              <h2 id="plc-refleksi">PLC hidup apabila guru berani melihat pembelajaran murid dengan jujur.</h2>
              <p>
                Dalam Sains, kita selalu mengajar murid supaya membuat pemerhatian, mengumpul
                data dan membuat kesimpulan berdasarkan bukti. Prinsip yang sama boleh
                digunakan oleh guru. PLC ialah ruang untuk guru melihat PdP sendiri secara
                saintifik: ada isu, ada bukti, ada tindakan, ada semakan dan ada perkongsian.
              </p>
              <blockquote>
                PLC yang baik tidak perlu besar. Yang penting, ia membantu guru Sains membuat
                satu penambahbaikan yang benar-benar sampai kepada murid.
              </blockquote>
              <p className="plcSource">
                <strong>Sumber rujukan:</strong> KIT PLC Professional Learning Community,
                Kementerian Pendidikan Malaysia, 2019.
              </p>
              <div className="journey-post__shareFooter plcShareFooter">
                <ShareBar title="PLC Guru Sains: Kaedah PLC yang boleh diamalkan guru Sains" anchor="#plc-guru-sains" />
              </div>
            </section>
          </article>
        </main>
      ) : currentPage === "modul" ? (
        <main className="modulesPage">
          <section className="modulesHero">
            <span className="modulesKicker">Modul & Bahan</span>
            <h1>Ruang Modul Sains</h1>
            <div className="modulesHeroText">
              <p>
                Ruang ini menghimpunkan pelbagai modul, bahan rujukan dan sokongan pembelajaran
                bagi subjek Sains untuk membantu murid belajar secara lebih tersusun, berfokus
                dan mudah diakses mengikut keperluan semasa.
              </p>
              <p>
                Selain modul utama, ruang ini juga boleh dikembangkan dengan set soalan,
                bahan ulang kaji, nota padat, serta dokumen sokongan lain yang sesuai untuk
                pengukuhan konsep dan persediaan peperiksaan.
              </p>
            </div>
          </section>

          <section className="modulesGrid">
            <article className="moduleCard">
              <div className="moduleMeta">
                <span className="moduleTag">Sains</span>
                <span className="moduleTag">PPMP Johor</span>
              </div>

              <h3>Modul Amalan Harian Sains</h3>

              <p>
                Modul Amalan Harian Sains (AHS) dibangunkan secara rasmi oleh Panel
                Perunding Mata Pelajaran (PPMP) Sains Negeri Johor untuk membantu murid
                Tingkatan 4 dan Tingkatan 5 menguasai silibus melalui nota padat, latihan
                harian, mnemonik, visual dan ulang kaji berperingkat.
              </p>

              <div className="moduleLinks">
                <a href="/modules/sains/t4/amalan-sains-harian-t4.pdf" target="_blank" rel="noreferrer">
                  Tingkatan 4 →
                </a>
                <a href="/modules/sains/t5/amalan-sains-harian-t5.pdf" target="_blank" rel="noreferrer">
                  Tingkatan 5 →
                </a>
              </div>
            </article>

            <article className="moduleCard">
              <div className="moduleMeta">
                <span className="moduleTag">Sains</span>
                <span className="moduleTag">GO-K1</span>
                <span className="moduleTag">Pareto Pasir Gudang</span>
              </div>

              <h3>Modul GO-K1</h3>

              <p>
                GO-K1 dihasilkan oleh pasukan PARETO Sains Daerah Pasir Gudang pada tahun
                2025 untuk membantu murid melalui bahan latih tubi Kertas 1. Modul ini
                disusun secara topikal bagi mengukuhkan kefahaman dan pengetahuan murid
                terhadap fakta-fakta Sains.
              </p>

              <div className="moduleLinks">
                <a
                  href="/modules/go-k1/MODUL%20GO-K1%20LENGKAP%2012.8.25.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  Modul Kertas 1 →
                </a>
              </div>
            </article>

            <article className="moduleCard">
              <div className="moduleMeta">
                <span className="moduleTag">Sains</span>
                <span className="moduleTag">Pasir Gudang</span>
              </div>

              <h3>Modul Sains Pareto</h3>

              <p>
                Modul Sains Pareto disediakan oleh pasukan PARETO Sains Daerah Pasir Gudang
                untuk membantu calon SPM menguasai Kertas 2 Sains melalui fokus kepada topik
                penting, kemahiran proses sains, prosedur eksperimen dan pendekatan belajar
                yang lebih strategik.
              </p>

              <div className="moduleLinks">
                <a href="/modules/pareto/pareto-bahagian-a.pdf" target="_blank" rel="noreferrer">
                  Bahagian A →
                </a>
                <a href="/modules/pareto/pareto-bahagian-c.pdf" target="_blank" rel="noreferrer">
                  Bahagian C →
                </a>
              </div>
            </article>
          </section>
        </main>
      ) : currentPage === "banksoalan" ? (
        <main className="modulesPage">
          <section className="modulesHero">
            <span className="modulesKicker">Bank Soalan</span>
            <h1>Bank Soalan</h1>
            <p>
              Ruang ini menghimpunkan set soalan, latihan dan bahan ulang kaji
              yang boleh digunakan untuk membantu murid membuat persediaan dengan lebih tersusun.
            </p>
          </section>

          <section className="modulesGrid">
            <article className="moduleCard">
              <div className="moduleMeta">
                <span className="moduleTag">Sains</span>
                <span className="moduleTag">Jana Minda Siri 1</span>
              </div>
              <h3>Jana Minda 1 SSeMJ PPT 2026</h3>
              <p>
                Soalan Jana Minda ini disediakan sebagai persediaan menghadapi peperiksaan pertengahan tahun
                Sekolah Seni Malaysia Johor 2026, lengkap dengan panduan menjawab kemahiran proses sains
                yang betul serta penulisan jawapan yang tepat untuk soalan KBAT Bahagian B.
              </p>
              <a
                href="/bank-soalan/JANA%20MINDA%201%20SSeMJ%20PPT%202026/MODUL%20JANA%20MINDA%20PPT.docx"
                target="_blank"
                rel="noreferrer"
              >
                Buka Dokumen Jana Minda →
              </a>
            </article>

            <article className="moduleCard">
              <div className="moduleMeta">
                <span className="moduleTag">Sains</span>
                <span className="moduleTag">Teknik Menjawab</span>
                <span className="moduleTag">Jun-Julai 2026</span>
              </div>
              <h3>Bahan Bengkel Teknik Menjawab Jun-Julai 2026</h3>
              <p>
                Bahan ini digunakan dalam sesi bengkel teknik menjawab di beberapa sekolah,
                dengan fokus kepada cara memahami kehendak soalan, membina jawapan berstruktur
                dan memperkemas penulisan murid untuk soalan Sains.
              </p>
              <a
                href="/bank-soalan/BAHAN%20BENGKEL%20TEKNIK%20MENJAWAB/BAHAN%20BENGKEL%20JUN%202026.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Buka Bahan Bengkel →
              </a>
            </article>

            <article className="moduleCard">
              <div className="moduleMeta">
                <span className="moduleTag">Sains</span>
                <span className="moduleTag">Bahagian B</span>
              </div>
              <h3>Bank Soalan Sains Bahagian B</h3>
              <p>
                Himpunan soalan struktur untuk membantu murid membina jawapan dengan lebih tepat.
              </p>
              <a href="/bank-soalan/sains-bahagian-b.pdf" target="_blank" rel="noreferrer">
                Buka Bank Soalan →
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
      <button type="button" className="btn btn--secondary" onClick={() => navigateTo("about")}>
        Kenali Saya
      </button>
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

        <article id={mrccJourneyId} className="journey-post journey-post--latest journey-post--mrcc">
          <nav className="journey-post__breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => navigateTo("home")}>
              Laman Utama
            </button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => goToHomeSection("journey")}>
              Perjalanan
            </button>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Sumpit V1 di MRCC UTHM</span>
          </nav>

          <div className="journey-post__header">
            <div>
              <span className="section-kicker">STEM Roket - UTHM - 2026</span>
              <h3>{mrccJourneyTitle}</h3>
              <p className="journey-post__summary">
                Catatan kegembiraan seorang guru bersama pasukan Sumpit V1 yang berjaya
                menjadi Naib Johan MRCC di UTHM, antara empat pasukan terbaik daripada 10
                sekolah yang layak ke final kebangsaan di Perak untuk acara 1 km Solid Fuel.
              </p>

              <dl className="journey-post__metaGrid">
                <div>
                  <dt>Penulis</dt>
                  <dd>Mohd Najib bin Jaafar</dd>
                </div>
                <div>
                  <dt>Pembimbing</dt>
                  <dd>Cikgu Najib & Nurulain binti Nardir</dd>
                </div>
                <div>
                  <dt>Pasukan</dt>
                  <dd>Nabil, Ammar, Damia, Chinta & Imran Hailmy</dd>
                </div>
                <div>
                  <dt>Seterusnya</dt>
                  <dd>Final Kebangsaan Perak, 8-11 September 2026</dd>
                </div>
              </dl>

              <div className="journey-post__tags" aria-label="Tag artikel">
                {mrccTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <ShareBar title={mrccJourneyCardTitle} anchor={`#${mrccJourneyId}`} />
            </div>
          </div>

          <div className="journey-post__lead">
            <div className="journey-post__text">
              <p className="journey-post__dateLine">MRCC di Universiti Tun Hussein Onn Malaysia.</p>
              <p>
                Ada kemenangan yang terasa lebih besar daripada angka kedudukan. Bagi saya,
                kejayaan pasukan Sumpit V1 menjadi <strong>Naib Johan MRCC di UTHM</strong>{" "}
                ialah salah satu daripadanya.
              </p>
              <p>
                Ia bukan sekadar cerita tentang roket yang dilancarkan, laporan teknikal
                yang dihantar atau sesi pembentangan di hadapan juri. Ia cerita tentang
                murid yang berani mencuba, guru yang belajar bersama murid, dan satu pasukan
                kecil yang bekerja keras sehingga layak berdiri dalam kelompok terbaik.
              </p>
              <p>
                Saya hadir bersama Cikgu Nurulain binti Nardir, membimbing Nabil, Ammar,
                Damia, Chinta dan Imran Hailmy. Ain juga sebahagian daripada pasukan ini,
                cuma tidak dapat turut serta kerana kurang sihat. Walaupun dia tidak berada
                bersama kami pada hari pertandingan, namanya tetap kami bawa dalam semangat
                Sumpit V1.
              </p>
            </div>

            <figure className="journey-post__heroImage journey-post__heroImage--mrcc">
              <img
                src={mrccImages.hero}
                alt="Pasukan Sumpit V1 menerima pengiktirafan Naib Johan MRCC di UTHM"
                width={1280}
                height={960}
              />
              <figcaption>
                Detik pengiktirafan Sumpit V1 sebagai Naib Johan MRCC di UTHM.
              </figcaption>
            </figure>
          </div>

          <figure className="journey-post__galleryItem journey-post__figureWide">
            <img
              src={mrccImages.booth}
              alt="Pasukan Sumpit V1 di ruang pameran dan pembentangan MRCC UTHM"
              width={1280}
              height={960}
              loading="lazy"
            />
            <figcaption>
              Ruang pembentangan menjadi tempat murid mempertahankan idea, reka bentuk dan proses kejuruteraan Sumpit V1.
            </figcaption>
          </figure>

          <ReadMore
            className="journey-post__readmore"
            contentClassName="journey-post__more"
            open={mrccReadMore}
            onToggle={() => setMrccReadMore((current) => !current)}
            expandLabel="Baca Catatan Penuh"
            collapseLabel="Lihat Ringkas"
          >
            <div className="journey-post__body">
              <h4>Sebuah roket kecil yang membawa kerja besar</h4>
              <p>
                Projek Sumpit V1 bermula sebagai sebuah cabaran STEM, tetapi semakin lama
                semakin jelas bahawa ia bukan sekadar aktiviti membina roket. Di sebalik
                nama Sumpit, ada usaha untuk menghubungkan inspirasi tempatan dengan
                pemikiran kejuruteraan moden.
              </p>
              <p>
                Murid bukan hanya perlu menghasilkan bentuk yang menarik. Mereka perlu
                memahami mengapa sesuatu reka bentuk dipilih. Kami berbincang tentang
                kestabilan, CG, CP, bentuk nose cone, fin trapezoidal, anggaran apogee,
                halaju, pecutan dan sistem recovery. OpenRocket menjadi ruang untuk murid
                melihat bagaimana idea di atas kertas boleh diuji melalui simulasi sebelum
                dibawa ke pelancaran sebenar.
              </p>
              <p>
                Reka bentuk akhir SUMPIT-1 pernah diramal mencapai apogee sekitar 72.4 m
                dengan masa ke apogee 5.38 s melalui OpenRocket. Apabila pelancaran sebenar
                menunjukkan bacaan apogee dan masa penerbangan yang hampir dengan simulasi,
                murid dapat melihat sendiri bahawa data, pemerhatian dan reka bentuk saling
                berkait. Pada saat itu, Sains tidak lagi berada dalam buku. Sains berada di
                hadapan mata mereka.
              </p>

              <div className="journey-post__inlineVisual">
                <img
                  src={mrccImages.judging}
                  alt="Murid Sumpit V1 menerangkan projek kepada juri di reruai MRCC UTHM"
                  width={1280}
                  height={960}
                  loading="lazy"
                />
                <div>
                  <span className="section-kicker">Pembentangan</span>
                  <h4>Setiap murid belajar menyampaikan alasan teknikal di sebalik reka bentuk mereka.</h4>
                  <p>
                    Bahagian yang paling membanggakan saya ialah melihat murid mula yakin
                    menerangkan apa yang mereka buat. Mereka bukan sekadar hafal jawapan,
                    tetapi cuba memahami mengapa reka bentuk itu dipilih.
                  </p>
                </div>
              </div>

              <h4>Murid yang menghidupkan pasukan</h4>
              <p>
                Dalam pasukan ini, Nabil, Ammar, Damia, Chinta dan Imran Hailmy membawa
                tenaga masing-masing. Ada yang lebih teliti dengan susunan bahan, ada yang
                cepat menangkap idea teknikal, ada yang membantu mengemas pembentangan, dan
                ada yang menceriakan pasukan ketika semua orang mula penat.
              </p>
              <p>
                Sebagai guru, saya selalu percaya bahawa pertandingan seperti ini bukan
                semata-mata untuk mencari pemenang. Ia medan untuk murid belajar bertanya,
                mencuba, gagal sedikit, membetulkan semula dan akhirnya berani berdiri
                mempertahankan hasil kerja sendiri.
              </p>
              <p>
                Ain tidak dapat bersama kami kerana tidak sihat, dan tentu sekali kami rasa
                kekurangan itu. Namun dalam perjalanan sebuah pasukan, kehadiran bukan hanya
                diukur pada hari pertandingan. Usaha sebelum itu juga sebahagian daripada
                cerita yang membawa kami sampai ke UTHM.
              </p>

              <blockquote className="journey-post__quote">
                Kemenangan paling indah bagi seorang guru ialah apabila murid mula percaya
                bahawa kerja keras mereka mampu membawa mereka lebih jauh daripada yang
                mereka bayangkan.
              </blockquote>

              <h4>Dari padang pelancaran ke detik yang membuat kami tersenyum</h4>
              <p>
                Hari pertandingan di UTHM penuh dengan debaran. Di satu sisi, kami perlu
                memastikan pembentangan, laporan dan pemerhatian teknikal berada dalam keadaan
                terbaik. Di sisi lain, murid perlu melalui suasana pertandingan sebenar
                bersama sekolah-sekolah lain yang juga datang dengan persediaan rapi.
              </p>
              <p>
                Di padang pelancaran, setiap detik terasa panjang. Apabila roket naik,
                semua mata memerhati. Apabila data dibandingkan, semua orang mula melihat
                hubungan antara simulasi dan dunia sebenar. Walaupun ada cabaran pada fasa
                recovery apabila sistem telemetry tidak mencetuskan bukaan parachute seperti
                yang dirancang, murid belajar bahawa dunia kejuruteraan sebenar memang
                penuh dengan pemerhatian, penambahbaikan dan pembelajaran selepas ujian.
              </p>

              <div className="journey-post__gallery journey-post__gallery--end">
                {[
                  {
                    src: mrccImages.fieldTeam,
                    alt: "Pasukan Sumpit V1 bersama guru di kawasan padang pelancaran MRCC UTHM",
                    caption: "Suasana padang pelancaran yang menguji persediaan, fokus dan semangat pasukan.",
                    width: 1280,
                    height: 576,
                  },
                  {
                    src: mrccImages.fieldPrep,
                    alt: "Murid Sumpit V1 membuat persediaan di kawasan pelancaran roket",
                    caption: "Saat sebelum dan selepas pelancaran menjadi ruang pembelajaran paling nyata untuk murid.",
                    width: 1280,
                    height: 576,
                  },
                ].map((image) => (
                  <figure className="journey-post__galleryItem" key={image.src}>
                    <img
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      loading="lazy"
                    />
                    <figcaption>{image.caption}</figcaption>
                  </figure>
                ))}
              </div>

              <h4>Naib Johan daripada 10 sekolah</h4>
              <p>
                Apabila keputusan diumumkan, perasaan syukur itu sukar digambarkan. Daripada
                10 sekolah yang bertanding, Sumpit V1 dari Sekolah Seni Malaysia Johor berjaya
                meraih <strong>Naib Johan</strong>.
              </p>

              <ol className="journey-post__rankingList" aria-label="Keputusan MRCC UTHM">
                <li>
                  <span>Johan</span>
                  <strong>Sekolah Sains Kota Tinggi</strong>
                </li>
                <li>
                  <span>Naib Johan</span>
                  <strong>Sekolah Seni Malaysia Johor - Sumpit V1</strong>
                </li>
                <li>
                  <span>Ketiga</span>
                  <strong>MRSM Mersing</strong>
                </li>
                <li>
                  <span>Keempat</span>
                  <strong>MRSM Johor Bahru</strong>
                </li>
              </ol>

              <p>
                Empat pasukan inilah yang layak ke final kebangsaan di Perak bagi acara
                {" "}<strong>1 km Solid Fuel</strong>. Final tersebut dijadualkan berlangsung
                pada <strong>8 hingga 11 September 2026</strong>.
              </p>

              <div className="journey-post__inlineVisual journey-post__inlineVisual--reverse">
                <img
                  src={mrccImages.naibJohan}
                  alt="Cikgu Najib bersama pasukan Sumpit V1 selepas menerima pengiktirafan Naib Johan"
                  width={900}
                  height={1200}
                  loading="lazy"
                />
                <div>
                  <span className="section-kicker">Pengiktirafan</span>
                  <h4>Naib Johan ini menjadi tiket semangat menuju final kebangsaan di Perak.</h4>
                  <p>
                    Kemenangan ini bukan penamat. Ia permulaan kepada tanggungjawab baharu:
                    memperkemas reka bentuk, memperkukuh data, membaiki kelemahan dan
                    memastikan murid terus percaya kepada proses.
                  </p>
                </div>
              </div>

              <h4>Kegembiraan seorang guru</h4>
              <p>
                Saya sangat gembira bukan semata-mata kerana kami menang. Saya gembira kerana
                melihat murid-murid ini melalui proses yang panjang dengan hati yang kuat.
                Mereka belajar bahawa kejayaan tidak datang daripada satu malam, tetapi
                daripada perbincangan berulang, semakan laporan, pembaikan reka bentuk,
                latihan pembentangan dan keberanian untuk turun bertanding.
              </p>
              <p>
                Saya juga bersyukur dapat berkongsi perjalanan ini bersama Cikgu Nurulain
                binti Nardir. Dalam projek seperti ini, guru bukan hanya memberi arahan.
                Guru turut menjadi penyusun langkah, penenang ketika murid gelisah, penyemak
                terakhir sebelum dihantar dan orang yang paling kuat percaya bahawa murid
                mampu pergi lebih jauh.
              </p>

              <figure className="journey-post__galleryItem journey-post__figureWide">
                <img
                  src={mrccImages.boothUthm}
                  alt="Guru dan murid Sumpit V1 di reruai MRCC UTHM dengan paparan projek roket"
                  width={1280}
                  height={960}
                  loading="lazy"
                />
                <figcaption>
                  Di sebalik piala dan sijil, ada proses belajar, mencuba dan membimbing yang menjadikan perjalanan ini bermakna.
                </figcaption>
              </figure>

              <p>
                Perjalanan ke Perak pada September nanti sudah tentu menuntut persediaan yang
                lebih rapi. Namun untuk hari ini, saya mahu merakamkan rasa syukur ini sebagai
                satu halaman penting dalam perjalanan saya sebagai guru Sains.
              </p>
              <p>
                Terima kasih kepada semua murid pasukan Sumpit V1, pihak sekolah, rakan guru,
                ibu bapa dan semua yang mendoakan. Naib Johan ini milik pasukan, tetapi nilai
                sebenar yang kami bawa pulang ialah keyakinan bahawa usaha kecil, apabila
                dibuat bersama-sama dengan bersungguh-sungguh, mampu membuka laluan yang lebih
                besar.
              </p>
              <p className="journey-post__prayer">
                Semoga Sumpit V1 terus terbang lebih tinggi, bukan hanya di langit pertandingan,
                tetapi dalam keyakinan dan impian murid-murid yang membinanya.
              </p>
            </div>

            <div className="journey-post__shareFooter">
              <div className="journey-post__closingActions">
                <button type="button" className="secondary-btn" onClick={() => goToHomeSection("journey")}>
                  Kembali ke Perjalanan
                </button>
              </div>
              <ShareBar title={mrccJourneyCardTitle} anchor={`#${mrccJourneyId}`} />
            </div>
          </ReadMore>
        </article>

        <article id={kidPgJourneyId} className="journey-post journey-post--latest journey-post--edusim">
          <nav className="journey-post__breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => navigateTo("home")}>
              Laman Utama
            </button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => goToHomeSection("journey")}>
              Perjalanan
            </button>
            <span aria-hidden="true">/</span>
            <span aria-current="page">EduSim di KID-PG 2026</span>
          </nav>

          <div className="journey-post__header">
            <div>
              <span className="section-kicker">Inovasi Pendidikan - KIPMall Masai, Johor - 2026</span>
              <h3>{kidPgJourneyTitle}</h3>
              <p className="journey-post__summary">
                Perjalanan EduSim daripada sebuah idea di bilik darjah sehingga terpilih
                sebagai pameran inovasi, memenangi Anugerah 3 Minutes Pitching Terbaik dan
                Anugerah Inovasi Terbaik di Karnival Inovasi Daerah Pasir Gudang 2026.
              </p>

              <dl className="journey-post__metaGrid">
                <div>
                  <dt>Penulis</dt>
                  <dd>Mohd Najib bin Jaafar</dd>
                </div>
                <div>
                  <dt>Jawatan</dt>
                  <dd>Guru Cemerlang Sains</dd>
                </div>
                <div>
                  <dt>Lokasi</dt>
                  <dd>KIPMall Masai, Johor</dd>
                </div>
                <div>
                  <dt>Kategori</dt>
                  <dd>Inovasi Pendidikan</dd>
                </div>
              </dl>

              <div className="journey-post__tags" aria-label="Tag artikel">
                {kidPgTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <ShareBar title={kidPgJourneyCardTitle} anchor={`#${kidPgJourneyId}`} />
            </div>
          </div>

          <div className="journey-post__lead">
            <div className="journey-post__text">
              <p className="journey-post__dateLine">Karnival Inovasi Daerah Pasir Gudang 2026.</p>
              <p>
                Ada perjalanan yang bermula dengan perancangan yang besar. Ada juga perjalanan
                yang bermula daripada satu persoalan kecil di dalam bilik darjah.
              </p>
              <p>
                Bagi saya, perjalanan EduSim bermula apabila saya melihat sendiri cabaran yang
                dihadapi oleh murid ketika mempelajari konsep Sains yang abstrak. Ada proses
                yang terlalu kecil untuk dilihat, terlalu pantas untuk diperhatikan dan terlalu
                sukar untuk dilaksanakan berulang kali di dalam makmal.
              </p>
              <p>
                Pada ketika itulah saya mula bertanya kepada diri sendiri: adakah teknologi
                boleh membantu murid melihat, mencuba dan memahami konsep tersebut dengan lebih
                jelas? Persoalan itu akhirnya membawa saya kepada pembangunan EduSim, iaitu
                himpunan simulator Sains interaktif yang dibina berasaskan keperluan sebenar
                pengajaran dan pembelajaran.
              </p>
            </div>

            <figure className="journey-post__heroImage journey-post__heroImage--edusim">
              <img
                src={kidPgImages.hero}
                alt="Mohd Najib bin Jaafar membentangkan inovasi EduSim di pentas Karnival Inovasi Daerah Pasir Gudang 2026"
                width={1600}
                height={1067}
              />
              <figcaption>
                Perkongsian EduSim di pentas Karnival Inovasi Daerah Pasir Gudang 2026 di KIPMall Masai.
              </figcaption>
            </figure>
          </div>

          <figure className="journey-post__galleryItem journey-post__figureWide">
            <img
              src={kidPgImages.pempamer}
              alt="Poster senarai pempamer KID-PG 2026 yang menyenaraikan Mohd Najib bin Jaafar dan inovasi EduSim"
              width={1280}
              height={720}
              loading="lazy"
            />
            <figcaption>
              EduSim disenaraikan sebagai salah satu inovasi sekolah menengah yang dipamerkan dalam program.
            </figcaption>
          </figure>

          <ReadMore
            className="journey-post__readmore"
            contentClassName="journey-post__more"
            open={kidPgReadMore}
            onToggle={() => setKidPgReadMore((current) => !current)}
            expandLabel="Baca Catatan Penuh"
            collapseLabel="Lihat Ringkas"
          >
            <div className="journey-post__body">
              <h4>Melangkah keluar daripada ruang selesa</h4>
              <p>
                Sebagai seorang Guru Cemerlang Sains, saya sentiasa percaya bahawa tugas
                seorang guru bukan sekadar menyampaikan kandungan dalam buku teks. Seorang
                guru juga perlu terus belajar, meneroka pendekatan baharu dan berani menilai
                semula kaedah yang digunakan.
              </p>
              <p>
                Menyertai Karnival Inovasi Daerah Pasir Gudang 2026 atau KID-PG 2026
                memberikan saya ruang untuk melakukan semua perkara tersebut.
              </p>
              <p>
                Saya hadir bukan dengan anggapan bahawa inovasi saya sudah sempurna.
                Sebaliknya, saya hadir sebagai seorang guru yang mahu belajar. Saya mahu
                mendengar pandangan, menerima teguran, melihat hasil kreativiti guru lain dan
                memahami bagaimana sesuatu idea boleh dikembangkan sehingga memberi impak
                yang lebih luas.
              </p>
              <p>
                Pengalaman berada bersama guru-guru hebat daripada pelbagai sekolah benar-benar
                membuka mata saya. Setiap peserta membawa cerita, cabaran dan penyelesaian
                tersendiri. Walaupun inovasi yang dibawa berbeza, kami berkongsi matlamat yang
                sama, iaitu menjadikan pengalaman pembelajaran murid lebih bermakna.
              </p>

              <h4>Terpilih sebagai pembentang dan pempamer</h4>
              <p>
                Saya amat bersyukur apabila EduSim terpilih untuk dibawa sebagai pameran
                inovasi dalam Karnival Pendidikan MADANI yang berlangsung di KIPMall Masai.
              </p>
              <p>
                Di sana, saya diberikan sebuah reruai yang dikongsi bersama beberapa orang
                guru hebat. Ruang itu bukan sekadar tempat mempamerkan produk. Ia menjadi
                ruang pertemuan idea, perkongsian pengalaman dan perbincangan tentang masa
                depan pendidikan.
              </p>

              <div className="journey-post__inlineVisual">
                <img
                  src={kidPgImages.reruai}
                  alt="Mohd Najib bin Jaafar menerangkan EduSim di ruang pameran KIPMall Masai"
                  width={1280}
                  height={720}
                  loading="lazy"
                />
                <div>
                  <span className="section-kicker">Reruai EduSim</span>
                  <h4>Peluang berkongsi EduSim bersama para pendidik dan pengunjung di KIPMall Masai.</h4>
                  <p>
                    Di ruang kecil inilah saya dapat menunjukkan bagaimana murid boleh membuat
                    pemerhatian, mengubah pemboleh ubah, menjalankan simulasi dan melihat kesan
                    sesuatu perubahan secara terus.
                  </p>
                </div>
              </div>

              <p>
                Sepanjang berada di reruai, saya berpeluang menerangkan bagaimana EduSim
                digunakan dalam pembelajaran Sains. Saya juga dapat menunjukkan bagaimana
                murid boleh membuat pemerhatian, mengubah pemboleh ubah, menjalankan simulasi
                dan melihat kesan sesuatu perubahan secara terus.
              </p>
              <p>
                Antara perkara yang paling menggembirakan saya ialah apabila pengunjung mula
                bertanya soalan, mencuba sendiri simulator dan memberikan cadangan. Setiap
                pertanyaan tersebut membuatkan saya melihat EduSim daripada sudut pandang yang
                berbeza.
              </p>
              <p>
                Pada ketika itu, saya semakin memahami bahawa inovasi tidak seharusnya berhenti
                selepas dibangunkan. Inovasi perlu diuji, dikongsi, dinilai dan ditambah baik
                secara berterusan.
              </p>

              <blockquote className="journey-post__quote">
                Sebuah inovasi pendidikan menjadi benar-benar bermakna apabila ia bukan sahaja
                memudahkan tugas guru, tetapi turut membantu murid melihat sesuatu yang sebelum
                ini sukar mereka bayangkan.
              </blockquote>

              <h4>Tiga minit yang penuh debaran</h4>
              <p>
                Salah satu pengalaman yang paling mencabar ialah sesi 3 Minutes Pitching.
              </p>
              <p>
                Tiga minit kelihatan singkat, tetapi dalam tempoh itulah saya perlu menerangkan
                masalah yang ingin diselesaikan, idea di sebalik EduSim, cara ia digunakan dan
                impak yang diharapkan.
              </p>
              <p>
                Saya perlu memilih setiap perkataan dengan teliti. Saya tidak boleh menerangkan
                semua ciri yang telah dibangunkan. Saya perlu kembali kepada persoalan paling
                asas: mengapa EduSim dibina dan siapakah yang ingin dibantu?
              </p>

              <div className="journey-post__gallery journey-post__gallery--end">
                {[
                  {
                    src: kidPgImages.pitchingWide,
                    alt: "Sesi 3 Minutes Pitching EduSim di pentas KID-PG 2026 dengan paparan simulator pada skrin",
                    caption: "Tiga minit yang memerlukan idea EduSim disampaikan dengan ringkas, jelas dan berfokus.",
                  },
                  {
                    src: kidPgImages.pitchingDemo,
                    alt: "Mohd Najib bin Jaafar menunjukkan paparan EduSim semasa sesi pitching KID-PG 2026",
                    caption: "Setiap paparan dipilih untuk menunjukkan masalah PdP Sains dan cara simulasi membantu murid.",
                  },
                ].map((image) => (
                  <figure className="journey-post__galleryItem" key={image.src}>
                    <img src={image.src} alt={image.alt} width={1280} height={960} loading="lazy" />
                    <figcaption>{image.caption}</figcaption>
                  </figure>
                ))}
              </div>

              <figure className="journey-post__galleryItem journey-post__figureWide">
                <img
                  src={kidPgImages.pesertaPitching}
                  alt="Poster senarai peserta 3 Minutes Pitching KID-PG 2026 yang menyenaraikan inovasi EduSim"
                  width={1280}
                  height={720}
                  loading="lazy"
                />
                <figcaption>
                  EduSim turut terpilih untuk sesi 3 Minutes Pitching dalam kategori sekolah menengah.
                </figcaption>
              </figure>

              <p>
                Apabila berdiri di hadapan panel penilai, sudah tentu ada perasaan berdebar.
                Namun, pada masa yang sama saya berasa sangat teruja. Saya bukan sekadar
                mempersembahkan sebuah laman web atau aplikasi. Saya sedang berkongsi
                pengalaman sebenar seorang guru yang mahu membantu murid memahami Sains dengan
                lebih baik.
              </p>
              <p>
                Saya sangat bersyukur apabila diumumkan sebagai penerima
                <strong> Anugerah 3 Minutes Pitching Terbaik</strong>.
              </p>
              <p>
                Pengiktirafan tersebut memberikan keyakinan bahawa idea yang lahir daripada
                masalah di bilik darjah juga boleh disampaikan dengan jelas dan diterima oleh
                orang lain.
              </p>

              <h4>Anugerah Inovasi Terbaik</h4>
              <p>
                Kegembiraan saya bertambah apabila EduSim turut menerima
                <strong> Anugerah Inovasi Terbaik</strong>.
              </p>
              <p>
                Saya menerima anugerah ini dengan penuh rasa syukur dan rendah hati. Bagi saya,
                kemenangan ini bukanlah penamat kepada perjalanan EduSim. Sebaliknya, ia membawa
                tanggungjawab yang lebih besar untuk memastikan inovasi ini terus dikembangkan
                dan benar-benar memberikan manfaat.
              </p>

              <div className="journey-post__inlineVisual journey-post__inlineVisual--reverse">
                <img
                  src={kidPgImages.suasana}
                  alt="Suasana pentas KID-PG 2026 ketika perkongsian inovasi EduSim berlangsung"
                  width={1280}
                  height={960}
                  loading="lazy"
                />
                <div>
                  <span className="section-kicker">Pengiktirafan</span>
                  <h4>Pengiktirafan ini menjadi pendorong untuk EduSim terus dikembangkan dan dikongsi.</h4>
                  <p>
                    Kemenangan ini saya terima sebagai penghargaan kepada proses belajar,
                    mencuba dan berkongsi ilmu, bukan sebagai ruang untuk bermegah.
                  </p>
                </div>
              </div>

              <p>
                Anugerah tersebut juga menjadi satu bentuk penghargaan terhadap masa yang
                diluangkan untuk membina, menguji dan menambah baik setiap simulator.
              </p>
              <p>
                Ada bahagian yang perlu dibina semula. Ada fungsi yang tidak berjalan seperti
                yang dirancang. Ada reka bentuk yang kelihatan baik pada komputer tetapi kurang
                sesuai apabila digunakan pada telefon. Ada juga simulator yang perlu diubah
                selepas melihat cara murid menggunakannya.
              </p>
              <p>Semua proses itu merupakan sebahagian daripada pembelajaran saya.</p>

              <h4>Dibangunkan bersama teknologi, dipandu pengalaman seorang guru</h4>
              <p>
                EduSim dibangunkan dengan memanfaatkan teknologi kecerdasan buatan dan bantuan
                Codex dalam proses pembangunan kod. Teknologi ini membantu mempercepatkan
                pembinaan prototaip, menguji idea dan menambah baik fungsi tertentu.
              </p>
              <p>Namun begitu, teknologi hanyalah alat.</p>
              <p>
                Arah pembangunan EduSim tetap berpandukan pengalaman di dalam bilik darjah.
                Pemilihan topik, bentuk interaksi, susunan langkah eksperimen, pemboleh ubah,
                soalan pemerhatian dan cara maklum balas dipaparkan semuanya berkait rapat
                dengan keperluan murid serta kandungan kurikulum Sains.
              </p>
              <p>
                Saya percaya gabungan antara pengalaman guru dan keupayaan teknologi boleh
                membuka ruang yang sangat besar dalam pendidikan. Guru memahami murid,
                kurikulum dan realiti bilik darjah. Teknologi pula membolehkan idea tersebut
                diterjemahkan kepada pengalaman pembelajaran yang interaktif, boleh dicapai
                pada bila-bila masa dan boleh ditambah baik secara berterusan.
              </p>

              <figure className="journey-post__galleryItem journey-post__figureWide">
                <img
                  src={kidPgImages.poster}
                  alt="Poster pertandingan 3 Minutes Pitching dan Pameran Inovasi KID-PG 2026 di KIPMall Masai"
                  width={1280}
                  height={853}
                  loading="lazy"
                />
                <figcaption>
                  KID-PG 2026 membuka ruang untuk guru berkongsi inovasi, mendapatkan maklum balas dan belajar daripada komuniti pendidikan.
                </figcaption>
              </figure>

              <h4>Pengalaman yang lebih besar daripada sebuah kemenangan</h4>
              <p>
                Antara perkara paling bernilai sepanjang menyertai pertandingan ini bukan
                sekadar piala atau pengiktirafan.
              </p>
              <p>
                Nilai yang lebih besar datang melalui pertemuan dengan guru-guru yang kreatif,
                maklum balas daripada panel, perbualan bersama pengunjung dan peluang melihat
                pelbagai inovasi pendidikan yang dibangunkan dengan penuh kesungguhan.
              </p>
              <p>
                Pengalaman ini mengingatkan saya bahawa guru juga perlu keluar daripada ruang
                selesa. Kadangkala kita terlalu sibuk dengan rutin sehingga terlupa bahawa
                hasil kerja kita mungkin boleh membantu guru lain. Apabila kita berkongsi,
                kita bukan sahaja memberikan sesuatu kepada orang lain. Kita turut memperoleh
                pandangan baharu yang membantu kita berkembang.
              </p>
              <p>
                Saya pulang daripada program ini dengan lebih banyak idea berbanding ketika
                saya datang. Saya juga pulang dengan semangat yang lebih kuat untuk terus
                membangunkan simulator baharu, memperkemas simulator sedia ada dan memastikan
                EduSim lebih mudah digunakan oleh guru serta murid.
              </p>

              <h4>Impian untuk EduSim</h4>
              <p>
                Harapan saya adalah supaya EduSim tidak hanya digunakan di sekolah saya.
              </p>
              <p>
                Saya berharap semakin ramai guru Sains di seluruh Malaysia dapat menggunakannya
                sebagai salah satu pilihan bahan bantu mengajar. EduSim bukan bertujuan
                menggantikan eksperimen sebenar atau peranan guru. Sebaliknya, ia dihasilkan
                untuk melengkapkan pembelajaran, khususnya apabila eksperimen sukar
                dilaksanakan, bahan tidak mencukupi atau konsep memerlukan visualisasi yang
                lebih jelas.
              </p>
              <p>
                Saya membayangkan satu keadaan apabila guru di bandar, luar bandar dan kawasan
                yang mempunyai kemudahan terhad tetap boleh memberikan pengalaman pembelajaran
                interaktif kepada murid.
              </p>
              <p>
                Impian yang lebih besar adalah untuk melihat simulator Sains tempatan seperti
                EduSim suatu hari nanti dipertimbangkan dalam ekosistem DELIMa dan digunakan
                sebagai salah satu sumber simulasi Sains Kementerian Pendidikan Malaysia.
              </p>
              <p>
                Seperti mana guru dan murid menggunakan platform antarabangsa seperti PhET
                Colorado untuk membantu memahami konsep Sains, saya berharap Malaysia juga
                dapat mempunyai koleksi simulator yang dibangunkan oleh guru tempatan,
                berdasarkan kurikulum tempatan dan sesuai dengan konteks bilik darjah negara
                kita.
              </p>
              <p>
                Perjalanan ke arah itu mungkin masih panjang. Namun, setiap perjalanan besar
                bermula dengan satu langkah kecil. Bagi EduSim, langkah itu bermula daripada
                bilik darjah, berkembang melalui proses mencuba dan belajar, kemudian dibawa
                ke pentas inovasi KID-PG 2026.
              </p>

              <h4>Terima kasih kepada semua yang menjadi sebahagian daripada perjalanan ini</h4>
              <p>
                Saya merakamkan penghargaan kepada pihak penganjur Karnival Inovasi Daerah
                Pasir Gudang 2026, para panel penilai, rakan-rakan guru, pihak sekolah,
                murid-murid serta semua yang telah memberikan pandangan dan sokongan.
              </p>
              <p>
                Terima kasih juga kepada para pengunjung yang singgah di reruai, mencuba EduSim
                dan berkongsi cadangan. Setiap maklum balas sangat bermakna kepada saya.
              </p>
              <p>
                Anugerah 3 Minutes Pitching Terbaik dan Anugerah Inovasi Terbaik ini saya
                jadikan sebagai sumber semangat untuk terus belajar, berkongsi dan menghasilkan
                sesuatu yang memberi manfaat kepada pendidikan.
              </p>
              <p>
                Saya percaya guru bukan sekadar pengguna teknologi. Guru juga boleh menjadi
                pencipta, pereka bentuk pengalaman pembelajaran dan penggerak kepada perubahan.
              </p>
              <p>
                Perjalanan EduSim masih belum selesai. Ini hanyalah satu lagi halaman dalam
                perjalanan saya sebagai seorang pendidik.
              </p>
              <p>
                Semoga langkah kecil ini terus berkembang dan suatu hari nanti dapat memberi
                manfaat kepada guru dan murid di seluruh Malaysia.
              </p>
              <p className="journey-post__prayer">
                Inovasi bermula daripada masalah yang kita lihat, tetapi impaknya berkembang
                apabila kita berani berkongsi penyelesaiannya.
              </p>
            </div>

            <div className="journey-post__shareFooter">
              <div className="journey-post__closingActions">
                <button type="button" className="secondary-btn" onClick={() => goToHomeSection("journey")}>
                  Kembali ke Perjalanan
                </button>
              </div>
              <ShareBar title={kidPgJourneyCardTitle} anchor={`#${kidPgJourneyId}`} />
            </div>
          </ReadMore>
        </article>

        <article id="journey-catatan-seorang-menantu" className="journey-post journey-post--latest journey-post--memorial">
          <div className="journey-post__header">
            <div>
              <span className="section-kicker">Catatan Keluarga - 25 Mei 2026</span>
              <h3>Tatapan Terakhir Dalam Ambulans - Catatan seorang menantu</h3>
              <ShareBar title="Tatapan Terakhir Dalam Ambulans" anchor="#journey-catatan-seorang-menantu" />
            </div>
          </div>

          <div className="journey-post__lead journey-post__lead--single">
            <div className="journey-post__text">
              <p className="journey-post__dateLine">25 Mei 2026. Tarikh yang tidak akan saya lupakan.</p>
              <p>
                Pada jam 2.00 pagi, bapa mertua saya yang tercinta, Allahyarham Abd Manan
                bin Omar, telah menghembuskan nafas terakhir di Hospital Sultan Ismail
                (HSI), Johor Bahru pada usia 76 tahun. Sudah hampir seminggu beliau berada
                di hospital sebelum akhirnya ditidurkan akibat keadaan jantung yang semakin
                lemah. Namun hakikatnya, perjuangan beliau bermula lebih awal daripada itu.
              </p>
              <p>
                Segalanya bermula sekitar pertengahan April 2026 apabila beliau menjalani
                pemeriksaan CT Scan di KPJ. Pada 16 April, doktor memaklumkan terdapat
                kemungkinan besar beliau menghidap kanser. Untuk mendapatkan kepastian,
                biopsi dilakukan. Beberapa hari kemudian, keputusan awal mengesahkan
                kewujudan kanser. Namun doktor masih belum dapat menentukan jenis kanser
                tersebut. Sampel dan laporan dihantar semula ke HSI untuk ujian yang lebih
                terperinci.
              </p>
              <p>
                Di sinilah bermulanya satu fasa yang amat menyeksakan. Bukan kerana kami
                tidak menerima takdir Allah, tetapi kerana menunggu dalam keadaan melihat
                orang yang kita sayang semakin lemah setiap hari adalah satu ujian yang
                sukar digambarkan dengan kata-kata.
              </p>
            </div>

            <div className="journey-post__inlineVisual journey-post__inlineVisual--memorial">
              <img src={menantuImages.memorial} alt="Poster Al-Fatihah Allahyarham Abd Manan bin Omar" />
              <div>
                <span className="section-kicker">Al-Fatihah</span>
                <h4>Kenangan dan doa buat Allahyarham Abd Manan bin Omar.</h4>
                <p>
                  07 Disember 1950 hingga 25 Mei 2026. Semoga Allah SWT merahmati roh
                  beliau, mengampuni segala dosanya, memuliakan kepulangannya, dan
                  menempatkan beliau dalam kalangan orang beriman.
                </p>
              </div>
            </div>
          </div>

          <ReadMore
            className="journey-post__readmore"
            contentClassName="journey-post__more"
            expandLabel="Baca Catatan Penuh"
            collapseLabel="Lihat Ringkas"
          >
            <div className="journey-post__body">
              <p>
                Saya masih ingat bagaimana keadaan bapa mertua saya berubah dengan begitu
                pantas. Seolah-olah setiap dua atau tiga hari, ada sahaja nikmat yang
                ditarik sedikit demi sedikit. Mula-mula pergerakan tangan menjadi lemah.
                Kemudian kaki pula tidak lagi mampu menampung badan. Tidak lama selepas
                itu, beliau tidak lagi mampu berjalan.
              </p>
              <p>
                Sebagai seorang menantu, saya hanya mampu melihat dan berdoa. Dalam hati
                saya sentiasa berharap agar segala kesakitan yang ditanggung menjadi asbab
                penghapusan dosa-dosa beliau di sisi Allah SWT.
              </p>

              <div className="journey-post__inlineVisual journey-post__inlineVisual--wide">
                <img src={menantuImages.familyMemory} alt="Kenangan Allahyarham Abd Manan bin Omar bersama anak cucu" />
                <div>
                  <span className="section-kicker">Kenangan Yang Tertinggal</span>
                  <h4>Sebelum sakit itu mengubah segalanya, beliau adalah ayah dan datuk yang diraikan.</h4>
                  <p>
                    Gambar keluarga seperti ini menjadi lebih bermakna selepas pemergian
                    seseorang yang kita sayang. Ia menyimpan wajah, suasana dan kasih yang
                    tidak mampu diulang semula.
                  </p>
                </div>
              </div>

              <p>
                Namun di sebalik segala penderitaan itu, saya melihat sesuatu yang luar
                biasa. Saya melihat ketabahan. Saya melihat kekuatan seorang ayah. Saya
                melihat seorang lelaki tua yang sedang berjuang sedaya upaya menerima ujian
                daripada Tuhan.
              </p>

              <p>
                Sepanjang tempoh itu juga saya menyaksikan satu perkara yang sangat menyentuh
                hati saya, iaitu kesatuan adik-beradik dalam keluarga isteri saya. Mereka
                bergilir-gilir menjaga ayah mereka tanpa mengira masa. Isteri saya pula
                hampir setiap hari datang melawat dari pagi hingga petang. Beberapa kelas
                tuisyen yang biasanya menjadi rutin terpaksa dibatalkan demi menemani
                ayahanda tercinta.
              </p>
              <p>
                Saya melihat sendiri bagaimana beliau mengurut tangan dan kaki bapanya.
                Saya melihat bagaimana beliau cuba menyuapkan makanan. Saya melihat
                bagaimana beliau cuba menyembunyikan kesedihan di hadapan ayahnya.
                Dan saya juga melihat air mata yang akhirnya gugur apabila hati seorang anak
                sudah tidak mampu lagi menanggung rasa.
              </p>

              <p>
                Peristiwa ini memberi kesan yang sangat mendalam kepada saya kerana ia
                mengingatkan saya kepada kehilangan ibu saya suatu ketika dahulu. Ketika
                saya kehilangan ibu, insan yang banyak menguatkan semangat saya ialah isteri
                saya. Kini apabila beliau melalui kesakitan yang sama, saya hanya mampu
                berada di sisinya sebagaimana beliau pernah berada di sisi saya dahulu.
              </p>
              <p>
                Dalam tempoh menunggu keputusan biopsi yang penuh debaran itu, banyak pihak
                tampil membantu. Antaranya pihak UMNO Plentong yang menyumbangkan katil
                pesakit dan pelbagai bantuan lain bagi memudahkan urusan penjagaan
                Allahyarham di rumah. Bantuan-bantuan kecil seperti inilah yang sebenarnya
                memberi makna besar kepada keluarga yang sedang diuji.
              </p>

              <p className="journey-post__dateLine">20 Mei 2026. Tarikh yang juga akan sentiasa terpahat dalam ingatan saya.</p>
              <p>
                Secara kebetulan, saya sedang bercuti sakit pada hari tersebut. Jadi saya
                berpeluang menemani bapa mertua saya ke Hospital Sultan Ismail untuk
                mendapatkan keputusan biopsi yang ditunggu-tunggu. Pada sekitar jam 10 pagi,
                ambulans AraMedik yang ditempah oleh biras saya, Yusri, seorang pemandu
                ambulans kerajaan, tiba di rumah. Saya membantu mengiringi bapa mertua
                menaiki ambulans.
              </p>

              <div className="journey-post__inlineVisual journey-post__inlineVisual--reverse">
                <img src={menantuImages.ambulanceArrival} alt="Saya menemani Allahyarham di dalam ambulans AraMedik" />
                <div>
                  <span className="section-kicker">Dalam Ambulans</span>
                  <h4>Saya tidak tahu ketika itu bahawa perjalanan ini akan menjadi kenangan terakhir.</h4>
                  <p>
                    Detik menaiki ambulans itu kelihatan seperti urusan biasa ke hospital.
                    Namun selepas semuanya berlalu, gambar ini menjadi antara ingatan yang
                    paling kuat dalam catatan saya sebagai seorang menantu.
                  </p>
                </div>
              </div>

              <p>
                Sepanjang perjalanan menuju ke HSI, beliau beberapa kali mengadu kesakitan.
                Setiap kali beliau mengerang, hati saya terasa begitu berat.
                Sebagai manusia, kita mungkin boleh melihat penderitaan orang lain. Tetapi
                apabila orang yang kita sayang berada di hadapan mata sedang menanggung
                kesakitan, perasaan itu sangat berbeza. Ia menusuk jauh ke dalam hati.
              </p>
              <p>
                Saya cuba berbual dengan beliau sepanjang perjalanan. Kami bercakap
                perkara-perkara biasa. Tiada apa yang luar biasa. Tiada kata-kata besar.
                Tiada ucapan perpisahan. Hanya perbualan biasa antara seorang menantu dan
                bapa mertuanya.
              </p>

              <div className="journey-post__inlineVisual">
                <img src={menantuImages.ambulanceInside} alt="Allahyarham Abd Manan bin Omar dalam ambulans menuju ke Hospital Sultan Ismail" />
                <div>
                  <span className="section-kicker">Tatapan Terakhir Dalam Ambulans</span>
                  <h4>Perjalanan kira-kira tiga puluh minit itu rupanya menjadi perbualan terakhir kami.</h4>
                  <p>
                    Di ruang sempit ambulans inilah saya duduk bersebelahan dengan beliau,
                    mendengar suaranya dan menatap wajahnya dalam keadaan masih mampu
                    berbicara.
                  </p>
                </div>
              </div>

              <p>
                Namun tanpa saya sedari ketika itu, perjalanan selama kira-kira tiga puluh
                minit itulah sebenarnya tatapan dan perbualan terakhir saya bersama beliau.
                Saya tidak pernah menyangka bahawa itulah kali terakhir saya mendengar suara
                beliau secara jelas. Itulah kali terakhir saya duduk bersebelahan dengannya.
                Dan itulah kali terakhir saya berpeluang menatap wajahnya dalam keadaan masih
                mampu berbicara.
              </p>

              <p>
                Keesokan harinya, 21 Mei 2026, keadaan beliau semakin merosot. Beliau
                mengalami kesukaran bernafas dan terpaksa dibawa ke Jabatan Kecemasan HSI.
                Sejak hari itu, kesihatannya jatuh dengan sangat pantas. Hari demi hari
                berlalu. Kami hanya mampu berdoa.
              </p>
              <p>
                Dan akhirnya, pada 25 Mei 2026 jam 2.00 pagi, Allah SWT menjemput beliau
                pulang menghadap-Nya. Sesungguhnya daripada Allah kita datang dan kepada-Nya
                kita kembali.
              </p>

              <div className="journey-post__inlineVisual journey-post__inlineVisual--reverse">
                <img src={menantuImages.hospitalFarewell} alt="Urusan terakhir Allahyarham di Hospital Sultan Ismail" />
                <div>
                  <span className="section-kicker">Tatapan Terakhir</span>
                  <h4>Saat terakhir itu mengajar kami tentang rapuhnya masa.</h4>
                  <p>
                    Di hospital, setiap wajah menyimpan doa yang sama: semoga Allah
                    mengampuni, merahmati, dan memuliakan kepulangan beliau.
                  </p>
                </div>
              </div>

              <div className="journey-post__inlineVisual">
                <img src={menantuImages.vanJenazah} alt="Van jenazah Masjid Jamek Taman Pasir Putih" />
                <div>
                  <span className="section-kicker">Perjalanan Terakhir</span>
                  <h4>Ada perjalanan yang hanya kita faham maknanya selepas semuanya selesai.</h4>
                  <p>
                    Dari perjalanan ke hospital hinggalah urusan terakhir, semuanya menjadi
                    ingatan tentang betapa singkatnya jarak antara sakit, doa dan pulang.
                  </p>
                </div>
              </div>

              <div className="journey-post__inlineVisual journey-post__inlineVisual--reverse">
                <img src={menantuImages.burial} alt="Suasana pengebumian Allahyarham bersama ahli keluarga dan masyarakat" />
                <div>
                  <span className="section-kicker">Pemergian</span>
                  <h4>Yang tinggal ialah doa, kenangan dan amanah kasih keluarga.</h4>
                  <p>
                    Pemergian Allahyarham meninggalkan kekosongan yang besar, namun ia juga
                    memperlihatkan betapa kuatnya kasih sebuah keluarga ketika diuji.
                  </p>
                </div>
              </div>

              <p>
                Pemergian Allahyarham meninggalkan kekosongan yang besar dalam keluarga kami.
                Namun saya bersyukur kerana Allah memberi peluang kepada saya untuk menjadi
                sebahagian daripada perjalanan akhir hidup beliau. Saya bersyukur kerana
                sempat menemani beliau pada perjalanan terakhir ke hospital. Saya bersyukur
                kerana sempat mendengar suaranya buat kali terakhir.
                Dan saya bersyukur kerana dipertemukan dengan seorang bapa mertua yang begitu
                tabah menghadapi ujian sehingga ke penghujung hayatnya.
              </p>

              <p className="journey-post__prayer">
                Semoga Allah SWT mengampuni segala dosa Allahyarham Abd Manan bin Omar,
                melapangkan kuburnya, menjadikan kuburnya taman daripada taman-taman syurga,
                serta menghimpunkannya bersama golongan yang beriman dan beramal soleh.
              </p>
              <p className="journey-post__dateLine">Al-Fatihah.</p>
            </div>

            <div className="journey-post__shareFooter">
              <ShareBar title="Tatapan Terakhir Dalam Ambulans" anchor="#journey-catatan-seorang-menantu" />
            </div>
          </ReadMore>
        </article>

        <article id="journey-guru-cemerlang-ksl" className="journey-post">
          <div className="journey-post__header">
            <div>
              <span className="section-kicker">Catatan Guru - 28 April 2026</span>
              <h3>
                Selagi ada peluang, saya akan terus berjalan dalam laluan ini sebagai seorang
                Guru Cemerlang.
              </h3>
              <ShareBar title="Guru Cemerlang Pasir Gudang" anchor="#journey-guru-cemerlang-ksl" />
            </div>
          </div>

          <div className="journey-post__lead">
            <div className="journey-post__text">
              <p>
                Selasa, 28 April 2026. Jam 11 pagi, saya melangkah masuk ke Infusion Cafe,
                KSL Hotel dengan satu perasaan yang sukar digambarkan — teruja, bangga, dan
                dalam masa yang sama… penuh dengan persoalan dalam diri.
              </p>
              <p>
                Hari itu bukan sekadar perjumpaan biasa. Ia adalah pertemuan lebih 30 orang
                Guru Cemerlang dari seluruh daerah Pasir Gudang. Bila berada dalam ruang yang
                sama dengan individu-individu yang mempunyai tahap komitmen yang tinggi
                terhadap pendidikan, suasananya memang berbeza. Kita bukan sekadar hadir,
                tetapi kita “rasa” satu aura — aura yang mengingatkan kita kenapa kita memilih
                laluan ini sejak awal.
              </p>
              <p>
                Program ini membawa tema “Memperkasa Profesionalisme, Menjamin Kelestarian,
                Melonjak Kecemerlangan”, dan sepanjang perjalanan majlis, saya mula faham
                bahawa ini bukan sekadar kata-kata di atas kertas. Ia adalah satu tanggungjawab
                yang perlu digalas.
              </p>
            </div>

            <figure className="journey-post__heroImage">
              <img src="/MGC (1).jpg" alt="Pertemuan Majlis Guru Cemerlang Pasir Gudang di Infusion Cafe, KSL Hotel" />
              <figcaption>
                Pertemuan Guru Cemerlang Pasir Gudang yang membuka semula ruang refleksi tentang hala tuju pendidikan.
              </figcaption>
            </figure>
          </div>

          <ReadMore className="journey-post__readmore" contentClassName="journey-post__more">
            <div className="journey-post__body">
              <p>
                Slot pertama oleh En. Muhammad Suhairi benar-benar membuka ruang pemikiran
                saya. Beliau tidak bercakap tentang apa yang telah kita capai, tetapi lebih
                kepada satu persoalan yang cukup kuat — “What’s next?” Dalam perkongsian
                beliau, projek seperti GC Buddy dan Pek Individu diperkenalkan sebagai satu
                usaha untuk memastikan Guru Cemerlang terus bergerak, terus berkembang, dan
                tidak terhenti pada satu tahap sahaja. Saya terasa seperti diingatkan dengan
                lembut, bahawa gelaran ini bukan noktah, tetapi permulaan kepada satu
                perjalanan yang lebih besar.
              </p>

              <div className="journey-post__inlineVisual">
                <img src="/MGC (2).jpg" alt="Sesi perkongsian profesionalisme Guru Cemerlang Pasir Gudang" />
                <div>
                  <span className="section-kicker">What's Next?</span>
                  <h4>Gelaran ini bukan noktah, tetapi permulaan kepada perjalanan yang lebih besar.</h4>
                  <p>
                    Perkongsian tentang hala tuju, sokongan rakan sejawat dan projek seperti
                    GC Buddy mengingatkan saya bahawa Guru Cemerlang perlu terus bergerak dan
                    berkembang.
                  </p>
                </div>
              </div>

              <p>
                Apabila Encik Mustakim mengambil alih slot seterusnya, perspektif itu menjadi
                lebih luas. Beliau membentangkan hala tuju sektor perancangan PPD Pasir Gudang
                yang mensasarkan lebih ramai calon Guru Cemerlang menjelang 2027. Pada ketika
                itu, saya tersedar bahawa perjalanan ini bukan sekadar tentang diri sendiri.
                Ia adalah tentang bagaimana kita menjadi sebahagian daripada ekosistem yang
                membina, membimbing, dan membuka jalan kepada guru-guru lain untuk turut
                melangkah ke tahap ini.
              </p>

              <div className="journey-post__inlineVisual journey-post__inlineVisual--reverse">
                <img src="/MGC (3).jpg" alt="Guru Cemerlang mengikuti pembentangan hala tuju pendidikan daerah" />
                <div>
                  <span className="section-kicker">Ekosistem Pendidikan</span>
                  <h4>Perjalanan ini bukan sekadar tentang diri sendiri.</h4>
                  <p>
                    Ia tentang bagaimana setiap guru boleh menjadi sebahagian daripada sistem
                    sokongan yang membimbing, membuka jalan dan mengangkat lebih ramai rakan
                    pendidik.
                  </p>
                </div>
              </div>

              <p>
                Namun, antara yang paling memberi kesan kepada saya adalah perkongsian oleh
                Cikgu Izzaty. Beliau berkongsi amalan terbaik yang bukan sekadar teori, tetapi
                pengalaman sebenar yang telah membawa beliau ke pentas antarabangsa.
                Pencapaiannya sebagai penerima anugerah Teacher Gift 2026 serta peluang
                membentangkan inovasi di UK dan Jepun benar-benar membuka mata saya. Saya
                melihat sendiri bahawa apa yang kita lakukan di bilik darjah, jika digerakkan
                dengan kesungguhan dan konsistensi, mampu pergi jauh melebihi apa yang kita
                bayangkan.
              </p>
              <p>
                Dalam diam, saya bertanya kepada diri sendiri… “Kenapa aku bermula dulu?”
              </p>
              <p>
                Jawapannya masih sama. Untuk murid. Untuk ilmu. Untuk perubahan kecil yang
                mungkin tidak semua orang nampak, tetapi memberi kesan yang besar dalam
                kehidupan seseorang.
              </p>
              <p>
                Hakikatnya, perjalanan sebagai Guru Cemerlang bukanlah satu laluan yang
                sentiasa mendatar. Ada masa kita bersemangat, ada masa kita letih, dan ada
                masa kita mula meragui diri sendiri. Tetapi hari itu, saya belajar bahawa
                semangat itu memang akan turun naik. Yang penting adalah kita tidak berhenti.
              </p>
              <p>
                Sekitar jam 4 petang, majlis bersurai. Saya melangkah keluar dari KSL bukan
                sekadar dengan ilmu baharu, tetapi dengan satu kesedaran yang lebih jelas.
                Saya mungkin tidak sempurna, dan semangat saya mungkin tidak sentiasa tinggi,
                tetapi saya masih berada di laluan yang betul.
              </p>
              <p>
                Dan selagi ada peluang, saya akan terus berjalan dalam laluan ini — sebagai
                seorang Guru Cemerlang.
              </p>
            </div>

            <div className="journey-post__gallery">
              {[
                {
                  src: "/MGC (4).jpg",
                  alt: "Suasana pertemuan Guru Cemerlang Pasir Gudang",
                  caption: "Ruang perkongsian yang menghubungkan pengalaman, hala tuju dan semangat baharu.",
                },
                {
                  src: "/MGC (5).jpg",
                  alt: "Guru Cemerlang dalam sesi profesionalisme di KSL Hotel",
                  caption: "Setiap sesi membawa pulang persoalan penting tentang langkah seterusnya.",
                },
                {
                  src: "/MGC (6).jpg",
                  alt: "Kenangan program Guru Cemerlang Pasir Gudang",
                  caption: "Dari KSL, perjalanan diteruskan dengan kesedaran yang lebih jelas.",
                },
              ].map((image) => (
                <figure className="journey-post__galleryItem" key={image.src}>
                  <img src={image.src} alt={image.alt} />
                  <figcaption>{image.caption}</figcaption>
                </figure>
              ))}
            </div>

            <div className="journey-post__shareFooter">
              <ShareBar title="Guru Cemerlang Pasir Gudang" anchor="#journey-guru-cemerlang-ksl" />
            </div>
          </ReadMore>
        </article>

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
              <p className="statValue">{totalVisitors}</p>
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
