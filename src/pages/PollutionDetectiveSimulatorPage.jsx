import { useEffect, useMemo, useState } from "react";
import "./PollutionDetectiveSimulatorPage.css";

const HOTSPOTS = [
  {
    id: "industri",
    shortLabel: "Industri",
    title: "Kawasan Industri / Kilang",
    image: "/assets/kawasan pencemaran industri.webp",
    hotspot: { left: "1%", top: "10%", width: "46%", height: "45%" },
    observations: [
      "Asap hitam keluar dari cerobong kilang.",
      "Sisa toksik perindustrian mengalir ke sungai.",
      "Air berhampiran kawasan kilang berubah warna.",
    ],
    questions: [
      {
        id: "inference",
        eyebrow: "Langkah 2 · Inferens",
        prompt: "Apakah inferens yang disokong oleh bukti ini?",
        instruction: "Pilih semua inferens yang tepat.",
        options: [
          { id: "i1", text: "Gas berbahaya daripada kilang mencemarkan udara.", correct: true },
          { id: "i2", text: "Sisa toksik boleh mencemarkan sungai dan membunuh hidupan akuatik.", correct: true },
          { id: "i3", text: "Asap kilang menjadikan air sungai lebih bersih.", correct: false },
        ],
      },
      {
        id: "type",
        eyebrow: "Langkah 3 · Kenal pasti",
        prompt: "Apakah jenis pencemaran yang berlaku?",
        instruction: "Lebih daripada satu jawapan mungkin betul.",
        options: [
          { id: "t1", text: "Pencemaran udara", correct: true },
          { id: "t2", text: "Pencemaran air", correct: true },
          { id: "t3", text: "Pencemaran bunyi", correct: false },
        ],
      },
      {
        id: "solution",
        eyebrow: "Langkah 4 · Tindakan",
        prompt: "Apakah langkah penyelesaian yang paling sesuai?",
        instruction: "Pilih semua tindakan yang membantu memulihkan kawasan ini.",
        options: [
          { id: "s1", text: "Pasang penapis asap pada cerobong kilang.", correct: true },
          { id: "s2", text: "Rawat air sisa industri sebelum dilepaskan ke sungai.", correct: true },
          { id: "s3", text: "Pantau pelepasan kilang secara berkala.", correct: true },
          { id: "s4", text: "Tinggikan cerobong tanpa menapis asap.", correct: false },
        ],
      },
    ],
  },
  {
    id: "sungai",
    shortLabel: "Sungai",
    title: "Sungai Tercemar",
    image: "/assets/kawasan pencemaran sungai.webp",
    hotspot: { left: "29%", top: "35%", width: "27%", height: "62%" },
    observations: [
      "Air sungai berwarna kuning keruh.",
      "Banyak ikan mati terapung.",
      "Terdapat asap atau wap toksik berhampiran permukaan air.",
    ],
    questions: [
      {
        id: "inference",
        eyebrow: "Langkah 2 · Inferens",
        prompt: "Apakah inferens yang disokong oleh bukti ini?",
        instruction: "Pilih semua inferens yang tepat.",
        options: [
          { id: "i1", text: "Air mengandungi bahan toksik yang menurunkan kualiti air.", correct: true },
          { id: "i2", text: "Ikan mati akibat kekurangan oksigen terlarut atau keracunan.", correct: true },
          { id: "i3", text: "Warna keruh membuktikan air selamat diminum.", correct: false },
        ],
      },
      {
        id: "type",
        eyebrow: "Langkah 3 · Kenal pasti",
        prompt: "Apakah jenis pencemaran yang berlaku?",
        instruction: "Pilih jawapan yang paling tepat.",
        options: [
          { id: "t1", text: "Pencemaran air", correct: true },
          { id: "t2", text: "Pencemaran cahaya", correct: false },
          { id: "t3", text: "Pencemaran bunyi", correct: false },
        ],
      },
      {
        id: "solution",
        eyebrow: "Langkah 4 · Tindakan",
        prompt: "Apakah langkah penyelesaian yang paling sesuai?",
        instruction: "Pilih semua tindakan yang betul.",
        options: [
          { id: "s1", text: "Hentikan pembuangan sisa toksik ke sungai.", correct: true },
          { id: "s2", text: "Jalankan rawatan air tercemar.", correct: true },
          { id: "s3", text: "Kenakan tindakan kepada pembuang sisa haram.", correct: true },
          { id: "s4", text: "Tutup permukaan sungai supaya pencemaran tidak kelihatan.", correct: false },
        ],
      },
    ],
  },
  {
    id: "pertanian",
    shortLabel: "Pertanian",
    title: "Kawasan Pertanian",
    image: "/assets/kawasan pencemaran pertanian.webp",
    hotspot: { left: "79%", top: "49%", width: "20%", height: "48%" },
    observations: [
      "Petani menyembur racun serangga secara berlebihan.",
      "Parit pertanian berwarna hijau kekuningan.",
      "Ujian menunjukkan BOD tinggi dan tanah sangat berasid.",
    ],
    questions: [
      {
        id: "inference",
        eyebrow: "Langkah 2 · Inferens",
        prompt: "Apakah inferens yang disokong oleh bukti ini?",
        instruction: "Pilih semua inferens yang tepat.",
        options: [
          { id: "i1", text: "Baja dan racun berlebihan menyebabkan eutrofikasi di parit.", correct: true },
          { id: "i2", text: "BOD tinggi menunjukkan banyak oksigen digunakan untuk menguraikan bahan organik.", correct: true },
          { id: "i3", text: "Bahan kimia pertanian berlebihan menyebabkan tanah berasid.", correct: true },
          { id: "i4", text: "BOD tinggi menandakan air sangat bersih.", correct: false },
        ],
      },
      {
        id: "type",
        eyebrow: "Langkah 3 · Kenal pasti",
        prompt: "Apakah jenis pencemaran yang berlaku?",
        instruction: "Lebih daripada satu jawapan mungkin betul.",
        options: [
          { id: "t1", text: "Pencemaran air", correct: true },
          { id: "t2", text: "Pencemaran tanah", correct: true },
          { id: "t3", text: "Pencemaran bunyi", correct: false },
        ],
      },
      {
        id: "solution",
        eyebrow: "Langkah 4 · Tindakan",
        prompt: "Apakah langkah penyelesaian yang paling sesuai?",
        instruction: "Pilih semua tindakan yang betul.",
        options: [
          { id: "s1", text: "Kurangkan penggunaan baja kimia dan racun serangga.", correct: true },
          { id: "s2", text: "Gunakan kaedah kawalan biologi.", correct: true },
          { id: "s3", text: "Bina zon penampan tumbuhan di tepi parit.", correct: true },
          { id: "s4", text: "Amalkan pertanian lestari.", correct: true },
          { id: "s5", text: "Tambah dos racun supaya hasil lebih cepat.", correct: false },
        ],
      },
    ],
  },
  {
    id: "kenderaan",
    shortLabel: "Asap Kenderaan",
    title: "Jalan Raya / Asap Kenderaan",
    image: "/assets/kawasan pencemaran udara asap kenderaan.webp",
    hotspot: { left: "54%", top: "27%", width: "25%", height: "70%" },
    observations: [
      "Kenderaan berat dan ringan mengeluarkan asap hitam.",
      "Seorang individu batuk akibat udara tercemar.",
      "Bacaan suhu persekitaran menunjukkan 60°C.",
    ],
    questions: [
      {
        id: "inference",
        eyebrow: "Langkah 2 · Inferens",
        prompt: "Apakah inferens yang disokong oleh bukti ini?",
        instruction: "Pilih semua inferens yang tepat.",
        options: [
          { id: "i1", text: "Asap kenderaan membebaskan karbon monoksida dan karbon dioksida.", correct: true },
          { id: "i2", text: "Peningkatan gas rumah hijau menyumbang kepada pemanasan global.", correct: true },
          { id: "i3", text: "Udara tercemar boleh menjejaskan sistem pernafasan.", correct: true },
          { id: "i4", text: "Asap hitam meningkatkan kandungan oksigen udara.", correct: false },
        ],
      },
      {
        id: "type",
        eyebrow: "Langkah 3 · Kenal pasti",
        prompt: "Apakah jenis pencemaran yang berlaku?",
        instruction: "Pilih jawapan yang paling tepat.",
        options: [
          { id: "t1", text: "Pencemaran udara", correct: true },
          { id: "t2", text: "Pencemaran air", correct: false },
          { id: "t3", text: "Pencemaran tanah", correct: false },
        ],
      },
      {
        id: "solution",
        eyebrow: "Langkah 4 · Tindakan",
        prompt: "Apakah langkah penyelesaian yang paling sesuai?",
        instruction: "Pilih semua tindakan yang betul.",
        options: [
          { id: "s1", text: "Galakkan penggunaan pengangkutan awam.", correct: true },
          { id: "s2", text: "Gunakan kenderaan elektrik atau rendah emisi.", correct: true },
          { id: "s3", text: "Servis enjin kenderaan secara berkala.", correct: true },
          { id: "s4", text: "Kurangkan pembakaran bahan api fosil.", correct: true },
          { id: "s5", text: "Biarkan enjin hidup ketika kenderaan berhenti.", correct: false },
        ],
      },
    ],
  },
  {
    id: "pembalakan",
    shortLabel: "Pembalakan",
    title: "Pembalakan / Tanah Runtuh",
    image: "/assets/kawasan pencemaran udara tanah runtuh.webp",
    hotspot: { left: "51%", top: "3%", width: "48%", height: "38%" },
    observations: [
      "Kawasan hutan ditebang secara besar-besaran.",
      "Banyak tunggul pokok, kayu balak, tanah runtuh dan banjir lumpur.",
      "Suhu persekitaran 60°C dan kandungan karbon dioksida tinggi.",
    ],
    questions: [
      {
        id: "inference",
        eyebrow: "Langkah 2 · Inferens",
        prompt: "Apakah inferens yang disokong oleh bukti ini?",
        instruction: "Pilih semua inferens yang tepat.",
        options: [
          { id: "i1", text: "Penebangan pokok mengurangkan penyerapan karbon dioksida.", correct: true },
          { id: "i2", text: "Karbon dioksida tinggi meningkatkan kesan rumah hijau.", correct: true },
          { id: "i3", text: "Kehilangan akar menyebabkan tanah longgar dan mudah runtuh.", correct: true },
          { id: "i4", text: "Pembalakan boleh menyebabkan banjir lumpur dan kehilangan habitat.", correct: true },
          { id: "i5", text: "Tanpa pokok, tanah menjadi lebih kukuh.", correct: false },
        ],
      },
      {
        id: "type",
        eyebrow: "Langkah 3 · Kenal pasti",
        prompt: "Apakah kesan alam sekitar yang berlaku?",
        instruction: "Lebih daripada satu jawapan mungkin betul.",
        options: [
          { id: "t1", text: "Pencemaran udara", correct: true },
          { id: "t2", text: "Kemusnahan hutan / gangguan ekosistem", correct: true },
          { id: "t3", text: "Hakisan tanah", correct: true },
          { id: "t4", text: "Peningkatan biodiversiti", correct: false },
        ],
      },
      {
        id: "solution",
        eyebrow: "Langkah 4 · Tindakan",
        prompt: "Apakah langkah penyelesaian yang paling sesuai?",
        instruction: "Pilih semua tindakan yang betul.",
        options: [
          { id: "s1", text: "Hentikan pembalakan haram.", correct: true },
          { id: "s2", text: "Jalankan penanaman semula pokok.", correct: true },
          { id: "s3", text: "Wujudkan kawasan hutan simpan.", correct: true },
          { id: "s4", text: "Pantau aktiviti pembalakan dengan penguatkuasaan dan teknologi.", correct: true },
          { id: "s5", text: "Buka lebih banyak kawasan hutan tanpa kawalan.", correct: false },
        ],
      },
    ],
  },
];

const RESTORATION_PROJECTS = [
  {
    id: "penapis-asap",
    icon: "🏭",
    title: "Penapis Asap Industri",
    cost: 30,
    effects: { udara: 30, kesihatan: 10 },
    description: "Mengurangkan pelepasan asap dan gas berbahaya daripada kilang.",
  },
  {
    id: "loji-rawatan",
    icon: "🧪",
    title: "Loji Rawatan Air Sisa Industri",
    cost: 40,
    effects: { air: 40, biodiversiti: 10, kesihatan: 10 },
    description: "Merawat sisa industri sebelum dilepaskan ke sungai.",
  },
  {
    id: "penanaman-hutan",
    icon: "🌳",
    title: "Program Penanaman Semula Hutan",
    cost: 25,
    effects: { udara: 10, air: 10, biodiversiti: 40, kesihatan: 10 },
    description: "Menanam semula pokok di kawasan pembalakan.",
  },
  {
    id: "kawalan-racun",
    icon: "🧴",
    title: "Program Kawalan Racun Pertanian",
    cost: 15,
    effects: { air: 20, biodiversiti: 15, kesihatan: 5 },
    description: "Mengurangkan penggunaan racun perosak dan baja kimia.",
  },
  {
    id: "pertanian-lestari",
    icon: "🌾",
    title: "Sistem Pertanian Lestari",
    cost: 20,
    effects: { air: 15, biodiversiti: 10, kesihatan: 10 },
    description: "Menggalakkan amalan pertanian mesra alam.",
  },
  {
    id: "kesedaran-awam",
    icon: "📣",
    title: "Kempen Kesedaran Awam",
    cost: 10,
    effects: { udara: 5, air: 5, kesihatan: 10 },
    description: "Meningkatkan kesedaran masyarakat tentang penjagaan alam sekitar.",
  },
  {
    id: "bas-elektrik",
    icon: "🚌",
    title: "Bas Elektrik Bandar",
    cost: 35,
    effects: { udara: 25, kesihatan: 15 },
    description: "Mengurangkan pencemaran udara akibat penggunaan bahan api fosil.",
  },
  {
    id: "pemantauan-sungai",
    icon: "📡",
    title: "Sistem Pemantauan Sungai Pintar",
    cost: 20,
    effects: { air: 15, biodiversiti: 5 },
    description: "Mengesan pencemaran sungai secara masa nyata.",
  },
  {
    id: "penguatkuasaan-pembalakan",
    icon: "🛡️",
    title: "Penguatkuasaan Pembalakan Haram",
    cost: 15,
    effects: { udara: 10, biodiversiti: 20 },
    description: "Mengurangkan kemusnahan hutan dan kehilangan habitat.",
  },
  {
    id: "habitat-sungai",
    icon: "🐟",
    title: "Program Pemulihan Habitat Sungai",
    cost: 25,
    effects: { air: 20, biodiversiti: 25 },
    description: "Memulihkan ekosistem sungai dan habitat hidupan akuatik.",
  },
];

const INDICATORS = [
  { id: "udara", icon: "💨", label: "Kualiti Udara", shortLabel: "Udara" },
  { id: "air", icon: "💧", label: "Kualiti Air", shortLabel: "Air" },
  { id: "biodiversiti", icon: "🍃", label: "Biodiversiti", shortLabel: "Biodiversiti" },
  { id: "kesihatan", icon: "❤️", label: "Kesihatan Penduduk", shortLabel: "Kesihatan" },
];

const INITIAL_INDICATORS = { udara: 20, air: 20, biodiversiti: 20, kesihatan: 20 };

function getRestorationEvaluation(average) {
  if (average >= 90) {
    return {
      icon: "🌟",
      tone: "excellent",
      title: "Bandar Harmoni Pulih Cemerlang",
      message: "Tahniah! Keputusan anda berjaya memulihkan alam sekitar secara optimum.",
    };
  }

  if (average >= 75) {
    return {
      icon: "✅",
      tone: "good",
      title: "Bandar Harmoni Semakin Pulih",
      message: "Keadaan alam sekitar bertambah baik tetapi masih boleh dipertingkatkan.",
    };
  }

  if (average >= 50) {
    return {
      icon: "⚠",
      tone: "moderate",
      title: "Pemulihan Sederhana",
      message: "Beberapa masalah alam sekitar masih belum diselesaikan sepenuhnya.",
    };
  }

  return {
    icon: "❌",
    tone: "weak",
    title: "Bandar Harmoni Masih Tercemar",
    message: "Peruntukan bajet tidak digunakan secara berkesan.",
  };
}

function InvestigationModal({ area, completed, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [checkedObservations, setCheckedObservations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const orderedQuestions = useMemo(() => {
    const order = { type: 0, inference: 1, solution: 2 };
    return [...area.questions].sort((a, b) => order[a.id] - order[b.id]);
  }, [area.questions]);
  const question = orderedQuestions[step - 1];
  const allObservationsChecked = checkedObservations.length === area.observations.length;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggleOption = (id) => {
    setFeedback(null);
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleObservation = (index) => {
    setCheckedObservations((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  };

  const checkAnswer = () => {
    if (feedback?.type === "success") return;

    if (!selected.length) {
      setFeedback({ type: "warning", text: "Pilih sekurang-kurangnya satu jawapan dahulu." });
      return;
    }

    const correctIds = question.options.filter((option) => option.correct).map((option) => option.id);
    const isCorrect =
      selected.length === correctIds.length && correctIds.every((id) => selected.includes(id));

    if (!isCorrect) {
      setFeedback({ type: "error", text: "Cuba semak semula pemerhatian dalam gambar." });
      return;
    }

    if (step === orderedQuestions.length) {
      setFeedback({ type: "success", text: "Bagus! Bukti anda menyokong inferens ini." });
      window.setTimeout(() => onComplete(area.id), 550);
      return;
    }

    setFeedback({ type: "success", text: "Bagus! Bukti anda menyokong inferens ini." });
    window.setTimeout(() => {
      setStep((current) => current + 1);
      setSelected([]);
      setFeedback(null);
    }, 550);
  };

  const progress = step === 0 ? 1 : step + 1;

  return (
    <div className="pollutionModalBackdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="pollutionModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pollution-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="pollutionModal__header">
          <div>
            <span className="pollutionModal__eyebrow">Fail siasatan</span>
            <h2 id="pollution-modal-title">{area.title}</h2>
          </div>
          <button className="pollutionModal__close" type="button" onClick={onClose} aria-label="Tutup siasatan">×</button>
        </header>

        <div className="pollutionModal__progress" aria-label={`Langkah ${progress} daripada 4`}>
          {["Pemerhatian", "Jenis", "Inferens", "Penyelesaian"].map((label, index) => (
            <div className={index + 1 <= progress ? "is-active" : ""} key={label}>
              <span>{index + 1}</span><small>{label}</small>
            </div>
          ))}
        </div>

        <img className="pollutionModal__image" src={area.image} alt={`Bukti visual bagi ${area.title}`} />

        <div className="pollutionModal__body">
          {step === 0 ? (
            <div className="pollutionEvidenceCard">
              <span className="pollutionQuestion__eyebrow">Langkah 1 · Pemerhatian</span>
              <h3>Teliti bukti di tempat kejadian</h3>
              <div className="pollutionEvidenceCard__instruction">
                <p>Tandakan setiap pemerhatian selepas anda membacanya.</p>
                <strong aria-live="polite">{checkedObservations.length}/{area.observations.length} ditanda</strong>
              </div>
              <ul>
                {area.observations.map((observation, index) => {
                  const isChecked = checkedObservations.includes(index);
                  return (
                    <li className={isChecked ? "is-checked" : ""} key={observation}>
                      <button
                        type="button"
                        aria-pressed={isChecked}
                        onClick={() => toggleObservation(index)}
                      >
                        <span className="pollutionObservationCheck" aria-hidden="true">{isChecked ? "✓" : ""}</span>
                        <span>{observation}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {completed && <p className="pollutionModal__completedNote">✓ Kawasan ini telah berjaya disiasat.</p>}
              <button className="pollutionPrimaryButton" type="button" disabled={!allObservationsChecked} onClick={() => setStep(1)}>
                {allObservationsChecked ? "Seterusnya: Jenis Pencemaran" : "Tandakan semua pemerhatian"} <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : (
            <div className="pollutionQuestion">
              <span className="pollutionQuestion__eyebrow">{question.eyebrow}</span>
              <h3>{question.prompt}</h3>
              <p>{question.instruction}</p>
              <div className="pollutionOptions">
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={selected.includes(option.id) ? "is-selected" : ""}
                    aria-pressed={selected.includes(option.id)}
                    disabled={feedback?.type === "success"}
                    onClick={() => toggleOption(option.id)}
                  >
                    <span className="pollutionOptionCheck" aria-hidden="true">{selected.includes(option.id) ? "✓" : ""}</span>
                    {option.text}
                  </button>
                ))}
              </div>
              {feedback && <p className={`pollutionFeedback pollutionFeedback--${feedback.type}`} role="status">{feedback.text}</p>}
              <div className="pollutionQuestion__actions">
                <button className="pollutionTextButton" type="button" disabled={feedback?.type === "success"} onClick={() => { setStep((current) => current - 1); setSelected([]); setFeedback(null); }}>← Kembali</button>
                <button className="pollutionPrimaryButton" type="button" disabled={feedback?.type === "success"} onClick={checkAnswer}>Semak jawapan</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InvestigationCompleteModal({ onHome, onRestoration }) {
  return (
    <div className="pollutionModalBackdrop pollutionModalBackdrop--final" role="presentation">
      <section className="pollutionFinalModal" role="dialog" aria-modal="true" aria-labelledby="pollution-final-title">
        <div className="pollutionFinalModal__icon" aria-hidden="true">🏆</div>
        <span className="pollutionModal__eyebrow">Mod Siasatan selesai</span>
        <h2 id="pollution-final-title">Tahniah!</h2>
        <p>Anda telah menyelesaikan misi siasatan.</p>
        <div className="pollutionFinalModal__actions">
          <button className="pollutionTextButton" type="button" onClick={onHome}>🏠 Kembali ke Utama</button>
          <button className="pollutionPrimaryButton" type="button" onClick={onRestoration}>🏛️ Pergi ke Pemulihan Bandar</button>
        </div>
      </section>
    </div>
  );
}

function SavedInvestigationModal({ onUse, onIgnore }) {
  const findings = [
    "Industri tercemar",
    "Sungai tercemar",
    "Pertanian tercemar",
    "Asap kenderaan tinggi",
    "Pembalakan aktif",
  ];

  return (
    <div className="pollutionModalBackdrop" role="presentation">
      <section className="pollutionSavedDataModal" role="dialog" aria-modal="true" aria-labelledby="saved-data-title">
        <div className="pollutionFinalModal__icon" aria-hidden="true">🗂️</div>
        <span className="pollutionModal__eyebrow">Rekod Bandar Harmoni</span>
        <h2 id="saved-data-title">Data siasatan terdahulu ditemui.</h2>
        <ul>{findings.map((finding) => <li key={finding}>✓ {finding}</li>)}</ul>
        <div className="pollutionFinalModal__actions">
          <button className="pollutionTextButton" type="button" onClick={onIgnore}>Abaikan</button>
          <button className="pollutionPrimaryButton" type="button" onClick={onUse}>Gunakan Data Siasatan</button>
        </div>
      </section>
    </div>
  );
}

function RestorationResultModal({ averageScore, evaluation, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="pollutionModalBackdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`restorationResultModal restorationResultModal--${evaluation.tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="restoration-result-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="restorationResultModal__icon" aria-hidden="true">{evaluation.icon}</div>
        <span className="pollutionModal__eyebrow">Penilaian akhir</span>
        <div className="restorationResultModal__score">{averageScore}%</div>
        <h2 id="restoration-result-title">{evaluation.title}</h2>
        <p>{evaluation.message}</p>
        <button className="pollutionPrimaryButton" type="button" onClick={onClose}>
          Lihat Dashboard &amp; Refleksi
        </button>
      </section>
    </div>
  );
}

function RestorationPhase({ onOpenInvestigation, usingInvestigationData }) {
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);

  const selectedProjects = useMemo(
    () => RESTORATION_PROJECTS.filter((project) => selectedProjectIds.includes(project.id)),
    [selectedProjectIds],
  );

  const totalUsed = useMemo(
    () => selectedProjects.reduce((total, project) => total + project.cost, 0),
    [selectedProjects],
  );

  const indicatorScores = useMemo(() => {
    const scores = { ...INITIAL_INDICATORS };
    selectedProjects.forEach((project) => {
      Object.entries(project.effects).forEach(([indicator, effect]) => {
        scores[indicator] = Math.min(100, scores[indicator] + effect);
      });
    });
    return scores;
  }, [selectedProjects]);

  const remainingBudget = 100 - totalUsed;
  const isOverBudget = totalUsed > 100;
  const averageScore = Math.round(
    Object.values(indicatorScores).reduce((total, score) => total + score, 0) /
      INDICATORS.length,
  );
  const evaluation = getRestorationEvaluation(averageScore);

  const toggleProject = (projectId) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
    setHasExecuted(false);
    setShowEvaluation(false);
  };

  const resetProjects = () => {
    setSelectedProjectIds([]);
    setHasExecuted(false);
    setShowEvaluation(false);
  };

  const executeProjects = () => {
    if (isOverBudget) return;
    setHasExecuted(true);
    window.setTimeout(() => {
      document.getElementById("restoration-dashboard")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    window.setTimeout(() => setShowEvaluation(true), 850);
  };

  return (
    <section className="restorationPhase" aria-labelledby="restoration-phase-title">
      <header className="restorationPhase__header">
        <div>
          <span className="pollutionHero__kicker">Mod 2 · PBL + STEM + KBAT</span>
          <h2 id="restoration-phase-title">🏛️ Pemulihan Bandar Harmoni</h2>
          <p>Bandar Harmoni sedang mengalami pelbagai masalah alam sekitar. Kerajaan telah memperuntukkan RM100 juta untuk melaksanakan projek pemulihan. Pilih projek yang paling sesuai.</p>
        </div>
        <div className="restorationRoleBadge">
          <span aria-hidden="true">🌱</span>
          <div><small>Peranan anda</small><strong>Pegawai Alam Sekitar</strong></div>
        </div>
      </header>

      {usingInvestigationData && (
        <div className="restorationEvidenceBanner" role="status">
          <span aria-hidden="true">🗂️</span>
          <div><strong>Data siasatan digunakan</strong><p>Bukti lima kawasan pencemaran tersedia sebagai panduan pemilihan projek.</p></div>
        </div>
      )}

      <div className="restorationPlanner">
        <div className="restorationProjectPanel">
          <figure className="restorationCityVisual">
            <img src="/assets/bandar harmoni.webp" alt="Bandar Harmoni yang telah dipulihkan dengan sungai bersih, kawasan hijau, tenaga boleh baharu dan pengangkutan lestari" />
            <figcaption><span aria-hidden="true">🌿</span><div><strong>Visi Bandar Harmoni</strong><small>Bandar hijau, masa depan lestari</small></div></figcaption>
          </figure>
          <div className="restorationProjectHeading">
            <div><span>Portfolio projek</span><h3>Pilih projek pemulihan</h3></div>
            <p>{selectedProjectIds.length} daripada {RESTORATION_PROJECTS.length} projek dipilih</p>
          </div>

          <div className="restorationProjectGrid">
            {RESTORATION_PROJECTS.map((project, index) => {
              const selected = selectedProjectIds.includes(project.id);
              return (
                <button
                  type="button"
                  key={project.id}
                  className={`restorationProjectCard${selected ? " is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => toggleProject(project.id)}
                >
                  <span className="restorationProjectCard__icon" aria-hidden="true">{project.icon}</span>
                  <span className="restorationProjectCard__number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="restorationProjectCard__check" aria-hidden="true">{selected ? "✓" : ""}</span>
                  <span className="restorationProjectCard__title">{project.title}</span>
                  <span className="restorationProjectCard__cost">RM{project.cost} juta</span>
                  <span className="restorationProjectCard__description">{project.description}</span>
                  <span className="restorationProjectCard__effects">
                    {Object.entries(project.effects).map(([indicatorId, effect]) => {
                      const indicator = INDICATORS.find((item) => item.id === indicatorId);
                      return <small key={indicatorId}>{indicator?.shortLabel} +{effect}</small>;
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="restorationControlPanel" aria-label="Panel kawalan pemulihan">
          <div className="restorationControlPanel__title"><span aria-hidden="true">💰</span><div><small>Panel keputusan</small><h3>Bajet Pemulihan</h3></div></div>
          <div className={`restorationBudget${isOverBudget ? " is-over" : ""}`}>
            <div><span>Bajet Asal</span><strong>RM100<small> juta</small></strong></div>
            <div><span>Digunakan</span><strong>RM{totalUsed}<small> juta</small></strong></div>
            <div><span>Baki</span><strong>RM{remainingBudget}<small> juta</small></strong></div>
            <div className="restorationBudget__meter" aria-label={`${totalUsed}% bajet telah digunakan`}>
              <span style={{ width: `${Math.min(totalUsed, 100)}%` }} />
            </div>
            {isOverBudget && <p className="restorationBudget__warning" role="alert">❌ Bajet tidak mencukupi. Batalkan sekurang-kurangnya satu projek.</p>}
          </div>

          <section className="restorationLivePreview" aria-labelledby="restoration-live-title">
            <header>
              <div><span>Pratonton masa nyata</span><h3 id="restoration-live-title">Indikator Alam Sekitar</h3></div>
              <p>Nilai meningkat mengikut projek yang dipilih.</p>
            </header>
            <div className="restorationIndicators restorationIndicators--live" aria-live="polite">
              {INDICATORS.map((indicator) => {
                const score = indicatorScores[indicator.id];
                const tone = score >= 75 ? "good" : score >= 50 ? "moderate" : "weak";
                return (
                  <div className={`restorationIndicator restorationIndicator--${indicator.id}`} key={indicator.id}>
                    <div><strong><i aria-hidden="true">{indicator.icon}</i>{indicator.label}</strong><span>{score}%</span></div>
                    <div className={`restorationIndicator__track restorationIndicator__track--${tone}`}>
                      <span style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="restorationActionBar">
            <div>
              <strong>{isOverBudget ? `Lebihan RM${Math.abs(remainingBudget)} juta` : `Baki RM${remainingBudget} juta`}</strong>
              <span>{isOverBudget ? "Kurangkan perbelanjaan sebelum melaksanakan projek." : "Sedia untuk melaksanakan pelan anda."}</span>
            </div>
            <button className="pollutionPrimaryButton" type="button" disabled={isOverBudget} onClick={executeProjects}>Laksanakan Projek <span aria-hidden="true">▶</span></button>
            <button className="pollutionTextButton" type="button" onClick={resetProjects}>↻ Reset Pilihan</button>
          </div>
        </aside>
      </div>

      {hasExecuted && (
        <section id="restoration-dashboard" className="restorationDashboard" aria-labelledby="restoration-dashboard-title">
          <header className="restorationDashboard__header">
            <div><span>Hasil simulasi</span><h3 id="restoration-dashboard-title">Dashboard Pemulihan</h3></div>
            <div className={`restorationAverage restorationAverage--${evaluation.tone}`}><strong>{averageScore}%</strong><small>Purata impak</small></div>
          </header>

          <div className="restorationIndicators">
            {INDICATORS.map((indicator) => {
              const score = indicatorScores[indicator.id];
              const tone = score >= 75 ? "good" : score >= 50 ? "moderate" : "weak";
              return (
                <div className="restorationIndicator" key={indicator.id}>
                  <div><strong>{indicator.label}</strong><span>{score}%</span></div>
                  <div className={`restorationIndicator__track restorationIndicator__track--${tone}`}>
                    <span style={{ width: `${score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`restorationResult restorationResult--${evaluation.tone}`} role="status">
            <span aria-hidden="true">{evaluation.icon}</span>
            <div><small>Penilaian akhir</small><h3>{evaluation.title}</h3><p>{evaluation.message}</p></div>
          </div>

          <div className="restorationReflection">
            <div className="restorationReflection__heading"><span aria-hidden="true">💭</span><div><small>Refleksi murid</small><h3>Fikirkan semula keputusan anda</h3></div></div>
            {[
              "Projek manakah yang memberikan impak paling besar?",
              "Jika diberi RM50 juta tambahan, projek apakah yang akan anda pilih?",
              "Mengapakah sesetengah masalah alam sekitar lebih sukar diselesaikan berbanding yang lain?",
            ].map((question, index) => (
              <label key={question}><span>{index + 1}</span><strong>{question}</strong><textarea rows="3" placeholder="Catat refleksi anda di sini…" /></label>
            ))}
          </div>

          <div className="restorationDashboard__actions">
            <button className="pollutionTextButton" type="button" onClick={() => setHasExecuted(false)}>← Ubah pilihan projek</button>
            <button className="pollutionTextButton" type="button" onClick={resetProjects}>↻ Reset Fasa 2</button>
            <button className="pollutionPrimaryButton" type="button" onClick={onOpenInvestigation}>🕵️ Pergi ke Mod Siasatan</button>
          </div>
        </section>
      )}
      {showEvaluation && (
        <RestorationResultModal
          averageScore={averageScore}
          evaluation={evaluation}
          onClose={() => setShowEvaluation(false)}
        />
      )}
    </section>
  );
}

function ModeNavigation({ view, onNavigate }) {
  const items = [
    ["HOME", "🏠 Utama"],
    ["INVESTIGATION", "🕵️ Siasatan"],
    ["RESTORATION", "🏛️ Pemulihan"],
    ["INFO", "ℹ️ Info"],
  ];

  return (
    <nav className="pollutionModeNav" aria-label="Navigasi simulator Bandar Harmoni">
      <div className="pollutionModeNav__brand"><span aria-hidden="true">🌏</span><strong>Bandar Harmoni</strong></div>
      <div className="pollutionModeNav__links">
        {items.map(([id, label]) => (
          <button key={id} type="button" className={view === id ? "is-active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => onNavigate(id)}>{label}</button>
        ))}
      </div>
    </nav>
  );
}

function SimulatorLanding({ onInvestigation, onRestoration }) {
  return (
    <section className="pollutionLanding" aria-labelledby="pollution-landing-title">
      <header className="pollutionLanding__hero">
        <span>Sains Tingkatan 5 · Bab 3 · Kelestarian Alam Sekitar</span>
        <h1 id="pollution-landing-title">🌏 Detektif Pencemaran Alam</h1>
        <p>“Siasat punca pencemaran dan bantu memulihkan Bandar Harmoni.”</p>
      </header>
      <div className="pollutionModeCards">
        <article className="pollutionModeCard pollutionModeCard--investigation">
          <div className="pollutionModeCard__icon" aria-hidden="true">🕵️</div>
          <span className="pollutionModeCard__number">Mod 1</span>
          <h2>Detektif Pencemaran Alam</h2>
          <p>Anda bertindak sebagai saintis alam sekitar.</p>
          <strong>Tugas anda adalah:</strong>
          <ul>
            <li>Membuat pemerhatian</li>
            <li>Mengenal pasti jenis pencemaran</li>
            <li>Membuat inferens</li>
            <li>Mencadangkan penyelesaian</li>
          </ul>
          <div className="pollutionModeCard__approach"><small>Pendekatan</small><b>IBSE + PBL</b></div>
          <button className="pollutionPrimaryButton" type="button" onClick={onInvestigation}>Mulakan Siasatan</button>
        </article>
        <article className="pollutionModeCard pollutionModeCard--restoration">
          <div className="pollutionModeCard__icon" aria-hidden="true">🏛️</div>
          <span className="pollutionModeCard__number">Mod 2</span>
          <h2>Pemulihan Bandar Harmoni</h2>
          <p>Anda diberi bajet RM100 juta untuk memulihkan bandar yang tercemar.</p>
          <strong>Misi anda:</strong>
          <ul>
            <li>Pilih projek yang paling berkesan</li>
            <li>Urus bajet yang terhad</li>
            <li>Nilai impak terhadap alam sekitar</li>
            <li>Buat keputusan berasaskan bukti</li>
          </ul>
          <div className="pollutionModeCard__approach"><small>Pendekatan</small><b>PBL + STEM + KBAT</b></div>
          <button className="pollutionPrimaryButton" type="button" onClick={onRestoration}>Mulakan Pemulihan</button>
        </article>
      </div>
    </section>
  );
}

function SimulatorInfo() {
  return (
    <section className="pollutionInfoPage" aria-labelledby="pollution-info-title">
      <header><span className="pollutionHero__kicker">ℹ️ Panduan Pembelajaran</span><h1 id="pollution-info-title">Objektif Simulator</h1><p>Dua mod pembelajaran yang boleh digunakan secara berasingan mengikut objektif pengajaran guru.</p></header>
      <div className="pollutionInfoGrid">
        <article><span aria-hidden="true">🕵️</span><small>Mod 1</small><h2>Detektif Pencemaran Alam</h2><strong>Fokus:</strong><ul><li>Pemerhatian</li><li>Inferens</li><li>Jenis pencemaran</li><li>Penyelesaian</li></ul><b>IBSE + PBL</b></article>
        <article><span aria-hidden="true">🏛️</span><small>Mod 2</small><h2>Pemulihan Bandar Harmoni</h2><strong>Fokus:</strong><ul><li>Pengurusan bajet</li><li>Membuat keputusan</li><li>Menilai impak projek</li><li>KBAT dan STEM</li></ul><b>PBL + STEM + KBAT</b></article>
      </div>
    </section>
  );
}

export default function PollutionDetectiveSimulatorPage({ reviewPanel }) {
  const [view, setView] = useState("HOME");
  const [activeAreaId, setActiveAreaId] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [showInvestigationComplete, setShowInvestigationComplete] = useState(false);
  const [showSavedData, setShowSavedData] = useState(false);
  const [savedPromptShown, setSavedPromptShown] = useState(false);
  const [usingInvestigationData, setUsingInvestigationData] = useState(false);
  const activeArea = useMemo(() => HOTSPOTS.find((area) => area.id === activeAreaId), [activeAreaId]);

  useEffect(() => {
    document.body.style.overflow = activeArea || showInvestigationComplete || showSavedData ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeArea, showInvestigationComplete, showSavedData]);

  useEffect(() => {
    if (completedIds.length !== HOTSPOTS.length) return;
    try {
      window.localStorage.setItem("bandar-harmoni-investigation-completed", "true");
    } catch {
      // Simulator masih boleh digunakan jika storan pelayar disekat.
    }
    setSavedPromptShown(false);
    setShowInvestigationComplete(true);
  }, [completedIds]);

  useEffect(() => {
    if (view !== "RESTORATION" || savedPromptShown) return;
    let hasSavedInvestigation = false;
    try {
      hasSavedInvestigation = window.localStorage.getItem("bandar-harmoni-investigation-completed") === "true";
    } catch {
      hasSavedInvestigation = false;
    }
    if (hasSavedInvestigation) setShowSavedData(true);
    setSavedPromptShown(true);
  }, [view, savedPromptShown]);

  const navigateToView = (nextView) => {
    setActiveAreaId(null);
    setShowInvestigationComplete(false);
    setShowSavedData(false);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completeArea = (id) => {
    setCompletedIds((current) => current.includes(id) ? current : [...current, id]);
    setActiveAreaId(null);
  };

  const resetInvestigation = () => {
    setCompletedIds([]);
    setActiveAreaId(null);
    setShowInvestigationComplete(false);
    setShowHints(false);
  };

  return (
    <main className="pollutionSimulator">
      <ModeNavigation view={view} onNavigate={navigateToView} />

      {view === "HOME" && <SimulatorLanding onInvestigation={() => navigateToView("INVESTIGATION")} onRestoration={() => navigateToView("RESTORATION")} />}

      {view === "INVESTIGATION" && <>
        <header className="pollutionSectionHero">
          <div><span className="pollutionHero__kicker">Mod 1 · IBSE + PBL</span><h1>🕵️ Detektif Pencemaran Alam</h1><p>Perhati bukti, kenal pasti pencemaran, bina inferens dan cadangkan penyelesaian.</p></div>
          <div className="pollutionHero__badge"><span aria-hidden="true">🔎</span><strong>{completedIds.length}/{HOTSPOTS.length} selesai</strong><small>Misi Siasatan</small></div>
        </header>
        <section className="pollutionWorkspace">
          <div className="pollutionSceneCard">
            <div className="pollutionSceneCard__header"><div><span className="pollutionLiveDot" aria-hidden="true" />Peta siasatan Bandar Harmoni</div><p>Klik kawasan yang mencurigakan untuk mengumpul bukti.</p></div>
            <div className="pollutionScene">
              <img src="/assets/pencemaran background.webp" alt="Bandar Harmoni yang mengalami pencemaran industri, sungai, pertanian, kenderaan dan pembalakan" />
              {HOTSPOTS.map((area, index) => {
                const isCompleted = completedIds.includes(area.id);
                return <button key={area.id} type="button" className={`pollutionHotspot${showHints ? " show-hint" : ""}${isCompleted ? " is-completed" : ""}`} style={{ ...area.hotspot, zIndex: index + 2 }} onClick={() => setActiveAreaId(area.id)} aria-label={`${isCompleted ? "Selesai: " : "Siasat "}${area.title}`}><span className="pollutionHotspot__pulse" aria-hidden="true" /><span className="pollutionHotspot__label">{area.shortLabel}</span>{isCompleted && <span className="pollutionHotspot__check" aria-hidden="true">✓</span>}</button>;
              })}
            </div>
          </div>
          <aside className="pollutionMissionPanel">
            <span className="pollutionMissionPanel__kicker">Fail kes #BH-03</span><h2>Panel Misi</h2><p>Siasat kelima-lima lokasi. Gunakan pemerhatian sebagai bukti sebelum membuat inferens dan memilih tindakan.</p>
            <div className="pollutionScoreCard"><div className="pollutionScoreCard__top"><span>Kemajuan siasatan</span><strong>{completedIds.length}/{HOTSPOTS.length}</strong></div><div className="pollutionScoreTrack"><span style={{ width: `${(completedIds.length / HOTSPOTS.length) * 100}%` }} /></div><small>{completedIds.length === HOTSPOTS.length ? "Semua bukti berjaya disahkan!" : `${HOTSPOTS.length - completedIds.length} kawasan masih belum selesai`}</small></div>
            <ul className="pollutionCaseList">{HOTSPOTS.map((area) => { const done = completedIds.includes(area.id); return <li key={area.id} className={done ? "is-completed" : ""}><span>{done ? "✓" : ""}</span><button type="button" onClick={() => setActiveAreaId(area.id)}>{area.shortLabel}</button><small>{done ? "Selesai" : "Belum disiasat"}</small></li>; })}</ul>
            <div className="pollutionMissionPanel__actions"><button className={`pollutionHintButton${showHints ? " is-active" : ""}`} type="button" aria-pressed={showHints} onClick={() => setShowHints((current) => !current)}><span aria-hidden="true">💡</span>{showHints ? "Sembunyikan Petunjuk" : "Tunjuk Petunjuk"}</button><button className="pollutionResetButton" type="button" onClick={resetInvestigation}>↻ Reset</button></div>
          </aside>
        </section>
        <section className="pollutionInquiryStrip" aria-label="Aliran penyiasatan"><span>Kaedah penyiasatan</span>{["Perhati bukti", "Kenal pasti pencemaran", "Bina inferens", "Cadangkan penyelesaian"].map((item, index) => <div key={item}><b>{index + 1}</b>{item}{index < 3 && <i aria-hidden="true">→</i>}</div>)}</section>
      </>}

      {view === "RESTORATION" && <RestorationPhase onOpenInvestigation={() => navigateToView("INVESTIGATION")} usingInvestigationData={usingInvestigationData} />}
      {view === "INFO" && <SimulatorInfo />}

      {reviewPanel}
      {activeArea && <InvestigationModal key={activeArea.id} area={activeArea} completed={completedIds.includes(activeArea.id)} onClose={() => setActiveAreaId(null)} onComplete={completeArea} />}
      {showInvestigationComplete && <InvestigationCompleteModal onHome={() => navigateToView("HOME")} onRestoration={() => navigateToView("RESTORATION")} />}
      {showSavedData && <SavedInvestigationModal onUse={() => { setUsingInvestigationData(true); setShowSavedData(false); }} onIgnore={() => { setUsingInvestigationData(false); setShowSavedData(false); }} />}
    </main>
  );
}
