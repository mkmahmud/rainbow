/* Admin dashboard — the content console, mounted as the admin's dashboard. */
window.App = window.App || {};
App.Dash = App.Dash || {};

App.Dash.Admin = (function () {
  function render(params, query) { return App.AdminConsole.render(params, query); }
  function mount(params, query, main) { App.AdminConsole.mount(params, query, main); }
  return { render: render, mount: mount };
})();
