# EduSim Pulse Detector — Senarai semak pengesahan telefon

Prototip ini menganggar BPM melalui photoplethysmography (PPG) kamera dan belum
disahkan sebagai peranti perubatan. Jalankan semakan ini pada beberapa telefon
sebelum digunakan dalam aktiviti kelas.

## Persediaan

- Hidangkan laman melalui HTTPS atau `localhost`.
- Gunakan telefon dengan kamera belakang; uji Chrome Android dan Safari iOS terkini.
- Sediakan pulse oximeter rujukan atau kira nadi secara manual selama 60 saat.
- Rehat sekurang-kurangnya lima minit. Jangan lakukan aktiviti lasak.

## Setiap peranti

- [ ] Kamera hanya aktif selepas butang **Mula Pengukuran** ditekan.
- [ ] Kamera belakang dipilih dan indikator kamera sistem kelihatan.
- [ ] Sokongan lampu suluh dilaporkan dengan betul tanpa menyebabkan ralat.
- [ ] Meletakkan jari memulakan penstabilan; objek merah biasa tidak terus menghasilkan BPM.
- [ ] Gelombang PPG berubah mengikut data kamera sebenar.
- [ ] Menggerakkan telefon, menekan terlalu kuat, menutup dengan lemah, atau menanggalkan jari menjeda/menolak ukuran.
- [ ] Kamera berhenti selepas **Hentikan**, keputusan, pertukaran tab, kunci skrin, dan navigasi keluar.
- [ ] Tiada keputusan dipaparkan untuk imej rata, terlalu gelap atau terlalu terang.
- [ ] CSV mengandungi keputusan yang benar-benar diukur atau ditanda sebagai input manual.

## Perbandingan rujukan

Catat sekurang-kurangnya tiga ulangan untuk setiap peserta/peranti. Rekod nilai
EduSim, nilai rujukan, keadaan, model telefon, pelayar dan nota pergerakan. Jangan
terbitkan tuntutan ketepatan atau peratus ralat sehingga saiz sampel dan kaedah
ujian telah ditentukan secara formal.
