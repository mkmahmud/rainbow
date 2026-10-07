/* Nutritionist dashboard — review queue for submitted diet charts. */
window.App = window.App || {};
App.Dash = App.Dash || {};

App.Dash.Nutritionist = (function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  const STATUS = {
    requested: { label: "review_requested", badge: "orange" },
    review: { label: "review_inreview", badge: "" },
    reviewed: { label: "review_reviewed", badge: "green" },
  };

  let filter = "all";
  let openUser = null;

  function statusBadge(status) {
    const meta = STATUS[status] || { label: status, badge: "grey" };
    return '<span class="badge ' + meta.badge + '">' + esc(t(meta.label)) + "</span>";
  }

  function memberSummary(user) {
    const profile = user.profile;
    if (!profile || !profile.conditions || !profile.conditions.length) return user.persona || "Member";
    return profile.conditions.map((c) => {
      const cond = App.DATA.conditions.find((x) => x.id === c);
      return cond ? App.I18N.name(cond) : c;
    }).join(" · ");
  }

  function render() {
    const user = App.State.currentUser();
    const all = App.State.allReviews();
    const counts = {
      all: all.length,
      requested: all.filter((r) => r.review.status === "requested").length,
      review: all.filter((r) => r.review.status === "review").length,
      reviewed: all.filter((r) => r.review.status === "reviewed").length,
    };
    const list = filter === "all" ? all : all.filter((r) => r.review.status === filter);

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(t("dash_nutritionist")) + "</h1>" +
        '<div class="subtitle">' + esc(t("dash_nutritionist_sub")) + " · " + esc(user.name) + "</div></div>" +
      "</div>" +

      '<div class="grid cols-4">' +
        stat("📥", counts.requested, t("review_requested")) +
        stat("🔎", counts.review, t("review_inreview")) +
        stat("✅", counts.reviewed, t("review_reviewed")) +
        stat("📋", counts.all, t("review_all")) +
      "</div>" +

      '<div class="row">' +
        chip("all", t("review_all")) + chip("requested", t("review_requested")) +
        chip("review", t("review_inreview")) + chip("reviewed", t("review_reviewed")) +
      "</div>" +

      (list.length
        ? '<div class="stack">' + list.map((r) => queueCard(r)).join("") + "</div>"
        : App.UI.emptyState(t("review_empty_title"), t("review_empty_msg"), "🩺")) +
    "</div>";
  }

  function stat(icon, value, label) {
    return '<div class="card stat"><div class="stat-icon">' + icon + '</div><div class="stat-value" style="font-size:var(--fs-xl)">' + value + '</div><div class="stat-label">' + esc(label) + "</div></div>";
  }
  function chip(id, label) {
    return '<button class="chip' + (filter === id ? " active" : "") + '" data-filter="' + id + '">' + esc(label) + "</button>";
  }

  function queueCard(r) {
    const open = openUser === r.userId;
    return '<div class="card">' +
      '<div class="row between">' +
        '<div><strong>' + esc(r.user.name) + "</strong>" +
        '<div class="muted xs">' + esc(memberSummary(r.user)) + (r.user.premium ? " · ⭐ Premium" : "") + "</div></div>" +
        '<div class="row" style="gap:8px">' + statusBadge(r.review.status) +
          '<button class="btn btn-' + (open ? "outline" : "primary") + ' btn-sm" data-open="' + r.userId + '">' + esc(open ? t("common_close") : t("common_view")) + "</button>" +
        "</div>" +
      "</div>" +
      (open ? detail(r) : "") +
    "</div>";
  }

  function detail(r) {
    const review = r.review;
    return '<hr class="mt-4" style="border:none;border-top:1px solid var(--border)" />' +
      (review.note ? '<div class="notice mt-4 small"><strong>' + esc(t("review_member_note")) + ":</strong> " + esc(review.note) + "</div>" : "") +
      '<div class="mt-4"><div class="xs muted" style="text-transform:uppercase;letter-spacing:.05em">' + esc(t("review_chart")) + "</div>" +
        '<div class="mt-3">' + chartHtml(r.userId) + "</div></div>" +

      (review.status === "requested"
        ? '<div class="mt-4"><button class="btn btn-primary" data-start="' + r.userId + '">' + esc(t("review_start")) + "</button></div>"
        : "") +

      (review.status === "review"
        ? '<div class="mt-4"><label class="small" for="rv-reply">' + esc(t("review_reply_label")) + "</label>" +
            '<textarea class="textarea mt-2" id="rv-reply" placeholder="' + esc("Write your guidance for this member…") + '"></textarea>' +
            '<div class="row mt-2">' + App.DATA.nutritionistReplies.map((rep, i) =>
              '<button class="chip" data-suggest="' + i + '">' + esc("Suggestion " + (i + 1)) + "</button>").join("") + "</div>" +
            '<button class="btn btn-primary mt-3" data-send="' + r.userId + '">' + esc(t("review_send")) + "</button>" +
          "</div>"
        : "") +

      (review.reply
        ? '<div class="card pad-sm mt-4"><div class="card-title"><h4>' + esc(t("review_reply_label")) + "</h4></div><p class=\"small\">" + esc(review.reply) + "</p></div>"
        : "") +
      "</div>";
  }

  function chartHtml(userId) {
    const member = App.State.userById(userId);
    if (!member || !App.Profile.isComplete(member.profile)) {
      return '<p class="muted small">' + esc(t("review_no_profile")) + "</p>";
    }
    const plan = App.State.getPlan(userId) || App.Engine.generatePlan(member.profile, {});
    return '<div class="grid auto-280">' + plan.slots.map((s) =>
      '<div class="card pad-sm"><div class="row between"><strong class="small">' + s.icon + " " + esc(App.I18N.name(s)) + '</strong><span class="muted xs">' + App.I18N.fmtNum(s.totals.energy) + " kcal</span></div>" +
      (s.items.length
        ? '<ul class="small muted" style="margin:6px 0 0;padding-left:16px">' + s.items.map((it) => { const f = App.State.foodById(it.foodId); return f ? "<li>" + esc(App.I18N.name(f)) + " " + it.grams + " g</li>" : ""; }).join("") + "</ul>"
        : '<div class="muted xs">No safe foods for this meal.</div>') +
      "</div>"
    ).join("") + "</div>" +
    '<div class="small muted mt-2">Total ' + App.I18N.fmtNum(plan.totals.energy) + " kcal · protein " + App.I18N.fmtNum(plan.totals.protein) + " g · carbs " + App.I18N.fmtNum(plan.totals.carbs) + " g</div>";
  }

  function mount(params, query, main) {
    main.addEventListener("click", (e) => {
      const f = e.target.closest("[data-filter]");
      if (f) { filter = f.getAttribute("data-filter"); App.Router.refresh(); return; }

      const open = e.target.closest("[data-open]");
      if (open) {
        const id = open.getAttribute("data-open");
        openUser = openUser === id ? null : id;
        App.Router.refresh();
        return;
      }

      const start = e.target.closest("[data-start]");
      if (start) {
        const id = start.getAttribute("data-start");
        const rv = App.State.getReview(id);
        App.State.setReview(id, Object.assign({}, rv, { status: "review" }));
        App.UI.toast(t("review_start"));
        App.Router.refresh();
        return;
      }

      const sug = e.target.closest("[data-suggest]");
      if (sug) {
        const box = main.querySelector("#rv-reply");
        if (box) box.value = App.DATA.nutritionistReplies[parseInt(sug.getAttribute("data-suggest"), 10)] || "";
        return;
      }

      const send = e.target.closest("[data-send]");
      if (send) {
        const id = send.getAttribute("data-send");
        const box = main.querySelector("#rv-reply");
        const reply = box ? box.value.trim() : "";
        if (!reply) { App.UI.toast("Add a reply before sending.", "error"); return; }
        const rv = App.State.getReview(id);
        App.State.setReview(id, Object.assign({}, rv, { status: "reviewed", reply: reply, reviewedAt: new Date().toISOString() }));
        App.UI.toast(t("review_updated"));
        openUser = null;
        App.Router.refresh();
      }
    });
  }

  return { render, mount };
})();
