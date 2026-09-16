# Audit Simulator Elektrolisis Sebatian Ion

## Skop dan Bukti

Source code ditelusuri daripada route kepada komponen yang benar-benar dirender. Projek dijalankan menggunakan Vite dan diuji melalui browser tempatan pada `/simulator/elektrokimia-elektrolisis`.

Audit ini membezakan ciri yang diuji di browser, tingkah laku yang disahkan dalam kod, dan batasan yang mempengaruhi manual. Audit tidak merangkumi simulator Sel Kimia, Atom atau Nuklear.

## Metadata

| Medan | Nilai dalam projek |
| --- | --- |
| ID | elektrokimia-elektrolisis |
| Tajuk katalog | Elektrolisis Sebatian Ion |
| Tajuk UI | Elektrolisis Sebatian Ion: Pepejal, Leburan dan Akueus |
| Tingkatan | 5 |
| Bab | Bab 6: Elektrokimia |
| Route | /simulator/elektrokimia-elektrolisis |

Badge UI sepadan dengan tingkatan dan bab dalam katalog. Ini ialah pengesahan metadata dalaman projek, bukan audit silang dokumen DSKP.

Penerangan katalog menyebut PbBr2 dalam keadaan pepejal, leburan dan akueus. UI sebenar menggunakan PbBr2 untuk pepejal/leburan, tetapi NaCl untuk akueus. Manual mengikuti UI sebenar.

## Peta Fail Aktif

Semua path di bawah relatif kepada akar projek `C:/Projects/homepage`.

| Fail | Peranan yang disahkan |
| --- | --- |
| src/App.tsx | Memuat App.css, merender SimulatorPage dan navigasi global. |
| src/pages/SimulatorPage.jsx:128 | Memilih ElectrolysisSimulatorPage berdasarkan route dan membekalkan reviewPanel. |
| src/data/simulators.ts:320 | ID, tajuk, metadata, route dan imej katalog. |
| src/pages/ElectrolysisSimulatorPage.jsx | State mod, bahan, penunu, litar, pemerhatian, inferens dan skor ringkasan. Menggabungkan semua bahagian simulator. |
| src/components/MobileControlDrawer.jsx | Membungkus panel Bahan; panel boleh ditutup pada lebar maksimum 760px. Perilaku mudah alih dibaca daripada kod, belum diuji pada peranti sentuh. |
| src/components/electrolysis/DraggableMaterial.jsx | Kad bahan HTML drag-and-drop. Kad dilumpuhkan selepas diletakkan. |
| src/components/electrolysis/ElectrolysisApparatus.jsx | Radas PbBr2, status bahan, penunu, suis, bahan pepejal/leburan, cahaya mentol. |
| src/components/electrolysis/AqueousMode.jsx | Radas NaCl dalam SVG, bahan akueus, elektrod, suis, pilihan paparan ion. |
| src/components/electrolysis/IonAnimation.jsx | Ion Na+/Cl-, animasi dan laluan ke elektrod dalam mod akueus. |
| src/components/electrolysis/ObservationTable.jsx | Tiga baris pemerhatian, pilihan keadaan mentol dan maklum balas segera. |
| src/components/electrolysis/InferenceChecker.jsx | Ruang taip inferens, butang Semak jawapan dan maklum balas. |
| src/data/electrolysisQuestions.js | Bahan pemerhatian, skema dan semakan kata kunci inferens. |
| src/components/electrolysis/ComparisonTable.jsx | Jadual perbandingan dalam Skema Jawapan. |
| src/components/electrolysis/ChallengeMode.jsx | Science Progress, empat kategori markah dan tahap pencapaian. |
| src/components/quiz/QuizCard.jsx | Buka/tutup kuiz, pilihan jawapan, cubaan pertama, soalan seterusnya, keputusan dan ulang. |
| src/data/simulatorQuizzes.js:114 | Sepuluh soalan electrolysisQuiz, pilihan, jawapan dan penerangan. |
| src/App.css | Gaya asas elektrolisis bermula sekitar baris 7122, animasi ion sekitar 8176/8199, serta override visual sekitar 20677 dan seterusnya. |
| public/assets/new background elektrolisis leburan.png | Imej latar hero dan radas PbBr2; juga digunakan oleh katalog. |

Radas akueus ialah SVG sebenar yang dirender oleh aplikasi. Ikon bahan, api, cahaya, suis dan zarah PbBr2 menggunakan elemen/CSS aplikasi. Tiada artwork tambahan diperlukan untuk manual.

### Komponen Bersama

`SimulatorReviewPanel.jsx` menggunakan `RatingForm.jsx`, `RatingSummary.jsx` dan `reviewApi`; `RatingForm.jsx` menggunakan `StarRatingInput.jsx`. `useRatingSummaries.js` membekalkan ringkasan rating pada SimulatorPage. Panel rating dipaparkan dalam browser, tetapi rating tidak dihantar semasa audit.

`SimulatorCard.jsx`, `SimulatorSearch` dan data `SIMULATORS` menyokong katalog sebelum masuk ke simulator. Ia bukan kawalan eksperimen. Navigasi global EduSim juga berada di luar aktiviti eksperimen.

### Fail yang Bukan Ciri Aktif

`ReflectionQuestions.jsx` wujud dan membaca `reflectionQuestions`, tetapi tidak diimport atau dirender oleh ElectrolysisSimulatorPage. Jangan masukkan bahagian Soalan Refleksi ke dalam manual. Fail latar elektrolisis lama juga tidak dianggap aktif berdasarkan namanya sahaja; rujukan CSS aktif menggunakan fail bermula dengan `new background`.

## Fungsi dan State

| Fungsi | Kesan sebenar |
| --- | --- |
| handleDragStart | Menyimpan ID bahan dalam dataTransfer. |
| handleDropMaterial | Menerima powder pada ruang radas/mangkuk pijar dan menetapkan hasPowder. |
| handleAqueousDrop | Menandakan air, NaCl atau elektrod telah diletakkan. |
| learningMessage | Menukar arahan ringkas mengikut mod, bahan dan suis. |
| useEffect bagi bulbDelayedOn | Menyalakan mentol selepas 1.5 saat apabila bahan, penunu dan litar aktif. |
| resetExperiment | Kembali ke pepejal/leburan; kosongkan bahan, litar, penunu, jawapan pemerhatian dan skor ringkasan; tutup skema; aktifkan showIons. |
| checkInferenceWithAI | Memanggil checkInferenceByKeyword secara tempatan. Tiada panggilan AI dalam fungsi ini. |
| QuizCard.choose / next / retry | Semak pilihan, rekod cubaan pertama, maju selepas jawapan betul dan ulang semua soalan. |
| ChallengeMode | Menjumlahkan Circuit Solver, Observation Expert, Electrochemist dan Science Check, maksimum 40. |

## Inventori UI

- Mod Pepejal & Leburan dan Akueus; pertukaran mod mengekalkan bahan/state sesi.
- Panel Bahan dengan seretan; bateri dan wayar telah tersedia.
- Suis LITAR OFF/ON dan HIDUPKAN PENUNU/MATIKAN PENUNU.
- Paparan status bahan, api, leburan dan cahaya mentol; animasi ion hanya pada mod akueus aktif.
- Checkbox Pamerkan pergerakan ion dalam Akueus.
- Jadual Pemerhatian dengan tiga pilihan mentol dan tiga ruang taip inferens.
- Skema Jawapan dan Perbandingan Keadaan Bahan.
- Science Check (Kuiz), 10 soalan, maklum balas, penerangan, Lihat skor dan Ulang kuiz.
- Science Progress boleh dibuka/ditutup, empat kategori /10 dan jumlah /40.
- Reset eksperimen serta navigasi global laman.
- Tiada Build Board bebas, aktiviti classification berasingan, pemilih voltan/kepekatan, graf, eksport keputusan atau penyimpanan rekod murid dalam komponen eksperimen yang diperiksa.

## User Journey yang Disyorkan

1. Kenali tajuk, panel Bahan dan dua mod.
2. Letakkan PbBr2, hidupkan litar dengan penunu masih mati; lihat mentol tidak menyala.
3. Hidupkan penunu; bandingkan status leburan dan mentol menyala.
4. Pilih Akueus; letakkan air, NaCl dan elektrod; hidupkan litar.
5. Perhatikan mentol dan arah pergerakan ion.
6. Lengkapkan pemerhatian dan inferens untuk ketiga-tiga keadaan.
7. Baca maklum balas, kemudian bandingkan dengan skema.
8. Jawab kuiz, lihat skor cubaan pertama dan kad kemajuan.
9. Ulang kuiz atau reset eksperimen mengikut aktiviti yang ingin diulang.

Jadual juga boleh diisi selepas setiap eksperimen. Buku empat halaman mengumpulkannya selepas perbandingan supaya alirannya lebih ringkas.

## Batasan yang Perlu Diketahui Editor

1. Akueus boleh menyalakan mentol walaupun elektrod belum diletakkan. Disahkan melalui interaksi dan syarat `solutionReady && circuitOn`. Panduan meminta ketiga-tiga bahan dilengkapkan dahulu.
2. Checkbox ion tidak menyembunyikan ion semasa mentol menyala kerana syarat `(showIons || bulbOn)`. Jangan menjanjikan fungsi sembunyi ketika litar hidup. Ion juga muncul sebelum bahan dimasukkan jika checkbox aktif.
3. Reset eksperimen tidak mereset state dalaman QuizCard. Selepas reset, paparan keputusan 9/10 masih ada walaupun skor ringkasan parent dikosongkan. Ulang kuiz diuji dan kembali ke soalan 1/10. Status buka Jadual Pemerhatian juga tidak ditutup oleh reset.
4. Label Terkunci pada Skema Jawapan dan Kuiz bukan kunci kemajuan; butangnya boleh dibuka tanpa melengkapkan eksperimen.
5. Semakan inferens menggunakan kata kunci, bukan kefahaman bahasa atau AI. Pengesanan leburan/akueus mencari perkataan bebas dan bergerak tanpa menolak frasa tidak bebas; ada risiko menerima ayat berkonsep salah. Maklum balas diterima bukan jaminan ketepatan saintifik.
6. Science Progress mengukur state semasa, bukan rekod lengkap langkah yang pernah dibuat. Mematikan litar atau penunu boleh mengubah markah aktiviti.
7. Penunu menukar state leburan serta-merta; tiada model masa pemanasan atau penyejukan. Mentol sahaja mempunyai kelewatan 1.5 saat.
8. Kad Science Progress terapung boleh menutup sebahagian kandungan. Pada paparan sempit, radas PbBr2 boleh melimpah secara mendatar. Screenshot akhir menggunakan paparan desktop lebih lebar; tiada CSS atau UI dipadam untuk memperelok tangkapan.
9. Ilustrasi suis PbBr2 mengandungi garis terbuka dalam imej latar walaupun butang menyatakan LITAR ON. Gunakan label butang dan keadaan mentol sebagai petunjuk dalam manual.

## Pengesahan Browser

Berjaya diuji: bahan belum dimasukkan/suis dilumpuhkan, seretan PbBr2, pepejal dengan litar hidup, perubahan kepada leburan dan mentol menyala, mod akueus, seretan tiga bahan, litar akueus, checkbox ion, pilihan pemerhatian salah/betul, inferens ditolak/diterima, skema, semua 10 soalan kuiz, jawapan salah diikuti pembetulan, skor 9/10, kad 39/40, reset eksperimen dan ulang kuiz.

Sepuluh screenshot terakhir diperiksa secara visual. Tangkapan halaman panjang awal menunjukkan artifak cantuman dan telah diganti dengan tangkapan viewport terus. Kad terapung dan pertindihan yang masih kelihatan berasal daripada UI sebenar.

Tidak diuji: input sentuh telefon, penghantaran rating, semua kombinasi inferens, atau penyemakan kandungan dengan dokumen kurikulum luar. Ujian build tidak diperlukan kerana perubahan hanya menambah dokumentasi dan screenshot.
