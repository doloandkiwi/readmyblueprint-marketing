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
      var f = fd.get("file");
      var big = !!(f && f.size > 8 * 1024 * 1024);
      var mb = f ? Math.round(f.size / 1048576) : 0;
      var t0 = Date.now();
      function fail(err, kind) {
        track("plan_request_failed", { source: source, kind: kind, error: String(err && err.message || err).slice(0, 120), file_mb: mb, ms: Date.now() - t0, attempt: attempt });
        btn.disabled = false; btn.textContent = "Send my plans";
        msg.className = "sp-msg err";
        msg.textContent = (err && err.message ? err.message + " " : "") + (big ? "If it keeps failing, email the PDF to support@readmyblueprint.com. " : "You can also email the plans to support@readmyblueprint.com.");
      }
      var attempt = 0;
      function send() {
        attempt++;
        var x = new XMLHttpRequest();
        x.open("POST", API);
        x.timeout = 300000;
        if (big) msg.textContent = "This file is large; it's uploading, please keep this page open.";
        x.upload.onprogress = function (ev) {
          if (big && ev.lengthComputable) {
            var pct = Math.round(ev.loaded / ev.total * 100);
            btn.textContent = "Uploading " + pct + "%";
          }
        };
        function netfail(kind) {
          if (attempt < 2) { msg.textContent = "Connection hiccup, retrying" + (big ? " (keep this page open)" : "") + "..."; setTimeout(send, 1500); return; }
          fail(new Error("The upload did not go through."), kind);
        }
        x.onerror = function () { netfail("network"); };
        x.ontimeout = function () { netfail("timeout"); };
        x.onload = function () {
          var j = {}; try { j = JSON.parse(x.responseText); } catch (e) {}
          if (x.status >= 200 && x.status < 300) {
            track("plan_request_submitted", { source: source, has_file: !!fd.get("file"), attempt: attempt, ms: Date.now() - t0 });
            form.innerHTML = '<p class="sp-done"><b>Got it.</b> We will run your plans and email the counts back, usually the same day. We flag anything uncertain for you to confirm.</p>';
          } else if (x.status >= 500 || x.status === 0) {
            netfail("http_" + x.status);
          } else {
            fail(new Error(typeof j.detail === "string" ? j.detail : "Could not send."), "http_" + x.status);
          }
        };
        x.send(fd);
      }
      send();
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
