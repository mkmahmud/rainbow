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

  function pendingReviews() {
    return App.State.allReviews().filter((r) => r.review.status !== "reviewed").length;
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

  /* Grouped, role-aware sidebar navigation. */
  function navGroups() {
    const t = App.I18N.t;
    const role = App.RBAC.role(App.State.currentUser());
    const account = { labelKey: "nav_group_account", items: accountItems() };

    if (role === App.RBAC.ROLES.ADMIN) {
      return [
        { labelKey: "nav_group_menu", items: [
          { route: "#/dashboard", label: t("nav_admin"), icon: "content" },
          { route: "#/explore", label: t("nav_explore"), icon: "search" },
        ] },
        account,
      ];
    }
    if (role === App.RBAC.ROLES.NUTRITIONIST) {
      return [
        { labelKey: "nav_group_menu", items: [
          { route: "#/dashboard", label: t("nav_reviews"), icon: "users", badge: pendingReviews() },
          { route: "#/explore", label: t("nav_explore"), icon: "search" },
        ] },
        account,
      ];
    }
    return [
      { labelKey: "nav_group_menu", items: [
        { route: "#/dashboard", label: t("nav_dashboard"), icon: "dashboard" },
        { route: "#/health", label: t("nav_my_health"), icon: "heart" },
        { route: "#/explore", label: t("nav_explore"), icon: "search" },
        { route: "#/planner", label: t("nav_planner"), icon: "robot" },
        { route: "#/diet", label: t("nav_diet"), icon: "diet" },
      ] },
      { labelKey: "nav_group_activity", items: [
        { route: "#/activity", label: t("nav_activity"), icon: "activity" },
        { route: "#/calories-burned", label: t("nav_calories_burned"), icon: "flame" },
      ] },
      { labelKey: "nav_group_progress", items: [
        { route: "#/progress", label: t("nav_progress"), icon: "chart" },
        { route: "#/goals", label: t("nav_goals"), icon: "target" },
      ] },
      { labelKey: "nav_group_appointments", items: [
        { route: "#/appointments", label: t("nav_appointments"), icon: "calendar" },
        { route: "#/consultation", label: t("nav_consultation"), icon: "users" },
      ] },
      account,
    ];
  }

  function roleOptions() {
    return App.DATA.demoUsers.map((u) => ({ id: u.id, name: u.name, persona: u.persona, role: App.RBAC.role(u) }));
  }

  return { login, loginAs, logout, navGroups, roleOptions };
})();
