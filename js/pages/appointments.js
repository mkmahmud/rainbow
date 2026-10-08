/* Appointments — find a nutritionist, pick a slot, book, and review history. */
window.App = window.App || {};
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const fmt = App.I18N.fmtNum;
  const icon = App.Icons.get;

  let tab = "find";
  let filter = "all";

  function nutritionists() { return App.DATA.nutritionists || []; }
  function nutById(id) { return nutritionists().find((n) => n.id === id) || null; }
  function userConditions() {
    const user = App.State.currentUser();
    return (user.profile && user.profile.conditions) || [];
  }
  function isForUser(nut) {
    return userConditions().some((c) => nut.specialties.indexOf(c) >= 0);
  }

  /* Next dates (ISO) matching the nutritionist's available weekdays. */
  function availableDates(nut, count) {
    const out = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    let guard = 0;
    while (out.length < (count || 6) && guard < 60) {
      if (nut.availability.days.indexOf(dayNames[d.getDay()]) >= 0) out.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
      guard++;
    }
    return out;
  }

  function render() {
    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_appointments")) + '</h1>' +
        '<div class="subtitle">' + esc(t("sub_appointments")) + "</div></div>" +
        '<a class="btn btn-outline" href="#/consultation">' + icon("users", 18) + " " + esc(t("nav_consultation")) + "</a></div>" +
      tabs() +
      (tab === "find" ? findView() : mineView()) +
      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function tabs() {
    const up = App.State.upcomingAppointment(App.State.currentUser().id);
    return '<div class="tabs">' +
      '<button data-tab="find"' + (tab === "find" ? ' class="active"' : "") + ">" + esc(t("sec_directory")) + "</button>" +
      '<button data-tab="mine"' + (tab === "mine" ? ' class="active"' : "") + ">" + esc("My appointments") + (up ? ' <span class="count">1</span>' : "") + "</button>" +
    "</div>";
  }

  function findView() {
    const specs = ["all", "general", "diabetes", "heart", "ckd", "weight-loss", "weight-gain"];
    const chips = specs.map((s) => {
      const label = s === "all" ? "All" : s.replace("-", " ");
      return '<button class="chip' + (filter === s ? " active" : "") + '" data-spec="' + s + '">' + esc(label.charAt(0).toUpperCase() + label.slice(1)) + "</button>";
    }).join("");
    const list = nutritionists()
      .filter((n) => filter === "all" || n.specialties.indexOf(filter) >= 0)
      .sort((a, b) => (isForUser(b) ? 1 : 0) - (isForUser(a) ? 1 : 0) || b.rating - a.rating);

    return '<div class="row">' + chips + "</div>" +
      (list.length
        ? '<div class="stack">' + list.map((n) => card(n)).join("") + "</div>"
        : App.UI.emptyState("No nutritionists", "Try a different specialty filter.", "🩺"));
  }

  function card(n) {
    const specBadges = n.specialties.map((s) => '<span class="badge grey">' + esc(s.replace("-", " ")) + "</span>").join(" ");
    return '<div class="card"><div class="row" style="gap:var(--s-4);align-items:flex-start">' +
      '<div class="appt-avatar" style="width:56px;height:56px;font-size:28px">' + n.emoji + "</div>" +
      '<div style="flex:1;min-width:0">' +
        '<div class="row between"><div><strong>' + esc(n.nameEn) + "</strong>" +
          (isForUser(n) ? ' <span class="badge green">For your condition</span>' : "") +
          '<div class="muted xs">' + esc(n.qualification) + " · " + esc(n.experienceYears) + " yrs</div></div>" +
          '<div class="center"><strong>⭐ ' + fmt(n.rating, 1) + '</strong><div class="muted xs">৳ ' + fmt(n.feeBdt) + "</div></div></div>" +
        '<div class="muted small mt-2">' + esc(App.I18N.L(n, "bio")) + "</div>" +
        '<div class="row mt-2" style="gap:6px">' + specBadges + "</div>" +
        '<div class="row between mt-3"><span class="muted xs">' + icon("pin", 14) + " " + esc(n.location) + " · " + esc(n.availability.days.join(", ")) + "</span>" +
          '<button class="btn btn-primary btn-sm" data-book="' + n.id + '">' + esc(t("btn_book_appointment")) + "</button></div>" +
      "</div>" +
    "</div></div>";
  }

  function mineView() {
    const user = App.State.currentUser();
    const all = App.State.appointments(user.id);
    const upcoming = all.filter((a) => a.status === "upcoming").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const history = all.filter((a) => a.status !== "upcoming").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    return '<div class="stack">' +
      '<div class="card"><div class="card-title"><h3>' + esc(t("sec_upcoming")) + "</h3></div>" +
        (upcoming.length ? '<div class="stack">' + upcoming.map((a) => apptRow(a, true)).join("") + "</div>"
          : App.UI.emptyState(t("empty_no_appointments"), "Book a consultation from the directory.", "📅")) +
      "</div>" +
      '<div class="card"><div class="card-title"><h3>' + esc(t("sec_history")) + "</h3></div>" +
        (history.length ? '<div class="stack">' + history.map((a) => apptRow(a, false)).join("") + "</div>"
          : '<p class="muted small">No past appointments.</p>') +
      "</div>" +
    "</div>";
  }

  function apptRow(a, canCancel) {
    const n = nutById(a.nutritionistId);
    const badge = a.status === "upcoming" ? "green" : a.status === "cancelled" ? "red" : "grey";
    return '<div class="appt-card" style="border:1px solid var(--border);border-radius:12px;padding:12px">' +
      '<span class="appt-avatar">' + (n ? n.emoji : "🩺") + "</span>" +
      '<div style="flex:1;min-width:0"><div class="appt-when">' + esc(n ? App.I18N.name(n) : "Nutritionist") + "</div>" +
        '<div class="appt-meta">' + icon(a.type === "video" ? "video" : "pin", 13) + " " + esc(a.type || "video") +
          " · " + esc(App.UI.fmtDate(a.date)) + " · " + esc(a.time) + "</div>" +
        (a.notes ? '<div class="muted xs mt-2">“' + esc(a.notes) + "”</div>" : "") +
      "</div>" +
      '<div class="row" style="gap:8px"><span class="badge ' + badge + '">' + esc(a.status) + "</span>" +
        (canCancel ? '<button class="btn btn-outline btn-sm" data-cancel="' + a.id + '">' + esc("Cancel") + "</button>" : "") +
      "</div></div>";
  }

  function openBook(nut) {
    const user = App.State.currentUser();
    const dates = availableDates(nut, 6);
    const dateOpts = dates.map((d) => '<option value="' + d + '">' + esc(new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })) + "</option>").join("");
    const slotOpts = nut.availability.slots.map((s) => "<option>" + esc(s) + "</option>").join("");
    App.UI.modal({
      title: t("btn_book_appointment"),
      bodyHtml:
        '<div class="row" style="gap:12px;align-items:center"><span class="appt-avatar">' + nut.emoji + "</span>" +
          "<div><strong>" + esc(nut.nameEn) + '</strong><div class="muted xs">' + esc(nut.qualification) + " · ৳ " + fmt(nut.feeBdt) + "</div></div></div>" +
        '<div class="grid cols-2 mt-4">' +
          '<div class="field"><label for="ap-date">Date</label><select class="select" id="ap-date">' + dateOpts + "</select></div>" +
          '<div class="field"><label for="ap-time">Time</label><select class="select" id="ap-time">' + slotOpts + "</select></div>" +
        "</div>" +
        '<div class="field"><label for="ap-type">Type</label><select class="select" id="ap-type"><option value="video">Video consultation</option><option value="in-person">In person</option></select></div>' +
        '<div class="field"><label for="ap-notes">Notes for the nutritionist (optional)</label><textarea class="textarea" id="ap-notes" placeholder="e.g. I want help controlling my blood sugar…"></textarea></div>',
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + "</button>" +
        '<button class="btn btn-primary" data-confirm>' + esc(t("common_save")) + "</button>",
      onMount: (root, close) => {
        root.querySelector("[data-confirm]").addEventListener("click", () => {
          const date = root.querySelector("#ap-date").value;
          const time = root.querySelector("#ap-time").value;
          if (!date || !time) { App.UI.toast("Pick a date and time.", "error"); return; }
          App.State.bookAppointment(user.id, {
            nutritionistId: nut.id, date: date, time: time,
            type: root.querySelector("#ap-type").value,
            notes: (root.querySelector("#ap-notes").value || "").trim(),
          });
          close();
          tab = "mine";
          App.UI.toast("Appointment booked");
          App.Router.refresh();
        });
      },
    });
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      const tb = e.target.closest("[data-tab]");
      if (tb) { tab = tb.getAttribute("data-tab"); App.Router.refresh(); return; }
      const spec = e.target.closest("[data-spec]");
      if (spec) { filter = spec.getAttribute("data-spec"); App.Router.refresh(); return; }
      const book = e.target.closest("[data-book]");
      if (book) { const n = nutById(book.getAttribute("data-book")); if (n) openBook(n); return; }
      const cancel = e.target.closest("[data-cancel]");
      if (cancel) {
        const id = cancel.getAttribute("data-cancel");
        App.UI.confirm("Cancel this appointment?", { danger: true, okText: "Cancel it" }).then((ok) => {
          if (ok) { App.State.cancelAppointment(user.id, id); App.UI.toast("Appointment cancelled"); App.Router.refresh(); }
        });
      }
    });
  }

  App.Router.register("/appointments", { render: render, mount: mount, auth: true, roles: ["member"], title: "Appointments" });
})();
