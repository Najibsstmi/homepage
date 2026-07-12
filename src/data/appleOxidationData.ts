export type TreatmentId = "control" | "sugar" | "lemon" | "bicarbonate" | "salt";

export type AppleColorStage =
  | "fresh"
  | "very-light"
  | "light-brown"
  | "medium-brown"
  | "dark-brown";

export type ObservationAnswer =
  | "unchanged"
  | "slightly-brown"
  | "medium-brown"
  | "very-brown";

export interface Treatment {
  id: TreatmentId;
  label: string;
  shortLabel: string;
  materialLabel: string;
  solutionColor: string;
  isControl?: boolean;
  finalObservation: ObservationAnswer;
  colorStages: readonly AppleColorStage[];
}

export const APPLE_OXIDATION_ASSETS = {
  lab: "/assets/pengoksidaan-epal/statik.webp",
  apple: "/assets/pengoksidaan-epal/epal-penuh.webp",
  beaker: "/assets/pengoksidaan-epal/bikar.webp",
  solutionBeaker: "/assets/pengoksidaan-epal/new-bikar.webp",
  petri: "/assets/pengoksidaan-epal/piring-petri.webp",
  forceps: "/assets/pengoksidaan-epal/forceps.webp",
  knife: "/assets/pengoksidaan-epal/pisau.webp",
  stopwatch: "/assets/pengoksidaan-epal/jam.webp",
  sliceSprite: "/assets/pengoksidaan-epal/hirisan-epal.webp",
  sliceStages: {
    fresh: "/assets/pengoksidaan-epal/hirisan-epal-fresh.webp",
    "very-light": "/assets/pengoksidaan-epal/hirisan-epal-very-light.webp",
    "light-brown": "/assets/pengoksidaan-epal/hirisan-epal-light-brown.webp",
    "medium-brown": "/assets/pengoksidaan-epal/hirisan-epal-medium-brown.webp",
    "dark-brown": "/assets/pengoksidaan-epal/hirisan-epal-dark-brown.webp",
  },
} as const;

export const APPLE_COLOR_LABELS: Record<AppleColorStage, string> = {
  fresh: "Segar",
  "very-light": "Sangat sedikit perang",
  "light-brown": "Sedikit perang",
  "medium-brown": "Perang sederhana",
  "dark-brown": "Sangat perang",
};

export const OBSERVATION_OPTIONS: readonly {
  value: ObservationAnswer;
  label: string;
}[] = [
  { value: "unchanged", label: "Tidak berubah menjadi perang" },
  { value: "slightly-brown", label: "Sedikit perang" },
  { value: "medium-brown", label: "Perang sederhana" },
  { value: "very-brown", label: "Sangat perang" },
];

export const TREATMENTS: readonly Treatment[] = [
  {
    id: "control",
    label: "Kawalan (Tidak direndam)",
    shortLabel: "Kawalan",
    materialLabel: "Buah epal",
    solutionColor: "transparent",
    isControl: true,
    finalObservation: "very-brown",
    colorStages: ["fresh", "light-brown", "medium-brown", "dark-brown"],
  },
  {
    id: "sugar",
    label: "Larutan gula",
    shortLabel: "Larutan gula",
    materialLabel: "Larutan gula",
    solutionColor: "rgba(245, 205, 74, 0.46)",
    finalObservation: "medium-brown",
    colorStages: ["fresh", "very-light", "light-brown", "medium-brown"],
  },
  {
    id: "lemon",
    label: "Jus limau",
    shortLabel: "Jus limau",
    materialLabel: "Jus limau",
    solutionColor: "rgba(173, 221, 91, 0.5)",
    finalObservation: "slightly-brown",
    colorStages: ["fresh", "fresh", "very-light", "very-light"],
  },
  {
    id: "bicarbonate",
    label: "Larutan natrium bikarbonat",
    shortLabel: "Natrium bikarbonat",
    materialLabel: "Larutan natrium bikarbonat",
    solutionColor: "rgba(97, 196, 238, 0.42)",
    finalObservation: "medium-brown",
    colorStages: ["fresh", "very-light", "light-brown", "medium-brown"],
  },
  {
    id: "salt",
    label: "Larutan garam biasa",
    shortLabel: "Garam biasa",
    materialLabel: "Larutan garam biasa",
    solutionColor: "rgba(255, 255, 255, 0.44)",
    finalObservation: "slightly-brown",
    colorStages: ["fresh", "very-light", "light-brown", "light-brown"],
  },
] as const;

export const SOLUTION_TREATMENTS = TREATMENTS.filter(
  (treatment) => !treatment.isControl,
);

export const EXPERIMENT_STEPS = [
  "Kenal pasti pemboleh ubah",
  "Potong epal kepada lima hirisan sama saiz",
  "Letakkan satu hirisan sebagai kawalan",
  "Rendam empat hirisan dalam larutan selama 1 minit",
  "Pindahkan hirisan ke dalam piring Petri",
  "Dedahkan kepada udara selama 15 minit",
  "Perhatikan perubahan warna",
  "Rekod keputusan",
  "Buat kesimpulan",
] as const;

export const VARIABLE_OPTIONS = [
  { value: "", label: "Pilih jawapan" },
  { value: "jenis-larutan", label: "Jenis larutan" },
  { value: "perubahan-warna", label: "Perubahan warna hirisan epal" },
  { value: "saiz-suhu-tempoh", label: "Saiz hirisan, suhu dan tempoh eksperimen" },
  { value: "isipadu-larutan", label: "Isi padu larutan" },
] as const;

export const POST_EXPERIMENT_QUIZ = [
  {
    id: "least-brown",
    question: "Hirisan epal manakah paling kurang berubah menjadi perang?",
    options: ["Kawalan", "Larutan gula", "Jus limau", "Larutan garam biasa"],
    answer: "Jus limau",
  },
  {
    id: "oxygen",
    question: "Mengapakah hirisan epal yang terdedah kepada udara menjadi perang?",
    options: [
      "Oksigen dalam udara menyebabkan bahan dalam hirisan epal mengalami pengoksidaan.",
      "Air dalam piring Petri menukarkan epal kepada warna perang.",
      "Garam dalam udara melekat pada permukaan epal.",
      "Cahaya menyebabkan kulit epal menjadi lebih merah.",
    ],
    answer:
      "Oksigen dalam udara menyebabkan bahan dalam hirisan epal mengalami pengoksidaan.",
  },
  {
    id: "control",
    question: "Apakah fungsi hirisan epal yang tidak direndam?",
    options: [
      "Sebagai kawalan untuk membuat perbandingan.",
      "Sebagai bahan yang menerima rawatan paling kuat.",
      "Sebagai hirisan yang perlu dibuang daripada eksperimen.",
      "Sebagai larutan tambahan.",
    ],
    answer: "Sebagai kawalan untuk membuat perbandingan.",
  },
  {
    id: "same-size",
    question: "Mengapakah semua hirisan epal perlu mempunyai saiz yang sama?",
    options: [
      "Supaya saiz hirisan dimalarkan dan eksperimen menjadi adil.",
      "Supaya epal kelihatan lebih menarik dalam piring Petri.",
      "Supaya semua larutan berubah warna.",
      "Supaya pemasa boleh dihentikan lebih awal.",
    ],
    answer: "Supaya saiz hirisan dimalarkan dan eksperimen menjadi adil.",
  },
] as const;
