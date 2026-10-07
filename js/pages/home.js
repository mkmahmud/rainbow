/* Authenticated home / "today" overview. */
(function () {
  const t = App.I18N.t;
  const esc = App.UI.esc;

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    if (!App.Profile.isComplete(profile)) {
      return '<div class="container stack">' +
        '<div class="page-head"><div><h1>' + esc(greet) + ", " + esc(firstName(user.name)) + "</h1>" +
        '<div class="subtitle">Let\'s personalize your experience.</div></div></div>' +
        '<div class="card center">' +
          '<div class="stat-icon" style="margin:0 auto var(--s-3);font-size:26px">📝</div>' +
          "<h3>Complete your health profile</h3>" +
          '<p class="muted mt-2" style="max-width:520px;margin:0 auto">Tell us your age, weight, goals and any conditions so we can tailor food suggestions and safety limits.</p>' +
          '<div class="mt-4"><a class="btn btn-primary btn-lg" href="#/onboarding">Start setup</a></div>' +
        "</div>" +
        disclaimer() +
      "</div>";
    }

    const targets = App.Profile.computeTargets(profile);
    const bmi = App.Profile.bmi(profile);
    const bmiCat = App.Profile.bmiCategory(bmi);
    const todayLogs = App.State.logsByDate(user.id, App.State.todayISO());
    const todayTotals = App.Profile.sumItems(todayLogs);
    const rec = App.Engine.recommend(profile, { limit: 3 });

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(greet) + ", " + esc(firstName(user.name)) + "</h1>" +
        '<div class="subtitle">' + esc(conditionSummary(profile)) + "</div></div>" +
        '<a class="btn btn-accent" href="#/recommendations">' + esc(t("btn_generate")) + "</a>" +
      "</div>" +

      '<div class="grid cols-4">' +
        stat("🎯", App.I18N.fmtNum(targets.energy), "Daily energy target (kcal)") +
        stat("⚖️", App.I18N.fmtNum(bmi, 1) + (bmi ? " · " + bmiCat.label : ""), "Body mass index") +
        stat("🩺", String((profile.conditions || []).length), "Declared conditions") +
        stat(user.premium ? "⭐" : "🆓", user.premium ? "Premium" : "Free", "Subscription tier") +
      "</div>" +

      '<div class="grid cols-2">' +
        '<div class="card">' +
          '<div class="card-title"><h3>Today so far</h3><a class="btn btn-ghost btn-sm" href="#/dashboard">Dashboard</a></div>' +
          bar("Energy", todayTotals.energy, targets.energy, "kcal", "green") +
          bar(t("protein"), todayTotals.protein, targets.protein, "g", "blue") +
          bar(t("carbs"), todayTotals.carbs, targets.carbs, "g", "orange") +
          '<div class="mt-3 small muted">' + todayLogs.length + " items logged today</div>" +
        "</div>" +

        '<div class="card">' +
          '<div class="card-title"><h3>Quick actions</h3></div>' +
          '<div class="grid cols-2">' +
            quick("#/explore", "🔍", "Explore foods") +
            quick("#/recommendations", "🍽️", "Suggestions") +
            quick("#/diet", "📋", "Diet chart") +
            quick("#/dashboard", "📊", "Log intake") +
          "</div>" +
        "</div>" +
      "</div>" +

      '<div class="card">' +
        '<div class="card-title"><h3>Top suggestions for you</h3><a class="btn btn-ghost btn-sm" href="#/recommendations">See all</a></div>' +
        '<div class="grid cols-3">' +
          rec.items.map((it) => suggestCard(it)).join("") +
        "</div>" +
      "</div>" +

      disclaimer() +
    "</div>";
  }

  function firstName(n) { return (n || "").split(" ")[0]; }

  function conditionSummary(profile) {
    const parts = [];
    (profile.conditions || []).forEach((c) => {
      const cond = App.DATA.conditions.find((x) => x.id === c);
      if (cond) parts.push(App.I18N.name(cond));
    });
    if (profile.diet && profile.diet.length) parts.push(profile.diet.join(", "));
    if (profile.budgetSensitive) parts.push("budget-aware");
    return parts.length ? "Personalized for: " + parts.join(" · ") : "Personalized for your goals";
  }

  function stat(icon, value, label) {
    return '<div class="card stat"><div class="stat-icon">' + icon + '</div><div class="stat-value">' + esc(value) + '</div><div class="stat-label">' + esc(label) + "</div></div>";
  }
  function quick(href, icon, label) {
    return '<a class="card card-hover center pad-sm" href="' + href + '" style="text-decoration:none;color:inherit"><div style="font-size:22px">' + icon + '</div><div class="small mt-2">' + esc(label) + "</div></a>";
  }
  function bar(label, value, target, unit, tone) {
    const pct = target ? Math.min((value / target) * 100, 100) : 0;
    return '<div class="mt-3"><div class="row between small"><span>' + esc(label) + '</span><span class="muted">' + App.I18N.fmtNum(value) + " / " + App.I18N.fmtNum(target) + " " + unit + "</span></div>" +
      '<div class="bar ' + tone + ' mt-2"><span style="width:' + pct + '%"></span></div></div>';
  }
  function suggestCard(it) {
    return '<a class="card card-hover pad-sm" href="#/food/' + it.food.id + '" style="text-decoration:none;color:inherit">' +
      '<div class="food-item"><div class="food-thumb">' + it.food.emoji + "</div>" +
      "<div><strong>" + esc(App.I18N.name(it.food)) + '</strong><div class="muted xs">' + App.I18N.fmtNum(it.food.per100g.energy) + " kcal/100 g</div></div>" +
      '<div class="spacer"></div><span class="badge green">' + it.score + "</span></div>" +
      '<p class="muted xs mt-2">' + esc(it.reasons[0]) + "</p></a>";
  }
  function disclaimer() {
    return App.UI.disclaimer("disc_recommendation");
  }

  App.Router.register("/home", { render: render, auth: true, title: "Home" });
})();
