// ==UserScript==
// @name         WhatsApp chat navigation
// @namespace    https://github.com/dzakihf/ugm-autologin
// @version      1.0
// @description  WhatsApp Web: Ctrl+, = chat sebelumnya (atas), Ctrl+. = chat berikutnya (bawah).
// @match        https://web.whatsapp.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  function rows() {
    const pane = document.querySelector('#pane-side');
    if (!pane) return [];
    let items = Array.from(pane.querySelectorAll('[role="listitem"]'));
    if (!items.length) items = Array.from(pane.querySelectorAll('[role="row"]'));
    // list is virtualized: DOM order != visual order, so sort by position
    return items
      .map((el) => ({ el, top: el.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top)
      .map((x) => x.el);
  }

  function isSelected(row) {
    return !!row.querySelector('[aria-selected="true"]') || row.getAttribute('aria-selected') === 'true';
  }

  function open(row) {
    const target = row.querySelector('[role="gridcell"]') || row.firstElementChild || row;
    row.scrollIntoView({ block: 'nearest' });
    for (const type of ['mousedown', 'mouseup', 'click']) {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
  }

  function go(dir) {
    const list = rows();
    if (!list.length) return;
    const i = list.findIndex(isSelected);
    const next = i === -1 ? (dir > 0 ? 0 : list.length - 1) : i + dir;
    if (next < 0 || next >= list.length) return;
    open(list[next]);
  }

  window.addEventListener(
    'keydown',
    (e) => {
      if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
      if (e.code === 'Comma') go(-1);
      else if (e.code === 'Period') go(1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );
})();
