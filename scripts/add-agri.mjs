import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const file = join(dist, "sitemap.xml");
const modified = "2026-09-20";
const agriHubModified = "2026-09-27";
const urls = [
  "https://goatool.com/agri/",
  "https://goatool.com/agri/guides/",
  "https://goatool.com/agri/guides/direct-sale-settlement-files/",
  "https://goatool.com/agri/guides/pack-unit-kg-files/",
  "https://goatool.com/agri/guides/fruit-box-kg-files/",
  "https://goatool.com/agri/guides/produce-box-kg-files/",
  "https://goatool.com/agri/guides/used-machinery-handover-files/",
  "https://goatool.com/agri/guides/farm-supplies-disposal-records/",
  "https://goatool.com/agri/guides/listing-photo-files/",
  "https://goatool.com/agri/guides/machinery-listing-files/",
  "https://goatool.com/agri/guides/listing-date-columns/",
];

let xml = readFileSync(file, "utf8");
const entries = urls
  .filter((url) => !xml.includes(`<loc>${url}</loc>`))
  .map((url) => `  <url><loc>${url}</loc><changefreq>monthly</changefreq><lastmod>${url === urls[0] ? agriHubModified : modified}</lastmod><priority>${url === urls[0] ? "0.9" : "0.8"}</priority></url>`)
  .join("\n");
if (entries) xml = xml.replace("</urlset>", `${entries}\n</urlset>`);
xml = xml.replace(
  /(<loc>https:\/\/goatool.com\/agri\/<\/loc><changefreq>monthly<\/changefreq><lastmod>)[^<]+/,
  (_match, prefix) => `${prefix}${agriHubModified}`,
);
writeFileSync(file, xml);
console.log(`added ${urls.length} goatool agricultural URLs`);
