/* Admin / content console: overview, food CRUD, review queue, guidance, feedback. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  let tab = "overview";

  function render() {
    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_admin")) + "</h1>" +
      '<div class="subtitle">Manage foods, condition guidance, disclaimers and user feedback.</div></div>' +
      '<span class="badge orange">Staff only</span></div>' +
      '<div class="tabs">' +
        tabBtn("overview", "Overview") + tabBtn("foods", "Foods") + tabBtn("queue", "Review queue") +
        tabBtn("guidance", "Guidance & disclaimers") + tabBtn("feedback", "Feedback inbox") +
      "</div>" +
      '<div id="ad-body">' + body() + "</div>" +
    "</div>";
  }
  function tabBtn(id, label) { return '<button data-tab="' + id + '" class="' + (tab === id ? "active" : "") + '">' + esc(label) + "</button>"; }

  function body() {
    if (tab === "overview") return overview();
    if (tab === "foods") return foodsTab();
    if (tab === "queue") return queueTab();
    if (tab === "guidance") return guidanceTab();
    return feedbackTab();
  }

  function overview() {
    const foods = App.State.allFoods();
    const pending = App.State.pendingFoods();
    const fb = App.State.feedback();
    const openFb = fb.filter((f) => f.status === "open").length;
    return '<div class="grid cols-4">' +
      card("🍽️", foods.length, "Foods published") +
      card("📝", pending.length, "Pending review") +
      card("💬", openFb, "Open feedback") +
      card("🩺", App.DATA.conditions.length, "Condition rule sets") +
      "</div>" +
      '<div class="card mt-4"><div class="card-title"><h3>Data quality</h3></div>' +
        '<p class="muted small">Every food record carries a source citation and version. Changes go through a review step before they appear to users. All edits in this prototype are stored in your browser only.</p>' +
        '<div class="row mt-3"><button class="btn btn-primary" data-add-food>＋ Add food</button>' +
        '<button class="btn btn-outline" data-jump="queue">Review queue</button></div>' +
      "</div>";
  }
  function card(icon, value, label) {
    return '<div class="card stat"><div class="stat-icon">' + icon + '</div><div class="stat-value">' + value + '</div><div class="stat-label">' + esc(label) + "</div></div>";
  }

  function foodsTab() {
    const foods = App.State.allFoods();
    const retired = App.State.retiredFoods();
    return '<div class="row between mb-2"><span class="muted small">' + foods.length + " foods</span>" +
      '<button class="btn btn-primary btn-sm" data-add-food>＋ Add food</button></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Food</th><th>Category</th><th class="num">kcal</th><th>Cost</th><th>Status</th><th></th></tr></thead><tbody>' +
      foods.map((f) =>
        "<tr><td>" + f.emoji + " " + esc(App.I18N.name(f)) + '</td><td>' + esc(f.category) + '</td><td class="num">' + App.I18N.fmtNum(f.per100g.energy) + "</td><td>" + esc(f.costTier) + "</td><td>" +
          (f.status ? '<span class="badge orange">' + esc(f.status) + "</span>" : '<span class="badge green">published</span>') + "</td>" +
          '<td class="num nowrap"><a class="btn btn-ghost btn-sm" href="#/food/' + f.id + '">View</a>' +
          '<button class="btn btn-ghost btn-sm" data-edit="' + f.id + '">Edit</button>' +
          '<button class="btn btn-ghost btn-sm" data-retire="' + f.id + '" style="color:var(--danger)">Retire</button></td></tr>'
      ).join("") +
      "</tbody></table></div>" +
      (retired.length ? '<div class="card mt-4"><div class="card-title"><h3>Retired</h3></div>' +
        '<div class="stack">' + retired.map((f) => '<div class="row between"><span>' + f.emoji + " " + esc(App.I18N.name(f)) + '</span><button class="btn btn-outline btn-sm" data-restore="' + f.id + '">Restore</button></div>').join("") + "</div></div>" : "");
  }

  function queueTab() {
    const pending = App.State.pendingFoods();
    if (!pending.length) return App.UI.emptyState("Queue is clear", "New or edited foods awaiting review will appear here.", "✅");
    return '<div class="stack">' + pending.map((f) =>
      '<div class="card"><div class="row between"><div><strong>' + f.emoji + " " + esc(App.I18N.name(f)) + '</strong>' +
      '<div class="muted xs">' + esc(f.category) + " · " + App.I18N.fmtNum(f.per100g.energy) + " kcal/100 g</div></div>" +
      '<span class="badge orange">' + esc(f.status) + "</span></div>" +
      '<div class="row mt-3"><button class="btn btn-primary btn-sm" data-publish="' + f.id + '">Publish</button>' +
      '<button class="btn btn-outline btn-sm" data-back="' + f.id + '">Send back to draft</button></div></div>'
    ).join("") + "</div>";
  }

  function guidanceTab() {
    const c = App.DATA.content;
    const d = c.disclaimers;
    const g = c.guidance;
    return '<div class="grid cols-2">' +
      '<div class="card"><div class="card-title"><h3>Disclaimers</h3></div>' +
        ta("disc_general", "General disclaimer", App.State.contentEdit("disc_general", d.general)) +
        ta("disc_recommendation", "Recommendation disclaimer", App.State.contentEdit("disc_recommendation", d.recommendation)) +
        ta("disc_diet", "Diet chart disclaimer", App.State.contentEdit("disc_diet", d.diet)) +
        ta("disc_condition", "Condition thresholds note", App.State.contentEdit("disc_condition", d.condition)) +
      "</div>" +
      '<div class="card"><div class="card-title"><h3>Condition guidance</h3></div>' +
        ta("guide_diabetes", "Diabetes", App.State.contentEdit("guide_diabetes", g.diabetes)) +
        ta("guide_heart", "Heart disease / hypertension", App.State.contentEdit("guide_heart", g.heart)) +
        ta("guide_ckd", "Chronic kidney disease", App.State.contentEdit("guide_ckd", g.ckd)) +
      "</div>" +
      "</div>" +
      '<div class="row end mt-3"><button class="btn btn-primary" data-save-content>Save content</button></div>';
  }
  function ta(id, label, value) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label><textarea class="textarea" id="' + id + '">' + esc(value) + "</textarea></div>";
  }

  function feedbackTab() {
    const fb = App.State.feedback();
    if (!fb.length) return App.UI.emptyState("No feedback", "User feedback and problem reports appear here.", "💬");
    return '<div class="stack">' + fb.map((f) =>
      '<div class="card"><div class="row between"><div><strong>' + esc(f.subject) + "</strong>" +
      '<div class="muted xs">' + esc(f.userName || "User") + " · " + esc(f.type) + " · " + App.UI.fmtDate(f.createdAt) + "</div></div>" +
      '<span class="badge ' + (f.status === "open" ? "orange" : "green") + '">' + esc(f.status) + "</span></div>" +
      '<p class="small mt-2">' + esc(f.message) + "</p>" +
      '<div class="row mt-2"><button class="btn btn-' + (f.status === "open" ? "primary" : "outline") + ' btn-sm" data-fb="' + f.id + '|' + (f.status === "open" ? "resolved" : "open") + '">' +
      (f.status === "open" ? "Mark resolved" : "Reopen") + "</button></div></div>"
    ).join("") + "</div>";
  }

  function update(main) { main.querySelector("#ad-body").innerHTML = body(); }

  function mount(params, query, main) {
    main.addEventListener("click", (e) => {
      const tb = e.target.closest("[data-tab]");
      if (tb) { tab = tb.getAttribute("data-tab"); App.Router.refresh(); return; }
      const jump = e.target.closest("[data-jump]");
      if (jump) { tab = jump.getAttribute("data-jump"); App.Router.refresh(); return; }
      if (e.target.closest("[data-add-food]")) { openFoodModal(null, main); return; }
      const ed = e.target.closest("[data-edit]");
      if (ed) { openFoodModal(App.State.foodById(ed.getAttribute("data-edit")), main); return; }
      const rt = e.target.closest("[data-retire]");
      if (rt) {
        const id = rt.getAttribute("data-retire");
        App.UI.confirm("Retire this food? It will stop appearing to users.", { danger: true, okText: "Retire" }).then((ok) => {
          if (ok) { App.State.retireFood(id); App.Router.refresh(); App.UI.toast("Food retired"); }
        });
        return;
      }
      const rs = e.target.closest("[data-restore]");
      if (rs) { App.State.restoreFood(rs.getAttribute("data-restore")); App.Router.refresh(); return; }
      const pub = e.target.closest("[data-publish]");
      if (pub) { App.State.setFoodStatus(pub.getAttribute("data-publish"), "published"); update(main); App.UI.toast("Published"); return; }
      const back = e.target.closest("[data-back]");
      if (back) { App.State.setFoodStatus(back.getAttribute("data-back"), "draft"); update(main); return; }
      if (e.target.closest("[data-save-content]")) { saveContent(main); return; }
      const fb = e.target.closest("[data-fb]");
      if (fb) { const [id, status] = fb.getAttribute("data-fb").split("|"); App.State.setFeedbackStatus(id, status); update(main); return; }
    });
  }

  function saveContent(main) {
    ["disc_general", "disc_recommendation", "disc_diet", "disc_condition", "guide_diabetes", "guide_heart", "guide_ckd"].forEach((k) => {
      const el = main.querySelector("#" + k);
      if (el) App.State.setContentEdit(k, el.value);
    });
    App.UI.toast("Content saved");
  }

  function openFoodModal(food, main) {
    const isNew = !food;
    const base = food || {
      nameEn: "", nameBn: "", emoji: "🍽️", category: "veg", portionLabel: "1 serving (100 g)", portionGrams: 100,
      per100g: { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      micros: { sodium: 0, potassium: 0, phosphorus: 0, satFat: 0, sugar: 0, glycemic: null },
      costTier: "medium", isPlantBased: false, allergens: [], source: "Manual entry",
    };
    App.UI.modal({
      title: isNew ? "Add food" : "Edit " + App.I18N.name(food),
      bodyHtml: foodForm(base),
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + '</button><button class="btn btn-primary" data-save-food>Save</button>',
      onMount: (root, close) => {
        root.querySelector("[data-save-food]").addEventListener("click", () => {
          const data = readFoodForm(root, base);
          if (!data.nameEn) { App.UI.toast("English name is required", "error"); return; }
          if (isNew) {
            data.status = "draft";
            App.State.addFood(data);
            App.UI.toast("Added to review queue");
          } else {
            App.State.editFood(food.id, data);
            App.UI.toast("Food updated");
          }
          close();
          App.Router.refresh();
        });
      },
    });
    void main;
  }

  function foodForm(f) {
    const num = (label, id, val, step) => '<div class="field"><label>' + esc(label) + '</label><input class="input" id="' + id + '" type="number" step="' + (step || 1) + '" value="' + val + '" /></div>';
    return '<div class="grid cols-2">' +
      '<div class="field"><label>Name (English)</label><input class="input" id="af-nameEn" value="' + esc(f.nameEn) + '" /></div>' +
      '<div class="field"><label>Name (Bangla)</label><input class="input" id="af-nameBn" value="' + esc(f.nameBn) + '" /></div>' +
      '<div class="field"><label>Category</label><select class="select" id="af-category">' +
        App.DATA.categories.map((c) => '<option value="' + c.id + '"' + (c.id === f.category ? " selected" : "") + ">" + esc(c.nameEn) + "</option>").join("") + "</select></div>" +
      '<div class="field"><label>Emoji</label><input class="input" id="af-emoji" value="' + esc(f.emoji) + '" /></div>' +
      '<div class="field"><label>Portion label</label><input class="input" id="af-portionLabel" value="' + esc(f.portionLabel) + '" /></div>' +
      num("Portion (g)", "af-portionGrams", f.portionGrams) +
      num("Energy (kcal)", "af-energy", f.per100g.energy) +
      num("Protein (g)", "af-protein", f.per100g.protein, 0.1) +
      num("Carbs (g)", "af-carbs", f.per100g.carbs, 0.1) +
      num("Fat (g)", "af-fat", f.per100g.fat, 0.1) +
      num("Fibre (g)", "af-fiber", f.per100g.fiber, 0.1) +
      num("Sodium (mg)", "af-sodium", f.micros.sodium) +
      num("Potassium (mg)", "af-potassium", f.micros.potassium) +
      num("Phosphorus (mg)", "af-phosphorus", f.micros.phosphorus) +
      num("Saturated fat (g)", "af-satFat", f.micros.satFat, 0.1) +
      num("Sugar (g)", "af-sugar", f.micros.sugar, 0.1) +
      num("Glycemic index", "af-glycemic", f.micros.glycemic === null ? "" : f.micros.glycemic) +
      '<div class="field"><label>Cost tier</label><select class="select" id="af-costTier">' +
        App.DATA.costTiers.map((c) => '<option value="' + c.id + '"' + (c.id === f.costTier ? " selected" : "") + ">" + esc(c.nameEn) + "</option>").join("") + "</select></div>" +
      '<div class="field"><label>Plant-based</label><label class="check' + (f.isPlantBased ? " checked" : "") + '"><input type="checkbox" id="af-isPlantBased" ' + (f.isPlantBased ? "checked" : "") + " /><span>Yes</span></label></div>" +
      "</div>";
  }

  function readFoodForm(root, base) {
    const v = (id) => { const el = root.querySelector("#" + id); return el ? el.value : ""; };
    const n = (id) => { const x = parseFloat(v(id)); return isNaN(x) ? 0 : x; };
    const gi = v("af-glycemic").trim();
    return {
      id: base.id,
      nameEn: v("af-nameEn").trim(),
      nameBn: v("af-nameBn").trim(),
      emoji: v("af-emoji") || "🍽️",
      category: v("af-category"),
      portionLabel: v("af-portionLabel"),
      portionGrams: n("af-portionGrams") || 100,
      per100g: { energy: n("af-energy"), protein: n("af-protein"), carbs: n("af-carbs"), fat: n("af-fat"), fiber: n("af-fiber") },
      micros: { sodium: n("af-sodium"), potassium: n("af-potassium"), phosphorus: n("af-phosphorus"), satFat: n("af-satFat"), sugar: n("af-sugar"), glycemic: gi === "" ? null : parseFloat(gi) },
      costTier: v("af-costTier"),
      isPlantBased: root.querySelector("#af-isPlantBased").checked,
      allergens: base.allergens || [],
      source: base.source || "Manual entry",
    };
  }

  App.AdminConsole = { render: render, mount: mount };
})();
