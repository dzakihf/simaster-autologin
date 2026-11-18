# UGM autologin (SIMASTER + ELOK)

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

1. Buka link ini:
   https://raw.githubusercontent.com/dzakihf/ugm-autologin/main/ugm-autologin.user.js
2. Violentmonkey membuka halaman install. Klik **+Edit** (bukan *Install*) — script langsung terpasang dan editornya terbuka.

   > ⚠️ Kode di bagian bawah halaman install itu cuma **pratinjau, tidak bisa diedit**. Pakai tombol **+Edit**.

3. Di editor, bagian paling atas (di bawah baris `@match` / `@grant`) ada kotak besar. Isi `USERNAME` dan `PASSWORD` UGM ID kamu **di antara tanda kutip**.
4. Tekan **Ctrl+S** (atau klik **Save**), lalu **Save & Close**.
5. Buka SIMASTER atau ELOK — login selanjutnya otomatis.

Mau ganti username/password nanti: ikon **Violentmonkey** → **Open Dashboard** (ikon gerigi ⚙) → **Installed scripts** → **UGM autologin** → ikon **`</>`** (Edit).

Script ini **tidak auto-update** (supaya username/password yang kamu isi tidak tertimpa). Untuk versi baru, install ulang dari link di atas lalu isi lagi.

## Apa yang dilakukan

Userscript Violentmonkey untuk login otomatis ke situs UGM:

**SIMASTER** (`simaster.ugm.ac.id`, termasuk halaman captcha ulang kalau captcha salah)
1. Di halaman SSO UGM, username dan password diisi, lalu **LOGIN** dipencet.
2. Di halaman captcha SIMASTER, captcha dibaca langsung di browser pakai model [ddddocr](https://github.com/sml2h3/ddddocr) (ONNX, jalan via onnxruntime-web), diisi, lalu **Proses** dipencet.

**ELOK** (`elok.ugm.ac.id`)
1. Kalau belum login, tombol **SSO UGM** dipencet.
2. Di halaman SSO UGM, username dan password diisi, lalu **LOGIN** dipencet.

Tidak perlu Python / server. Semua jalan di browser.

## Catatan

- Kalau tombol **Masuk dengan UGM ID** di SIMASTER dipencet manual, username & password **tidak** diisi otomatis selama **5 menit** (kamu isi sendiri). Captcha tetap diisi & dikirim otomatis.
- Kalau **Keluar** (logout) di ELOK dipencet, ELOK tidak login otomatis selama **5 menit**, supaya tidak langsung login lagi.
- Maksimal 3 klik otomatis per menit (per langkah), supaya tidak looping kalau captcha/password salah.
- Password tersimpan sebagai teks biasa di dalam script di Violentmonkey. Jangan pakai di komputer bersama, dan jangan bagikan script yang sudah kamu isi.
- Model `common_old.onnx` berasal dari ddddocr (MIT License).

## WhatsApp chat navigation

Script terpisah: `whatsapp-chat-nav.user.js` (pasang dengan cara yang sama lewat Violentmonkey, tanpa username/password).

Di `web.whatsapp.com`:
- **Ctrl + ,** → chat sebelumnya (atas)
- **Ctrl + .** → chat berikutnya (bawah)
