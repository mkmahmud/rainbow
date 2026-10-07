/* Inline stroke icon set (no dependency). Icons inherit currentColor. */
window.App = window.App || {};

App.Icons = (function () {
  const PATHS = {
    dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.2-4.2"/>',
    recommend: '<path d="M12 3.2l1.9 4.6 4.6 1.9-4.6 1.9L12 16.2 10.1 11.6 5.5 9.7l4.6-1.9L12 3.2z"/><path d="M18.6 15.4l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/>',
    diet: '<path d="M9 4.5h6v2.6H9z"/><path d="M9 5.8H7.2A1.7 1.7 0 005.5 7.5v11A1.7 1.7 0 007.2 20.2h9.6a1.7 1.7 0 001.7-1.7v-11a1.7 1.7 0 00-1.7-1.7H15"/><path d="M9 12.2h6M9 16h4"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.4 19.2a5.6 5.6 0 0111.2 0"/><path d="M15.8 5.4a3.2 3.2 0 010 5.4"/><path d="M17 13.6a5.4 5.4 0 013.6 5.6"/>',
    content: '<path d="M4.5 5.6A2.1 2.1 0 016.6 3.5h7l5.9 5.9v9.1a2.1 2.1 0 01-2.1 2.1H6.6a2.1 2.1 0 01-2.1-2.1V5.6z"/><path d="M13.4 3.6v6h6"/>',
    profile: '<circle cx="12" cy="8.2" r="3.6"/><path d="M5 20a7 7 0 0114 0"/>',
    settings: '<path d="M4 20v-6M4 10V4M12 20v-9M12 7V4M20 20v-4M20 12V4"/><path d="M1.8 14h4.4M9.8 7h4.4M17.8 16h4.4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 114.1 1.9c-.9.7-1.7 1.1-1.7 2.2"/><circle cx="12" cy="16.8" r=".5"/>',
    logout: '<path d="M15 4.2h2.8A2 2 0 0119.8 6.2v11.6a2 2 0 01-2 2H15"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    spark: '<path d="M12 4l1.6 4L17.6 9.6 13.6 11.2 12 15.2 10.4 11.2 6.4 9.6 10.4 8 12 4z"/>',
    bell: '<path d="M18 8.6a6 6 0 10-12 0c0 6-2.4 7.4-2.4 7.4h16.8S18 14.6 18 8.6z"/><path d="M10.3 19.6a2 2 0 003.4 0"/>',
    chevron: '<path d="M6 9.5l6 6 6-6"/>',
    flame: '<path d="M12 3s5 4.2 5 9a5 5 0 01-10 0c0-1.6.7-3 1.6-4.2C9.5 9.6 12 8 12 3z"/>',
    drop: '<path d="M12 3.5S6.5 9.6 6.5 14a5.5 5.5 0 0011 0C17.5 9.6 12 3.5 12 3.5z"/>',
    leaf: '<path d="M5 19c8 1 14-4 14-14-9 0-14 5-14 12v2z"/><path d="M5 19c2-3 5-5 9-7"/>',
  };

  function get(name, size) {
    const body = PATHS[name] || PATHS.dashboard;
    const s = size || 20;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + body + "</svg>";
  }

  return { get: get, PATHS: PATHS };
})();
