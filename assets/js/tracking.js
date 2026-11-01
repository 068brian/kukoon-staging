/* Kukoon site-side measurement (privacy-safe).
   - Remembers campaign parameters (utm_*, gclid) for the visit so the enquiry can be attributed.
   - Pushes named events to window.dataLayer. No name, email, phone, message, diagnosis or
     disability detail is ever put in an event, so nothing sensitive can reach ad platforms.
   - Loads Google Tag Manager only when KUKOON_CONFIG.gtmId is set (after privacy sign-off). */
(function () {
  var w = window, d = document, cfg = w.KUKOON_CONFIG || {};
  w.dataLayer = w.dataLayer || [];
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"];
  var store = {};
  try { store = JSON.parse(sessionStorage.getItem("kukoon_utm") || "{}"); } catch (e) {}
  try {
    var q = new URLSearchParams(location.search), found = false;
    KEYS.forEach(function (k) { var v = q.get(k); if (v) { store[k] = v.slice(0, 120); found = true; } });
    if (found) { store.landing_page = location.pathname; try { sessionStorage.setItem("kukoon_utm", JSON.stringify(store)); } catch (e) {} }
  } catch (e) {}
  if (!store.landing_page) store.landing_page = location.pathname;

  function track(name, params) {
    var ev = { event: name, page_path: location.pathname };
    for (var k in params) ev[k] = params[k];
    w.dataLayer.push(ev);
    return ev;
  }
  w.KukoonTrack = { track: track, campaign: function () { return store; } };

  if (cfg.gtmId && /^GTM-[A-Z0-9]+$/.test(cfg.gtmId)) {
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    var s = d.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtm.js?id=" + cfg.gtmId; d.head.appendChild(s);
  }

  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a"); if (!a) return;
    var h = a.getAttribute("href") || "";
    if (h.indexOf("tel:") === 0) track("kukoon_phone_click", {});
    else if (/lets-talk/.test(h)) {
      var ref = /type=professional/.test(h);
      track(ref ? "referral_cta_click" : "primary_cta_click", { cta_target: ref ? "referral_form" : "enquiry_form", service: (h.match(/service=([\w-]+)/) || [])[1] || "", cta_text: (a.textContent || "").trim().slice(0, 60) });
    }
  });
  if (/lets-talk/.test(location.pathname)) track("kukoon_form_view", { service: (location.search.match(/service=([\w-]+)/) || [])[1] || "" });
})();
