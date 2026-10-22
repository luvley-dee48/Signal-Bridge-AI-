/* Single source of truth for dashboard URLs.
   Every dashboard lives in its own folder under /public, one level below the web root,
   so the same relative paths work from any dashboard page (dev server, build, or file://).
   Adding a dashboard? Add one entry here and one link in each dashboard's navigation. */
(function (w) {
  'use strict';
  var G = '../global-dashboard/index.html';
  w.SB_ROUTES = {
    global: {
      overview: G + '#overview',
      risk: G + '#risk',
      alerts: G + '#alerts',
      org: G + '#org',
      health: G + '#health',
      settings: G + '#settings',
      docs: G + '#docs',
      signout: G + '#signout'
    },
    monitoring: '../live-monitoring/index.html'
  };
})(window);
