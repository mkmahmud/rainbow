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

  function navItems() {
    const t = App.I18N.t;
    const role = App.RBAC.role(App.State.currentUser());
    if (role === App.RBAC.ROLES.ADMIN) {
      return [
        { route: "#/dashboard", label: t("nav_admin"), icon: "content" },
        { route: "#/explore", label: t("nav_explore"), icon: "search" },
      ];
    }
    if (role === App.RBAC.ROLES.NUTRITIONIST) {
      return [
        { route: "#/dashboard", label: t("nav_reviews"), icon: "users" },
        { route: "#/explore", label: t("nav_explore"), icon: "search" },
      ];
    }
    return [
      { route: "#/dashboard", label: t("nav_dashboard"), icon: "dashboard" },
      { route: "#/explore", label: t("nav_explore"), icon: "search" },
      { route: "#/recommendations", label: t("nav_recommend"), icon: "recommend" },
      { route: "#/diet", label: t("nav_diet"), icon: "diet" },
    ];
  }

  function accountItems() {
    const t = App.I18N.t;
    const user = App.State.currentUser();
    const items = [];
    if (App.RBAC.hasRole(user, "member")) items.push({ route: "#/profile", label: t("nav_profile"), icon: "profile" });
    items.push({ route: "#/settings", label: t("nav_settings"), icon: "settings" });
    items.push({ route: "#/help", label: t("nav_help"), icon: "help" });
    return items;
  }

  function roleOptions() {
    return App.DATA.demoUsers.map((u) => ({ id: u.id, name: u.name, persona: u.persona, role: App.RBAC.role(u) }));
  }

  return { login, loginAs, logout, navItems, accountItems, roleOptions };
})();
