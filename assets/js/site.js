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
  var loaded = Date.now();
  var summary = d.getElementById("error-summary");
  var testbox = d.getElementById("testbox");
  var thanks = d.getElementById("thanks");
  var sendBtn = form.querySelector('button[type="submit"]');

  var routes = {
    interest: { lbd: "Living by Design", sles: "SLES", sc: "Support Coordination", hi: "High Intensity & Nursing", unsure: "Not sure yet", general: "General question" },
    who: { self: "Self", other: "Someone I care about", professional: "Professional / referrer", else: "Something else" }
  };
  var labels = {
    who: { self: "I’m looking for support for myself.", other: "I’m enquiring for someone I care about.", professional: "I’m a professional making an enquiry or referral.", else: "Something else." },
    interest: { lbd: "Living by Design (ILO, individual SIL, living independently)", sles: "School Leaver Employment Supports (SLES)", sc: "Support Coordination", hi: "High Intensity Supports & Nursing", unsure: "I’m not sure yet", general: "A general question" }
  };

  /* Preselect from query string, e.g. ?who=professional&interest=general */
  try {
    var q = new URLSearchParams(location.search);
    ["who", "interest"].forEach(function (n) {
      var v = q.get(n); if (!v) return;
      var el = form.querySelector('input[name="' + n + '"][value="' + v.replace(/[^\w-]/g, "") + '"]');
      if (el) el.checked = true;
    });
  } catch (e) {}

  function val(n) { var el = form.elements[n]; return el ? el.value.trim() : ""; }
  function checked(n) { var el = form.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ""; }
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
    if (!checked("who")) errs.push(setErr(f, null, "Choose what brings you here.", "who-first"));
    f = d.getElementById("f-interest"); clearErr(f);
    if (!checked("interest")) errs.push(setErr(f, null, "Choose what you’re interested in. “I’m not sure yet” is fine.", "interest-first"));
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
    var msg = form.elements.message; f = msg.closest(".field"); clearErr(f, msg);
    if (val("message").length > 2000) errs.push(setErr(f, msg, "Please keep your message under 2,000 characters.", "message"));
    return errs;
  }
  function showSummary(errs) {
    if (!errs.length) { summary.classList.remove("show"); summary.innerHTML = ""; return; }
    var h = '<h2 id="es-h" tabindex="-1">Please fix ' + (errs.length === 1 ? "1 thing" : errs.length + " things") + " before sending</h2><ul>";
    errs.forEach(function (e) { h += '<li><a href="#' + e.id + '">' + e.msg + "</a></li>"; });
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

  function payload() {
    var who = checked("who"), interest = checked("interest");
    var tags = ["Website enquiry", "Interest: " + routes.interest[interest], "Enquirer: " + routes.who[who]];
    if (who === "professional") tags.push("Referral / professional");
    return {
      source: "kukoon-website-lets-talk",
      page: location.pathname,
      submitted_at: new Date().toISOString(),
      enquirer_type: labels.who[who],
      interest: labels.interest[interest],
      routing_tags: tags.join(","),
      name: val("name"),
      email: val("email"),
      phone: val("phone"),
      suburb_or_postcode: val("suburb"),
      message: val("message")
    };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    testbox.classList.remove("show");
    var errs = validate(); showSummary(errs);
    if (errs.length) return;
    /* Spam protection: honeypot + minimum fill time */
    var tooFast = (Date.now() - loaded) / 1000 < (cfg.minSeconds || 3);
    if (val("website") || tooFast) {
      if (tooFast && !val("website")) {
        showSummary([{ id: "message", msg: "That was quick. Please check your details and send again." }]);
      } else { done(); }
      return;
    }
    var data = payload();
    if (!cfg.endpoint) {
      testbox.querySelector("pre").textContent = JSON.stringify(data, null, 2);
      testbox.classList.add("show");
      testbox.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    sendBtn.disabled = true; sendBtn.setAttribute("aria-busy", "true");
    var body = new URLSearchParams(data).toString();
    fetch(cfg.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
      .then(done)
      .catch(function () {
        sendBtn.disabled = false; sendBtn.removeAttribute("aria-busy");
        showSummary([{ id: "message", msg: "We couldn’t send your enquiry. Please check your connection and try again." }]);
      });
  });
  function done() {
    form.style.display = "none"; summary.classList.remove("show");
    thanks.classList.add("show"); thanks.setAttribute("tabindex", "-1"); thanks.focus();
    thanks.scrollIntoView({ block: "center" });
  }
})();
