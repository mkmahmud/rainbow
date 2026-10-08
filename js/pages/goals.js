/* Goals — set and monitor health/weight goals with progress and pace. */
window.App = window.App || {};
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const fmt = App.I18N.fmtNum;
  const icon = App.Icons.get;

  function clampPct(n) { return Math.max(0, Math.min(100, Math.round(n))); }
  function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;
    if (!App.Profile.isComplete(profile)) {
      return '<div class="container">' + App.UI.emptyState("No profile yet", "Create your health profile to set a goal.", "🎯") +
        '<div class="center mt-3"><a class="btn btn-primary" href="#/onboarding">Start setup</a></div></div>';
    }
    App.State.ensureSeedHealthData(user.id);

    const goal = App.State.getGoal(user.id);
    const current = App.State.latestWeight(user.id) || profile.weightKg;
    const start = goal ? goal.startWeightKg : current;
    const target = goal ? goal.targetWeightKg : current;
    const remaining = Math.round(Math.abs(current - target) * 10) / 10;
    const denom = start - target;
    const pct = denom !== 0
      ? clampPct(((start - current) / denom) * 100)
      : (Math.abs(current - target) < 0.5 ? 100 : 0);

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(t("nav_goals")) + '</h1><div class="subtitle">' + esc(t("sub_goals")) + "</div></div>" +
        '<div class="row"><a class="btn btn-outline" href="#/my-health">' + icon("heart", 18) + " " + esc(t("nav_my_health")) + "</a></div>" +
      "</div>" +

      (goal ? progressCard(goal, current, start, target, remaining, pct) : '<div class="card">' + App.UI.emptyState("No goal set", "Set a target below to start tracking your progress.", "🎯") + "</div>") +

      '<div class="grid cols-2" style="align-items:start">' +
        formCard(goal, current) +
        projectionCard(goal, current, target) +
      "</div>" +

      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function progressCard(goal, current, start, target, remaining, pct) {
    const goalName = App.I18N.name(App.DATA.goals.find((g) => g.id === goal.type) || {}) || goal.type;
    return '<div class="card">' +
      '<div class="card-title"><h3>Current goal</h3><span class="badge green">' + esc(goalName) + "</span></div>" +
      '<div class="goal-stats">' +
        '<div><span class="muted xs">' + esc(t("lbl_starting")) + '</span><strong>' + fmt(start) + " kg</strong></div>" +
        '<div><span class="muted xs">' + esc(t("lbl_current")) + '</span><strong>' + fmt(current) + " kg</strong></div>" +
        '<div><span class="muted xs">' + esc(t("lbl_target")) + '</span><strong>' + fmt(target) + " kg</strong></div>" +
        '<div><span class="muted xs">' + esc(t("lbl_target")) + " date</span><strong>" + esc(App.UI.fmtDate(goal.targetDate)) + "</strong></div>" +
      "</div>" +
      '<div class="goal-bar mt-4"><span style="width:' + pct + '%"></span></div>' +
      '<div class="row between small mt-2"><span class="muted">' + pct + "% " + esc(t("lbl_progress").toLowerCase()) + "</span>" +
        "<strong>" + remaining + " kg remaining</strong></div>" +
    "</div>";
  }

  function formCard(goal, current) {
    const types = App.DATA.goals;
    const type = goal ? goal.type : "maintain";
    const target = goal ? goal.targetWeightKg : current;
    const start = goal ? goal.startWeightKg : current;
    const date = goal ? goal.targetDate : App.State.offsetISO(90);
    return '<div class="card"><div class="card-title"><h3>' + esc(goal ? "Edit goal" : "Set a goal") + "</h3></div>" +
      '<div class="field"><label>Goal</label><div class="option-grid">' +
        types.map((g) => '<button type="button" class="chip' + (g.id === type ? " active" : "") + '" data-goaltype="' + g.id + '">' + esc(App.I18N.name(g)) + "</button>").join("") +
      "</div></div>" +
      '<div class="grid cols-2">' +
        '<div class="field"><label for="gl-start">Start weight (kg)</label><input class="input" id="gl-start" type="number" min="20" max="400" step="0.1" value="' + start + '" /></div>' +
        '<div class="field"><label for="gl-target">Target weight (kg)</label><input class="input" id="gl-target" type="number" min="20" max="400" step="0.1" value="' + target + '" /></div>' +
      "</div>" +
      '<div class="field"><label for="gl-date">Target date</label><input class="input" id="gl-date" type="date" value="' + date + '" /></div>' +
      '<input type="hidden" id="gl-type" value="' + type + '" />' +
      '<div class="row"><button class="btn btn-primary" data-savegoal>' + esc(t("common_save")) + "</button>" +
        '<a class="btn btn-outline" href="#/progress">' + esc("View progress") + "</a></div>" +
    "</div>";
  }

  function projectionCard(goal, current, target) {
    if (!goal) return '<div class="card"><div class="card-title"><h3>Projection</h3></div>' +
      '<p class="muted small">Set a goal to see a projection and a healthy pace.</p></div>';
    const days = Math.max(1, daysBetween(App.State.todayISO(), goal.targetDate));
    const weeks = Math.max(1, Math.round(days / 7));
    const toGo = Math.round((current - target) * 10) / 10;
    const perWeek = Math.round((toGo / weeks) * 100) / 100;
    const dir = perWeek > 0 ? "lose" : perWeek < 0 ? "gain" : "hold";
    let tone = "green", msg = "A safe, sustainable pace.";
    if (Math.abs(perWeek) > 1) { tone = "orange"; msg = "A brisk pace — aim for 0.5–1 kg per week for safety."; }
    if (Math.abs(perWeek) > 1.5) { tone = "red"; msg = "This pace is too aggressive. Consider a later target date."; }
    return '<div class="card"><div class="card-title"><h3>Projection</h3></div>' +
      '<div class="row between small" style="padding:5px 0;border-bottom:1px solid var(--border)"><span class="muted">Weeks remaining</span><strong>' + weeks + "</strong></div>" +
      '<div class="row between small" style="padding:5px 0;border-bottom:1px solid var(--border)"><span class="muted">Weight to ' + dir + "</span><strong>" + fmt(Math.abs(toGo)) + " kg</strong></div>" +
      '<div class="row between small" style="padding:5px 0"><span class="muted">Needed per week</span><strong>' + fmt(Math.abs(perWeek), 2) + " kg</strong></div>" +
      '<div class="notice ' + (tone === "green" ? "" : tone === "orange" ? "warn" : "danger") + ' mt-3 small">' + esc(msg) + "</div>" +
    "</div>";
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      const gt = e.target.closest("[data-goaltype]");
      if (gt) {
        const id = gt.getAttribute("data-goaltype");
        const hidden = main.querySelector("#gl-type");
        if (hidden) hidden.value = id;
        main.querySelectorAll("[data-goaltype]").forEach((b) => b.classList.toggle("active", b === gt));
        return;
      }
      if (e.target.closest("[data-savegoal]")) {
        const type = (main.querySelector("#gl-type") || {}).value || "maintain";
        const start = parseFloat(main.querySelector("#gl-start").value);
        const target = parseFloat(main.querySelector("#gl-target").value);
        const date = main.querySelector("#gl-date").value || App.State.offsetISO(90);
        if (!start || start < 20 || start > 400) { App.UI.toast("Enter a valid start weight (20–400 kg).", "error"); return; }
        if (!target || target < 20 || target > 400) { App.UI.toast("Enter a valid target weight (20–400 kg).", "error"); return; }
        if (date < App.State.todayISO()) { App.UI.toast("Pick a target date in the future.", "error"); return; }
        App.State.setGoal(user.id, { type: type, startWeightKg: Math.round(start * 10) / 10, targetWeightKg: Math.round(target * 10) / 10, targetDate: date, status: "active" });
        App.UI.toast("Goal saved");
        App.Router.refresh();
      }
    });
  }

  App.Router.register("/goals", { render: render, mount: mount, auth: true, roles: ["member"], title: "Goals" });
})();
