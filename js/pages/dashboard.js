/* Role-aware dashboard. The same #/dashboard route renders the view that
   matches the signed-in user's role. */
(function () {
  function view(user) {
    const role = App.RBAC.role(user);
    if (role === App.RBAC.ROLES.ADMIN) return App.Dash.Admin;
    if (role === App.RBAC.ROLES.NUTRITIONIST) return App.Dash.Nutritionist;
    return App.Dash.Member;
  }

  function render(params, query) {
    return view(App.State.currentUser()).render(params, query);
  }
  function mount(params, query, main) {
    view(App.State.currentUser()).mount(params, query, main);
  }

  App.Router.register("/dashboard", { render: render, mount: mount, auth: true, title: "Dashboard" });
})();
