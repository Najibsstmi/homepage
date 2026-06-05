# Review Simulator Setup

## 1. Google Sheet

Gunakan Google Sheet ini:

https://docs.google.com/spreadsheets/d/1Ny-Swkd4trM6WJOxIkjzbAaPQN7yNq4u3RKx6hEymmA/edit?usp=sharing

Pastikan row header ialah:

| A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- |
| timestamp | simulator_id | device_id | user_type | comment | rating |

Jika column F belum wujud, tambah header `rating` di F1. Apps Script juga akan semak dan betulkan header ini apabila endpoint dipanggil.

## 2. Deploy Google Apps Script

1. Buka Google Sheet `REVIEW SIMULATOR`.
2. Pergi ke `Extensions > Apps Script`.
3. Paste kandungan `google-apps-script/review-simulator.gs` ke dalam `Code.gs`.
4. Pastikan nilai ini betul:
   - `SPREADSHEET_ID = "1Ny-Swkd4trM6WJOxIkjzbAaPQN7yNq4u3RKx6hEymmA"`
   - `SHEET_NAME = "Sheet1"`
5. Klik `Deploy > New deployment`.
6. Pilih type `Web app`.
7. Tetapkan:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone`
8. Klik `Deploy` dan authorize permission.
9. Copy URL deployment yang berakhir dengan `/exec`.

URL deployment semasa:

```text
https://script.google.com/macros/s/AKfycbxzDAvLDRNI4FhuailXth0j4Sri46mLLh5JeLCHRTj9DYcJ9TyKtK9aCl8mLgnrps9B/exec
```

## 3. Sambung Ke Website

Untuk local development, buat `.env` berdasarkan `.env.example`:

```env
VITE_REVIEW_SIMULATOR_WEB_APP_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Nilai semasa:

```env
VITE_REVIEW_SIMULATOR_WEB_APP_URL=https://script.google.com/macros/s/AKfycbxzDAvLDRNI4FhuailXth0j4Sri46mLLh5JeLCHRTj9DYcJ9TyKtK9aCl8mLgnrps9B/exec
```

Untuk Vercel/hosting, tambah environment variable yang sama:

```env
VITE_REVIEW_SIMULATOR_WEB_APP_URL
```

Restart dev server selepas ubah `.env`.

## 4. Test Ringkas

1. Buka website EduSim.
2. Pada mana-mana kad simulator, klik bintang 1-5.
3. Pilih `Murid`, `Guru`, atau `Orang Awam`.
4. Isi komen optional.
5. Klik `Hantar Review`.
6. Semak mesej `Terima kasih atas penilaian anda!`.
7. Buka Google Sheet dan pastikan row rating masuk.
8. Hantar rating sekali lagi dari device/browser yang sama untuk simulator yang sama; row lama perlu dikemas kini, bukan ditambah.

Endpoint summary boleh diuji terus di browser:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=summary
```

Nota CORS: frontend menggunakan JSONP untuk GET summary dan `fetch` POST `no-cors` sebagai simple request. Ini mengelakkan preflight CORS yang biasa berlaku pada Google Apps Script Web App, sambil masih menghantar semua data melalui Apps Script.
