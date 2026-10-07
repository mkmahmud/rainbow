/* DOM + feedback helpers shared by all pages. */
window.App = window.App || {};

App.UI = (function () {
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function on(root, event, selector, handler) {
    root.addEventListener(event, function (e) {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) handler.call(target, e, target);
    });
  }

  function toast(message, type) {
    const wrap = qs("#toast-wrap");
    if (!wrap) return;
    const el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .25s ease, transform .25s ease";
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 260);
    }, 2800);
  }

  function modal(opts) {
    const root = qs("#modal-root");
    const appRoot = qs("#app");
    const opener = document.activeElement;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.setAttribute("role", "presentation");
    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || "Dialog") + '">' +
        '<div class="modal-head"><h3>' + esc(opts.title || "") + "</h3>" +
          '<button class="icon-btn" data-close aria-label="Close">&times;</button></div>' +
        '<div class="modal-body">' + (opts.bodyHtml || "") + "</div>" +
        (opts.footerHtml ? '<div class="modal-foot">' + opts.footerHtml + "</div>" : "") +
      "</div>";
    root.appendChild(backdrop);
    if (appRoot) appRoot.setAttribute("inert", "");

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      backdrop.remove();
      document.removeEventListener("keydown", onKey);
      if (appRoot) appRoot.removeAttribute("inert");
      if (opener && document.contains(opener) && typeof opener.focus === "function") opener.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      const items = qsa('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', backdrop)
        .filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop || e.target.closest("[data-close]")) close(); });

    if (opts.onMount) opts.onMount(backdrop, close);
    const focusable = backdrop.querySelector("input, select, textarea, button");
    if (focusable) focusable.focus();
    return { close: close, root: backdrop };
  }

  function confirm(message, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => { if (!settled) { settled = true; resolve(v); } };
      modal({
        title: opts.title || "Please confirm",
        bodyHtml: "<p>" + esc(message) + "</p>",
        footerHtml: '<button class="btn btn-outline" data-close>' + esc(opts.cancelText || "Cancel") + "</button>" +
          '<button class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '" data-confirm>' + esc(opts.okText || "Confirm") + "</button>",
        onMount: (root, close) => {
          root.querySelector("[data-confirm]").addEventListener("click", () => { close(); done(true); });
          root.addEventListener("click", (e) => {
            if (e.target.closest("[data-close]")) done(false);
            else if (e.target.classList && e.target.classList.contains("modal-backdrop")) done(false);
          });
        },
      });
    });
  }

  const DISCLAIMER_KEYS = { disc_general: "general", disc_recommendation: "recommendation", disc_diet: "diet", disc_condition: "condition" };
  function disclaimer(key) {
    const fallback = App.DATA.content.disclaimers[DISCLAIMER_KEYS[key]] || App.DATA.content.disclaimers.general;
    const text = App.State.contentEdit(key, fallback);
    return '<div class="disclaimer"><span class="di">⚠️</span><span>' + esc(text) + "</span></div>";
  }

  function emptyState(title, message, icon) {
    return '<div class="empty"><div class="empty-icon">' + esc(icon || "🍽️") + "</div><h3>" +
      esc(title) + "</h3><p>" + esc(message || "") + "</p></div>";
  }

  function disabledSection(title, message, ctaHtml) {
    return '<div class="card center">' +
      '<div class="stat-icon" style="margin:0 auto var(--s-3);font-size:26px">🔒</div>' +
      "<h3>" + esc(title) + "</h3>" +
      '<p class="muted mt-2" style="max-width:520px;margin-left:auto;margin-right:auto">' + esc(message) + "</p>" +
      (ctaHtml ? '<div class="mt-4">' + ctaHtml + "</div>" : "") +
      "</div>";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }

  function scrollTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }

  return { esc, qs, qsa, on, toast, modal, confirm, disclaimer, emptyState, disabledSection, fmtDate, scrollTop };
})();
