/* Nutritionist Consultation — browse nutritionist profiles, specialties and availability. */
window.App = window.App || {};
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const fmt = App.I18N.fmtNum;
  const icon = App.Icons.get;

  function userConditions() {
    const user = App.State.currentUser();
    return (user.profile && user.profile.conditions) || [];
  }

  function render() {
    const list = (App.DATA.nutritionists || []).slice().sort((a, b) => b.rating - a.rating);
    const conds = userConditions();
    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_consultation")) + '</h1>' +
        '<div class="subtitle">' + esc(t("sub_consultation")) + "</div></div>" +
        '<a class="btn btn-primary" href="#/appointments">' + icon("calendar", 18) + " " + esc(t("nav_appointments")) + "</a></div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        list.map((n) => profileCard(n, conds)).join("") +
      "</div>" +

      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function profileCard(n, conds) {
    const matches = conds.filter((c) => n.specialties.indexOf(c) >= 0);
    return '<div class="card">' +
      '<div class="row" style="gap:var(--s-4);align-items:flex-start">' +
        '<div class="appt-avatar" style="width:56px;height:56px;font-size:28px">' + n.emoji + "</div>" +
        "<div style=\"flex:1;min-width:0\"><div class=\"row between\"><div><strong>" + esc(n.nameEn) + "</strong>" +
          (matches.length ? ' <span class="badge green">Recommended</span>' : "") +
          '<div class="muted xs">' + esc(n.qualification) + "</div></div>" +
          '<div class="center"><strong>⭐ ' + fmt(n.rating, 1) + '</strong><div class="muted xs">' + n.experienceYears + " yrs</div></div></div>" +
      "</div></div>" +

      '<p class="muted small mt-3">' + esc(App.I18N.L(n, "bio")) + "</p>" +

      '<div class="row mt-3" style="gap:6px">' +
        n.specialties.map((s) => '<span class="badge grey">' + esc(s.replace("-", " ")) + "</span>").join(" ") +
      "</div>" +

      '<div class="overview-list mt-3">' +
        '<div class="overview-row"><span class="k">' + icon("pin", 15) + " Location</span><strong>" + esc(n.location) + "</strong></div>" +
        '<div class="overview-row"><span class="k">' + icon("clock", 15) + " Days</span><strong>" + esc(n.availability.days.join(", ")) + "</strong></div>" +
        '<div class="overview-row"><span class="k">' + icon("wallet", 15) + " Fee</span><strong>৳ " + fmt(n.feeBdt) + "</strong></div>" +
      "</div>" +

      '<div class="row between mt-4"><span class="muted xs">' + esc(n.availability.slots.length) + " slots available</span>" +
        '<a class="btn btn-outline btn-sm" href="#/appointments">' + esc(t("btn_book_appointment")) + "</a></div>" +
    "</div>";
  }

  App.Router.register("/consultation", { render: render, auth: true, roles: ["member"], title: "Nutritionist Consultation" });
})();
