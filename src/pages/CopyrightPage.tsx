import { useEffect, type MouseEventHandler } from "react";
import "./CopyrightPage.css";

type CopyrightPageProps = {
  onBackToEduSim?: MouseEventHandler<HTMLAnchorElement>;
};

const PAGE_TITLE = "Hak Cipta EduSim | CikguSTEM";
const PAGE_DESCRIPTION =
  "Maklumat hak cipta EduSim dan Pemberitahuan Sukarela Hak Cipta MyIPO.";
const PAGE_CANONICAL_URL = "https://www.cikgustem.com/copyright";

export default function CopyrightPage({ onBackToEduSim }: CopyrightPageProps) {
  useEffect(() => {
    const descriptionMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const canonicalLink = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    const previousTitle = document.title;
    const previousDescription = descriptionMeta?.content;
    const previousCanonical = canonicalLink?.href;

    document.title = PAGE_TITLE;
    descriptionMeta?.setAttribute("content", PAGE_DESCRIPTION);
    canonicalLink?.setAttribute("href", PAGE_CANONICAL_URL);

    return () => {
      document.title = previousTitle;
      if (previousDescription !== undefined) {
        descriptionMeta?.setAttribute("content", previousDescription);
      }
      if (previousCanonical !== undefined) {
        canonicalLink?.setAttribute("href", previousCanonical);
      }
    };
  }, []);

  return (
    <main className="copyrightPage">
      <header className="copyrightPage__hero">
        <span className="copyrightPage__eyebrow">EduSim by CikguStem</span>
        <h1>Hak Cipta EduSim</h1>
        <p>Maklumat Hak Cipta &amp; Pemberitahuan Sukarela Hak Cipta MyIPO</p>
      </header>

      <div className="copyrightPage__content">
        <section className="copyrightPage__section" aria-labelledby="copyright-overview">
          <h2 id="copyright-overview">Hak Cipta EduSim</h2>
          <p className="copyrightPage__notice">
            © 2026 EduSim by CikguStem.
            <br />
            Hak Cipta Terpelihara.
          </p>
          <p>
            EduSim merupakan platform simulasi pendidikan interaktif yang dibangunkan
            untuk menyokong proses pengajaran dan pembelajaran, khususnya dalam bidang
            Sains dan STEM.
          </p>
          <p>
            Kandungan asal EduSim termasuk reka bentuk simulator, grafik asal, animasi,
            susun atur interaktif, bahan pendidikan, kod sumber tertentu dan elemen
            digital yang dihasilkan khusus untuk EduSim adalah tertakluk kepada
            perlindungan hak cipta yang berkenaan.
          </p>
        </section>

        <section className="copyrightPage__section" aria-labelledby="copyright-myipo">
          <h2 id="copyright-myipo">Pemberitahuan Sukarela Hak Cipta MyIPO</h2>
          <p>
            Karya berkaitan EduSim telah direkodkan melalui Pemberitahuan Sukarela Hak
            Cipta dengan Perbadanan Harta Intelek Malaysia (MyIPO).
          </p>
          <dl className="copyrightPage__details">
            <div>
              <dt>No. Pemberitahuan</dt>
              <dd>CRLY2026E08086</dd>
            </div>
            <div>
              <dt>Pemilik Hak Cipta</dt>
              <dd>Mohd Najib bin Jaafar</dd>
            </div>
            <div>
              <dt>Tarikh Pemberitahuan</dt>
              <dd>15 September 2026</dd>
            </div>
          </dl>
        </section>

        <section className="copyrightPage__section" aria-labelledby="copyright-education">
          <h2 id="copyright-education">Penggunaan untuk Pendidikan</h2>
          <p>
            Guru dan murid dibenarkan menggunakan EduSim bagi tujuan pengajaran dan
            pembelajaran melalui platform rasmi EduSim.
          </p>
          <p>
            Walau bagaimanapun, kandungan EduSim tidak boleh disalin, diterbitkan
            semula, diubah suai, diedarkan, dijual, dimuat naik semula atau digunakan
            sebagai sebahagian daripada produk atau platform lain tanpa kebenaran
            pemilik hak cipta, tertakluk kepada undang-undang dan pengecualian yang
            berkenaan.
          </p>
        </section>

        <section className="copyrightPage__section" aria-labelledby="copyright-attribution">
          <h2 id="copyright-attribution">Atribusi</h2>
          <p>
            Jika EduSim digunakan dalam pembentangan, bengkel, latihan atau bahan
            pendidikan, atribusi berikut digalakkan:
          </p>
          <p className="copyrightPage__attribution">EduSim by CikguStem</p>
        </section>

        <a
          className="copyrightPage__backButton"
          href="/simulator"
          onClick={onBackToEduSim}
        >
          ← Kembali ke EduSim
        </a>
      </div>
    </main>
  );
}
