// ==UserScript==
// @name         WhatsApp message select + reply
// @namespace    https://github.com/dzakihf/ugm-autologin
// @version      3.3
// @description  WhatsApp Web: Shift+Tab (dari kotak ketik) = pilih bubble paling bawah, Up/Down = navigasi native, E = edit, R = reply, Delete = hapus untuk semua orang (tanpa konfirmasi), Esc = kembali ke kotak ketik.
// @match        https://web.whatsapp.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

// Calls WhatsApp Web's own modules (window.require) instead of clicking through menus:
//   reply  -> chat.composeQuotedMsg = createMsgSnapshot(msg); ComposeBoxActions.focus(chat)   (as WAWebReplyToMsgChatAction)
//   edit   -> ModalManager.open(<WAWebMessageEditFlow msg={msg} />)                             (the "Edit message" modal)
//   delete -> Cmd.sendRevokeMsgs(chat, {type: 'message', list: [msg]}, {clearMedia: true})   (as WAWebDeleteRevokeMsgFlow)
// Message focus and Up/Down navigation are WhatsApp's native keyboard focus.

(function () {
  'use strict';

  const log = (...a) => console.log('[wa-kbd]', ...a);

  function wa(name) {
    try {
      return window.require(name);
    } catch (e) {
      log('module not available:', name, e.message);
      return null;
    }
  }

  function rowsSorted() {
    return Array.from(document.querySelectorAll('#main [role="row"]'))
      .filter((r) => r.querySelector('[data-id]'))
      .map((el) => ({ el, top: el.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top)
      .map((x) => x.el);
  }

  // the message row that currently has WhatsApp's native keyboard focus
  function focusedRow() {
    const a = document.activeElement;
    if (!a || !a.closest || a.isContentEditable) return null;
    const row = a.closest('#main [role="row"]');
    return row && row.querySelector('[data-id]') ? row : null;
  }

  // WhatsApp's own focus stop inside a message row
  function focusTarget(row) {
    return row.querySelector('[tabindex][aria-label]') || row.querySelector('[tabindex]') || row;
  }

  // A plain .focus() moves focus but WhatsApp only draws its focus ring when *it* handled the
  // keyboard navigation. So focus the neighbouring message and let WhatsApp's own arrow-key
  // handler move onto the target.
  function focusRow(row) {
    if (!row) return;
    row.scrollIntoView({ block: 'nearest' });
    const rows = rowsSorted();
    const i = rows.indexOf(row);
    const [from, key] = rows[i - 1] ? [rows[i - 1], 'ArrowDown'] : rows[i + 1] ? [rows[i + 1], 'ArrowUp'] : [null, null];
    if (from) {
      const el = focusTarget(from);
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, keyCode: key === 'ArrowDown' ? 40 : 38, bubbles: true, cancelable: true }));
    }
    // fallback (single message, or WhatsApp ignored the synthetic key)
    if (!row.contains(document.activeElement)) focusTarget(row).focus();
  }

  function isComposeBox(el) {
    return !!(el && el.isContentEditable && el.closest('#main footer'));
  }

  function msgOfRow(row) {
    const C = wa('WAWebCollections');
    const chat = C && C.Chat.getActive();
    const dataId = row.querySelector('[data-id]').getAttribute('data-id');
    if (!chat || !dataId) return {};
    const msg =
      chat.msgs.getModelsArray().find((m) => m.id.id === dataId || m.id.toString() === dataId) ||
      C.Msg.getModelsArray().find((m) => m.id.id === dataId);
    return { chat, msg };
  }

  function flash(row) {
    const el = row.contains(document.activeElement) ? document.activeElement : row;
    const prev = el.style.boxShadow;
    el.style.boxShadow = '0 0 0 2px #e53935';
    setTimeout(() => (el.style.boxShadow = prev), 600);
  }

  function reply(row) {
    const { chat, msg } = msgOfRow(row);
    if (!msg) return log('message model not found');
    chat.composeQuotedMsg = wa('WAWebMsgModelUtils').createMsgSnapshot(msg);
    wa('WAWebComposeBoxActions').ComposeBoxActions.focus(chat);
  }

  function edit(row) {
    const { msg } = msgOfRow(row);
    if (!msg) return log('message model not found');
    const cap = wa('WAWebMsgActionCapability');
    if (!(cap.canEditText(msg) || cap.canEditCaption(msg))) {
      log('message can not be edited (not yours, or older than 15 minutes)');
      return flash(row);
    }
    const React = wa('React');
    wa('WAWebModalManager').ModalManager.open(React.createElement(wa('WAWebMessageEditFlow.react'), { msg }));
  }

  // Esc on a focused bubble: leave message focus and go back to the compose box
  // (instead of WhatsApp's own Esc, which closes the chat)
  function unfocus() {
    const C = wa('WAWebCollections');
    const chat = C && C.Chat.getActive();
    if (chat) wa('WAWebComposeBoxActions')?.ComposeBoxActions.focus(chat);
    const box = document.querySelector('#main footer [contenteditable="true"]');
    if (box && document.activeElement !== box) box.focus();
    else if (!box) document.activeElement.blur();
  }

  function isSelfChat(chat) {
    const me = wa('WAWebUserPrefsMeUser');
    if (!me) return false;
    return ['getMaybeMeLidUser', 'getMaybeMePnUser', 'getMaybeMeUser'].some((fn) => {
      try {
        const w = me[fn] && me[fn]();
        return w && w.toString() === chat.id.toString();
      } catch (e) {
        return false;
      }
    });
  }

  function remove(row) {
    const { chat, msg } = msgOfRow(row);
    if (!msg) return log('message model not found');
    const cap = wa('WAWebMsgActionCapability');
    const { Cmd } = wa('WAWebCmd');

    // keep keyboard focus nearby afterwards: the message above (or below if it was the top one)
    const rows = rowsSorted();
    const i = rows.indexOf(row);
    const neighbour = rows[i - 1] || rows[i + 1];
    const neighbourId = neighbour && neighbour.querySelector('[data-id]').getAttribute('data-id');

    if (cap.canSenderRevokeMsg(msg) || cap.canAdminRevokeMsg(msg)) {
      Cmd.sendRevokeMsgs(chat, { type: 'message', list: [msg] }, { clearMedia: true });
    } else if (isSelfChat(chat)) {
      // "Message yourself" has no "delete for everyone"; delete for me is the equivalent there
      Cmd.sendDeleteMsgs(chat, { type: 'message', list: [msg] }, true, null, null);
    } else {
      log('"Delete for everyone" not allowed for this message (not yours, or too old)');
      return flash(row);
    }

    if (neighbourId) {
      setTimeout(() => {
        const n = document.querySelector(`#main [data-id="${CSS.escape(neighbourId)}"]`);
        focusRow(n && n.closest('[role="row"]'));
      }, 200);
    }
  }

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;

      // Shift+Tab from the compose box -> bottom bubble
      if (e.shiftKey && e.key === 'Tab') {
        if (!isComposeBox(document.activeElement)) return;
        const rows = rowsSorted();
        if (!rows.length) return;
        focusRow(rows[rows.length - 1]);
      } else {
        if (e.shiftKey) return;
        const row = focusedRow();
        if (!row) return;
        const k = e.key.toLowerCase();
        if (k === 'r') reply(row);
        else if (k === 'e') edit(row);
        else if (e.key === 'Delete') remove(row);
        else if (e.key === 'Escape') unfocus();
        else return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true
  );
})();
