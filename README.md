# SIMASTER autologin

## Cara pasang

### Langkah 1 — Pasang Violentmonkey (sekali saja)

**Chrome / Brave / Edge / Opera:**
1. Buka [Violentmonkey di Chrome Web Store](https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag).
2. Klik **Add to Chrome** (Brave/Edge: **Add to Brave** / **Get**) → **Add extension**.
3. Klik ikon puzzle 🧩 di toolbar → klik ikon pin 📌 di sebelah **Violentmonkey**, supaya ikonnya selalu kelihatan.
4. Kalau nanti script tidak jalan: buka `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`) → **Violentmonkey** → **Details** → nyalakan **Allow User Scripts** kalau ada. Kalau tidak ada, nyalakan **Developer mode** di pojok kanan atas.

**Firefox:**
1. Buka [Violentmonkey di Firefox Add-ons](https://addons.mozilla.org/firefox/addon/violentmonkey/).
2. Klik **Add to Firefox** → **Add**.
3. (Opsional) Klik ikon puzzle 🧩 → ikon gerigi di Violentmonkey → **Pin to Toolbar**.

### Langkah 2 — Pasang script

1. Buka link ini, lalu klik **Install** (atau **Confirm installation**):
   https://raw.githubusercontent.com/dzaki-bv/simaster-autologin/main/simaster-captcha.user.js

   > ⚠️ Kode di halaman install itu cuma **pratinjau, tidak bisa diedit**. Install dulu, baru isi username/password lewat dashboard (langkah 2–5 di bawah).

2. Klik ikon **Violentmonkey** di toolbar browser → **Open Dashboard** (ikon gerigi ⚙).
3. Di **Installed scripts**, cari **SIMASTER autologin** → klik ikon **`</>`** (Edit).
4. Di bagian paling atas ada kotak besar. Isi `USERNAME` dan `PASSWORD` UGM ID kamu **di antara tanda kutip**.
5. Tekan **Ctrl+S** (atau klik **Save**), lalu **Save & Close**.
6. Buka SIMASTER dan login lewat UGM ID — selanjutnya otomatis.

Script ini **tidak auto-update** (supaya username/password yang kamu isi tidak tertimpa). Untuk versi baru, install ulang dari link di atas lalu isi lagi.

## Apa yang dilakukan

Userscript Violentmonkey untuk login SIMASTER UGM otomatis:

1. Di halaman SSO UGM (`sso.ugm.ac.id/cas/login`, kalau datang dari SIMASTER) username dan password diisi, lalu **LOGIN** dipencet.
2. Di halaman captcha SIMASTER, captcha dibaca langsung di browser pakai model [ddddocr](https://github.com/sml2h3/ddddocr) (ONNX, jalan via onnxruntime-web), diisi, lalu **Proses** dipencet.

Tidak perlu Python / server. Semua jalan di browser.

## Catatan

- Kalau tombol **Masuk dengan UGM ID** dipencet manual, script berhenti 2 menit (login manual).
- Maksimal 3 submit otomatis per menit, supaya tidak looping kalau captcha/password salah.
- Password tersimpan sebagai teks biasa di dalam script di Violentmonkey. Jangan pakai di komputer bersama, dan jangan bagikan script yang sudah kamu isi.
- Model `common_old.onnx` berasal dari ddddocr (MIT License).
