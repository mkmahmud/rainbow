/* Multi-step health-profile onboarding wizard. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  const STEPS = ["Basics", "Body", "Goal", "Conditions", "Diet", "Preferences", "Review"];
  let step = 0;
  let draft = null;

  function ensureDraft() {
    if (draft) return;
    const user = App.State.currentUser();
    draft = Object.assign({
      age: 30, sex: "male", heightCm: 170, weightKg: 65, activity: "moderate",
      goal: "maintain", conditions: [], ckdStage: 3, allergies: [], diet: [],
      dislikedFoods: [], mealsPerDay: 4,
      budgetSensitive: false, language: App.I18N.getLang(),
    }, (user && user.profile) || {});
    draft.name = (user && user.name) || "";
  }

  function stepper() {
    return '<div class="stepper">' + STEPS.map((s, i) =>
      '<div class="step ' + (i === step ? "active" : i < step ? "done" : "") + '"><span class="dot">' + (i < step ? "✓" : i + 1) + '</span>' + esc(s) + "</div>"
    ).join("") + "</div>";
  }

  function stepBody() {
    if (step === 0) {
      return '<div class="grid cols-2">' +
        '<div class="field" style="grid-column:1/-1"><label for="ob-name">Full name</label><input class="input" id="ob-name" type="text" value="' + esc(draft.name) + '" placeholder="Your name" /></div>' +
        '<div class="field"><label for="ob-age">Age (years)</label><input class="input" id="ob-age" type="number" min="1" max="120" value="' + draft.age + '" /></div>' +
        '<div class="field"><label>Sex</label><div class="option-grid">' +
          sexOpt("male", "♂️ Male") + sexOpt("female", "♀️ Female") + sexOpt("other", "⚧ Other") +
        "</div></div></div>";
    }
    if (step === 1) {
      return '<div class="grid cols-2">' +
        '<div class="field"><label for="ob-height">Height (cm)</label><input class="input" id="ob-height" type="number" min="50" max="250" value="' + draft.heightCm + '" /></div>' +
        '<div class="field"><label for="ob-weight">Weight (kg)</label><input class="input" id="ob-weight" type="number" min="10" max="400" value="' + draft.weightKg + '" /></div>' +
        '<div class="field" style="grid-column:1/-1"><label for="ob-activity">Activity level</label><select class="select" id="ob-activity">' +
          App.DATA.activityLevels.map((a) => '<option value="' + a.id + '"' + (a.id === draft.activity ? " selected" : "") + ">" + esc(App.I18N.name(a)) + "</option>").join("") +
        "</select></div></div>";
    }
    if (step === 2) {
      return '<div class="option-grid">' + App.DATA.goals.map((g) =>
        '<button type="button" class="card card-hover center" data-goal="' + g.id + '" style="cursor:pointer;' + (draft.goal === g.id ? "border-color:var(--green-600);box-shadow:var(--shadow-md)" : "") + '">' +
          '<strong>' + esc(App.I18N.name(g)) + "</strong></button>"
      ).join("") + "</div>";
    }
    if (step === 3) {
      return '<p class="muted small">Select any conditions you have. This changes the safety limits we apply.</p>' +
        '<div class="option-grid mt-3">' + App.DATA.conditions.map((c) =>
          '<label class="check' + (draft.conditions.includes(c.id) ? " checked" : "") + '" data-cond="' + c.id + '">' +
            '<input type="checkbox" ' + (draft.conditions.includes(c.id) ? "checked" : "") + ' value="' + c.id + '" />' +
            "<span>" + c.icon + " <strong>" + esc(App.I18N.name(c)) + '</strong><br><span class="muted xs">' + esc(App.I18N.L(c, "summary")) + "</span></span></label>"
        ).join("") + "</div>" +
        '<div id="ob-ckd" class="field mt-4" style="' + (draft.conditions.includes("ckd") ? "" : "display:none") + '">' +
          '<label for="ob-ckdstage">Kidney disease stage</label><select class="select" id="ob-ckdstage">' +
          App.DATA.ckdStages.map((s) => '<option value="' + s.value + '"' + (s.value === draft.ckdStage ? " selected" : "") + ">" + esc(App.I18N.L(s, "label")) + "</option>").join("") +
          "</select></div>";
    }
    if (step === 4) {
      return '<h4>Allergies (hard exclusions)</h4>' +
        '<div class="option-grid mt-2">' + App.DATA.allergens.map((a) =>
          '<label class="check' + (draft.allergies.includes(a.id) ? " checked" : "") + '">' +
            '<input type="checkbox" name="allergy" value="' + a.id + '" ' + (draft.allergies.includes(a.id) ? "checked" : "") + " />" +
            "<span>" + esc(App.I18N.name(a)) + "</span></label>"
        ).join("") + "</div>" +
        '<h4 class="mt-5">Dietary preferences</h4>' +
        '<div class="option-grid mt-2">' + App.DATA.dietaryPrefs.map((d) =>
          '<label class="check' + (draft.diet.includes(d.id) ? " checked" : "") + '">' +
            '<input type="checkbox" name="diet" value="' + d.id + '" ' + (draft.diet.includes(d.id) ? "checked" : "") + " />" +
            "<span>" + esc(App.I18N.name(d)) + "</span></label>"
        ).join("") + "</div>" +
        '<h4 class="mt-5">Foods you dislike (optional)</h4>' +
        '<p class="muted small mt-2">We\'ll leave these out of your recommendations and plans.</p>' +
        '<div class="option-grid mt-2" style="max-height:280px;overflow:auto;padding-right:4px">' +
          App.State.allFoods().slice().sort((a, b) => App.I18N.name(a).localeCompare(App.I18N.name(b))).map((f) =>
            '<label class="check' + (draft.dislikedFoods.indexOf(f.id) >= 0 ? " checked" : "") + '">' +
              '<input type="checkbox" name="disliked" value="' + f.id + '" ' + (draft.dislikedFoods.indexOf(f.id) >= 0 ? "checked" : "") + " />" +
              "<span>" + f.emoji + " " + esc(App.I18N.name(f)) + "</span></label>"
          ).join("") +
        "</div>";
    }
    if (step === 5) {
      return '<div class="field"><label>Budget sensitivity</label>' +
          '<label class="check' + (draft.budgetSensitive ? " checked" : "") + '"><input type="checkbox" id="ob-budget" ' + (draft.budgetSensitive ? "checked" : "") + ' />' +
          "<span>I want the most affordable options prioritized</span></label></div>" +
        '<div class="field mt-4"><label>Meals per day</label>' +
          '<div class="segmented" id="ob-meals">' +
            [2, 3, 4].map((n) => '<button type="button" data-meals="' + n + '" class="' + (draft.mealsPerDay === n ? "active" : "") + '">' + n + "</button>").join("") +
          "</div></div>" +
        '<div class="field mt-4"><label>Preferred language</label>' +
          '<div class="segmented" id="ob-lang"><button type="button" data-lang="en" class="' + (draft.language === "en" ? "active" : "") + '">English</button>' +
          '<button type="button" data-lang="bn" class="' + (draft.language === "bn" ? "active" : "") + '">বাংলা</button></div></div>';
    }
    return review();
  }

  function reviewRow(k, v) {
    return '<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="muted">' + esc(k) + "</span><strong>" + esc(v) + "</strong></div>";
  }
  function review() {
    const goal = App.DATA.goals.find((g) => g.id === draft.goal) || {};
    const lvl = App.DATA.activityLevels.find((a) => a.id === draft.activity) || {};
    const conds = (draft.conditions || []).map((c) => { const x = App.DATA.conditions.find((y) => y.id === c); return x ? App.I18N.name(x) : c; });
    const allergies = (draft.allergies || []).map((a) => { const x = App.DATA.allergens.find((y) => y.id === a); return x ? App.I18N.name(x) : a; });
    const diet = (draft.diet || []).map((d) => { const x = App.DATA.dietaryPrefs.find((y) => y.id === d); return x ? App.I18N.name(x) : d; });
    return '<p class="muted small">Check everything below. Use <strong>Back</strong> to change any step.</p>' +
      '<div class="mt-3">' +
        reviewRow("Name", draft.name || "—") +
        reviewRow("Age · Sex", draft.age + " · " + draft.sex) +
        reviewRow("Height · Weight", draft.heightCm + " cm · " + draft.weightKg + " kg") +
        reviewRow("Activity", App.I18N.name(lvl) || "—") +
        reviewRow("Goal", App.I18N.name(goal) || "—") +
        reviewRow("Conditions", conds.length ? conds.join(", ") : "None") +
        reviewRow("Allergies", allergies.length ? allergies.join(", ") : "None") +
        reviewRow("Diet", diet.length ? diet.join(", ") : "No restrictions") +
        reviewRow("Disliked foods", draft.dislikedFoods.length ? draft.dislikedFoods.length + " items" : "None") +
        reviewRow("Meals per day", String(draft.mealsPerDay)) +
        reviewRow("Budget-sensitive", draft.budgetSensitive ? "Yes" : "No") +
        reviewRow("Language", draft.language === "bn" ? "বাংলা" : "English") +
      "</div>";
  }

  function sexOpt(v, label) {
    return '<label class="radio' + (draft.sex === v ? " checked" : "") + '"><input type="radio" name="sex" value="' + v + '" ' + (draft.sex === v ? "checked" : "") + " /><span>" + esc(label) + "</span></label>";
  }

  function render() {
    ensureDraft();
    return '<div class="container stack" style="max-width:860px">' +
      '<div class="page-head"><div><h1>Set up your profile</h1><div class="subtitle">Step ' + (step + 1) + " of " + STEPS.length + "</div></div></div>" +
      stepper() +
      '<div class="card"><div id="ob-body">' + stepBody() + "</div>" +
        '<div class="row between mt-5">' +
          '<button class="btn btn-outline" id="ob-back" ' + (step === 0 ? "disabled" : "") + ">" + esc(t("common_back")) + "</button>" +
          '<button class="btn btn-primary" id="ob-next">' + esc(step === STEPS.length - 1 ? t("common_finish") : t("common_next")) + "</button>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  function collect() {
    const q = (id) => document.getElementById(id);
    if (step === 0) {
      const name = (q("ob-name").value || "").trim();
      if (!name) return fail("Please enter your name.");
      draft.name = name;
      const age = parseInt(q("ob-age").value, 10);
      if (!age || age < 1 || age > 120) return fail("Please enter a valid age.");
      draft.age = age;
      const sex = document.querySelector('input[name="sex"]:checked');
      draft.sex = sex ? sex.value : draft.sex;
    }
    if (step === 1) {
      const h = parseInt(q("ob-height").value, 10);
      const w = parseInt(q("ob-weight").value, 10);
      if (!h || h < 50 || h > 250) return fail("Please enter a valid height (50–250 cm).");
      if (!w || w < 10 || w > 400) return fail("Please enter a valid weight (10–400 kg).");
      draft.heightCm = h; draft.weightKg = w;
      draft.activity = q("ob-activity").value;
    }
    if (step === 3) {
      const boxes = App.UI.qsa('input[type="checkbox"]', q("ob-body"));
      draft.conditions = boxes.filter((b) => b.checked).map((b) => b.value);
      const sel = q("ob-ckdstage");
      if (sel) draft.ckdStage = parseInt(sel.value, 10);
    }
    if (step === 4) {
      draft.allergies = App.UI.qsa('input[name="allergy"]:checked').map((b) => b.value);
      draft.diet = App.UI.qsa('input[name="diet"]:checked').map((b) => b.value);
      draft.dislikedFoods = App.UI.qsa('input[name="disliked"]:checked').map((b) => b.value);
    }
    if (step === 5) {
      draft.budgetSensitive = q("ob-budget").checked;
    }
    return true;
  }
  function fail(msg) { App.UI.toast(msg, "error"); return false; }

  function mount(params, query, main) {
    ensureDraft();
    main.addEventListener("click", (e) => {
      const goal = e.target.closest("[data-goal]");
      if (goal) {
        draft.goal = goal.getAttribute("data-goal");
        main.querySelectorAll("[data-goal]").forEach((g) => { g.style.borderColor = ""; g.style.boxShadow = ""; });
        goal.style.borderColor = "var(--green-600)"; goal.style.boxShadow = "var(--shadow-md)";
        return;
      }
      const lang = e.target.closest("[data-lang]");
      if (lang) {
        draft.language = lang.getAttribute("data-lang");
        main.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("active", b === lang));
        return;
      }
      const meals = e.target.closest("[data-meals]");
      if (meals) {
        draft.mealsPerDay = parseInt(meals.getAttribute("data-meals"), 10);
        main.querySelectorAll("[data-meals]").forEach((b) => b.classList.toggle("active", b === meals));
        return;
      }
    });
    main.addEventListener("change", (e) => {
      if (e.target.matches('[data-cond] input, [data-cond]')) {
        const label = e.target.closest("[data-cond]");
        if (label) {
          const box = label.querySelector("input");
          label.classList.toggle("checked", box.checked);
          if (label.getAttribute("data-cond") === "ckd") {
            const ckd = main.querySelector("#ob-ckd");
            if (ckd) ckd.style.display = box.checked ? "" : "none";
          }
        }
      }
      if (e.target.matches('input[name="sex"]')) {
        main.querySelectorAll('input[name="sex"]').forEach((r) => r.closest(".radio").classList.toggle("checked", r.checked));
      }
      if (e.target.matches('input[name="allergy"], input[name="diet"], input[name="disliked"], #ob-budget')) {
        const lbl = e.target.closest(".check"); if (lbl) lbl.classList.toggle("checked", e.target.checked);
      }
    });

    main.querySelector("#ob-next").addEventListener("click", () => {
      if (!collect()) return;
      if (step === STEPS.length - 1) {
        const user = App.State.currentUser();
        const profile = Object.assign({}, draft);
        delete profile.name;
        App.State.saveProfile(user.id, profile);
        if (draft.name && draft.name !== user.name) App.State.updateUser(user.id, { name: draft.name });
        App.State.setLanguage(draft.language);
        App.UI.toast("Profile saved — generating suggestions");
        draft = null; step = 0;
        App.Router.go("#/dashboard");
        return;
      }
      step++;
      App.Router.refresh();
    });
    main.querySelector("#ob-back").addEventListener("click", () => {
      if (step > 0) { step--; App.Router.refresh(); }
    });
  }

  App.Router.register("/onboarding", { render: render, mount: mount, auth: true, roles: ["member"], title: "Set up profile" });
})();
