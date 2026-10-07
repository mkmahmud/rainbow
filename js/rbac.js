/* Role-based access control: the single source of truth for roles,
   capabilities and role-aware destinations. */
window.App = window.App || {};

App.RBAC = (function () {
  const ROLES = { MEMBER: "member", NUTRITIONIST: "nutritionist", ADMIN: "admin" };

  /* Capability -> roles allowed to use it. Named permissions, not route names. */
  const CAPABILITIES = {
    "foods.browse": ["member", "nutritionist", "admin"],
    recommendations: ["member"],
    dietChart: ["member"],
    bookmarks: ["member"],
    premium: ["member"],
    "review.respond": ["nutritionist", "admin"],
    "content.manage": ["admin"],
    "feedback.submit": ["member", "nutritionist", "admin"],
  };

  function role(user) {
    const r = user && user.role;
    return r === ROLES.ADMIN || r === ROLES.NUTRITIONIST ? r : ROLES.MEMBER;
  }

  function hasRole(user, roles) {
    const list = Array.isArray(roles) ? roles : [roles];
    return list.indexOf(role(user)) >= 0;
  }

  function can(user, capability) {
    const allowed = CAPABILITIES[capability];
    return !!allowed && allowed.indexOf(role(user)) >= 0;
  }

  function isStaff(user) {
    return hasRole(user, [ROLES.NUTRITIONIST, ROLES.ADMIN]);
  }

  function homeFor() {
    return "#/dashboard";
  }

  function label(r) {
    return App.I18N.t("role_" + (r || ROLES.MEMBER));
  }

  return { ROLES, CAPABILITIES, role, hasRole, can, isStaff, homeFor, label };
})();
