// Builds the site-information pages (about, contact, editorial policy, corrections log,
// privacy, terms) and 404.html into public/.
import fs from "node:fs/promises";
import path from "node:path";
import {
  ADSENSE_ACCOUNT,
  BYLINE,
  CONSUMER_URL,
  ECRM_URL,
  KLAC_URL,
  ORG,
  SITE,
  WEBSITE_ID,
  breadcrumbNode,
  commonHead,
  escapeAttr,
  escapeHtml,
  graph,
  jsonLd,
  orgRef,
  siteFooter,
  siteHeader,
  socialMeta,
} from "./site-shell.mjs";
import { retired } from "./retired-routes.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pub = path.join(root, "public");
const UPDATED = "2026-10-26";
const RETIRED_COUNT = Object.keys(retired).length;

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

const operatorTable = `<div class="table-scroll"><table class="info-table">
        <tbody>
          <tr><th scope="row">상호</th><td>${ORG.displayName} · J MEDIA</td></tr>
          <tr><th scope="row">대표</th><td>${ORG.representative}</td></tr>
          <tr><th scope="row">사업자등록번호</th><td>${ORG.bizNo}</td></tr>
          <tr><th scope="row">주소</th><td>${ORG.address}</td></tr>
          <tr><th scope="row">고객센터</th><td><a href="tel:${ORG.phone.replace(/-/g, "")}">${ORG.phone}</a></td></tr>
          <tr><th scope="row">이메일</th><td><a href="mailto:${ORG.email}">${ORG.email}</a></td></tr>
          <tr><th scope="row">카카오톡 오픈채팅</th><td><a href="${ORG.kakaoGeneral}">제휴·일반 문의</a> · <a href="${ORG.kakaoBoribay}">보리장터 이용 문의</a></td></tr>
          <tr><th scope="row">회사 소개</th><td><a href="${ORG.companyUrl}">jnewmedia.com/company</a></td></tr>
          <tr><th scope="row">공식 채널</th><td><a href="https://boribay.com/">보리장터</a> · <a href="${ORG.sameAs[0]}">인스타그램</a> · <a href="${ORG.sameAs[1]}">네이버 블로그</a></td></tr>
        </tbody>
      </table></div>`;

// Public change log. Entries come from the repository history (git log) and are written for
// readers: what changed and, for corrections, what was wrong before. Newest first.
const changeLog = [
  ["2026-10-26", "신뢰 정보 보강", [
    "운영자 정보(상호·대표·사업자등록번호·주소·고객센터·이메일)를 <a href=\"/about/\">소개</a>·<a href=\"/contact/\">문의</a> 페이지와 모든 페이지 아래쪽에 적었습니다.",
    "<a href=\"/editorial/\">편집 원칙</a>과 이 정정·수정 기록 페이지를 새로 만들었습니다.",
    "모든 가이드와 도구 페이지에 작성·관리 표시, 게시일, 최종 확인일, 출처 목록, 범위와 한계를 붙였습니다. 출처가 없던 가이드 8편에 근거 법령·표준을 확인해 더했습니다.",
    "<strong>정정</strong>: 가이드 4편(판매글 사진 순서, 판매글 사진 순번, 출하가능일·도정일 열, 망·단·상자 kg 열)의 구조화 데이터에 게시일이 2026-08-10으로 적혀 있었으나, 실제로 처음 공개한 날인 2026-09-20으로 고쳤습니다.",
    "<strong>정정</strong>: 개인정보처리방침의 방문 통계 문단에 확인일이 빈칸으로 나가던 것을 고쳤고, 광고 쿠키와 맞춤 광고 해제 방법 설명을 보강했습니다.",
    "파일을 다루는 도구 페이지 6곳에서 광고를 뺐습니다. 광고는 안내 글 같은 콘텐츠 페이지에만 표시됩니다.",
    "몽골어 페이지 3곳을 검색 결과에서 빼고(noindex) 광고를 없앴습니다. 페이지는 그대로 쓸 수 있습니다.",
  ]],
  ["2026-10-26", "개인정보처리방침 정정", [
    "<strong>정정</strong>: 방침에 방문 통계 도구를 쓰지 않는다고 적혀 있었으나, 실제로는 Cloudflare Web Analytics가 쓰이고 있었습니다. 수집하는 정보(페이지 주소, 이전 페이지, 브라우저 종류, 열리는 시간)와 쿠키를 쓰지 않는다는 점, 도구에 넣은 파일 이름·내용은 들어가지 않는다는 점을 적었습니다.",
  ]],
  ["2026-10-26", "도구 오류 정정", [
    "<strong>정정</strong>: 증빙 묶음 만들기의 보내기용 묶음은 위치정보를 지운다고 안내했지만, 휴대폰 영상과 브라우저에서 열 수 없는 사진(컴퓨터의 HEIC 등)은 위치정보가 든 그대로 들어갔습니다. 이제 이런 파일은 넣지 않고 화면과 목록 파일에 이유를 적습니다.",
    "<strong>정정</strong>: 정산표 점검에서 제목 줄이나 빈 줄이 위에 있으면 결과의 줄 번호가 실제 파일과 어긋나던 문제, 엑셀 날짜가 숫자로 보이던 문제를 고쳤습니다.",
  ]],
  ["2026-10-26", "가이드 문구 정정과 통합", [
    "<strong>정정</strong>: 「농산물 보낼 때 남길 사진」의 포장 겉면 표시 항목을 「농수산물 품질관리법 시행규칙」 제7조 원문대로 고치고, 「상법」 제146조 설명을 조문대로(이의 없이 받으면 책임 소멸, 바로 알 수 없던 훼손은 2주 안 통지) 고쳤습니다.",
    "내용이 거의 같던 kg 열 안내 3편을 「망·단·상자·통 수량을 kg 열로 맞추는 법」 하나로 합치고, 옛 주소는 새 글로 이동하게 했습니다.",
  ]],
  ["2026-10-26", "사이트 개편", [
    `이름을 “거래 증빙 도우미”로 바꾸고, 증빙 묶음 만들기를 비롯한 도구 6개를 새로 만들었습니다. 예전의 민원·입사지원·학교 제출용 일반 파일 도구와 안내 글을 내리고, 그 주소 ${RETIRED_COUNT}개는 가장 가까운 새 페이지로 이동하게 했습니다.`,
    "중고 농기계·정산 안내를 다시 쓰고, 농산물 출하 증빙, 사진 촬영 날짜, 최종 점검표 안내 3편을 새로 썼습니다.",
  ]],
  ["2026-10-15", "작성 방법 보강", ["농업 거래 파일 안내에 작성 책임, 연결한 도구의 파일 처리 범위, 결과의 한계를 적었습니다."]],
  ["2026-09-27", "농업 거래 중심 정리", ["처음 화면을 농산물·농기계 거래 증빙 파일 중심으로 다시 배치했습니다."]],
  ["2026-09-24", "몽골어 도구 추가", ["몽골어 사용자를 위한 캐시미어·트랙터 거래 파일 정리 도구 2개를 추가했습니다."]],
  ["2026-09-20", "안내 추가", ["판매글 사진 순서, 판매글 사진 순번, 출하가능일·도정일 열, 포장 단위 kg 열 안내를 추가했습니다."]],
  ["2026-09-16", "안내 보강", ["중고 농기계 인계, 직거래 정산, 폐농자재 처분 기록 안내를 보강했습니다."]],
  ["2026-08-10", "관리 기록 시작", ["이 사이트의 변경 기록은 이날부터 남아 있습니다. 그 전의 변경 내용은 기록이 없어 적지 않습니다."]],
];

const pages = {
  about: {
    path: "/about/",
    title: "소개",
    heading: "거래 증빙 도우미 소개",
    description: "거래 증빙 도우미가 무엇을 하는 사이트인지, 누가 왜 운영하는지, 운영비는 어떻게 마련하는지, 이 주소의 지난 이력까지 알려 드립니다. 운영: 제이 미디어(보리장터 운영사).",
    type: "AboutPage",
    published: "2026-10-26",
    ads: true,
    body: `
      <h2>무엇을 하는 사이트인가요</h2>
      <p>거래 증빙 도우미는 중고 농기계를 사고팔 때, 농산물을 보낼 때, 직거래 판매를 정산할 때 <strong>무엇을 찍고 어떤 서류를 남길지</strong> 알려 드리고, 그 사진과 서류를 알아보기 쉬운 이름으로 묶어 보관하도록 돕는 사이트입니다. 핵심 도구는 <a href="/tools/evidence-pack/">거래 증빙 사진 묶음 만들기</a>이고, <a href="/agri/guides/">가이드</a>에서 거래 종류별로 남길 자료와 이유를 설명합니다.</p>
      <p>직접 농산물을 팔거나 농기계를 사고파는 농업인과, 그 상대가 되는 구매자를 위해 만들었습니다. 휴대폰으로도 쓰기 쉽게 글자와 버튼을 크게 만들었고, 회원가입 없이 무료로 씁니다.</p>

      <h2>누가, 왜 운영하나요</h2>
      <p>${ORG.name}가 운영합니다. ${ORG.name}는 같은 지역 사람끼리 농산물과 중고 농기계를 사고팔고 농기계 운송업체를 찾는 지역 직거래 장터 <a href="https://boribay.com/">보리장터</a>를 운영하는 회사입니다.</p>
      <p>직거래는 계약서나 영수증 없이 메시지와 사진만으로 마무리되는 일이 많습니다. 그러면 나중에 기계 상태나 무게, 금액을 두고 서로 기억이 다를 때 함께 볼 자료가 남아 있지 않을 수 있습니다. 거래 증빙 도우미는 농산물·농기계 거래의 여러 단계 가운데 <strong>“무엇을 남겨 둘지 챙기고 정리하는 일”</strong> 하나를 맡는 보조 사이트입니다.</p>

      <h2>운영자 정보</h2>
      ${operatorTable}
      <p>문의와 오류 제보 방법은 <a href="/contact/">문의</a> 페이지에 있습니다.</p>

      <h2>어떻게 만드나요</h2>
      <ul>
        <li><strong>파일은 서버로 보내지 않습니다.</strong> 모든 도구는 지금 쓰는 브라우저 안에서 파일을 처리합니다.</li>
        <li><strong>공식 자료를 확인해 씁니다.</strong> 법령·고시·약관·기술 표준을 인용할 때는 원문 링크와 확인일을 글 끝 출처 목록에 적습니다.</li>
        <li><strong>할 수 있는 것과 없는 것을 분명히 적습니다.</strong> 글과 도구마다 “범위와 한계”를 두었습니다. 사진의 촬영 정보와 파일 지문은 정리와 대조를 돕지만 날짜나 사실, 거래 안전을 증명하지 않습니다.</li>
        <li><strong>확인하지 못한 것은 쓰지 않습니다.</strong> 시세, 이용자 수, 후기, 사례를 지어내지 않고, 예시 숫자는 예시라고 밝힙니다.</li>
        <li><strong>AI 도구 활용을 밝힙니다.</strong> 초안 작성과 자료 대조에 AI 도구를 쓰며, 게시한 내용의 책임은 운영자에게 있습니다.</li>
      </ul>
      <p>자세한 작성 방법은 <a href="/editorial/">편집 원칙</a>에, 고친 내용은 <a href="/corrections/">정정·수정 기록</a>에 공개합니다.</p>

      <h2>운영비와 광고</h2>
      <p>운영비는 안내 글 같은 콘텐츠 페이지에 표시되는 Google 애드센스 광고로 마련합니다. 사진과 서류를 다루는 도구 페이지에는 광고를 싣지 않습니다. 돈을 받고 특정 업체나 상품을 소개하는 유료 게재나 협찬 글은 없습니다.</p>
      <p>글 속의 보리장터 링크는 같은 운영사의 서비스로 연결하는 것이며, 링크 옆에 그 사실을 함께 적습니다. 광고가 어떤 정보를 쓰는지는 <a href="/privacy/">개인정보처리방침</a>에 있습니다.</p>

      <h2>같은 운영사의 농업 거래 지원 사이트</h2>
      <p>아래 사이트는 모두 ${ORG.name}가 운영하며, 보리장터 거래의 앞뒤 단계를 하나씩 맡고 있습니다.</p>
      <ul>${siblings.map(([name, url, text]) => `<li><a href="${url}">${name}</a> — ${text}</li>`).join("")}</ul>

      <h2>이 주소(goatool.com)의 지난 이력</h2>
      <p>goatool.com은 처음에 “goatool”이라는 이름으로 민원·입사지원·학교 제출용 파일을 다루는 일반 브라우저 도구와 안내 글을 싣던 사이트였습니다. 2026년 8~9월에 농산물·농기계 거래에 쓰는 파일 안내가 더해졌고, 2026년 10월 26일 이름을 “거래 증빙 도우미”로 바꾸면서 거래 증빙과 관계없는 예전 도구와 안내 글을 내렸습니다. 예전 주소 ${RETIRED_COUNT}개는 가장 가까운 새 도구나 안내로 이동합니다. 날짜별 변경 내용은 <a href="/corrections/">정정·수정 기록</a>에 있습니다.</p>`,
  },
  contact: {
    path: "/contact/",
    title: "문의",
    heading: "문의·오류 제보",
    description: "거래 증빙 도우미 운영사 연락처(고객센터 전화, 이메일, 카카오톡 오픈채팅, 주소)와 도구 오류·안내 글의 틀린 내용을 알려 주는 방법입니다.",
    type: "ContactPage",
    published: "2026-10-26",
    ads: false,
    body: `
      <h2>연락처</h2>
      ${operatorTable}
      <ul>
        <li><strong>공개 제보</strong>: 도구 오류나 글의 틀린 내용은 <a href="https://github.com/wlstj86231-cloud/ready-tool/issues">GitHub 이슈</a>에도 남길 수 있습니다. GitHub 계정이 필요하고, 작성한 내용은 누구나 볼 수 있습니다.</li>
        <li>보리장터 이용(매물, 게시글, 계정)에 관한 문의는 <a href="${ORG.kakaoBoribay}">보리장터 이용 문의 오픈채팅</a>이 빠릅니다.</li>
      </ul>

      <h2>오류·정정 제보할 때 적어 주세요</h2>
      <ul>
        <li>페이지 주소와 도구 이름 (예: 증빙 묶음 만들기)</li>
        <li>안내 글이라면 틀린 문장과, 바른 내용을 확인할 수 있는 근거(법령 원문이나 공공기관 안내 링크)</li>
        <li>도구라면 휴대폰·컴퓨터 종류와 브라우저 (예: 갤럭시 + 크롬, 아이폰 + 사파리), 어떤 순서로 무엇을 눌렀을 때 문제가 생겼는지</li>
        <li>답변을 받을 연락 방법 (원하실 때만)</li>
      </ul>

      <h2>답변과 처리</h2>
      <p>보내 주신 내용은 영업일 기준으로 확인한 뒤 답변합니다. 내용을 확인하는 데 시간이 걸리면 그렇다고 먼저 알려 드립니다. 오류로 확인되면 고치고, 사실·숫자·법령 문구·도구 결과에 영향을 준 수정은 <a href="/corrections/">정정·수정 기록</a>에 날짜와 함께 남깁니다. 처리 원칙은 <a href="/editorial/">편집 원칙</a>에 있습니다.</p>

      <h2>보내지 말아 주세요</h2>
      <p>주민등록번호, 신분증, 통장 사본, 계약서, 실제 거래 사진처럼 개인정보가 담긴 원본 파일은 보내지 마세요. 이 사이트의 도구는 파일을 서버로 보내지 않으므로 운영자도 여러분이 넣은 파일을 볼 수 없습니다. 문제를 보여 줄 파일이 필요하면 같은 형식의 연습용 파일을 새로 만들어 주세요.</p>

      <h2>답변하기 어려운 것</h2>
      <p>개별 거래의 분쟁 판단, 법률·세금 상담, 상대방 신원 확인은 도와 드리기 어렵습니다. 아래 공식 창구를 이용하세요.</p>
      <ul>
        <li>사기 피해가 의심될 때: <a href="${ECRM_URL}">경찰청 사이버범죄 신고시스템</a></li>
        <li>택배·소비자 분쟁 상담: <a href="${CONSUMER_URL}">1372소비자상담센터</a> (국번 없이 1372)</li>
        <li>법률 상담: <a href="${KLAC_URL}">대한법률구조공단</a> (국번 없이 132)</li>
      </ul>`,
  },
  editorial: {
    path: "/editorial/",
    title: "편집 원칙",
    heading: "편집 원칙·콘텐츠 작성 방법",
    description: "거래 증빙 도우미의 안내 글과 도구를 누가 어떻게 만들고, 어떤 자료를 근거로 삼고, 날짜를 어떻게 적고, 무엇을 하지 않는지 밝힙니다. AI 도구 활용과 이해관계도 함께 공개합니다.",
    type: "WebPage",
    published: "2026-10-26",
    ads: false,
    body: `
      <h2>누가 만들고 책임지나요</h2>
      <p>안내 글과 도구는 ${ORG.name} 편집팀이 만들고 관리하며, 게시한 내용의 책임은 운영자인 ${ORG.name}(대표 ${ORG.representative})에게 있습니다. 글마다 “${BYLINE.replace(/<[^>]+>/g, "")}”로 표시합니다. 이 사이트는 개인 필자나 외부 전문가의 감수를 내세우지 않습니다. 확보하지 않은 현장 경험이나 전문가 감수를 표시하지 않는다는 원칙을 따릅니다.</p>

      <h2>왜 이 주제를 다루나요</h2>
      <p>${ORG.name}는 농산물과 중고 농기계를 직거래하는 <a href="https://boribay.com/">보리장터</a>를 운영합니다. 직거래에서 사진·서류를 미리 남겨 두지 않아 생기는 혼란을 줄이는 것이 이 사이트의 목적입니다. 글은 보리장터 거래 흐름에서 자료가 필요한 단계(판매글, 실물 확인, 계약, 인도, 출하, 정산)를 따라 고릅니다.</p>

      <h2>어떻게 만드나요</h2>
      <ol>
        <li><strong>자료 모으기</strong>: 공식·1차 자료를 먼저 찾습니다. 국가법령정보센터의 법령·고시 원문, 정부 부처와 공공기관의 발표, 기술 표준 문서(Exif, SHA-256, 웹 표준), 도구가 쓰는 소프트웨어의 공식 문서가 기준입니다. 개인 블로그나 커뮤니티 글은 근거로 쓰지 않습니다.</li>
        <li><strong>초안과 대조</strong>: 초안 작성과 자료 대조에 AI 도구를 활용합니다. 법령 조문, 숫자, 날짜는 원문을 열어 문장과 다시 맞춰 보고, 원문에서 확인하지 못한 내용은 쓰지 않습니다.</li>
        <li><strong>출처와 확인일 표기</strong>: 글 끝 “출처”에 자료 제목, 기관, 주소, 확인일을 적고, 본문에서 법령이나 숫자를 인용한 곳 옆에도 확인일을 적습니다.</li>
        <li><strong>도구 확인</strong>: 도구 페이지의 계산 기준과 처리 한도는 실제 코드의 값과 같게 적습니다. 파일이 브라우저 밖으로 나가지 않는다는 설명은 파일을 넣은 상태에서 브라우저의 네트워크 기록을 확인해 점검했습니다(2026-10-26).</li>
        <li><strong>게시 후 관리</strong>: 오류 제보를 받으면 확인해 고치고, 내용에 영향을 준 수정은 <a href="/corrections/">정정·수정 기록</a>에 남깁니다. 법령 개정 등으로 다시 확인한 글은 최종 확인일을 새로 적습니다.</li>
      </ol>

      <h2>날짜는 이렇게 적습니다</h2>
      <ul>
        <li><strong>게시일</strong>: 그 페이지를 처음 공개한 날입니다. 사이트 변경 기록(2026-08-10부터 남아 있음)에서 확인한 날짜를 적고, 앞당겨 적지 않습니다.</li>
        <li><strong>최종 확인일</strong>: 출처와 본문을 마지막으로 다시 맞춰 본 날입니다.</li>
      </ul>

      <h2>예시와 사례</h2>
      <p>계산 방법을 보여 주는 숫자와 파일 이름은 “설명용 예시”라고 밝힙니다. 실제 고객 사례, 후기, 이용자 수, 수상·보도 이력을 만들어 쓰지 않습니다.</p>

      <h2>하지 않는 것</h2>
      <ul>
        <li>법률·세무·보험·금융에 관한 개별 상담이나 판단을 하지 않습니다. 글마다 “범위와 한계”에 확인할 기관을 적습니다.</li>
        <li>정리한 자료가 법적 증거로 인정되거나 거래가 안전하다고 보장하지 않습니다.</li>
        <li>돈을 받고 특정 업체나 상품을 소개하지 않습니다.</li>
      </ul>

      <h2>이해관계 공개</h2>
      <ul>
        <li>보리장터와 <a href="/about/">소개</a> 페이지에 적은 농업 거래 지원 사이트는 모두 같은 운영사의 서비스입니다. 글에서 보리장터로 연결할 때는 같은 운영사라는 점을 함께 적습니다.</li>
        <li>운영비는 Google 애드센스 광고로 마련합니다. 광고는 콘텐츠 페이지에만 표시되며, 광고 내용은 Google이 정하고 운영자가 고르지 않습니다. 광고주는 글 내용에 관여하지 않습니다.</li>
      </ul>

      <h2>오류를 발견하면</h2>
      <p><a href="/contact/">문의</a> 페이지의 연락처나 GitHub 이슈로 알려 주세요. 처리 방법은 <a href="/corrections/">정정·수정 기록</a> 페이지에 있습니다.</p>`,
  },
  corrections: {
    path: "/corrections/",
    title: "정정·수정 기록",
    heading: "정정 정책과 수정 기록",
    description: "거래 증빙 도우미에서 틀린 내용을 알리는 방법, 정정을 처리하는 순서, 그리고 지금까지 고친 내용을 날짜순으로 공개합니다.",
    type: "WebPage",
    published: "2026-10-26",
    ads: false,
    body: `
      <h2>정정 정책</h2>
      <ol>
        <li><strong>알리기</strong>: <a href="/contact/">문의</a> 페이지의 전화·이메일·카카오톡 오픈채팅이나 <a href="https://github.com/wlstj86231-cloud/ready-tool/issues">GitHub 이슈</a>로 페이지 주소, 틀린 문장, 근거 자료를 알려 주세요.</li>
        <li><strong>확인</strong>: 영업일 기준으로 근거 자료와 원문을 다시 열어 확인합니다.</li>
        <li><strong>수정</strong>: 오류로 확인되면 본문을 고치고, 그 페이지의 최종 확인일을 새로 적습니다.</li>
        <li><strong>기록</strong>: 사실·숫자·법령 문구·도구 결과에 영향을 준 수정은 아래 기록에 날짜와 함께, 무엇이 틀렸는지까지 남깁니다. 글자 틀림처럼 뜻이 바뀌지 않는 수정은 따로 적지 않을 수 있습니다.</li>
      </ol>
      <p>제보한 내용이 오류가 아니라고 판단되면 그 이유를 근거와 함께 답변합니다.</p>

      <h2>수정 기록</h2>
      <p>최근 기록부터 적습니다. “정정”은 틀렸던 내용을 고친 것입니다.</p>
      <div class="change-log">${changeLog
        .map(
          ([date, title, items]) =>
            `<section class="change-entry"><h3><time datetime="${date}">${date}</time> ${escapeHtml(title)}</h3><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`
        )
        .join("")}</div>`,
  },
  privacy: {
    path: "/privacy/",
    title: "개인정보처리방침",
    heading: "개인정보처리방침",
    description: "거래 증빙 도우미는 사진·서류 파일을 서버로 보내지 않고 브라우저 안에서만 처리합니다. 이 기기에 임시 저장되는 정보, 방문 통계, Google 애드센스 광고 쿠키와 맞춤 광고 해제 방법, 문의처를 안내합니다.",
    type: "WebPage",
    published: "2026-10-26",
    ads: false,
    body: `
      <p>시행일: ${UPDATED} (이 날짜에 고친 내용은 <a href="/corrections/">정정·수정 기록</a>에 있습니다)</p>

      <h2>넣은 파일은 서버로 보내지 않습니다</h2>
      <p>증빙 묶음 만들기, 사진 이름 바꾸기, PDF 묶기, 번호 가리기, 정산표 점검, 같은 파일 확인 도구는 모두 지금 쓰는 브라우저 안에서 파일을 읽고 결과 파일을 만듭니다. 사진, 서류, 표 내용은 거래 증빙 도우미의 서버나 다른 곳으로 전송하지 않으며, 운영자는 그 내용을 볼 수 없습니다. 파일을 넣은 상태에서 브라우저의 네트워크 기록을 확인해 파일이 전송되지 않는 것을 점검했습니다(확인일 ${UPDATED}).</p>

      <h2>이 기기에 임시로 남는 정보</h2>
      <ul>
        <li><strong>증빙 묶음 만들기</strong>는 휴대폰이 브라우저를 닫거나 새로고침해도 이어서 할 수 있도록, 넣은 파일(100MB 이하)과 고른 항목·메모를 <strong>이 기기 브라우저의 저장 공간(IndexedDB)</strong>에 저장합니다. 이 정보도 기기 밖으로 나가지 않습니다.</li>
        <li>도구 화면의 <strong>넣은 파일 모두 지우기</strong> 버튼을 누르거나, 브라우저 설정에서 이 사이트의 데이터(쿠키 및 사이트 데이터)를 지우면 사라집니다. 여럿이 쓰는 컴퓨터에서는 작업이 끝나면 꼭 지워 주세요.</li>
        <li>다른 도구는 파일이나 입력 내용을 저장하지 않습니다. 페이지를 닫으면 사라집니다.</li>
      </ul>

      <h2>수집하지 않는 정보</h2>
      <p>회원가입이 없고 이름·연락처·주소를 받지 않습니다. 도구에 넣은 파일의 이름과 내용, 입력한 거래 이름·메모도 서버로 보내지 않습니다.</p>

      <h2>방문 통계</h2>
      <p>사이트를 제공하는 Cloudflare의 방문 통계 기능(Cloudflare Web Analytics)이 페이지에 작은 스크립트를 넣어, 방문한 페이지 주소, 이전 페이지 주소(리퍼러), 브라우저·운영체제 종류, 페이지가 열리는 데 걸린 시간 같은 정보를 모읍니다. 쿠키를 쓰지 않으며 운영자는 페이지별 방문 수 같은 합계만 봅니다. 도구에 넣은 파일 이름이나 내용은 이 정보에 들어가지 않습니다(확인일 ${UPDATED}).</p>

      <h2>광고(Google 애드센스)</h2>
      <p>운영비 마련을 위해 처음 화면, 가이드, 소개 페이지 같은 콘텐츠 페이지에 Google 애드센스 광고가 표시될 수 있습니다. <strong>사진·서류를 다루는 도구 페이지와 이 방침·약관·문의 페이지에는 광고 스크립트를 넣지 않습니다.</strong></p>
      <ul>
        <li>Google을 포함한 제3자 광고 업체는 쿠키를 사용해, 이용자가 이 사이트와 다른 사이트를 이전에 방문한 기록을 바탕으로 광고를 게재합니다.</li>
        <li>Google은 광고 쿠키를 사용해 이용자가 이 사이트나 인터넷의 다른 사이트를 방문한 기록을 바탕으로 Google과 파트너가 광고를 게재할 수 있게 합니다.</li>
        <li>이용자는 <a href="https://adssettings.google.com/">Google 광고 설정</a>에서 맞춤 광고를 끌 수 있습니다. Google이 광고에 정보를 어떻게 쓰는지는 <a href="https://policies.google.com/technologies/ads?hl=ko">Google 광고 정책</a>과 <a href="https://policies.google.com/technologies/partner-sites?hl=ko">Google 파트너 사이트에서의 데이터 사용</a>에서 볼 수 있습니다.</li>
        <li>광고를 보여 주는 과정에서 Google이 처리하는 정보는 Google의 개인정보처리방침에 따르며, 운영자는 그 정보를 받거나 볼 수 없습니다.</li>
      </ul>

      <h2>호스팅</h2>
      <p>사이트를 제공하는 호스팅 서비스(Cloudflare)는 보안과 서비스 운영을 위해 접속 기록(IP 주소, 접속 시각 등)을 처리할 수 있습니다.</p>

      <h2>문의할 때</h2>
      <p>전화·이메일·카카오톡으로 문의하시면 답변에 필요한 범위에서 연락처와 문의 내용을 받게 됩니다. 이 정보는 답변과 오류 수정에만 쓰고 다른 곳에 제공하지 않습니다. 오류를 알려 주실 때 주민등록번호, 신분증, 통장 사본, 계약서처럼 개인정보가 담긴 원본 파일은 보내지 마세요.</p>

      <h2>개인정보 문의처</h2>
      <p>${ORG.displayName} · 대표 ${ORG.representative} · 고객센터 <a href="tel:${ORG.phone.replace(/-/g, "")}">${ORG.phone}</a> · <a href="mailto:${ORG.email}">${ORG.email}</a><br>${ORG.address}</p>
      <p>방침을 바꾸면 이 페이지의 시행일을 새로 적고, 바뀐 내용을 <a href="/corrections/">정정·수정 기록</a>에 남깁니다.</p>`,
  },
  terms: {
    path: "/terms/",
    title: "이용약관",
    heading: "이용약관",
    description: "거래 증빙 도우미의 도구와 안내를 이용할 때의 약속과 면책 범위입니다. 도구는 정리를 돕는 보조 수단이며 법적 효력이나 거래 안전을 보장하지 않습니다. 법률·세금·분쟁 문제는 공식 기관에 확인하세요.",
    type: "WebPage",
    published: "2026-10-26",
    ads: false,
    body: `
      <p>시행일: ${UPDATED}</p>

      <h2>제공하는 것</h2>
      <p>거래 증빙 도우미는 ${ORG.displayName}가 운영하며, 거래에 필요한 사진·서류를 빠짐없이 모으고 정리하도록 돕는 무료 도구와 안내 글을 제공합니다. 회원가입 없이 누구나 이용할 수 있습니다.</p>

      <h2>이용할 때 지켜 주세요</h2>
      <ul>
        <li>도구를 다른 사람의 개인정보를 무단으로 모으거나, 사진·서류를 고쳐 남을 속이는 데 쓰지 마세요.</li>
        <li>사이트에 과도한 자동 요청을 보내 서비스를 방해하지 마세요.</li>
        <li>안내 글과 그림의 저작권은 운영자에게 있습니다. 개인적인 거래 준비를 위해 인쇄하거나 출처를 밝혀 일부를 인용할 수 있습니다.</li>
      </ul>

      <h2>원본은 직접 보관하세요</h2>
      <p>도구는 원래 파일을 바꾸지 않고 새 파일을 만듭니다. 원본 사진과 서류는 두 곳 이상에 따로 보관하고, 만든 결과 파일은 직접 열어 순서·글자·가린 부분을 확인한 뒤 쓰세요.</p>

      <h2>면책</h2>
      <ul>
        <li><strong>법적 효력을 보장하지 않습니다.</strong> 결과 파일, 점검표, 파일 지문이 법적 증거로 인정되는지, 거래가 안전한지, 상대가 믿을 만한지는 보장하지 않습니다.</li>
        <li><strong>촬영 정보와 파일 지문의 한계</strong>: 사진 속 촬영 날짜(EXIF)는 휴대폰 설정이나 편집으로 바뀔 수 있고, 파일 지문(SHA-256)은 두 파일이 같은지만 알려 줍니다. 둘 다 사진의 내용이나 찍은 날짜, 거래 사실을 증명하지 않습니다.</li>
        <li><strong>개인정보 가림은 직접 확인하세요</strong>: 번호 가리기는 사용자가 칠한 부분만 덮습니다. 정산표 점검의 개인정보 알림은 흔한 형태를 찾는 것으로 모든 개인정보를 찾지 못합니다.</li>
        <li><strong>처리 한계</strong>: 기기 메모리와 브라우저 종류에 따라 큰 파일이나 많은 파일은 처리하지 못할 수 있습니다. 도구별 한도는 각 도구 페이지의 “이 도구에 대해”에 적었습니다.</li>
        <li><strong>안내 글은 참고 자료입니다</strong>: 인용한 법령·고시·약관은 확인일 기준이며 바뀔 수 있습니다. 이 사이트는 법률·세무·보험·금융 상담을 하지 않습니다.</li>
        <li>운영자의 고의나 중대한 과실이 없는 한, 도구 결과나 안내를 그대로 따른 데서 생긴 손해에 책임지지 않습니다.</li>
      </ul>

      <h2>무엇을 누구에게 확인해야 하나요</h2>
      <ul>
        <li>법령·고시 원문: <a href="https://www.law.go.kr/">국가법령정보센터</a></li>
        <li>표준규격·원산지 표시: 국립농산물품질관리원 안내와 고시 원문</li>
        <li>택배 사고 접수와 배상: 이용한 택배사 고객센터와 약관, 분쟁 상담은 <a href="${CONSUMER_URL}">1372소비자상담센터</a>(국번 없이 1372)</li>
        <li>계약 다툼·법률 문제: <a href="${KLAC_URL}">대한법률구조공단</a>(국번 없이 132)이나 변호사</li>
        <li>사기 피해: <a href="${ECRM_URL}">경찰청 사이버범죄 신고시스템</a></li>
        <li>세금 신고: 관할 세무서나 세무 전문가</li>
      </ul>

      <h2>외부 링크</h2>
      <p>보리장터와 같은 운영사의 사이트(<a href="/about/">소개</a> 참고)를 뺀 외부 사이트의 내용은 각 운영자의 책임입니다.</p>

      <h2>약관 변경</h2>
      <p>약관을 바꾸면 이 페이지의 시행일을 새로 적고, 바뀐 내용을 <a href="/corrections/">정정·수정 기록</a>에 남깁니다. 문의는 <a href="/contact/">문의</a> 페이지를 이용하세요.</p>`,
  },
};

function render(page) {
  const url = `${SITE.base}${page.path}`;
  const title = `${page.title} - ${SITE.name}`;
  const schema = graph(
    {
      "@type": page.type,
      "@id": `${url}#webpage`,
      name: page.heading,
      url,
      inLanguage: "ko-KR",
      description: page.description,
      datePublished: page.published,
      dateModified: UPDATED,
      isPartOf: { "@id": WEBSITE_ID },
      publisher: orgRef,
      ...(page.type === "AboutPage" || page.type === "ContactPage" ? { mainEntity: orgRef } : {}),
    },
    breadcrumbNode([
      ["처음", "/"],
      [page.title, page.path],
    ])
  );
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
        <h1>${escapeHtml(page.heading)}</h1>
        <p class="lead">${escapeHtml(page.description)}</p>
        <p class="page-meta">관리: ${escapeHtml(ORG.name)} · 최종 수정 <time datetime="${UPDATED}">${UPDATED}</time></p>
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
          <li><a href="/contact/">문의</a></li>
        </ul>
      </div>
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

if (!ADSENSE_ACCOUNT) throw new Error("missing AdSense account id");
for (const page of Object.values(pages)) {
  const dir = path.join(pub, page.path);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), render(page), "utf8");
}
await fs.writeFile(path.join(pub, "404.html"), render404(), "utf8");
console.log(`generated ${Object.keys(pages).length} info pages + 404`);
