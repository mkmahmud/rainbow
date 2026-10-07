/* Bootstrap + shell. Guests get the marketing header; signed-in users get the
   app shell (persistent light sidebar + greeting topbar with global search). */
window.App = window.App || {};

App.Shell = (function () {
  const esc = App.UI.esc;
  let sidebarOpen = false;

  function icon(name, size) { return App.Icons.get(name, size); }
  function initials(name) {
    return (name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }
  function firstName(n) { return (n || "").split(" ")[0]; }
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }

  /* ---------- shared fragments ---------- */
  function demoRoleItems() {
    return App.Auth.roleOptions().map((r) =>
      '<button class="menu-item" data-login-as="' + r.id + '"><strong>' + esc(r.name) + '</strong><span class="muted small">&nbsp;· ' + esc(r.persona) + "</span></button>"
    ).join("");
  }

  function notifications(user) {
    const items = App.State.logs(user.id).slice(-4).reverse();
    const rows = items.length
      ? items.map((l) => {
          const f = App.State.foodById(l.foodId);
          if (!f) return "";
          return '<div class="notif-item"><span class="notif-ic">' + icon("spark", 15) + "</span>" +
            "<div><strong>" + esc("Logged " + App.I18N.name(f)) + "</strong><small>" + l.grams + " g · " + esc(l.slot) + "</small></div></div>";
        }).join("")
      : '<div class="muted small" style="padding:12px">' + esc("You're all caught up.") + "</div>";
    return '<div class="menu">' +
      '<button class="bell" data-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="Notifications">' +
        icon("bell", 19) + (items.length ? '<span class="bell-dot"></span>' : "") + "</button>" +
      '<div class="menu-panel menu-panel-wide" data-menu-panel hidden>' +
        '<div class="menu-title">' + esc("Notifications") + "</div>" + rows +
      "</div>" +
    "</div>";
  }

  function accountMenu() {
    const t = App.I18N.t;
    const user = App.State.currentUser();
    const lang = App.I18N.getLang();
    return '<div class="menu">' +
      '<button class="user-chip" data-menu-toggle aria-haspopup="true" aria-expanded="false">' +
        '<span class="avatar">' + esc(initials(user.name)) + "</span>" +
        '<span class="user-chip-meta"><strong>' + esc(user.name) + "</strong><small>" + esc(App.RBAC.label(user.role)) + "</small></span>" +
        '<span class="chev">' + icon("chevron", 16) + "</span>" +
      "</button>" +
      '<div class="menu-panel" data-menu-panel hidden>' +
        '<div class="menu-title">' + esc(t("role_switcher")) + "</div>" +
        demoRoleItems() +
        '<div class="menu-sep"></div>' +
        (App.RBAC.hasRole(user, "member") ? '<a class="menu-item" href="#/profile">' + icon("profile", 17) + " " + esc(t("nav_profile")) + "</a>" : "") +
        '<a class="menu-item" href="#/settings">' + icon("settings", 17) + " " + esc(t("nav_settings")) + "</a>" +
        '<a class="menu-item" href="#/help">' + icon("help", 17) + " " + esc(t("nav_help")) + "</a>" +
        '<button class="menu-item" data-lang-toggle>' + icon("spark", 17) + " " + (lang === "en" ? "বাংলা" : "English") + "</button>" +
        '<button class="menu-item danger" data-logout>' + icon("logout", 17) + " " + esc(t("nav_logout")) + "</button>" +
      "</div>" +
    "</div>";
  }

  /* ---------- marketing header (guests) ---------- */
  function headerHtml() {
    const t = App.I18N.t;
    return '<div class="container header-inner">' +
      '<a class="brand" href="#/">' +
        '<span class="brand-mark">🥗</span>' +
        '<span>' + esc(t("appName")) + "<small>" + esc(t("tagline")) + "</small></span>" +
      "</a>" +
      '<div class="header-actions">' +
        '<a class="btn btn-ghost" href="#/login">' + esc(t("nav_login")) + "</a>" +
        '<a class="btn btn-primary" href="#/register">' + esc(t("nav_register")) + "</a>" +
      "</div>" +
    "</div>";
  }

  /* ---------- app shell (authed) ---------- */
  function sidebarHtml() {
    const t = App.I18N.t;
    const path = App.Router.path();
    const group = (labelKey, items) =>
      '<div class="nav-group"><div class="nav-label">' + esc(t(labelKey)) + "</div>" +
      items.map((i) => sideLink(i, path)).join("") + "</div>";

    return '<div class="sidebar-brand">' +
        '<a class="brand" href="#/dashboard"><span class="brand-mark">🥗</span>' +
          '<span class="brand-text">' + esc(t("appName")) + "<small>" + esc(t("tagline")) + "</small></span></a>" +
        '<button class="sidebar-close" data-sidebar-close aria-label="Close navigation">' + icon("close", 18) + "</button>" +
      "</div>" +
      '<nav class="sidebar-nav" aria-label="Primary">' +
        group("nav_group_menu", App.Auth.navItems()) +
        group("nav_group_account", App.Auth.accountItems()) +
      "</nav>" +
      promoCard() +
      '<div class="sidebar-foot">' +
        '<button class="side-link side-signout" data-logout>' + icon("logout", 18) + "<span>" + esc(t("nav_logout")) + "</span></button>" +
      "</div>";
  }

  function promoCard() {
    const user = App.State.currentUser();
    if (!App.RBAC.hasRole(user, "member") || user.premium) return "";
    return '<div class="sidebar-promo">' +
      '<div class="promo-emoji">🥗</div>' +
      "<h4>" + esc("Start your health journey") + "</h4>" +
      "<p>" + esc("Unlock a 7-day chart and a nutritionist review with Premium.") + "</p>" +
      '<a class="btn btn-block" href="#/premium">' + esc("Upgrade now") + "</a>" +
    "</div>";
  }

  function sideLink(item, path) {
    const route = item.route.replace("#", "");
    const active = path === route;
    return '<a class="side-link' + (active ? " active" : "") + '" href="' + item.route + '" data-route="' + item.route + '"' +
      (active ? ' aria-current="page"' : "") + ">" + icon(item.icon) + "<span>" + esc(item.label) + "</span>" +
      (item.badge ? '<span class="count">' + item.badge + "</span>" : "") + "</a>";
  }

  function topbarHtml() {
    const user = App.State.currentUser();
    const t = App.I18N.t;
    return '<div class="topbar-inner">' +
      '<button class="topbar-menu" data-sidebar-toggle aria-label="Open navigation" aria-expanded="false">' + icon("menu", 20) + "</button>" +
      '<div class="topbar-head" data-topbar-head></div>' +
      '<form class="topbar-search" data-search role="search">' +
        '<span class="search-ic">' + icon("search", 18) + "</span>" +
        '<input class="search-input" type="search" placeholder="' + esc(t("search_anything")) + '" aria-label="' + esc(t("search_anything")) + '" />' +
      "</form>" +
      '<div class="header-actions">' + notifications(user) + accountMenu() + "</div>" +
    "</div>";
  }

  function setHeading(path, title) {
    const el = document.querySelector("[data-topbar-head]");
    if (!el) return;
    const user = App.State.currentUser();
    if (path === "/dashboard" && user) {
      el.innerHTML = '<div class="greet-title">' + esc(greeting() + ", " + firstName(user.name) + "!") + "</div>" +
        '<div class="greet-sub">' + esc(App.I18N.t("greet_sub")) + "</div>";
    } else {
      el.innerHTML = title ? '<div class="greet-title">' + esc(title) + "</div>" : "";
    }
  }

  function footerHtml() {
    const t = App.I18N.t;
    return '<div class="container footer-grid">' +
      "<div>🥗 <strong>" + esc(t("appName")) + "</strong> — " + esc(t("tagline")) + "</div>" +
      '<div class="small">' + esc(App.DATA.content.disclaimers.general.slice(0, 120)) + "…</div>" +
      '<div><a href="#/help">' + esc(t("nav_help")) + "</a></div>" +
    "</div>";
  }

  /* ---------- render ---------- */
  function render() {
    const authed = App.State.isAuthed();
    const app = document.getElementById("app");
    const sidebar = document.getElementById("sidebar");
    const scrim = document.getElementById("sidebar-scrim");
    const footer = document.getElementById("site-footer");

    app.classList.toggle("app-authed", authed);

    if (authed) {
      sidebar.hidden = false;
      sidebar.innerHTML = sidebarHtml();
      setHeader("topbar", topbarHtml());
      if (footer) footer.innerHTML = "";
    } else {
      sidebarOpen = false;
      sidebar.hidden = true;
      sidebar.classList.remove("open");
      sidebar.innerHTML = "";
      if (scrim) scrim.hidden = true;
      document.body.classList.remove("no-scroll");
      setHeader("site-header", headerHtml());
      if (footer) footer.innerHTML = footerHtml();
    }
    setHeading(App.Router.path(), App.Router.title());
    markActive(App.Router.path());
  }

  /* Fresh header node each render so delegated listeners never accumulate. */
  function setHeader(className, html) {
    const old = document.getElementById("site-header");
    if (!old) return;
    const header = old.cloneNode(false);
    header.id = "site-header";
    header.className = className;
    old.replaceWith(header);
    header.innerHTML = html;
  }

  function markActive(path) {
    App.UI.qsa("a[data-route]").forEach((a) => {
      const route = a.getAttribute("data-route").replace("#", "");
      const active = path === route;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function toggleSidebar(open) {
    sidebarOpen = open;
    const sb = document.getElementById("sidebar");
    const scrim = document.getElementById("sidebar-scrim");
    if (sb) sb.classList.toggle("open", open);
    if (scrim) scrim.hidden = !open;
    const btn = document.querySelector("[data-sidebar-toggle]");
    if (btn) btn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("no-scroll", open);
  }

  function closeAllMenus() {
    App.UI.qsa(".menu-panel").forEach((p) => { p.hidden = true; });
    App.UI.qsa("[data-menu-toggle], [data-roles-toggle]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  /* One delegated listener set, bound once — survives every re-render. */
  function bind() {
    document.addEventListener("click", function (e) {
      const menuToggle = e.target.closest("[data-menu-toggle], [data-roles-toggle]");
      if (menuToggle) {
        e.preventDefault();
        const panel = menuToggle.parentElement.querySelector(".menu-panel");
        const willOpen = panel.hidden;
        closeAllMenus();
        panel.hidden = !willOpen;
        menuToggle.setAttribute("aria-expanded", String(willOpen));
        return;
      }
      if (e.target.closest("[data-sidebar-toggle]")) { e.preventDefault(); toggleSidebar(true); return; }
      if (e.target.closest("[data-sidebar-close]") || e.target.id === "sidebar-scrim") { toggleSidebar(false); return; }

      if (e.target.closest("[data-login-as]")) {
        App.Auth.loginAs(e.target.closest("[data-login-as]").getAttribute("data-login-as"));
        if (App.UI.toast) App.UI.toast("Switched demo role");
        App.Router.go("#/dashboard");
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
        return;
      }
      if (e.target.closest("#sidebar a[href]")) { toggleSidebar(false); return; }

      closeAllMenus();
    });

    document.addEventListener("submit", function (e) {
      const form = e.target.closest("[data-search]");
      if (!form) return;
      e.preventDefault();
      const q = (form.querySelector("input") || {}).value || "";
      App.Router.go("#/explore" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : ""));
      toggleSidebar(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      closeAllMenus();
      if (sidebarOpen) toggleSidebar(false);
    });
  }

  return { render, markActive, setHeading, closeAllMenus, toggleSidebar, bind };
})();

(function bootstrap() {
  function init() {
    App.Router.register("/notfound", {
      render: function () {
        return '<div class="container">' +
          App.UI.emptyState("Page not found", "The page you were looking for doesn't exist.", "🧭") +
          '<div class="center mt-4"><a class="btn btn-primary" href="#' + (App.State.isAuthed() ? "/dashboard" : "/") + '">Go home</a></div>' +
        "</div>";
      },
      title: "Not found",
    });
    // Legacy links keep working: /home and /admin resolve to the role dashboard.
    App.Router.register("/home", { redirect: "#/dashboard", title: "Home" });
    App.Router.register("/admin", { redirect: "#/dashboard", title: "Admin" });

    App.State.load();
    App.I18N.setLang(App.State.language());
    App.Shell.bind();
    App.Shell.render();
    App.State.subscribe(function () { App.Shell.render(); });
    App.Router.start();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
