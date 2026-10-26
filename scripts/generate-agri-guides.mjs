// Builds the static guide pages in public/agri/guides/ (hub + one page per guide).
import fs from "node:fs/promises";
import path from "node:path";
import { presets } from "../src/data/presets.js";
import { SITE, boribay, commonHead, escapeAttr, escapeHtml, jsonLd, publisher, siteFooter, siteHeader, socialMeta } from "./site-shell.mjs";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "agri", "guides");
const base = SITE.base;
const CHECKED = SITE.checked;

// Old campaign links kept exactly as they were on guides whose content did not change.
const legacyBoribay = (slug, campaign, content) =>
  `https://boribay.com/guides/${slug}?utm_source=goatool.com&utm_medium=owned_referral&utm_campaign=${campaign}&utm_content=${content}`;

const sources = {
  standard: ["국립농산물품질관리원 고시 「농산물 표준규격」 (제2025-6호, 2025-08-04 시행) — 국가법령정보센터", "https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=2100000262624"],
  qualityRule7: ["「농수산물 품질관리법 시행규칙」 제7조(표준규격품의 출하 및 표시방법 등) — 국가법령정보센터", "https://www.law.go.kr/법령/농수산물품질관리법시행규칙/제7조"],
  origin: ["「농수산물의 원산지 표시 등에 관한 법률」 제5조(원산지 표시) — 국가법령정보센터", "https://www.law.go.kr/법령/농수산물의원산지표시등에관한법률/제5조"],
  commerce146: ["「상법」 제146조(운송인의 책임소멸) — 국가법령정보센터", "https://www.law.go.kr/법령/상법/제146조"],
  parcelTerms: ["공정거래위원회 「택배업 표준약관 개정」 (2020-06-18) — 대한민국 정책브리핑", "https://www.korea.kr/news/policyNewsView.do?newsId=156396329"],
  ecrm: ["경찰청 사이버범죄 신고시스템", "https://ecrm.police.go.kr/minwon/main"],
};

const shotList = (presetId, filter) =>
  `<ul class="shot-list">${presets[presetId].items
    .filter(filter)
    .map((item) => `<li><h3>${escapeHtml(item.name)}${item.need ? "" : ' <small class="muted">(있으면 좋음)</small>'}</h3><p>${escapeHtml(item.why)}</p><p class="tip">요령: ${escapeHtml(item.tip)}</p></li>`)
    .join("")}</ul>`;

const checkboxList = (items) => `<ul class="checkbox-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

const guides = [
  {
    slug: "used-machinery-handover-files",
    group: "machinery",
    published: "2026-08-10",
    modified: "2026-10-26",
    title: "중고 농기계 사고팔 때 남길 사진·서류 체크리스트",
    description: "트랙터·콤바인·이앙기 같은 중고 농기계를 사고팔 때 판매글, 실물 확인, 계약, 넘겨주는 날까지 단계별로 찍어 둘 사진과 챙길 서류를 정리했습니다. 명판·차대번호·사용시간계·누유·인도 사진을 왜, 어떻게 찍는지 함께 설명합니다.",
    card: "판매글·실물 확인·계약·인도까지 단계별 촬영 목록",
    intro: [
      "중고 농기계 거래의 다툼은 대개 “그때는 멀쩡했다”와 “받아 보니 아니었다” 사이에서 생깁니다. 판매자와 구매자가 같은 사진과 서류를 나눠 가지고 있으면, 어느 시점에 무엇이 달라졌는지 서로 같은 자료를 보며 이야기할 수 있습니다.",
      "이 목록은 판매자와 구매자 모두를 위한 것입니다. 판매자는 판매글을 올리기 전과 넘겨주는 날에, 구매자는 실물을 보러 갔을 때와 받는 날에 같은 순서로 찍으면 됩니다.",
    ],
    tool: ["/tools/evidence-pack/?type=machinery", "이 목록대로 농기계 증빙 묶기", "항목마다 사진을 넣으면 촬영 날짜로 이름을 붙이고 빠진 항목을 알려 줍니다."],
    body: () => `
      <h2>단계별로 무엇을 남기나요</h2>
      <ol>
        <li><strong>판매글 올리기 전</strong> — 기계 전체, 명판, 사용시간계, 누유 부위, 타이어·작업기 사진. 판매글의 설명과 사진 번호를 맞춥니다.</li>
        <li><strong>실물 확인</strong> — 구매자는 판매글 사진과 실물의 명판·차대번호·사용시간계 숫자를 직접 대조하고, 엔진이 식은 상태의 시동과 작동 모습을 영상으로 남깁니다.</li>
        <li><strong>계약</strong> — 가격, 인도 날짜·장소, 포함 작업기, 알려 준 결함, 운송비 부담을 적은 계약서(또는 메시지 합의)와 계약금 입금 내역.</li>
        <li><strong>넘겨주는 날</strong> — 같은 위치·같은 방향에서 기계 전체와 사용시간계를 다시 찍고, 잔금 입금을 확인한 뒤 사진을 서로 나눠 갖습니다.</li>
        <li><strong>탁송한다면</strong> — 싣기 전, 결박한 모습, 내린 뒤를 같은 방향에서 찍고 견적서·영수증을 함께 둡니다.</li>
      </ol>

      <h2>꼭 남길 사진과 서류</h2>
      <p>아래 항목은 빠지면 나중에 확인할 방법이 마땅치 않은 것들입니다.</p>
      ${shotList("machinery", (item) => item.need)}

      <h2>있으면 다툼이 줄어드는 사진</h2>
      ${shotList("machinery", (item) => !item.need)}

      <h2>명판과 차대번호는 어디에 있나요</h2>
      <p>위치는 제조사와 기종마다 다릅니다. 보통 차체나 운전석 주변에 붙은 금속판(명판)과, 프레임·엔진 몸체에 새겨진 번호(각인)를 찾게 됩니다. 흙과 기름을 닦고 비스듬히 빛을 비추면 각인이 잘 보입니다. 위치를 모르면 판매자에게 묻거나 설명서를 확인하고, 명판이 없거나 바뀐 흔적이 있다면 계약 전에 그 사실을 사진과 메모로 남겨 두세요.</p>

      <h2>공개할 사진과 보관할 사진을 나누세요</h2>
      <ul>
        <li><strong>원본</strong>은 휴대폰과 컴퓨터(또는 USB) 두 곳 이상에 그대로 보관합니다. 원본에는 촬영 정보가 남아 있습니다.</li>
        <li><strong>판매글·단체방에 올릴 사본</strong>은 제조번호 뒷자리, 차량 번호판, 연락처가 보이지 않게 <a href="/tools/image-redactor/">사진 속 번호 가리기</a>로 가린 뒤 올립니다.</li>
        <li>사진에 위치정보가 들어 있으면 집이나 창고 위치가 드러날 수 있습니다. 남에게 보낼 사진은 <a href="/tools/photo-rename/">크기를 줄여 촬영 정보를 지운 사본</a>을 쓰세요.</li>
      </ul>

      <h2>계약서에 적어 두면 좋은 것</h2>
      <p>정해진 양식이 없더라도 아래 내용을 종이 계약서나 문자·메신저로 분명히 남겨 두면, 나중에 서로의 기억이 달라도 확인할 수 있습니다.</p>
      <ul>
        <li>기계 종류·형식명, 사용시간계 숫자(계약하는 날 기준)</li>
        <li>가격, 계약금·잔금 액수와 날짜, 입금 계좌의 예금주</li>
        <li>넘겨주는 날짜와 장소, 운송비를 누가 내는지</li>
        <li>같이 넘기는 작업기·부속·열쇠·설명서</li>
        <li>판매자가 알려 준 결함과 수리 이력</li>
      </ul>

      <h2>넘겨주는 날 점검</h2>
      ${checkboxList([
        "판매글·실물 확인 때와 같은 방향에서 기계 전체 사진 4장",
        "사용시간계 숫자 다시 찍기 (계약 때 숫자와 비교)",
        "누유 부위와 세워 둔 바닥 다시 확인",
        "작업기·열쇠·설명서를 건넨 모습",
        "잔금 입금 확인 (이체 확인증 저장)",
        "찍은 사진을 판매자·구매자가 서로 나눠 갖기",
        "점검표에 함께 확인했다고 표시 (선택)",
      ])}

      <h2>탁송을 맡긴다면</h2>
      <p>싣기 직전, 결박을 마친 모습, 내린 직후를 같은 방향에서 찍어야 운송 중에 생긴 흠과 원래 있던 흠을 구분할 수 있습니다. 견적서에는 기계 크기와 무게, 작업기 포함 여부, 싣고 내리는 조건을 적어 두세요. 견적을 받을 때 확인할 항목은 <a href="https://tripmarking.com/">농기계 탁송 견적 비교</a>에서 정리할 수 있습니다.</p>

      <h2>거래가 끝난 뒤</h2>
      <p>산 쪽이라면 정비·보험·수리 기록을 이어서 남겨 두면 다음에 되팔 때도 같은 자료를 쓸 수 있습니다. <a href="https://megapureunasset.kr/">농기계 자산 수첩</a>에서 기계별 기록을 정리해 보세요. 입금 전에 상대가 서두르거나 선입금만 요구하는 등 이상한 점이 있다면 <a href="https://scamreader.com/">직거래 사기 점검</a>에서 흔한 사기 신호를 먼저 확인하세요.</p>`,
    faqs: [
      ["사진에 찍힌 날짜만으로 증거가 되나요?", "사진 속 촬영 정보는 휴대폰 시간 설정이나 편집으로 바뀔 수 있어 그것만으로 날짜를 증명하기는 어렵습니다. 계약서, 입금 내역, 탁송 영수증처럼 다른 사람이 만든 기록과 함께 남기세요."],
      ["판매글에 제조번호를 모두 공개해야 하나요?", "형식명은 보이게 두고 제조번호 뒷자리는 가린 사본을 올리는 편이 안전합니다. 구매자가 실물을 확인할 때 원본 명판과 대조하면 됩니다."],
      ["시동 영상은 얼마나 찍으면 되나요?", "엔진이 식은 상태의 시동부터 PTO, 유압 리프트, 짧은 주행까지 30초~1분이면 충분합니다. 영상 처음에 사용시간계를 비추면 언제 찍은 영상인지 맞춰 보기 쉽습니다."],
      ["카카오톡으로 받은 사진도 증빙이 되나요?", "메신저를 거친 사진은 촬영 정보가 지워지는 경우가 많습니다. 가능하면 원본 파일을 따로 받아 두고, 어렵다면 받은 날짜를 메모로 남기세요."],
    ],
    related: ["machinery-listing-files", "photo-date-exif", "evidence-pack-final-checklist"],
    boribayNext: { text: "판매글을 올리거나 매물을 찾고 있다면 보리장터 농기계 게시판을 이용할 수 있습니다.", href: boribay("/?category=MACHINERY", "guide-used-machinery-handover"), label: "보리장터 농기계 게시판", extra: [["중고 농기계 판매 방법 (보리장터 안내)", boribay("/guides/used-machinery-selling-checklist", "guide-used-machinery-handover")]] },
  },
  {
    slug: "machinery-listing-files",
    group: "machinery",
    published: "2026-08-10",
    modified: "2026-10-26",
    title: "명판·시간계·작업기 사진 파일 묶기",
    metaTitle: "중고 농기계 판매글 사진 순서: 명판·시간계·작업기",
    description: "중고 농기계 판매글에 올릴 사진을 구매자가 먼저 묻는 순서대로 고르고, 명판·사용시간계·포함 작업기 사진에 순번을 붙이며, 공개본에서 제조번호 일부를 가리는 방법입니다.",
    card: "구매자가 먼저 묻는 사진부터, 공개할 때 가릴 번호까지",
    intro: [
      "판매글 사진은 구매자가 먼 길을 오기 전에 “보러 갈 만한 기계인가”를 판단하는 자료입니다. 구매자가 전화로 가장 먼저 묻는 것은 형식명, 사용시간, 누유, 같이 주는 작업기입니다. 이 순서대로 사진을 고르고 번호를 붙이면 설명문과 사진을 맞춰 보기 쉽습니다.",
    ],
    tool: ["/tools/evidence-pack/?type=machinery", "판매글 사진을 항목별로 묶기", "명판·사용시간계·작업기 칸에 사진을 넣으면 순번과 이름을 붙여 줍니다."],
    body: () => `
      <h2>판매글 사진 추천 순서</h2>
      <ol>
        <li>기계 전체 — 앞쪽에서 비스듬히 (대표 사진)</li>
        <li>기계 전체 — 반대쪽과 뒤쪽</li>
        <li>명판 — 형식명이 읽히게, 공개본은 제조번호 뒷자리 가림</li>
        <li>사용시간계 — 시동을 켠 상태에서 숫자 전체</li>
        <li>엔진룸과 누유 점검 부위 — 엔진 아래, 미션, 유압 연결부</li>
        <li>타이어 또는 궤도 — 홈과 갈라짐이 보이게</li>
        <li>포함 작업기·부속 — 같이 넘기는 것을 한자리에</li>
        <li>알려 줄 결함 — 흠집, 용접·수리 부위</li>
      </ol>

      <h2>명판 사진과 공개본 나누기</h2>
      <p>형식명이 읽히는 공개본을 만들고, 전체 제조번호는 원본에만 남깁니다. 공개본에서는 <a href="/tools/image-redactor/">사진 속 번호 가리기</a>로 제조번호 일부를 가립니다. 구매자가 실물을 보러 오면 원본 명판과 대조하면 됩니다.</p>

      <h2>시간계·작업기 순번 붙이기</h2>
      <p>시동 후 사용시간계, 포함 작업기를 명판 다음 번호로 묶습니다. 예: <code>2026-09-20_형식명_02_시간계.jpg</code>. 설명문에서도 “사진 2: 사용시간계 ○○○시간”처럼 같은 번호를 쓰면, 구매자가 사진과 설명을 맞춰 보기 쉽습니다. 여러 장의 이름을 한 번에 바꾸려면 <a href="/tools/photo-rename/">사진 날짜순 이름 바꾸기</a>를 쓰세요.</p>

      <h2>다른 매물 사진과 섞지 않기</h2>
      <p>가전·기타 중고 물건을 찍은 사진이 같은 폴더에 있다면 농기계 묶음에 넣지 않습니다. 명판이 없는 사진은 비교할 근거가 되지 못합니다. 예전에 찍은 사진을 다시 쓴다면 지금 상태와 달라진 점이 없는지 확인하고, 찍은 날짜를 설명에 적어 주세요.</p>

      <h2>올리기 전 확인</h2>
      ${checkboxList([
        "설명문의 사진 번호와 파일 번호가 같은지",
        "다른 기종의 명판이나 다른 날 찍은 사진이 섞이지 않았는지",
        "제조번호 뒷자리·번호판·연락처를 가렸는지",
        "작업기 포함 여부를 사진과 설명에 똑같이 적었는지",
      ])}`,
    faqs: [
      ["마력 사진만 있으면 명판을 생략해도 되나요?", "마력은 출력을 가리킬 뿐 기종을 특정하지 못합니다. 형식명이 읽히는 명판 사진이 없으면 묶음을 완성하지 않습니다."],
      ["작업기 사진을 나중에 추가해도 포함인가요?", "판매글과 계약서에 적지 않은 작업기는 포함으로 보기 어렵습니다. 포함할 작업기는 처음부터 사진과 설명에 함께 넣으세요."],
    ],
    related: ["used-machinery-handover-files", "listing-photo-files", "listing-date-columns"],
    // This guide keeps a single Boribay how-to link and no sister-site links.
    legacyLink: ["명판·시간·작업기 칸을 채워 기계 글 올리기", legacyBoribay("used-machinery-listing-nameplate", "c2c_howto_202609", "machinery-listing-files"), "세 칸 사진을 묶었다면 같은 칸으로 기계 글을 올리세요."],
  },
  {
    slug: "produce-shipping-evidence",
    group: "produce",
    published: "2026-10-26",
    modified: "2026-10-26",
    title: "농산물 보낼 때 남길 사진: 출하 전 상태·중량·포장·운송장",
    description: "택배나 직접 전달로 농산물을 보낼 때 상자를 닫기 전 상태, 저울 눈금, 포장, 운송장, 입금과 도착 확인까지 무엇을 남길지 정리했습니다. 상해서 왔다는 연락을 받았을 때의 순서와 관련 규정을 확인하는 곳도 함께 적었습니다.",
    card: "출하 전 상태·실중량·포장·운송장, 문제가 생겼을 때",
    intro: [
      "직거래로 보낸 농산물에서 자주 나오는 이야기는 “무게가 모자란다”, “물러서 왔다”, “덜 왔다”입니다. 보내는 쪽이 상자를 닫기 전까지의 상태를 남겨 두면, 문제가 생겼을 때 보낼 때의 상태와 받은 뒤의 상태를 나눠서 볼 수 있습니다.",
      "아래 순서는 택배로 보낼 때를 기준으로 했습니다. 직접 건네는 경우에는 운송장 대신 건넨 장소와 시각을 알 수 있는 사진을 남기면 됩니다.",
    ],
    tool: ["/tools/evidence-pack/?type=produce", "이 목록대로 출하 증빙 묶기", "상자마다 사진을 넣으면 촬영 시각으로 이름을 붙이고 빠진 사진을 알려 줍니다."],
    body: () => `
      <h2>상자를 닫기 전에</h2>
      ${shotList("produce", (item) => item.group === "before")}

      <h2>실중량은 이렇게 찍으세요</h2>
      <ol>
        <li>저울을 켜고 0이 표시된 화면을 한 장 찍습니다.</li>
        <li>빈 상자(완충재 포함)를 올려 무게를 찍습니다.</li>
        <li>상품을 담은 상자를 올려 무게를 찍습니다. 두 숫자의 차이가 내용물 무게입니다.</li>
        <li>숫자가 반사 없이 읽히는지 사진을 확대해 확인합니다.</li>
      </ol>
      <p>국립농산물품질관리원의 「농산물 표준규격」은 거래단위를 <strong>포장 용기의 무게를 뺀 내용물의 무게 또는 개수</strong>로 정하고 있고, 표준규격품의 포장재 표시중량 허용범위를 골판지 상자·폴리에틸렌대·종이포장재·발포폴리스티렌 상자는 ±5%, 직물제 포대(PP대)·그물망은 ±10%로 두고 있습니다. 표준규격품으로 표시해 출하할 때의 기준이지만, 표시를 하지 않는 직거래라도 “10kg”이라고 팔았다면 용기를 뺀 내용물 무게로 맞춰 두면 설명하기 쉽습니다. (확인일 ${CHECKED})</p>
      <p>망·단·상자처럼 단위가 섞인다면 정산표에 kg 열을 따로 두세요. <a href="/agri/guides/pack-unit-kg-files/">망·단·상자를 kg 열로 맞추는 법</a>을 참고하세요.</p>

      <h2>포장 겉면 표시도 찍어 두세요</h2>
      <p>「농수산물 품질관리법 시행규칙」 제7조는 표준규격품임을 표시해 출하할 때 포장 겉면에 “표준규격품”이라는 문구와 함께 품목, 산지, 품종(표시하기 어려운 품목은 생략할 수 있음), 생산 연도(곡류만), 등급, 무게(실중량. 품목에 따라 개수 등), 생산자 또는 생산자단체의 명칭과 전화번호를 적도록 하고 있습니다. 세부 표시방법은 「농산물 표준규격」 별표 4에 있습니다. 표준규격품이 아니더라도 상자 겉면에 무엇을 얼마나 보냈다고 적었는지 사진으로 남겨 두면, 받은 쪽과 내용을 맞춰 보기 쉽습니다. (확인일 ${CHECKED})</p>
      <p>또 「농수산물의 원산지 표시 등에 관한 법률」 제5조는 농수산물을 생산해 출하하거나 판매(통신판매 포함)하는 사람에게 대통령령으로 정한 품목의 원산지를 표시하도록 하고 있습니다. 대상 품목과 표시 방법은 국립농산물품질관리원 안내에서 확인하세요. (확인일 ${CHECKED})</p>

      <h2>보낼 때</h2>
      ${shotList("produce", (item) => item.group === "send")}
      <p>공정거래위원회가 2020년에 개정한 택배 표준약관은 고객이 운송장에 배송 정보를 정확하게 적도록 하고, 분실·파손 때 고객이 손해를 입증하는 서류를 내면 택배사가 30일 안에 먼저 배상하도록 했습니다. 구입 영수증처럼 물건값을 보여 주는 자료와 출하 전 사진을 함께 보관해 두면 이럴 때 바로 낼 수 있습니다. 실제 접수 절차와 기한은 이용하는 택배사의 약관을 확인하세요. (확인일 ${CHECKED})</p>

      <h2>주문·돈·도착</h2>
      ${shotList("produce", (item) => item.group === "after" && item.id !== "problem")}

      <h2>상해서 왔다는 연락을 받으면</h2>
      <ol>
        <li>구매자에게 상자 겉면 → 개봉하는 모습 → 내용물 순서의 사진과 받은 시각을 부탁합니다.</li>
        <li>내 출하 전 사진·중량 사진·포장 사진과 비교해, 보낼 때의 상태와 무엇이 다른지 정리합니다.</li>
        <li>운송 중 파손으로 보이면 택배사 사고 접수를 서두릅니다. 「상법」 제146조에 따르면 받는 사람이 이의 없이 물건을 받고 운임 등을 치르면 운송인의 책임은 원칙적으로 사라지고, 받을 때 바로 알 수 없었던 훼손이나 일부 분실은 받은 날부터 2주 안에 운송인에게 통지를 보내야 책임을 물을 수 있습니다. 구매자에게 상자를 열자마자 사진을 찍고 택배사에도 바로 알리도록 부탁하세요. (확인일 ${CHECKED})</li>
        <li>환불·재발송을 어떻게 할지 합의한 내용을 메시지로 남깁니다.</li>
        <li>정산표에는 환불을 별도 줄이나 별도 열로 적어 판매금액과 섞이지 않게 합니다.</li>
      </ol>`,
    faqs: [
      ["사진은 몇 장이면 되나요?", "출하 전 전체 상태, 실중량, 포장, 운송장, 접수 증빙, 주문 조건, 입금 내역이 꼭 남길 기본입니다. 상자가 여러 개라면 대표 상자는 모두 찍고 나머지는 운송장 목록 화면으로 묶어도 됩니다."],
      ["저울이 없으면 어떻게 하나요?", "표시 중량만으로 실중량을 채우지 말고 “중량 미확인”으로 적어 두세요. 가능하면 출하 전에 저울을 빌려 상자째 무게라도 남기는 편이 좋습니다."],
      ["운송장 사진을 단체방에 올려도 되나요?", "받는 사람 이름·주소·전화번호를 가린 사본만 올리세요. 송장번호는 거래 상대에게만 따로 알려 주는 편이 안전합니다."],
    ],
    sources: ["standard", "qualityRule7", "origin", "parcelTerms", "commerce146"],
    related: ["listing-photo-files", "pack-unit-kg-files", "direct-sale-settlement-files"],
    boribayNext: { text: "농산물 직거래 판매글은 보리장터 농산물 게시판에 올릴 수 있습니다.", href: boribay("/?category=PRODUCE", "guide-produce-shipping"), label: "보리장터 농산물 게시판", extra: [["농산물 직거래 포장과 가격 정하기 (보리장터 안내)", boribay("/guides/produce-direct-sale-pricing-packaging", "guide-produce-shipping")]] },
  },
  {
    slug: "direct-sale-settlement-files",
    group: "settlement",
    published: "2026-08-10",
    modified: "2026-10-26",
    title: "직거래 정산표 만드는 법: 주문·배송비·수수료·입금을 한 표로",
    description: "농산물 직거래 판매를 한 줄에 한 거래씩 적는 정산표의 열 구성, 받을 금액 계산식, 입금 대조 순서를 예시와 함께 설명합니다. 빈 서식과 정산표 점검 도구로 바로 확인할 수 있습니다.",
    card: "주문·배송비·수수료·입금을 한 표로, 열 구성과 예시",
    intro: [
      "직거래 판매가 몇 건만 넘어가도 “누가 아직 안 보냈더라”, “이 입금은 어느 주문이지”가 헷갈리기 시작합니다. 한 줄에 거래 하나씩, 같은 열 순서로 적는 정산표 한 장이 있으면 받을 돈과 들어온 돈을 바로 맞춰 볼 수 있습니다.",
    ],
    tool: ["/tools/settlement-csv/", "정산표 점검하기", "정산표를 넣으면 계산이 틀린 줄, 덜 들어온 돈, 빈 칸과 중복을 찾아 줍니다. 빈 서식도 받을 수 있습니다."],
    body: () => `
      <h2>열은 이렇게 둡니다</h2>
      <div class="table-scroll"><table>
        <thead><tr><th scope="col">열</th><th scope="col">적는 내용</th></tr></thead>
        <tbody>
          <tr><td>날짜</td><td>주문 또는 보낸 날짜</td></tr>
          <tr><td>구매자(별칭)</td><td>이름 대신 별칭이나 주문번호. 연락처·주소는 다른 파일에</td></tr>
          <tr><td>품목 · 규격</td><td>예: 사과(홍로) · 10kg 상자</td></tr>
          <tr><td>수량 · 단가</td><td>숫자만 적습니다. 단가는 상자(개)당 가격</td></tr>
          <tr><td>판매금액</td><td>수량 × 단가</td></tr>
          <tr><td>배송비</td><td>구매자에게 받은 배송비 (판매자가 냈다면 0, 비용 영수증은 따로)</td></tr>
          <tr><td>수수료·공제</td><td>결제·위탁 수수료, 환불·반품으로 빠진 돈</td></tr>
          <tr><td>받을 금액</td><td>판매금액 + 배송비 − 수수료·공제</td></tr>
          <tr><td>입금일 · 입금액</td><td>통장에 실제로 들어온 날짜와 금액</td></tr>
          <tr><td>운송장번호 · 메모</td><td>배송 확인용 번호와 특이 사항</td></tr>
        </tbody>
      </table></div>

      <h2>계산 예시</h2>
      <p>아래 숫자는 계산 방법을 보여 주기 위한 <strong>설명용 예시</strong>이며 실제 시세가 아닙니다.</p>
      <ul>
        <li>사과 10kg 상자 3개 × 단가 45,000원 = 판매금액 135,000원</li>
        <li>구매자에게 받은 배송비 4,000원, 수수료 0원 → 받을 금액 139,000원</li>
        <li>통장에 139,000원이 들어왔다면 차액 0원. 135,000원만 들어왔다면 배송비 4,000원이 빠진 것이니 구매자에게 확인합니다.</li>
      </ul>

      <h2>입금과 맞춰 보는 순서</h2>
      <ol>
        <li>은행 앱이나 인터넷뱅킹에서 정산 기간의 거래내역을 저장합니다.</li>
        <li>정산표의 입금일·입금액 칸을 거래내역을 보며 채웁니다.</li>
        <li>받을 금액과 입금액이 다른 줄을 찾습니다. <a href="/tools/settlement-csv/">정산표 점검</a> 도구가 차액이 있는 줄을 골라 줍니다.</li>
        <li>여러 주문이 한 번에 입금됐다면 메모 칸에 어느 주문들인지 적습니다.</li>
        <li>환불·부분 환불은 별도 줄(음수 금액)이나 수수료·공제 열에 적어 판매금액과 섞지 않습니다.</li>
      </ol>

      <h2>판매 사진과 정산표 맞추기</h2>
      <p>전체 상품, 크기·흠집, 실중량, 포장 순서로 고른 사진의 파일명 앞에 날짜와 번호를 붙이면 정산표의 날짜와 맞춰 찾기 쉽습니다. 예: <code>2026-09-16_감자_01_전체.jpg</code>. 번호는 사진 순서를 표시할 뿐 상품의 등급을 증명하지 않습니다. 여러 장은 <a href="/tools/photo-rename/">사진 날짜순 이름 바꾸기</a>로 한 번에 붙일 수 있습니다.</p>

      <h2>단위가 섞일 때</h2>
      <p>상자·망·단처럼 단위가 다르면 kg당 가격을 비교하기 어렵습니다. 품목별로 실중량 kg 열을 따로 두세요.</p>
      <p>자세한 열 구성과 계산 예시는 <a href="/agri/guides/pack-unit-kg-files/">망·단·상자·통 수량을 kg 열로 맞추는 법</a>을 참고하세요.</p>

      <h2>CSV와 엑셀, 공유할 때</h2>
      <p>CSV는 표 한 장을 주고받기 쉽지만 수식·서식·여러 시트는 남지 않습니다. 원본 엑셀 파일은 따로 보관하고, CSV로 내보낸 뒤 다시 열어 수량·금액·합계가 맞는지 확인하세요. 남에게 보낼 때는 구매자 전화번호·주소·계좌번호가 든 열을 빼고 보냅니다. 정산표 점검 도구의 <strong>공유용 CSV</strong>가 그런 열을 빼 줍니다.</p>

      <h2>정산 자료를 한 묶음으로</h2>
      <p>정산표와 함께 주문 내역, 같은 기간 입금 내역, 발송 기록, 비용 영수증을 한 묶음에 넣어 두면 나중에 금액이 맞지 않는 곳을 바로 찾을 수 있습니다. <a href="/tools/evidence-pack/?type=settlement">정산 자료 묶음 만들기</a>를 쓰면 빠진 자료를 알려 줍니다. 한 해 농사의 손익을 따져 보려면 <a href="https://www.reportools.com/">농가 손익 계산기</a>도 함께 써 보세요.</p>

      <section id="preparation-method">
        <h2>작성 방법과 파일 처리 범위</h2>
        <p>안내 작성·수정 책임: 거래 증빙 도우미 운영자, ${SITE.operator}. 정산표 점검·사진 이름 바꾸기·증빙 묶음 도구의 처리 범위에 맞춰 순서를 설명합니다. 예시 숫자와 파일명은 설명용이며 실제 고객·거래의 자료가 아닙니다.</p>
        <p>연결한 도구는 선택한 파일을 지금 쓰는 브라우저에서 읽고 결과 파일을 만듭니다. 파일 원본과 표 내용은 서버로 보내거나 보관하지 않습니다. 광고 등 외부 리소스의 처리는 <a href="/privacy/">개인정보 처리방침</a>에서 구분합니다.</p>
        <p>정산표, 파일명, 파일 지문은 자료 정리를 돕습니다. 거래 사실이나 금액을 증명하는 공식 서류가 되지는 않습니다.</p>
        <h3>수정 기록</h3>
        <p><time datetime="2026-10-26">2026-10-26</time>: 정산표 열 구성, 받을 금액 계산식, 입금 대조 순서와 예시를 새로 쓰고 정산표 점검 도구와 연결했습니다.<br><time datetime="2026-10-15">2026-10-15</time>: 작성 책임, 연결 도구의 파일 처리 범위와 결과의 한계를 보강했습니다.</p>
        <p>설명이 틀렸거나 도구가 이상하면 <a href="/contact/">문의·오류 제보</a> 안내를 따라 알려 주세요.</p>
      </section>`,
    faqs: [
      ["직거래 정산표를 CSV로 저장해도 되나요?", "표를 주고받는 데는 편하지만 수식·서식·여러 시트는 그대로 남지 않습니다. 원본 엑셀 파일을 따로 두고, 내보낸 CSV를 다시 열어 금액과 합계가 맞는지 확인하세요."],
      ["배송비는 판매금액에 넣나요?", "구매자에게 따로 받은 배송비는 배송비 열에 적고, 판매자가 낸 택배비는 비용 영수증으로 따로 남기는 편이 입금 대조가 쉽습니다."],
      ["공판장 위탁 판매도 같은 표에 적나요?", "같은 표에 적어도 되지만 위탁 정산서의 수수료·운송비·공제 항목을 수수료·공제 열에 나눠 적으세요. 경매 수취금액을 미리 따져 보려면 보리장터의 경매 수취금액 계산기 안내를 참고할 수 있습니다."],
    ],
    related: ["pack-unit-kg-files", "produce-shipping-evidence", "evidence-pack-final-checklist"],
    boribayNext: {
      text: "가격과 포장 기준을 정하거나 위탁 판매 정산을 미리 따져 보려면 보리장터 안내를 참고하세요.",
      href: boribay("/guides/produce-direct-sale-pricing-packaging", "guide-settlement"),
      label: "농산물 직거래 포장과 가격 정하기",
      extra: [
        ["농산물 경매 예상 수취금액 계산기", boribay("/guides/agricultural-auction-net-calculator", "guide-settlement")],
        ["배송비 포함 kg당 가격 계산기", boribay("/guides/produce-price-calculator", "guide-settlement")],
      ],
    },
  },
  {
    slug: "photo-date-exif",
    group: "common",
    published: "2026-10-26",
    modified: "2026-10-26",
    title: "사진 촬영 날짜 확인하는 법과 한계",
    description: "휴대폰 사진에 함께 저장되는 촬영 정보(EXIF)로 찍은 날짜를 확인하는 방법, 메신저·캡처·편집으로 촬영 정보가 사라지거나 달라지는 경우, 거래 증빙으로 쓸 때 원본을 지키는 요령을 정리했습니다.",
    card: "촬영 정보가 사라지는 경우와 원본을 지키는 방법",
    intro: [
      "거래 사진을 정리하다 보면 “이 사진을 언제 찍었더라”가 중요해질 때가 있습니다. 휴대폰 카메라로 찍은 사진에는 대개 찍은 날짜와 시각이 사진 파일 안에 함께 저장됩니다. 이 정보를 읽는 방법과, 이 정보만 믿으면 안 되는 이유를 함께 알아 두세요.",
    ],
    tool: ["/tools/evidence-pack/", "사진의 촬영 날짜 읽어 묶기", "사진을 넣으면 촬영 정보를 읽어 날짜순으로 정렬하고, 촬영 정보가 없는 사진은 따로 알려 줍니다."],
    body: () => `
      <h2>촬영 정보(EXIF)란</h2>
      <p>JPG 사진에는 사진 그림과 함께 찍은 날짜·시각, 휴대폰 기종, 카메라 설정 같은 정보가 저장됩니다. 이를 EXIF(이그지프)라고 부릅니다. 휴대폰의 위치 기능을 켜고 찍었다면 찍은 장소의 위치(GPS)도 들어갈 수 있습니다.</p>

      <h2>찍은 날짜 확인하는 방법</h2>
      <ul>
        <li><strong>휴대폰</strong>: 갤러리(사진) 앱에서 사진을 연 뒤 정보 버튼(ⓘ)을 누르거나 사진을 위로 밀면 찍은 날짜가 보이는 경우가 많습니다. 메뉴 이름은 기종마다 다릅니다.</li>
        <li><strong>윈도우 컴퓨터</strong>: 사진 파일을 오른쪽 클릭 → 속성 → 자세히 탭에서 “찍은 날짜”를 볼 수 있습니다.</li>
        <li><strong>여러 장을 한 번에</strong>: <a href="/tools/photo-rename/">사진 날짜순 이름 바꾸기</a>나 <a href="/tools/evidence-pack/">증빙 묶음 만들기</a>에 사진을 넣으면 사진마다 촬영 날짜를 읽어 보여 주고, 촬영 정보가 없는 사진은 “파일 날짜”로 따로 표시합니다.</li>
      </ul>

      <h2>촬영 정보가 사라지거나 달라지는 경우</h2>
      <ul>
        <li><strong>메신저·SNS로 보낸 사진</strong>: 전송하면서 사진을 줄이는 과정에서 촬영 정보가 지워지는 경우가 많습니다.</li>
        <li><strong>화면 캡처</strong>: 캡처 이미지는 “찍은” 사진이 아니어서 촬영 정보가 없고, 저장된 날짜만 남습니다.</li>
        <li><strong>편집한 사진</strong>: 자르기·보정 후 다른 앱으로 저장하면 촬영 정보가 바뀌거나 지워질 수 있습니다.</li>
        <li><strong>휴대폰 시간 설정</strong>: 휴대폰 날짜·시간이 틀려 있으면 틀린 날짜가 그대로 저장됩니다.</li>
        <li><strong>일부러 바꾸기</strong>: 촬영 정보를 고치는 프로그램도 있어서, 촬영 정보만으로 날짜를 증명하기는 어렵습니다.</li>
      </ul>

      <h2>그래서 이렇게 남기세요</h2>
      <ol>
        <li><strong>원본을 바로 옮겨 두기</strong>: 거래 사진은 메신저로 보내기 전에 휴대폰의 원본을 컴퓨터나 USB로 옮겨 두세요. 원본에는 촬영 정보가 그대로 있습니다.</li>
        <li><strong>날짜를 보여 주는 다른 기록과 함께</strong>: 이체 확인증의 시각, 택배 접수 시각, 메시지를 주고받은 시각처럼 다른 사람이나 기관이 남긴 기록이 함께 있으면 날짜를 설명하기 쉽습니다.</li>
        <li><strong>사진 안에 날짜 단서 넣기</strong>: 사용시간계, 운송장, 날짜가 찍힌 영수증을 같은 장면에 함께 찍는 것도 방법입니다.</li>
        <li><strong>받은 사진은 받은 날짜 메모</strong>: 상대에게 받은 사진은 받은 날짜와 대화방을 메모해 두세요.</li>
        <li><strong>파일 지문 남기기</strong>: 증빙 묶음을 만들면 파일마다 SHA-256 지문이 목록에 남습니다. 나중에 <a href="/tools/hash-compare/">같은 파일인지 확인</a>으로 그때 묶은 파일인지 대조할 수 있습니다.</li>
      </ol>

      <h2>위치정보는 공개 전에 지우세요</h2>
      <p>원본 사진의 위치정보는 집이나 밭, 창고 위치를 드러낼 수 있습니다. 보관용 원본은 그대로 두고, 판매글이나 단체방에 올릴 사진은 크기를 줄여 다시 저장한 사본(촬영 정보가 지워짐)을 쓰세요. <a href="/tools/photo-rename/">사진 날짜순 이름 바꾸기·용량 줄이기</a>에서 크기 줄이기를 고르면 됩니다.</p>`,
    faqs: [
      ["촬영 날짜를 바꿀 수 있나요?", "바꿀 수 있습니다. 그래서 촬영 정보는 정리용 참고 정보로 쓰고, 날짜가 중요한 거래라면 계약서·이체 확인증·택배 접수 기록 같은 다른 기록을 함께 남기세요."],
      ["아이폰 사진은 어떻게 되나요?", "아이폰은 HEIC 형식으로 찍는 경우가 많습니다. 사파리에서 앨범 사진을 고르면 JPG로 바뀌어 넣어지는 경우가 많고, 컴퓨터로 옮긴 HEIC 파일은 브라우저에서 미리보기가 안 될 수 있습니다."],
      ["촬영 정보가 없는 사진은 쓸 수 없나요?", "쓸 수 있습니다. 다만 언제 찍었는지는 다른 기록으로 설명해야 합니다. 받은 날짜, 대화 내용, 함께 찍힌 날짜 단서를 메모해 두세요."],
    ],
    related: ["used-machinery-handover-files", "produce-shipping-evidence", "evidence-pack-final-checklist"],
  },
  {
    slug: "evidence-pack-final-checklist",
    group: "common",
    published: "2026-10-26",
    modified: "2026-10-26",
    title: "거래 마무리 전 최종 증빙 점검표",
    description: "중고 농기계 거래, 농산물 출하, 정산을 마무리하기 전에 빠진 사진·서류가 없는지, 원본과 공개본을 나눠 보관했는지 하나씩 표시하는 인쇄용 점검표입니다.",
    card: "인쇄해서 하나씩 체크하는 마지막 확인 목록",
    intro: [
      "거래가 끝났다고 생각할 때 한 번만 이 목록을 훑어보세요. 대부분의 항목은 지금 바로 챙기면 1~2분이면 되지만, 나중에 필요할 때는 다시 만들 수 없는 것들입니다. 인쇄하거나 휴대폰 화면에서 하나씩 확인하면 됩니다.",
    ],
    tool: ["/tools/evidence-pack/", "빠진 항목을 자동으로 확인하기", "증빙 묶음 만들기에 사진·서류를 넣으면 이 목록의 필수 항목 중 빠진 것을 알려 주고 점검표를 인쇄해 줍니다."],
    body: () => `
      <h2>모든 거래에 공통</h2>
      ${checkboxList([
        "원본 사진·서류를 두 곳 이상(휴대폰과 컴퓨터, USB 등)에 보관했다",
        "남에게 보낼 공개본은 원본과 다른 폴더에 두었다",
        "공개본에서 이름·전화번호·주소·계좌번호·제조번호 뒷자리를 가렸다",
        "파일 이름에 날짜와 무엇의 사진인지 들어 있다 (예: 2026-10-20_트랙터판매_03_사용시간계.jpg)",
        "증빙 목록(파일 이름·촬영 날짜·파일 지문)을 묶음과 따로 한 부 더 보관했다",
        "계약·주문 조건(가격, 수량, 날짜, 운송비 부담)을 서로 확인한 기록이 있다",
        "입금 내역(이체 확인증, 통장 거래내역)을 저장했다",
        "상대에게 보낸 파일 목록과 보낸 날짜를 적어 두었다",
      ])}

      <h2>중고 농기계를 사고팔았다면</h2>
      ${checkboxList(presets.machinery.items.filter((item) => item.need).map((item) => escapeHtml(item.name)).concat(["넘겨주는 날 사진을 판매자·구매자가 나눠 가졌다", "포함하기로 한 작업기·열쇠·설명서를 건넸다"]))}

      <h2>농산물을 보냈다면</h2>
      ${checkboxList(presets.produce.items.filter((item) => item.need).map((item) => escapeHtml(item.name)).concat(["도착 확인(배송 완료 화면이나 구매자 연락)을 남겼다"]))}

      <h2>정산을 마감한다면</h2>
      ${checkboxList(presets.settlement.items.filter((item) => item.need).map((item) => escapeHtml(item.name)).concat(["정산표의 받을 금액 합계와 입금액 합계의 차액을 확인했다", "환불·반품을 별도 줄로 적었다"]))}

      <h2>얼마나 보관하나요</h2>
      <p>환불이나 하자 이야기가 나올 수 있는 동안은 묶음 전체를 보관하세요. 세금 신고나 지원 사업 신청에 쓸 자료라면 해당 기관의 안내에 맞춰 보관 기간을 정하면 됩니다.</p>

      <h2>문제가 생겼다면</h2>
      <ul>
        <li>주고받은 대화와 사진을 지우지 말고 그대로 보관합니다.</li>
        <li>택배 운송 중 파손·분실이라면 택배사 사고 접수를 먼저 합니다. 순서는 <a href="/agri/guides/produce-shipping-evidence/">농산물 보낼 때 남길 사진</a>의 마지막 부분을 참고하세요.</li>
        <li>돈을 보냈는데 물건이 오지 않거나 연락이 끊겼다면 <a href="https://scamreader.com/">직거래 사기 점검</a>에서 흔한 사기 신호를 확인하고, 피해를 입었다면 <a href="${sources.ecrm[1]}">경찰청 사이버범죄 신고시스템</a>에 신고할 수 있습니다.</li>
      </ul>
      <p class="btn-row"><button type="button" class="btn" onclick="window.print()">이 점검표 인쇄하기</button></p>`,
    faqs: [],
    related: ["used-machinery-handover-files", "produce-shipping-evidence", "direct-sale-settlement-files"],
  },
  {
    slug: "listing-photo-files",
    group: "produce",
    published: "2026-08-10",
    modified: "2026-10-26",
    title: "판매글 사진 순번·원본·공개본 묶기",
    description: "농산물 판매글에 올릴 사진을 전체·실중량·수확 표시 순서로 번호를 붙여 묶고, 촬영 원본과 올릴 사본을 나눠 보관하는 순서입니다.",
    card: "전체·실중량·수확 표시 순번과 원본·공개본 나누기",
    intro: [
      "농산물 판매글 사진은 구매자가 “보낸다는 물건이 이것인가”를 확인하는 자료입니다. 전체 모습, 저울에 올린 실중량, 수확일이나 품종이 보이는 표시를 같은 번호 순서로 묶고, 찍은 원본과 올릴 사본을 나눠 두면 문의가 왔을 때 같은 사진을 바로 찾아 보여 줄 수 있습니다.",
    ],
    tool: ["/tools/photo-rename/", "판매 사진에 날짜·순서 번호 붙이기", "사진을 고르면 찍은 시간순으로 날짜와 번호를 붙이고, 올릴 사본은 크기를 줄이면서 위치정보를 지웁니다."],
    steps: [
      ["원본 폴더와 올릴 사본 폴더 나누기", "휴대폰으로 찍은 원본은 그대로 한 폴더에 두고, 판매글에 올릴 사진은 사본을 만들어 다른 폴더에 둡니다. 원본을 편집해 덮어쓰면 찍은 날짜 같은 촬영 정보가 사라질 수 있습니다."],
      ["전체·실중량·수확 표시 순서로 번호 붙이기", "상품 전체 → 저울 위 실중량 → 수확일이나 품종이 적힌 표시 순서로 01·02·03 번호를 붙입니다. 예: 2026-09-20_감자_01_전체.jpg. 번호는 사진 순서를 나타낼 뿐 등급이나 무게를 증명하지 않습니다."],
      ["올릴 사본에서 글자가 읽히는지 확인", "크기를 줄인 사본을 직접 열어 저울 숫자와 날짜 글자가 읽히는지 봅니다. “사과”처럼 통칭만 보이고 품종이 안 보이면 품종을 판매글 본문에 적어 두세요."],
      ["다른 날·다른 물량 사진 빼기", "어제 포장한 상자나 다른 품종 사진이 섞이지 않았는지 원본 폴더의 촬영 날짜와 대조합니다."],
      ["올리기 전에 개인정보 가리기", "운송장, 주소가 적힌 상자, 차량 번호판이 찍혔다면 가린 사본을 올립니다."],
    ],
    faqs: [
      ["사진 번호가 있으면 실중량은 따로 안 적어도 되나요?", "번호는 사진 순서만 나타냅니다. 실중량은 저울 사진과 함께 숫자로 판매글이나 정산표에 따로 적으세요."],
      ["원본 사진을 그대로 올려도 되나요?", "올릴 때는 사본을 쓰세요. 원본에는 찍은 위치(GPS)가 들어 있을 수 있고, 화면에 주소나 연락처가 찍혀 있을 수 있습니다."],
    ],
    tools: [["판매 사진에 날짜·순서 번호 붙이기", "/tools/photo-rename/"], ["올릴 사본의 주소·번호 가리기", "/tools/image-redactor/"], ["출하 사진을 항목별로 묶기", "/tools/evidence-pack/?type=produce"]],
    related: ["machinery-listing-files", "listing-date-columns", "produce-shipping-evidence"],
    legacyLink: ["품종·중량·수확일 칸을 채워 판매글 올리기", legacyBoribay("produce-listing-three-fields", "c2c_howto_202609", "listing-photo-files"), "사진을 묶었다면 같은 칸으로 판매글을 올리세요."],
  },
  {
    slug: "listing-date-columns",
    group: "produce",
    published: "2026-08-10",
    modified: "2026-10-26",
    title: "출하가능일·도정일 열 만들기",
    description: "김장 배추·햅쌀처럼 날짜가 중요한 상품의 정산표와 판매글에서 출하 가능일, 수확일, 도정일을 나눠 적고 사진 찍은 날짜와 섞지 않는 방법입니다.",
    card: "출하 가능일·수확일·도정일을 사진 촬영일과 섞지 않기",
    intro: [
      "김장 배추나 햅쌀처럼 시기가 중요한 상품은 날짜가 여러 종류 나옵니다. 언제 보낼 수 있는지(출하 가능일), 언제 땄는지(수확일), 쌀이라면 언제 찧었는지(도정일)를 한 칸에 섞어 적으면 구매자와 서로 다른 날짜를 두고 이야기하게 됩니다. 사진을 찍은 날짜도 이 셋과는 다른 날짜입니다.",
    ],
    tool: ["/tools/settlement-csv/", "정산표 빈 칸·계산 확인하기", "정산표를 넣으면 빈 날짜 칸, 계산이 맞지 않는 줄, 중복으로 적힌 주문을 찾아 줍니다."],
    steps: [
      ["날짜 열을 세 칸으로 나누기", "출하 가능일, 수확일, 도정일(쌀) 열을 따로 둡니다. 모르는 날짜는 “미확인”으로 두고, 사진 찍은 날짜로 채우지 않습니다."],
      ["사진 파일 이름에 날짜 종류 적기", "파일 이름에 어떤 날짜인지 함께 적습니다. 예: 2026-09-20_햅쌀_도정일_01_표시.jpg. 절임배추 도착일을 수확일 파일 이름에 쓰지 않습니다."],
      ["포장 표시 사진과 열 맞추기", "쌀 포장 표시에 생산연도와 도정 날짜가 함께 있으면 정산표에서도 두 칸으로 나눠 옮겨 적습니다. “당일 도정” 같은 문구만 있고 날짜가 없으면 도정일 칸은 비워 두고 메모에 그 문구를 적습니다."],
      ["지난 날짜의 줄 정리", "출하 가능일이 지난 줄의 단가를 새 물량 줄에 복사하지 않습니다. 새 물량은 새 줄로 적습니다."],
    ],
    faqs: [
      ["사진 찍은 날짜를 수확일 칸에 적어도 되나요?", "사진은 수확한 날 찍지 않았을 수도 있습니다. 수확일 칸에는 실제로 딴 날만 적고, 모르면 “미확인”으로 둡니다."],
      ["도정일만 있으면 생산연도 칸은 지워도 되나요?", "생산연도와 도정일은 서로 다른 정보입니다. 포장 표시에 둘 다 있으면 두 칸 모두 남겨 두세요."],
    ],
    tools: [["정산표의 빈 칸·계산 확인하기", "/tools/settlement-csv/"], ["사진에 날짜·순서 번호 붙이기", "/tools/photo-rename/"], ["출하 사진을 항목별로 묶기", "/tools/evidence-pack/?type=produce"]],
    related: ["listing-photo-files", "photo-date-exif", "direct-sale-settlement-files"],
    legacyLink: ["출하일·도정일을 칸에 적어 시즌 글 올리기", legacyBoribay("kimjang-rice-listing-dates", "c2c_howto_202609", "listing-date-columns"), "날짜 열을 나눴다면 시즌 판매글에 그 날짜를 적으세요."],
  },
  {
    slug: "pack-unit-kg-files",
    group: "settlement",
    published: "2026-08-10",
    modified: "2026-10-26",
    title: "출하 정산표에서 망·단·상자·통 수량을 kg 열로 맞추는 법",
    description: "양파 망, 대파 단, 사과·배 상자, 수박 통처럼 포장 단위가 섞인 출하 수량을 실중량 kg 열로 바꿔 적는 정산표 열 구성, 엑셀 계산식, 계산 예시와 저울 사진 남기는 순서를 정리했습니다.",
    card: "망·단·상자·통 수량을 실중량 kg으로, 열 구성과 계산 예시",
    intro: [
      "직거래 정산표에 “양파 4망”, “대파 10단”, “사과 3상자”처럼 포장 단위로만 적어 두면, 품목끼리 kg당 가격을 비교하거나 무게가 모자란다는 이야기가 나왔을 때 확인하기 어렵습니다. 포장 단위는 그대로 두고 옆에 실제로 잰 무게(kg) 열을 하나 더 두면 두 가지가 모두 해결됩니다.",
    ],
    tool: ["/tools/settlement-csv/", "정산표 계산 점검하기", "정산표를 넣으면 수량×단가, 받을 금액과 입금액 차이, 빈 칸과 중복을 찾아 줍니다. 빈 서식도 받을 수 있습니다."],
    body: () => `
      <h2>왜 실중량 열이 따로 필요한가요</h2>
      <p>상자에 적힌 “10kg”은 포장에 표시한 무게이고, 실제로 들어간 양은 상자마다 조금씩 다릅니다. 국립농산물품질관리원의 「농산물 표준규격」도 거래단위를 <strong>포장 용기의 무게를 뺀 내용물의 무게 또는 개수</strong>로 정하고 있습니다. 그래서 정산표에는 표시 중량과 저울로 잰 실중량을 나눠 적어 두는 편이 정확합니다. (확인일 ${CHECKED})</p>
      <p>단·통처럼 무게가 적혀 있지 않은 포장은 한두 개를 직접 달아 실중량을 적고, 달지 못했다면 빈칸이나 다른 숫자 대신 “미확인”이라고 적어 둡니다.</p>

      <h2>열은 이렇게 둡니다</h2>
      <div class="table-scroll"><table>
        <thead><tr><th scope="col">열</th><th scope="col">적는 내용</th></tr></thead>
        <tbody>
          <tr><td>품목 · 품종(작형)</td><td>예: 양파, 사과(홍로), 방울토마토(대추형). 비슷한 품목도 따로 적습니다</td></tr>
          <tr><td>포장 이름</td><td>15kg 망, 단, 10kg 상자, 통처럼 실제 포장</td></tr>
          <tr><td>표시 중량(kg)</td><td>포장에 적은 무게. 없으면 비움</td></tr>
          <tr><td>실중량(kg)</td><td>포장 하나를 저울에 달아 용기 무게를 뺀 값. 못 달았으면 “미확인”</td></tr>
          <tr><td>포장 수</td><td>망·단·상자·통 개수</td></tr>
          <tr><td>총 kg</td><td>실중량 × 포장 수</td></tr>
          <tr><td>포장 단가 · kg당 가격</td><td>포장 하나의 가격, 그리고 포장 단가 ÷ 실중량</td></tr>
        </tbody>
      </table></div>
      <p>엑셀이라면 실중량이 E열, 포장 수가 F열, 포장 단가가 H열일 때 총 kg은 <code>=E2*F2</code>, kg당 가격은 <code>=ROUND(H2/E2,0)</code>으로 계산할 수 있습니다.</p>

      <h2>계산 예시</h2>
      <p>아래 숫자는 계산 방법을 보여 주기 위한 <strong>설명용 예시</strong>이며 실제 시세나 실제 거래가 아닙니다.</p>
      <div class="table-scroll"><table>
        <thead><tr><th scope="col">품목</th><th scope="col">포장</th><th scope="col">표시</th><th scope="col">실중량</th><th scope="col">수</th><th scope="col">총 kg</th><th scope="col">포장 단가</th><th scope="col">kg당</th></tr></thead>
        <tbody>
          <tr><td>사과(홍로)</td><td>10kg 상자</td><td class="num">10</td><td class="num">10.3</td><td class="num">3</td><td class="num">30.9</td><td class="num">45,000원</td><td class="num">4,369원</td></tr>
          <tr><td>양파</td><td>15kg 망</td><td class="num">15</td><td class="num">14.6</td><td class="num">4</td><td class="num">58.4</td><td class="num">18,000원</td><td class="num">1,233원</td></tr>
          <tr><td>대파</td><td>단</td><td>-</td><td class="num">1.2</td><td class="num">10</td><td class="num">12.0</td><td class="num">3,000원</td><td class="num">2,500원</td></tr>
          <tr><td>수박</td><td>통</td><td>-</td><td class="num">7.8</td><td class="num">1</td><td class="num">7.8</td><td class="num">20,000원</td><td class="num">2,564원</td></tr>
        </tbody>
      </table></div>
      <p>예를 들어 사과는 10.3kg × 3상자 = 30.9kg이고, kg당 가격은 45,000원 ÷ 10.3kg ≈ 4,369원입니다. 표시 중량 10kg으로 나누면 4,500원이 되어 실제보다 비싸 보입니다. 수박처럼 통마다 무게가 크게 다른 품목은 통마다 한 줄씩 적는 편이 정확합니다.</p>

      <h2>무게 사진은 같은 번호로</h2>
      <ol>
        <li>정산표의 줄 번호나 날짜를 사진 파일 이름에도 붙입니다. 예: <code>2026-10-20_양파15kg망_01_중량.jpg</code></li>
        <li>저울이 0을 가리키는 화면, 빈 용기, 내용물을 담은 포장 순서로 찍어 두면 실중량을 다시 계산할 수 있습니다. 자세한 순서는 <a href="/agri/guides/produce-shipping-evidence/">농산물 보낼 때 남길 사진</a>에 있습니다.</li>
        <li>사진 번호는 순서를 표시할 뿐 무게를 증명하지 않습니다. 저울 숫자가 사진에서 읽히는지 확대해 확인하세요.</li>
      </ol>
      <p>여러 장의 이름은 <a href="/tools/photo-rename/">사진 날짜순 이름 바꾸기</a>로 한 번에 붙이고, 저울 사진과 정산표를 함께 보관하려면 <a href="/tools/evidence-pack/?type=produce">출하 증빙 묶음 만들기</a>를 쓰세요.</p>

      <h2>공식 가격과 비교할 때</h2>
      <ul>
        <li>품목·품종마다 따로 비교합니다. 배추·양파·대파나 사과·배·포도를 한 평균 kg당 가격으로 합치지 않습니다.</li>
        <li>공식 가격정보는 품목·등급·단위(예: 10kg 상자, 1kg)가 정해져 있으니, 내 정산표의 kg당 가격과 같은 단위로 맞춘 뒤 비교합니다.</li>
        <li>정산표에는 조회한 날짜와 출처 주소를 함께 적어 두면 나중에 다시 확인할 수 있습니다.</li>
      </ul>

      <h2>보내기 전 점검</h2>
      ${checkboxList([
        "포장 개수와 kg이 한 열에 섞이지 않았다",
        "표시 중량만으로 실중량 칸을 채우지 않았다 (모르면 “미확인”)",
        "쪽파와 대파, 토마토와 방울토마토처럼 비슷한 품목 이름이 바뀌지 않았다",
        "다른 날·다른 물량의 단가를 이번 줄에 복사하지 않았다",
        "구매자 연락처·주소는 정산표가 아닌 다른 파일에 두었다",
      ])}`,
    faqs: [
      ["망이나 상자 개수만 알면 kg 열은 비워도 되나요?", "정산은 개수로도 할 수 있지만, kg당 가격을 비교하거나 무게 문의에 답하려면 실중량이 필요합니다. 아직 달아 보지 못했다면 표시 중량을 옮겨 적지 말고 “미확인”으로 남기세요."],
      ["여러 품목을 한 정산표에 넣어도 되나요?", "넣어도 됩니다. 다만 품목·포장 이름 열을 나누고, 한 품목의 단가를 다른 품목 줄에 복사하지 않도록 주의하세요."],
      ["선물 상자처럼 개수로 파는 것도 kg으로 바꿔야 하나요?", "개수로 판 상품은 개수 열을 그대로 두고, 무게를 달았다면 kg 열에 따로 적습니다. 개당 가격을 kg당 칸에 옮겨 적지 않습니다."],
    ],
    sources: ["standard"],
    related: ["direct-sale-settlement-files", "produce-shipping-evidence", "evidence-pack-final-checklist"],
    legacyLink: ["품목·등급·단위를 맞춰 공식 가격 조회하는 법", legacyBoribay("agricultural-price-lookup", "agri_document_guides", "pack-unit-kg-files"), "실제 가격·거래 기준을 이어서 확인하세요."],
  },
  {
    slug: "farm-supplies-disposal-records",
    group: "common",
    published: "2026-08-10",
    modified: "2026-10-26",
    title: "폐농자재 정리·처분 기록 준비법",
    description: "남은 비료·농약 용기·농업용 필름과 고장 난 자재를 품목별로 분리하고 문의·인계 기록을 남기는 기본 순서입니다.",
    card: "품목 분리·라벨 사진·문의와 인계 기록",
    intro: [],
    steps: [
      ["품목 분리", "내용물이 남은 제품, 빈 용기, 필름·끈, 금속·플라스틱 자재를 섞지 않고 구분합니다."],
      ["표시 촬영", "제품명·성분·남은 양·오염 상태를 확인할 수 있게 라벨과 전체 모습을 촬영합니다."],
      ["농약 빈병·폐비닐 문의용 사진 정리", "빈 용기와 내용물이 남은 제품, 흙이나 다른 물질이 섞인 필름을 사진과 목록에서 구분합니다. 품목별 수량 또는 확인한 양, 보관 상태, 문의할 질문을 같은 번호로 적으세요. 수거 가능 여부는 사진 파일만으로 판단하지 않습니다."],
      ["공식 경로 확인", "임의 매립·소각·배출을 피하고 지역 행정기관·수거처의 최신 안내와 인계일을 기록합니다. 가까운 공동집하장 위치는 영농폐기물 집하장 지도(sumimap.com)에서 찾아볼 수 있습니다."],
      ["공동집하장에 문의한 결과 남기기", "문의일, 확인한 기관·수거처, 받는 품목, 배출 방법, 수거일과 답변 내용을 기록합니다. 안내문 파일과 사진을 같은 폴더에 두고, 다른 지역의 안내나 지난 수거일 자료와 섞이지 않게 합니다."],
      ["인계 뒤 파일 목록 확인", "인계 날짜와 실제 넘긴 품목·수량을 최초 목록에 맞춰 적고, 받은 확인 자료가 있다면 함께 보관합니다. 사진과 안내문을 한 PDF로 묶어 두면 나중에 찾기 쉽습니다."],
    ],
    faqs: [
      ["농약 빈병과 남은 농약 사진을 같은 파일로 보내도 되나요?", "한 묶음으로 보낼 때도 사진 제목과 목록에서 내용물 유무를 분명히 나누세요. 지역 담당자가 품목과 상태를 확인할 수 있게 라벨을 읽을 수 있는 사본을 보내고, 배출 방법은 해당 기관의 답변을 따릅니다."],
      ["공동집하장 주소만 알면 처분 기록은 충분한가요?", "주소 외에도 해당 품목을 받는지, 수거일과 분리 방법이 무엇인지 확인한 날짜와 답변을 남기세요. 거래 증빙 도우미는 파일 정리를 돕고 실제 수거 조건은 지역 기관·수거처에서 확인합니다."],
    ],
    tools: [["품목별 사진에 날짜·번호 붙이기", "/tools/photo-rename/"], ["안내문과 사진을 PDF 하나로 묶기", "/tools/pdf-organizer/"], ["사진 속 주소·연락처 가리기", "/tools/image-redactor/"]],
    related: ["photo-date-exif", "evidence-pack-final-checklist"],
    sisterLink: ["가까운 공동집하장 찾기 — 영농폐기물 집하장 지도", "https://sumimap.com/"],
    legacyLink: ["폐농자재 처리·나눔 확인 가이드", legacyBoribay("farm-supplies-disposal-guide", "agri_document_guides", "farm-supplies-disposal-records"), "처리 방법과 집하장 찾기를 이어서 확인하세요."],
  },
];

const groups = [
  { id: "machinery", label: "중고 농기계" },
  { id: "produce", label: "농산물 출하·판매글" },
  { id: "settlement", label: "정산" },
  { id: "common", label: "모든 거래에 공통" },
];

const bySlug = new Map(guides.map((guide) => [guide.slug, guide]));

function page({ title, description, url, type, head = "", body, ads = true }) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    ${commonHead({ ads })}
    ${socialMeta({ title, description, url, type })}
    ${head}
  </head>
  <body>
    ${siteHeader("guides")}
    <main id="main" class="page" tabindex="-1">
      <div class="wrap">
${body}
      </div>
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

function renderGuide(guide) {
  const url = `${base}/agri/guides/${guide.slug}/`;
  const docTitle = `${guide.metaTitle || guide.title} - ${SITE.name}`;
  const stepsHtml = guide.steps
    ? guide.steps.map(([title, text]) => `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>`).join("")
    : "";
  const toolHtml = guide.tool
    ? `<div class="cta-box"><p><strong>${escapeHtml(guide.tool[1])}</strong><br>${escapeHtml(guide.tool[2])}</p><a class="btn primary" href="${escapeAttr(guide.tool[0])}">${escapeHtml(guide.tool[1])}</a></div>`
    : "";
  const toolsList = guide.tools
    ? `<h2>지금 파일 정리하기</h2><ul class="link-list">${guide.tools.map(([label, href]) => `<li><a href="${escapeAttr(href)}">${escapeHtml(label)}</a></li>`).join("")}</ul>`
    : "";
  const faqHtml = guide.faqs.length
    ? `<h2>자주 묻는 질문</h2><div class="faq">${guide.faqs.map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join("")}</div>`
    : "";
  const sourceHtml = guide.sources?.length
    ? `<h2>근거로 삼은 자료</h2><ul class="source-list">${guide.sources.map((key) => `<li><a href="${escapeAttr(sources[key][1])}">${escapeHtml(sources[key][0])}</a> (확인일 ${CHECKED})</li>`).join("")}</ul><p class="source-list">법령·고시·약관은 바뀔 수 있습니다. 중요한 판단 전에는 링크한 원문과 담당 기관 안내를 다시 확인하세요. 이 안내는 법률 자문이 아닙니다.</p>`
    : "";
  const relatedHtml = `<h2>함께 읽으면 좋은 안내</h2><div class="guide-cards">${guide.related
    .map((slug) => bySlug.get(slug))
    .map((item) => `<a class="guide-card" href="/agri/guides/${item.slug}/"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.card)}</span></a>`)
    .join("")}</div>`;
  const sisterHtml = guide.sisterLink ? `<p><a href="${escapeAttr(guide.sisterLink[1])}">${escapeHtml(guide.sisterLink[0])}</a></p>` : "";
  const boribayHtml = guide.boribayNext
    ? `<div class="boribay-box"><p>${escapeHtml(guide.boribayNext.text)}</p><ul>${[[guide.boribayNext.label, guide.boribayNext.href], ...(guide.boribayNext.extra || [])].map(([label, href]) => `<li><a href="${escapeAttr(href)}">${escapeHtml(label)}</a></li>`).join("")}</ul><p class="muted">보리장터는 이 사이트와 같은 운영사(제이 미디어)의 지역 직거래 장터입니다.</p></div>`
    : guide.legacyLink
      ? `<div class="boribay-box"><p>${escapeHtml(guide.legacyLink[2])}</p><p><a href="${escapeAttr(guide.legacyLink[1])}">${escapeHtml(guide.legacyLink[0])}</a></p><p class="muted">보리장터는 이 사이트와 같은 운영사의 지역 직거래 장터입니다.</p></div>`
      : "";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        inLanguage: "ko-KR",
        datePublished: guide.published,
        dateModified: guide.modified,
        mainEntityOfPage: url,
        image: SITE.ogImage,
        author: { "@type": "Organization", name: SITE.name, url: `${base}/` },
        publisher: { ...publisher, logo: { "@type": "ImageObject", url: SITE.logo } },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "처음", item: `${base}/` },
          { "@type": "ListItem", position: 2, name: "가이드", item: `${base}/agri/guides/` },
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
    ],
  };
  const body = `
        <nav class="crumb" aria-label="현재 위치"><a href="/">처음</a> <span aria-hidden="true">›</span> <a href="/agri/guides/">가이드</a></nav>
        <article class="article">
          <header class="page-head">
            <p class="eyebrow">${escapeHtml(groups.find((group) => group.id === guide.group).label)}</p>
            <h1>${escapeHtml(guide.title)}</h1>
            <p class="lead">${escapeHtml(guide.description)}</p>
            <p class="article-meta">작성·관리: ${SITE.name} 운영자, ${SITE.operator} · 최종 수정 <time datetime="${guide.modified}">${guide.modified}</time></p>
          </header>
          ${guide.intro.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
          ${toolHtml}
          ${guide.body ? guide.body() : stepsHtml}
          ${toolsList}
          ${faqHtml}
          ${sourceHtml}
          ${sisterHtml}
          ${boribayHtml}
          <aside class="notice"><p><strong>개인정보 주의</strong> 원본은 따로 안전하게 보관하고, 남에게 보내는 사본에서는 주민번호·계좌번호·전화번호·정확한 주소와 제조번호 일부를 가리세요.</p></aside>
          ${relatedHtml}
        </article>`;
  return page({ title: docTitle, description: guide.description, url, type: "article", head: jsonLd(schema), body });
}

function renderHub() {
  const url = `${base}/agri/guides/`;
  const title = `거래할 때 남길 사진·서류 가이드 - ${SITE.name}`;
  const description = "중고 농기계 사고팔기, 농산물 출하, 직거래 정산에서 무엇을 찍고 어떤 서류를 남길지, 파일을 어떻게 정리할지 단계별로 설명하는 안내 모음입니다.";
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "거래할 때 남길 사진·서류 가이드",
    url,
    inLanguage: "ko-KR",
    description,
    hasPart: guides.map((guide) => ({ "@type": "Article", name: guide.title, url: `${base}/agri/guides/${guide.slug}/` })),
  };
  const body = `
        <nav class="crumb" aria-label="현재 위치"><a href="/">처음</a> <span aria-hidden="true">›</span> <span>가이드</span></nav>
        <header class="page-head">
          <p class="eyebrow">가이드</p>
          <h1>거래할 때 남길 사진·서류 가이드</h1>
          <p class="lead">무엇을 찍고, 어떤 서류를 남기고, 파일을 어떻게 묶어 둘지 거래 종류별로 정리했습니다. 읽은 뒤에는 <a href="/tools/evidence-pack/">증빙 묶음 만들기</a>로 바로 정리할 수 있습니다.</p>
        </header>
        ${groups
          .map(
            (group) => `<section aria-labelledby="g-${group.id}"><h2 id="g-${group.id}">${escapeHtml(group.label)}</h2><div class="guide-cards">${guides
              .filter((guide) => guide.group === group.id)
              .map((guide) => `<a class="guide-card" href="/agri/guides/${guide.slug}/"><strong>${escapeHtml(guide.title)}</strong><span>${escapeHtml(guide.card)}</span></a>`)
              .join("")}</div></section>`
          )
          .join("")}
        <section aria-labelledby="g-how"><h2 id="g-how">가이드 작성 기준</h2><p>안내는 거래 현장에서 바로 따라 할 수 있는 순서를 중심으로 쓰고, 법령·고시·약관을 인용할 때는 원문 링크와 확인일을 함께 적습니다. 확인하지 못한 숫자나 사례는 적지 않습니다. 틀린 곳을 발견하면 <a href="/contact/">문의·오류 제보</a>로 알려 주세요.</p></section>`;
  return page({ title, description, url, type: "website", head: jsonLd(schema), body });
}

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, "index.html"), renderHub(), "utf8");
for (const guide of guides) {
  const dir = path.join(out, guide.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), renderGuide(guide), "utf8");
}

console.log(`generated ${guides.length} guides + hub`);
