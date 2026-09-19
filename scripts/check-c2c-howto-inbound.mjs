import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const expected = [
  ["listing-photo-files", "produce-listing-three-fields", "판매글 사진 순번·원본·공개본 묶기"],
  ["machinery-listing-files", "used-machinery-listing-nameplate", "명판·시간계·작업기 사진 파일 묶기"],
  ["listing-date-columns", "kimjang-rice-listing-dates", "출하가능일·도정일 열 만들기"],
];
const errors = [];

for (const [slug, dest, h1] of expected) {
  const html = await fs.readFile(path.join(root, "public", "agri", "guides", slug, "index.html"), "utf8");
  const header = html.slice(html.indexOf("<header>"), html.indexOf("</header>") + 9);
  if (header.includes("보리장터")) errors.push(`${slug}: header has 보리장터`);
  if (!html.includes(`<h1>${h1}</h1>`)) errors.push(`${slug}: H1 mismatch`);
  if (!html.includes("utm_campaign=c2c_howto_202609")) errors.push(`${slug}: missing campaign`);
  if (!html.includes(`utm_content=${slug}`)) errors.push(`${slug}: missing utm_content`);
  if (!html.includes(`https://boribay.com/guides/${dest}?`)) errors.push(`${slug}: missing dest ${dest}`);
  if ((html.match(/boribay.com\/guides\//g) || []).length !== 1) errors.push(`${slug}: expected 1 boribay guide href`);
  if (html.includes("garak-cabbage-price-lookup") || html.includes("garak-market-price-lookup")) errors.push(`${slug}: Garak dest`);
  if (html.includes("occultworldcup") || html.includes("yomiwiki") || html.includes("reportools") || html.includes("scamreader")) errors.push(`${slug}: satellite-to-satellite`);
}

const pack = await fs.readFile(path.join(root, "public", "agri", "guides", "pack-unit-kg-files", "index.html"), "utf8");
if (!pack.includes("utm_campaign=agri_document_guides")) errors.push("pack-unit campaign rewritten");
if (!pack.includes("garak-cabbage-price-lookup")) errors.push("pack-unit cabbage dest missing");

const agriHome = await fs.readFile(path.join(root, "public", "agri", "index.html"), "utf8");
if (!agriHome.includes("/agri/guides/pack-unit-kg-files/")) errors.push("agri home pack-unit card missing");
if (!agriHome.includes("utm_content=seller_ready")) errors.push("agri listings/new CTA rewritten");
const agriHeader = agriHome.slice(agriHome.indexOf("<header>"), agriHome.indexOf("</header>") + 9);
if (agriHeader.includes("보리장터")) errors.push("agri header has 보리장터");

const civic = await fs.readFile(path.join(root, "index.html"), "utf8");
if (civic.includes("garak-") || civic.includes("가락")) errors.push("civic home has Garak");
if (civic.includes("/agri/guides/listing-photo-files")) errors.push("civic home has C2C guide");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`goatool c2c inbound ok: ${expected.length} pages`);
