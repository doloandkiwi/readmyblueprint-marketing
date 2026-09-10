(function(){
  "use strict";

  var TREE = {
    root: {
      bot: "Hey — I can help point you in the right direction. What are you trying to do?",
      options: [
        { label: "See if my trade is covered", next: "trade" },
        { label: "Understand pricing", next: "pricing" },
        { label: "I have a plan set ready to try", next: "ready" },
        { label: "Talk to a real person", next: "human" }
      ]
    },
    trade: {
      bot: "Which of these is closest to your plan set?",
      options: [
        { label: "Wood or metal framing", next: "trade_covered", data: { page: "/wood-framing-takeoff.html", name: "wood and metal framing" } },
        { label: "Drywall, insulation, or CMU block", next: "trade_covered", data: { page: "/drywall-takeoff.html", name: "drywall, insulation, and CMU" } },
        { label: "Something else (electrical, plumbing, roofing…)", next: "trade_not_covered" },
        { label: "← Back to menu", next: "root" }
      ]
    },
    trade_covered: {
      bot: function(data){ return "Good news — ReadMyBlueprint auto-detects " + data.name + " directly from the drawing, with quantities traced back to the real geometry, not a guess."; },
      options: [
        { label: "See how that works", href: function(data){ return data.page; } },
        { label: "Try it — $15 for my first plan set", href: "https://app.readmyblueprint.com" },
        { label: "← Back to menu", next: "root" }
      ]
    },
    trade_not_covered: {
      bot: "Being straight with you: we don't auto-detect that yet. Today it's steel & wood framing, drywall, plywood, insulation, and CMU block — that's the real ceiling right now, not a \"coming soon.\" If those five make up most of your plan set, the rest is just something you'd still count by hand.",
      options: [
        { label: "See exactly what's covered", href: "/compare.html" },
        { label: "← Back to menu", next: "root" }
      ]
    },
    pricing: {
      bot: "It's flat, not per-seat: your first plan set is $15, no subscription required. If you're running more than a few a month, Solo Estimator is $199/mo for 10 plan sets. No sales call, no quote request either way.",
      options: [
        { label: "See full pricing", href: "/#pricing" },
        { label: "← Back to menu", next: "root" }
      ]
    },
    ready: {
      bot: "You can upload it right now — there's no sales call in the way. If you'd rather see it work on someone else's plan set first, the interactive tour walks through the exact same screens.",
      options: [
        { label: "Get started — $15", href: "https://app.readmyblueprint.com" },
        { label: "Take the interactive tour first", href: "/tour.html" },
        { label: "← Back to menu", next: "root" }
      ]
    },
    human: {
      bot: "Sure thing — we keep support simple. A real person (not a bot) reads every message here.",
      options: [
        { label: "Email support@readmyblueprint.com", href: "mailto:support@readmyblueprint.com" },
        { label: "Call (651) 269-2249", href: "tel:+16512692249" },
        { label: "← Back to menu", next: "root" }
      ]
    }
  };

  var css = ""
    + "#rmb-chat-btn{position:fixed;bottom:22px;right:22px;width:56px;height:56px;border-radius:99px;background:var(--accent,#d9622b);color:#fff;border:none;box-shadow:0 6px 20px -6px rgba(0,0,0,.35);cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;transition:transform .15s ease;}"
    + "#rmb-chat-btn:hover{transform:scale(1.06);}"
    + "#rmb-chat-btn svg{width:26px;height:26px;fill:#fff;}"
    + "#rmb-chat-panel{position:fixed;bottom:90px;right:22px;width:min(340px,calc(100vw - 32px));max-height:min(480px,calc(100vh - 130px));background:var(--surface,#fff);border:1px solid var(--line,#dcd5c2);border-radius:16px;box-shadow:var(--shadow,0 12px 32px -16px rgba(0,0,0,.3));z-index:9999;display:none;flex-direction:column;overflow:hidden;font-family:var(--body,system-ui,sans-serif);}"
    + "#rmb-chat-panel.open{display:flex;}"
    + "#rmb-chat-head{background:var(--blue-deep,#0d2b4e);color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}"
    + "#rmb-chat-head strong{font-family:var(--display,inherit);font-size:.95rem;}"
    + "#rmb-chat-head span{display:block;font-size:.74rem;color:#c7d5e8;margin-top:1px;}"
    + "#rmb-chat-close{background:none;border:none;color:#fff;opacity:.8;cursor:pointer;font-size:1.1rem;line-height:1;padding:4px;}"
    + "#rmb-chat-close:hover{opacity:1;}"
    + "#rmb-chat-body{padding:16px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px;}"
    + ".rmb-msg{background:var(--surface-2,#eeeadb);color:var(--ink,#0f1b2d);border-radius:12px;border-top-left-radius:4px;padding:10px 13px;font-size:.9rem;line-height:1.45;max-width:92%;}"
    + ".rmb-opts{display:flex;flex-direction:column;gap:7px;}"
    + ".rmb-opt{text-align:left;background:var(--surface,#fff);border:1px solid var(--line,#dcd5c2);color:var(--blue,#1a4d8f);border-radius:10px;padding:8px 12px;font-size:.86rem;font-family:inherit;cursor:pointer;text-decoration:none;display:block;transition:background .15s ease,border-color .15s ease;}"
    + ".rmb-opt:hover{background:var(--blue-soft,#e7eef7);border-color:var(--blue,#1a4d8f);}"
    + "#rmb-chat-foot{border-top:1px solid var(--line,#dcd5c2);padding:8px 14px;font-size:.72rem;color:var(--muted,#5c6470);text-align:center;flex-shrink:0;}"
    + "@media (max-width:480px){#rmb-chat-panel{right:16px;bottom:82px;} #rmb-chat-btn{right:16px;bottom:16px;}}";

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var btn = document.createElement("button");
  btn.id = "rmb-chat-btn";
  btn.setAttribute("aria-label", "Chat with ReadMyBlueprint");
  btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4.7 3.5A.5.5 0 0 1 2.5 20V6a1 1 0 0 1 1-1z"/></svg>';

  var panel = document.createElement("div");
  panel.id = "rmb-chat-panel";
  panel.innerHTML =
    '<div id="rmb-chat-head"><div><strong>ReadMyBlueprint</strong><span>Usually answers in a few clicks</span></div><button id="rmb-chat-close" aria-label="Close chat">✕</button></div>' +
    '<div id="rmb-chat-body"></div>' +
    '<div id="rmb-chat-foot">Scripted answers, not AI — for anything else, email support@readmyblueprint.com</div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var bodyEl = panel.querySelector("#rmb-chat-body");
  var closeBtn = panel.querySelector("#rmb-chat-close");
  var opened = false;

  function renderNode(key, data){
    var node = TREE[key];
    if (!node) return;
    var botText = typeof node.bot === "function" ? node.bot(data || {}) : node.bot;

    var msg = document.createElement("div");
    msg.className = "rmb-msg";
    msg.textContent = botText;
    bodyEl.appendChild(msg);

    var opts = document.createElement("div");
    opts.className = "rmb-opts";
    node.options.forEach(function(opt){
      var href = typeof opt.href === "function" ? opt.href(data || {}) : opt.href;
      var el;
      if (href) {
        el = document.createElement("a");
        el.href = href;
        if (href.indexOf("http") === 0) { el.target = "_blank"; el.rel = "noopener noreferrer"; }
      } else {
        el = document.createElement("button");
        el.type = "button";
      }
      el.className = "rmb-opt";
      el.textContent = opt.label;
      el.addEventListener("click", function(){
        var choiceMsg = document.createElement("div");
        choiceMsg.className = "rmb-msg";
        choiceMsg.style.alignSelf = "flex-end";
        choiceMsg.style.background = "var(--blue-soft, #e7eef7)";
        choiceMsg.textContent = opt.label;
        opts.replaceWith(choiceMsg);
        if (opt.next) renderNode(opt.next, opt.data);
        bodyEl.scrollTop = bodyEl.scrollHeight;
      });
      opts.appendChild(el);
    });
    bodyEl.appendChild(opts);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  btn.addEventListener("click", function(){
    opened = !opened;
    panel.classList.toggle("open", opened);
    if (opened && !bodyEl.hasChildNodes()) {
      renderNode("root");
    }
  });
  closeBtn.addEventListener("click", function(){
    opened = false;
    panel.classList.remove("open");
  });
})();
