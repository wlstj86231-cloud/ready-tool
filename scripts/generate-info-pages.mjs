// Builds the about / privacy / terms / contact pages and 404.html into public/.
import fs from "node:fs/promises";
import path from "node:path";
import { SITE, commonHead, escapeAttr, escapeHtml, jsonLd, publisher, siteFooter, siteHeader, socialMeta } from "./site-shell.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pub = path.join(root, "public");
const UPDATED = "2026-10-26";

const siblings = [
  ["농산물 거래사전", "https://yomiwiki.com/", "농산물·농기계 거래 용어와 현장 확인 기준을 찾는 사전"],
  ["직거래 사기 점검", "https://scamreader.com/", "선입금·계좌 변경 같은 직거래 사기 신호와 대응 순서 점검"],
  ["농가 손익 계산기", "https://www.reportools.com/", "판매 방식별 예상 이익과 손익분기 판매가 계산"],
  ["거래 증빙 도우미", "https://goatool.com/", "거래할 때 남길 사진·서류를 정리 (이 사이트)"],
  ["농사 비교 월드컵", "https://occultworldcup.com/", "품종·산지·농기계를 비교해 내 선택 기준 만들기"],
  ["농업 정책자금 백과", "https://policyfundpedia.com/", "농업 정책자금의 대상·한도·신청 시기 안내"],
  ["농기계 자산 수첩", "https://megapureunasset.kr/", "농기계마다 인수 상태·정비·사고·보험 기록"],
  ["영농폐기물 집하장 지도", "https://sumimap.com/", "지역별 영농폐기물 공동집하장 찾기"],
  ["농기계 탁송 견적 비교", "https://tripmarking.com/", "농기계 탁송 견적 요청서와 견적 비교표"],
];

const pages = {
  about: {
    path: "/about/",
    title: "거래 증빙 도우미 소개·운영",
    description: "거래 증빙 도우미가 무엇을 하는 사이트인지, 어떤 원칙으로 도구와 안내를 만드는지, 누가 운영하는지 알려 드립니다. 운영: 제이 미디어(J MEDIA), 보리장터 운영사.",
    type: "AboutPage",
    ads: true,
    body: `
      <h2>무엇을 하는 사이트인가요</h2>
      <p>거래 증빙 도우미는 중고 농기계를 사고팔 때, 농산물을 보낼 때, 직거래 판매를 정산할 때 <strong>무엇을 찍고 어떤 서류를 남길지</strong> 알려 드리고, 그 사진과 서류를 알아보기 쉬운 이름으로 묶어 보관하도록 돕는 사이트입니다. 핵심 도구는 <a href="/tools/evidence-pack/">거래 증빙 사진 묶음 만들기</a>입니다.</p>
      <p>직접 농산물을 팔거나 농기계를 사고파는 농업인과, 그 상대가 되는 구매자를 위해 만들었습니다. 휴대폰으로도 쓰기 쉽게 글자와 버튼을 크게 만들었습니다.</p>

      <h2>만드는 원칙</h2>
      <ul>
        <li><strong>파일은 서버로 보내지 않습니다.</strong> 모든 도구는 지금 쓰는 브라우저 안에서 파일을 처리합니다.</li>
        <li><strong>할 수 있는 것과 없는 것을 분명히 적습니다.</strong> 사진의 촬영 정보와 파일 지문은 정리와 대조를 돕지만, 날짜나 사실, 거래 안전을 증명하지는 않습니다.</li>
        <li><strong>법령·고시·약관은 원문을 링크합니다.</strong> 인용할 때는 국가법령정보센터 같은 공식 출처와 확인일을 함께 적습니다.</li>
        <li><strong>확인하지 못한 것은 쓰지 않습니다.</strong> 시세, 이용자 수, 후기, 사례를 지어내지 않습니다. 예시 숫자는 예시라고 밝힙니다.</li>
      </ul>

      <h2>운영</h2>
      <p>운영: <a href="${SITE.operatorUrl}">${SITE.operator}</a>. 제이 미디어는 지역 직거래 장터 <a href="https://boribay.com/">보리장터</a>를 운영하는 회사입니다. 이 사이트에서 보리장터로 연결할 때는 같은 운영사의 서비스라는 점을 함께 적고, 독립된 외부 추천처럼 표시하지 않습니다.</p>

      <h2>함께 운영하는 농업 거래 지원 사이트</h2>
      <ul>${siblings.map(([name, url, text]) => `<li><a href="${url}">${name}</a> — ${text}</li>`).join("")}</ul>

      <h2>이름과 내용이 바뀌었습니다</h2>
      <p>이 사이트는 2026년 10월에 “goatool”에서 “거래 증빙 도우미”로 이름을 바꾸고, 예전의 민원·입사지원·학교 제출용 일반 파일 도구와 안내 글을 정리했습니다. 예전 주소로 들어오면 가장 가까운 새 도구나 안내로 이동합니다. 주소(goatool.com)는 그대로입니다.</p>

      <h2>수정 기록</h2>
      <p><time datetime="2026-10-26">2026-10-26</time>: 거래 증빙 중심으로 도구와 안내를 새로 구성했습니다. 증빙 묶음 만들기, 사진 이름 바꾸기, PDF 묶기, 번호 가리기, 정산표 점검, 같은 파일 확인 도구를 새로 만들고 거래 종류별 안내를 보강했습니다.</p>
      <p>틀린 곳이나 고쳐야 할 점은 <a href="/contact/">문의·오류 제보</a>로 알려 주세요.</p>`,
  },
  privacy: {
    path: "/privacy/",
    title: "개인정보 처리방침",
    description: "거래 증빙 도우미는 사진·서류 파일을 서버로 보내지 않고 브라우저 안에서만 처리합니다. 이 기기에 임시 저장되는 정보, 광고와 호스팅이 처리할 수 있는 정보, 지우는 방법을 안내합니다.",
    type: "WebPage",
    ads: false,
    body: `
      <p>시행일: ${UPDATED}</p>
      <h2>넣은 파일은 서버로 보내지 않습니다</h2>
      <p>증빙 묶음 만들기, 사진 이름 바꾸기, PDF 묶기, 번호 가리기, 정산표 점검, 같은 파일 확인 도구는 모두 지금 쓰는 브라우저 안에서 파일을 읽고 결과 파일을 만듭니다. 사진, 서류, 표 내용은 거래 증빙 도우미의 서버나 다른 곳으로 전송하지 않으며, 운영자는 그 내용을 볼 수 없습니다.</p>

      <h2>이 기기에 임시로 남는 정보</h2>
      <ul>
        <li><strong>증빙 묶음 만들기</strong>는 휴대폰이 브라우저를 닫거나 새로고침해도 이어서 할 수 있도록, 넣은 파일(100MB 이하)과 고른 항목·메모를 <strong>이 기기 브라우저의 저장 공간(IndexedDB)</strong>에 저장합니다. 이 정보도 기기 밖으로 나가지 않습니다.</li>
        <li>도구 화면의 <strong>넣은 파일 모두 지우기</strong> 버튼을 누르거나, 브라우저 설정에서 이 사이트의 데이터(쿠키 및 사이트 데이터)를 지우면 사라집니다. 여럿이 쓰는 컴퓨터에서는 작업이 끝나면 꼭 지워 주세요.</li>
        <li>다른 도구는 파일이나 입력 내용을 저장하지 않습니다. 페이지를 닫으면 사라집니다.</li>
      </ul>

      <h2>수집하지 않는 정보</h2>
      <p>회원가입이 없고 이름·연락처·주소를 받지 않습니다. 방문 통계를 위한 별도의 분석 도구도 쓰지 않습니다.</p>

      <h2>광고와 호스팅</h2>
      <ul>
        <li>운영비 마련을 위해 일부 페이지에 Google 애드센스 광고가 표시될 수 있습니다. Google은 광고를 보여 주기 위해 쿠키나 비슷한 기술을 쓸 수 있으며, 이는 Google의 정책에 따릅니다. 맞춤 광고는 <a href="https://adssettings.google.com/">Google 광고 설정</a>에서 끌 수 있고, 자세한 내용은 <a href="https://policies.google.com/technologies/ads?hl=ko">Google 광고 정책</a>에서 볼 수 있습니다.</li>
        <li>사이트를 제공하는 호스팅 서비스(Cloudflare)는 보안과 서비스 운영을 위해 접속 기록(IP 주소, 접속 시각 등)을 처리할 수 있습니다.</li>
      </ul>

      <h2>문의할 때</h2>
      <p>오류를 알려 주실 때 주민등록번호, 신분증, 통장 사본, 계약서처럼 개인정보가 담긴 원본 파일은 보내지 마세요. 어떤 도구에서 어떤 형식의 파일로 문제가 생겼는지만 설명해 주시면 됩니다.</p>

      <h2>운영자</h2>
      <p>${SITE.operator} · <a href="${SITE.operatorUrl}">${SITE.operatorUrl.replace("https://", "").replace(/\/$/, "")}</a>. 개인정보 관련 문의는 <a href="/contact/">문의·오류 제보</a> 안내를 따라 주세요.</p>`,
  },
  terms: {
    path: "/terms/",
    title: "이용안내",
    description: "거래 증빙 도우미의 도구와 안내를 이용할 때 알아 둘 점입니다. 도구는 정리를 돕는 보조 수단이며 법적 효력이나 거래 안전을 보장하지 않습니다.",
    type: "WebPage",
    ads: false,
    body: `
      <p>시행일: ${UPDATED}</p>
      <h2>보조 도구입니다</h2>
      <p>거래 증빙 도우미의 도구와 안내는 거래에 필요한 사진·서류를 빠짐없이 모으고 정리하도록 돕는 참고 자료입니다. 결과 파일이나 점검표가 법적 증거로 인정되는지, 거래가 안전한지, 상대가 믿을 만한지는 보장하지 않습니다.</p>

      <h2>원본은 직접 보관하세요</h2>
      <p>도구는 원래 파일을 바꾸지 않고 새 파일을 만듭니다. 원본 사진과 서류는 두 곳 이상에 따로 보관하고, 만든 결과 파일은 직접 열어 순서·글자·가린 부분을 확인한 뒤 쓰세요.</p>

      <h2>촬영 정보와 파일 지문의 한계</h2>
      <p>사진 속 촬영 날짜(EXIF)는 휴대폰 설정이나 편집으로 바뀔 수 있습니다. 파일 지문(SHA-256)은 두 파일이 같은지만 알려 줍니다. 둘 다 사진의 내용이나 찍은 날짜, 거래 사실을 증명하지 않습니다.</p>

      <h2>개인정보 가림은 직접 확인하세요</h2>
      <p>번호 가리기는 사용자가 칠한 부분만 덮습니다. 정산표 점검의 개인정보 알림은 흔한 형태(전화번호·계좌번호 등)를 찾는 것으로, 모든 개인정보를 찾지는 못합니다. 공유하기 전에 직접 다시 확인하세요.</p>

      <h2>처리 한계</h2>
      <p>기기 메모리와 브라우저 종류에 따라 큰 파일이나 많은 파일은 처리하지 못할 수 있습니다. 한 묶음에 넣을 수 있는 파일 수와 크기는 도구 화면에 적혀 있습니다.</p>

      <h2>법령·제도 안내</h2>
      <p>안내에 인용한 법령·고시·약관은 확인일 기준이며 바뀔 수 있습니다. 법률·세금·보험·대출 문제는 링크한 원문과 담당 기관, 전문가에게 확인하세요.</p>

      <h2>외부 링크</h2>
      <p>보리장터와 함께 운영하는 사이트(<a href="/about/">소개·운영</a> 참고) 외의 외부 사이트 내용은 각 운영자의 책임입니다.</p>`,
  },
  contact: {
    path: "/contact/",
    title: "문의·오류 제보",
    description: "거래 증빙 도우미 도구의 오류, 안내 글의 틀린 내용, 개선 제안을 알려 주는 방법입니다. 개인정보가 담긴 원본 파일은 보내지 마세요.",
    type: "ContactPage",
    ads: false,
    body: `
      <h2>오류·틀린 내용 알리기</h2>
      <ul>
        <li><strong>공개 제보</strong>: <a href="https://github.com/wlstj86231-cloud/ready-tool/issues">GitHub 이슈</a>에 남겨 주세요. GitHub 계정이 필요하고 작성한 내용은 누구나 볼 수 있습니다.</li>
        <li><strong>운영사 문의</strong>: <a href="https://jnewmedia.com/company/#contact">${SITE.operator} 문의 안내</a>의 연락 방법을 이용할 수 있습니다.</li>
      </ul>

      <h2>이렇게 알려 주시면 빨리 고칠 수 있습니다</h2>
      <ul>
        <li>페이지 주소와 도구 이름 (예: 증빙 묶음 만들기)</li>
        <li>휴대폰·컴퓨터 종류와 브라우저 (예: 갤럭시 + 크롬, 아이폰 + 사파리)</li>
        <li>어떤 순서로 무엇을 눌렀을 때 문제가 생겼는지</li>
        <li>안내 글이라면 틀린 문장과 근거 자료(공식 출처 링크)</li>
      </ul>

      <h2>보내지 말아 주세요</h2>
      <p>주민등록번호, 신분증, 통장 사본, 계약서, 실제 거래 사진처럼 개인정보가 담긴 원본 파일은 보내지 마세요. 문제를 보여 줄 파일이 필요하면 같은 형식의 연습용 파일을 새로 만들어 주세요.</p>

      <h2>답변하기 어려운 것</h2>
      <p>개별 거래의 분쟁 판단, 법률·세금 상담, 상대방 신원 확인은 도와 드리기 어렵습니다. 사기 피해가 의심되면 <a href="https://ecrm.police.go.kr/minwon/main">경찰청 사이버범죄 신고시스템</a>을 이용할 수 있습니다.</p>`,
  },
};

function render(page) {
  const url = `${SITE.base}${page.path}`;
  const title = `${page.title} - ${SITE.name}`;
  const schema = { "@context": "https://schema.org", "@type": page.type, name: page.title, url, inLanguage: "ko-KR", description: page.description, dateModified: UPDATED, publisher };
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(page.description)}" />
    <link rel="canonical" href="${url}" />
    ${commonHead({ ads: page.ads })}
    ${socialMeta({ title, description: page.description, url })}
    ${jsonLd(schema)}
  </head>
  <body>
    ${siteHeader("")}
    <main id="main" class="page" tabindex="-1">
      <div class="wrap article">
        <nav class="crumb" aria-label="현재 위치"><a href="/">처음</a> <span aria-hidden="true">›</span> <span>${escapeHtml(page.title)}</span></nav>
        <h1>${escapeHtml(page.title)}</h1>
        <p class="lead">${escapeHtml(page.description)}</p>
${page.body}
      </div>
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

function render404() {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>페이지를 찾을 수 없습니다 - ${SITE.name}</title>
    <meta name="robots" content="noindex" />
    ${commonHead({ ads: false })}
  </head>
  <body>
    ${siteHeader("")}
    <main id="main" class="page" tabindex="-1">
      <div class="wrap article">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p class="lead">주소가 바뀌었거나 없어진 페이지입니다. 거래 증빙 도우미는 2026년 10월에 거래 증빙 중심으로 도구와 안내를 정리했습니다.</p>
        <ul class="link-list">
          <li><a href="/">처음 화면</a></li>
          <li><a href="/tools/evidence-pack/">거래 증빙 사진 묶음 만들기</a></li>
          <li><a href="/agri/guides/">거래할 때 남길 사진·서류 가이드</a></li>
        </ul>
      </div>
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

for (const page of Object.values(pages)) {
  const dir = path.join(pub, page.path);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), render(page), "utf8");
}
await fs.writeFile(path.join(pub, "404.html"), render404(), "utf8");
console.log(`generated ${Object.keys(pages).length} info pages + 404`);
