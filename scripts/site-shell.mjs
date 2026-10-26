// Shared page shell for every Korean page on goatool.com.
// Used by vite.config.js (tool pages and home) and by the static page generators.
import { SOURCES_CHECKED, sourceEntries } from "./sources.mjs";

export const SITE = {
  name: "거래 증빙 도우미",
  base: "https://goatool.com",
  // Bump cssVersion whenever public/css/site.css changes; iconVersion when the icons are redrawn.
  cssVersion: "20261026-3",
  iconVersion: "20261026",
  ogImage: "https://goatool.com/brand/goatool-og.png?v=20261026",
  logo: "https://goatool.com/brand/goatool-logo.png?v=20261026",
  operator: "제이 미디어(J MEDIA)",
  operatorUrl: "https://jnewmedia.com/",
  checked: SOURCES_CHECKED,
};

// Operator facts as published on boribay.com/about and jnewmedia.com (checked 2026-10-26).
// Do not add anything here that those two sites do not show.
export const ORG = {
  name: "제이 미디어",
  displayName: "제이 미디어(Media)",
  alternateName: ["J MEDIA", "제이미디어"],
  representative: "이정우",
  bizNo: "456-33-01705",
  address: "전북특별자치도 군산시 의료원로 80-8, 301호(지곡동)",
  phone: "010-2846-2011",
  email: "consultingjinjeong@gmail.com",
  kakaoGeneral: "https://open.kakao.com/o/scuvl1wi",
  kakaoBoribay: "https://open.kakao.com/o/p6HiJ9Pi",
  url: "https://jnewmedia.com/",
  companyUrl: "https://jnewmedia.com/company/",
  logo: "https://jnewmedia.com/assets/mark.svg",
  sameAs: ["https://www.instagram.com/boribaydotcom/", "https://blog.naver.com/plannerset", "https://jnewmedia.com/", "https://boribay.com/"],
};

// Official help channels the pages point readers to (checked 2026-10-26).
export const ECRM_URL = "https://ecrm.police.go.kr/minwon/main";
export const CONSUMER_URL = "https://www.ccn.go.kr/index.ccn";
export const KLAC_URL = "https://www.klac.or.kr/";

export const ORG_ID = "https://jnewmedia.com/#organization";
export const WEBSITE_ID = `${SITE.base}/#website`;
export const ADSENSE_ACCOUNT = "ca-pub-5877883031077615";

const adsenseLoader = `<script>
      if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
        const adScript = document.createElement("script");
        adScript.async = true;
        adScript.crossOrigin = "anonymous";
        adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}";
        document.head.append(adScript);
      }
    </script>`;

// Tags every page shares. Ads load only on content pages (home, guides, about); tool pages,
// legal/utility pages and the error page pass ads: false. The account meta stays on every page
// so AdSense can verify site ownership without loading ads.
export function commonHead({ ads = true } = {}) {
  return `<meta name="theme-color" content="#1f5da8" />
    <meta name="google-adsense-account" content="${ADSENSE_ACCOUNT}" />
    <link rel="icon" href="/favicon.ico?v=${SITE.iconVersion}" sizes="any" />
    <link rel="icon" href="/favicon.png?v=${SITE.iconVersion}" type="image/png" />
    <link rel="apple-touch-icon" href="/brand/goatool-apple-touch.png?v=${SITE.iconVersion}" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="stylesheet" href="/css/site.css?v=${SITE.cssVersion}" />
    ${ads ? adsenseLoader : ""}`;
}

export function socialMeta({ title, description, url, type = "website" }) {
  return `<meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE.ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${SITE.name}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${SITE.ogImage}" />`;
}

const navItems = [
  ["pack", "/tools/evidence-pack/", "증빙 묶음"],
  ["tools", "/#tools", "도구"],
  ["guides", "/agri/guides/", "가이드"],
];

const markSvg = `<svg class="brand-mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false"><rect x="5" y="3" width="22" height="26" rx="4" fill="#1f5da8"/><path d="M10 11h12M10 16h8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="m11 22 3.2 3.2L21 18.6" fill="none" stroke="#ffd34d" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function siteHeader(active = "") {
  return `<a class="skip-link" href="#main">본문 바로가기</a>
    <header class="site-header">
      <div class="wrap header-row">
        <a class="brand" href="/" aria-label="${SITE.name} 처음으로">${markSvg}<span>${SITE.name}</span></a>
        <nav class="site-nav" aria-label="주요 메뉴">
          ${navItems
            .map(([key, href, label]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ""}>${label}</a>`)
            .join("")}
        </nav>
      </div>
    </header>`;
}

// One line, identical on every page; postbuild.mjs checks that each built page carries it.
const operatorParts = [ORG.name, `대표 ${ORG.representative}`, `사업자등록번호 ${ORG.bizNo}`, `고객센터 ${ORG.phone}`];
export const OPERATOR_TEXT = operatorParts.join(" · ");
// Each part is kept on one line so numbers such as 456-33-01705 never split at a hyphen.
export const OPERATOR_LINE = operatorParts.map((part) => `<span class="nw">${part}</span>`).join(" · ");

export function siteFooter() {
  return `<footer class="site-footer">
      <div class="wrap">
        <p class="footer-brand"><strong>${SITE.name}</strong> 거래할 때 남길 사진·서류를 브라우저에서 정리합니다. 넣은 파일은 서버로 보내지 않습니다.</p>
        <nav aria-label="사이트 안내">
          <a href="/about/">소개</a>
          <a href="/contact/">문의</a>
          <a href="/editorial/">편집 원칙</a>
          <a href="/corrections/">정정·수정 기록</a>
          <a href="/privacy/">개인정보처리방침</a>
          <a href="/terms/">이용약관</a>
        </nav>
        <p class="footer-op">${OPERATOR_LINE}<br>${ORG.address} · <a href="mailto:${ORG.email}">${ORG.email}</a></p>
        <p class="footer-note">이 사이트의 도구와 안내는 거래 준비를 돕는 참고 자료이며 법적 효력이나 거래 안전을 보장하지 않습니다. 보리장터는 같은 운영사(${ORG.name})의 서비스입니다.</p>
      </div>
    </footer>`;
}

export function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

// --- structured data -------------------------------------------------------------------

export const orgRef = { "@id": ORG_ID };

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: ORG.name,
    alternateName: ORG.alternateName,
    url: ORG.url,
    logo: { "@type": "ImageObject", url: ORG.logo },
    email: ORG.email,
    telephone: "+82-10-2846-2011",
    address: {
      "@type": "PostalAddress",
      streetAddress: "의료원로 80-8, 301호(지곡동)",
      addressLocality: "군산시",
      addressRegion: "전북특별자치도",
      addressCountry: "KR",
    },
    sameAs: ORG.sameAs,
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    url: `${SITE.base}/`,
    inLanguage: "ko-KR",
    publisher: orgRef,
  };
}

export function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], index) => ({ "@type": "ListItem", position: index + 1, name, item: `${SITE.base}${path}` })),
  };
}

// A full @graph: the operator and the website are defined once per page and referenced by @id.
export function graph(...nodes) {
  return { "@context": "https://schema.org", "@graph": [organizationNode(), websiteNode(), ...nodes] };
}

// --- visible trust blocks ----------------------------------------------------------------

export const BYLINE = `작성·관리: <a href="/editorial/">${ORG.name} 편집팀</a> (운영 책임: 대표 ${ORG.representative})`;

// Meta block for guides and tool pages: who maintains it, when it was first published,
// when its facts were last re-checked, and how many sources it lists.
export function pageMeta({ published, checked = SITE.checked, sourceCount }) {
  return `<p class="page-meta">${BYLINE}<br>게시일 <time datetime="${published}">${published}</time> · 최종 확인일 <time datetime="${checked}">${checked}</time> · 출처 ${sourceCount}개 (<a href="#sources">아래 출처 목록</a>)</p>`;
}

export function sourcesSection(keys, { note = "" } = {}) {
  const entries = sourceEntries(keys);
  return `<section class="sources" id="sources" aria-labelledby="sourcesTitle">
          <h2 id="sourcesTitle">출처</h2>
          <ol class="source-list">${entries
            .map((entry) => `<li><a href="${escapeAttr(entry.url)}">${escapeHtml(entry.title)}</a> — ${escapeHtml(entry.org)} (확인일 ${SITE.checked})</li>`)
            .join("")}</ol>
          ${note ? `<p class="source-note">${note}</p>` : ""}
        </section>`;
}

export function scopeSection(items) {
  return `<section class="scope" aria-labelledby="scopeTitle">
          <h2 id="scopeTitle">범위와 한계</h2>
          <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
        </section>`;
}

// "이 도구에 대해" block shown at the end of every tool page.
export function toolAbout(info) {
  return `<section class="tool-about" aria-labelledby="toolAboutTitle">
          <h2 id="toolAboutTitle">이 도구에 대해</h2>
          <h3>파일은 어디에서 처리되나요</h3>
          <p>이 페이지에는 파일을 올리는 기능이 없습니다. 고른 파일은 이 페이지의 스크립트가 지금 쓰는 브라우저 안에서 읽고, 결과 파일도 브라우저 안에서 만들어 내려받게 합니다. 서버에서 받아 오는 것은 페이지 자체(글·스크립트·그림)와 방문 통계 스크립트뿐이며, 이 도구 페이지에는 광고를 싣지 않습니다. 자세한 내용은 <a href="/privacy/">개인정보처리방침</a>에 있습니다.</p>
          <h3>무엇을 어떤 기준으로 확인하나요</h3>
          <ul>${info.criteria.map((item) => `<li>${item}</li>`).join("")}</ul>
        </section>
        ${scopeSection(info.scope)}
        ${sourcesSection(info.sources, { note: "기술 표준과 법령은 이 도구가 따르는 처리 방식과 안내 문장의 근거입니다. 바뀔 수 있으니 중요한 판단 전에는 원문을 다시 확인하세요." })}
        ${pageMeta({ published: info.published, sourceCount: info.sources.length })}`;
}

export function toolGraph(slug, info) {
  const url = `${SITE.base}/tools/${slug}/`;
  return graph(
    {
      "@type": "WebApplication",
      "@id": `${url}#app`,
      name: info.name,
      url,
      description: info.description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "웹 브라우저",
      inLanguage: "ko-KR",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      datePublished: info.published,
      dateModified: SITE.checked,
      author: orgRef,
      publisher: orgRef,
      isPartOf: { "@id": WEBSITE_ID },
    },
    breadcrumbNode([
      ["처음", "/"],
      ["도구", "/#tools"],
      [info.crumb, `/tools/${slug}/`],
    ])
  );
}

// 보리장터 links carry the shared support UTM.
export function boribay(path, content = "") {
  const url = new URL(path, "https://boribay.com/");
  url.searchParams.set("utm_source", "goatool.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "support");
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}
