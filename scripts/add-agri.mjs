import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const file = join(dist, "sitemap.xml");
const date = "2026-08-10";
const modified = "2026-09-20";
const urls = [
  "https://goatool.com/agri/",
  "https://goatool.com/agri/guides/",
  "https://goatool.com/agri/guides/direct-sale-settlement-files/",
  "https://goatool.com/agri/guides/pack-unit-kg-files/",
  "https://goatool.com/agri/guides/fruit-box-kg-files/",
  "https://goatool.com/agri/guides/produce-box-kg-files/",
  "https://goatool.com/agri/guides/used-machinery-handover-files/",
  "https://goatool.com/agri/guides/farm-supplies-disposal-records/",
];

let xml = readFileSync(file, "utf8");
const entries = urls
  .filter((url) => !xml.includes(`<loc>${url}</loc>`))
  .map((url, index) => `  <url><loc>${url}</loc><changefreq>monthly</changefreq><lastmod>${index === 0 ? date : modified}</lastmod><priority>${index === 0 ? "0.9" : "0.8"}</priority></url>`)
  .join("\n");
if (entries) xml = xml.replace("</urlset>", `${entries}\n</urlset>`);
xml = xml.replace(
  /(<loc>https:\/\/goatool.com\/agri\/<\/loc><changefreq>monthly<\/changefreq><lastmod>)[^<]+/,
  `$1${modified}`,
);
writeFileSync(file, xml);
console.log(`added ${urls.length} goatool agricultural URLs`);
