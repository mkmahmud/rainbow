/* Seeded nutritionist review requests so the staff review queue is populated
   on first run. Keys are member user ids; shape matches App.State.setReview. */
window.App = window.App || {};
App.DATA = App.DATA || {};

App.DATA.seedReviews = {
  u_premium: {
    status: "requested",
    note: "I feel hungry in the afternoons and would like the snack portion looked at.",
    requestedAt: "2026-10-02T09:20:00Z",
    reply: null,
  },
  u_diabetic: {
    status: "review",
    note: "Please check my dinner carbohydrate portions — my readings spike after dinner.",
    requestedAt: "2026-10-04T15:05:00Z",
    reply: null,
  },
};
