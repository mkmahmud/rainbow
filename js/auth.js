/* Mock authentication, demo role switching and route guards. */
window.App = window.App || {};

App.Auth = (function () {
  function login(email, password) {
    const res = App.State.authenticate(email, password);
    if (res.ok) {
      App.State.setSession(res.user.id);
      if (res.user.profile && res.user.profile.language) App.State.setLanguage(res.user.profile.language);
      App.State.emit();
    }
    return res;
  }

  function loginAs(userId) {
    const user = App.State.userById(userId);
    if (!user) return { ok: false };
    App.State.setSession(userId);
    if (user.profile && user.profile.language) App.State.setLanguage(user.profile.language);
    App.State.emit();
    return { ok: true, user: user };
  }

  function logout() {
    App.State.setSession(null);
    App.State.emit();
  }

  function isAdmin() {
    const u = App.State.currentUser();
    return !!(u && u.role === "admin");
  }

  function navItems() {
    const u = App.State.currentUser();
    const t = App.I18N.t;
    const items = [
      { route: "#/home", label: t("nav_home"), icon: "🏠" },
      { route: "#/explore", label: t("nav_explore"), icon: "🔍" },
      { route: "#/recommendations", label: t("nav_recommend"), icon: "🍽️" },
      { route: "#/diet", label: t("nav_diet"), icon: "📋" },
      { route: "#/dashboard", label: t("nav_dashboard"), icon: "📊" },
      { route: "#/premium", label: t("nav_premium"), icon: "⭐" },
    ];
    if (u && u.role === "admin") items.push({ route: "#/admin", label: t("nav_admin"), icon: "🛠️" });
    return items;
  }

  function roleOptions() {
    return App.DATA.demoUsers.map((u) => ({ id: u.id, name: u.name, persona: u.persona }));
  }

  return { login, loginAs, logout, isAdmin, navItems, roleOptions };
})();
