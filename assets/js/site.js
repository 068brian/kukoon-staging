(function () {
  "use strict";
  var d = document, root = d.documentElement;

  /* Mobile menu + desktop services submenu */
  var btn = d.querySelector(".menu-btn"), nav = d.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.querySelector("span").textContent = open ? "Close" : "Menu";
    });
  }
  var sub = d.querySelector(".sub-toggle"), menu = d.getElementById("sub-services");
  function closeSub() { if (sub && menu) { menu.classList.remove("open"); sub.setAttribute("aria-expanded", "false"); } }
  if (sub && menu) {
    sub.addEventListener("click", function () {
      var o = menu.classList.toggle("open");
      sub.setAttribute("aria-expanded", o ? "true" : "false");
    });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeSub(); sub.focus(); } });
    d.addEventListener("click", function (e) { if (!e.target.closest(".has-sub")) closeSub(); });
    menu.addEventListener("focusout", function (e) { if (!menu.contains(e.relatedTarget) && e.relatedTarget !== sub) closeSub(); });
  }

  /* Open a Carers accordion area when linked to by hash */
  function openHash() {
    var h = location.hash && d.querySelector(location.hash.replace(/[^#\w-]/g, ""));
    if (h && h.tagName === "DETAILS") h.open = true;
  }
  openHash(); window.addEventListener("hashchange", openHash);

  /* Let's Talk form */
  var form = d.getElementById("enquiry");
  if (!form) return;
  var cfg = window.KUKOON_CONFIG || {};
  var isStaging = form.getAttribute("data-env") === "staging";
  var loaded = Date.now();
  var summary = d.getElementById("error-summary");
  var testbox = d.getElementById("testbox");
  var thanks = d.getElementById("thanks");
  var consentBox = d.getElementById("f-consent");
  var sendBtn = form.querySelector('button[type="submit"]');
  var started = false;
  var T = function (n, p) { return window.KukoonTrack ? window.KukoonTrack.track(n, p || {}) : null; };

  var routes = {
    interest: { lbd: "Living by Design", ilo: "Individualised Living Options (ILO)", sil: "Individual SIL", sles: "SLES", sc: "Support Coordination", hi: "High Intensity & Nursing", unsure: "Not sure yet", general: "General question" },
    who: { self: "Self", other: "Family / carer", professional: "Professional / referrer", else: "Other" }
  };
  var labels = {
    who: { self: "Self", other: "Family member or carer", professional: "Professional / referrer", else: "Other" },
    interest: { lbd: "Living by Design", ilo: "Individualised Living Options (ILO)", sil: "Individual Supported Independent Living (SIL)", sles: "School Leaver Employment Supports (SLES)", sc: "Support Coordination", hi: "High Intensity Supports & Nursing", unsure: "Not sure yet", general: "General question" }
  };
  /* Page links use readable values: ?service=living-by-design&type=professional */
  var serviceMap = { "living-by-design": "lbd", "ilo": "ilo", "individual-sil": "sil", "sles": "sles", "support-coordination": "sc", "high-intensity": "hi", "unsure": "unsure", "general": "general" };
  var typeMap = { "self": "self", "family": "other", "carer": "other", "professional": "professional", "other": "else" };

  function setRadio(n, v) {
    var el = form.querySelector('input[name="' + n + '"][value="' + v + '"]');
    if (el) el.checked = true;
  }
  try {
    var q = new URLSearchParams(location.search);
    var sv = (q.get("service") || "").toLowerCase(), ty = (q.get("type") || "").toLowerCase();
    if (serviceMap[sv]) setRadio("interest", serviceMap[sv]);
    if (typeMap[ty]) setRadio("who", typeMap[ty]);
    /* Older links: ?who=&interest= */
    if (!serviceMap[sv] && q.get("interest")) setRadio("interest", q.get("interest").replace(/[^\w-]/g, ""));
    if (!typeMap[ty] && q.get("who")) setRadio("who", q.get("who").replace(/[^\w-]/g, ""));
  } catch (e) {}

  function val(n) { var el = form.elements[n]; return el ? el.value.trim() : ""; }
  function checked(n) { var el = form.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ""; }
  function syncConsent() {
    var pro = checked("who") === "professional";
    consentBox.hidden = !pro;
    if (!pro) { form.elements.authority.checked = false; clearErr(consentBox, form.elements.authority); }
  }
  syncConsent();
  form.addEventListener("change", function (e) { if (e.target.name === "who") syncConsent(); });
  form.addEventListener("focusin", function () {
    if (started) return; started = true;
    T("form_start", { pathway: checked("interest") || "", enquirer_type: checked("who") || "" });
  });

  function setErr(container, input, msg, id) {
    container.classList.add("invalid");
    var p = container.querySelector(".err"); if (p) p.textContent = msg;
    if (input) input.setAttribute("aria-invalid", "true");
    return { id: id, msg: msg };
  }
  function clearErr(container, input) {
    container.classList.remove("invalid");
    if (input) input.removeAttribute("aria-invalid");
  }
  function validate() {
    var errs = [];
    var f;
    f = d.getElementById("f-who"); clearErr(f);
    if (!checked("who")) errs.push(setErr(f, null, "Choose who this enquiry is from.", "who-first"));
    f = d.getElementById("f-interest"); clearErr(f);
    if (!checked("interest")) errs.push(setErr(f, null, "Choose a service. “I’m not sure yet” is fine.", "interest-first"));
    var name = form.elements.name, email = form.elements.email;
    f = name.closest(".field"); clearErr(f, name);
    if (!val("name")) errs.push(setErr(f, name, "Enter your name.", "name"));
    f = email.closest(".field"); clearErr(f, email);
    if (!val("email")) errs.push(setErr(f, email, "Enter your email address.", "email"));
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("email"))) errs.push(setErr(f, email, "Check your email address. It should look like name@example.com.", "email"));
    var ph = form.elements.phone; f = ph.closest(".field"); clearErr(f, ph);
    if (val("phone") && !/^[+\d][\d\s()+-]{7,}$/.test(val("phone"))) errs.push(setErr(f, ph, "Check your phone number, or leave it blank.", "phone"));
    var pc = form.elements.suburb; f = pc.closest(".field"); clearErr(f, pc);
    if (val("suburb").length > 80) errs.push(setErr(f, pc, "Keep this to a suburb or postcode.", "suburb"));
    var au = form.elements.authority; clearErr(consentBox, au);
    if (checked("who") === "professional" && !au.checked) errs.push(setErr(consentBox, au, "Confirm you have authority, or the person’s agreement, to make this enquiry.", "authority"));
    var msg = form.elements.message; f = msg.closest(".field"); clearErr(f, msg);
    if (val("message").length > 2000) errs.push(setErr(f, msg, "Please keep your message under 2,000 characters.", "message"));
    return errs;
  }
  function showSummary(errs, heading) {
    if (!errs.length) { summary.classList.remove("show"); summary.innerHTML = ""; return; }
    var h = '<h2 id="es-h" tabindex="-1">' + (heading || "Please fix " + (errs.length === 1 ? "1 thing" : errs.length + " things") + " before sending") + "</h2><ul>";
    errs.forEach(function (e) { h += "<li>" + (e.id ? '<a href="#' + e.id + '">' + e.msg + "</a>" : e.msg) + "</li>"; });
    summary.innerHTML = h + "</ul>"; summary.classList.add("show");
    d.getElementById("es-h").focus();
  }
  summary && summary.addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a) return; e.preventDefault();
    var t = d.getElementById(a.getAttribute("href").slice(1)); if (t) { t.focus(); t.scrollIntoView({ block: "center" }); }
  });
  form.addEventListener("input", function (e) {
    var t = e.target; var c = t.closest(".field") || t.closest("fieldset");
    if (c && c.classList.contains("invalid")) { c.classList.remove("invalid"); t.removeAttribute("aria-invalid"); }
  });
  form.addEventListener("change", function (e) {
    var t = e.target; var c = t.closest(".field") || t.closest("fieldset");
    if (c && c.classList.contains("invalid")) { c.classList.remove("invalid"); t.removeAttribute("aria-invalid"); }
  });

  /* Same person, same service, same day = same key, so GHL can merge repeat submissions. */
  function dedupeKey(email, service) {
    var s = (email.toLowerCase() + "|" + service + "|" + new Date().toISOString().slice(0, 10)), h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return "kk-" + (h >>> 0).toString(36);
  }

  function payload() {
    var who = checked("who"), interest = checked("interest");
    var tags = ["Website enquiry", "Interest: " + routes.interest[interest], "Enquirer: " + routes.who[who]];
    if (who === "professional") tags.push("Referral / professional");
    var out = {
      source: "kukoon-website-lets-talk",
      source_url: location.href.split("#")[0],
      page: location.pathname,
      submitted_at: new Date().toISOString(),
      enquiry_type: labels.who[who],
      service_interest: labels.interest[interest],
      routing_tags: tags.join(","),
      assigned_owner: (cfg.owners && (cfg.owners[interest] || cfg.owners["default"])) || "",
      dedupe_key: dedupeKey(val("email"), interest),
      name: val("name"),
      email: val("email"),
      phone: val("phone"),
      suburb_or_postcode: val("suburb"),
      authority_confirmed: who === "professional" ? (form.elements.authority.checked ? "yes" : "no") : "not applicable",
      message: val("message")
    };
    var c = (window.KukoonTrack && window.KukoonTrack.campaign()) || {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "landing_page"].forEach(function (k) { if (c[k]) out[k] = c[k]; });
    return out;
  }

  /* Events carry only the pathway and enquirer type. No name, email, phone or message. */
  function evParams(data) {
    return { pathway: checked("interest"), enquirer_type: checked("who"), utm_campaign: data.utm_campaign || "", utm_source: data.utm_source || "", utm_medium: data.utm_medium || "", has_phone: data.phone ? "yes" : "no" };
  }

  var FAIL = "We couldn’t send your enquiry. Please try again.";
  function fail(data, reason) {
    sendBtn.disabled = false; sendBtn.removeAttribute("aria-busy");
    T("form_submit_failure", { pathway: checked("interest"), enquirer_type: checked("who"), reason: reason });
    showSummary([{ id: "", msg: FAIL }], "Your enquiry wasn’t sent");
  }
  function success(data) {
    T("form_submit_success", evParams(data));
    T("kukoon_enquiry_submit", evParams(data));
    form.style.display = "none"; summary.classList.remove("show"); testbox.classList.remove("show");
    thanks.classList.add("show"); thanks.setAttribute("tabindex", "-1"); thanks.focus();
    thanks.scrollIntoView({ block: "center" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    testbox.classList.remove("show");
    var errs = validate(); showSummary(errs);
    if (errs.length) return;
    /* Spam protection: honeypot + minimum fill time */
    var tooFast = (Date.now() - loaded) / 1000 < (cfg.minSeconds || 3);
    if (val("website")) { return; }
    if (tooFast) { showSummary([{ id: "message", msg: "That was quick. Please check your details and send again." }]); return; }
    var data = payload();
    if (!cfg.endpoint) {
      if (isStaging) {
        var shown = JSON.parse(JSON.stringify(data));
        testbox.querySelector("pre").textContent = JSON.stringify(shown, null, 2);
        testbox.classList.add("show");
        testbox.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        fail(data, "no_endpoint");   /* never show success when nothing was delivered */
      }
      return;
    }
    sendBtn.disabled = true; sendBtn.setAttribute("aria-busy", "true");
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(data).toString(), signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        clearTimeout(timer);
        if (r && r.ok) success(data); else fail(data, "http_" + (r ? r.status : "none"));
      })
      .catch(function () { clearTimeout(timer); fail(data, "network"); });
  });
})();
