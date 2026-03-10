import "./App.css";
import { useState } from "react";
import emailjs from "@emailjs/browser";

export default function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_geh40rw",
        "template_0j2wfq8",
        e.target,
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
        <div className="navbar__brand">CIKGUSTEM</div>
        <div className="navbar__links">
          <a href="#about">Tentang</a>
          <a href="#focus">Fokus</a>
          <a href="#achievements">Pencapaian</a>
          <a href="#gallery">Galeri</a>
          <a href="#contact">Hubungi</a>
          <a
            href="https://senismartlab.cikgustem.com"
            target="_blank"
            rel="noreferrer"
          >
            Smart Lab
          </a>
        </div>
      </nav>

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
    </div>
  );
}