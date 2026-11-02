// Sticky 50/50 homepage split (11/02): control = /index.html, cta = /index-cta-variant.html.
// URL stays "/"; arm lives in cookie rmb_home_ab (readable by assets/analytics.js -> PostHog home_variant).
// Bots/crawlers always get control and no cookie. QA override: /?ab=cta or /?ab=control.
export const config = { matcher: "/" };

const BOT = /bot|crawl|spider|slurp|bing|google|yandex|baidu|duckduck|facebookexternalhit|embedly|preview|lighthouse|pingdom|uptime|headless|curl|wget|python|node-fetch|axios|go-http|java\/|monitor|semrush|ahrefs|mj12|petalbot|bytespider|gptbot|claude|perplexity|ccbot|chatgpt/i;

export default function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  if (!ua || BOT.test(ua)) return new Response(null, { headers: { "x-middleware-next": "1" } });

  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)rmb_home_ab=(control|cta)/);
  const forced = url.searchParams.get("ab");
  let arm = forced === "cta" || forced === "control" ? forced : m && m[1];
  const fresh = !m || (arm && m[1] !== arm);
  if (!arm) arm = Math.random() < 0.5 ? "cta" : "control";

  const headers = new Headers();
  if (arm === "cta") {
    const dest = new URL("/index-cta-variant.html", url);
    dest.search = url.search;
    headers.set("x-middleware-rewrite", dest.toString());
  } else {
    headers.set("x-middleware-next", "1");
  }
  if (fresh) headers.append("set-cookie", `rmb_home_ab=${arm}; Path=/; Max-Age=7776000; SameSite=Lax; Secure`);
  headers.set("cache-control", "private, no-store");
  return new Response(null, { headers });
}
