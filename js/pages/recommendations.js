/* Personalized, explainable recommendations. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  const state = { budgetMode: false, plantOnly: false };

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;

    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_recommend")) + "</h1>" +
      '<div class="subtitle">Ranked for your goals, conditions and preferences — with a reason for each pick.</div></div>' +
      '<div class="row">' +
        '<a class="btn btn-outline" href="#/diet">📋 ' + esc("Diet chart") + "</a>" +
        '<button class="btn btn-accent" id="rc-refresh">↻ ' + esc(t("btn_regenerate")) + "</button>" +
      "</div></div>" +

      '<div class="card pad-sm"><div class="row">' +
        toggle("rc-budget", "💰 Budget mode (cheapest first)", state.budgetMode) +
        toggle("rc-plant", "🌱 Plant-based only", state.plantOnly) +
        '<span class="spacer"></span>' +
        '<span class="muted small">' + esc(App.DATA.content.disclaimers.recommendation) + "</span>" +
      "</div></div>" +

      '<div id="rc-results"></div>' +
    "</div>";
  }

  function toggle(id, label, on) {
    return '<button class="chip' + (on ? " active" : "") + '" id="' + id + '">' + esc(label) + "</button>";
  }

  function resultsHtml() {
    const user = App.State.currentUser();
    const profile = user.profile;
    const rec = App.Engine.recommend(profile, { limit: 12, budgetMode: state.budgetMode, plantOnly: state.plantOnly });
    const targets = rec.targets;

    if (!rec.items.length) {
      return App.UI.emptyState("No matches", "Try turning off filters or widening your preferences.", "🍽️");
    }

    return '<div class="grid cols-2" style="align-items:start">' +
      '<div class="stack">' +
        rec.items.slice(0, 8).map((it) => recCard(it, profile)).join("") +
      "</div>" +
      '<div class="stack">' +
        '<div class="card"><div class="card-title"><h3>Today\'s targets</h3></div>' +
          miniTarget(t("kcal"), targets.energy, "kcal") +
          miniTarget(t("protein"), targets.protein, "g") +
          miniTarget(t("carbs"), targets.carbs, "g") +
          miniTarget(t("fat"), targets.fat, "g") +
          (targets.flags.ckd ? '<div class="notice warn mt-3 small">Kidney stage ' + targets.flags.stage + " limits applied: potassium ≤ " + App.I18N.fmtNum(targets.limits.potassium) + " mg, phosphorus ≤ " + App.I18N.fmtNum(targets.limits.phosphorus) + " mg, protein ≤ " + App.I18N.fmtNum(targets.limits.protein) + " g.</div>" : "") +
          (targets.flags.heart ? '<div class="notice warn mt-2 small">Heart-friendly: sodium ≤ ' + App.I18N.fmtNum(targets.limits.sodium) + " mg, saturated fat ≤ " + App.I18N.fmtNum(targets.limits.satFat) + " g.</div>" : "") +
          (targets.flags.diabetes ? '<div class="notice warn mt-2 small">Diabetes-aware: added sugar ≤ ' + App.I18N.fmtNum(targets.limits.sugar) + " g, prefer low glycemic index.</div>" : "") +
        "</div>" +
        '<div class="card"><div class="card-title"><h3>Filtered out</h3><span class="badge grey">' + rec.excluded.length + "</span></div>" +
          (rec.excluded.length
            ? '<div class="stack">' + rec.excluded.slice(0, 8).map((e) =>
                '<div class="row between"><span class="small">' + e.food.emoji + " " + esc(App.I18N.name(e.food)) + '</span><span class="badge red">' + esc(e.reason.length > 28 ? e.reason.slice(0, 26) + "…" : e.reason) + "</span></div>"
              ).join("") + "</div>"
            : '<p class="muted small">Nothing was excluded.</p>') +
        "</div>" +
      "</div>" +
    "</div>";
  }

  function recCard(it, profile) {
    const f = it.food;
    const cost = App.DATA.costTiers.find((c) => c.id === f.costTier);
    const high = it.flags.filter((x) => x.level === "high").length;
    return '<div class="card card-hover">' +
      '<div class="food-item">' +
        '<div class="food-thumb">' + f.emoji + "</div>" +
        '<div style="min-width:0"><a href="#/food/' + f.id + '" style="color:inherit"><strong>' + esc(App.I18N.name(f)) + "</strong></a>" +
        '<div class="muted xs">' + App.I18N.fmtNum(f.per100g.energy) + " kcal · " + App.I18N.fmtNum(f.per100g.protein, 1) + " g protein per 100 g</div></div>" +
        '<div class="spacer"></div>' +
        '<span class="badge ' + (it.score >= 70 ? "green" : it.score >= 55 ? "orange" : "grey") + '">Score ' + it.score + "</span>" +
      "</div>" +
      '<div class="row mt-2" style="gap:6px">' +
        (f.isPlantBased ? '<span class="badge green">🌱</span>' : "") +
        (cost ? '<span class="badge grey">' + esc(App.I18N.name(cost)) + "</span>" : "") +
        (high ? '<span class="badge red">⚠ ' + high + " high flag" + (high > 1 ? "s" : "") + "</span>" : "") +
      "</div>" +
      '<div class="mt-3"><div class="xs muted" style="text-transform:uppercase;letter-spacing:.05em">' + esc(t("detail_why")) + "</div>" +
        "<ul class='small' style='margin:6px 0 0;padding-left:18px'>" + it.reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>" +
      '<div class="row mt-3"><a class="btn btn-outline btn-sm" href="#/food/' + f.id + '">Details</a></div>' +
    "</div>";
  }

  function miniTarget(label, value, unit) {
    return '<div class="row between small" style="padding:4px 0"><span class="muted">' + esc(label) + "</span><strong>" + App.I18N.fmtNum(value) + " " + unit + "</strong></div>";
  }

  function update(main) { main.querySelector("#rc-results").innerHTML = resultsHtml(); }

  function mount(params, query, main) {
    update(main);
    main.addEventListener("click", (e) => {
      if (e.target.id === "rc-budget") { state.budgetMode = !state.budgetMode; e.target.classList.toggle("active", state.budgetMode); update(main); }
      if (e.target.id === "rc-plant") { state.plantOnly = !state.plantOnly; e.target.classList.toggle("active", state.plantOnly); update(main); }
      if (e.target.id === "rc-refresh") { update(main); App.UI.toast("Suggestions regenerated"); }
    });
  }

  App.Router.register("/recommendations", { render: render, mount: mount, auth: true, roles: ["member"], requiresProfile: true, title: "Recommendations" });
})();
