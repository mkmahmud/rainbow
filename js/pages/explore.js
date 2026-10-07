/* Food & nutrition explorer — search, filters, sort. */
(function () {
  const t = App.I18N.t;
  const esc = App.UI.esc;

  const state = { q: "", category: "all", cost: "all", plantOnly: false, safeOnly: false, sort: "relevance" };

  /* Shared food card renderer (also used by bookmarks page). */
  App.FoodCard = {
    flags: function (food, profile) {
      if (!profile) return [];
      return App.Engine.flags(food, profile);
    },
    card: function (food, profile, userId) {
      const flags = App.FoodCard.flags(food, profile);
      const highCount = flags.filter((f) => f.level === "high").length;
      const marked = userId ? App.State.isBookmarked(userId, food.id) : false;
      const cost = App.DATA.costTiers.find((c) => c.id === food.costTier);
      return '<div class="card card-hover pad-sm">' +
        '<div class="food-item">' +
          '<div class="food-thumb">' + food.emoji + "</div>" +
          "<div><a href=\"#/food/" + food.id + '" style="color:inherit"><strong>' + esc(App.I18N.name(food)) + "</strong></a>" +
          '<div class="muted xs">' + esc(catName(food.category)) + " · " + App.I18N.fmtNum(food.per100g.energy) + " kcal/100 g</div></div>" +
          '<div class="spacer"></div>' +
          (userId ? '<button class="icon-btn" data-bookmark="' + food.id + '" title="' + esc(t(marked ? "btn_bookmarked" : "btn_bookmark")) + '">' + (marked ? "★" : "☆") + "</button>" : "") +
        "</div>" +
        '<div class="row mt-2" style="gap:6px">' +
          (food.isPlantBased ? '<span class="badge green">🌱 Plant</span>' : "") +
          (cost ? '<span class="badge grey">' + esc(App.I18N.name(cost)) + "</span>" : "") +
          (flags.length ? '<span class="badge ' + (highCount ? "red" : "orange") + '">⚠ ' + flags.length + " flag" + (flags.length > 1 ? "s" : "") + "</span>" : '<span class="badge green">✓ Fits</span>') +
        "</div>" +
      "</div>";
    },
  };

  function catName(id) {
    const c = App.DATA.categories.find((x) => x.id === id);
    return c ? App.I18N.name(c) : id;
  }

  function filtersHtml() {
    const user = App.State.currentUser();
    const profile = user && user.profile;
    return '<div class="card pad-sm">' +
      '<div class="row" style="gap:var(--s-3)">' +
        '<input class="input" id="ex-q" type="search" placeholder="' + esc(t("common_search")) + ' foods…" value="' + esc(state.q) + '" style="flex:1;min-width:200px" />' +
        '<select class="select" id="ex-sort" style="width:auto">' +
          opt("relevance", "Relevance", state.sort) +
          opt("energy-asc", "Energy (low → high)", state.sort) +
          opt("energy-desc", "Energy (high → low)", state.sort) +
          opt("protein-desc", "Protein (high → low)", state.sort) +
          opt("name", "Name (A–Z)", state.sort) +
        "</select>" +
      "</div>" +
      '<div class="row mt-3" style="gap:6px">' +
        catChip("all", "All") +
        App.DATA.categories.map((c) => catChip(c.id, c.icon + " " + App.I18N.name(c))).join("") +
      "</div>" +
      '<div class="row mt-2" style="gap:6px">' +
        toggleChip("plantOnly", "🌱 Plant-based only", state.plantOnly) +
        toggleChip("safeOnly", "🩺 Safe for my conditions", state.safeOnly, !profile) +
        '<span class="spacer"></span>' +
        costChip("all", "Any cost") + App.DATA.costTiers.map((c) => costChip(c.id, App.I18N.name(c))).join("") +
      "</div>" +
    "</div>";
  }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? " selected" : "") + ">" + esc(label) + "</option>"; }
  function catChip(id, label) { return '<button class="chip' + (state.category === id ? " active" : "") + '" data-cat="' + id + '">' + esc(label) + "</button>"; }
  function costChip(id, label) { return '<button class="chip' + (state.cost === id ? " active" : "") + '" data-cost="' + id + '">' + esc(label) + "</button>"; }
  function toggleChip(key, label, on, disabled) {
    if (disabled) return '<button class="chip" disabled style="opacity:.5" title="Complete your profile to use this">' + esc(label) + "</button>";
    return '<button class="chip' + (on ? " active" : "") + '" data-toggle="' + key + '">' + esc(label) + "</button>";
  }

  function results() {
    const user = App.State.currentUser();
    const profile = user && user.profile;
    let list = App.State.allFoods();

    if (state.q) {
      const q = state.q.toLowerCase();
      list = list.filter((f) =>
        f.nameEn.toLowerCase().includes(q) || (f.nameBn || "").includes(state.q) || f.category.includes(q) ||
        (f.allergens || []).some((a) => a.includes(q))
      );
    }
    if (state.category !== "all") list = list.filter((f) => f.category === state.category);
    if (state.cost !== "all") list = list.filter((f) => f.costTier === state.cost);
    if (state.plantOnly) list = list.filter((f) => f.isPlantBased);
    if (state.safeOnly && profile) {
      list = list.filter((f) => !App.Engine.exclusion(f, profile) && !App.Engine.flags(f, profile).some((x) => x.level === "high"));
    }

    if (state.sort === "relevance" && profile) {
      list = list.map((f) => ({ f: f, s: App.Engine.score(f, profile, null, {}).score }))
        .sort((a, b) => b.s - a.s).map((x) => x.f);
    } else if (state.sort === "energy-asc") list = list.slice().sort((a, b) => a.per100g.energy - b.per100g.energy);
    else if (state.sort === "energy-desc") list = list.slice().sort((a, b) => b.per100g.energy - a.per100g.energy);
    else if (state.sort === "protein-desc") list = list.slice().sort((a, b) => b.per100g.protein - a.per100g.protein);
    else if (state.sort === "name") list = list.slice().sort((a, b) => App.I18N.name(a).localeCompare(App.I18N.name(b)));

    return list;
  }

  function resultsHtml() {
    const user = App.State.currentUser();
    const profile = user && user.profile;
    const userId = user && user.id;
    const list = results();
    if (!list.length) {
      return App.UI.emptyState(t("common_noResults"), "Try a different search or clear the filters.", "🔍");
    }
    return '<div class="mb-2 small muted">' + list.length + " foods · values per 100 g</div>" +
      '<div class="grid auto-220">' + list.map((f) => App.FoodCard.card(f, profile, userId)).join("") + "</div>";
  }

  function render(params, query) {
    if (query && typeof query.q === "string") state.q = query.q;
    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_explore")) + "</h1>" +
      '<div class="subtitle">Search local foods and see full nutrition, condition flags, cost and alternatives.</div></div></div>' +
      filtersHtml() +
      '<div id="ex-results">' + resultsHtml() + "</div>" +
    "</div>";
  }

  function update(main) {
    const box = main.querySelector("#ex-results");
    box.innerHTML = resultsHtml();
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    const userId = user && user.id;

    main.addEventListener("input", (e) => {
      if (e.target.id === "ex-q") { state.q = e.target.value; update(main); }
    });
    main.addEventListener("change", (e) => {
      if (e.target.id === "ex-sort") { state.sort = e.target.value; update(main); }
    });
    main.addEventListener("click", (e) => {
      const cat = e.target.closest("[data-cat]");
      const cost = e.target.closest("[data-cost]");
      const tg = e.target.closest("[data-toggle]");
      const bm = e.target.closest("[data-bookmark]");
      if (cat) { state.category = cat.getAttribute("data-cat"); main.querySelectorAll("[data-cat]").forEach((c) => c.classList.toggle("active", c === cat)); update(main); }
      if (cost) { state.cost = cost.getAttribute("data-cost"); main.querySelectorAll("[data-cost]").forEach((c) => c.classList.toggle("active", c === cost)); update(main); }
      if (tg) {
        const key = tg.getAttribute("data-toggle");
        state[key] = !state[key];
        tg.classList.toggle("active", state[key]);
        update(main);
      }
      if (bm && userId) {
        const id = bm.getAttribute("data-bookmark");
        const now = App.State.toggleBookmark(userId, id);
        bm.textContent = now ? "★" : "☆";
        App.UI.toast(now ? "Bookmarked" : "Removed from bookmarks");
      }
    });
  }

  App.Router.register("/explore", { render: render, mount: mount, title: "Explore foods" });
})();
