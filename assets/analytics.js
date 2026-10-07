(function () {
  var GA4_ID = "G-QYSRNLSF27";
  var APP_ORIGIN = "https://app.readmyblueprint.com";
  // gclid is Google Ads' auto-tagging click id: carried to the app like the
  // UTMs so a paying customer can be matched back to the exact ad click.
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid"];
  var STORE_KEY = "rmb_utm";

  // Pages now start GA in an inline <head> snippet (so a visitor who bounces
  // within a second of arriving from an ad is still counted -- this file is
  // `defer`red and would otherwise only start GA after the whole page parsed).
  // Only boot GA here for any page that doesn't have that snippet.
  var gtag = window.gtag;
  if (typeof gtag !== "function") {
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    gtag = function () {
      dataLayer.push(arguments);
    };
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA4_ID);
  }

  // PostHog: funnels + session replay, to see where visitors drop off.
  // The project key (phc_...) is public by design, like the GA4 id. Empty = off.
  // EU/UK cookie consent (owner 10/07). Visitors whose time zone is in Europe see a banner;
  // GA4 runs in Consent Mode (denied by default for EEA/UK/CH, set in each page's <head>)
  // and PostHog stays off until they accept. Everyone else is unaffected.
  var CONSENT_KEY = "rmb_consent";
  function storedConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var inEurope = /^Europe\//.test(tz) || /^(Atlantic\/(Canary|Madeira|Azores|Reykjavik)|Arctic\/Longyearbyen)$/.test(tz);
  var consent = storedConsent();
  var trackingAllowed = !inEurope || consent === "granted";

  var POSTHOG_KEY = "phc_qQnLaGouHUr36rXR3TkjrynAL3tDXYgmYeAaY2ZNqY28";
  var POSTHOG_HOST = "https://us.i.posthog.com";
  if (POSTHOG_KEY && !window.posthog) {
    // Official PostHog loader stub: queues calls until /static/array.js arrives.
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister identify alias people.set people.set_once set_config reset get_distinct_id get_session_id startSessionRecording stopSessionRecording opt_in_capturing opt_out_capturing has_opted_out_capturing".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      defaults: "2026-05-30",
      person_profiles: "identified_only",
      session_recording: { maskAllInputs: true },
      opt_out_capturing_by_default: !trackingAllowed,
    });
  }

  function setConsent(granted) {
    try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch (e) {}
    var v = granted ? "granted" : "denied";
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
    }
    if (POSTHOG_KEY && window.posthog) {
      if (granted) window.posthog.opt_in_capturing(); else window.posthog.opt_out_capturing();
    }
    var el = document.getElementById("rmb-consent");
    if (el) el.remove();
  }
  function showConsentBanner() {
    if (document.getElementById("rmb-consent")) return;
    var d = document.createElement("div");
    d.id = "rmb-consent";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-label", "Cookie choices");
    d.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;" +
      "background:#15171c;color:#fff;border-radius:14px;padding:16px 18px;font:14px/1.45 Inter,system-ui,sans-serif;" +
      "box-shadow:0 12px 40px rgba(0,0,0,.25);display:flex;flex-wrap:wrap;gap:12px;align-items:center";
    d.innerHTML = '<span style="flex:1 1 280px">We use cookies to measure how the site is used (Google Analytics, PostHog) and whether our ads work. ' +
      'Nothing is used unless you agree. <a href="/privacy.html" style="color:#fff;text-decoration:underline">Privacy</a></span>' +
      '<span style="display:flex;gap:8px">' +
      '<button type="button" data-c="0" style="background:transparent;color:#fff;border:1px solid #6b7280;border-radius:999px;padding:8px 16px;font:inherit;cursor:pointer">Decline</button>' +
      '<button type="button" data-c="1" style="background:#fff;color:#15171c;border:0;border-radius:999px;padding:8px 16px;font:inherit;font-weight:600;cursor:pointer">Accept</button></span>';
    d.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-c]");
      if (b) setConsent(b.getAttribute("data-c") === "1");
    });
    document.body.appendChild(d);
  }
  if (inEurope && !consent) {
    if (document.body) showConsentBanner(); else document.addEventListener("DOMContentLoaded", showConsentBanner);
  }
  function phCapture(name, props) {
    if (POSTHOG_KEY && window.posthog) window.posthog.capture(name, props);
  }

  // Remember the campaign a visitor arrived on (e.g. a per-contact outreach link)
  // so it survives page-to-page browsing and is handed to the app at signup.
  function readStoredUtm() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  var params = new URLSearchParams(window.location.search);
  var incoming = {};
  var hasIncoming = false;
  UTM_KEYS.forEach(function (k) {
    var v = params.get(k);
    if (v) {
      incoming[k] = v;
      hasIncoming = true;
    }
  });
  if (hasIncoming) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(incoming));
    } catch (e) {}
  }
  var utm = hasIncoming ? incoming : readStoredUtm();

  function isLoginLink(a) {
    return /\b(log\s?in|sign\s?in)\b/i.test(a.textContent || "");
  }

  function decorate(a) {
    var url;
    try {
      url = new URL(a.href);
    } catch (e) {
      return;
    }
    if (!isLoginLink(a)) url.searchParams.set("signup", "1");
    if (utm) {
      UTM_KEYS.forEach(function (k) {
        if (utm[k] && !url.searchParams.has(k)) url.searchParams.set(k, utm[k]);
      });
    }
    a.href = url.toString();
  }

  function appLinks() {
    return document.querySelectorAll('a[href^="' + APP_ORIGIN + '"]');
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      appLinks().forEach(decorate);
    });
  } else {
    appLinks().forEach(decorate);
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest('a[href^="' + APP_ORIGIN + '"]');
      if (!a) return;
      var isLogin = isLoginLink(a);
      var props = {
        link_text: (a.textContent || "").trim().slice(0, 60),
        page_path: window.location.pathname,
        cta_section: (a.closest("nav") && "nav") || (a.closest("footer") && "footer") || "body",
        campaign_content: utm && utm.utm_content,
        campaign_term: utm && utm.utm_term,
      };
      gtag("event", isLogin ? "login_click" : "cta_click", props);
      phCapture(isLogin ? "login_click" : "cta_click", props);
    },
    true
  );
})();
