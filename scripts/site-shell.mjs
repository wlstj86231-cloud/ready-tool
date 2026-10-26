// Shared page shell for every Korean page on goatool.com.
// Used by vite.config.js (tool pages and home) and by the static page generators.

export const SITE = {
  name: "거래 증빙 도우미",
  base: "https://goatool.com",
  // Bump cssVersion whenever public/css/site.css changes; iconVersion when the icons are redrawn.
  cssVersion: "20261026-2",
  iconVersion: "20261026",
  ogImage: "https://goatool.com/brand/goatool-og.png?v=20261026",
  logo: "https://goatool.com/brand/goatool-logo.png?v=20261026",
  operator: "제이 미디어(J MEDIA)",
  operatorUrl: "https://jnewmedia.com/",
  checked: "2026-10-26",
};

const adsenseLoader = `<script>
      if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
        const adScript = document.createElement("script");
        adScript.async = true;
        adScript.crossOrigin = "anonymous";
        adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5877883031077615";
        document.head.append(adScript);
      }
    </script>`;

// Tags every page shares. Ads stay off error and utility-only pages (ads: false).
export function commonHead({ ads = true } = {}) {
  return `<meta name="theme-color" content="#1f5da8" />
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

export function siteFooter() {
  return `<footer class="site-footer">
      <div class="wrap">
        <p class="footer-brand"><strong>${SITE.name}</strong> 거래할 때 남길 사진·서류를 브라우저에서 정리합니다. 넣은 파일은 서버로 보내지 않습니다.</p>
        <nav aria-label="사이트 안내">
          <a href="/about/">소개·운영</a>
          <a href="/privacy/">개인정보 처리방침</a>
          <a href="/terms/">이용안내</a>
          <a href="/contact/">문의·오류 제보</a>
        </nav>
        <p class="footer-op">운영: ${SITE.operator} · 보리장터 운영사. 이 사이트의 도구와 안내는 거래 준비를 돕는 참고 자료이며 법적 효력이나 거래 안전을 보장하지 않습니다.</p>
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

export const publisher = {
  "@type": "Organization",
  name: SITE.operator,
  url: SITE.operatorUrl,
};

// 보리장터 links carry the shared support UTM.
export function boribay(path, content = "") {
  const url = new URL(path, "https://boribay.com/");
  url.searchParams.set("utm_source", "goatool.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "support");
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}
