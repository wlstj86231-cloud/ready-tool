// After `vite build`: writes sitemap.xml, robots.txt and _redirects into dist/, then checks
// that every internal link in the built HTML points at a page that exists (or a redirect).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { toolPages } from "../vite.config.js";
import { retired } from "./retired-routes.mjs";
import { ADSENSE_ACCOUNT, OPERATOR_LINE, ORG_ID } from "./site-shell.mjs";

const root = join(import.meta.dirname, "..");
const dist = join(root, "dist");
const base = "https://goatool.com";
const SITE_UPDATED = "2026-10-26";

// Pages whose lastmod is not read from their own JSON-LD.
// The Mongolian pages (/mn/) are noindex and stay out of the sitemap: Mongolian is not an
// AdSense-supported language, so they carry no ads and are kept only for Mongolian users.
const infoPages = ["/about/", "/contact/", "/editorial/", "/corrections/", "/privacy/", "/terms/"];
const mnPages = ["/mn/", "/mn/cashmere-evidence/", "/mn/tractor-evidence/"];
const fixedLastmod = {
  "/": SITE_UPDATED,
  ...Object.fromEntries(infoPages.map((path) => [path, SITE_UPDATED])),
  ...Object.fromEntries(toolPages.map((name) => [`/tools/${name}/`, SITE_UPDATED])),
};

const guideDir = join(dist, "agri", "guides");
const guidePaths = readdirSync(guideDir)
  .filter((name) => statSync(join(guideDir, name)).isDirectory())
  .map((name) => `/agri/guides/${name}/`);
const lastmodFromPage = (path) => {
  const html = readFileSync(join(dist, path, "index.html"), "utf8");
  return /"dateModified":"(\d{4}-\d{2}-\d{2})"/.exec(html)?.[1] || SITE_UPDATED;
};
const guideLastmods = guidePaths.map(lastmodFromPage);
const hubLastmod = guideLastmods.sort().at(-1);

const urls = [
  ...Object.keys(fixedLastmod).map((path) => [path, fixedLastmod[path]]),
  ["/agri/guides/", hubLastmod],
  ...guidePaths.map((path) => [path, lastmodFromPage(path)]),
];

for (const [path] of urls) {
  if (!existsSync(join(dist, path, "index.html"))) throw new Error(`sitemap page missing in dist: ${path}`);
  if (retired[path]) throw new Error(`retired page listed in sitemap: ${path}`);
}

writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(([path, lastmod]) => `  <url><loc>${base}${path}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`,
  "utf8"
);

writeFileSync(
  join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n#DaumWebMasterTool:0af7bc53e83dfbe74ea2705325e06258126ee9e8044810a6eaa044087cbd3a42:dSlZXvWuL7UAVoESNn1QCg==\n`,
  "utf8"
);

const redirectLines = [];
for (const [from, to] of Object.entries(retired)) {
  if (existsSync(join(dist, from, "index.html"))) throw new Error(`retired page still built: ${from}`);
  redirectLines.push(`${from} ${to} 301`, `${from.replace(/\/$/, "")} ${to} 301`);
}
writeFileSync(join(dist, "_redirects"), `${redirectLines.join("\n")}\n`, "utf8");

// Internal link check over every built HTML page.
const htmlFiles = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".html")) htmlFiles.push(full);
  }
};
walk(dist);
const broken = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const path = decodeURI(href.split(/[?#]/)[0]);
    if (!path || path === "/") continue;
    const target = join(dist, path);
    const ok = path.endsWith("/") ? existsSync(join(target, "index.html")) : existsSync(target) || existsSync(join(target, "index.html"));
    if (!ok && !retired[path]) broken.push(`${relative(dist, file).split(sep).join("/")}: ${href}`);
  }
}
if (broken.length) throw new Error(`broken internal links:\n${broken.join("\n")}`);

// Trust checks on every sitemap page: footer operator line and policy links, AdSense account
// meta, JSON-LD that parses and names the operator; guides and tools also need the meta block,
// a source list and a 범위와 한계 note. Tool pages must not load ads.
const problems = [];
for (const [path] of urls) {
  const html = readFileSync(join(dist, path, "index.html"), "utf8");
  const need = (ok, what) => ok || problems.push(`${path}: ${what}`);
  need(html.includes(OPERATOR_LINE), "footer operator line");
  for (const link of ["/about/", "/contact/", "/editorial/", "/privacy/", "/terms/"]) need(html.includes(`href="${link}"`), `footer link ${link}`);
  need(html.includes(`name="google-adsense-account" content="${ADSENSE_ACCOUNT}"`), "AdSense account meta");
  need(!/name="robots" content="[^"]*noindex/.test(html), "noindex on a sitemap page");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  need(blocks.length > 0, "JSON-LD");
  for (const block of blocks) {
    try {
      need(JSON.stringify(JSON.parse(block)).includes(ORG_ID), "JSON-LD without the operator @id");
    } catch {
      problems.push(`${path}: JSON-LD does not parse`);
    }
  }
  const isGuide = path.startsWith("/agri/guides/") && path !== "/agri/guides/";
  const isTool = path.startsWith("/tools/");
  if (isGuide || isTool) {
    need(html.includes('class="page-meta"') && html.includes("게시일") && html.includes("최종 확인일"), "meta block");
    need(html.includes('id="sources"'), "출처 section");
    need(html.includes("범위와 한계"), "범위와 한계 section");
  }
  if (isTool) need(!html.includes("adsbygoogle"), "ads on a tool page");
}
for (const path of mnPages) {
  if (urls.some(([url]) => url === path)) problems.push(`${path}: Mongolian page listed in sitemap`);
  const html = readFileSync(join(dist, path, "index.html"), "utf8");
  if (!/name="robots" content="noindex/.test(html)) problems.push(`${path}: Mongolian page must be noindex`);
  if (html.includes("adsbygoogle")) problems.push(`${path}: Mongolian page must not load ads`);
}
if (problems.length) throw new Error(`trust checks failed:\n${problems.join("\n")}`);

console.log(`sitemap ${urls.length} urls, ${redirectLines.length} redirect rules, ${htmlFiles.length} html files link-checked`);
