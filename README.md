# SIMASTER autologin

Userscript Violentmonkey untuk login SIMASTER UGM otomatis:

1. Di halaman SSO UGM (`sso.ugm.ac.id/cas/login`, kalau datang dari SIMASTER) username dan password diisi, lalu **LOGIN** dipencet.
2. Di halaman captcha SIMASTER, captcha dibaca langsung di browser pakai model [ddddocr](https://github.com/sml2h3/ddddocr) (ONNX, jalan via onnxruntime-web), diisi, lalu **Proses** dipencet.

Tidak perlu Python / server. Semua jalan di browser.

## Pasang

1. Install **Violentmonkey** ([Chrome/Brave/Edge](https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag), [Firefox](https://addons.mozilla.org/firefox/addon/violentmonkey/)).
2. Buka link ini, lalu klik **Install**:
   https://raw.githubusercontent.com/dzaki-bv/simaster-autologin/main/simaster-captcha.user.js
3. Buka dashboard Violentmonkey → klik **SIMASTER autologin** untuk edit. Di bagian paling atas ada kotak besar:
   isi `USERNAME` dan `PASSWORD` UGM ID kamu di antara tanda kutip, lalu **Ctrl+S**.
4. Buka SIMASTER dan login lewat UGM ID — selanjutnya otomatis.

Script ini **tidak auto-update** (supaya username/password yang kamu isi tidak tertimpa). Untuk versi baru, install ulang dari link di atas lalu isi lagi.

## Catatan

- Kalau tombol **Masuk dengan UGM ID** dipencet manual, script berhenti 2 menit (login manual).
- Maksimal 3 submit otomatis per menit, supaya tidak looping kalau captcha/password salah.
- Password tersimpan sebagai teks biasa di dalam script di Violentmonkey. Jangan pakai di komputer bersama, dan jangan bagikan script yang sudah kamu isi.
- Model `common_old.onnx` berasal dari ddddocr (MIT License).
