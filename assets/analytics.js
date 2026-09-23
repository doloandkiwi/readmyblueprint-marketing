(function () {
  var GA4_ID = "G-QYSRNLSF27";
  var APP_ORIGIN = "https://app.readmyblueprint.com";
  // gclid is Google Ads' auto-tagging click id: carried to the app like the
  // UTMs so a paying customer can be matched back to the exact ad click.
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid"];
  var STORE_KEY = "rmb_utm";

  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA4_ID);

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
      gtag("event", isLogin ? "login_click" : "cta_click", {
        link_text: (a.textContent || "").trim().slice(0, 60),
        page_path: window.location.pathname,
        cta_section: (a.closest("nav") && "nav") || (a.closest("footer") && "footer") || "body",
        campaign_content: utm && utm.utm_content,
        campaign_term: utm && utm.utm_term,
      });
    },
    true
  );
})();
