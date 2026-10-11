import type { ReactNode } from "react";
import "./PbdKacaMataPage.css";

type PbdKacaMataPageProps = {
  shareBar: ReactNode;
};

const imageRoot = "/PERKONGSIAN/PBD-KP-SAINS";

const figures = {
  committee: `${imageRoot}/pbs-2025-pdf-halaman-17.png`,
  concept: `${imageRoot}/pbs-2025-pdf-halaman-43.png`,
  flow: `${imageRoot}/pbs-2025-pdf-halaman-46.png`,
  mastery: `${imageRoot}/pbs-2025-pdf-halaman-47.png`,
  moderation: `${imageRoot}/pbs-2025-pdf-halaman-48.png`,
  methods: `${imageRoot}/pbs-2025-pdf-halaman-49.png`,
  reporting: `${imageRoot}/pbs-2025-pdf-halaman-52.png`,
  assurance: `${imageRoot}/pbs-2025-pdf-halaman-70.png`,
  monitoring: `${imageRoot}/pbs-2025-pdf-halaman-71.png`,
  coordination: `${imageRoot}/pbs-2025-pdf-halaman-72.png`,
};

const managementRows = [
  ["Perancangan", "Kenal pasti SK, SP dan Standard Prestasi dalam RPT dan RPH."],
  ["Pentaksiran", "Gabungkan pemerhatian, lisan, bertulis, amali, eksperimen dan projek mengikut kesesuaian."],
  ["Rekod guru", "Catat perkembangan serta evidens secara ringkas, sistematik dan boleh dirujuk."],
  ["Pertimbangan profesional", "Tentukan TP berdasarkan analisis keseluruhan maklumat pembelajaran murid."],
  ["Moderasi", "Bincangkan kaedah, instrumen, kriteria dan penentuan TP bersama guru Sains."],
  ["Tindakan susulan", "Ubah suai strategi PdP dan bantu murid berdasarkan dapatan pentaksiran."],
  ["Pelaporan", "Laporkan PBD pada pertengahan dan akhir sesi akademik melalui Modul PBD dalam SPPB."],
  ["Penjaminan kualiti", "Laksanakan bimbingan, pemantauan, pengesanan dan penyelarasan secara berfokus."],
];

function SourceFigure({
  src,
  alt,
  caption,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  caption: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={`pbdSourceFigure ${className}`.trim()}>
      <a href={src} target="_blank" rel="noreferrer" aria-label={`${alt}. Buka imej penuh`}>
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </a>
      <figcaption>{caption} Klik imej untuk paparan penuh.</figcaption>
    </figure>
  );
}

export default function PbdKacaMataPage({ shareBar }: PbdKacaMataPageProps) {
  return (
    <main id="pbd-kaca-mata-kp-sains" className="pbdPage">
      <article className="pbdArticle" aria-labelledby="pbd-title">
        <header className="pbdHero">
          <div className="pbdHero__copy">
            <span className="pbdEyebrow">Perkongsian Pengurusan Panitia</span>
            <h1 id="pbd-title">PBD: Kaca Mata KP Sains</h1>
            <p className="pbdHero__lead">
              Melihat Pentaksiran Bilik Darjah bukan sebagai kerja mengisi Tahap Penguasaan,
              tetapi sebagai satu kitaran profesional untuk memahami murid dan menambah baik PdP Sains.
            </p>
            <div className="pbdHero__meta">
              <span>Mohd Najib bin Jaafar</span>
              <span>Ketua Panitia Sains</span>
              <span>Guru Cemerlang Sains</span>
            </div>
            {shareBar}
          </div>

          <SourceFigure
            src={figures.concept}
            alt="Halaman konsep Pentaksiran Bilik Darjah dalam Panduan Pengurusan PBS 2025"
            caption="Panduan Pengurusan PBS Edisi 1 Tahun 2025, hlm. 36: konsep PBD sebagai proses berterusan dalam PdP."
            className="pbdSourceFigure--hero"
            priority
          />
        </header>

        <section className="pbdOpening" aria-labelledby="pbd-bukan-isi-tp">
          <span className="pbdSectionNumber">01</span>
          <div>
            <h2 id="pbd-bukan-isi-tp">PBD bukan sekadar aktiviti memasukkan TP</h2>
            <p>
              Apabila PBD dilihat hanya melalui skrin pelaporan, kerja guru mudah disempitkan kepada
              satu soalan: <em>“Dah isi TP belum?”</em> Sedangkan panduan menerangkan PBD sebagai
              proses berterusan dalam PdP untuk mendapatkan maklumat tentang perkembangan,
              kemajuan, kebolehan dan penguasaan murid. Maklumat itu dikumpul, dianalisis dan
              digunakan untuk membuat refleksi serta menambah baik PdP.
            </p>
            <blockquote>
              Dalam kaca mata Ketua Panitia Sains, TP ialah hasil pertimbangan profesional;
              bukan titik mula dan bukan nombor yang berdiri sendiri.
            </blockquote>
          </div>
        </section>

        <section className="pbdSplit" aria-labelledby="pbd-peranan-kp">
          <div className="pbdSplit__copy">
            <span className="pbdSectionNumber">02</span>
            <h2 id="pbd-peranan-kp">Mengapa Ketua Panitia perlu melihat PBD secara menyeluruh?</h2>
            <p>
              Dalam Jawatankuasa PBS peringkat sekolah menengah, Ketua Panitia Mata Pelajaran
              disenaraikan sebagai ahli bersama Guru Kanan Mata Pelajaran, Penyelaras PBD dan
              personel lain. Ini bermaksud pengurusan PBD bukan urusan guru kelas atau penyelaras
              semata-mata. Ketua Panitia mempunyai ruang untuk menyelaras kefahaman, membina
              amalan bersama dan membantu guru menyelesaikan isu pelaksanaan.
            </p>
            <aside className="pbdNote">
              <strong>Perlu dibezakan</strong>
              <p>
                Panduan menyatakan struktur dan prinsip pelaksanaan. Bentuk mesyuarat, jadual
                moderasi dan instrumen dalaman panitia pula ialah keputusan pengurusan sekolah
                yang perlu dibuat secara munasabah, bukan menambah beban dokumentasi.
              </p>
            </aside>
          </div>
          <SourceFigure
            src={figures.committee}
            alt="Jawatankuasa PBS peringkat sekolah rendah dan sekolah menengah"
            caption="Panduan Pengurusan PBS Edisi 1 Tahun 2025, hlm. 10: Ketua Panitia Mata Pelajaran ialah ahli JK PBS sekolah."
          />
        </section>

        <section className="pbdBlock" aria-labelledby="pbd-enam-kerja">
          <div className="pbdHeading">
            <span className="pbdSectionNumber">03</span>
            <div>
              <h2 id="pbd-enam-kerja">Enam kerja utama KP Sains</h2>
              <p>
                Enam perkara ini ialah terjemahan praktikal saya terhadap panduan untuk pengurusan
                Panitia Sains. Ia bukan senarai tugas baharu yang dinyatakan kata demi kata oleh KPM.
              </p>
            </div>
          </div>

          <div className="pbdRoleGrid">
            <article>
              <span>01</span>
              <h3>Selaraskan kefahaman</h3>
              <p>
                Pastikan guru memahami SK, SP, Standard Prestasi dan tafsiran TP. TP tidak wajar
                ditentukan daripada markah ujian semata-mata.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Hidupkan moderasi</h3>
              <p>
                Bincangkan sampel kerja murid, instrumen dan kriteria. Soalan yang berguna ialah:
                <em> “Apakah evidens yang membezakan TP4 dengan TP5?”</em>
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Pastikan evidens munasabah</h3>
              <p>
                Panduan membenarkan rekod melalui buku rekod mengajar, buku latihan, buku amali,
                catatan guru, folio, senarai semak, jadual atau kaedah lain yang sesuai.
              </p>
            </article>
            <article>
              <span>04</span>
              <h3>Pelbagaikan pentaksiran</h3>
              <p>
                Dalam Sains, pemerhatian, soal jawab, laporan eksperimen, pembentangan, projek,
                penyelesaian masalah dan ujian bertulis boleh saling melengkapi.
              </p>
            </article>
            <article>
              <span>05</span>
              <h3>Pantau untuk membantu</h3>
              <p>
                Pemantauan sepatutnya mengenal pasti masalah dan membantu guru menyelesaikannya,
                bukan sekadar menyemak sama ada data telah dimasukkan.
              </p>
            </article>
            <article>
              <span>06</span>
              <h3>Bawa isu ke PLC panitia</h3>
              <p>
                Teliti murid yang masih memerlukan sokongan, perbezaan tafsiran standard,
                kesukaran menentukan TP serta strategi intervensi yang boleh diuji bersama.
              </p>
            </article>
          </div>
        </section>

        <section className="pbdSplit pbdSplit--reverse" aria-labelledby="pbd-aliran-guru">
          <SourceFigure
            src={figures.flow}
            alt="Carta alir proses pelaksanaan pengajaran dan pembelajaran serta PBD"
            caption="Panduan Pengurusan PBS Edisi 1 Tahun 2025, hlm. 39: merancang, melaksana, mencatat, membuat tindakan susulan dan melapor."
          />
          <div className="pbdSplit__copy">
            <span className="pbdSectionNumber">04</span>
            <h2 id="pbd-aliran-guru">Aliran kerja guru Sains sebenarnya jelas</h2>
            <ol className="pbdSteps">
              <li><strong>Rancang</strong> PdP dan kaedah pentaksiran berdasarkan objektif serta keupayaan murid.</li>
              <li><strong>Laksanakan</strong> PdP dan pentaksiran secara berterusan.</li>
              <li><strong>Catat</strong> status perkembangan murid dan analisis maklumat yang dikumpul.</li>
              <li><strong>Ambil tindakan susulan</strong> jika murid masih perlu meningkatkan penguasaan.</li>
              <li><strong>Laporkan TP</strong> apabila maklumat yang ada mencukupi untuk pertimbangan profesional.</li>
            </ol>
            <p>
              Contohnya dalam topik Mikroorganisma, guru boleh menggabungkan pemerhatian semasa
              eksperimen, soal jawab, laporan amali, perbincangan dan tugasan. Selepas satu kelompok
              bidang, tema atau kemahiran selesai, keseluruhan maklumat itu digunakan untuk menentukan TP.
            </p>
          </div>
        </section>

        <section className="pbdEvidence" aria-labelledby="pbd-tp-evidens">
          <div className="pbdEvidence__text">
            <span className="pbdSectionNumber">05</span>
            <h2 id="pbd-tp-evidens">TP bukan markah yang ditukar nama</h2>
            <p>
              Panduan meminta guru merujuk Standard Prestasi dan membuat pertimbangan profesional.
              Pertimbangan itu merangkumi pengetahuan, kemahiran, nilai, bukti pencapaian, strategi
              pengajaran, kaedah pentaksiran serta kriteria dan standard yang ditetapkan.
            </p>
            <p>
              Sebab itu guru tidak perlu menetapkan satu TP rasmi bagi setiap SP secara terasing.
              Panduan menyebut bahawa guru perlu menyelesaikan PdP bagi satu kelompok bidang,
              tema atau kemahiran sebelum menentukan Tahap Penguasaan murid.
            </p>
            <div className="pbdCallout">
              <strong>Prinsip mudah</strong>
              <p>Evidens membina pertimbangan. Pertimbangan profesional menentukan TP.</p>
            </div>
          </div>
          <SourceFigure
            src={figures.mastery}
            alt="Penerangan Tahap Penguasaan dan pertimbangan profesional"
            caption="Panduan Pengurusan PBS Edisi 1 Tahun 2025, hlm. 40: penentuan TP, rekod perkembangan dan pertimbangan profesional."
          />
        </section>

        <section className="pbdSplit" aria-labelledby="pbd-moderasi">
          <div className="pbdSplit__copy">
            <span className="pbdSectionNumber">06</span>
            <h2 id="pbd-moderasi">Moderasi menyamakan kefahaman, bukan bilangan TP</h2>
            <p>
              Moderasi dilaksanakan oleh guru mata pelajaran atau panitia yang sama bagi mengurangkan
              jurang pertimbangan profesional. Perbincangan boleh meliputi kaedah pentaksiran,
              pemilihan instrumen, kriteria pertimbangan profesional dan penentuan TP.
            </p>
            <p>
              Moderasi tidak bermaksud setiap kelas perlu mempunyai bilangan murid TP4 atau TP5 yang
              sama. Yang perlu diselaraskan ialah pemahaman terhadap standard dan kriteria supaya
              keputusan lebih adil, konsisten, sah dan boleh dipercayai.
            </p>
            <div className="pbdPromptList" aria-label="Soalan panduan moderasi">
              <span>Adakah evidens mencukupi?</span>
              <span>Adakah standard ditafsir secara konsisten?</span>
              <span>Apakah tindakan susulan yang diperlukan?</span>
            </div>
          </div>
          <SourceFigure
            src={figures.moderation}
            alt="Penerangan tujuan dan aspek moderasi dalam PBD"
            caption="Panduan Pengurusan PBS Edisi 1 Tahun 2025, hlm. 41: tujuan dan aspek yang dimoderasikan."
          />
        </section>

        <section className="pbdMethods" aria-labelledby="pbd-kaedah">
          <div className="pbdMethods__copy">
            <span className="pbdSectionNumber">07</span>
            <h2 id="pbd-kaedah">Sains membuka ruang evidens yang kaya</h2>
            <p>
              Panduan menghimpunkan tiga kaedah utama: pemerhatian, lisan dan bertulis. Dalam bilik
              Sains, ketiga-tiganya boleh muncul dalam satu pengalaman pembelajaran yang sama.
            </p>
            <div className="pbdMethodCards">
              <article><strong>Pemerhatian</strong><span>Kemahiran proses sains, pengendalian radas, sikap dan hasil kerja.</span></article>
              <article><strong>Lisan</strong><span>Soal jawab, kuiz, penerangan inferens dan justifikasi keputusan.</span></article>
              <article><strong>Bertulis</strong><span>Laporan eksperimen, latihan, folio, projek dan ujian bertulis.</span></article>
            </div>
          </div>
          <SourceFigure
            src={figures.methods}
            alt="Kaedah pentaksiran pemerhatian, lisan dan bertulis"
            caption="Panduan Pengurusan PBS Edisi 1 Tahun 2025, hlm. 42: kaedah pemerhatian, lisan dan bertulis."
          />
        </section>

        <section className="pbdSplit pbdSplit--reverse" aria-labelledby="pbd-rekod">
          <SourceFigure
            src={figures.reporting}
            alt="Perekodan dan pelaporan Pentaksiran Bilik Darjah"
            caption="Panduan Pengurusan PBS Edisi 1 Tahun 2025, hlm. 45: rekod, analisis, tindakan susulan dan pelaporan melalui SPPB."
          />
          <div className="pbdSplit__copy">
            <span className="pbdSectionNumber">08</span>
            <h2 id="pbd-rekod">Rekod yang cukup, bukan fail yang tebal</h2>
            <p>
              Rekod perlu sistematik, dikemas kini, disimpan dengan baik dan boleh dianalisis untuk
              tindakan susulan. Namun, panduan tidak menetapkan bahawa setiap murid mesti mempunyai
              satu fail PBD yang tebal atau satu templat tambahan yang seragam.
            </p>
            <p>
              Sistem yang praktikal boleh menggabungkan RPH atau buku rekod, buku latihan dan amali
              murid, catatan perkembangan ringkas guru serta data TP dalam SPPB. Pelaporan PBD
              dilaksanakan dua kali setahun, iaitu pada pertengahan dan akhir sesi akademik.
            </p>
          </div>
        </section>

        <section className="pbdManagement" aria-labelledby="pbd-sistem-minimum">
          <div className="pbdHeading">
            <span className="pbdSectionNumber">09</span>
            <div>
              <span className="pbdPracticeLabel">Cadangan amalan panitia</span>
              <h2 id="pbd-sistem-minimum">Sistem minimum yang kukuh untuk Panitia Sains</h2>
              <p>
                Jadual ini ialah cadangan pengurusan saya berdasarkan prinsip dalam panduan. Sekolah
                boleh menyesuaikannya mengikut konteks, ketetapan dalaman dan keperluan murid.
              </p>
            </div>
          </div>
          <div className="pbdTableWrap">
            <table>
              <thead><tr><th>Komponen</th><th>Amalan yang dicadangkan</th></tr></thead>
              <tbody>
                {managementRows.map(([component, practice]) => (
                  <tr key={component}><th scope="row">{component}</th><td>{practice}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pbdQuality" aria-labelledby="pbd-kualiti">
          <div className="pbdQuality__copy">
            <span className="pbdSectionNumber">10</span>
            <h2 id="pbd-kualiti">Penjaminan kualiti mesti terasa seperti sokongan profesional</h2>
            <p>
              Bab 4 menghimpunkan empat aktiviti penjaminan kualiti: pementoran, pemantauan,
              pengesanan dan penyelarasan. Bagi Ketua Panitia, bahasa operasinya mudah:
              bimbing guru, kesan isu, semak kesesuaian kaedah dan selaraskan standard.
            </p>
            <div className="pbdQualityGrid">
              <article><strong>Pementoran</strong><span>Membimbing dan meningkatkan pengetahuan serta keyakinan guru.</span></article>
              <article><strong>Pemantauan</strong><span>Memastikan prosedur dipatuhi dan membantu menyelesaikan masalah.</span></article>
              <article><strong>Pengesanan</strong><span>Menilai kekuatan, kelemahan dan kesesuaian kaedah atau instrumen.</span></article>
              <article><strong>Penyelarasan</strong><span>Menyeragamkan kefahaman demi kesahan, kebolehpercayaan dan keadilan.</span></article>
            </div>
          </div>
          <div className="pbdQuality__figures">
            <SourceFigure
              src={figures.assurance}
              alt="Pengenalan penjaminan kualiti dan pementoran"
              caption="Panduan Pengurusan PBS 2025, hlm. 63."
            />
            <SourceFigure
              src={figures.monitoring}
              alt="Pemantauan dan pengesanan dalam penjaminan kualiti PBS"
              caption="Panduan Pengurusan PBS 2025, hlm. 64."
            />
            <SourceFigure
              src={figures.coordination}
              alt="Penyelarasan dalam penjaminan kualiti PBS"
              caption="Panduan Pengurusan PBS 2025, hlm. 65."
            />
          </div>
        </section>

        <section className="pbdClosing" aria-labelledby="pbd-rumusan">
          <span className="pbdEyebrow">Rumusan</span>
          <h2 id="pbd-rumusan">PBD yang baik membantu guru melihat murid dengan lebih jernih.</h2>
          <p>
            Guru Sains mentaksir dan menentukan TP melalui pertimbangan profesional berdasarkan
            evidens. Ketua Panitia Sains pula memastikan proses itu difahami, dimoderasi, direkod,
            ditindak susul dan dilaporkan dengan betul.
          </p>
          <blockquote>
            Kaca mata KP Sains bukan mencari lebih banyak borang. Kaca mata itu membantu panitia
            melihat sama ada pentaksiran benar-benar memandu pembelajaran murid.
          </blockquote>
          <p className="pbdSource">
            <strong>Sumber utama:</strong> Kementerian Pendidikan Malaysia, <em>Panduan Pengurusan
            Pentaksiran Berasaskan Sekolah (PBS), Edisi 1 Tahun 2025</em>, khususnya Bab 2,
            Bahagian 3.2 dan Bab 4.
          </p>
          <div className="pbdClosing__share">{shareBar}</div>
        </section>
      </article>
    </main>
  );
}
