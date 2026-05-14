import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { guideIndexMeta, guidePages } from "../src/guides.js";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "../dist");
const base = "https://goatool.com";
const brandIcon = `${base}/brand/goatool-icon-512.png`;
const brandImage = `${base}/brand/goatool-og.png`;
const lastUpdated = "2026-05-14";

const coreRoutes = [
  "/tools/photo-resize/",
  "/tools/pdf-organizer/",
  "/tools/file-ready/",
  "/tools/image-privacy/",
  "/tools/filename-cleaner/",
  "/tools/image-to-pdf/",
  "/tools/zip-inspector/",
  "/tools/text-counter/",
  "/tools/text-cleaner/",
  "/tools/image-inspector/",
  "/tools/file-list/",
  "/tools/hash-compare/",
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
    title: "goatool - 민원·입사지원 파일 변환, PDF, 사진 규격 도구",
    description:
      "goatool은 민원 제출과 입사지원 전에 PDF 합치기, 증명사진 규격 맞추기, 이미지 용량 정리, 파일명 정리, ZIP 점검을 브라우저에서 처리하는 실용 도구입니다."
  },
  "/tools/photo-resize/": {
    title: "증명사진 규격 맞추기 - goatool",
    description:
      "이력서 사진, 응시원서 사진, 민원 첨부 사진을 3x4, 3.5x4.5, 100x140, 150x210 같은 규격과 용량 기준에 맞춰 새 JPG로 만듭니다.",
    type: "SoftwareApplication",
    features: ["증명사진 리사이즈", "JPG 용량 조절", "3x4 비율", "입사지원 사진 규격"]
  },
  "/tools/pdf-organizer/": {
    title: "PDF 합치기·페이지 뽑기 - goatool",
    description:
      "여러 PDF를 하나로 합치거나 긴 PDF에서 필요한 페이지만 추출해 민원·입사지원 제출용 PDF를 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["PDF 합치기", "PDF 페이지 추출", "제출용 PDF", "브라우저 PDF 처리"]
  },
  "/tools/file-ready/": {
    title: "제출 파일 점검·ZIP - goatool",
    description:
      "여러 파일의 파일명, 용량, 확장자, 중복 여부를 확인하고 제출용 ZIP과 점검표를 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["파일명 점검", "SHA-256 해시", "제출용 ZIP", "점검표 TXT"]
  },
  "/tools/image-privacy/": {
    title: "이미지 용량·개인정보 정리 - goatool",
    description:
      "사진과 캡처 이미지를 캔버스로 다시 저장해 EXIF 노출 가능성을 줄이고 제출용 이미지 ZIP을 만듭니다.",
    type: "SoftwareApplication",
      features: ["캔버스 재저장", "EXIF 노출 가능성 감소", "이미지 리사이즈", "결과 ZIP"]
  },
  "/tools/filename-cleaner/": {
    title: "파일명 일괄 정리 - goatool",
    description:
      "여러 파일의 특수문자, 공백, 번호, 날짜를 정리하고 제출용 파일명 변경표와 ZIP을 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["파일명 일괄 정리", "제출용 ZIP", "변경표 TXT", "특수문자 정리"]
  },
  "/tools/image-to-pdf/": {
    title: "이미지 PDF 변환 - goatool",
    description:
      "JPG, PNG, WebP 이미지와 스캔본을 페이지별 PDF로 묶어 제출용 첨부 파일을 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["JPG PDF 변환", "PNG PDF 변환", "스캔본 PDF", "이미지 묶기"]
  },
  "/tools/zip-inspector/": {
    title: "ZIP 내용 점검 - goatool",
    description:
      "ZIP 파일 안의 내부 파일 수, 폴더 깊이, 파일명 위험 신호를 브라우저에서 확인하고 파일 목록 TXT를 만듭니다.",
    type: "SoftwareApplication",
    features: ["ZIP 내부 목록", "폴더 깊이 확인", "숨김 파일 점검", "파일 목록 TXT"]
  },
  "/tools/text-counter/": {
    title: "자소서 글자수·바이트 계산 - goatool",
    description:
      "자기소개서와 지원 문항의 공백 포함·제외 글자수, 줄 수, UTF-8 바이트를 브라우저에서 즉시 계산합니다.",
    type: "SoftwareApplication",
    features: ["글자수 계산", "공백 제외", "UTF-8 바이트", "자기소개서 제한 확인"]
  },
  "/tools/text-cleaner/": {
    title: "텍스트 공백 정리 - goatool",
    description:
      "지원서 문항과 민원 사유문을 붙여넣기 전에 과한 공백, 탭, 빈 줄을 브라우저에서 정리합니다.",
    type: "SoftwareApplication",
    features: ["공백 정리", "줄바꿈 정리", "탭 제거", "정리본 복사"]
  },
  "/tools/image-inspector/": {
    title: "이미지 규격 확인 - goatool",
    description:
      "사진과 스캔 이미지의 픽셀 크기, 비율, 용량, 확장자를 브라우저에서 확인합니다.",
    type: "SoftwareApplication",
    features: ["이미지 픽셀 확인", "이미지 용량 확인", "비율 계산", "다중 이미지 표"]
  },
  "/tools/file-list/": {
    title: "파일 목록 만들기 - goatool",
    description:
      "선택한 파일의 이름, 확장자, 용량을 TXT와 CSV 목록으로 만들어 제출 전후 기록으로 보관합니다.",
    type: "SoftwareApplication",
    features: ["파일 목록 TXT", "파일 목록 CSV", "확장자 확인", "총 용량 계산"]
  },
  "/tools/hash-compare/": {
    title: "파일 해시 비교 - goatool",
    description:
      "두 파일의 SHA-256 해시를 계산해 제출 전후 파일 동일성을 브라우저에서 비교합니다.",
    type: "SoftwareApplication",
    features: ["SHA-256", "파일 동일성 비교", "제출 전후 검증", "해시 결과 TXT"]
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
    description: "goatool은 제출 전 파일 준비와 개인정보 정리를 돕는 브라우저 도구 모음입니다."
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
    ["/tools/photo-resize/", "증명사진 규격 맞추기"],
    ["/tools/pdf-organizer/", "PDF 합치기·페이지 뽑기"],
    ["/tools/file-ready/", "파일 준비 점검"],
    ["/tools/image-privacy/", "이미지 개인정보 정리"],
    ["/tools/filename-cleaner/", "파일명 일괄 정리"],
    ["/tools/image-to-pdf/", "이미지 PDF 변환"],
    ["/tools/zip-inspector/", "ZIP 내용 점검"],
    ["/tools/text-counter/", "자소서 글자수·바이트 계산"],
    ["/tools/text-cleaner/", "텍스트 공백 정리"],
    ["/tools/image-inspector/", "이미지 규격 확인"],
    ["/tools/file-list/", "파일 목록 만들기"],
    ["/tools/hash-compare/", "파일 해시 비교"],
    ["/tools/data-clean/", "CSV·엑셀 정리"],
    ["/guides/", "전문 가이드"],
    ["https://policyfundpedia.com/", "정책자금 백과"],
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
          <a href="/tools/photo-resize/">증명사진 규격 맞추기</a>
          <a href="/tools/pdf-organizer/">PDF 합치기·페이지 뽑기</a>
          <a href="/tools/zip-inspector/">ZIP 내용 점검</a>
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
      image: brandImage,
      datePublished: meta.guide.dateModified,
      dateModified: meta.guide.dateModified,
      author: { "@type": "Organization", name: "goatool", url: base },
      publisher: { "@type": "Organization", name: "goatool", url: base, logo: brandIcon },
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
      image: brandImage,
      dateModified: lastUpdated,
      publisher: { "@type": "Organization", name: "goatool", url: base, logo: brandIcon },
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
      image: brandImage,
      dateModified: lastUpdated,
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      publisher: { "@type": "Organization", name: "goatool", url: base, logo: brandIcon },
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
    image: brandImage,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: "goatool", url: base, logo: brandIcon }
  };
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeHtml(value) {
  return escapeAttr(value).replace(/>/g, "&gt;");
}
