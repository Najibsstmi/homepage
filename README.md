# Homepage CikguSTEM

Laman ini dibina menggunakan React, TypeScript dan Vite untuk memaparkan portfolio profesional, inovasi pendidikan dan landing page share khas seperti EduTrack, EduSlot dan SmartLab.

## Pembangunan

```bash
npm install
npm run dev
```

## Jana Share Page Baharu

Untuk post inovasi baharu, anda tidak perlu bina fail share dari kosong lagi. Gunakan generator ini:

```bash
npm run create:share -- --slug=nama-post --title='Nama Post | Inovasi CikguSTEM' --description='Deskripsi meta utama' --target=anchor-post --image=og-nama-post.jpg
```

Contoh:

```bash
npm run create:share -- --slug=post-baharu --title='Post Baharu | Inovasi CikguSTEM' --description='Post baharu ini membantu guru merancang intervensi akademik dengan lebih jelas.' --ogDescription='Analisis, sasaran akademik dan pemantauan prestasi dalam satu sistem.' --twitterDescription='Paparan ringkas post baharu untuk perkongsian sosial.' --target=post-baharu --image=og-post-baharu.jpg
```

Generator ini akan menghasilkan fail:

```text
public/share-<slug>.html
```

Pilihan tambahan:

- `--siteUrl=https://www.cikgustem.com`
- `--imageWidth=1200`
- `--imageHeight=630`
- `--imageAlt="Preview post"`
- `--force=true` untuk overwrite fail sedia ada
- `--dry-run=true` untuk semak output tanpa cipta fail

## Workflow Posting Baharu

1. Letakkan imej OG dalam folder `public/`, sebaiknya bersaiz `1200x630`.
2. Pastikan seksyen post dalam `src/App.tsx` sudah ada `id` anchor yang stabil, contohnya `id="post-baharu"`.
3. Jalankan arahan `npm run create:share ...` dengan `slug`, `title`, `description`, `target`, dan `image`.
4. Deploy laman.
5. Buka Facebook Sharing Debugger dan tekan `Scrape Again` untuk URL share baharu.

## Nota Penting

- Butang share hanya menghantar URL.
- Preview Facebook dan Telegram bergantung pada metadata dalam fail share HTML.
- Jika mahu preview khas untuk sesuatu post, post itu perlu ada share page tersendiri.
