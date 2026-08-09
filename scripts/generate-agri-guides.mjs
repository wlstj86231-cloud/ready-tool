import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "agri", "guides");
const base = "https://goatool.com";
const date = "2026-08-10";
const guides = [
  {
    slug: "direct-sale-settlement-files",
    title: "농산물 직거래 정산 파일 준비법",
    description: "판매 수량, 단가, 포장비, 배송비와 입금 내역을 나중에도 확인할 수 있게 파일로 묶는 순서입니다.",
    steps: [
      ["판매 조건표", "품목·규격·수량·단가·배송비 부담과 환불 기준을 한 파일에 적습니다."],
      ["출고 증빙", "선별 뒤 전체 상자, 실중량, 포장 표시와 운송장을 같은 날짜 규칙으로 저장합니다."],
      ["정산표", "총판매액에서 결제수수료·포장·배송·반품 비용을 나눠 적고 실제 입금액과 맞춥니다."],
    ],
    links: [
      ["농산물 직거래 가격·포장 원리", "produce-direct-sale-pricing-packaging"],
      ["농산물 판매가 계산기 사용법", "produce-price-calculator"],
    ],
  },
  {
    slug: "used-machinery-handover-files",
    title: "중고 농기계 판매·인도 파일 준비법",
    description: "명판, 사용시간, 정비, 시운전과 상차·운송 인도 상태를 매수인과 함께 확인할 수 있게 정리하는 방법입니다.",
    steps: [
      ["기계 식별", "기종·모델명·제조번호는 원본 증빙에 남기고 공개 공유본에서는 민감한 번호를 가립니다."],
      ["상태 기록", "냉간 시동, 계기판, 엔진룸, 누유, PTO, 유압과 포함 작업기를 같은 순서로 촬영합니다."],
      ["인도 기록", "상차 전후 외관, 운송차량, 결박, 하차 상태와 비용 부담 주체를 계약서와 사진으로 맞춥니다."],
    ],
    links: [
      ["중고 농기계 판매자 체크리스트", "used-machinery-selling-checklist"],
      ["농기계 운송·인도 체크리스트", "farm-machinery-transport-checklist"],
    ],
  },
  {
    slug: "farm-supplies-disposal-records",
    title: "폐농자재 정리·처분 기록 준비법",
    description: "남은 비료·농약 용기·농업용 필름과 고장 난 자재를 품목별로 분리하고 문의·인계 기록을 남기는 기본 순서입니다.",
    steps: [
      ["품목 분리", "내용물이 남은 제품, 빈 용기, 필름·끈, 금속·플라스틱 자재를 섞지 않고 구분합니다."],
      ["표시 촬영", "제품명·성분·남은 양·오염 상태를 확인할 수 있게 라벨과 전체 모습을 촬영합니다."],
      ["공식 경로 확인", "임의 매립·소각·배출을 피하고 지역 행정기관·수거처의 최신 안내와 인계일을 기록합니다."],
    ],
    links: [["폐농자재 처리·나눔 확인 가이드", "farm-supplies-disposal-guide"]],
  },
];

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const head = (title, description, canonical, type = "article") => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | goatool 농업</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${esc(title)} | goatool 농업"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="${type}"><meta property="og:url" content="${canonical}"><link rel="stylesheet" href="/agri/agri.css"><link rel="stylesheet" href="/agri/guide.css"></head><body><header><a class="brand" href="/agri/"><span><i data-lucide="folder-cog"></i></span><strong>goatool 농업</strong><small>거래·지원 서류 파일 도구</small></a><nav><a href="/agri/">파일 도구</a><a href="/agri/guides/">서류 가이드</a><a href="/">goatool 홈</a></nav></header>`;
const foot = `<footer><strong>goatool</strong><span>브라우저에서 바로 쓰는 무료 파일 도구</span><nav><a href="/privacy/">개인정보</a><a href="/terms/">이용안내</a><a href="/contact/">문의</a></nav></footer><script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script><script>if(window.lucide)lucide.createIcons();</script></body></html>`;

await fs.mkdir(out, { recursive: true });
const cards = guides.map((guide) => `<article><p>파일 준비</p><h2><a href="/agri/guides/${guide.slug}/">${esc(guide.title)}</a></h2><span>${esc(guide.description)}</span><a href="/agri/guides/${guide.slug}/">가이드 읽기 <i data-lucide="arrow-right"></i></a></article>`).join("");
const hubSchema = JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "농업 거래 서류 가이드", url: `${base}/agri/guides/`, hasPart: guides.map((guide) => ({ "@type": "Article", name: guide.title, url: `${base}/agri/guides/${guide.slug}/` })) }).replace(/</g, "\\u003c");
const hub = `${head("농업 거래 서류 가이드", "농산물 직거래 정산, 중고 농기계 인도, 폐농자재 처분에 필요한 사진과 파일을 빠짐없이 정리하는 방법입니다.", `${base}/agri/guides/`, "website")}<script type="application/ld+json">${hubSchema}</script><main class="guide-main"><nav class="crumb"><a href="/agri/">농업 파일 도구</a><span>›</span><span>서류 가이드</span></nav><section class="guide-hero"><p>도구를 쓰기 전에</p><h1>농업 거래 서류<br><em>파일 준비 가이드</em></h1><span>무엇을 촬영하고 어떤 이름으로 묶을지 먼저 정하면 분쟁과 누락을 줄일 수 있습니다.</span></section><section class="guide-grid">${cards}</section></main>${foot}`;
await fs.writeFile(path.join(out, "index.html"), hub, "utf8");

for (const guide of guides) {
  const dir = path.join(out, guide.slug);
  await fs.mkdir(dir, { recursive: true });
  const canonical = `${base}/agri/guides/${guide.slug}/`;
  const steps = guide.steps.map(([title, body], index) => `<section><span>${index + 1}</span><div><h2>${esc(title)}</h2><p>${esc(body)}</p></div></section>`).join("");
  const links = guide.links.map(([text, slug]) => `<a href="https://boribay.com/guides/${slug}?utm_source=goatool.com&amp;utm_medium=owned_referral&amp;utm_campaign=agri_document_guides&amp;utm_content=${guide.slug}">${esc(text)} <i data-lucide="arrow-right"></i></a>`).join("");
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description, datePublished: date, dateModified: date, inLanguage: "ko-KR", mainEntityOfPage: canonical, author: { "@type": "Organization", name: "goatool 편집팀" }, publisher: { "@type": "Organization", name: "goatool", url: base } }).replace(/</g, "\\u003c");
  const html = `${head(guide.title, guide.description, canonical)}<script type="application/ld+json">${schema}</script><main class="guide-main"><nav class="crumb"><a href="/agri/">농업 파일 도구</a><span>›</span><a href="/agri/guides/">서류 가이드</a></nav><article class="guide-article"><header><p>파일 준비 가이드 · ${date}</p><h1>${esc(guide.title)}</h1><span>${esc(guide.description)}</span></header><div class="guide-layout"><div>${steps}<aside class="privacy-note"><strong>개인정보 주의</strong><p>원본은 안전하게 보관하고 외부 공유본에서는 주민번호·계좌·전화번호·정확한 주소와 제조번호 일부를 가립니다.</p></aside></div><aside class="next"><h2>파일 기준을 정했다면</h2><p>실제 가격·거래·인도 기준을 이어서 확인하세요.</p>${links}</aside></div></article></main>${foot}`;
  await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
}

const css = `.guide-main{max-width:1000px}.crumb{padding-top:26px;display:flex;gap:8px;color:#77807a;font-size:13px}.guide-hero{padding:58px 0 40px}.guide-hero>p,.guide-grid article>p,.guide-article>header>p{color:var(--g2);font-size:13px;font-weight:900}.guide-hero h1{font-size:46px;line-height:1.22;letter-spacing:-2px;margin:7px 0}.guide-hero h1 em{font-style:normal;color:var(--g)}.guide-hero>span,.guide-grid article>span,.guide-article>header>span{color:var(--text)}.guide-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding-bottom:70px}.guide-grid article{border:1px solid var(--line);border-radius:12px;padding:21px}.guide-grid h2{font-size:19px;line-height:1.45;margin:7px 0}.guide-grid article>a{display:flex;gap:7px;align-items:center;margin-top:14px;color:var(--g2);font-size:13px;font-weight:800}.guide-grid svg{width:16px}.guide-article>header{padding:38px 0;border-bottom:1px solid var(--line)}.guide-article h1{font-size:39px;line-height:1.3;margin:7px 0}.guide-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:34px;padding:34px 0 70px}.guide-layout>div>section{display:flex;gap:16px;padding:20px 0;border-bottom:1px solid var(--line)}.guide-layout>div>section>span{width:34px;height:34px;display:grid;place-items:center;background:var(--pale);border-radius:50%;color:var(--g2);font-weight:900;flex:none}.guide-layout h2{font-size:20px;margin:0}.guide-layout p{color:var(--text)}.privacy-note{margin-top:20px;padding:18px;border-left:4px solid var(--yellow);background:#fff9e9}.next{align-self:start;position:sticky;top:96px;background:var(--pale);padding:20px;border-radius:10px}.next p{font-size:13px}.next a{display:flex;justify-content:space-between;gap:8px;background:#fff;border:1px solid var(--line);border-radius:7px;padding:11px;margin-top:8px;color:var(--g2);font-size:13px;font-weight:800}.next svg{width:15px;min-width:15px}@media(max-width:760px){.guide-grid,.guide-layout{grid-template-columns:1fr}.guide-hero h1,.guide-article h1{font-size:34px}.next{position:static}}`;
await fs.writeFile(path.join(root, "public", "agri", "guide.css"), css, "utf8");

const hubPath = path.join(root, "public", "agri", "index.html");
let home = await fs.readFile(hubPath, "utf8");
if (!home.includes('href="/agri/guides/"')) {
  const promo = `<section class="recommended"><div><p>거래 전에 읽는 짧은 기준</p><h2>농업 거래 서류 파일 준비 가이드</h2></div><div class="tool-grid"><a href="/agri/guides/direct-sale-settlement-files/"><i data-lucide="receipt-text"></i><strong>직거래 정산 파일</strong><span>판매·출고·입금 내역 묶기</span></a><a href="/agri/guides/used-machinery-handover-files/"><i data-lucide="tractor"></i><strong>농기계 인도 파일</strong><span>명판·정비·상차 상태 기록</span></a><a href="/agri/guides/farm-supplies-disposal-records/"><i data-lucide="recycle"></i><strong>폐농자재 처분 기록</strong><span>품목·표시·인계 경로 정리</span></a></div></section>`;
  home = home.replace('<section class="boribay-next">', `${promo}<section class="boribay-next">`);
  await fs.writeFile(hubPath, home, "utf8");
}
console.log(`generated ${guides.length} agricultural document guides`);
