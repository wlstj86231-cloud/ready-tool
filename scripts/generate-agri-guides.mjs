import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "agri", "guides");
const base = "https://goatool.com";
const date = "2026-08-10";
const modified = "2026-09-20";
const guides = [
  {
    slug: "direct-sale-settlement-files",
    title: "농산물 직거래 정산 파일 준비법",
    description: "농산물 판매 사진의 순서를 맞추고, 수량·단가·포장비·배송비·입금 내역을 정산표와 함께 보관하는 파일 준비 순서입니다.",
    steps: [
      ["판매 조건표", "품목·규격·수량·단가·배송비 부담과 환불 기준을 한 파일에 적습니다."],
      ["출고 증빙", "선별 뒤 전체 상자, 실중량, 포장 표시와 운송장을 같은 날짜 규칙으로 저장합니다."],
      ["농산물 판매 사진 순서 맞추기", "전체 상품, 크기·흠집, 실중량, 포장 순서로 고른 뒤 파일명 앞에 01·02 번호를 붙입니다. 예를 들어 2026-09-16_감자_01_전체.jpg처럼 날짜·품목·내용을 남기고, 원본과 공개용 사본을 별도 폴더에 보관하세요. 번호는 사진 순서를 표시할 뿐 상품의 등급을 증명하지 않습니다."],
      ["정산표", "총판매액에서 결제수수료·포장·배송·반품 비용을 나눠 적고 실제 입금액과 맞춥니다."],
      ["정산표의 판매액과 실제 입금액이 다를 때", "거래 식별번호, 수량, 단가, 배송비 부담, 수수료, 반품액, 입금일을 각각 다른 열에 적습니다. 공백·중복 행을 정리하기 전 원본을 복사하고, 같은 고객의 별도 주문을 중복으로 지우지 않았는지 주문번호와 합계를 다시 대조합니다."],
      ["보내기 전 파일 열어 보기", "판매 사진은 공개용 사본만 선택하고 파일 크기와 열림 여부를 확인합니다. 정산표를 외부에 보낼 때는 구매자 전화번호·주소·계좌가 필요 이상으로 포함되지 않았는지 점검하고, 최종 파일 목록과 전달 날짜를 남깁니다."],
    ],
    faqs: [
      ["농산물 판매 사진 용량은 줄이기 전에 무엇을 확인하나요?", "사진 크기와 용량부터 확인하고 원본을 보존하세요. 사본을 줄인 뒤 중량 표시·흠집·포장 글자가 읽히는지 직접 열어 봅니다. 플랫폼의 실제 업로드 제한에 맞추되 모든 판매처에 같은 규격을 적용하지 않습니다."],
      ["직거래 정산표를 CSV로 저장해도 되나요?", "표 전달에 사용할 수 있지만 수식·서식·여러 시트는 그대로 유지되지 않을 수 있습니다. 원본 XLSX를 별도로 남기고, 내보낸 파일을 다시 열어 수량·금액·합계가 맞는지 확인하세요."],
    ],
    tools: [["판매 사진에 순서 번호 붙이기", "/tools/filename-numberer/"], ["큰 사진 파일 먼저 확인하기", "/tools/file-size-sorter/"], ["정산표의 공백·중복 행 정리", "/tools/data-clean/"]],
    related: ["used-machinery-handover-files", "pack-unit-kg-files"],
    links: [
      ["농산물 직거래 가격·포장 원리", "produce-direct-sale-pricing-packaging"],
      ["배송비 포함 kg당 가격 비교", "produce-price-calculator"],
    ],
  },
  {
    slug: "pack-unit-kg-files",
    title: "출하 정산표에서 그물망·단·상자를 kg 열로 맞추는 법",
    description: "배추 10kg 망, 대파 단, 양파 15kg 망, 김장무 20kg 상자 수량을 실중량 kg 열로 바꿔 정산표와 시세를 같은 단위로 보관하는 파일 준비 순서입니다.",
    steps: [
      ["포장 단위 열 만들기", "품목, 포장 이름(망·단·상자), 표시 중량, 실중량, 포장 개수를 한 행에 적습니다. 표시 10kg와 실측 무게가 다르면 둘 다 남깁니다."],
      ["kg 환산 열 계산", "실중량 × 포장 개수로 총 kg을 만들고, 포장 단가가 있으면 단가 ÷ 실중량으로 kg당을 적습니다. 수식은 설명용이며 시세 입력이 아닙니다."],
      ["김장 출하 사진과 중량 사진 맞추기", "그물망·상자 전체, 저울, 표시 라벨을 같은 번호로 묶습니다. 예: 2026-09-20_배추망_01_전체.jpg. 사진 번호는 중량을 증명하지 않으므로 저울 눈금이 읽히는지 확인합니다."],
      ["품목별로 시세 대조 칸 비우기", "배추·대파·양파·무를 한 평균 kg당으로 합치지 않습니다. 각 품목 행에 조회일과 대조한 출처 URL만 적고 숫자는 해당 품목 표에서 다시 확인합니다."],
      ["보내기 전 단위 혼선 점검", "정산표에 망 개수와 kg이 한 열에 섞이지 않았는지, 쪽파와 대파 품목명이 바뀌지 않았는지 원본 복사본과 대조합니다."],
    ],
    faqs: [
      ["망 개수만 있으면 kg 열을 비워도 되나요?", "시세·정산 비교에는 kg이 필요합니다. 실중량을 아직 모르면 미확인으로 적고 표시 중량만으로 채우지 않습니다."],
      ["여러 품목을 한 정산표에 넣어도 되나요?", "한 파일에 넣더라도 품목·포장 단위 열을 분리하세요. 배추 망과 양파 망을 같은 단가로 복사하지 않습니다."],
    ],
    tools: [["정산표의 공백·중복 행 정리", "/tools/data-clean/"], ["출하 사진에 순서 번호 붙이기", "/tools/filename-numberer/"], ["큰 사진 파일 먼저 확인하기", "/tools/file-size-sorter/"]],
    related: ["direct-sale-settlement-files"],
    links: [
      ["서울가락 배추 10kg 그물망 kg당", "garak-cabbage-price-lookup"],
      ["서울가락 대파 kg·망", "garak-daepa-price-lookup"],
      ["서울가락 양파 15kg 망 kg당", "garak-onion-price-lookup"],
      ["서울가락 김장무 20kg 상자 kg당", "garak-radish-price-lookup"],
    ],
  },
  {
    slug: "used-machinery-handover-files",
    title: "중고 농기계 판매·인도 파일 준비법",
    description: "명판, 사용시간, 정비, 시운전과 상차·운송 인도 상태를 매수인과 함께 확인할 수 있게 정리하는 방법입니다.",
    steps: [
      ["기계 식별", "기종·모델명·제조번호는 원본 증빙에 남기고 공개 공유본에서는 민감한 번호를 가립니다."],
      ["상태 기록", "냉간 시동, 계기판, 엔진룸, 누유, PTO, 유압과 포함 작업기를 같은 순서로 촬영합니다."],
      ["중고 농기계 판매 사진을 설명과 맞추기", "기계 전체·명판·사용시간·알려진 결함·작업기 사진에 순서 번호를 붙이고 설명문에서도 같은 번호를 사용합니다. 정비 내역과 촬영 날짜를 분리해 적고, 다른 기계나 오래된 사진이 섞이지 않았는지 비교하세요."],
      ["인도 기록", "상차 전후 외관, 운송차량, 결박, 하차 상태와 비용 부담 주체를 계약서와 사진으로 맞춥니다."],
      ["농기계 탁송 견적과 인도 사진 묶기", "상차 전·상차 후·도착 후 폴더를 나누고 같은 부위를 같은 순서로 촬영합니다. 견적 파일에는 장비 크기·중량, 작업기 포함 여부, 상차·하차 조건과 비용 부담을 적어 사진과 함께 대조할 수 있게 보관합니다."],
      ["추가 운송비가 생겼을 때 기록하기", "처음 견적과 변경 견적을 덮어쓰지 말고 각각 저장합니다. 추가 항목, 사유, 금액과 확인 날짜를 정산표에 구분하고 관련 메시지·인도 사진의 파일명을 함께 적으세요. 파일을 묶는 것만으로 비용 합의나 거래 사실이 증명되지는 않습니다."],
    ],
    faqs: [
      ["중고 농기계 판매 사진에는 제조번호를 모두 공개하나요?", "상대 확인에 필요한 원본은 별도 보관하고 공개 게시물에는 필요한 범위만 남깁니다. 공유 목적과 상대를 먼저 정한 뒤 번호·계좌·연락처가 드러난 사본을 그대로 올리지 않았는지 확인하세요."],
      ["탁송 전후 사진을 한 PDF로 보내도 되나요?", "검토용 PDF로 묶을 수 있지만 촬영 원본도 따로 남기세요. 페이지마다 촬영 시점과 부위를 표시하고, 내보낸 PDF에서 사진 순서·방향·결함 식별 여부를 확인합니다."],
    ],
    tools: [["사진과 설명의 순서 번호 맞추기", "/tools/filename-numberer/"], ["공유 사본의 민감한 부분 가리기", "/tools/image-redactor/"], ["인도 사진을 검토용 PDF로 묶기", "/tools/image-to-pdf/"]],
    related: ["direct-sale-settlement-files"],
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
      ["농약 빈병·폐비닐 문의용 사진 정리", "빈 용기와 내용물이 남은 제품, 흙이나 다른 물질이 섞인 필름을 사진과 목록에서 구분합니다. 품목별 수량 또는 확인한 양, 보관 상태, 문의할 질문을 같은 번호로 적으세요. 수거 가능 여부는 사진 파일만으로 판단하지 않습니다."],
      ["공식 경로 확인", "임의 매립·소각·배출을 피하고 지역 행정기관·수거처의 최신 안내와 인계일을 기록합니다."],
      ["공동집하장에 문의한 결과 남기기", "문의일, 확인한 기관·수거처, 받는 품목, 배출 방법, 수거일과 답변 내용을 기록합니다. 안내문 파일과 사진을 같은 폴더에 두고, 다른 지역의 안내나 지난 수거일 자료와 섞이지 않게 합니다."],
      ["인계 뒤 파일 목록 확인", "인계 날짜와 실제 넘긴 품목·수량을 최초 목록에 맞춰 적고, 받은 확인 자료가 있다면 함께 보관합니다. 폴더의 파일명·확장자·용량 목록을 만들어 빠진 사진이나 중복된 기록을 마지막으로 확인하세요."],
    ],
    faqs: [
      ["농약 빈병과 남은 농약 사진을 같은 파일로 보내도 되나요?", "한 묶음으로 보낼 때도 사진 제목과 목록에서 내용물 유무를 분명히 나누세요. 지역 담당자가 품목과 상태를 확인할 수 있게 라벨을 읽을 수 있는 사본을 보내고, 배출 방법은 해당 기관의 답변을 따릅니다."],
      ["공동집하장 주소만 알면 처분 기록은 충분한가요?", "주소 외에도 해당 품목을 받는지, 수거일과 분리 방법이 무엇인지 확인한 날짜와 답변을 남기세요. goatool은 파일 정리를 돕고 실제 수거 조건은 지역 기관·수거처에서 확인합니다."],
    ],
    tools: [["라벨 사진이 읽히는지 확인하기", "/tools/image-inspector/"], ["품목별 사진 목록 만들기", "/tools/file-list/"], ["문의용 파일 누락·중복 점검", "/tools/file-ready/"]],
    related: ["direct-sale-settlement-files", "used-machinery-handover-files"],
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
  const faqs = `<section><span>?</span><div><h2>파일을 준비하며 자주 묻는 질문</h2>${guide.faqs.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("")}</div></section>`;
  const tools = `<h2>지금 파일 정리하기</h2>${guide.tools.map(([text, href]) => `<a href="${esc(href)}">${esc(text)} <i data-lucide="arrow-right"></i></a>`).join("")}`;
  const related = `<section><span>↗</span><div><h2>다음 기록도 준비한다면</h2><ul>${guide.related.map((slug) => {
    const item = guides.find((entry) => entry.slug === slug);
    return `<li><a href="/agri/guides/${item.slug}/">${esc(item.title)}</a></li>`;
  }).join("")}</ul></div></section>`;
  const links = guide.links.map(([text, slug]) => `<a href="https://boribay.com/guides/${slug}?utm_source=goatool.com&amp;utm_medium=owned_referral&amp;utm_campaign=agri_document_guides&amp;utm_content=${guide.slug}">${esc(text)} <i data-lucide="arrow-right"></i></a>`).join("");
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description, datePublished: date, dateModified: modified, inLanguage: "ko-KR", mainEntityOfPage: canonical, author: { "@type": "Organization", name: "goatool 편집팀" }, publisher: { "@type": "Organization", name: "goatool", url: base } }).replace(/</g, "\\u003c");
  const html = `${head(guide.title, guide.description, canonical)}<script type="application/ld+json">${schema}</script><main class="guide-main"><nav class="crumb"><a href="/agri/">농업 파일 도구</a><span>›</span><a href="/agri/guides/">서류 가이드</a></nav><article class="guide-article"><header><p>파일 준비 가이드 · 수정 ${modified}</p><h1>${esc(guide.title)}</h1><span>${esc(guide.description)}</span></header><div class="guide-layout"><div>${steps}${faqs}${related}<aside class="privacy-note"><strong>개인정보 주의</strong><p>원본은 안전하게 보관하고 외부 공유본에서는 주민번호·계좌·전화번호·정확한 주소와 제조번호 일부를 가립니다.</p></aside></div><aside class="next">${tools}<h2>거래 조건도 확인하세요</h2><p>실제 가격·거래·인도 기준을 이어서 확인하세요.</p>${links}</aside></div></article></main>${foot}`;
  await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
}

const css = `.guide-main{max-width:1000px}.crumb{padding-top:26px;display:flex;gap:8px;color:#77807a;font-size:13px}.guide-hero{padding:58px 0 40px}.guide-hero>p,.guide-grid article>p,.guide-article>header>p{color:var(--g2);font-size:13px;font-weight:900}.guide-hero h1{font-size:46px;line-height:1.22;letter-spacing:-2px;margin:7px 0}.guide-hero h1 em{font-style:normal;color:var(--g)}.guide-hero>span,.guide-grid article>span,.guide-article>header>span{color:var(--text)}.guide-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding-bottom:70px}.guide-grid article{border:1px solid var(--line);border-radius:12px;padding:21px}.guide-grid h2{font-size:19px;line-height:1.45;margin:7px 0}.guide-grid article>a{display:flex;gap:7px;align-items:center;margin-top:14px;color:var(--g2);font-size:13px;font-weight:800}.guide-grid svg{width:16px}.guide-article>header{display:block;height:auto;position:static;z-index:auto;padding:38px 0;border-bottom:1px solid var(--line)}.guide-article h1{font-size:39px;line-height:1.3;margin:7px 0}.guide-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:34px;padding:34px 0 70px}.guide-layout>div>section{display:flex;gap:16px;padding:20px 0;border-bottom:1px solid var(--line)}.guide-layout>div>section>span{width:34px;height:34px;display:grid;place-items:center;background:var(--pale);border-radius:50%;color:var(--g2);font-weight:900;flex:none}.guide-layout h2{font-size:20px;margin:0}.guide-layout p{color:var(--text)}.privacy-note{margin-top:20px;padding:18px;border-left:4px solid var(--yellow);background:#fff9e9}.next{align-self:start;position:sticky;top:96px;background:var(--pale);padding:20px;border-radius:10px}.next p{font-size:13px}.next h2:not(:first-child){margin-top:26px}.guide-layout section a{text-decoration:underline;text-underline-offset:3px}.guide-layout details{padding:12px 0;border-bottom:1px solid var(--line)}.guide-layout summary{cursor:pointer;font-weight:700}.next a{display:flex;justify-content:space-between;gap:8px;background:#fff;border:1px solid var(--line);border-radius:7px;padding:11px;margin-top:8px;color:var(--g2);font-size:13px;font-weight:800}.next svg{width:15px;min-width:15px}@media(max-width:760px){.guide-grid,.guide-layout{grid-template-columns:1fr}.guide-hero h1,.guide-article h1{font-size:34px}.next{position:static}}`;
await fs.writeFile(path.join(root, "public", "agri", "guide.css"), css, "utf8");

const hubPath = path.join(root, "public", "agri", "index.html");
let home = await fs.readFile(hubPath, "utf8");
home = home.replace(/<section class="recommended"><div><p>거래 전에 읽는 짧은 기준<\/p>[\s\S]*?<\/section>/g, "");
const promo = `<section class="recommended"><div><p>거래 전에 읽는 짧은 기준</p><h2><a href="/agri/guides/">농업 거래 서류 파일 준비 가이드</a></h2></div><div class="tool-grid"><a href="/agri/guides/direct-sale-settlement-files/"><i data-lucide="receipt-text"></i><strong>직거래 정산 파일</strong><span>판매·출고·입금 내역 묶기</span></a><a href="/agri/guides/pack-unit-kg-files/"><i data-lucide="scale"></i><strong>망·단·상자 kg 열</strong><span>출하 단위를 정산표 kg로</span></a><a href="/agri/guides/used-machinery-handover-files/"><i data-lucide="tractor"></i><strong>농기계 인도 파일</strong><span>명판·정비·상차 상태 기록</span></a><a href="/agri/guides/farm-supplies-disposal-records/"><i data-lucide="recycle"></i><strong>폐농자재 처분 기록</strong><span>품목·표시·인계 경로 정리</span></a></div></section>`;
home = home.replace('<section class="boribay-next">', `${promo}<section class="boribay-next">`);
await fs.writeFile(hubPath, home, "utf8");
console.log(`generated ${guides.length} agricultural document guides`);
