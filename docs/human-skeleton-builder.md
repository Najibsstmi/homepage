# Human Skeleton Builder 3D — status pembangunan

Modul berdaftar pada `/simulator/human-skeleton-builder-3d` dan menyediakan mod Bina Rangka serta Terokai Rangka. Viewer dan pemasangan menggunakan model BodyParts3D sebenar yang dikumpulkan kepada 36 komponen. Model masih memerlukan pengesahan anatomi manusia dan ujian menyeluruh pada peranti sentuh.

## Kurikulum

[Buku Teks Sains Tingkatan 4, halaman 122–123](https://studentportal.my/wp-content/uploads/2023/02/Buku-Teks-Sains-Tingkatan-4-1.pdf) menerangkan rangka paksi dan apendaj. [DSKP](https://cdn1.get-qr.com/files/67c8f0be569c40f8cc0300a3/1741222079588-f887ab11eb58eea9792a90eddd0ae29e.pdf) menetapkan SP 6.1.5. Label falanks tangan dan kaki membezakan kumpulan pemasangan; buku teks menggunakan istilah falanks untuk kedua-duanya.

## Provenans dan lesen

Sumber: [BodyParts3D versi 4.0 PART-OF, pengurangan poligon 99%](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), diperoleh pada 25 November 2026. Notis dalam setiap OBJ menyatakan **BodyParts3D, © The Database Center for Life Science, CC Attribution-Share Alike 2.1 Japan**. [Lesen CC BY-SA 2.1 JP](https://creativecommons.org/licenses/by-sa/2.1/jp/). [Notis pangkalan data terkini](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) menyatakan CC BY 4.0; edaran ini mengekalkan atribusi dan ShareAlike yang dinyatakan dalam fail sumber.

Pelayan rasmi menyokong HTTP byte range. Muat turun arkib penuh 64,888,505 bait terlalu perlahan dan tidak selesai dalam tempoh 180 saat; indeks ZIP dan 258 fail terpilih sebaliknya diambil secara berasingan. Setiap fail terpilih dinyahmampat dan disahkan saiz serta CRC32 terhadap direktori ZIP. Oleh itu checksum untuk arkib penuh tidak tersedia. Tiga fail metadata telah diperoleh sepenuhnya:

- `partof_parts_list_e.txt` SHA-256 `9224080557053E6F1322F1E13AB27F0ECDE0DB19BB3B505F0631AFAD230EEEBD`
- `partof_inclusion_relation_list.txt` SHA-256 `1B40738270931E3C1D955CE34E0FCE0D8D10D8C5AD543463E40B4B4C0243007C`
- `partof_element_parts.txt` SHA-256 `3F5F6DF1028EB122B30DE77C711597B6BB8E5541658E5985859FD228ADBF88EA`
- GLB terbitan SHA-256 `52136F88CF3694D9AE0A1C995032C83B69111FB3580B435BEBF747D782F564C8`.

Tiada Blender atau trimesh ditemui. `scripts/build-bodyparts3d.mjs` menggunakan OBJLoader dan GLTFExporter yang sudah tersedia dalam Three.js. Ia mengekalkan geometri sumber, mengelompokkan mesh, memusatkan pivot, menukar mm kepada meter dan Z-up kepada Y-up, serta mengindeks semula vertex yang sama tanpa mengurangkan bentuk. Saiz GLB berkurang daripada 42,049,756 kepada 11,940,940 bait (masih melebihi sasaran 10 MB). Model mempunyai 581,336 segi tiga.

Pemetaan awal menggunakan 238 mesh unik; fail [`public/skeleton/source-mapping.json`](../public/skeleton/source-mapping.json) menyimpan ID unsur dan nama kumpulan sumber. Kumpulan `skull` asal merangkumi struktur mata: 19 mesh mata dan satu salinan hioid bertindih dibuang. Hioid yang tinggal digabungkan dengan tengkorak untuk aktiviti, tanpa mendakwa hioid sebahagian daripada tengkorak. Tulang sakrum termasuk dalam turus vertebra. Rawan rusuk dan cakera intervertebra sumber masih disertakan untuk konteks. Mesh koksiks, osikel auditori dan gigi belum dikenal pasti dalam model terbitan; kedudukan tapak tangan dan butiran anatomi memerlukan semakan manusia. Jumlah 36 ialah kumpulan permainan, bukan bilangan tulang sebenar.

Pratonton yang dijana disimpan di `tmp/bodyparts3d/previews/` (hadapan, belakang dan sisi). Semakan visual awal menunjukkan skapula di belakang, patela di hadapan, radius lebih lateral berbanding ulna, dan fibula lebih lateral berbanding tibia. Ini bukan pengesahan anatomi profesional, kesempurnaan struktur atau postur tangan.

## Pemprosesan dan validasi

- `scripts/download-bodyparts3d.ps1` memuat turun arkib penuh dan metadata rasmi; pada sambungan ini arkib penuh tamat masa.
- `scripts/map-bodyparts3d.py` membina pemetaan awal daripada metadata; `scripts/download-bodyparts3d-selected.py` memuat turun fail berdasarkan indeks ZIP yang telah disediakan dalam `tmp/bodyparts3d/central.bin` dan menyemak CRC. Kedua-duanya memerlukan fail metadata tempatan dalam `tmp/bodyparts3d/`.
- `scripts/build-bodyparts3d.mjs` menjana GLB; pemetaan yang belum disemak hanya boleh dieksport ke `tmp/`. `scripts/import-skeleton.mjs` menerima GLB dan JSON atribusi, kemudian menghasilkan GLB dan manifest transform. Import ke `public/skeleton` dibuat untuk viewer yang ditandakan belum siap, bukan sebagai pengesahan model akhir.
- Import memeriksa 36 nama kumpulan, mesh tidak dipetakan, kumpulan bersarang, geometry kosong, koordinat tidak terhingga, skin/morph dan transform shear. `scripts/skeleton-asset.test.js` memuatkan GLB sebenar dan memeriksa kumpulan serta dimensi model. Pemeriksaan tidak boleh membuktikan identiti, lesen atau anatomi setiap mesh.

## Fungsi dan kerja yang masih diperlukan

Mod Bina Rangka menyediakan inventori dengan thumbnail mesh, panduan separa telus, seretan atau ketikan untuk memasang, semakan kedudukan dan sisi, petunjuk, undo, reset, statistik, penyimpanan tempatan dan paparan selepas lengkap. Mod Terokai Rangka mengekalkan putaran, zoom, pemilihan dan pengelasan. Fungsi tulang, label dan exploded view belum dibina. Ketepatan postur dan struktur kecil masih memerlukan semakan manusia; uji sentuhan dan semua 36 pemasangan pada peranti sebenar sebelum menganggapnya siap sepenuhnya.
