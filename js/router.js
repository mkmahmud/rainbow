/* Hash router with auth/admin guards. Pages register themselves. */
window.App = window.App || {};

App.Router = (function () {
  const routes = [];
  let currentPath = "";
  let currentTitle = "";

  function register(path, config) {
    routes.push(Object.assign({ path: normalize(path) }, config));
  }

  function normalize(p) {
    if (!p) return "/";
    p = p.replace(/^#/, "");
    if (p[0] !== "/") p = "/" + p;
    return p.replace(/\/+$/, "") || "/";
  }

  function parse(hash) {
    const raw = (hash || location.hash || "").replace(/^#/, "");
    const [pathPart, query] = raw.split("?");
    const path = normalize(pathPart);
    const queryObj = {};
    (query || "").split("&").forEach((pair) => {
      if (!pair) return;
      const [k, v] = pair.split("=");
      queryObj[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
    return { path: path, query: queryObj };
  }

  function match(path) {
    const segs = path.split("/").filter(Boolean);
    for (const r of routes) {
      const rsegs = r.path.split("/").filter(Boolean);
      if (rsegs.length !== segs.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < rsegs.length; i++) {
        if (rsegs[i][0] === ":") params[rsegs[i].slice(1)] = decodeURIComponent(segs[i]);
        else if (rsegs[i] !== segs[i]) { ok = false; break; }
      }
      if (ok) return { route: r, params: params };
    }
    return null;
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function render() {
    const { path, query } = parse();
    currentPath = path;
    let resolved = match(path);

    if (!resolved) {
      resolved = match("/notfound");
    }

    const { route, params } = resolved;
    const authed = App.State.isAuthed();
    const user = App.State.currentUser();

    // Legacy/alias routes hop straight to their destination.
    if (route.redirect) return go(route.redirect);

    if (route.guestOnly && authed) return go(App.RBAC.homeFor());
    if (route.auth && !authed) return go("#/login");
    if (route.roles && !App.RBAC.hasRole(user, route.roles)) {
      App.UI.toast(App.I18N.t("access_denied"), "warn");
      return go(App.RBAC.homeFor());
    }
    if (route.can && !App.RBAC.can(user, route.can)) {
      App.UI.toast(App.I18N.t("access_denied"), "warn");
      return go(App.RBAC.homeFor());
    }
    if (route.requiresProfile) {
      const u = App.State.currentUser();
      if (!u || !App.Profile.isComplete(u.profile)) {
        App.UI.toast("Finish your profile to see personalized results.", "warn");
        return go("#/onboarding");
      }
    }

    // Replace #main with a fresh node so page-level listeners from the previous
    // route are discarded instead of accumulating across navigations.
    const oldMain = document.getElementById("main");
    const main = document.createElement("main");
    main.id = "main";
    main.className = "app-main";
    main.setAttribute("tabindex", "-1");
    oldMain.replaceWith(main);

    main.innerHTML = route.render ? route.render(params, query) : "";
    if (route.mount) route.mount(params, query, main);
    currentTitle = route.title || "";
    App.Shell.setHeading(path, currentTitle);
    App.Shell.markActive(path);
    App.UI.scrollTop();
    document.title = (route.title ? route.title + " · " : "") + "Rainbow Food List";
  }

  function start() {
    window.addEventListener("hashchange", render);
    if (!location.hash) location.hash = App.State.isAuthed() ? "#/dashboard" : "#/";
    render();
  }

  function refresh() { render(); }
  function path() { return currentPath; }
  function title() { return currentTitle; }

  return { register, go, start, refresh, path, title, normalize };
})();
