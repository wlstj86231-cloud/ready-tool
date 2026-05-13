import JSZip from "jszip";
import { getGuideByPath, guideIndexMeta, guidePages } from "./guides.js";
import "./styles.css";

const BRAND = "goatool";
const baseDomain = "https://goatool.com";
const lastUpdated = "2026-05-13";
const LIMITS = {
  fileCount: 80,
  imageCount: 60,
  totalBytes: 250 * 1024 * 1024,
  singleBytes: 80 * 1024 * 1024,
  csvTextBytes: 8 * 1024 * 1024,
  rows: 50000,
  cells: 500000
};
const STORAGE_KEYS = {
  recentGuides: "goatool:recent-guides",
  favoriteGuides: "goatool:favorite-guides",
  guideProgress: "goatool:guide-progress"
};
const READING_CHARS_PER_MINUTE = 900;

const tools = [
  {
    id: "file-ready",
    path: "/tools/file-ready/",
    group: "제출 준비",
    label: "파일 준비 점검",
    short: "파일명, 용량, ZIP",
    title: "제출 전 파일을 한 번에 점검하고 묶기",
    description: "민원, 입사지원, 학교와 기관 제출 전에 파일명, 용량, 확장자, 중복 파일을 확인하고 제출용 ZIP과 점검표를 만듭니다.",
    tags: ["파일명", "ZIP", "점검표"],
    situations: ["public", "job", "school"]
  },
  {
    id: "image-privacy",
    path: "/tools/image-privacy/",
    group: "개인정보",
    label: "이미지 개인정보 정리",
    short: "EXIF 제거, 크기 조정",
    title: "사진과 캡처 이미지를 개인정보 적은 복사본으로 만들기",
    description: "이미지를 브라우저 캔버스로 다시 저장해 위치정보와 카메라 정보 같은 EXIF 노출 가능성을 줄이고 제출용 용량으로 정리합니다.",
    tags: ["EXIF", "이미지", "개인정보"],
    situations: ["public", "job", "share"]
  },
  {
    id: "data-clean",
    path: "/tools/data-clean/",
    group: "데이터 정리",
    label: "CSV·엑셀 정리",
    short: "공백, 빈 행, 중복",
    title: "CSV와 엑셀 표를 제출 가능한 데이터로 정리하기",
    description: "CSV나 XLSX 파일의 앞뒤 공백, 빈 행과 빈 열, 중복 행을 정리하고 깨끗한 CSV 또는 XLSX로 다시 받습니다.",
    tags: ["CSV", "XLSX", "중복 제거"],
    situations: ["public", "job", "share"]
  }
];

const situations = [
  { id: "all", label: "전체 보기" },
  { id: "public", label: "민원 제출" },
  { id: "job", label: "입사지원" },
  { id: "school", label: "학교·기관 제출" },
  { id: "share", label: "자료 공유" }
];

const homeMeta = {
  title: "goatool - 제출 전 파일, 이미지 개인정보, CSV 정리 도구",
  description:
    "goatool은 민원, 입사지원, 학교와 기관 제출 전에 파일명, 용량, 이미지 개인정보, CSV와 엑셀 데이터를 브라우저에서 정리하는 공익형 준비 도구입니다."
};

const expertise = {
  "file-ready": {
    summary: "파일 준비 점검은 파일 자체를 평가하거나 합격 여부를 보장하지 않습니다. 대신 업로드 실패를 자주 만드는 이름, 용량, 확장자, 중복, 해시 기록을 제출 전에 눈으로 확인할 수 있게 만듭니다.",
    method: [
      "선택한 파일은 브라우저 메모리 안에서만 읽습니다.",
      "SHA-256 해시를 계산해 제출 전후 파일 동일성 확인에 쓸 수 있게 합니다.",
      "점검표 TXT와 원본 파일을 같은 ZIP에 묶어 제출 준비 기록을 남깁니다."
    ],
    limits: [
      "기관별 용량 제한과 허용 확장자는 자동으로 확정할 수 없습니다.",
      "암호화된 문서의 내부 페이지 수나 서명 상태는 검사하지 않습니다.",
      "대용량 파일은 브라우저 안정성을 위해 나눠 처리하는 것이 안전합니다."
    ],
    checklist: ["파일명이 제출자와 용도를 설명하는지 확인", "접수 페이지의 최대 용량과 확장자 조건 확인", "ZIP을 내려받은 뒤 원본 파일 수와 비교"],
    faq: [
      ["파일이 서버로 올라가나요?", "아니요. goatool은 선택한 파일을 브라우저에서 읽고 결과 파일을 생성합니다."],
      ["SHA-256은 왜 필요한가요?", "제출 전 파일과 제출 후 보관 파일이 같은지 확인할 수 있는 식별값입니다."]
    ]
  },
  "image-privacy": {
    summary: "이미지 개인정보 정리는 사진을 새 캔버스에 다시 그린 뒤 저장하는 방식입니다. 일반적인 EXIF 메타데이터 노출 가능성을 줄이지만, 이미지 안에 보이는 주민번호, 주소, 얼굴, 차량번호는 자동으로 가리지 않습니다.",
    method: [
      "이미지를 브라우저에서 디코딩한 뒤 캔버스에 다시 렌더링합니다.",
      "JPG, PNG, WebP 형식으로 새 파일을 만들며 긴 변 리사이즈를 선택할 수 있습니다.",
      "결과 파일은 ZIP으로 묶어 원본과 분리해 보관할 수 있게 합니다."
    ],
    limits: [
      "화면에 보이는 민감정보는 사용자가 직접 가려야 합니다.",
      "일부 특수 이미지 형식이나 손상된 파일은 브라우저가 읽지 못할 수 있습니다.",
      "공식 제출 전에는 결과 이미지의 선명도와 잘림 여부를 직접 확인해야 합니다."
    ],
    checklist: ["이미지에 주소, 연락처, 신분증 번호가 보이는지 확인", "정리본 용량과 해상도가 제출처 조건에 맞는지 확인", "원본은 별도로 보관하고 공유에는 정리본 사용"],
    faq: [
      ["EXIF가 완전히 사라지나요?", "캔버스 재저장 방식은 일반적인 EXIF를 결과 파일에 싣지 않는 데 유리하지만, 모든 파일 형식의 모든 메타데이터를 법적으로 보증하지는 않습니다."],
      ["이미지 품질은 왜 조절하나요?", "제출처 용량 제한에 맞추면서 글자가 읽히는 수준을 유지하기 위해서입니다."]
    ]
  },
  "data-clean": {
    summary: "CSV·엑셀 정리는 표 데이터를 제출 가능한 형태로 다듬는 도구입니다. 값의 진실성이나 업무 판단을 바꾸지 않고, 업로드 오류를 자주 만드는 공백, 빈 행, 빈 열, 중복 행을 정리합니다.",
    method: [
      "CSV 텍스트 또는 XLSX 첫 번째 시트를 행과 열 배열로 읽습니다.",
      "옵션에 따라 앞뒤 공백, 빈 행, 빈 열, 중복 행을 제거합니다.",
      "정리 결과를 UTF-8 CSV와 XLSX 파일로 다시 생성합니다."
    ],
    limits: [
      "수식의 업무 의미나 데이터 정확성은 검증하지 않습니다.",
      "XLSX는 첫 번째 시트 기준으로 읽습니다.",
      "대용량 표는 브라우저 메모리를 위해 행과 셀 수 제한을 둡니다."
    ],
    checklist: ["원본 파일을 먼저 따로 보관", "정리 후 행 수가 의도와 맞는지 확인", "중복 제거가 필요한 데이터인지 판단 후 적용"],
    faq: [
      ["중복 행 제거는 어떻게 판단하나요?", "첫 행은 머리글로 유지하고, 나머지 행의 값을 소문자와 공백 정리 기준으로 비교합니다."],
      ["엑셀 수식은 유지되나요?", "정리본은 값 중심으로 다시 생성됩니다. 수식 보존이 필요한 원본은 별도로 보관하세요."]
    ]
  }
};

const infoPages = {
  "/about/": {
    title: "소개",
    metaTitle: "소개 - goatool",
    description: "goatool은 제출 전 파일 준비와 개인정보 정리를 돕는 공익형 브라우저 도구 모음입니다.",
    body: [
      ["운영 목적", "goatool은 민원, 입사지원, 학교와 기관 제출 전에 생기는 파일 준비 문제를 줄이기 위한 공익형 도구 사이트입니다. 사용자가 파일을 서버에 올리지 않고도 기본 점검과 정리를 마칠 수 있게 설계했습니다."],
      ["goatool 신뢰 기준", "goatool의 브랜드 신뢰는 빠른 자동화보다 처리 위치와 한계 고지를 분명히 하는 데서 시작합니다. 각 도구는 브라우저 로컬 처리, 제출 전 검수, 원본 보관, 개인정보 최소화 원칙을 함께 안내합니다."],
      ["전문성 기준", "각 도구는 작동 원리, 한계, 검수 기준을 함께 제공합니다. 결과를 과장하지 않고 사용자가 마지막 판단을 할 수 있게 돕는 것을 우선합니다."],
      ["최종 업데이트", `${lastUpdated} 기준으로 파일 준비, 이미지 개인정보 정리, CSV·엑셀 정리 기능과 설명을 검수했습니다.`]
    ]
  },
  "/privacy/": {
    title: "개인정보 처리방침",
    metaTitle: "개인정보 처리방침 - goatool",
    description: "goatool은 파일을 서버로 업로드하지 않고 브라우저 안에서 처리하는 것을 우선합니다.",
    body: [
      ["브라우저 처리", "파일 준비, 이미지 정리, 데이터 정리는 사용자의 브라우저 안에서 실행됩니다. 결과 파일도 브라우저에서 생성됩니다."],
      ["보관하지 않는 정보", "현재 구현은 사용자가 선택한 파일을 별도 서버로 업로드하거나 저장하지 않습니다. 페이지를 새로고침하면 선택 파일과 결과 상태는 사라집니다."],
      ["사용자 주의", "브라우저 확장 프로그램, 운영체제, 공유 폴더 같은 외부 환경은 goatool이 통제하지 않습니다. 민감한 자료는 내려받은 결과를 직접 확인한 뒤 사용하세요."]
    ]
  },
  "/terms/": {
    title: "이용안내",
    metaTitle: "이용안내 - goatool",
    description: "goatool의 브라우저 기반 파일 준비 도구 이용 기준과 주의사항을 안내합니다.",
    body: [
      ["보조 도구", "goatool은 제출 준비를 돕는 보조 도구입니다. 기관 접수 성공, 개인정보 완전 제거, 데이터 정확성을 보장하지 않습니다."],
      ["원본 보관", "정리 전 원본 파일은 반드시 따로 보관하세요. 결과 파일은 제출 전 사람이 직접 열어 확인해야 합니다."],
      ["제한", "대용량 파일과 대용량 표는 브라우저 성능 보호를 위해 처리 제한이 있습니다."]
    ]
  },
  "/contact/": {
    title: "문의",
    metaTitle: "문의 - goatool",
    description: "goatool 개선 제안과 오류 제보를 위한 안내 페이지입니다.",
    body: [
      ["오류 제보", "어떤 도구에서 어떤 파일 형식으로 문제가 생겼는지, 브라우저 종류와 화면 상태를 함께 기록하면 개선에 도움이 됩니다."],
      ["개선 제안", "공공기관 제출, 입사지원, 학교 제출처럼 반복되는 파일 준비 문제가 있으면 새 도구 후보로 검토할 수 있습니다."],
      ["주의", "민감한 원본 파일은 문의나 제보에 첨부하지 않는 것을 원칙으로 합니다."]
    ]
  }
};

const state = {
  query: new URLSearchParams(location.search).get("q") || "",
  situation: "all",
  guideQuery: "",
  guideCategory: "all",
  activeTool: toolFromRoute(location.pathname) || "file-ready",
  lastManifestBlob: null,
  lastZipBlob: null,
  lastImageZipBlob: null,
  lastCsvBlob: null,
  lastXlsxBlob: null,
  cleanRows: null
};

const app = document.querySelector("#app");

render();

function toolFromRoute(pathname) {
  const path = normalizePath(pathname);
  return tools.find((tool) => tool.path === path)?.id || null;
}

function normalizePath(pathname) {
  let path = pathname || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  if (path !== "/" && !path.endsWith("/")) path = `${path}/`;
  return path;
}

function activeTool() {
  return tools.find((tool) => tool.id === state.activeTool) || tools[0];
}

function render() {
  const selected = activeTool();
  const currentPath = normalizePath(location.pathname);
  const infoPage = infoPageFromRoute(location.pathname);
  const guidePage = getGuideByPath(location.pathname);
  const isGuideIndex = currentPath === guideIndexMeta.path;
  const isReferencePage = Boolean(infoPage || guidePage || isGuideIndex);
  if (guidePage) recordGuideVisit(guidePage);
  updateDocumentMeta(selected, infoPage, guidePage, isGuideIndex);
  const filteredTools = tools.filter((tool) => {
    const q = state.query.trim().toLowerCase();
    const byQuery =
      !q ||
      [tool.label, tool.short, tool.title, tool.description, tool.group, ...tool.tags]
        .join(" ")
        .toLowerCase()
        .includes(q);
    const bySituation = state.situation === "all" || tool.situations.includes(state.situation);
    return byQuery && bySituation;
  });

  app.innerHTML = `
    ${guidePage ? `<div class="read-progress" aria-hidden="true"><span></span></div>` : ""}
    <a class="skip-link" href="#mainContent">본문 바로가기</a>
    <header class="site-header">
      <div class="header-main">
        <a class="brand" href="/" data-link aria-label="goatool 홈">
          <span class="brand-mark" aria-hidden="true">${documentIcon()}</span>
          <span>
            <strong>goatool</strong>
            <small>GOATOOL FILE GUIDE</small>
          </span>
        </a>
        <label class="header-search">
          <span class="visually-hidden">도구 검색</span>
          <span aria-hidden="true">${searchIcon()}</span>
          <input id="siteSearch" type="search" value="${escapeAttr(state.query)}" placeholder="파일명, 이미지, CSV, 제출 준비 검색..." />
        </label>
        <nav class="header-nav" aria-label="주요 도구">
          ${tools
            .map(
              (tool) => `
                <a href="${tool.path}" data-tool="${tool.id}" data-link class="${!isReferencePage && tool.id === selected.id ? "on" : ""}" ${!isReferencePage && tool.id === selected.id ? 'aria-current="page"' : ""}>
                  ${tool.label}
                </a>
              `
            )
            .join("")}
          <a href="/guides/" data-link class="${isGuideIndex || guidePage ? "on" : ""}" ${isGuideIndex || guidePage ? 'aria-current="page"' : ""}>
            전문 가이드
          </a>
        </nav>
      </div>
      <div class="public-strip">
        <div class="public-strip-inner">
          <p><span class="live-dot"></span><strong>공익형 준비 도구</strong> 브라우저 안에서 파일을 처리하고, 서버 업로드 없이 결과를 만듭니다.</p>
          <button type="button" class="strip-button" data-scroll-tool>도구 바로 쓰기</button>
        </div>
      </div>
      <div class="category-bar" aria-label="카테고리">
        <div class="category-inner">
          ${tools
            .map(
              (tool) => `
                <a href="${tool.path}" data-tool="${tool.id}" data-link class="category-tab ${!isReferencePage && tool.id === selected.id ? "on" : ""}" ${!isReferencePage && tool.id === selected.id ? 'aria-current="page"' : ""}>
                  ${tool.group}
                </a>
              `
            )
            .join("")}
        </div>
      </div>
    </header>

    <main class="page-shell" id="mainContent" tabindex="-1">
      <section class="content">
        ${infoPage ? renderInfoPage(infoPage) : ""}
        ${isGuideIndex ? renderGuideIndexPage() : ""}
        ${guidePage ? renderGuidePage(guidePage) : ""}
        <div class="chip-row ${isReferencePage ? "is-hidden" : ""}" aria-label="상황 필터">
          <span class="chip-label">내 상황</span>
          ${situations
            .map(
              (item) => `
                <button type="button" class="chip ${state.situation === item.id ? "on" : ""}" data-situation="${item.id}" aria-pressed="${state.situation === item.id}">
                  ${item.label}
                </button>
              `
            )
            .join("")}
        </div>

        <section class="notice-card ${isReferencePage ? "is-hidden" : ""}" aria-labelledby="noticeTitle">
          <p class="notice-kicker">GOATOOL CHECK DB</p>
          <h1 id="noticeTitle">제출 전에 파일, 이미지, 표 데이터를 먼저 정리하는 공익형 도구</h1>
          <p>
            goatool은 민원, 입사지원, 학교 과제, 기관 제출처럼 실패하면 다시 올려야 하는 파일 준비 작업을
            한 화면에서 처리하도록 만든 브라우저 기반 도구입니다.
          </p>
          <div class="notice-badges">
            <span>goatool 신뢰 기준</span>
            <span>브라우저 처리 우선</span>
            <span>서버 업로드 없음</span>
            <span>공공 제출 준비</span>
          </div>
        </section>

        <section class="tool-workbench ${isReferencePage ? "is-hidden" : ""}" id="toolWorkbench" aria-labelledby="toolTitle">
          <div class="tool-heading">
            <div>
              <p class="section-label">${selected.group}</p>
              <h2 id="toolTitle">${selected.title}</h2>
              <p>${selected.description}</p>
            </div>
            <a class="tool-url" href="${selected.path}" data-link>${baseDomain}${selected.path}</a>
          </div>
          ${renderTool(selected.id)}
        </section>

        ${isReferencePage ? "" : renderExpertisePanel(selected)}

        <section class="tool-list ${isReferencePage ? "is-hidden" : ""}" aria-labelledby="toolListTitle">
          <div class="section-head">
            <h2 id="toolListTitle">도구 목록</h2>
            <span>${filteredTools.length}개 도구</span>
          </div>
          <div class="card-stack">
            ${filteredTools.map((tool) => renderToolCard(tool)).join("") || `<p class="empty">검색 조건에 맞는 도구가 없습니다.</p>`}
          </div>
        </section>

        <section class="guide-copy ${isReferencePage ? "is-hidden" : ""}" aria-labelledby="guideTitle">
          <h2 id="guideTitle">goatool 사용 기준</h2>
          <div class="guide-grid">
            <article>
              <h3>파일 제출 전</h3>
              <p>파일명에 의미 없는 문자가 섞였거나 용량 제한을 넘으면 접수 실패가 생깁니다. 제출 전에 이름, 용량, 확장자, 누락 파일을 확인합니다.</p>
            </article>
            <article>
              <h3>이미지 공유 전</h3>
              <p>사진에는 촬영 기기, 시간, 위치 관련 메타데이터가 남을 수 있습니다. 공개 제출이나 공유 전에는 새 이미지로 다시 저장합니다.</p>
            </article>
            <article>
              <h3>데이터 전달 전</h3>
              <p>CSV와 엑셀 표는 빈 행, 중복 행, 앞뒤 공백 때문에 업로드 오류가 납니다. 원본을 보관하고 정리본을 따로 만듭니다.</p>
            </article>
          </div>
        </section>
      </section>

      <aside class="sidebar" aria-label="보조 정보">
        <section class="side-panel">
          <h2>카테고리</h2>
          ${tools
            .map(
              (tool) => `
                <a href="${tool.path}" data-tool="${tool.id}" data-link class="side-link ${!isReferencePage && tool.id === selected.id ? "on" : ""}" ${!isReferencePage && tool.id === selected.id ? 'aria-current="page"' : ""}>
                  <span>${tool.label}</span>
                  <span aria-hidden="true">${arrowIcon()}</span>
                </a>
              `
            )
            .join("")}
        </section>

        <section class="side-panel">
          <h2>전문 가이드</h2>
          ${guidePages
            .slice(0, 6)
            .map(
              (guide) => `
                <a href="${guide.path}" data-link class="side-link ${guidePage?.slug === guide.slug ? "on" : ""}" ${guidePage?.slug === guide.slug ? 'aria-current="page"' : ""}>
                  <span>${guide.title}</span>
                  <span aria-hidden="true">${arrowIcon()}</span>
                </a>
              `
            )
            .join("")}
          <a href="/guides/" data-link class="side-link ${isGuideIndex ? "on" : ""}" ${isGuideIndex ? 'aria-current="page"' : ""}>
            <span>전체 가이드 보기</span>
            <span aria-hidden="true">${arrowIcon()}</span>
          </a>
        </section>

        <section class="side-panel">
          <h2>알아두면 좋은 점</h2>
          <div class="note-list">
            <p>처리 결과는 브라우저 안에서 생성됩니다. 민감한 파일은 내려받은 뒤 원본과 비교하세요.</p>
            <p>기관마다 용량 제한과 허용 확장자가 다릅니다. 접수 페이지의 조건을 마지막에 다시 확인하세요.</p>
            <p>개인정보 제거 도구는 이미지 재저장 중심입니다. 이미 화면에 찍힌 주민번호나 주소는 직접 가려야 합니다.</p>
          </div>
        </section>

        <section class="side-panel">
          <h2>검수 기준</h2>
          <div class="note-list blue">
            <p>파일명은 이름, 용도, 날짜를 알아볼 수 있게 유지합니다.</p>
            <p>제출용 ZIP에는 점검표를 함께 넣어 누락 여부를 남깁니다.</p>
            <p>CSV 정리 전 원본 파일은 따로 보관하는 편이 안전합니다.</p>
          </div>
        </section>
      </aside>
    </main>

    <footer class="site-footer">
      <div>
        <strong>goatool</strong>
        <p>제출 전 파일 준비, 이미지 개인정보 정리, CSV와 엑셀 정리를 돕는 공익형 도구 모음입니다.</p>
      </div>
      <nav aria-label="하단 링크">
        <a href="/about/" data-link>소개</a>
        <a href="/guides/" data-link>전문 가이드</a>
        <a href="/privacy/" data-link>개인정보 처리방침</a>
        <a href="/terms/" data-link>이용안내</a>
        <a href="/contact/" data-link>문의</a>
      </nav>
    </footer>
  `;

  bindShellEvents();
  bindGuideEvents(guidePage, isGuideIndex);
  bindToolEvents(selected.id);
  updateReadingProgress();
}

function infoPageFromRoute(pathname) {
  return infoPages[normalizePath(pathname)] || null;
}

function updateDocumentMeta(tool, page = null, guide = null, isGuideIndex = false) {
  const isHome = normalizePath(location.pathname) === "/";
  const title = guide?.metaTitle || (isGuideIndex ? guideIndexMeta.metaTitle : page?.metaTitle || (isHome ? homeMeta.title : `${tool.label} - ${BRAND}`));
  const description = guide?.description || (isGuideIndex ? guideIndexMeta.description : page?.description || (isHome ? homeMeta.description : `${tool.label}: ${tool.description}`));
  const path = guide?.path || (isGuideIndex ? guideIndexMeta.path : page ? normalizePath(location.pathname) : isHome ? "/" : tool.path);
  document.title = title;
  setMeta("description", description);
  setMeta("og:title", title, "property");
  setMeta("og:description", description, "property");
  setCanonical(`${baseDomain}${path}`);
  updateStructuredData(tool, page, `${baseDomain}${path}`, guide, isGuideIndex, isHome);
}

function setMeta(name, content, attribute = "name") {
  let node = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, name);
    document.head.append(node);
  }
  node.setAttribute("content", content);
}

function setCanonical(href) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.append(node);
  }
  node.setAttribute("href", href);
}

function updateStructuredData(tool, page, url, guide = null, isGuideIndex = false, isHome = false) {
  let node =
    document.querySelector("#goatool-structured-data") ||
    document.querySelector('script[type="application/ld+json"]');
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    document.head.append(node);
  }
  node.id = "goatool-structured-data";
  const data = guide ? guideSchema(guide, url) : isGuideIndex ? guideIndexSchema(url) : page ? organizationSchema(page, url) : isHome ? websiteSchema(url) : toolSchema(tool, url);
  node.textContent = JSON.stringify(data);
}

function websiteSchema(url) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: homeMeta.title,
    url,
    inLanguage: "ko-KR",
    description: homeMeta.description,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain },
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseDomain}/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

function guideSchema(guide, url) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    name: guide.title,
    url,
    inLanguage: "ko-KR",
    description: guide.description,
    datePublished: guide.dateModified,
    dateModified: guide.dateModified,
    author: { "@type": "Organization", name: BRAND, url: baseDomain },
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain },
    articleSection: guide.category,
    keywords: [guide.keyword, ...guide.related],
    wordCount: guide.nonSpaceLength
  };
}

function guideIndexSchema(url) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: guideIndexMeta.metaTitle,
    url,
    inLanguage: "ko-KR",
    description: guideIndexMeta.description,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain },
    hasPart: guidePages.map((guide) => ({
      "@type": "Article",
      name: guide.title,
      url: `${baseDomain}${guide.path}`
    }))
  };
}

function toolSchema(tool, url) {
  const detail = expertise[tool.id];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.label} - ${BRAND}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web browser",
    url,
    inLanguage: "ko-KR",
    description: tool.description,
    dateModified: lastUpdated,
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain },
    featureList: [...tool.tags, ...detail.method]
  };
}

function organizationSchema(page, url) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle,
    url,
    inLanguage: "ko-KR",
    description: page.description,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain }
  };
}

function renderInfoPage(page) {
  return `
    <section class="info-page" aria-labelledby="infoPageTitle">
      <p class="notice-kicker">GOATOOL STANDARD</p>
      <h1 id="infoPageTitle">${page.title}</h1>
      <p class="info-lead">${page.description}</p>
      <div class="info-blocks">
        ${page.body
          .map(
            ([title, body]) => `
              <article>
                <h2>${title}</h2>
                <p>${body}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderGuideIndexPage() {
  const groups = [...new Set(guidePages.map((guide) => guide.category))];
  const visibleGuides = filteredGuidePages();
  return `
    <section class="guide-index-page" aria-labelledby="guideIndexTitle">
      <p class="notice-kicker">GOATOOL LONGTAIL GUIDE</p>
      <h1 id="guideIndexTitle">${guideIndexMeta.title}</h1>
      <p class="guide-lead">${guideIndexMeta.description}</p>
      <div class="guide-index-stats" aria-label="가이드 통계">
        <span><strong>${guidePages.length}</strong>개 가이드</span>
        <span><strong>3,000+</strong>자 원고</span>
        <span><strong>${groups.length}</strong>개 주제군</span>
      </div>
      ${renderGuideMemoryPanel()}
      <div class="guide-filter-panel" aria-label="전문 가이드 찾기">
        <label class="guide-search">
          <span class="visually-hidden">전문 가이드 검색</span>
          <span aria-hidden="true">${searchIcon()}</span>
          <input id="guideSearch" type="search" value="${escapeAttr(state.guideQuery)}" placeholder="민원, EXIF, CSV, ZIP, 엑셀 검색..." />
        </label>
        <div class="guide-category-filters" aria-label="가이드 주제 필터">
          ${["all", ...groups]
            .map(
              (category) => `
                <button type="button" class="${state.guideCategory === category ? "on" : ""}" data-guide-category="${escapeAttr(category)}" aria-pressed="${state.guideCategory === category}">
                  ${category === "all" ? "전체" : category}
                </button>
              `
            )
            .join("")}
        </div>
        <p class="guide-result-count" role="status">${visibleGuides.length}개 가이드가 표시됩니다.</p>
      </div>
      <div class="guide-index-grid">
        ${visibleGuides.map((guide) => renderGuideIndexCard(guide)).join("") || `<p class="empty">검색 조건에 맞는 가이드가 없습니다.</p>`}
      </div>
    </section>
  `;
}

function renderGuideIndexCard(guide) {
  const progress = getGuideProgress(guide.slug);
  const isFavorite = isFavoriteGuide(guide.slug);
  return `
    <article class="guide-index-card">
      <a href="${guide.path}" data-link>
        <span>${guide.category}</span>
        <h2>${guide.title}</h2>
        <p>${guide.description}</p>
        <small>${guide.keyword} · ${readingMinutes(guide)}분 읽기 · 공백 제외 ${guide.nonSpaceLength.toLocaleString("ko-KR")}자</small>
      </a>
      <div class="guide-card-actions">
        ${progress > 4 ? `<span aria-label="읽은 위치 ${progress}%">${progress}% 읽음</span>` : `<span>새 글</span>`}
        <button type="button" data-guide-bookmark="${guide.slug}" aria-pressed="${isFavorite}" aria-label="${guide.title} 북마크 ${isFavorite ? "해제" : "추가"}">
          ${isFavorite ? "저장됨" : "저장"}
        </button>
      </div>
    </article>
  `;
}

function renderGuidePage(guide) {
  const progress = getGuideProgress(guide.slug);
  const isFavorite = isFavoriteGuide(guide.slug);
  return `
    <article class="guide-page" aria-labelledby="guidePageTitle">
      <nav class="breadcrumb" aria-label="현재 위치">
        <a href="/" data-link>goatool</a>
        <span aria-hidden="true">/</span>
        <a href="/guides/" data-link>전문 가이드</a>
      </nav>
      <header class="guide-hero">
        <p class="notice-kicker">${guide.category}</p>
        <h1 id="guidePageTitle">${guide.title}</h1>
        <p>${guide.description}</p>
        <div class="guide-meta">
          <span>최종 검수 ${guide.dateModified}</span>
          <span>${readingMinutes(guide)}분 읽기</span>
          <span>공백 제외 ${guide.nonSpaceLength.toLocaleString("ko-KR")}자</span>
          <span>${guide.keyword}</span>
        </div>
        <div class="reader-actions" aria-label="읽기 도구">
          <button type="button" data-guide-bookmark="${guide.slug}" aria-pressed="${isFavorite}">
            ${isFavorite ? "북마크 해제" : "북마크 저장"}
          </button>
          <button type="button" data-copy-guide="${guide.path}">링크 복사</button>
          ${progress > 4 ? `<span role="status">이전 읽기 위치 ${progress}%</span>` : `<span role="status">처음 읽는 가이드</span>`}
        </div>
      </header>
      <aside class="guide-summary" aria-label="핵심 요약">
        <strong>핵심 판단</strong>
        <p>${guide.risk}</p>
      </aside>
      <nav class="guide-toc" aria-label="가이드 목차">
        <strong>목차</strong>
        <ol>
          ${guide.sections
            .map((section, index) => `<li><a href="#${guideSectionId(guide, index)}">${section.title}</a></li>`)
            .join("")}
        </ol>
      </nav>
      <div class="guide-body">
        ${guide.sections.map((section, index) => renderGuideSection(section, guide, index)).join("")}
      </div>
      ${renderGuideRelated(guide)}
    </article>
  `;
}

function renderGuideSection(section, guide, index) {
  return `
    <section class="guide-section" id="${guideSectionId(guide, index)}">
      <h2>${section.title}</h2>
      ${(section.paragraphs || []).map((paragraph) => `<p>${paragraph}</p>`).join("")}
      ${
        section.items
          ? `<ul>${section.items.map((item) => `<li>${item}</li>`).join("")}</ul>`
          : ""
      }
    </section>
  `;
}

function renderGuideMemoryPanel() {
  const recent = getRecentGuides()
    .map((item) => guidePages.find((guide) => guide.slug === item.slug))
    .filter(Boolean)
    .slice(0, 3);
  const favorites = getFavoriteGuides()
    .map((slug) => guidePages.find((guide) => guide.slug === slug))
    .filter(Boolean)
    .slice(0, 3);

  if (!recent.length && !favorites.length) {
    return `
      <section class="guide-memory-panel" aria-label="반복 방문 안내">
        <div>
          <strong>다시 볼 글을 저장해둘 수 있습니다.</strong>
          <p>장문 가이드에서 북마크를 누르면 이곳에 저장되고, 읽던 위치도 브라우저에 남습니다.</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="guide-memory-panel" aria-label="최근 본 가이드와 저장한 가이드">
      ${recent.length ? renderGuideMemoryList("최근 본 글", recent, true) : ""}
      ${favorites.length ? renderGuideMemoryList("저장한 글", favorites, false) : ""}
    </section>
  `;
}

function renderGuideMemoryList(title, guides, showProgress) {
  return `
    <div>
      <strong>${title}</strong>
      <div class="guide-memory-list">
        ${guides
          .map((guide) => {
            const progress = getGuideProgress(guide.slug);
            return `
              <a href="${guide.path}" data-link>
                <span>${guide.title}</span>
                <small>${showProgress && progress > 4 ? `${progress}% 지점부터 이어읽기` : `${readingMinutes(guide)}분 읽기`}</small>
              </a>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderGuideRelated(guide) {
  const currentIndex = guidePages.findIndex((item) => item.slug === guide.slug);
  const next = guidePages[(currentIndex + 1) % guidePages.length];
  const sameCategory = guidePages.find((item) => item.category === guide.category && item.slug !== guide.slug);
  return `
    <footer class="guide-related">
      <h2>연관 도구와 다음 글</h2>
      <div>
        ${guide.related.map((item) => `<span>${item}</span>`).join("")}
      </div>
      <div class="guide-next-grid">
        ${sameCategory ? renderGuideNextCard("같은 주제", sameCategory) : ""}
        ${next ? renderGuideNextCard("다음 가이드", next) : ""}
      </div>
      <a href="/guides/" data-link>전체 전문 가이드 보기</a>
    </footer>
  `;
}

function renderGuideNextCard(label, guide) {
  return `
    <a class="guide-next-card" href="${guide.path}" data-link>
      <span>${label}</span>
      <strong>${guide.title}</strong>
      <small>${guide.keyword} · ${readingMinutes(guide)}분 읽기</small>
    </a>
  `;
}

function filteredGuidePages() {
  const q = state.guideQuery.trim().toLowerCase();
  return guidePages.filter((guide) => {
    const byCategory = state.guideCategory === "all" || guide.category === state.guideCategory;
    const haystack = [guide.title, guide.category, guide.keyword, guide.description, guide.audience, guide.risk, ...guide.related]
      .join(" ")
      .toLowerCase();
    return byCategory && (!q || haystack.includes(q));
  });
}

function guideSectionId(guide, index) {
  return `${guide.slug}-section-${index + 1}`;
}

function readingMinutes(guide) {
  return Math.max(3, Math.ceil(guide.nonSpaceLength / READING_CHARS_PER_MINUTE));
}

function renderExpertisePanel(tool) {
  const detail = expertise[tool.id];
  return `
    <section class="expert-panel" aria-labelledby="expertTitle">
      <div class="expert-head">
        <div>
          <p class="notice-kicker">EXPERT REVIEW STANDARD</p>
          <h2 id="expertTitle">${tool.label} 전문 기준</h2>
          <p>${detail.summary}</p>
        </div>
        <span>최종 검수 ${lastUpdated}</span>
      </div>
      <div class="expert-grid">
        ${renderExpertList("작동 원리", detail.method)}
        ${renderExpertList("한계와 주의", detail.limits)}
        ${renderExpertList("제출 전 확인", detail.checklist)}
      </div>
      <div class="faq-grid">
        ${detail.faq
          .map(
            ([question, answer]) => `
              <article>
                <h3>${question}</h3>
                <p>${answer}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderExpertList(title, items) {
  return `
    <article class="expert-card">
      <h3>${title}</h3>
      <ul>
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderToolCard(tool) {
  return `
    <article class="tool-card ${tool.id === state.activeTool ? "selected" : ""}">
      <a href="${tool.path}" data-tool="${tool.id}" data-link class="tool-card-link">
        <div>
          <div class="tag-row">
            <span class="tag primary">${tool.group}</span>
            ${tool.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <h3>${tool.label}</h3>
          <p>${tool.description}</p>
        </div>
        <div class="tool-card-right">
          <strong>${tool.short}</strong>
          <span>열기</span>
        </div>
      </a>
    </article>
  `;
}

function renderTool(id) {
  if (id === "image-privacy") return renderImagePrivacyTool();
  if (id === "data-clean") return renderDataCleanTool();
  return renderFileReadyTool();
}

function renderFileReadyTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="fileReadyForm" novalidate>
        <label class="field">
          <span>제출 묶음 이름</span>
          <input id="packageName" type="text" value="ready_package" maxlength="80" autocomplete="off" placeholder="예: 민원서류_홍길동_20260513" />
        </label>
        <label class="field">
          <span>파일 선택</span>
          <input id="fileReadyInput" class="file-native" type="file" multiple aria-label="점검할 제출 파일 선택" />
          <span class="file-picker">${packageIcon()} 파일 고르기</span>
          <em id="fileReadyCount" class="file-count">선택된 파일 없음</em>
        </label>
        <div class="control-row">
          <button class="primary-button" type="submit">${checkIcon()} 점검하기</button>
          <button class="ghost-button" type="button" id="downloadManifest" disabled>${downloadIcon()} 점검표</button>
          <button class="ghost-button" type="button" id="downloadZip" disabled>${packageIcon()} ZIP</button>
        </div>
        <p class="helper-text">파일은 서버로 올라가지 않습니다. 선택한 파일을 브라우저에서 읽고 ZIP을 만듭니다.</p>
      </form>
      <div class="result-panel" id="fileReadyResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">파일을 선택하면 용량, 확장자, 파일명, 중복 여부를 확인합니다.</p>
      </div>
    </div>
  `;
}

function renderImagePrivacyTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="imagePrivacyForm" novalidate>
        <label class="field">
          <span>이미지 선택</span>
          <input id="imageInput" class="file-native" type="file" accept="image/*" multiple aria-label="정리할 이미지 선택" />
          <span class="file-picker">${shieldIcon()} 이미지 고르기</span>
          <em id="imageCount" class="file-count">선택된 이미지 없음</em>
        </label>
        <div class="field two-col">
          <label>
            <span>저장 형식</span>
            <select id="imageFormat">
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
          <label>
            <span>최대 긴 변</span>
            <select id="imageMaxSide">
              <option value="0">원본 크기</option>
              <option value="1600" selected>1600px</option>
              <option value="1200">1200px</option>
              <option value="900">900px</option>
            </select>
          </label>
        </div>
        <label class="range-field">
          <span>JPG/WebP 품질 <b id="qualityLabel">86</b></span>
          <input id="imageQuality" type="range" min="50" max="95" value="86" />
        </label>
        <div class="control-row">
          <button class="primary-button" type="submit">${shieldIcon()} 정리본 만들기</button>
          <button class="ghost-button" type="button" id="downloadImageZip" disabled>${downloadIcon()} 결과 ZIP</button>
        </div>
        <p class="helper-text">이미지를 캔버스로 다시 저장해 EXIF 노출 가능성을 줄입니다. 화면에 보이는 개인정보는 직접 가린 뒤 사용하세요.</p>
      </form>
      <div class="result-panel" id="imagePrivacyResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">사진이나 캡처를 선택하면 정리본과 용량 변화가 표시됩니다.</p>
      </div>
    </div>
  `;
}

function renderDataCleanTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="dataCleanForm" novalidate>
        <label class="field">
          <span>CSV 또는 XLSX 파일</span>
          <input id="dataFileInput" class="file-native" type="file" accept=".csv,.txt,.xlsx" aria-label="정리할 CSV 또는 엑셀 파일 선택" />
          <span class="file-picker">${tableIcon()} 파일 불러오기</span>
          <em id="dataFileCount" class="file-count">파일을 선택하거나 아래에 붙여넣으세요</em>
        </label>
        <label class="field">
          <span>또는 CSV 붙여넣기</span>
          <textarea id="csvText" rows="8" placeholder="이름,이메일,상태&#10;홍길동, user@example.com ,접수&#10;..."></textarea>
        </label>
        <div class="check-grid">
          <label><input type="checkbox" id="trimCells" checked /> 앞뒤 공백 제거</label>
          <label><input type="checkbox" id="removeBlankRows" checked /> 빈 행 제거</label>
          <label><input type="checkbox" id="removeBlankCols" checked /> 빈 열 제거</label>
          <label><input type="checkbox" id="dedupeRows" checked /> 중복 행 제거</label>
        </div>
        <div class="control-row">
          <button class="primary-button" type="submit">${tableIcon()} 데이터 정리</button>
          <button class="ghost-button" type="button" id="downloadCsv" disabled>${downloadIcon()} CSV</button>
          <button class="ghost-button" type="button" id="downloadXlsx" disabled>${downloadIcon()} XLSX</button>
        </div>
        <p class="helper-text">엑셀 파일은 XLSX 첫 번째 시트 기준으로 읽습니다. 정리본을 내려받기 전 미리보기 행 수를 확인하세요.</p>
      </form>
      <div class="result-panel" id="dataCleanResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">CSV를 붙여넣거나 XLSX 파일을 선택하면 빈 행, 중복 행, 공백을 정리합니다.</p>
      </div>
    </div>
  `;
}

function bindShellEvents() {
  document.querySelector("#siteSearch")?.addEventListener("input", (event) => {
    const cursor = event.target.selectionStart;
    state.query = event.target.value;
    render();
    const input = document.querySelector("#siteSearch");
    input?.focus();
    if (Number.isInteger(cursor)) input?.setSelectionRange(cursor, cursor);
  });

  document.querySelectorAll("[data-tool]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      const id = node.dataset.tool;
      const tool = tools.find((item) => item.id === id);
      if (!tool) return;
      state.activeTool = id;
      history.pushState({ tool: id }, "", tool.path);
      render();
      document.querySelector("#toolWorkbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelector("#mainContent")?.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll("[data-situation]").forEach((node) => {
    node.addEventListener("click", () => {
      state.situation = node.dataset.situation;
      render();
      document.querySelector("#mainContent")?.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll("[data-link]:not([data-tool])").forEach((node) => {
    node.addEventListener("click", (event) => {
      const href = node.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      event.preventDefault();
      history.pushState({}, "", href);
      if (href === "/") state.activeTool = "file-ready";
      render();
      scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelector("[data-scroll-tool]")?.addEventListener("click", () => {
    document.querySelector("#toolWorkbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function bindGuideEvents(guidePage, isGuideIndex) {
  if (isGuideIndex) {
    const input = document.querySelector("#guideSearch");
    input?.addEventListener("input", (event) => {
      const cursor = event.target.selectionStart;
      state.guideQuery = event.target.value;
      render();
      const nextInput = document.querySelector("#guideSearch");
      nextInput?.focus();
      if (Number.isInteger(cursor)) nextInput?.setSelectionRange(cursor, cursor);
    });

    document.querySelectorAll("[data-guide-category]").forEach((node) => {
      node.addEventListener("click", () => {
        state.guideCategory = node.dataset.guideCategory || "all";
        render();
        document.querySelector("#guideIndexTitle")?.focus?.();
      });
    });
  }

  document.querySelectorAll("[data-guide-bookmark]").forEach((node) => {
    node.addEventListener("click", () => {
      toggleFavoriteGuide(node.dataset.guideBookmark);
      render();
    });
  });

  document.querySelectorAll("[data-copy-guide]").forEach((node) => {
    node.addEventListener("click", async () => {
      const path = node.dataset.copyGuide || location.pathname;
      const url = `${baseDomain}${path}`;
      try {
        await navigator.clipboard?.writeText(url);
        node.textContent = "복사됨";
      } catch {
        node.textContent = "주소 복사 불가";
      }
      window.setTimeout(() => {
        if (guidePage) node.textContent = "링크 복사";
      }, 1400);
    });
  });

  if (guidePage) {
    window.setTimeout(updateReadingProgress, 0);
  }
}

function bindToolEvents(id) {
  if (id === "image-privacy") {
    bindImagePrivacyEvents();
    return;
  }
  if (id === "data-clean") {
    bindDataCleanEvents();
    return;
  }
  bindFileReadyEvents();
}

function bindFileReadyEvents() {
  const form = document.querySelector("#fileReadyForm");
  const fileInput = document.querySelector("#fileReadyInput");
  const count = document.querySelector("#fileReadyCount");
  const manifestButton = document.querySelector("#downloadManifest");
  const zipButton = document.querySelector("#downloadZip");

  fileInput?.addEventListener("change", () => {
    count.textContent = fileInput.files?.length ? `${fileInput.files.length}개 파일 선택됨` : "선택된 파일 없음";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(document.querySelector("#fileReadyInput")?.files || []);
    const prefix = safeBaseName(document.querySelector("#packageName")?.value || "ready_package");
    const result = document.querySelector("#fileReadyResult");
    manifestButton.disabled = true;
    zipButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "점검할 파일을 먼저 선택하세요.", "warn");
      return;
    }

    const validation = validateFiles(files, { maxCount: LIMITS.fileCount, allowImagesOnly: false });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "파일을 읽고 해시를 계산하는 중입니다...");
    try {
      const analysis = await Promise.all(files.map((file, index) => inspectFile(file, index)));
      const warnings = collectFileWarnings(analysis);
      const manifest = makeManifest(prefix, analysis, warnings);
      const zip = new JSZip();

      analysis.forEach((item) => {
        const renamed = `${prefix}_${String(item.index + 1).padStart(2, "0")}_${safeBaseName(item.name)}`;
        zip.file(renamed, item.file);
      });
      zip.file(`${prefix}_점검표.txt`, manifest);

      state.lastManifestBlob = new Blob([manifest], { type: "text/plain;charset=utf-8" });
      state.lastZipBlob = await zip.generateAsync({ type: "blob" });
      manifestButton.disabled = false;
      zipButton.disabled = false;
      result.innerHTML = renderFileReadyResult(analysis, warnings);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "파일을 읽는 중 문제가 생겼습니다. 암호화된 파일이나 너무 큰 파일이 섞였는지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  manifestButton?.addEventListener("click", () => {
    if (state.lastManifestBlob) downloadBlob(state.lastManifestBlob, "goatool-checklist.txt");
  });

  zipButton?.addEventListener("click", () => {
    if (state.lastZipBlob) downloadBlob(state.lastZipBlob, "goatool-package.zip");
  });
}

function validateFiles(files, options) {
  if (files.length > options.maxCount) {
    return { ok: false, message: `한 번에 ${options.maxCount}개 이하로 나눠 처리하세요. 브라우저 메모리를 보호하기 위한 제한입니다.` };
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > LIMITS.totalBytes) {
    return { ok: false, message: `총 용량이 ${formatBytes(LIMITS.totalBytes)}를 넘습니다. 여러 묶음으로 나눠 처리하세요.` };
  }

  const tooLarge = files.find((file) => file.size > LIMITS.singleBytes);
  if (tooLarge) {
    return { ok: false, message: `${tooLarge.name} 파일이 ${formatBytes(LIMITS.singleBytes)}를 넘습니다. 브라우저 처리 안정성을 위해 더 작은 파일로 나누세요.` };
  }

  if (options.allowImagesOnly) {
    const unsupported = files.find((file) => !file.type.startsWith("image/") && !["jpg", "jpeg", "png", "webp", "bmp", "gif"].includes(extensionOf(file.name)));
    if (unsupported) {
      return { ok: false, message: `${unsupported.name}은 일반 이미지 파일로 인식되지 않습니다. JPG, PNG, WebP 파일로 다시 시도하세요.` };
    }
  }

  return { ok: true };
}

function setResultBusy(result, busy, message) {
  if (!result) return;
  result.setAttribute("aria-busy", String(busy));
  result.innerHTML = `<p class="empty-result">${escapeHtml(message)}</p>`;
}

function showResultMessage(result, message, tone = "") {
  if (!result) return;
  result.removeAttribute("aria-busy");
  result.innerHTML = `<p class="empty-result ${tone}">${escapeHtml(message)}</p>`;
}

async function inspectFile(file, index) {
  const hash = await hashFile(file);
  return {
    file,
    index,
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    extension: extensionOf(file.name),
    hash
  };
}

function collectFileWarnings(items) {
  const warnings = [];
  const seen = new Map();
  const total = items.reduce((sum, item) => sum + item.size, 0);
  const allowed = new Set(["pdf", "doc", "docx", "hwp", "hwpx", "jpg", "jpeg", "png", "webp", "csv", "xlsx", "xls", "zip", "txt"]);

  if (total > 25 * 1024 * 1024) warnings.push("총 용량이 25MB를 넘습니다. 접수 페이지의 제한을 확인하세요.");

  items.forEach((item) => {
    const normalized = item.name.toLowerCase();
    if (seen.has(normalized)) warnings.push(`중복 파일명: ${item.name}`);
    seen.set(normalized, true);
    if (item.size > 10 * 1024 * 1024) warnings.push(`${item.name}: 10MB 초과`);
    if (!allowed.has(item.extension)) warnings.push(`${item.name}: 제출처에서 허용하지 않을 수 있는 확장자`);
    if (/\s{2,}/.test(item.name) || /[\\/:*?"<>|]/.test(item.name)) warnings.push(`${item.name}: 파일명 특수문자 또는 과한 공백 확인`);
    if (item.name.length > 80) warnings.push(`${item.name}: 파일명이 깁니다`);
  });

  return [...new Set(warnings)];
}

function makeManifest(prefix, items, warnings) {
  const lines = [
    "goatool 제출 파일 점검표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `묶음 이름: ${prefix}`,
    `파일 수: ${items.length}`,
    `총 용량: ${formatBytes(items.reduce((sum, item) => sum + item.size, 0))}`,
    "",
    "[파일 목록]",
    ...items.map((item, index) => `${index + 1}. ${item.name} / ${formatBytes(item.size)} / .${item.extension || "확장자 없음"} / SHA-256 ${item.hash}`),
    "",
    "[주의 사항]",
    ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- 자동 점검에서 큰 위험 신호는 보이지 않았습니다. 제출처 조건은 마지막에 직접 확인하세요."])
  ];
  return lines.join("\n");
}

function renderFileReadyResult(items, warnings) {
  const total = items.reduce((sum, item) => sum + item.size, 0);
  return `
    <div class="stat-grid">
      <div><span>파일 수</span><strong>${items.length}</strong></div>
      <div><span>총 용량</span><strong>${formatBytes(total)}</strong></div>
      <div><span>점검 상태</span><strong class="${warnings.length ? "status-warn" : "status-ok"}">${warnings.length ? "확인 필요" : "준비 가능"}</strong></div>
    </div>
    <div class="result-block">
      <h3>점검 결과</h3>
      ${warnings.length ? `<ul class="warning-list">${warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="ok-line">큰 위험 신호는 없습니다. 내려받은 ZIP과 원본 파일을 마지막에 비교하세요.</p>`}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>파일명</th><th>확장자</th><th>용량</th><th>해시 앞 12자리</th></tr></thead>
        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${escapeHtml(item.extension || "-")}</td>
                  <td>${formatBytes(item.size)}</td>
                  <td><code>${item.hash.slice(0, 12)}</code></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindImagePrivacyEvents() {
  const form = document.querySelector("#imagePrivacyForm");
  const imageInput = document.querySelector("#imageInput");
  const count = document.querySelector("#imageCount");
  const quality = document.querySelector("#imageQuality");
  const qualityLabel = document.querySelector("#qualityLabel");
  const downloadButton = document.querySelector("#downloadImageZip");

  quality?.addEventListener("input", () => {
    qualityLabel.textContent = quality.value;
  });

  imageInput?.addEventListener("change", () => {
    count.textContent = imageInput.files?.length ? `${imageInput.files.length}개 이미지 선택됨` : "선택된 이미지 없음";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(document.querySelector("#imageInput")?.files || []);
    const format = document.querySelector("#imageFormat")?.value || "image/jpeg";
    const maxSide = Number(document.querySelector("#imageMaxSide")?.value || 0);
    const qualityValue = Number(document.querySelector("#imageQuality")?.value || 86) / 100;
    const result = document.querySelector("#imagePrivacyResult");
    downloadButton.disabled = true;

    if (!files.length) {
      showResultMessage(result, "정리할 이미지를 먼저 선택하세요.", "warn");
      return;
    }

    const validation = validateFiles(files, { maxCount: LIMITS.imageCount, allowImagesOnly: true });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "이미지를 다시 저장하는 중입니다...");
    try {
      const zip = new JSZip();
      const outputs = [];

      for (const file of files) {
        const output = await cleanImage(file, { format, maxSide, quality: qualityValue });
        outputs.push(output);
        zip.file(output.name, output.blob);
      }

      state.lastImageZipBlob = await zip.generateAsync({ type: "blob" });
      downloadButton.disabled = false;
      result.innerHTML = renderImageResult(outputs);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "이미지를 읽지 못했습니다. JPG, PNG, WebP 같은 일반 이미지 파일로 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastImageZipBlob) downloadBlob(state.lastImageZipBlob, "goatool-clean-images.zip");
  });
}

async function cleanImage(file, options) {
  const source = await loadImageSource(file);
  const scale = options.maxSide > 0 ? Math.min(1, options.maxSide / Math.max(source.width, source.height)) : 1;
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (options.format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(source.image, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, options.format, options.quality));
  if (!blob) throw new Error("Canvas export failed");
  source.close?.();
  const ext = options.format === "image/png" ? "png" : options.format === "image/webp" ? "webp" : "jpg";
  const name = `${removeExtension(safeBaseName(file.name))}.clean.${ext}`;

  return {
    originalName: file.name,
    name,
    width,
    height,
    originalSize: file.size,
    size: blob.size,
    blob
  };
}

async function loadImageSource(file) {
  try {
    const bitmap = await createImageBitmap(file);
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close?.()
    };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const node = new Image();
        node.onload = () => resolve(node);
        node.onerror = reject;
        node.src = url;
      });
      return {
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url)
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

function renderImageResult(outputs) {
  const before = outputs.reduce((sum, item) => sum + item.originalSize, 0);
  const after = outputs.reduce((sum, item) => sum + item.size, 0);
  const saved = before ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
  return `
    <div class="stat-grid">
      <div><span>이미지 수</span><strong>${outputs.length}</strong></div>
      <div><span>정리 후 용량</span><strong>${formatBytes(after)}</strong></div>
      <div><span>용량 변화</span><strong>${saved}% 감소</strong></div>
    </div>
    <div class="result-block">
      <h3>개인정보 정리 방식</h3>
      <p class="ok-line">이미지를 새 캔버스에 그린 뒤 다시 저장했습니다. 이 방식은 일반적인 EXIF 메타데이터를 결과 파일에 싣지 않습니다.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>원본</th><th>정리본</th><th>크기</th><th>용량</th></tr></thead>
        <tbody>
          ${outputs
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.originalName)}</td>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${item.width}×${item.height}</td>
                  <td>${formatBytes(item.originalSize)} → ${formatBytes(item.size)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindDataCleanEvents() {
  const form = document.querySelector("#dataCleanForm");
  const fileInput = document.querySelector("#dataFileInput");
  const count = document.querySelector("#dataFileCount");
  const csvText = document.querySelector("#csvText");
  const csvButton = document.querySelector("#downloadCsv");
  const xlsxButton = document.querySelector("#downloadXlsx");

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const result = document.querySelector("#dataCleanResult");
    count.textContent = file.name;
    if (file.size > LIMITS.singleBytes) {
      showResultMessage(result, `${file.name} 파일이 너무 큽니다. ${formatBytes(LIMITS.singleBytes)} 이하 파일로 나눠 처리하세요.`, "warn");
      return;
    }
    setResultBusy(result, true, "표 데이터를 읽는 중입니다...");
    try {
      const rows = await readTableFile(file);
      validateTableSize(rows);
      csvText.value = toCsv(rows);
      showResultMessage(result, `${file.name}에서 ${rows.length}개 행을 읽었습니다. 필요한 정리 옵션을 확인한 뒤 데이터 정리를 누르세요.`);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "파일을 읽지 못했습니다. CSV 또는 암호가 없는 XLSX 파일인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = csvText.value.trim();
    const result = document.querySelector("#dataCleanResult");
    csvButton.disabled = true;
    xlsxButton.disabled = true;
    if (!text) {
      showResultMessage(result, "CSV를 붙여넣거나 파일을 먼저 선택하세요.", "warn");
      return;
    }
    if (new Blob([text]).size > LIMITS.csvTextBytes) {
      showResultMessage(result, `붙여넣은 CSV가 ${formatBytes(LIMITS.csvTextBytes)}를 넘습니다. 파일을 나누거나 필요한 범위만 처리하세요.`, "warn");
      return;
    }

    setResultBusy(result, true, "데이터를 정리하고 내려받기 파일을 준비하는 중입니다...");
    try {
      const rows = parseCsv(text);
      validateTableSize(rows);
      const options = {
        trim: document.querySelector("#trimCells")?.checked,
        removeBlankRows: document.querySelector("#removeBlankRows")?.checked,
        removeBlankCols: document.querySelector("#removeBlankCols")?.checked,
        dedupe: document.querySelector("#dedupeRows")?.checked
      };
      const cleaned = cleanRows(rows, options);
      validateTableSize(cleaned);
      if (!cleaned.length) {
        showResultMessage(result, "정리 후 남는 행이 없습니다. 원본 데이터나 정리 옵션을 확인하세요.", "warn");
        return;
      }
      const csv = toCsv(cleaned);
      const xlsxBlob = await rowsToXlsxBlob(cleaned);

      state.cleanRows = cleaned;
      state.lastCsvBlob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
      state.lastXlsxBlob = xlsxBlob;
      csvButton.disabled = false;
      xlsxButton.disabled = false;
      result.innerHTML = renderDataResult(rows, cleaned);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "데이터 정리 중 문제가 생겼습니다. CSV 형식과 파일 크기를 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  csvButton?.addEventListener("click", () => {
    if (state.lastCsvBlob) downloadBlob(state.lastCsvBlob, "goatool-clean.csv");
  });

  xlsxButton?.addEventListener("click", () => {
    if (state.lastXlsxBlob) downloadBlob(state.lastXlsxBlob, "goatool-clean.xlsx");
  });
}

function validateTableSize(rows) {
  const cells = rows.reduce((sum, row) => sum + row.length, 0);
  if (rows.length > LIMITS.rows) {
    throw new Error(`행 수가 ${LIMITS.rows.toLocaleString("ko-KR")}개를 넘습니다. 브라우저 안정성을 위해 나눠 처리하세요.`);
  }
  if (cells > LIMITS.cells) {
    throw new Error(`셀 수가 ${LIMITS.cells.toLocaleString("ko-KR")}개를 넘습니다. 필요한 열만 남긴 뒤 다시 시도하세요.`);
  }
}

async function readTableFile(file) {
  const ext = extensionOf(file.name);
  if (ext === "xlsx") {
    const ExcelJS = await loadExcelJS();
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const rows = [];
    if (!worksheet) return rows;
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values = [];
      for (let index = 1; index <= worksheet.columnCount; index += 1) {
        values.push(normalizeExcelValue(row.getCell(index).value));
      }
      rows.push(values);
    });
    return rows;
  }
  const text = await file.text();
  return parseCsv(text);
}

async function rowsToXlsxBlob(rows) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("ready_clean");
  rows.forEach((row) => worksheet.addRow(row));
  worksheet.columns.forEach((column) => {
    let max = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      max = Math.max(max, String(cell.value ?? "").length + 2);
    });
    column.width = Math.min(max, 42);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function loadExcelJS() {
  const module = await import("exceljs");
  return module.default || module;
}

function normalizeExcelValue(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== "object") return value;
  if ("text" in value) return value.text ?? "";
  if ("result" in value) return value.result ?? "";
  if ("formula" in value) return value.result ?? "";
  if ("richText" in value) return value.richText.map((item) => item.text || "").join("");
  if ("hyperlink" in value) return value.text || value.hyperlink || "";
  return String(value);
}

function cleanRows(rows, options) {
  let cleaned = rows.map((row) => row.map((cell) => (options.trim ? String(cell ?? "").trim() : String(cell ?? ""))));

  if (options.removeBlankRows) {
    cleaned = cleaned.filter((row) => row.some((cell) => String(cell).trim() !== ""));
  }

  const maxCols = Math.max(0, ...cleaned.map((row) => row.length));
  cleaned = cleaned.map((row) => [...row, ...Array(Math.max(0, maxCols - row.length)).fill("")]);

  if (options.removeBlankCols && cleaned.length) {
    const keep = Array.from({ length: maxCols }, (_, index) => cleaned.some((row) => String(row[index] ?? "").trim() !== ""));
    cleaned = cleaned.map((row) => row.filter((_, index) => keep[index]));
  }

  if (options.dedupe) {
    const seen = new Set();
    cleaned = cleaned.filter((row, index) => {
      if (index === 0) return true;
      const key = JSON.stringify(row.map((cell) => String(cell).trim().toLowerCase()));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return cleaned;
}

function renderDataResult(beforeRows, afterRows) {
  const beforeCells = beforeRows.reduce((sum, row) => sum + row.length, 0);
  const afterCells = afterRows.reduce((sum, row) => sum + row.length, 0);
  const preview = afterRows.slice(0, 8);
  return `
    <div class="stat-grid">
      <div><span>행 수</span><strong>${beforeRows.length} → ${afterRows.length}</strong></div>
      <div><span>셀 수</span><strong>${beforeCells} → ${afterCells}</strong></div>
      <div><span>상태</span><strong class="status-ok">정리 완료</strong></div>
    </div>
    <div class="result-block">
      <h3>미리보기</h3>
      <p class="ok-line">상위 ${preview.length}개 행만 표시합니다. 전체 데이터는 CSV 또는 XLSX로 내려받으세요.</p>
    </div>
    <div class="table-wrap">
      <table>
        <tbody>
          ${preview
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  rows.push(row);
  return rows;
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(",")
    )
    .join("\n");
}

async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function extensionOf(name) {
  const parts = String(name).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function removeExtension(name) {
  return String(name).replace(/\.[^.]+$/, "");
}

function safeBaseName(name) {
  return String(name || "ready")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80) || "ready";
}

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in privacy modes; the app remains usable without persistence.
  }
}

function getFavoriteGuides() {
  return readJsonStorage(STORAGE_KEYS.favoriteGuides, []);
}

function isFavoriteGuide(slug) {
  return getFavoriteGuides().includes(slug);
}

function toggleFavoriteGuide(slug) {
  if (!slug) return;
  const favorites = getFavoriteGuides();
  const next = favorites.includes(slug) ? favorites.filter((item) => item !== slug) : [slug, ...favorites].slice(0, 12);
  writeJsonStorage(STORAGE_KEYS.favoriteGuides, next);
}

function getRecentGuides() {
  return readJsonStorage(STORAGE_KEYS.recentGuides, []);
}

function recordGuideVisit(guide) {
  const recent = getRecentGuides().filter((item) => item.slug !== guide.slug);
  recent.unshift({
    slug: guide.slug,
    title: guide.title,
    path: guide.path,
    visitedAt: Date.now()
  });
  writeJsonStorage(STORAGE_KEYS.recentGuides, recent.slice(0, 8));
}

function getGuideProgressMap() {
  return readJsonStorage(STORAGE_KEYS.guideProgress, {});
}

function getGuideProgress(slug) {
  const value = Number(getGuideProgressMap()[slug] || 0);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function setGuideProgress(slug, value) {
  if (!slug || !Number.isFinite(value)) return;
  const progress = getGuideProgressMap();
  progress[slug] = Math.max(progress[slug] || 0, Math.min(100, Math.round(value)));
  writeJsonStorage(STORAGE_KEYS.guideProgress, progress);
}

function updateReadingProgress() {
  const page = document.querySelector(".guide-page");
  const bar = document.querySelector(".read-progress span");
  if (!page || !bar) return;
  const start = page.offsetTop;
  const end = start + page.offsetHeight - window.innerHeight;
  const raw = end <= start ? 100 : ((window.scrollY - start) / (end - start)) * 100;
  const value = Math.max(0, Math.min(100, raw));
  bar.style.width = `${value}%`;
  const guide = getGuideByPath(location.pathname);
  if (guide && value > 2) setGuideProgress(guide.slug, value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function documentIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 14l2 2 4-5"/></svg>`;
}

function searchIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>`;
}

function arrowIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>`;
}

function checkIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>`;
}

function downloadIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>`;
}

function packageIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 8 8-4 8 4-8 4z"/><path d="M4 8v8l8 4 8-4V8"/><path d="M12 12v8"/></svg>`;
}

function shieldIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="m9 12 2 2 4-5"/></svg>`;
}

function tableIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M4 10h16"/><path d="M9 5v14"/><path d="M15 5v14"/></svg>`;
}

window.addEventListener("popstate", () => {
  state.activeTool = toolFromRoute(location.pathname) || state.activeTool;
  render();
});

window.addEventListener(
  "scroll",
  () => {
    window.requestAnimationFrame(updateReadingProgress);
  },
  { passive: true }
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker support is a repeat-visit enhancement; failures should not block the tools.
    });
  });
}
