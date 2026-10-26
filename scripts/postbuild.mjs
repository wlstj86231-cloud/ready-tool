// After `vite build`: writes sitemap.xml, robots.txt and _redirects into dist/, then checks
// that every internal link in the built HTML points at a page that exists (or a redirect).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { toolPages } from "../vite.config.js";
import { retired } from "./retired-routes.mjs";

const root = join(import.meta.dirname, "..");
const dist = join(root, "dist");
const base = "https://goatool.com";
const SITE_UPDATED = "2026-10-26";

// Pages whose lastmod is not read from their own JSON-LD.
const fixedLastmod = {
  "/": SITE_UPDATED,
  "/about/": SITE_UPDATED,
  "/privacy/": SITE_UPDATED,
  "/terms/": SITE_UPDATED,
  "/contact/": SITE_UPDATED,
  "/mn/": "2026-09-24",
  "/mn/cashmere-evidence/": "2026-09-25",
  "/mn/tractor-evidence/": "2026-09-25",
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

console.log(`sitemap ${urls.length} urls, ${redirectLines.length} redirect rules, ${htmlFiles.length} html files link-checked`);
