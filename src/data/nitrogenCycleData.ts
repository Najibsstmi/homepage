import bacteriaUrl from "../assets/kitar-nitrogen/bakteria-tanpa-text.webp";
import fallenLeavesUrl from "../assets/kitar-nitrogen/daun-kering.webp";
import cowUrl from "../assets/kitar-nitrogen/lembu.webp";
import nitrogenBackgroundUrl from "../assets/kitar-nitrogen/kitar-nitrogen.webp";
import legumeUrl from "../assets/kitar-nitrogen/pokok-kekacang.webp";
import riverUrl from "../assets/kitar-nitrogen/sungai-eutrofikasi.webp";
import lightningUrl from "../assets/kitar-nitrogen/tindakan-kilat.webp";

export type NitrogenProcessId =
  | "lightning"
  | "fixation"
  | "decomposition"
  | "nitrification"
  | "absorption"
  | "feeding"
  | "denitrification";

export type NitrogenHotspotArea = {
  left: string;
  top: string;
  width: string;
  height: string;
};

export type NitrogenProcess = {
  id: NitrogenProcessId;
  title: string;
  shortTitle: string;
  panelTitle: string;
  before: string;
  after: string;
  importance: string;
  description: string;
  hotspotLabel: string;
  hotspot: NitrogenHotspotArea;
};

export type NitrogenChallenge = {
  id: string;
  report: string;
  clueHotspots: Array<{
    id: string;
    label: string;
    clue: string;
    hotspot: NitrogenHotspotArea;
  }>;
  causeOptions: Array<{
    id: string;
    text: string;
    correct: boolean;
  }>;
  actionOptions: Array<{
    id: string;
    text: string;
    correct: boolean;
  }>;
  result: string;
  concept: string;
  recovery: "legume" | "river" | "soil" | "decomposition" | "denitrification";
};

export const NITROGEN_ASSETS = {
  background: nitrogenBackgroundUrl,
  bacteria: bacteriaUrl,
  fallenLeaves: fallenLeavesUrl,
  cow: cowUrl,
  legume: legumeUrl,
  river: riverUrl,
  lightning: lightningUrl,
} as const;

export const NITROGEN_BACKGROUND = NITROGEN_ASSETS.background;

export const NITROGEN_PROCESSES: readonly NitrogenProcess[] = [
  {
    id: "lightning",
    title: "Tindakan Kilat",
    shortTitle: "Kilat",
    panelTitle: "Tindakan kilat",
    before: "gas nitrogen (N2) di atmosfera",
    after: "ion nitrat (NO3-) dalam tanah",
    importance: "Menambah ion nitrat ke dalam tanah untuk kegunaan tumbuhan.",
    description:
      "Tindakan kilat menukarkan nitrogen di atmosfera kepada sebatian nitrogen yang dibawa oleh air hujan ke tanah sebagai ion nitrat.",
    hotspotLabel: "Udara / kilat",
    hotspot: { left: "32%", top: "5%", width: "25%", height: "30%" },
  },
  {
    id: "fixation",
    title: "Pengikatan Nitrogen",
    shortTitle: "Pengikatan",
    panelTitle: "Pengikatan nitrogen",
    before: "gas nitrogen (N2)",
    after: "ion nitrat (NO3-) dalam tanah",
    importance: "Menambah ion nitrat ke dalam tanah untuk kegunaan tumbuhan.",
    description:
      "Bakteria pengikat nitrogen menukarkan nitrogen daripada udara kepada ion nitrat di dalam tanah.",
    hotspotLabel: "Akar pokok kekacang",
    hotspot: { left: "5%", top: "46%", width: "20%", height: "28%" },
  },
  {
    id: "decomposition",
    title: "Tindak Balas Penguraian",
    shortTitle: "Penguraian",
    panelTitle: "Penguraian bahan organik",
    before: "Bahan organik",
    after: "sebatian ammonium",
    importance: "Menukarkan protein haiwan dan tumbuhan mati kepada sebatian ammonium.",
    description:
      "Bakteria dan kulat pengurai menukarkan protein haiwan dan tumbuhan mati kepada sebatian ammonium.",
    hotspotLabel: "Daun gugur / bahan reput",
    hotspot: { left: "65%", top: "43%", width: "22%", height: "18%" },
  },
  {
    id: "nitrification",
    title: "Proses Penitritan",
    shortTitle: "Penitritan",
    panelTitle: "Proses penitritan",
    before: "sebatian ammonium",
    after: "ion nitrat (NO3-)",
    importance: "Menghasilkan ion nitrat untuk diserap oleh tumbuhan.",
    description:
      "Bakteria penitritan menukarkan sebatian ammonium kepada ion nitrit dan seterusnya ion nitrat.",
    hotspotLabel: "Tanah",
    hotspot: { left: "36%", top: "61%", width: "32%", height: "26%" },
  },
  {
    id: "absorption",
    title: "Penyerapan Ion Nitrat daripada Tanah",
    shortTitle: "Penyerapan",
    panelTitle: "Penyerapan ion nitrat daripada tanah",
    before: "ion nitrat (NO3-) dalam tanah",
    after: "Protein tumbuhan",
    importance: "Ion nitrat digunakan untuk membentuk protein tumbuhan.",
    description:
      "Tumbuhan menyerap ion nitrat daripada tanah melalui akar untuk membentuk protein tumbuhan.",
    hotspotLabel: "Tanah berhampiran akar",
    hotspot: { left: "20%", top: "57%", width: "22%", height: "24%" },
  },
  {
    id: "feeding",
    title: "Tumbuhan Dimakan oleh Haiwan",
    shortTitle: "Pemakanan",
    panelTitle: "Tumbuhan dimakan oleh haiwan",
    before: "Protein tumbuhan",
    after: "Protein haiwan",
    importance: "Memindahkan protein tumbuhan kepada haiwan melalui pemakanan.",
    description:
      "Apabila haiwan memakan tumbuhan, protein tumbuhan dipindahkan kepada haiwan untuk membentuk protein haiwan.",
    hotspotLabel: "Lembu / haiwan",
    hotspot: { left: "51%", top: "30%", width: "23%", height: "28%" },
  },
  {
    id: "denitrification",
    title: "Proses Pendenitritan",
    shortTitle: "Pendenitritan",
    panelTitle: "Proses pendenitritan",
    before: "ion nitrat (NO3-)",
    after: "gas nitrogen (N2)",
    importance: "Mengembalikan nitrogen ke atmosfera.",
    description:
      "Bakteria pendenitritan menukarkan ion nitrat dalam tanah kepada gas nitrogen yang kembali ke udara.",
    hotspotLabel: "Tanah lembap / sungai",
    hotspot: { left: "80%", top: "49%", width: "18%", height: "31%" },
  },
] as const;

export const NITROGEN_CHALLENGES: readonly NitrogenChallenge[] = [
  {
    id: "missing-rhizobium",
    report:
      "Petani mendapati tanaman kekacang tidak subur walaupun disiram setiap hari.",
    clueHotspots: [
      {
        id: "legume-root",
        label: "Akar kekacang",
        clue: "Kurang bakteria pengikat nitrogen pada akar pokok kekacang.",
        hotspot: { left: "8%", top: "47%", width: "20%", height: "24%" },
      },
      {
        id: "soil-nitrate-low",
        label: "Tanah akar",
        clue: "Ion nitrat dalam tanah rendah.",
        hotspot: { left: "17%", top: "58%", width: "18%", height: "23%" },
      },
      {
        id: "atmosphere-n2",
        label: "Atmosfera",
        clue: "Banyak nitrogen atmosfera belum diikat.",
        hotspot: { left: "11%", top: "7%", width: "31%", height: "22%" },
      },
    ],
    causeOptions: [
      {
        id: "missing-rhizobium",
        text: "Kurang bakteria pengikat nitrogen pada akar pokok kekacang",
        correct: true,
      },
      { id: "overactive-denitrification", text: "Pendenitritan terlalu aktif", correct: false },
      { id: "excess-fertilizer", text: "Baja bernitrogen berlebihan", correct: false },
    ],
    actionOptions: [
      {
        id: "add-rhizobium",
        text: "Tambah bakteria pengikat nitrogen pada akar kekacang",
        correct: true,
      },
      { id: "add-more-water", text: "Tambah siraman setiap jam", correct: false },
      { id: "wet-the-soil", text: "Lembapkan tanah sehingga bertakung", correct: false },
    ],
    result: "Pokok kembali subur.",
    concept:
      "Bakteria pengikat nitrogen pada akar pokok kekacang menambah ion nitrat ke dalam tanah.",
    recovery: "legume",
  },
  {
    id: "river-eutrophication",
    report:
      "Sungai berhampiran ladang menjadi hijau dan banyak ikan mati.",
    clueHotspots: [
      {
        id: "river-nitrate",
        label: "Sungai",
        clue: "Ion nitrat terlalu tinggi berhampiran sungai.",
        hotspot: { left: "80%", top: "46%", width: "19%", height: "31%" },
      },
      {
        id: "fertilizer-area",
        label: "Kawasan ladang",
        clue: "Terdapat penggunaan baja berlebihan.",
        hotspot: { left: "32%", top: "38%", width: "25%", height: "23%" },
      },
      {
        id: "fish-death",
        label: "Tebing sungai",
        clue: "Air sungai berwarna hijau dan oksigen berkurang.",
        hotspot: { left: "73%", top: "59%", width: "19%", height: "20%" },
      },
    ],
    causeOptions: [
      {
        id: "excess-fertilizer-runoff",
        text: "Baja bernitrogen berlebihan menyebabkan melarut resap nitrat ke sungai",
        correct: true,
      },
      { id: "no-rhizobium", text: "Tiada bakteria pengikat nitrogen pada akar", correct: false },
      { id: "inactive-decomposers", text: "Pengurai kurang aktif di bawah pokok", correct: false },
    ],
    actionOptions: [
      { id: "reduce-fertilizer", text: "Kurangkan penggunaan baja", correct: true },
      { id: "add-fertilizer", text: "Tambah baja di tebing sungai", correct: false },
      { id: "block-roots", text: "Halang akar menyerap ion nitrat", correct: false },
    ],
    result: "Air sungai beransur pulih.",
    concept:
      "Melarut resap nitrat menyingkirkan ion nitrat daripada tanah dan boleh mengganggu ekosistem sungai.",
    recovery: "river",
  },
  {
    id: "nitrification-disrupted",
    report:
      "Tanah mempunyai banyak sebatian ammonium tetapi tumbuhan masih tidak subur.",
    clueHotspots: [
      {
        id: "ammonium-rich",
        label: "Tanah",
        clue: "Sebatian ammonium banyak terkumpul dalam tanah.",
        hotspot: { left: "36%", top: "61%", width: "30%", height: "24%" },
      },
      {
        id: "bacteria-inactive",
        label: "Bakteria tanah",
        clue: "Bakteria penitritan tidak aktif.",
        hotspot: { left: "42%", top: "56%", width: "25%", height: "20%" },
      },
      {
        id: "nitrate-low",
        label: "Akar tanaman",
        clue: "Ion nitrat rendah walaupun sebatian ammonium tinggi.",
        hotspot: { left: "24%", top: "51%", width: "20%", height: "25%" },
      },
    ],
    causeOptions: [
      { id: "nitrification-disrupted", text: "Proses penitritan terganggu", correct: true },
      { id: "feeding-stopped", text: "Haiwan tidak makan rumput", correct: false },
      { id: "excess-rhizobium", text: "Bakteria pengikat nitrogen terlalu aktif", correct: false },
    ],
    actionOptions: [
      {
        id: "restore-nitrifying-bacteria",
        text: "Pulihkan aktiviti bakteria penitritan",
        correct: true,
      },
      { id: "increase-denitrification", text: "Tingkatkan pendenitritan", correct: false },
      { id: "remove-crops", text: "Cabut semua tanaman", correct: false },
    ],
    result: "Ion nitrat meningkat dan pokok menjadi lebih sihat.",
    concept:
      "Bakteria penitritan menukar sebatian ammonium kepada ion nitrit dan seterusnya ion nitrat.",
    recovery: "soil",
  },
  {
    id: "decomposition-disrupted",
    report:
      "Banyak daun gugur tetapi tanah masih kekurangan nitrogen.",
    clueHotspots: [
      {
        id: "fallen-leaves",
        label: "Daun gugur",
        clue: "Banyak daun gugur belum reput.",
        hotspot: { left: "65%", top: "43%", width: "23%", height: "18%" },
      },
      {
        id: "decomposer-low",
        label: "Pengurai",
        clue: "Pengurai kurang aktif.",
        hotspot: { left: "61%", top: "53%", width: "20%", height: "19%" },
      },
      {
        id: "ammonium-low",
        label: "Tanah bawah pokok",
        clue: "Sebatian ammonium rendah dalam tanah.",
        hotspot: { left: "66%", top: "59%", width: "22%", height: "22%" },
      },
    ],
    causeOptions: [
      { id: "decomposition-disrupted", text: "Proses penguraian terganggu", correct: true },
      { id: "excess-nitrate-river", text: "Melarut resap nitrat terlalu tinggi", correct: false },
      { id: "plant-absorption-fast", text: "Akar menyerap ion nitrat terlalu cepat", correct: false },
    ],
    actionOptions: [
      {
        id: "support-decomposition",
        text: "Galakkan proses penguraian bahan organik",
        correct: true,
      },
      { id: "remove-all-leaves", text: "Buang semua bahan organik dari tanah", correct: false },
      { id: "stop-bacteria", text: "Hentikan aktiviti mikroorganisma tanah", correct: false },
    ],
    result: "Nitrogen kembali ke tanah.",
    concept:
      "Bakteria dan kulat pengurai menukarkan protein mati kepada sebatian ammonium.",
    recovery: "decomposition",
  },
  {
    id: "denitrification-too-active",
    report:
      "Kandungan ion nitrat dalam tanah semakin berkurang dengan cepat.",
    clueHotspots: [
      {
        id: "wet-soil",
        label: "Tanah lembap",
        clue: "Tanah berhampiran sungai terlalu lembap.",
        hotspot: { left: "76%", top: "55%", width: "22%", height: "26%" },
      },
      {
        id: "denitrifier-active",
        label: "Bakteria pendenitritan",
        clue: "Bakteria pendenitritan terlalu aktif.",
        hotspot: { left: "72%", top: "60%", width: "22%", height: "18%" },
      },
      {
        id: "nitrogen-return",
        label: "Atmosfera",
        clue: "Banyak gas nitrogen (N2) kembali ke atmosfera.",
        hotspot: { left: "71%", top: "12%", width: "25%", height: "24%" },
      },
    ],
    causeOptions: [
      { id: "denitrification-too-active", text: "Pendenitritan terlalu aktif", correct: true },
      { id: "no-feeding", text: "Haiwan berhenti mendapat nitrogen", correct: false },
      { id: "no-decomposition", text: "Daun gugur tidak menjadi sebatian ammonium", correct: false },
    ],
    actionOptions: [
      {
        id: "control-wet-soil",
        text: "Kawal keadaan tanah terlalu lembap",
        correct: true,
      },
      { id: "flood-soil", text: "Biarkan tanah bertakung lebih lama", correct: false },
      { id: "remove-legumes", text: "Alihkan semua pokok kekacang", correct: false },
    ],
    result: "Ion nitrat dalam tanah menjadi lebih seimbang.",
    concept:
      "Pendenitritan menukar ion nitrat kepada gas nitrogen dan mengembalikannya ke udara.",
    recovery: "denitrification",
  },
] as const;
