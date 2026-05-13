import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { guideIndexMeta, guidePages } from "../src/guides.js";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "../dist");
const base = "https://goatool.com";
const lastUpdated = "2026-05-13";

const coreRoutes = [
  "/tools/file-ready/",
  "/tools/image-privacy/",
  "/tools/data-clean/",
  "/about/",
  "/privacy/",
  "/terms/",
  "/contact/",
  guideIndexMeta.path
];

const routes = [...coreRoutes, ...guidePages.map((guide) => guide.path)];
const guideByPath = new Map(guidePages.map((guide) => [guide.path, guide]));

const routeMeta = {
  "/": {
    title: "goatool - 제출 전 파일, 이미지 개인정보, CSV 정리 도구",
    description:
      "goatool은 민원, 입사지원, 학교와 기관 제출 전에 파일명, 용량, 이미지 개인정보, CSV와 엑셀 데이터를 브라우저에서 정리하는 공익형 준비 도구입니다."
  },
  "/tools/file-ready/": {
    title: "파일 준비 점검 - goatool",
    description:
      "여러 파일의 파일명, 용량, 확장자, 중복 여부를 확인하고 제출용 ZIP과 점검표를 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["파일명 점검", "SHA-256 해시", "제출용 ZIP", "점검표 TXT"]
  },
  "/tools/image-privacy/": {
    title: "이미지 개인정보 정리 - goatool",
    description:
      "사진과 캡처 이미지를 캔버스로 다시 저장해 EXIF 노출 가능성을 줄이고 제출용 이미지 ZIP을 만듭니다.",
    type: "SoftwareApplication",
    features: ["캔버스 재저장", "EXIF 노출 가능성 감소", "이미지 리사이즈", "결과 ZIP"]
  },
  "/tools/data-clean/": {
    title: "CSV·엑셀 정리 - goatool",
    description:
      "CSV와 XLSX 표의 앞뒤 공백, 빈 행과 빈 열, 중복 행을 정리하고 CSV 또는 XLSX로 다시 내려받습니다.",
    type: "SoftwareApplication",
    features: ["CSV 정리", "XLSX 첫 번째 시트 읽기", "빈 행 제거", "중복 행 제거"]
  },
  "/about/": {
    title: "소개 - goatool",
    description: "goatool은 제출 전 파일 준비와 개인정보 정리를 돕는 공익형 브라우저 도구 모음입니다."
  },
  "/privacy/": {
    title: "개인정보 처리방침 - goatool",
    description: "goatool은 파일을 서버로 업로드하지 않고 브라우저 안에서 처리하는 것을 우선합니다."
  },
  "/terms/": {
    title: "이용안내 - goatool",
    description: "goatool의 브라우저 기반 파일 준비 도구 이용 기준과 주의사항을 안내합니다."
  },
  "/contact/": {
    title: "문의 - goatool",
    description: "goatool 개선 제안과 오류 제보를 위한 안내 페이지입니다."
  },
  [guideIndexMeta.path]: {
    title: guideIndexMeta.metaTitle,
    description: guideIndexMeta.description,
    type: "CollectionPage"
  }
};

const indexHtml = readFileSync(join(dist, "index.html"), "utf8");

writeFileSync(join(dist, "index.html"), htmlForRoute("/", indexHtml), "utf8");

for (const route of routes) {
  const dir = join(dist, route);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), htmlForRoute(route, indexHtml), "utf8");
}

const urls = ["/", ...routes];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((path) => `  <url><loc>${base}${path}</loc><changefreq>monthly</changefreq><lastmod>${lastUpdated}</lastmod></url>`)
  .join("\n")}\n</urlset>\n`;

writeFileSync(join(dist, "sitemap.xml"), sitemap, "utf8");
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`, "utf8");

function htmlForRoute(route, html) {
  const meta = metaForRoute(route);
  const url = `${base}${route}`;
  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapeAttr(meta.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeAttr(meta.title)}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapeAttr(meta.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(
      /<script(?:\s+id="goatool-structured-data")?\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script id="goatool-structured-data" type="application/ld+json">${JSON.stringify(schemaForRoute(route, meta, url))}</script>`
    )
    .replace(/<div id="app"><\/div>/, `<div id="app">${fallbackForRoute(route, meta)}</div>`);
}

function metaForRoute(route) {
  const guide = guideByPath.get(route);
  if (guide) {
    return {
      title: guide.metaTitle,
      description: guide.description,
      type: "Article",
      guide
    };
  }
  return routeMeta[route] || routeMeta["/"];
}

function fallbackForRoute(route, meta) {
  if (meta.guide) return guideFallback(meta.guide);
  if (route === guideIndexMeta.path) return guideIndexFallback();

  const links = [
    ["/tools/file-ready/", "파일 준비 점검"],
    ["/tools/image-privacy/", "이미지 개인정보 정리"],
    ["/tools/data-clean/", "CSV·엑셀 정리"],
    ["/guides/", "전문 가이드"],
    ["/about/", "소개"],
    ["/privacy/", "개인정보 처리방침"]
  ];
  const featureList = (meta.features || []).map((feature) => `<li>${escapeHtml(feature)}</li>`).join("");
  const featureBlock = featureList
    ? `<section><h2>주요 처리 기준</h2><ul>${featureList}</ul></section>`
    : "";

  return `
    <main class="static-fallback" aria-label="goatool 정적 페이지 요약">
      <p class="static-kicker">goatool</p>
      <h1>${escapeHtml(meta.title.replace(" - goatool", ""))}</h1>
      <p>${escapeHtml(meta.description)}</p>
      ${featureBlock}
      <nav aria-label="goatool 주요 페이지">
        ${links
          .map(([href, label]) => `<a href="${href}"${href === route ? ' aria-current="page"' : ""}>${label}</a>`)
          .join("")}
      </nav>
    </main>
  `;
}

function guideIndexFallback() {
  return `
    <main class="static-fallback static-guide-index" aria-label="goatool 전문 가이드 목록">
      <p class="static-kicker">goatool guide</p>
      <h1>${escapeHtml(guideIndexMeta.title)}</h1>
      <p>${escapeHtml(guideIndexMeta.description)}</p>
      <section>
        <h2>전체 가이드 ${guidePages.length}개</h2>
        <ul>
          ${guidePages.map((guide) => `<li><a href="${guide.path}">${escapeHtml(guide.title)}</a> - ${escapeHtml(guide.keyword)}</li>`).join("")}
        </ul>
      </section>
    </main>
  `;
}

function guideFallback(guide) {
  return `
    <main class="static-fallback static-guide-article" aria-label="${escapeAttr(guide.title)} 정적 본문">
      <article>
        <p class="static-kicker">${escapeHtml(guide.category)}</p>
        <h1>${escapeHtml(guide.title)}</h1>
        <p>${escapeHtml(guide.description)}</p>
        <p>최종 검수 ${guide.dateModified} · 공백 제외 ${guide.nonSpaceLength.toLocaleString("ko-KR")}자 · ${escapeHtml(guide.keyword)}</p>
        ${guide.sections
          .map(
            (section) => `
              <section>
                <h2>${escapeHtml(section.title)}</h2>
                ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                ${section.items ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
              </section>
            `
          )
          .join("")}
        <nav aria-label="관련 페이지">
          <a href="/guides/">전체 전문 가이드</a>
          <a href="/tools/file-ready/">파일 준비 점검</a>
          <a href="/tools/image-privacy/">이미지 개인정보 정리</a>
          <a href="/tools/data-clean/">CSV·엑셀 정리</a>
        </nav>
      </article>
    </main>
  `;
}

function schemaForRoute(route, meta, url) {
  if (meta.type === "Article" && meta.guide) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.guide.title,
      name: meta.guide.title,
      url,
      inLanguage: "ko-KR",
      description: meta.guide.description,
      datePublished: meta.guide.dateModified,
      dateModified: meta.guide.dateModified,
      author: { "@type": "Organization", name: "goatool", url: base },
      publisher: { "@type": "Organization", name: "goatool", url: base },
      articleSection: meta.guide.category,
      keywords: [meta.guide.keyword, ...meta.guide.related],
      wordCount: meta.guide.nonSpaceLength
    };
  }

  if (meta.type === "CollectionPage") {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: meta.title,
      url,
      inLanguage: "ko-KR",
      description: meta.description,
      dateModified: lastUpdated,
      publisher: { "@type": "Organization", name: "goatool", url: base },
      hasPart: guidePages.map((guide) => ({
        "@type": "Article",
        name: guide.title,
        url: `${base}${guide.path}`
      }))
    };
  }

  if (meta.type === "SoftwareApplication") {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: meta.title,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web browser",
      url,
      inLanguage: "ko-KR",
      description: meta.description,
      dateModified: lastUpdated,
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      publisher: { "@type": "Organization", name: "goatool", url: base },
      featureList: meta.features || []
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": route === "/" ? "WebSite" : "WebPage",
    name: meta.title,
    url,
    inLanguage: "ko-KR",
    description: meta.description,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: "goatool", url: base }
  };
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeHtml(value) {
  return escapeAttr(value).replace(/>/g, "&gt;");
}
