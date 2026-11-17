// ###########################################################################
// ##                                                                       ##
// ##   UGM AUTOLOGIN (SIMASTER + ELOK) — CARA PASANG                       ##
// ##                                                                       ##
// ##   LANGKAH 1 — PASANG VIOLENTMONKEY (sekali saja)                      ##
// ##                                                                       ##
// ##   Chrome / Brave / Edge / Opera:                                      ##
// ##     1. Buka: https://chromewebstore.google.com/detail/violentmonkey/  ##
// ##              jinjaccalgkegednnccohejagnlnfdag                         ##
// ##     2. Klik "Add to Chrome" (Brave/Edge: "Add to Brave" / "Get")      ##
// ##        -> "Add extension"                                             ##
// ##     3. Ikon puzzle di toolbar -> pin "Violentmonkey"                  ##
// ##     4. Kalau script nanti tidak jalan: buka chrome://extensions       ##
// ##        (brave://extensions / edge://extensions) -> Violentmonkey      ##
// ##        -> Details -> nyalakan "Allow User Scripts". Kalau tidak ada,  ##
// ##        nyalakan "Developer mode" di pojok kanan atas.                 ##
// ##                                                                       ##
// ##   Firefox:                                                            ##
// ##     1. Buka: https://addons.mozilla.org/firefox/addon/violentmonkey/  ##
// ##     2. Klik "Add to Firefox" -> "Add"                                 ##
// ##                                                                       ##
// ##   LANGKAH 2 — PASANG SCRIPT INI                                       ##
// ##                                                                       ##
// ##     1. Buka lagi link script ini (refresh halaman ini):               ##
// ##        https://raw.githubusercontent.com/dzakihf/                     ##
// ##        ugm-autologin/main/ugm-autologin.user.js                       ##
// ##     2. Violentmonkey membuka halaman install -> klik "+Edit"          ##
// ##        (install sekaligus langsung buka editor)                       ##
// ##     3. Isi username & password: lihat kotak besar di bawah            ##
// ##        (di bawah baris-baris @match / @grant), lalu Ctrl+S.           ##
// ##                                                                       ##
// ###########################################################################

// ==UserScript==
// @name         UGM autologin
// @namespace    https://github.com/dzakihf/ugm-autologin
// @version      4.0
// @description  Auto-login SIMASTER & ELOK UGM: clicks SSO UGM on ELOK, fills UGM ID on SSO, solves the SIMASTER captcha in-browser (ddddocr), submits.
// @match        https://simaster.ugm.ac.id/ugmfw/signin_simaster*
// @match        https://sso.ugm.ac.id/cas/login*
// @match        https://elok.ugm.ac.id/*
// @grant        GM_getResourceURL
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.3/dist/ort.wasm.min.js
// @resource     ortwasm https://unpkg.com/onnxruntime-web@1.17.3/dist/ort-wasm-simd.wasm
// @resource     model https://raw.githubusercontent.com/dzakihf/ugm-autologin/main/common_old.onnx
// @updateURL    none
// @downloadURL  none
// @run-at       document-start
// ==/UserScript==

// ###########################################################################
// ###########################################################################
// ##                                                                       ##
// ##   >>>   ISI USERNAME DAN PASSWORD UGM ID KAMU DI BAWAH INI   <<<      ##
// ##                                                                       ##
// ##   CARA ISI:                                                           ##
// ##   (Kalau kamu lihat ini di halaman install: belum bisa diedit.        ##
// ##    Klik tombol "+Edit" di atas -> script terpasang & editor terbuka.) ##
// ##   1. Tulis username & password di antara tanda kutip di bawah         ##
// ##   2. Ctrl+S (Save), lalu Save & Close                                 ##
// ##                                                                       ##
// ##   Mau edit lagi nanti: ikon Violentmonkey -> Open Dashboard (gerigi)  ##
// ##   -> Installed scripts -> UGM autologin -> ikon </> (Edit)            ##
// ##                                                                       ##
// ##   Contoh:  const USERNAME = "namakamu";                               ##
// ##            const PASSWORD = "passwordkamu";                           ##
// ##                                                                       ##
// ###########################################################################
// ###########################################################################

const USERNAME = "";
const PASSWORD = "";

// ###########################################################################
// ##   Jangan ubah apa pun di bawah garis ini.                             ##
// ###########################################################################

(() => {
  // Max 3 automatic submits per minute per key, so a wrong captcha/password
  // doesn't loop forever.
  function allowAuto(key) {
    const now = Date.now();
    let hist = [];
    try { hist = JSON.parse(sessionStorage.getItem(key) || "[]"); } catch {}
    hist = hist.filter((t) => now - t < 60000);
    if (hist.length >= 3) { console.warn("[autologin] paused:", key); return false; }
    hist.push(now);
    try { sessionStorage.setItem(key, JSON.stringify(hist)); } catch {}
    return true;
  }

  // Manual actions pause the whole script for 5 minutes (shared across
  // simaster/sso/elok via GM storage):
  //  - clicking "Masuk dengan UGM ID" on SIMASTER (manual login)
  //  - clicking "Keluar" (logout) on ELOK, so it doesn't log straight back in
  const PAUSE_MS = 5 * 60 * 1000;
  const paused = () => Date.now() < (GM_getValue("manualUntil", 0) || 0);
  document.addEventListener("click", (e) => {
    if (!e.isTrusted) return; // ignore our own .click() calls
    const el = e.target.closest?.("a, button, input[type=submit], input[type=button]");
    if (!el) return;
    const href = el.getAttribute("href") || "";
    const label = (el.textContent || el.value || "") + " " + href;
    const manualLogin = /ugm\s*id/i.test(label) || href.includes("signin_proses");
    const elokLogout = location.hostname === "elok.ugm.ac.id" &&
      (href.includes("/login/logout.php") || el.dataset.identifier === "logout,moodle");
    if (manualLogin || elokLogout) GM_setValue("manualUntil", Date.now() + PAUSE_MS);
  }, true);

  function login() {
    if (paused()) return;
    const user = document.querySelector("input#username");
    const pass = document.querySelector("input#password");
    const btn = document.querySelector('input[type="submit"][value="LOGIN"]');
    if (!user || !pass || !btn) return;
    if (!USERNAME || !PASSWORD) {
      alert("UGM autologin: username/password belum diisi.\n" +
            "Buka Violentmonkey → UGM autologin → edit, isi USERNAME dan PASSWORD di bagian atas.");
      return;
    }
    for (const [el, v] of [[user, USERNAME], [pass, PASSWORD]]) {
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (allowAuto("autoLogin")) btn.click();
  }

  // ELOK (Moodle): when logged out, click the "SSO UGM" button.
  function elokSSO() {
    if (paused()) return;
    const span = [...document.querySelectorAll("span.rui-login-btn-txt")]
      .find((el) => el.textContent.trim() === "SSO UGM");
    const link = span?.closest("a");
    if (link && allowAuto("elokSSO")) link.click();
  }
  if (location.hostname === "elok.ugm.ac.id") {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", elokSSO, { once: true });
    else elokSSO();
  }

  // UGM SSO (CAS) form — only auto-login when it was reached from SIMASTER or ELOK.
  const service = decodeURIComponent(location.search);
  if (location.hostname === "sso.ugm.ac.id" &&
      (service.includes("simaster.ugm.ac.id") || service.includes("elok.ugm.ac.id"))) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", login, { once: true });
    else login();
  }

  // ddddocr (common_old.onnx) port for the browser. Needs global `ort` (onnxruntime-web 1.17.3).
  // Charset entries for ASCII letters/digits only; everything else is dropped.
  const DDDD_CHARS = {"78":"2","357":"F","409":"7","687":"D","747":"M","761":"C","806":"r","821":"Y","1066":"b","1107":"c","1583":"J","1614":"I","1638":"f","1769":"v","2041":"i","2089":"l","2203":"B","2525":"E","2663":"u","2879":"9","3072":"k","3466":"s","3930":"P","3963":"Z","4050":"n","4410":"1","4488":"G","4617":"m","4666":"K","4730":"z","4771":"A","4810":"W","5027":"p","5046":"T","5225":"X","5418":"O","5554":"H","5726":"d","5734":"V","5806":"4","5961":"6","6185":"j","6216":"N","6257":"e","6386":"S","6601":"Q","6612":"y","6672":"L","6736":"x","6749":"0","6939":"o","6977":"5","6979":"8","7136":"w","7198":"a","7262":"R","7284":"U","7405":"q","7721":"3","7723":"t","8119":"g","8196":"h"};

  async function ddddCreateSession(modelBytes, wasmUrl) {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = { "ort-wasm-simd.wasm": wasmUrl, "ort-wasm.wasm": wasmUrl };
    return ort.InferenceSession.create(modelBytes, { executionProviders: ["wasm"] });
  }

  async function ddddRecognize(session, img) {
    const H = 64;
    const W = Math.max(1, Math.floor(img.naturalWidth * H / img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, W, H);
    const px = ctx.getImageData(0, 0, W, H).data;
    const x = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++)
      x[i] = Math.round((px[i * 4] * 299 + px[i * 4 + 1] * 587 + px[i * 4 + 2] * 114) / 1000) / 255;
    const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", x, [1, 1, H, W]) });
    const o = out[session.outputNames[0]];
    // Either argmaxed indices [1, seq] or logits [seq, 1, classes].
    let idx;
    if (o.dims.length === 3) {
      const C = o.dims[2], T = o.data.length / C;
      idx = new Array(T);
      for (let t = 0; t < T; t++) {
        let best = 0, bv = -Infinity;
        for (let k = 0; k < C; k++) { const v = o.data[t * C + k]; if (v > bv) { bv = v; best = k; } }
        idx[t] = best;
      }
    } else idx = Array.from(o.data, Number);
    let s = "", prev = -1;
    for (const i of idx) {
      if (i !== prev && i !== 0 && DDDD_CHARS[i]) s += DDDD_CHARS[i];
      prev = i;
    }
    return s;
  }

  // Model is only loaded on pages that have the captcha, once per page.
  let sessionPromise = null;
  function getSession() {
    return (sessionPromise ??= (async () => {
      const model = new Uint8Array(await (await fetch(GM_getResourceURL("model"))).arrayBuffer());
      return ddddCreateSession(model, GM_getResourceURL("ortwasm"));
    })());
  }

  function solve(img) {
    if (paused()) return;
    // At document-start the image can finish loading before the form is parsed.
    if (document.readyState === "loading" && !document.querySelector("input#captcha"))
      return document.addEventListener("DOMContentLoaded", () => solve(img), { once: true });
    const input = document.querySelector("input#captcha");
    if (!input || !img.naturalWidth) return;
    getSession()
      .then((session) => ddddRecognize(session, img))
      .then((raw) => {
        const text = raw.replace(/\D/g, "");
        input.value = text;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        submit(text);
      })
      .catch((e) => console.warn("[captcha] OCR failed", e));
  }

  // Click "Proses". Guard against a submit loop when OCR keeps misreading:
  // at most 3 auto-submits per minute.
  function submit(text) {
    if (text.length < 4) return;
    const btn = [...document.querySelectorAll('button[type="submit"]')]
      .find((b) => b.textContent.trim() === "Proses");
    if (!btn) {
      if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", () => submit(text), { once: true });
      return;
    }
    if (!allowAuto("captchaAutoSubmit")) return;
    btn.click();
  }

  function hook(img) {
    if (img.__captchaHooked) return;
    img.__captchaHooked = true;
    if (!paused()) getSession().catch(() => {});
    img.addEventListener("load", () => solve(img)); // also re-solves on captcha refresh
    if (img.complete) solve(img);
  }

  const find = () => { const img = document.querySelector("img#captchaView"); if (img) hook(img); };
  find();
  new MutationObserver(find).observe(document, { childList: true, subtree: true });
})();
