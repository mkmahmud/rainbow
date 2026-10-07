/* Bootstrap + persistent shell (header, footer, menus). */
window.App = window.App || {};

App.Shell = (function () {
  const esc = App.UI.esc;
  let navOpen = false;

  function headerHtml() {
    const t = App.I18N.t;
    const user = App.State.currentUser();
    const authed = !!user;
    const lang = App.I18N.getLang();

    const navHtml = authed
      ? '<nav class="nav' + (navOpen ? " open" : "") + '" id="main-nav">' +
          App.Auth.navItems().map((i) =>
            '<a href="' + i.route + '" data-route="' + i.route + '">' + i.icon + " " + esc(i.label) + "</a>"
          ).join("") +
        "</nav>"
      : "";

    const userMenu = authed
      ? '<div class="menu">' +
          '<button class="avatar" data-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="' + esc("Account menu for " + user.name) + '" title="' + esc(user.name) + '">' + esc(initials(user.name)) + "</button>" +
          '<div class="menu-panel" data-menu-panel hidden>' +
            '<div class="menu-title">' + esc(user.name) + (user.premium ? " ⭐" : "") + "</div>" +
            '<a class="menu-item" href="#/profile">👤 ' + esc(t("nav_profile")) + "</a>" +
            '<a class="menu-item" href="#/settings">⚙️ ' + esc(t("nav_settings")) + "</a>" +
            '<a class="menu-item" href="#/help">❓ ' + esc(t("nav_help")) + "</a>" +
            '<button class="menu-item" data-lang-toggle>🌐 ' + (lang === "en" ? "বাংলা" : "English") + "</button>" +
            '<button class="menu-item danger" data-logout>⏻ ' + esc(t("nav_logout")) + "</button>" +
          "</div>" +
        "</div>"
      : '<a class="btn btn-ghost" href="#/login">' + esc(t("nav_login")) + "</a>" +
        '<a class="btn btn-primary" href="#/register">' + esc(t("nav_register")) + "</a>";

    return '<div class="container header-inner">' +
      '<a class="brand" href="' + (authed ? "#/home" : "#/") + '">' +
        '<span class="brand-mark">🥗</span>' +
        '<span>' + esc(t("appName")) + '<small>' + esc(t("tagline")) + "</small></span>" +
      "</a>" +
      navHtml +
      '<div class="header-actions">' +
        '<div class="menu">' +
          '<button class="chip static" data-roles-toggle aria-haspopup="true" aria-expanded="false">🎭 ' + esc(t("role_switcher")) + "</button>" +
          '<div class="menu-panel" data-roles-panel hidden>' +
            '<div class="menu-title">' + esc(t("role_switcher")) + "</div>" +
            App.Auth.roleOptions().map((r) =>
              '<button class="menu-item" data-login-as="' + r.id + '"><strong>' + esc(r.name) + "</strong><span class='muted small'>&nbsp;· " + esc(r.persona) + "</span></button>"
            ).join("") +
          "</div>" +
        "</div>" +
        '<button class="hamburger" data-nav-toggle aria-label="Menu" aria-expanded="false">☰</button>' +
        userMenu +
      "</div>" +
    "</div>";
  }

  function footerHtml() {
    const t = App.I18N.t;
    return '<div class="container footer-grid">' +
      "<div>🥗 <strong>" + esc(t("appName")) + "</strong> — " + esc(t("tagline")) + "</div>" +
      '<div class="small">' + esc(App.DATA.content.disclaimers.general.slice(0, 120)) + "…</div>" +
      '<div><a href="#/help">' + esc(t("nav_help")) + "</a></div>" +
    "</div>";
  }

  function initials(name) {
    return (name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }

  function render() {
    const oldHeader = document.getElementById("site-header");
    if (oldHeader) {
      // Fresh node each render so delegated listeners don't accumulate.
      const header = oldHeader.cloneNode(false);
      header.id = "site-header";
      header.className = "site-header" + (App.State.isAuthed() ? " is-authed" : "");
      oldHeader.replaceWith(header);
      header.innerHTML = headerHtml();
      bindHeader(header);
    }
    const footer = document.getElementById("site-footer");
    if (footer) footer.innerHTML = footerHtml();
    markActive(App.Router.path());
  }

  function markActive(path) {
    App.UI.qsa(".nav a[data-route]").forEach((a) => {
      const route = a.getAttribute("data-route").replace("#", "");
      const isHome = route === "/home" && path === "/";
      const active = path === route || isHome;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function bindHeader(header) {
    if (!header) header = document.getElementById("site-header");
    if (!header) return;

    App.UI.qsa("[data-menu-toggle], [data-roles-toggle]", header).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const panel = btn.parentElement.querySelector(".menu-panel");
        const willOpen = panel.hidden;
        closeAllMenus();
        panel.hidden = !willOpen;
        btn.setAttribute("aria-expanded", String(willOpen));
      });
    });

    const navToggle = header.querySelector("[data-nav-toggle]");
    if (navToggle) navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navOpen = !navOpen;
      const nav = header.querySelector("#main-nav");
      if (nav) nav.classList.toggle("open", navOpen);
      navToggle.setAttribute("aria-expanded", String(navOpen));
    });

    header.addEventListener("click", (e) => {
      const loginAs = e.target.closest("[data-login-as]");
      if (loginAs) {
        App.Auth.loginAs(loginAs.getAttribute("data-login-as"));
        App.UI.toast("Switched demo role");
        App.Router.go("#/home");
        return;
      }
      if (e.target.closest("[data-lang-toggle]")) {
        App.State.setLanguage(App.I18N.getLang() === "en" ? "bn" : "en");
        App.Router.refresh();
        return;
      }
      if (e.target.closest("[data-logout]")) {
        App.Auth.logout();
        App.UI.toast("Signed out");
        App.Router.go("#/");
      }
    });
  }

  function closeAllMenus() {
    App.UI.qsa(".menu-panel").forEach((p) => { p.hidden = true; });
    App.UI.qsa("[data-menu-toggle], [data-roles-toggle]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  document.addEventListener("click", closeAllMenus);

  return { render, markActive, closeAllMenus };
})();

(function bootstrap() {
  function init() {
    App.Router.register("/notfound", {
      render: function () {
        return '<div class="container">' +
          App.UI.emptyState("Page not found", "The page you were looking for doesn't exist.", "🧭") +
          '<div class="center mt-4"><a class="btn btn-primary" href="#' + (App.State.isAuthed() ? "/home" : "/") + '">Go home</a></div>' +
        "</div>";
      },
      title: "Not found",
    });
    App.State.load();
    App.I18N.setLang(App.State.language());
    App.Shell.render();
    App.State.subscribe(function () { App.Shell.render(); });
    App.Router.start();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
