// Done-for-you path: <form data-send-plans data-source="start_v2"> posts name + email + link/PDF
// to the app backend (/leads/plan-request) and fires PostHog + GA4 events.
// Falls back to a mailto: link if the backend can't be reached.
(function () {
  var API = "https://readmyblueprint.onrender.com/leads/plan-request";
  function track(name, props) {
    props = props || {};
    props.page_path = location.pathname;
    try { if (window.posthog) window.posthog.capture(name, props); } catch (e) {}
    try { if (typeof window.gtag === "function") window.gtag("event", name, props); } catch (e) {}
  }
  window.rmbTrack = track;
  document.querySelectorAll("form[data-send-plans]").forEach(function (form) {
    var source = form.getAttribute("data-source") || "unknown";
    var msg = form.querySelector(".sp-msg");
    var btn = form.querySelector("button[type=submit]");
    var started = false;
    form.addEventListener("focusin", function () {
      if (!started) { started = true; track("plan_request_started", { source: source }); }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var file = fd.get("file");
      if (file && !file.size) fd.delete("file");
      var link = String(fd.get("link") || "").trim();
      if (!fd.get("file") && !link) {
        msg.textContent = "Attach a PDF or paste a link to the plans.";
        msg.className = "sp-msg err";
        return;
      }
      fd.set("source", source);
      btn.disabled = true; btn.textContent = "Sending…"; msg.textContent = ""; msg.className = "sp-msg";
      fetch(API, { method: "POST", body: fd })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(typeof res.j.detail === "string" ? res.j.detail : "Could not send.");
          track("plan_request_submitted", { source: source, has_file: !!fd.get("file") });
          form.innerHTML = '<p class="sp-done"><b>Got it.</b> We will run your plans and email the counts back, usually the same day. We flag anything uncertain for you to confirm.</p>';
        })
        .catch(function (err) {
          track("plan_request_failed", { source: source });
          btn.disabled = false; btn.textContent = "Send my plans";
          msg.className = "sp-msg err";
          msg.innerHTML = (err && err.message ? err.message + " " : "") + 'You can also email the plans to <a href="mailto:support@readmyblueprint.com?subject=Plan%20set%20for%20a%20takeoff">support@readmyblueprint.com</a>.';
        });
    });
  });
  // click tracking for elements tagged data-track="event_name"
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-track]");
    if (el) track(el.getAttribute("data-track"), { source: el.getAttribute("data-source") || "" });
  });
  var v = document.querySelector("[data-view-event]");
  if (v) track(v.getAttribute("data-view-event"), {});
})();
