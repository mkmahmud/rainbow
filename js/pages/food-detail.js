/* Food detail — full composition, condition flags, alternatives, log/bookmark. */
(function () {
  const t = App.I18N.t;
  const esc = App.UI.esc;
  let grams = null;

  function catName(id) {
    const c = App.DATA.categories.find((x) => x.id === id);
    return c ? App.I18N.name(c) : id;
  }
  function pv(value, g) { return value === null || value === undefined ? null : value * (g / 100); }

  function nutrientTable(food, g) {
    const rows = [
      ["energy", "kcal", pv(food.per100g.energy, g)],
      [t("protein"), "g", pv(food.per100g.protein, g)],
      [t("carbs"), "g", pv(food.per100g.carbs, g)],
      [t("fat"), "g", pv(food.per100g.fat, g)],
      [t("fiber"), "g", pv(food.per100g.fiber, g)],
      [t("sodium"), "mg", pv(food.micros.sodium, g)],
      [t("potassium"), "mg", pv(food.micros.potassium, g)],
      [t("phosphorus"), "mg", pv(food.micros.phosphorus, g)],
      [t("satFat"), "g", pv(food.micros.satFat, g)],
      [t("sugar"), "g", pv(food.micros.sugar, g)],
      [t("glycemic"), "", food.micros.glycemic],
    ];
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Nutrient</th><th class="num">Per ' + g + " g</th><th class=\"num\">Per 100 g</th></tr></thead><tbody>" +
      rows.map((r) => {
        const per100 = r[0] === "energy" ? food.per100g.energy : (r[0] === t("protein") || r[0] === t("carbs") || r[0] === t("fat") || r[0] === t("fiber") ? food.per100g[keyOf(r[0])] : (r[0] === t("glycemic") ? food.micros.glycemic : food.micros[keyOf(r[0])]));
        return "<tr><td>" + esc(r[0]) + (r[1] ? ' <span class="muted xs">(' + r[1] + ")</span>" : "") + '</td><td class="num">' +
          (r[2] === null || r[2] === undefined ? "—" : App.I18N.fmtNum(r[2], 1)) + '</td><td class="num muted">' +
          (per100 === null || per100 === undefined ? "—" : App.I18N.fmtNum(per100, 1)) + "</td></tr>";
      }).join("") +
    "</tbody></table></div>";
  }
  function keyOf(label) {
    const map = {};
    map[t("protein")] = "protein"; map[t("carbs")] = "carbs"; map[t("fat")] = "fat"; map[t("fiber")] = "fiber";
    map[t("sodium")] = "sodium"; map[t("potassium")] = "potassium"; map[t("phosphorus")] = "phosphorus";
    map[t("satFat")] = "satFat"; map[t("sugar")] = "sugar";
    return map[label] || label;
  }

  function flagsHtml(food, profile) {
    if (!profile) return '<p class="muted small">Sign in and complete your profile to see how this food relates to your health conditions.</p>';
    const flags = App.Engine.flags(food, profile);
    const excluded = App.Engine.exclusion(food, profile);
    if (excluded) {
      return '<div class="notice danger"><strong>Filtered out for you:</strong> ' + esc(excluded) + "</div>";
    }
    if (!flags.length) return '<div class="notice"><strong>Fits your profile.</strong> No condition-related flags for your declared conditions.</div>';
    return '<div class="stack">' + flags.map((f) => {
      const meta = App.DATA.rules.foodThresholds[f.nutrient];
      const label = meta ? App.I18N.L(meta, "label") : f.nutrient;
      const cls = f.level === "high" ? "danger" : "warn";
      return '<div class="notice ' + cls + '"><strong>' + esc(label) +
        " · " + (f.level === "high" ? "High" : "Moderate") + "</strong> — " + App.I18N.fmtNum(f.value, 1) +
        (meta && meta.unit ? " " + meta.unit : "") + " per 100 g. " +
        (f.level === "high" ? "Limit or avoid this if you have the related condition." : "Watch your total intake.") + "</div>";
    }).join("") + "</div>";
  }

  function priceHtml(food) {
    const price = App.State.latestPrice(food.id);
    if (price) {
      return '<span class="badge grey">৳ ' + App.I18N.fmtNum(price.priceMin) + "–" + App.I18N.fmtNum(price.priceMax) + " / " + esc(price.unit) + "</span>";
    }
    return '<span class="badge grey">≈ ৳ ' + App.I18N.fmtNum(Math.round(App.State.pricePer100g(food))) + " / 100 g (est.)</span>";
  }

  function priceCard(food) {
    const price = App.State.latestPrice(food.id);
    if (!price) {
      return '<div class="card"><div class="card-title"><h3>Market price</h3></div>' +
        '<p class="muted small">No market data yet. Estimated ৳ ' + App.I18N.fmtNum(Math.round(App.State.pricePer100g(food))) + " per 100 g.</p></div>";
    }
    const per100 = App.State.pricePer100g(food);
    return '<div class="card"><div class="card-title"><h3>Market price</h3><span class="badge grey">' + esc(price.source || "market") + "</span></div>" +
      '<div class="market-price">৳ ' + App.I18N.fmtNum(price.priceMin) + " – " + App.I18N.fmtNum(price.priceMax) + " <small class=\"muted\">/ " + esc(price.unit) + "</small></div>" +
      '<div class="market-meta mt-2">' + esc(price.location) + " · Updated " + esc(App.UI.fmtDate(price.date)) + "</div>" +
      '<div class="muted small mt-3">≈ ৳ ' + App.I18N.fmtNum(Math.round(per100)) + " per 100 g · a " + food.portionLabel + " costs about ৳ " + App.I18N.fmtNum(Math.round((per100 * food.portionGrams) / 100)) + "</div></div>";
  }

  function notesHtml(food) {
    const notes = App.DATA.foodNotesFor(food);
    const list = (items, cls) => items.length
      ? "<ul class='small' style='margin:6px 0 0;padding-left:18px'>" + items.map((x) => '<li class="' + cls + '">' + esc(x) + "</li>").join("") + "</ul>"
      : '<p class="muted small">—</p>';
    return '<div class="grid cols-2" style="align-items:start">' +
      '<div class="card"><div class="card-title"><h3>Benefits</h3></div>' + list(notes.benefits, "") + "</div>" +
      '<div class="card"><div class="card-title"><h3>Considerations</h3></div>' + list(notes.considerations, "") + "</div>" +
    "</div>";
  }

  function alternativesHtml(food, profile) {
    const alt = App.Engine.alternatives(food.id, profile);
    if (!alt.length) return '<p class="muted small">No alternatives found.</p>';
    return '<div class="grid auto-220">' + alt.map((a) =>
      '<a class="card card-hover pad-sm" href="#/food/' + a.food.id + '" style="text-decoration:none;color:inherit">' +
        '<div class="food-item"><div class="food-thumb">' + a.food.emoji + "</div>" +
        "<div><strong>" + esc(App.I18N.name(a.food)) + '</strong><div class="muted xs">' + App.I18N.fmtNum(a.food.per100g.energy) + " kcal/100 g</div></div></div>" +
        '<p class="muted xs mt-2">' + esc(a.why) + "</p>" +
      "</a>"
    ).join("") + "</div>";
  }

  function render(params) {
    const food = App.State.foodById(params.id);
    if (!food) return App.UI.emptyState("Food not found", "This item may have been retired.", "🤔");
    const user = App.State.currentUser();
    const profile = user && user.profile;
    const g = grams || food.portionGrams;
    const marked = user ? App.State.isBookmarked(user.id, food.id) : false;
    const cost = App.DATA.costTiers.find((c) => c.id === food.costTier);

    return '<div class="container stack">' +
      '<div><a class="btn btn-ghost btn-sm" href="#/explore">← Back to foods</a></div>' +
      '<div class="page-head">' +
        '<div class="row">' +
          '<div class="food-thumb" style="width:64px;height:64px;font-size:32px">' + food.emoji + "</div>" +
          "<div><h1>" + esc(App.I18N.name(food)) + "</h1>" +
          '<div class="subtitle">' + esc(catName(food.category)) + " · " + esc(food.portionLabel) + " (" + food.portionGrams + " g)</div></div>" +
        "</div>" +
        '<div class="row">' +
          (user ? '<button class="btn ' + (marked ? "btn-secondary" : "btn-outline") + '" data-bm>' + (marked ? "★ " + esc(t("btn_bookmarked")) : "☆ " + esc(t("btn_bookmark"))) + "</button>" : "") +
          (user ? '<button class="btn btn-accent" data-log>＋ ' + esc(t("btn_addLog")) + "</button>" : '<a class="btn btn-primary" href="#/login">Sign in to log</a>') +
        "</div>" +
      "</div>" +

      '<div class="row" style="gap:6px">' +
        (food.isPlantBased ? '<span class="badge green">🌱 Plant-based</span>' : '<span class="badge orange">Animal product</span>') +
        (cost ? '<span class="badge grey">' + esc(App.I18N.name(cost)) + "</span>" : "") +
        priceHtml(food) +
        '<span class="badge">Source: ' + esc(food.source || "FCTB") + "</span>" +
      "</div>" +

      notesHtml(food) +

      '<div class="grid cols-2">' +
        '<div class="card">' +
          '<div class="card-title"><h3>' + esc(t("detail_nutrition")) + "</h3>" +
            '<div class="row" style="gap:6px"><label class="xs muted">Portion (g)</label>' +
            '<input class="input" id="fd-grams" type="number" min="1" value="' + g + '" style="width:90px;padding:6px 8px" /></div></div>' +
          '<div id="fd-table">' + nutrientTable(food, g) + "</div>" +
        "</div>" +
        '<div class="card">' +
          '<div class="card-title"><h3>' + esc(t("detail_conditionFlags")) + "</h3></div>" +
          '<div id="fd-flags">' + flagsHtml(food, profile) + "</div>" +
        "</div>" +
      "</div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        '<div class="card">' +
          '<div class="card-title"><h3>' + esc(t("detail_alternatives")) + '</h3><span class="muted small">' + esc("Similar nutrition, plant-based or cheaper options") + "</span></div>" +
          alternativesHtml(food, profile) +
        "</div>" +
        priceCard(food) +
      "</div>" +

      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function mount(params, query, main) {
    const food = App.State.foodById(params.id);
    if (!food) return;
    const user = App.State.currentUser();
    if (user) App.State.addRecent(user.id, food.id);

    const input = main.querySelector("#fd-grams");
    if (input) input.addEventListener("input", () => {
      const g = Math.max(1, parseInt(input.value || "0", 10) || 1);
      const table = main.querySelector("#fd-table");
      if (table) table.innerHTML = nutrientTable(food, g);
    });

    const bm = main.querySelector("[data-bm]");
    if (bm) bm.addEventListener("click", () => {
      if (!user) return;
      const now = App.State.toggleBookmark(user.id, food.id);
      bm.className = "btn " + (now ? "btn-secondary" : "btn-outline");
      bm.textContent = now ? "★ " + t("btn_bookmarked") : "☆ " + t("btn_bookmark");
      App.UI.toast(now ? "Bookmarked" : "Removed");
    });

    const logBtn = main.querySelector("[data-log]");
    if (logBtn) logBtn.addEventListener("click", () => openLogModal(food, user));
  }

  function openLogModal(food, user) {
    const slots = App.DATA.mealSlots;
    App.UI.modal({
      title: "Log " + App.I18N.name(food),
      bodyHtml:
        '<div class="field"><label>Meal</label><select class="select" id="log-slot">' +
          slots.map((s) => '<option value="' + s.id + '">' + s.icon + " " + esc(App.I18N.name(s)) + "</option>").join("") +
        "</select></div>" +
        '<div class="field"><label>Portion (g)</label><input class="input" id="log-grams" type="number" min="1" value="' + food.portionGrams + '" /></div>',
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + '</button><button class="btn btn-primary" data-save>Log it</button>',
      onMount: (root, close) => {
        root.querySelector("[data-save]").addEventListener("click", () => {
          const slot = root.querySelector("#log-slot").value;
          const g = Math.max(1, parseInt(root.querySelector("#log-grams").value || "0", 10) || food.portionGrams);
          App.State.addLog(user.id, { foodId: food.id, grams: g, slot: slot });
          close();
          App.UI.toast("Added to your log for today");
        });
      },
    });
  }

  App.Router.register("/food/:id", { render: render, mount: mount, title: "Food" });
})();
