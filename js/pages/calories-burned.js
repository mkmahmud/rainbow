/* Calories Burned — MET-based expenditure by activity, with trends and reference. */
window.App = window.App || {};
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const fmt = App.I18N.fmtNum;
  const icon = App.Icons.get;

  function weightOf(user) { return App.State.latestWeight(user.id) || (user.profile && user.profile.weightKg) || 70; }
  function typeMeta(id) { return (App.DATA.activityTypes || []).find((a) => a.id === id) || { nameEn: id, icon: "activity", met: 4 }; }
  function shortDate(iso) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" }); }

  function lastDays(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(App.State.offsetISO(-i));
    return out;
  }
  function entriesSince(userId, days) {
    const from = App.State.offsetISO(-(days - 1));
    return App.State.activityLogs(userId).filter((a) => a.date >= from);
  }
  function sumKcal(entries, weight) { return entries.reduce((s, e) => s + App.Profile.activityKcal(e, weight), 0); }

  function render() {
    const user = App.State.currentUser();
    if (!App.Profile.isComplete(user.profile)) {
      return '<div class="container">' + App.UI.emptyState("No profile yet", "Create your health profile to see calories burned.", "🔥") +
        '<div class="center mt-3"><a class="btn btn-primary" href="#/onboarding">Start setup</a></div></div>';
    }
    App.State.ensureSeedHealthData(user.id);
    const weight = weightOf(user);

    const todayEntries = App.State.activityByDate(user.id, App.State.todayISO());
    const weekEntries = entriesSince(user.id, 7);
    const todayKcal = sumKcal(todayEntries, weight);
    const weekKcal = sumKcal(weekEntries, weight);
    const avgDay = Math.round(weekKcal / 7);
    const todayMin = todayEntries.reduce((s, e) => s + (e.minutes || 0), 0);

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(t("nav_calories_burned")) + '</h1><div class="subtitle">' + esc(t("sub_calories_burned")) + "</div></div>" +
        '<a class="btn btn-outline" href="#/activity">' + icon("activity", 18) + " " + esc(t("nav_activity")) + "</a>" +
      "</div>" +

      '<div class="grid cols-4">' +
        stat("🔥", fmt(todayKcal) + " kcal", t("lbl_today"), fmt(todayMin) + " active min", "orange") +
        stat("📅", fmt(weekKcal) + " kcal", t("lbl_this_week"), fmt(weekEntries.length) + " sessions", "orange") +
        stat("📊", fmt(avgDay) + " kcal", t("lbl_avg"), "over 7 days", "blue") +
        stat("⚖️", weight + " kg", "Body weight", "used for MET", "green") +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>Daily burn</h3><span class="muted small">Last 14 days</span></div>' +
        '<div class="chart-box">' + burnChart(user.id, weight) + "</div></div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        breakdownCard(user.id, weight) +
        referenceCard(weight) +
      "</div>" +

      '<div class="notice small"><strong>' + esc("How this is estimated") + ':</strong> kcal ≈ MET × body weight (kg) × hours. MET values are standard averages and differ by effort.</div>' +
      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function stat(emoji, value, label, sub, tone) {
    return '<div class="card stat"><div class="stat-icon">' + emoji + "</div>" +
      '<div class="stat-value" style="font-size:var(--fs-xl)">' + esc(value) + "</div>" +
      '<div class="stat-label">' + esc(label) + "</div>" +
      (sub ? '<div class="xs mt-2"><span class="badge ' + tone + '">' + esc(sub) + "</span></div>" : "") + "</div>";
  }

  function burnChart(userId, weight) {
    const days = lastDays(14);
    const series = days.map((d) => {
      const kcal = sumKcal(App.State.activityByDate(userId, d), weight);
      return { value: kcal, label: shortDate(d), color: "var(--orange-600)" };
    });
    if (!series.some((s) => s.value > 0)) return '<p class="muted small">No activity logged in this range.</p>';
    return App.Charts.bars(series, { max: Math.max(200, Math.max.apply(null, series.map((s) => s.value))), height: 220, aria: "Daily calories burned" });
  }

  function breakdownCard(userId, weight) {
    const entries = entriesSince(userId, 30);
    const byType = {};
    entries.forEach((e) => {
      const agg = byType[e.type] || (byType[e.type] = { type: e.type, minutes: 0, sessions: 0, kcal: 0 });
      agg.minutes += e.minutes || 0;
      agg.sessions += 1;
      agg.kcal += App.Profile.activityKcal(e, weight);
    });
    const rows = Object.keys(byType).map((k) => byType[k]).sort((a, b) => b.kcal - a.kcal);
    const total = rows.reduce((s, r) => s + r.kcal, 0) || 1;
    if (!rows.length) return '<div class="card"><div class="card-title"><h3>' + esc(t("sec_breakdown")) + "</h3></div>" + App.UI.emptyState(t("empty_no_activity"), "Log an activity to see the breakdown.", "🔥") + "</div>";
    return '<div class="card"><div class="card-title"><h3>' + esc(t("sec_breakdown")) + '</h3><span class="muted small">Last 30 days</span></div>' +
      '<div class="stack">' + rows.map((r) => {
        const meta = typeMeta(r.type);
        const pct = Math.round((r.kcal / total) * 100);
        return '<div><div class="row between small"><span>' + icon(meta.icon, 15) + " " + esc(meta.nameEn) + " <span class=\"muted xs\">· " + r.sessions + "× · " + r.minutes + ' min</span></span>' +
          "<strong>" + fmt(r.kcal) + " kcal</strong></div>" +
          '<div class="bar orange mt-2"><span style="width:' + pct + '%"></span></div></div>';
      }).join("") + "</div>" +
      '<div class="row between small mt-4"><span class="muted">Total (30 days)</span><strong>' + fmt(total) + " kcal</strong></div></div>";
  }

  function referenceCard(weight) {
    const rows = (App.DATA.activityTypes || []).map((a) => {
      const perHour = Math.round(a.met * weight);
      return '<tr><td>' + icon(a.icon, 15) + " " + esc(a.nameEn) + '</td><td class="num">' + a.met + '</td><td class="num">' + fmt(perHour) + " kcal</td></tr>";
    }).join("");
    return '<div class="card"><div class="card-title"><h3>MET reference</h3>' +
      '<span class="muted small">at ' + weight + ' kg</span></div>' +
      '<div class="table-wrap"><table class="table" style="min-width:0"><thead><tr><th>Activity</th><th class="num">MET</th><th class="num">Per hour</th></tr></thead>' +
      "<tbody>" + rows + "</tbody></table></div></div>";
  }

  App.Router.register("/calories-burned", { render: render, auth: true, roles: ["member"], title: "Calories Burned" });
})();
