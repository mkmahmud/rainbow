/* Activity — log walking/running/cycling/exercise and track steps, distance, time. */
window.App = window.App || {};
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const fmt = App.I18N.fmtNum;
  const icon = App.Icons.get;

  function today() { return App.State.todayISO(); }
  function weightOf(user) { return App.State.latestWeight(user.id) || (user.profile && user.profile.weightKg) || 70; }
  function shortDate(iso) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
  function typeMeta(id) { return (App.DATA.activityTypes || []).find((a) => a.id === id) || { nameEn: id, icon: "activity", met: 4 }; }

  function lastDays(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(App.State.offsetISO(-i));
    return out;
  }

  function render() {
    const user = App.State.currentUser();
    if (!App.Profile.isComplete(user.profile)) {
      return '<div class="container">' + App.UI.emptyState("No profile yet", "Create your health profile to track activity.", "🏃") +
        '<div class="center mt-3"><a class="btn btn-primary" href="#/onboarding">Start setup</a></div></div>';
    }
    App.State.ensureSeedHealthData(user.id);
    const weight = weightOf(user);
    const todays = App.State.activityByDate(user.id, today());
    const steps = todays.reduce((s, e) => s + (e.steps || 0), 0);
    const minutes = todays.reduce((s, e) => s + (e.minutes || 0), 0);
    const burned = todays.reduce((s, e) => s + App.Profile.activityKcal(e, weight), 0);
    const km = App.Profile.stepsToKm(steps);

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(t("nav_activity")) + '</h1><div class="subtitle">' + esc(t("sub_activity")) + "</div></div>" +
        '<button class="btn btn-primary" data-addact>' + icon("plus", 18) + " " + esc(t("btn_add_activity")) + "</button>" +
      "</div>" +

      '<div class="grid cols-4">' +
        stat("🏃", fmt(steps), "Steps today", "goal 10,000", steps >= 10000 ? "green" : "orange") +
        stat("📍", km + " km", "Distance", "≈ " + fmt(App.DATA.stepsPerKm) + " steps/km", "blue") +
        stat("⏱️", fmt(minutes) + " min", "Active time", "today", "green") +
        stat("🔥", fmt(burned) + " kcal", "Burned", "today", "orange") +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>Steps this week</h3>' +
        '<span class="muted small">' + esc(t("lbl_this_week")) + "</span></div>" +
        '<div class="chart-box">' + weekChart(user.id) + "</div></div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        todayCard(todays, weight) +
        logCard(user.id, weight) +
      "</div>" +

      '<div class="row"><a class="btn btn-outline" href="#/calories-burned">' + icon("flame", 18) + " " + esc(t("nav_calories_burned")) + "</a></div>" +
      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function stat(emoji, value, label, sub, tone) {
    return '<div class="card stat"><div class="stat-icon">' + emoji + "</div>" +
      '<div class="stat-value" style="font-size:var(--fs-xl)">' + esc(value) + "</div>" +
      '<div class="stat-label">' + esc(label) + "</div>" +
      (sub ? '<div class="xs mt-2"><span class="badge ' + tone + '">' + esc(sub) + "</span></div>" : "") + "</div>";
  }

  function weekChart(userId) {
    const days = lastDays(7);
    const series = days.map((d) => {
      const steps = App.State.activityByDate(userId, d).reduce((s, e) => s + (e.steps || 0), 0);
      const d2 = new Date(d + "T00:00:00");
      return { value: steps, label: d2.toLocaleDateString(undefined, { weekday: "short" }) };
    });
    return App.Charts.bars(series, { max: Math.max(5000, Math.max.apply(null, series.map((s) => s.value))), height: 220, aria: "Steps this week" });
  }

  function todayCard(todays, weight) {
    const rows = todays.length
      ? todays.map((e) => {
          const meta = typeMeta(e.type);
          const kcal = App.Profile.activityKcal(e, weight);
          const detail = (e.steps ? fmt(e.steps) + " steps · " + App.Profile.stepsToKm(e.steps) + " km · " : "") + fmt(e.minutes || 0) + " min · " + fmt(kcal) + " kcal";
          return '<div class="log-row"><span class="log-ic">' + icon(meta.icon, 17) + "</span>" +
            '<div style="flex:1;min-width:0"><strong>' + esc(meta.nameEn) + '</strong><div class="muted xs">' + esc(detail) + "</div></div>" +
            '<button class="icon-btn" data-delact="' + e.id + '" title="Remove" aria-label="Remove">×</button></div>';
        }).join("")
      : App.UI.emptyState(t("empty_no_activity"), "Add walking, running or any exercise to get started.", "🏃");
    return '<div class="card"><div class="card-title"><h3>' + esc(t("lbl_today")) + "</h3>" +
      '<button class="btn btn-outline btn-sm" data-addact>' + icon("plus", 16) + " " + esc(t("btn_add_activity")) + "</button></div>" +
      '<div class="stack">' + rows + "</div></div>";
  }

  function logCard(userId, weight) {
    const logs = App.State.activityLogs(userId).slice().reverse();
    const groups = {};
    logs.forEach((e) => { (groups[e.date] = groups[e.date] || []).push(e); });
    const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a)).slice(0, 7);
    if (!dates.length) return '<div class="card"><div class="card-title"><h3>Recent activity</h3></div>' + App.UI.emptyState(t("empty_no_activity"), "", "📋") + "</div>";
    const body = dates.map((d) => {
      const entries = groups[d];
      const daySteps = entries.reduce((s, e) => s + (e.steps || 0), 0);
      const dayKcal = entries.reduce((s, e) => s + App.Profile.activityKcal(e, weight), 0);
      return '<div class="log-group"><div class="row between"><strong class="small">' + esc(shortDate(d)) + "</strong>" +
        '<span class="muted xs">' + (daySteps ? fmt(daySteps) + " steps · " : "") + fmt(dayKcal) + " kcal</span></div>" +
        entries.map((e) => {
          const meta = typeMeta(e.type);
          return '<div class="row between" style="padding:6px 0"><span class="small">' + icon(meta.icon, 15) + " " + esc(meta.nameEn) +
            (e.steps ? ' <span class="muted xs">' + fmt(e.steps) + " steps</span>" : "") + "</span>" +
            '<span class="row" style="gap:6px"><span class="muted xs">' + fmt(e.minutes || 0) + ' min</span>' +
            '<button class="icon-btn" data-delact="' + e.id + '" aria-label="Remove">×</button></span></div>';
        }).join("") + "</div>";
    }).join("");
    return '<div class="card"><div class="card-title"><h3>Recent activity</h3></div><div class="stack">' + body + "</div></div>";
  }

  function openAdd(user, presetType) {
    const types = App.DATA.activityTypes || [];
    const weight = weightOf(user);
    const opts = types.map((a) => '<option value="' + a.id + '"' + (a.id === presetType ? " selected" : "") + ">" + esc(a.nameEn) + " · MET " + a.met + "</option>").join("");
    App.UI.modal({
      title: t("btn_add_activity"),
      bodyHtml:
        '<div class="field"><label for="ac-type">Activity</label><select class="select" id="ac-type">' + opts + "</select></div>" +
        '<div class="grid cols-2">' +
          '<div class="field"><label for="ac-min">Duration (minutes)</label><input class="input" id="ac-min" type="number" min="1" value="30" /></div>' +
          '<div class="field"><label for="ac-steps">Steps (walking/running)</label><input class="input" id="ac-steps" type="number" min="0" value="0" /></div>' +
        "</div>" +
        '<div class="field"><label for="ac-date">Date</label><input class="input" id="ac-date" type="date" value="' + today() + '" /></div>' +
        '<div class="notice small" id="ac-est"></div>',
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + '</button><button class="btn btn-primary" data-save>' + esc(t("common_save")) + "</button>",
      onMount: (root, close) => {
        const sel = root.querySelector("#ac-type");
        const min = root.querySelector("#ac-min");
        const steps = root.querySelector("#ac-steps");
        const est = root.querySelector("#ac-est");
        function updateEst() {
          const kcal = App.Profile.activityKcal({ type: sel.value, minutes: parseFloat(min.value) || 0 }, weight);
          const meta = typeMeta(sel.value);
          est.innerHTML = "Estimated burn: <strong>" + fmt(kcal) + " kcal</strong> (" + esc(meta.nameEn) + " · MET " + meta.met + ")";
          steps.parentElement.style.opacity = meta.stepBased ? "1" : "0.5";
        }
        sel.addEventListener("change", updateEst);
        min.addEventListener("input", updateEst);
        updateEst();
        root.querySelector("[data-save]").addEventListener("click", () => {
          const minutes = Math.max(1, parseInt(min.value || "0", 10) || 0);
          const stepCount = Math.max(0, parseInt(steps.value || "0", 10) || 0);
          const date = root.querySelector("#ac-date").value || today();
          App.State.addActivity(user.id, { type: sel.value, minutes: minutes, steps: stepCount, date: date });
          close();
          App.UI.toast("Activity added");
          App.Router.refresh();
        });
      },
    });
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      const add = e.target.closest("[data-addact]");
      if (add) { openAdd(user, add.getAttribute("data-addact") || undefined); return; }
      const del = e.target.closest("[data-delact]");
      if (del) {
        const id = del.getAttribute("data-delact");
        App.State.removeActivity(user.id, id);
        App.UI.toast("Removed");
        App.Router.refresh();
      }
    });
  }

  App.Router.register("/activity", { render: render, mount: mount, auth: true, roles: ["member"], title: "Activity" });
})();
