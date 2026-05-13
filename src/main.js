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
  cells: 500000,
  pdfCount: 30,
  textChars: 200000
};
const STORAGE_KEYS = {
  recentTools: "goatool:recent-tools",
  recentGuides: "goatool:recent-guides",
  favoriteGuides: "goatool:favorite-guides",
  guideProgress: "goatool:guide-progress"
};
const READING_CHARS_PER_MINUTE = 900;

const tools = [
  {
    id: "photo-resize",
    path: "/tools/photo-resize/",
    group: "입사지원 상위",
    label: "증명사진 규격 맞추기",
    short: "3×4, 3.5×4.5, 100×140",
    title: "지원서와 민원 사진을 규격에 맞게 다시 만들기",
    description: "이력서 사진, 응시원서 사진, 신분 확인용 첨부 이미지를 자주 쓰는 규격과 용량 기준에 맞춰 새 JPG 파일로 만듭니다.",
    tags: ["증명사진", "JPG", "용량"],
    situations: ["job", "public", "school"]
  },
  {
    id: "pdf-organizer",
    path: "/tools/pdf-organizer/",
    group: "민원 상위",
    label: "PDF 합치기·페이지 뽑기",
    short: "합치기, 분리, 추출",
    title: "제출용 PDF를 합치거나 필요한 페이지만 뽑기",
    description: "여러 PDF를 하나로 묶거나, 긴 PDF에서 필요한 페이지만 추출해 민원·입사지원 첨부용 PDF를 브라우저에서 다시 만듭니다.",
    tags: ["PDF", "합치기", "페이지 추출"],
    situations: ["public", "job", "school"]
  },
  {
    id: "file-ready",
    path: "/tools/file-ready/",
    group: "제출 상위",
    label: "제출 파일 점검·ZIP",
    short: "파일명, 용량, ZIP",
    title: "제출 전 파일을 한 번에 점검하고 묶기",
    description: "민원, 입사지원, 학교와 기관 제출 전에 파일명, 용량, 확장자, 중복 파일을 확인하고 제출용 ZIP과 점검표를 만듭니다.",
    tags: ["파일명", "ZIP", "점검표"],
    situations: ["public", "job", "school"]
  },
  {
    id: "image-privacy",
    path: "/tools/image-privacy/",
    group: "민원 상위",
    label: "이미지 용량·개인정보 정리",
    short: "EXIF, 리사이즈, 압축",
    title: "사진과 캡처 이미지를 개인정보 적은 복사본으로 만들기",
    description: "이미지를 브라우저 캔버스로 다시 저장해 위치정보와 카메라 정보 같은 EXIF 노출 가능성을 줄이고 제출용 용량으로 정리합니다.",
    tags: ["EXIF", "이미지", "개인정보"],
    situations: ["public", "job", "share"]
  },
  {
    id: "filename-cleaner",
    path: "/tools/filename-cleaner/",
    group: "제출 상위",
    label: "파일명 일괄 정리",
    short: "번호, 날짜, 특수문자",
    title: "제출처가 읽기 쉬운 파일명으로 한 번에 바꾸기",
    description: "여러 파일을 선택해 특수문자와 과한 공백을 정리하고, 번호·날짜·용도 접두어를 붙인 제출용 ZIP과 변경표를 만듭니다.",
    tags: ["파일명", "일괄 변경", "ZIP"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "image-to-pdf",
    path: "/tools/image-to-pdf/",
    group: "민원 상위",
    label: "이미지 PDF 변환",
    short: "JPG, PNG → PDF",
    title: "스캔 이미지와 사진을 제출용 PDF로 묶기",
    description: "JPG, PNG, WebP 이미지를 페이지별 PDF로 변환해 증빙 사진, 스캔본, 캡처 자료를 하나의 첨부 파일로 정리합니다.",
    tags: ["이미지 PDF", "스캔본", "증빙"],
    situations: ["public", "job", "school"]
  },
  {
    id: "zip-inspector",
    path: "/tools/zip-inspector/",
    group: "민원 상위",
    label: "ZIP 내용 점검",
    short: "누락, 용량, 파일명",
    title: "압축파일 안에 제출 서류가 제대로 들어갔는지 확인하기",
    description: "ZIP 파일을 열어 내부 파일 수, 폴더 깊이, 총 용량, 특수문자 파일명, 숨김 파일 가능성을 빠르게 점검합니다.",
    tags: ["ZIP 점검", "누락 확인", "파일 목록"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "text-counter",
    path: "/tools/text-counter/",
    group: "입사지원 상위",
    label: "자소서 글자수·바이트 계산",
    short: "공백 제외, UTF-8 바이트",
    title: "자기소개서와 지원 문항의 글자수·바이트 확인",
    description: "자기소개서, 지원동기, 민원 사유문처럼 제한 길이가 있는 텍스트의 공백 포함·제외 글자수와 UTF-8 바이트를 즉시 계산합니다.",
    tags: ["글자수", "바이트", "자소서"],
    situations: ["job", "public", "school"]
  },
  {
    id: "text-cleaner",
    path: "/tools/text-cleaner/",
    group: "입사지원 상위",
    label: "텍스트 공백 정리",
    short: "줄바꿈, 탭, 이중공백",
    title: "붙여넣기 전에 텍스트 공백과 줄바꿈 정리하기",
    description: "지원서 문항, 민원 사유문, 이메일 본문을 붙여넣기 전에 과한 공백, 탭, 빈 줄을 정리하고 바로 복사할 수 있게 만듭니다.",
    tags: ["공백 정리", "줄바꿈", "복사"],
    situations: ["job", "public", "school", "share"]
  },
  {
    id: "image-inspector",
    path: "/tools/image-inspector/",
    group: "제출 상위",
    label: "이미지 규격 확인",
    short: "픽셀, 용량, 비율",
    title: "사진과 스캔 이미지의 픽셀·용량·비율 확인하기",
    description: "여러 이미지를 선택하면 각 파일의 픽셀 크기, 비율, 용량, 확장자를 바로 확인해 제출 조건과 비교할 수 있습니다.",
    tags: ["픽셀 확인", "이미지 용량", "비율"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "file-list",
    path: "/tools/file-list/",
    group: "제출 보조",
    label: "파일 목록 만들기",
    short: "TXT, CSV 목록",
    title: "제출한 파일 목록을 바로 만들어 보관하기",
    description: "여러 파일의 이름, 확장자, 용량을 TXT와 CSV 목록으로 만들어 제출 전후 확인 기록으로 남깁니다.",
    tags: ["파일 목록", "TXT", "CSV"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "hash-compare",
    path: "/tools/hash-compare/",
    group: "검증",
    label: "파일 해시 비교",
    short: "SHA-256 동일성",
    title: "제출 전후 파일이 같은지 해시로 비교하기",
    description: "두 파일의 SHA-256 값을 계산해 제출 전 보관본과 내려받은 파일이 같은지 확인합니다.",
    tags: ["SHA-256", "파일 비교", "검증"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "data-clean",
    path: "/tools/data-clean/",
    group: "자료 정리",
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
  title: "goatool - 민원·입사지원 파일 변환, PDF, 사진 규격 도구",
  description:
    "goatool은 민원 제출과 입사지원 전에 PDF 합치기, 증명사진 규격 맞추기, 이미지 용량 정리, 파일명 정리, ZIP 점검을 브라우저에서 처리하는 실용 도구입니다."
};

const expertise = {
  "photo-resize": {
    summary: "증명사진 규격 맞추기는 지원서와 응시원서에서 자주 막히는 사진 크기, 비율, 용량 문제를 줄이기 위한 도구입니다. 원본 사진을 브라우저 캔버스에 다시 배치하고 새 JPG 파일로 내려받게 합니다.",
    method: [
      "선택한 이미지를 캔버스에 맞춰 가운데 기준으로 자르거나 여백을 넣어 배치합니다.",
      "3×4, 3.5×4.5, 100×140, 150×210처럼 자주 쓰는 규격을 빠르게 선택합니다.",
      "용량 목표를 넘으면 JPG 품질을 단계적으로 낮춰 제출 가능한 사본을 만듭니다."
    ],
    limits: [
      "기관별 사진 규격은 다를 수 있으므로 접수 화면의 안내를 마지막에 확인해야 합니다.",
      "얼굴 위치, 배경, 최근 촬영 여부 같은 심사 기준은 자동 판정하지 않습니다.",
      "과도한 압축은 식별성을 떨어뜨릴 수 있으므로 결과 이미지를 확대 확인해야 합니다."
    ],
    checklist: ["제출처의 픽셀·용량 조건 확인", "얼굴이 중앙에 있고 잘리지 않았는지 확인", "원본 사진과 제출용 사본을 분리 보관"],
    faq: [
      ["사진이 서버로 올라가나요?", "아니요. 이미지는 브라우저에서 읽고 캔버스로 새 JPG를 만듭니다."],
      ["3.5×4.5cm를 픽셀로 어떻게 보나요?", "웹 제출은 보통 픽셀과 용량 조건을 함께 봅니다. 이 도구는 자주 쓰는 비율과 픽셀 프리셋을 제공합니다."]
    ]
  },
  "pdf-organizer": {
    summary: "PDF 합치기·페이지 뽑기는 민원 증빙, 포트폴리오, 자격증 사본처럼 여러 PDF를 하나로 묶거나 필요한 페이지만 제출해야 할 때 쓰는 브라우저 도구입니다.",
    method: [
      "PDF 파일을 브라우저 메모리에서 읽고 새 PDF 문서에 페이지를 복사합니다.",
      "합치기 모드는 선택한 PDF 순서대로 모든 페이지를 이어 붙입니다.",
      "페이지 뽑기 모드는 입력한 범위만 새 PDF로 만듭니다."
    ],
    limits: [
      "암호가 걸린 PDF나 손상된 PDF는 읽지 못할 수 있습니다.",
      "PDF 용량 자체를 크게 압축하는 기능은 아닙니다.",
      "전자서명·양식 필드가 있는 PDF는 결과 파일을 반드시 다시 열어 확인해야 합니다."
    ],
    checklist: ["PDF 순서 확인", "추출할 페이지 범위 확인", "결과 PDF를 열어 페이지 수와 방향 확인"],
    faq: [
      ["PDF 내용이 외부로 전송되나요?", "아니요. PDF 처리는 브라우저 안에서 진행됩니다."],
      ["PDF 용량도 줄어드나요?", "페이지 재구성 도구이므로 압축 효과는 파일 구조에 따라 다르고 보장하지 않습니다."]
    ]
  },
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
  "filename-cleaner": {
    summary: "파일명 일괄 정리는 제출처 담당자가 파일의 용도와 순서를 바로 이해하도록 이름 규칙을 통일하는 도구입니다. 원본 이름은 변경표에 남기고, 정리된 이름의 ZIP을 만듭니다.",
    method: [
      "특수문자, 과한 공백, 긴 이름을 제출 친화적인 이름으로 바꿉니다.",
      "접두어, 날짜, 번호를 붙여 여러 파일의 순서를 고정합니다.",
      "변경표 TXT를 함께 만들어 원본명과 정리본명을 비교할 수 있게 합니다."
    ],
    limits: [
      "사용자의 로컬 원본 파일명은 직접 변경하지 않습니다.",
      "파일 내용의 적합성이나 제출처 허용 여부는 별도로 확인해야 합니다.",
      "동일한 이름이 생기면 번호를 붙여 ZIP 안에서 충돌을 피합니다."
    ],
    checklist: ["접두어가 제출 목적을 설명하는지 확인", "번호 순서가 읽는 순서와 맞는지 확인", "ZIP을 다시 열어 변경표와 파일 수 비교"],
    faq: [
      ["원본 파일 이름도 바뀌나요?", "아니요. 내려받는 ZIP 안에서만 정리된 이름을 사용합니다."],
      ["한글 파일명도 가능한가요?", "가능합니다. 다만 일부 접수처는 영문·숫자 중심 이름을 더 안정적으로 처리합니다."]
    ]
  },
  "image-to-pdf": {
    summary: "이미지 PDF 변환은 스캔본, 증빙 사진, 캡처 이미지를 하나의 PDF로 묶는 도구입니다. 사진을 다시 페이지에 배치하므로 원본 이미지는 그대로 두고 제출용 PDF를 따로 만들 수 있습니다.",
    method: [
      "이미지를 브라우저에서 읽어 JPG 또는 PNG 데이터로 변환합니다.",
      "A4 또는 이미지 비율 기준으로 PDF 페이지를 만들고 중앙에 배치합니다.",
      "여러 이미지는 선택 순서대로 한 PDF에 들어갑니다."
    ],
    limits: [
      "문자인식 OCR을 하거나 PDF 안 텍스트를 검색 가능하게 만들지는 않습니다.",
      "이미지 해상도가 낮으면 PDF로 바꿔도 글자가 선명해지지 않습니다.",
      "접수처가 이미지 원본을 요구하는 경우 PDF 변환본이 맞지 않을 수 있습니다."
    ],
    checklist: ["이미지 순서 확인", "A4와 원본 비율 중 제출처에 맞는 방식 선택", "결과 PDF 확대 후 글자 판독성 확인"],
    faq: [
      ["여러 장을 한 PDF로 만들 수 있나요?", "네. 선택한 이미지가 순서대로 PDF 페이지가 됩니다."],
      ["WebP도 가능한가요?", "브라우저가 읽을 수 있는 이미지는 캔버스를 거쳐 PDF에 넣습니다."]
    ]
  },
  "zip-inspector": {
    summary: "ZIP 내용 점검은 압축파일을 제출하기 전에 안에 들어간 파일 수와 이름을 빠르게 확인하는 도구입니다. 압축을 서버로 올리지 않고 브라우저에서 목록만 읽습니다.",
    method: [
      "ZIP 내부 파일 목록과 폴더 구조를 브라우저에서 읽습니다.",
      "폴더 깊이, 숨김 파일 가능성, 특수문자 파일명, 큰 파일을 경고로 표시합니다.",
      "파일 목록을 TXT로 내려받아 제출 기록으로 보관할 수 있게 합니다."
    ],
    limits: [
      "암호가 걸린 ZIP이나 손상된 ZIP은 읽지 못할 수 있습니다.",
      "파일 내용까지 열어 검수하지는 않습니다.",
      "기관별 압축 형식 제한은 접수처 안내를 마지막에 확인해야 합니다."
    ],
    checklist: ["ZIP 내부 파일 수 확인", "불필요한 폴더 중첩과 숨김 파일 확인", "변경 전 원본 파일과 목록 비교"],
    faq: [
      ["ZIP을 서버에 올리나요?", "아니요. 브라우저에서 ZIP 목록을 읽고 결과를 표시합니다."],
      ["압축을 풀어 저장하나요?", "아니요. 사용자가 선택한 ZIP을 읽어 목록과 경고만 만듭니다."]
    ]
  },
  "text-counter": {
    summary: "자소서 글자수·바이트 계산은 문장을 대신 써주는 기능이 아니라, 제출 제한에 맞는지 수치만 계산하는 기술 도구입니다. 공백 포함, 공백 제외, 줄 수, UTF-8 바이트를 바로 확인합니다.",
    method: [
      "입력한 텍스트를 브라우저에서 즉시 계산합니다.",
      "공백 포함·제외 글자수와 UTF-8 바이트를 분리해 보여줍니다.",
      "목표 글자수를 선택하면 남은 글자와 초과 여부를 표시합니다."
    ],
    limits: [
      "채용 플랫폼마다 글자수 계산 기준이 다를 수 있습니다.",
      "맞춤법, 문장 품질, 합격 가능성은 평가하지 않습니다.",
      "민감한 자기소개서 원문은 공유하지 말고 로컬에서만 확인하세요."
    ],
    checklist: ["플랫폼의 공백 포함 여부 확인", "복사 붙여넣기 후 줄바꿈이 유지되는지 확인", "최종 제출 화면에서 다시 한 번 글자수 비교"],
    faq: [
      ["AI가 문장을 써주나요?", "아니요. 이 도구는 텍스트 길이와 바이트만 계산합니다."],
      ["한글 바이트는 어떻게 계산하나요?", "UTF-8 기준으로 계산하므로 한글은 보통 여러 바이트로 계산됩니다."]
    ]
  },
  "text-cleaner": {
    summary: "텍스트 공백 정리는 문장을 새로 쓰는 도구가 아니라 붙여넣기 전에 형식만 다듬는 기술 도구입니다. 과한 빈 줄, 탭, 이중 공백을 줄여 제출폼 오류를 줄입니다.",
    method: [
      "입력한 텍스트를 브라우저 안에서만 처리합니다.",
      "탭을 공백으로 바꾸고 반복 공백과 과한 빈 줄을 정리합니다.",
      "정리된 텍스트와 글자수 변화를 함께 보여줍니다."
    ],
    limits: [
      "맞춤법, 문장 품질, 합격 가능성은 평가하지 않습니다.",
      "플랫폼마다 줄바꿈 처리 방식이 다르므로 최종 입력창에서 다시 확인해야 합니다.",
      "개인정보가 든 원문은 외부로 공유하지 않는 것이 안전합니다."
    ],
    checklist: ["원문을 보관한 뒤 정리본 사용", "붙여넣기 후 줄바꿈 확인", "글자수 제한과 함께 확인"],
    faq: [
      ["문장을 바꿔주나요?", "아니요. 공백과 줄바꿈만 정리합니다."],
      ["복사 버튼이 안 되면 어떻게 하나요?", "브라우저 권한 문제일 수 있으므로 결과 영역을 직접 선택해 복사하세요."]
    ]
  },
  "image-inspector": {
    summary: "이미지 규격 확인은 제출 전에 사진과 스캔본의 픽셀 크기, 용량, 비율을 바로 보는 도구입니다. 변환 전에 조건을 먼저 확인해 불필요한 재작업을 줄입니다.",
    method: [
      "이미지를 브라우저에서 읽어 픽셀 크기와 비율을 계산합니다.",
      "용량, 확장자, 1MB 초과 여부 같은 제출 전 확인 포인트를 보여줍니다.",
      "여러 이미지를 한 번에 표로 비교할 수 있게 합니다."
    ],
    limits: [
      "얼굴 위치나 문서 판독성은 자동 판정하지 않습니다.",
      "EXIF의 모든 세부 항목을 읽는 도구는 아닙니다.",
      "제출처의 정확한 규격은 사용자가 접수 페이지에서 확인해야 합니다."
    ],
    checklist: ["픽셀 크기 확인", "용량 제한 확인", "비율과 방향 확인"],
    faq: [
      ["이미지가 변환되나요?", "아니요. 이 도구는 확인 전용입니다."],
      ["여러 장도 되나요?", "네. 여러 이미지를 표로 비교합니다."]
    ]
  },
  "file-list": {
    summary: "파일 목록 만들기는 제출 전후 파일 이름과 용량 기록을 빠르게 남기는 도구입니다. 해시 계산 없이 가볍게 목록만 만들고 싶을 때 사용합니다.",
    method: [
      "선택한 파일의 이름, 확장자, 용량을 표로 정리합니다.",
      "TXT와 CSV 목록을 만들어 제출 기록으로 내려받을 수 있게 합니다.",
      "총 파일 수와 총 용량을 함께 표시합니다."
    ],
    limits: [
      "파일 내용의 적합성은 확인하지 않습니다.",
      "SHA-256 같은 동일성 검증은 파일 해시 비교 도구를 사용해야 합니다.",
      "로컬 원본 파일명은 변경하지 않습니다."
    ],
    checklist: ["제출 지시문과 파일 수 비교", "파일명과 용도 확인", "목록 파일을 제출 기록 폴더에 보관"],
    faq: [
      ["점검표와 뭐가 다른가요?", "파일 준비 점검은 ZIP과 해시까지 만들고, 파일 목록 만들기는 이름과 용량 목록만 빠르게 만듭니다."],
      ["CSV로 받을 수 있나요?", "네. 스프레드시트에서 열 수 있는 CSV 목록을 받을 수 있습니다."]
    ]
  },
  "hash-compare": {
    summary: "파일 해시 비교는 제출 전 보관본과 내려받은 파일이 같은지 확인할 때 쓰는 검증 도구입니다. 파일명을 믿지 않고 SHA-256 값으로 동일성을 봅니다.",
    method: [
      "두 파일을 브라우저에서 읽어 SHA-256 해시를 계산합니다.",
      "계산된 해시가 완전히 같으면 동일 파일로 판단합니다.",
      "다르면 파일 내용이 조금이라도 달라졌다는 신호로 안내합니다."
    ],
    limits: [
      "같은 내용이라도 파일 포맷을 다시 저장하면 해시가 달라질 수 있습니다.",
      "해시 비교는 파일의 적합성이나 문서 진위를 보장하지 않습니다.",
      "대용량 파일은 브라우저 메모리 제한에 걸릴 수 있습니다."
    ],
    checklist: ["비교할 두 파일을 정확히 선택", "파일명보다 해시 일치 여부 확인", "불일치 시 원본과 제출본을 다시 열어 비교"],
    faq: [
      ["해시가 같으면 무엇을 의미하나요?", "파일 바이트가 동일하다는 뜻입니다."],
      ["파일명이 달라도 해시가 같을 수 있나요?", "네. 이름이 달라도 내용이 같으면 해시는 같습니다."]
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
    description: "goatool은 제출 전 파일 준비와 개인정보 정리를 돕는 브라우저 도구 모음입니다.",
    body: [
      ["운영 목적", "goatool은 민원, 입사지원, 학교와 기관 제출 전에 생기는 파일 준비 문제를 줄이기 위한 실용 도구 사이트입니다. 사용자가 파일을 서버에 올리지 않고도 사진 규격, PDF 정리, 파일명, 용량, ZIP 점검을 마칠 수 있게 설계했습니다."],
      ["goatool 신뢰 기준", "goatool의 브랜드 신뢰는 빠른 자동화보다 처리 위치와 한계 고지를 분명히 하는 데서 시작합니다. 각 도구는 브라우저 로컬 처리, 제출 전 검수, 원본 보관, 개인정보 최소화 원칙을 함께 안내합니다."],
      ["전문성 기준", "각 도구는 작동 원리, 한계, 검수 기준을 함께 제공합니다. 결과를 과장하지 않고 사용자가 마지막 판단을 할 수 있게 돕는 것을 우선합니다."],
      ["최종 업데이트", `${lastUpdated} 기준으로 증명사진 규격, PDF 정리, 이미지 PDF 변환, 파일명 정리, 해시 비교, 글자수 계산, CSV·엑셀 정리 기능과 설명을 검수했습니다.`]
    ]
  },
  "/privacy/": {
    title: "개인정보 처리방침",
    metaTitle: "개인정보 처리방침 - goatool",
    description: "goatool은 파일을 서버로 업로드하지 않고 브라우저 안에서 처리하는 것을 우선합니다.",
    body: [
      ["브라우저 처리", "사진 규격 맞추기, PDF 정리, 파일 준비, 이미지 정리, 데이터 정리는 사용자의 브라우저 안에서 실행됩니다. 결과 파일도 브라우저에서 생성됩니다."],
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
  activeTool: toolFromRoute(location.pathname) || "photo-resize",
  lastManifestBlob: null,
  lastZipBlob: null,
  lastImageZipBlob: null,
  lastPhotoBlob: null,
  lastPhotoName: null,
  lastPhotoPreviewUrl: null,
  lastPdfBlob: null,
  lastPdfName: null,
  lastRenameZipBlob: null,
  lastRenameMapBlob: null,
  lastImagePdfBlob: null,
  lastZipReportBlob: null,
  lastCleanText: "",
  lastFileListTxtBlob: null,
  lastFileListCsvBlob: null,
  lastHashReportBlob: null,
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
  const headerTools = tools.slice(0, 5);
  const publicTools = tools.filter((tool) => tool.situations.includes("public")).slice(0, 5);
  const jobTools = tools.filter((tool) => tool.situations.includes("job")).slice(0, 5);

  app.innerHTML = `
    ${guidePage ? `<div class="read-progress" aria-hidden="true"><span></span></div>` : ""}
    <a class="skip-link" href="#mainContent">본문 바로가기</a>
    <header class="site-header">
      <div class="header-main">
        <a class="brand" href="/" data-link aria-label="goatool 홈">
          <span class="brand-mark" aria-hidden="true">${documentIcon()}</span>
          <span>
            <strong>goatool</strong>
            <small>브라우저 제출 도구</small>
          </span>
        </a>
        <label class="header-search">
          <span class="visually-hidden">도구 검색</span>
          <span aria-hidden="true">${searchIcon()}</span>
          <input id="siteSearch" type="search" value="${escapeAttr(state.query)}" placeholder="파일명, 이미지, CSV, 제출 준비 검색..." />
        </label>
        <nav class="header-nav" aria-label="주요 도구">
          ${headerTools
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
          <a class="nav-sibling" href="https://policyfundpedia.com/" target="_blank" rel="noopener">
            정책자금 백과
          </a>
        </nav>
      </div>
    </header>

    <main class="page-shell" id="mainContent" tabindex="-1">
      <section class="content">
        ${infoPage ? renderInfoPage(infoPage) : ""}
        ${isGuideIndex ? renderGuideIndexPage() : ""}
        ${guidePage ? renderGuidePage(guidePage) : ""}
        <section class="workspace-intro ${isReferencePage ? "is-hidden" : ""}" aria-labelledby="workspaceTitle">
          <div class="intro-copy">
            <h1 id="workspaceTitle">민원·입사지원 파일 막힘을 바로 해결하세요</h1>
            <p>사진 규격, PDF 합치기, 이미지 용량, 파일명, ZIP 점검처럼 제출 직전에 가장 자주 막히는 작업을 위에 배치했습니다.</p>
            <div class="intro-points" aria-label="goatool 처리 기준">
              <span>브라우저 처리</span>
              <span>정리본 다운로드</span>
              <span>제출 전 검수</span>
            </div>
            <a class="intro-sibling-link" href="https://policyfundpedia.com/" target="_blank" rel="noopener">
              <span>정책자금도 찾아야 한다면</span>
              <strong>정책자금 백과에서 지원제도 먼저 확인</strong>
            </a>
          </div>
          <nav class="priority-board" aria-label="많이 찾는 제출 작업">
            <h2>많이 찾는 작업</h2>
            ${tools
              .slice(0, 6)
              .map(
                (tool) => `
                  ${renderPriorityLink(tool, selected, isReferencePage)}
                `
              )
              .join("")}
          </nav>
        </section>
        <section class="priority-lanes ${isReferencePage ? "is-hidden" : ""}" aria-label="상황별 상위 도구">
          <article class="lane-card">
          <div>
            <h2>민원 제출 상위</h2>
              <p>PDF, ZIP, 이미지, 파일명, 증빙 묶음부터 먼저 처리합니다.</p>
            </div>
            <div class="lane-links">
              ${publicTools.map((tool) => renderLaneLink(tool, selected, isReferencePage)).join("")}
            </div>
          </article>
          <article class="lane-card accent">
            <div>
              <h2>입사지원 상위</h2>
              <p>사진 규격, 포트폴리오 ZIP, 자소서 글자수와 공백을 빠르게 확인합니다.</p>
            </div>
            <div class="lane-links">
              ${jobTools.map((tool) => renderLaneLink(tool, selected, isReferencePage)).join("")}
            </div>
          </article>
        </section>
        ${isReferencePage ? "" : renderSiblingBridge()}
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

        <section class="tool-workbench ${isReferencePage ? "is-hidden" : ""}" id="toolWorkbench" aria-labelledby="toolTitle">
          <div class="tool-heading">
            <div>
              <p class="section-label">${selected.group}</p>
              <h2 id="toolTitle">${selected.title}</h2>
              <p>${selected.description}</p>
            </div>
            <a class="tool-url" href="${selected.path}" data-link>${baseDomain}${selected.path}</a>
          </div>
          <div class="flow-steps" aria-label="도구 사용 순서">
            <span><b>1</b> 파일 또는 텍스트 선택</span>
            <span><b>2</b> 기본값 그대로 실행</span>
            <span><b>3</b> 결과 확인 후 받기</span>
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
        ${renderSiblingSidePanel()}
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

        ${renderRecentToolsPanel()}

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
        <p>민원 제출, 입사지원, 학교·기관 첨부파일을 브라우저에서 정리하는 실용 도구 모음입니다.</p>
      </div>
      <nav aria-label="하단 링크">
        <a href="/about/" data-link>소개</a>
        <a href="/guides/" data-link>전문 가이드</a>
        <a href="https://policyfundpedia.com/" target="_blank" rel="noopener">정책자금 백과</a>
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

function renderSiblingBridge() {
  return `
    <section class="sibling-bridge" aria-labelledby="siblingBridgeTitle">
      <div class="sibling-copy">
        <span class="bridge-route">policyfundpedia.com → goatool.com</span>
        <h2 id="siblingBridgeTitle">정책자금 찾고, 제출 파일은 바로 정리하세요</h2>
        <p>지원금·대출·고용장려금 정보를 정책자금 백과에서 먼저 고르고, goatool에서 PDF·사진·ZIP 제출본을 이어서 마무리하는 흐름입니다.</p>
        <div class="bridge-points" aria-label="연결 흐름">
          <span>지원제도 탐색</span>
          <span>공식기관 확인</span>
          <span>제출서류 준비</span>
        </div>
      </div>
      <div class="bridge-panel" aria-hidden="true">
        <div class="bridge-node">정책자금 백과</div>
        <div class="bridge-line"><span></span></div>
        <div class="bridge-node strong">goatool</div>
      </div>
      <div class="bridge-actions">
        <a class="bridge-button" href="https://policyfundpedia.com/" target="_blank" rel="noopener">정책자금 백과 열기</a>
        <a class="bridge-text-link" href="#toolWorkbench">서류 도구 계속 쓰기</a>
      </div>
    </section>
  `;
}

function renderSiblingSidePanel() {
  return `
    <section class="side-panel sibling-side">
      <span>policyfundpedia.com</span>
      <h2>지원제도도 같이 확인</h2>
      <p>정책자금 백과에서 맞는 자금을 고르고, goatool에서 제출 파일을 바로 정리하세요.</p>
      <a href="https://policyfundpedia.com/" target="_blank" rel="noopener">
        정책자금 백과로 이동
        ${arrowIcon()}
      </a>
    </section>
  `;
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

function renderPriorityLink(tool, selected, isReferencePage) {
  const active = !isReferencePage && tool.id === selected.id;
  return `
    <a href="${tool.path}" data-tool="${tool.id}" data-link class="priority-link ${active ? "on" : ""}" ${active ? 'aria-current="page"' : ""}>
      <span>${tool.group}</span>
      <strong>${tool.label}</strong>
      <em>${tool.short}</em>
    </a>
  `;
}

function renderLaneLink(tool, selected, isReferencePage) {
  const active = !isReferencePage && tool.id === selected.id;
  return `
    <a href="${tool.path}" data-tool="${tool.id}" data-link class="${active ? "on" : ""}" ${active ? 'aria-current="page"' : ""}>
      <strong>${tool.label}</strong>
      <span>${tool.short}</span>
    </a>
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
  if (id === "photo-resize") return renderPhotoResizeTool();
  if (id === "pdf-organizer") return renderPdfOrganizerTool();
  if (id === "image-privacy") return renderImagePrivacyTool();
  if (id === "filename-cleaner") return renderFilenameCleanerTool();
  if (id === "image-to-pdf") return renderImageToPdfTool();
  if (id === "zip-inspector") return renderZipInspectorTool();
  if (id === "text-counter") return renderTextCounterTool();
  if (id === "text-cleaner") return renderTextCleanerTool();
  if (id === "image-inspector") return renderImageInspectorTool();
  if (id === "file-list") return renderFileListTool();
  if (id === "hash-compare") return renderHashCompareTool();
  if (id === "data-clean") return renderDataCleanTool();
  return renderFileReadyTool();
}

function renderPhotoResizeTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="photoResizeForm" novalidate>
        <label class="field">
          <span>사진 선택</span>
          <input id="photoInput" class="file-native" type="file" accept="image/*" aria-label="규격을 맞출 사진 선택" />
          <span class="file-picker">${imageIcon()} 사진 고르기</span>
          <em id="photoCount" class="file-count">증명사진 또는 얼굴이 보이는 이미지를 선택하세요</em>
        </label>
        <label class="field">
          <span>자주 쓰는 규격</span>
          <select id="photoPreset">
            <option value="100x140">사람인 권장 100×140px</option>
            <option value="150x210">잡코리아 기준 150×210px</option>
            <option value="300x400">3×4 비율 300×400px</option>
            <option value="350x450" selected>3.5×4.5 비율 350×450px</option>
            <option value="413x531">여권형 413×531px</option>
            <option value="600x800">고해상도 600×800px</option>
          </select>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 사진 설정 변경</summary>
          <div class="field two-col">
            <label>
              <span>배치 방식</span>
              <select id="photoFit">
                <option value="cover" selected>꽉 채우기</option>
                <option value="contain">여백 유지</option>
              </select>
            </label>
            <label>
              <span>용량 목표</span>
              <select id="photoMaxKb">
                <option value="0">제한 없음</option>
                <option value="50">50KB 이하</option>
                <option value="100">100KB 이하</option>
                <option value="500">500KB 이하</option>
                <option value="1024" selected>1MB 이하</option>
              </select>
            </label>
          </div>
          <label class="range-field">
            <span>JPG 품질 <b id="photoQualityLabel">88</b></span>
            <input id="photoQuality" type="range" min="45" max="95" value="88" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${imageIcon()} 사진 만들기</button>
          <button class="ghost-button" type="button" id="downloadPhoto" disabled>${downloadIcon()} JPG</button>
        </div>
        <p class="helper-text">결과 이미지는 접수 전에 얼굴 위치, 배경, 식별 가능 여부를 직접 확대 확인하세요.</p>
      </form>
      <div class="result-panel" id="photoResizeResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">사진을 선택하면 규격, 용량, 비율이 맞는 제출용 JPG를 만듭니다.</p>
      </div>
    </div>
  `;
}

function renderPdfOrganizerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="pdfOrganizerForm" novalidate>
        <label class="field">
          <span>PDF 파일 선택</span>
          <input id="pdfInput" class="file-native" type="file" accept="application/pdf,.pdf" multiple aria-label="정리할 PDF 선택" />
          <span class="file-picker">${pdfIcon()} PDF 고르기</span>
          <em id="pdfCount" class="file-count">합칠 PDF 또는 페이지를 뽑을 PDF를 선택하세요</em>
        </label>
        <label class="field">
          <span>작업 방식</span>
          <select id="pdfMode">
            <option value="merge" selected>선택한 PDF 순서대로 합치기</option>
            <option value="extract">첫 번째 PDF에서 페이지만 뽑기</option>
          </select>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 페이지·파일명 변경</summary>
          <label class="field" id="pdfRangeField">
            <span>뽑을 페이지 범위</span>
            <input id="pdfRanges" type="text" value="1" placeholder="예: 1-3, 5, 8-10" />
          </label>
          <label class="field">
            <span>결과 파일명</span>
            <input id="pdfOutputName" type="text" value="goatool_pdf_ready" maxlength="80" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${pdfIcon()} PDF 만들기</button>
          <button class="ghost-button" type="button" id="downloadPdf" disabled>${downloadIcon()} PDF</button>
        </div>
        <p class="helper-text">암호가 없는 일반 PDF 기준입니다. 전자서명이나 양식 PDF는 결과 파일을 반드시 다시 열어 확인하세요.</p>
      </form>
      <div class="result-panel" id="pdfOrganizerResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">PDF를 선택하면 합치기 또는 페이지 추출 결과가 표시됩니다.</p>
      </div>
    </div>
  `;
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
        <details class="advanced-options">
          <summary>필요할 때만 이미지 설정 변경</summary>
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
        </details>
        <div class="control-row single-action">
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

function renderFilenameCleanerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="filenameCleanerForm" novalidate>
        <label class="field">
          <span>정리할 파일 선택</span>
          <input id="renameInput" class="file-native" type="file" multiple aria-label="파일명을 정리할 파일 선택" />
          <span class="file-picker">${renameIcon()} 파일 고르기</span>
          <em id="renameCount" class="file-count">선택된 파일 없음</em>
        </label>
        <div class="field two-col">
          <label>
            <span>접두어</span>
            <input id="renamePrefix" type="text" value="제출서류" maxlength="40" autocomplete="off" />
          </label>
          <label>
            <span>날짜</span>
            <input id="renameDate" type="text" value="${dateStamp()}" maxlength="12" autocomplete="off" />
          </label>
        </div>
        <div class="check-grid">
          <label><input type="checkbox" id="renameNumber" checked /> 앞에 번호 붙이기</label>
          <label><input type="checkbox" id="renameDateCheck" checked /> 날짜 붙이기</label>
          <label><input type="checkbox" id="renameLowerExt" checked /> 확장자 소문자</label>
          <label><input type="checkbox" id="renameKeepKorean" checked /> 한글 유지</label>
        </div>
        <div class="control-row">
          <button class="primary-button" type="submit">${renameIcon()} 변경표 만들기</button>
          <button class="ghost-button" type="button" id="downloadRenameMap" disabled>${downloadIcon()} 변경표</button>
          <button class="ghost-button" type="button" id="downloadRenameZip" disabled>${packageIcon()} ZIP</button>
        </div>
        <p class="helper-text">원본 파일명은 바꾸지 않고, 정리된 이름의 복사본 ZIP과 변경표를 만듭니다.</p>
      </form>
      <div class="result-panel" id="filenameCleanerResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">파일을 선택하면 제출용 이름 규칙과 충돌 여부를 확인합니다.</p>
      </div>
    </div>
  `;
}

function renderImageToPdfTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="imageToPdfForm" novalidate>
        <label class="field">
          <span>이미지 선택</span>
          <input id="imagePdfInput" class="file-native" type="file" accept="image/*" multiple aria-label="PDF로 변환할 이미지 선택" />
          <span class="file-picker">${pdfIcon()} 이미지 고르기</span>
          <em id="imagePdfCount" class="file-count">선택된 이미지 없음</em>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 PDF 설정 변경</summary>
          <div class="field two-col">
            <label>
              <span>페이지 크기</span>
              <select id="imagePdfPage">
                <option value="a4" selected>A4 세로</option>
                <option value="original">이미지 비율</option>
              </select>
            </label>
            <label>
              <span>여백</span>
              <select id="imagePdfMargin">
                <option value="18">좁게</option>
                <option value="36" selected>보통</option>
                <option value="54">넓게</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>결과 파일명</span>
            <input id="imagePdfName" type="text" value="goatool_images" maxlength="80" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${pdfIcon()} PDF 변환</button>
          <button class="ghost-button" type="button" id="downloadImagePdf" disabled>${downloadIcon()} PDF</button>
        </div>
        <p class="helper-text">스캔 이미지와 증빙 캡처를 한 파일로 묶을 때 사용하세요. OCR이나 문자인식은 하지 않습니다.</p>
      </form>
      <div class="result-panel" id="imageToPdfResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">이미지를 선택하면 페이지별 PDF로 변환합니다.</p>
      </div>
    </div>
  `;
}

function renderZipInspectorTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="zipInspectorForm" novalidate>
        <label class="field">
          <span>ZIP 파일 선택</span>
          <input id="zipInspectInput" class="file-native" type="file" accept=".zip,application/zip" aria-label="점검할 ZIP 파일 선택" />
          <span class="file-picker">${packageIcon()} ZIP 고르기</span>
          <em id="zipInspectCount" class="file-count">제출 직전 ZIP 파일을 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 바로 점검</button>
          <button class="ghost-button" type="button" id="downloadZipReport" disabled>${downloadIcon()} 목록 TXT</button>
        </div>
        <p class="helper-text">기본값 그대로 선택하고 점검하면 됩니다. 압축파일 안의 목록만 읽고 서버로 올리지 않습니다.</p>
      </form>
      <div class="result-panel" id="zipInspectorResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">ZIP을 선택하면 내부 파일 수, 폴더 깊이, 파일명 위험 신호를 바로 보여줍니다.</p>
      </div>
    </div>
  `;
}

function renderTextCounterTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="textCounterForm" novalidate>
        <label class="field">
          <span>제한 기준</span>
          <select id="textTarget">
            <option value="500">500자</option>
            <option value="800">800자</option>
            <option value="1000" selected>1000자</option>
            <option value="1500">1500자</option>
            <option value="2000">2000자</option>
            <option value="0">제한 없음</option>
          </select>
        </label>
        <label class="field">
          <span>텍스트 입력</span>
          <textarea id="counterText" rows="12" maxlength="${LIMITS.textChars}" placeholder="자기소개서, 지원동기, 민원 사유문을 붙여넣으세요."></textarea>
        </label>
        <div class="control-row">
          <button class="ghost-button" type="button" id="clearCounter">${checkIcon()} 비우기</button>
        </div>
        <p class="helper-text">붙여넣는 즉시 계산됩니다. 문장을 생성하지 않고 길이와 바이트만 보여줍니다.</p>
      </form>
      <div class="result-panel" id="textCounterResult" role="status" aria-live="polite" aria-atomic="false">
        ${renderTextCounterResult("", 1000)}
      </div>
    </div>
  `;
}

function renderTextCleanerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="textCleanerForm" novalidate>
        <label class="field">
          <span>텍스트 붙여넣기</span>
          <textarea id="dirtyText" rows="12" maxlength="${LIMITS.textChars}" placeholder="지원서 문항, 민원 사유문, 이메일 본문을 붙여넣으세요."></textarea>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 정리 방식 변경</summary>
          <label class="field">
            <span>정리 방식</span>
            <select id="textCleanMode">
              <option value="form" selected>제출폼 기본 정리</option>
              <option value="paragraph">문단 유지</option>
              <option value="single">한 줄로 정리</option>
            </select>
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${textIcon()} 바로 정리</button>
          <button class="ghost-button" type="button" id="copyCleanText" disabled>${downloadIcon()} 복사</button>
        </div>
        <p class="helper-text">문장을 바꾸지 않습니다. 공백, 탭, 과한 빈 줄만 정리합니다.</p>
      </form>
      <div class="result-panel" id="textCleanerResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">텍스트를 붙여넣고 바로 정리를 누르면 복사 가능한 정리본을 만듭니다.</p>
      </div>
    </div>
  `;
}

function renderImageInspectorTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="imageInspectorForm" novalidate>
        <label class="field">
          <span>이미지 선택</span>
          <input id="imageInspectInput" class="file-native" type="file" accept="image/*" multiple aria-label="규격을 확인할 이미지 선택" />
          <span class="file-picker">${imageIcon()} 이미지 고르기</span>
          <em id="imageInspectCount" class="file-count">사진, 스캔본, 캡처 이미지를 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 규격 확인</button>
        </div>
        <p class="helper-text">변환 전 확인 전용입니다. 픽셀, 비율, 용량을 보고 맞지 않으면 사진 규격 도구나 이미지 정리 도구로 이동하세요.</p>
      </form>
      <div class="result-panel" id="imageInspectorResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">이미지를 선택하면 픽셀 크기, 비율, 용량을 표로 보여줍니다.</p>
      </div>
    </div>
  `;
}

function renderFileListTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="fileListForm" novalidate>
        <label class="field">
          <span>파일 선택</span>
          <input id="fileListInput" class="file-native" type="file" multiple aria-label="목록으로 만들 파일 선택" />
          <span class="file-picker">${tableIcon()} 파일 고르기</span>
          <em id="fileListCount" class="file-count">목록으로 남길 파일을 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${tableIcon()} 목록 만들기</button>
          <button class="ghost-button" type="button" id="downloadFileListTxt" disabled>${downloadIcon()} TXT</button>
          <button class="ghost-button" type="button" id="downloadFileListCsv" disabled>${downloadIcon()} CSV</button>
        </div>
        <p class="helper-text">가볍게 파일 목록만 남기는 도구입니다. ZIP과 해시까지 필요하면 제출 파일 점검 도구를 사용하세요.</p>
      </form>
      <div class="result-panel" id="fileListResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">파일을 선택하면 이름, 확장자, 용량 목록을 바로 만듭니다.</p>
      </div>
    </div>
  `;
}

function renderHashCompareTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="hashCompareForm" novalidate>
        <label class="field">
          <span>첫 번째 파일</span>
          <input id="hashFileA" class="file-native" type="file" aria-label="비교할 첫 번째 파일 선택" />
          <span class="file-picker">${shieldIcon()} A 파일 고르기</span>
          <em id="hashFileAName" class="file-count">선택된 파일 없음</em>
        </label>
        <label class="field">
          <span>두 번째 파일</span>
          <input id="hashFileB" class="file-native" type="file" aria-label="비교할 두 번째 파일 선택" />
          <span class="file-picker">${shieldIcon()} B 파일 고르기</span>
          <em id="hashFileBName" class="file-count">선택된 파일 없음</em>
        </label>
        <div class="control-row">
          <button class="primary-button" type="submit">${shieldIcon()} 해시 비교</button>
          <button class="ghost-button" type="button" id="downloadHashReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">SHA-256이 완전히 같으면 두 파일의 바이트가 동일합니다. 파일명은 달라도 해시가 같을 수 있습니다.</p>
      </form>
      <div class="result-panel" id="hashCompareResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">두 파일을 선택하면 SHA-256 해시와 동일 여부를 보여줍니다.</p>
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
      recordToolUse(id);
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
      if (href === "/") state.activeTool = "photo-resize";
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
  if (id === "photo-resize") {
    bindPhotoResizeEvents();
    return;
  }
  if (id === "pdf-organizer") {
    bindPdfOrganizerEvents();
    return;
  }
  if (id === "image-privacy") {
    bindImagePrivacyEvents();
    return;
  }
  if (id === "filename-cleaner") {
    bindFilenameCleanerEvents();
    return;
  }
  if (id === "image-to-pdf") {
    bindImageToPdfEvents();
    return;
  }
  if (id === "zip-inspector") {
    bindZipInspectorEvents();
    return;
  }
  if (id === "text-counter") {
    bindTextCounterEvents();
    return;
  }
  if (id === "text-cleaner") {
    bindTextCleanerEvents();
    return;
  }
  if (id === "image-inspector") {
    bindImageInspectorEvents();
    return;
  }
  if (id === "file-list") {
    bindFileListEvents();
    return;
  }
  if (id === "hash-compare") {
    bindHashCompareEvents();
    return;
  }
  if (id === "data-clean") {
    bindDataCleanEvents();
    return;
  }
  bindFileReadyEvents();
}

function bindPhotoResizeEvents() {
  const form = document.querySelector("#photoResizeForm");
  const input = document.querySelector("#photoInput");
  const count = document.querySelector("#photoCount");
  const quality = document.querySelector("#photoQuality");
  const qualityLabel = document.querySelector("#photoQualityLabel");
  const downloadButton = document.querySelector("#downloadPhoto");

  quality?.addEventListener("input", () => {
    qualityLabel.textContent = quality.value;
  });

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "증명사진 또는 얼굴이 보이는 이미지를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#photoResizeResult");
    downloadButton.disabled = true;
    if (!file) {
      showResultMessage(result, "규격을 맞출 사진을 먼저 선택하세요.", "warn");
      return;
    }
    if (!file.type.startsWith("image/") && !["jpg", "jpeg", "png", "webp"].includes(extensionOf(file.name))) {
      showResultMessage(result, "JPG, PNG, WebP 같은 일반 이미지 파일로 다시 시도하세요.", "warn");
      return;
    }

    setResultBusy(result, true, "사진 규격과 용량을 맞추는 중입니다...");
    try {
      const preset = parseSize(document.querySelector("#photoPreset")?.value || "350x450");
      const output = await makePhotoOutput(file, {
        ...preset,
        fit: document.querySelector("#photoFit")?.value || "cover",
        maxBytes: Number(document.querySelector("#photoMaxKb")?.value || 0) * 1024,
        quality: Number(document.querySelector("#photoQuality")?.value || 88) / 100
      });
      if (state.lastPhotoPreviewUrl) URL.revokeObjectURL(state.lastPhotoPreviewUrl);
      state.lastPhotoBlob = output.blob;
      state.lastPhotoName = output.name;
      state.lastPhotoPreviewUrl = URL.createObjectURL(output.blob);
      downloadButton.disabled = false;
      result.innerHTML = renderPhotoResult(output, state.lastPhotoPreviewUrl);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "사진을 처리하지 못했습니다. 손상되지 않은 이미지인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastPhotoBlob && state.lastPhotoName) downloadBlob(state.lastPhotoBlob, state.lastPhotoName);
  });
}

async function makePhotoOutput(file, options) {
  const source = await loadImageSource(file);
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const imageRatio = source.width / source.height;
  const targetRatio = options.width / options.height;
  let sx = 0;
  let sy = 0;
  let sw = source.width;
  let sh = source.height;
  let dx = 0;
  let dy = 0;
  let dw = options.width;
  let dh = options.height;

  if (options.fit === "contain") {
    const scale = Math.min(options.width / source.width, options.height / source.height);
    dw = Math.round(source.width * scale);
    dh = Math.round(source.height * scale);
    dx = Math.round((options.width - dw) / 2);
    dy = Math.round((options.height - dh) / 2);
  } else if (imageRatio > targetRatio) {
    sw = Math.round(source.height * targetRatio);
    sx = Math.round((source.width - sw) / 2);
  } else {
    sh = Math.round(source.width / targetRatio);
    sy = Math.round((source.height - sh) / 2);
  }

  context.drawImage(source.image, sx, sy, sw, sh, dx, dy, dw, dh);
  source.close?.();
  const exportResult = await exportJpegWithLimit(canvas, options.quality, options.maxBytes);
  const name = `${removeExtension(safeBaseName(file.name))}_${options.width}x${options.height}.jpg`;
  return {
    originalName: file.name,
    name,
    width: options.width,
    height: options.height,
    originalSize: file.size,
    quality: exportResult.quality,
    targetBytes: options.maxBytes,
    blob: exportResult.blob
  };
}

async function exportJpegWithLimit(canvas, quality, maxBytes) {
  let current = quality;
  let blob = await canvasToBlob(canvas, "image/jpeg", current);
  while (maxBytes > 0 && blob.size > maxBytes && current > 0.46) {
    current = Math.max(0.45, current - 0.08);
    blob = await canvasToBlob(canvas, "image/jpeg", current);
  }
  return { blob, quality: current };
}

function renderPhotoResult(output, previewUrl) {
  const fitsLimit = !output.targetBytes || output.blob.size <= output.targetBytes;
  return `
    <div class="stat-grid">
      <div><span>규격</span><strong>${output.width}×${output.height}</strong></div>
      <div><span>결과 용량</span><strong>${formatBytes(output.blob.size)}</strong></div>
      <div><span>상태</span><strong class="${fitsLimit ? "status-ok" : "status-warn"}">${fitsLimit ? "준비 가능" : "용량 확인"}</strong></div>
    </div>
    <div class="preview-layout">
      <figure class="photo-preview">
        <img src="${previewUrl}" alt="규격 변환된 제출용 사진 미리보기" />
      </figure>
      <div class="result-block">
        <h3>사진 처리 결과</h3>
        <p class="ok-line">원본 ${escapeHtml(output.originalName)}을 새 JPG로 다시 만들었습니다. JPG 품질은 ${Math.round(output.quality * 100)}입니다.</p>
        ${fitsLimit ? "" : `<p class="warning-line">선택한 용량 목표를 넘었습니다. 더 작은 규격이나 낮은 품질을 선택하세요.</p>`}
      </div>
    </div>
  `;
}

function bindPdfOrganizerEvents() {
  const form = document.querySelector("#pdfOrganizerForm");
  const input = document.querySelector("#pdfInput");
  const count = document.querySelector("#pdfCount");
  const mode = document.querySelector("#pdfMode");
  const rangeField = document.querySelector("#pdfRangeField");
  const advanced = rangeField?.closest("details");
  const downloadButton = document.querySelector("#downloadPdf");

  const syncMode = () => {
    const isExtract = mode?.value === "extract";
    if (rangeField) rangeField.hidden = !isExtract;
    if (advanced && isExtract) advanced.open = true;
  };
  syncMode();
  mode?.addEventListener("change", syncMode);

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 PDF 선택됨` : "합칠 PDF 또는 페이지를 뽑을 PDF를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#pdfOrganizerResult");
    downloadButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "PDF 파일을 먼저 선택하세요.", "warn");
      return;
    }
    if (files.length > LIMITS.pdfCount) {
      showResultMessage(result, `한 번에 ${LIMITS.pdfCount}개 이하의 PDF만 처리하세요.`, "warn");
      return;
    }
    const invalid = files.find((file) => extensionOf(file.name) !== "pdf");
    if (invalid) {
      showResultMessage(result, `${invalid.name}은 PDF 파일로 인식되지 않습니다.`, "warn");
      return;
    }

    setResultBusy(result, true, "PDF 페이지를 정리하는 중입니다...");
    try {
      const modeValue = mode?.value || "merge";
      const output = modeValue === "extract" ? await extractPdfPages(files[0], document.querySelector("#pdfRanges")?.value || "1") : await mergePdfs(files);
      const baseName = safeBaseName(document.querySelector("#pdfOutputName")?.value || "goatool_pdf_ready");
      state.lastPdfBlob = output.blob;
      state.lastPdfName = `${baseName}.pdf`;
      downloadButton.disabled = false;
      result.innerHTML = renderPdfResult(output, modeValue);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "PDF를 처리하지 못했습니다. 암호가 없는 일반 PDF인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastPdfBlob && state.lastPdfName) downloadBlob(state.lastPdfBlob, state.lastPdfName);
  });
}

async function mergePdfs(files) {
  const { PDFDocument } = await loadPdfLib();
  const output = await PDFDocument.create();
  const summary = [];
  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
    const copied = await output.copyPages(source, source.getPageIndices());
    copied.forEach((page) => output.addPage(page));
    summary.push({ name: file.name, pages: source.getPageCount(), size: file.size });
  }
  const bytes = await output.save();
  return { blob: new Blob([bytes], { type: "application/pdf" }), pageCount: output.getPageCount(), summary };
}

async function extractPdfPages(file, ranges) {
  const { PDFDocument } = await loadPdfLib();
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  const pageIndices = parsePageRanges(ranges, source.getPageCount());
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, pageIndices);
  copied.forEach((page) => output.addPage(page));
  const bytes = await output.save();
  return {
    blob: new Blob([bytes], { type: "application/pdf" }),
    pageCount: output.getPageCount(),
    summary: [{ name: file.name, pages: source.getPageCount(), size: file.size, extracted: pageIndices.map((index) => index + 1).join(", ") }]
  };
}

function parsePageRanges(value, maxPage) {
  const parts = String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) throw new Error("페이지 범위를 입력하세요. 예: 1-3, 5");
  const pages = [];
  parts.forEach((part) => {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`페이지 범위 형식이 맞지 않습니다: ${part}`);
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > maxPage) {
      throw new Error(`페이지 범위가 PDF 전체 ${maxPage}페이지를 벗어났습니다: ${part}`);
    }
    for (let page = start; page <= end; page += 1) pages.push(page - 1);
  });
  return [...new Set(pages)];
}

function renderPdfResult(output, mode) {
  return `
    <div class="stat-grid">
      <div><span>작업</span><strong>${mode === "extract" ? "페이지 추출" : "PDF 합치기"}</strong></div>
      <div><span>결과 페이지</span><strong>${output.pageCount}</strong></div>
      <div><span>결과 용량</span><strong>${formatBytes(output.blob.size)}</strong></div>
    </div>
    <div class="result-block">
      <h3>PDF 처리 결과</h3>
      <p class="ok-line">결과 PDF를 만들었습니다. 제출 전에 열어서 페이지 순서와 방향을 확인하세요.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>원본 PDF</th><th>원본 페이지</th><th>용량</th><th>추출 페이지</th></tr></thead>
        <tbody>
          ${output.summary
            .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.pages}</td><td>${formatBytes(item.size)}</td><td>${escapeHtml(item.extracted || "전체")}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
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

function bindFilenameCleanerEvents() {
  const form = document.querySelector("#filenameCleanerForm");
  const input = document.querySelector("#renameInput");
  const count = document.querySelector("#renameCount");
  const mapButton = document.querySelector("#downloadRenameMap");
  const zipButton = document.querySelector("#downloadRenameZip");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 파일 선택됨` : "선택된 파일 없음";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#filenameCleanerResult");
    mapButton.disabled = true;
    zipButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "파일명을 정리할 파일을 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.fileCount, allowImagesOnly: false });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "파일명을 정리하고 ZIP을 만드는 중입니다...");
    try {
      const options = {
        prefix: document.querySelector("#renamePrefix")?.value || "제출서류",
        date: document.querySelector("#renameDate")?.value || dateStamp(),
        number: document.querySelector("#renameNumber")?.checked,
        addDate: document.querySelector("#renameDateCheck")?.checked,
        lowerExt: document.querySelector("#renameLowerExt")?.checked,
        keepKorean: document.querySelector("#renameKeepKorean")?.checked
      };
      const items = makeRenamePlan(files, options);
      const zip = new JSZip();
      items.forEach((item) => zip.file(item.newName, item.file));
      const mapText = makeRenameMap(items);
      state.lastRenameMapBlob = new Blob([mapText], { type: "text/plain;charset=utf-8" });
      state.lastRenameZipBlob = await zip.generateAsync({ type: "blob" });
      mapButton.disabled = false;
      zipButton.disabled = false;
      result.innerHTML = renderRenameResult(items);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "파일명 정리 중 문제가 생겼습니다. 파일 수와 용량을 줄여 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  mapButton?.addEventListener("click", () => {
    if (state.lastRenameMapBlob) downloadBlob(state.lastRenameMapBlob, "goatool-rename-map.txt");
  });

  zipButton?.addEventListener("click", () => {
    if (state.lastRenameZipBlob) downloadBlob(state.lastRenameZipBlob, "goatool-renamed-files.zip");
  });
}

function makeRenamePlan(files, options) {
  const used = new Map();
  return files.map((file, index) => {
    const ext = extensionOf(file.name);
    const cleanExt = options.lowerExt ? ext.toLowerCase() : ext;
    const originalStem = removeExtension(file.name);
    const stem = sanitizeNamePart(originalStem, options.keepKorean);
    const parts = [
      options.prefix ? sanitizeNamePart(options.prefix, options.keepKorean) : "",
      options.addDate ? sanitizeNamePart(options.date, false) : "",
      options.number ? String(index + 1).padStart(2, "0") : "",
      stem || "file"
    ].filter(Boolean);
    let base = parts.join("_").slice(0, 96);
    let name = cleanExt ? `${base}.${cleanExt}` : base;
    let duplicateIndex = 2;
    while (used.has(name.toLowerCase())) {
      base = `${parts.join("_").slice(0, 90)}_${duplicateIndex}`;
      name = cleanExt ? `${base}.${cleanExt}` : base;
      duplicateIndex += 1;
    }
    used.set(name.toLowerCase(), true);
    return { file, originalName: file.name, newName: name, size: file.size, extension: cleanExt };
  });
}

function sanitizeNamePart(value, keepKorean = true) {
  const pattern = keepKorean ? /[^0-9A-Za-z가-힣._-]+/g : /[^0-9A-Za-z._-]+/g;
  return String(value || "")
    .trim()
    .replace(pattern, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function makeRenameMap(items) {
  return [
    "goatool 파일명 변경표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `파일 수: ${items.length}`,
    "",
    ...items.map((item, index) => `${index + 1}. ${item.originalName} -> ${item.newName} (${formatBytes(item.size)})`)
  ].join("\n");
}

function renderRenameResult(items) {
  const changed = items.filter((item) => item.originalName !== item.newName).length;
  return `
    <div class="stat-grid">
      <div><span>파일 수</span><strong>${items.length}</strong></div>
      <div><span>변경된 이름</span><strong>${changed}</strong></div>
      <div><span>총 용량</span><strong>${formatBytes(items.reduce((sum, item) => sum + item.size, 0))}</strong></div>
    </div>
    <div class="result-block">
      <h3>파일명 정리 결과</h3>
      <p class="ok-line">정리된 이름의 ZIP과 원본명 비교용 변경표를 만들었습니다.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>원본 파일명</th><th>정리된 파일명</th><th>용량</th></tr></thead>
        <tbody>
          ${items.map((item) => `<tr><td>${escapeHtml(item.originalName)}</td><td>${escapeHtml(item.newName)}</td><td>${formatBytes(item.size)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindImageToPdfEvents() {
  const form = document.querySelector("#imageToPdfForm");
  const input = document.querySelector("#imagePdfInput");
  const count = document.querySelector("#imagePdfCount");
  const downloadButton = document.querySelector("#downloadImagePdf");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 이미지 선택됨` : "선택된 이미지 없음";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#imageToPdfResult");
    downloadButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "PDF로 변환할 이미지를 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.imageCount, allowImagesOnly: true });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "이미지를 PDF 페이지로 변환하는 중입니다...");
    try {
      const output = await imagesToPdf(files, {
        pageMode: document.querySelector("#imagePdfPage")?.value || "a4",
        margin: Number(document.querySelector("#imagePdfMargin")?.value || 36)
      });
      const baseName = safeBaseName(document.querySelector("#imagePdfName")?.value || "goatool_images");
      state.lastImagePdfBlob = output.blob;
      state.lastPdfName = `${baseName}.pdf`;
      downloadButton.disabled = false;
      result.innerHTML = renderImagePdfResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "이미지를 PDF로 변환하지 못했습니다. 일반 JPG, PNG, WebP 파일로 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastImagePdfBlob) downloadBlob(state.lastImagePdfBlob, state.lastPdfName || "goatool-images.pdf");
  });
}

async function imagesToPdf(files, options) {
  const { PDFDocument } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  const summary = [];
  for (const file of files) {
    const converted = await imageFileToJpegBytes(file);
    const embedded = await pdf.embedJpg(converted.bytes);
    const imgWidth = embedded.width;
    const imgHeight = embedded.height;
    let pageWidth = 595.28;
    let pageHeight = 841.89;
    if (options.pageMode === "original") {
      const scale = Math.min(1, 900 / Math.max(imgWidth, imgHeight));
      pageWidth = Math.max(160, imgWidth * scale);
      pageHeight = Math.max(160, imgHeight * scale);
    }
    const page = pdf.addPage([pageWidth, pageHeight]);
    const maxWidth = Math.max(1, pageWidth - options.margin * 2);
    const maxHeight = Math.max(1, pageHeight - options.margin * 2);
    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    page.drawImage(embedded, {
      x: (pageWidth - drawWidth) / 2,
      y: (pageHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight
    });
    summary.push({ name: file.name, width: converted.width, height: converted.height, size: file.size });
  }
  const bytes = await pdf.save();
  return { blob: new Blob([bytes], { type: "application/pdf" }), pageCount: pdf.getPageCount(), summary };
}

async function imageFileToJpegBytes(file) {
  const source = await loadImageSource(file);
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source.image, 0, 0);
  source.close?.();
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
  return { bytes: await blob.arrayBuffer(), width: canvas.width, height: canvas.height };
}

function renderImagePdfResult(output) {
  return `
    <div class="stat-grid">
      <div><span>이미지 수</span><strong>${output.summary.length}</strong></div>
      <div><span>PDF 페이지</span><strong>${output.pageCount}</strong></div>
      <div><span>결과 용량</span><strong>${formatBytes(output.blob.size)}</strong></div>
    </div>
    <div class="result-block">
      <h3>PDF 변환 결과</h3>
      <p class="ok-line">이미지를 선택 순서대로 PDF 페이지에 배치했습니다. 제출 전 페이지 순서를 확인하세요.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>이미지</th><th>원본 크기</th><th>원본 용량</th></tr></thead>
        <tbody>
          ${output.summary.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.width}×${item.height}</td><td>${formatBytes(item.size)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindZipInspectorEvents() {
  const form = document.querySelector("#zipInspectorForm");
  const input = document.querySelector("#zipInspectInput");
  const count = document.querySelector("#zipInspectCount");
  const reportButton = document.querySelector("#downloadZipReport");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "제출 직전 ZIP 파일을 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#zipInspectorResult");
    reportButton.disabled = true;
    if (!file) {
      showResultMessage(result, "점검할 ZIP 파일을 먼저 선택하세요.", "warn");
      return;
    }
    if (extensionOf(file.name) !== "zip") {
      showResultMessage(result, "ZIP 파일만 점검할 수 있습니다.", "warn");
      return;
    }
    if (file.size > LIMITS.singleBytes) {
      showResultMessage(result, `${file.name} 파일이 ${formatBytes(LIMITS.singleBytes)}를 넘습니다.`, "warn");
      return;
    }

    setResultBusy(result, true, "ZIP 내부 파일 목록을 읽는 중입니다...");
    try {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const items = Object.values(zip.files)
        .filter((item) => !item.dir)
        .map((item) => ({
          name: item.name,
          depth: item.name.split("/").filter(Boolean).length,
          extension: extensionOf(item.name),
          unsafe: /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)$/i.test(item.name) || /[\\:*?"<>|]/.test(item.name)
        }));
      const warnings = collectZipWarnings(items);
      const report = makeZipReport(file, items, warnings);
      state.lastZipReportBlob = new Blob([report], { type: "text/plain;charset=utf-8" });
      reportButton.disabled = false;
      result.innerHTML = renderZipInspectResult(file, items, warnings);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "ZIP을 읽지 못했습니다. 암호가 걸렸거나 손상된 ZIP인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastZipReportBlob) downloadBlob(state.lastZipReportBlob, "goatool-zip-file-list.txt");
  });
}

function collectZipWarnings(items) {
  const warnings = [];
  if (!items.length) warnings.push("ZIP 안에 파일이 없습니다.");
  if (items.some((item) => item.depth > 3)) warnings.push("폴더가 3단계보다 깊게 중첩된 파일이 있습니다.");
  if (items.some((item) => item.unsafe)) warnings.push("숨김 파일 또는 제출처에서 싫어할 수 있는 특수문자 파일명이 있습니다.");
  if (items.some((item) => !item.extension)) warnings.push("확장자가 없는 파일이 있습니다.");
  return warnings;
}

function makeZipReport(file, items, warnings) {
  return [
    "goatool ZIP 내용 점검표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `ZIP 파일: ${file.name}`,
    `ZIP 용량: ${formatBytes(file.size)}`,
    `내부 파일 수: ${items.length}`,
    "",
    "[주의 사항]",
    ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- 큰 위험 신호는 보이지 않았습니다."]),
    "",
    "[내부 파일 목록]",
    ...items.map((item, index) => `${index + 1}. ${item.name}`)
  ].join("\n");
}

function renderZipInspectResult(file, items, warnings) {
  return `
    <div class="stat-grid">
      <div><span>ZIP 용량</span><strong>${formatBytes(file.size)}</strong></div>
      <div><span>내부 파일</span><strong>${items.length}</strong></div>
      <div><span>점검 상태</span><strong class="${warnings.length ? "status-warn" : "status-ok"}">${warnings.length ? "확인 필요" : "준비 가능"}</strong></div>
    </div>
    <div class="result-block">
      <h3>ZIP 점검 결과</h3>
      ${warnings.length ? `<ul class="warning-list">${warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="ok-line">큰 위험 신호는 없습니다. 접수 전 파일 수를 지시문과 다시 비교하세요.</p>`}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ZIP 내부 파일명</th><th>확장자</th><th>깊이</th></tr></thead>
        <tbody>${items.slice(0, 80).map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.extension || "-")}</td><td>${item.depth}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function bindTextCounterEvents() {
  const form = document.querySelector("#textCounterForm");
  const text = document.querySelector("#counterText");
  const target = document.querySelector("#textTarget");
  const result = document.querySelector("#textCounterResult");
  const clearButton = document.querySelector("#clearCounter");

  const update = () => {
    result.innerHTML = renderTextCounterResult(text?.value || "", Number(target?.value || 0));
  };

  text?.addEventListener("input", update);
  target?.addEventListener("change", update);
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
  clearButton?.addEventListener("click", () => {
    if (text) text.value = "";
    update();
    text?.focus();
  });
}

function renderTextCounterResult(value, target) {
  const chars = value.length;
  const noSpace = value.replace(/\s/g, "").length;
  const bytes = new TextEncoder().encode(value).length;
  const lines = value ? value.split(/\r\n|\r|\n/).length : 0;
  const remaining = target > 0 ? target - chars : null;
  const percent = target > 0 ? Math.min(100, Math.round((chars / target) * 100)) : 0;
  return `
    <div class="stat-grid">
      <div><span>공백 포함</span><strong>${chars.toLocaleString("ko-KR")}</strong></div>
      <div><span>공백 제외</span><strong>${noSpace.toLocaleString("ko-KR")}</strong></div>
      <div><span>UTF-8 바이트</span><strong>${bytes.toLocaleString("ko-KR")}</strong></div>
    </div>
    <div class="counter-meter" aria-label="제한 글자수 사용률">
      <span style="width:${percent}%"></span>
    </div>
    <div class="result-block">
      <h3>계산 결과</h3>
      <p class="${remaining == null || remaining >= 0 ? "ok-line" : "warning-line"}">
        ${target > 0 ? `${target.toLocaleString("ko-KR")}자 기준 ${remaining >= 0 ? `${remaining.toLocaleString("ko-KR")}자 남음` : `${Math.abs(remaining).toLocaleString("ko-KR")}자 초과`}` : "제한 없음"}
        · 줄 수 ${lines.toLocaleString("ko-KR")}줄
      </p>
    </div>
    <div class="metric-list">
      <p><strong>공백 기준</strong><span>채용 플랫폼마다 공백 포함 여부가 다를 수 있어 두 값을 함께 확인하세요.</span></p>
      <p><strong>바이트 기준</strong><span>일부 시스템은 글자수 대신 바이트 제한을 둘 수 있습니다.</span></p>
    </div>
  `;
}

function bindTextCleanerEvents() {
  const form = document.querySelector("#textCleanerForm");
  const input = document.querySelector("#dirtyText");
  const copyButton = document.querySelector("#copyCleanText");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = document.querySelector("#textCleanerResult");
    const text = input?.value || "";
    if (!text.trim()) {
      showResultMessage(result, "정리할 텍스트를 먼저 붙여넣으세요.", "warn");
      copyButton.disabled = true;
      return;
    }
    const mode = document.querySelector("#textCleanMode")?.value || "form";
    const cleaned = cleanTextValue(text, mode);
    state.lastCleanText = cleaned;
    copyButton.disabled = false;
    result.innerHTML = renderTextCleanerResult(text, cleaned);
  });

  copyButton?.addEventListener("click", async () => {
    if (!state.lastCleanText) return;
    try {
      await navigator.clipboard?.writeText(state.lastCleanText);
      copyButton.textContent = "복사됨";
    } catch {
      copyButton.textContent = "직접 복사";
    }
    window.setTimeout(() => {
      copyButton.innerHTML = `${downloadIcon()} 복사`;
    }, 1300);
  });
}

function cleanTextValue(value, mode) {
  let text = String(value || "").replace(/\t/g, " ").replace(/[ \u00A0]{2,}/g, " ");
  if (mode === "single") {
    return text.replace(/\s*\r?\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  }
  text = text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  if (mode === "form") text = text.replace(/[ ]+([,.!?;:])/g, "$1");
  return text.trim();
}

function renderTextCleanerResult(before, after) {
  const beforeChars = before.length;
  const afterChars = after.length;
  return `
    <div class="stat-grid">
      <div><span>원문 글자</span><strong>${beforeChars.toLocaleString("ko-KR")}</strong></div>
      <div><span>정리본 글자</span><strong>${afterChars.toLocaleString("ko-KR")}</strong></div>
      <div><span>변화</span><strong>${(afterChars - beforeChars).toLocaleString("ko-KR")}</strong></div>
    </div>
    <div class="result-block">
      <h3>정리본</h3>
      <p class="ok-line">공백과 줄바꿈만 정리했습니다. 제출창에 붙여넣은 뒤 최종 글자수를 다시 확인하세요.</p>
    </div>
    <textarea class="result-textarea" readonly>${escapeHtml(after)}</textarea>
  `;
}

function bindImageInspectorEvents() {
  const form = document.querySelector("#imageInspectorForm");
  const input = document.querySelector("#imageInspectInput");
  const count = document.querySelector("#imageInspectCount");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 이미지 선택됨` : "사진, 스캔본, 캡처 이미지를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#imageInspectorResult");
    if (!files.length) {
      showResultMessage(result, "규격을 확인할 이미지를 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.imageCount, allowImagesOnly: true });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }
    setResultBusy(result, true, "이미지 규격을 읽는 중입니다...");
    try {
      const items = [];
      for (const file of files) {
        const source = await loadImageSource(file);
        items.push({
          name: file.name,
          width: source.width,
          height: source.height,
          size: file.size,
          extension: extensionOf(file.name)
        });
        source.close?.();
      }
      result.innerHTML = renderImageInspectResult(items);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "이미지 정보를 읽지 못했습니다. 일반 JPG, PNG, WebP 파일로 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });
}

function renderImageInspectResult(items) {
  const large = items.filter((item) => item.size > 1024 * 1024).length;
  return `
    <div class="stat-grid">
      <div><span>이미지 수</span><strong>${items.length}</strong></div>
      <div><span>1MB 초과</span><strong class="${large ? "status-warn" : "status-ok"}">${large}</strong></div>
      <div><span>총 용량</span><strong>${formatBytes(items.reduce((sum, item) => sum + item.size, 0))}</strong></div>
    </div>
    <div class="result-block">
      <h3>규격 확인 결과</h3>
      <p class="ok-line">픽셀과 용량을 확인했습니다. 조건과 다르면 증명사진 규격 맞추기 또는 이미지 용량 정리를 사용하세요.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>파일명</th><th>픽셀</th><th>비율</th><th>용량</th></tr></thead>
        <tbody>
          ${items
            .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.width}×${item.height}</td><td>${ratioLabel(item.width, item.height)}</td><td>${formatBytes(item.size)}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindFileListEvents() {
  const form = document.querySelector("#fileListForm");
  const input = document.querySelector("#fileListInput");
  const count = document.querySelector("#fileListCount");
  const txtButton = document.querySelector("#downloadFileListTxt");
  const csvButton = document.querySelector("#downloadFileListCsv");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 파일 선택됨` : "목록으로 남길 파일을 선택하세요";
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#fileListResult");
    txtButton.disabled = true;
    csvButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "목록으로 만들 파일을 먼저 선택하세요.", "warn");
      return;
    }
    const items = files.map((file, index) => ({
      index: index + 1,
      name: file.name,
      extension: extensionOf(file.name),
      size: file.size,
      type: file.type || ""
    }));
    const txt = makeFileListText(items);
    const csv = toCsv([["번호", "파일명", "확장자", "용량(bytes)", "용량"], ...items.map((item) => [item.index, item.name, item.extension, item.size, formatBytes(item.size)])]);
    state.lastFileListTxtBlob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    state.lastFileListCsvBlob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    txtButton.disabled = false;
    csvButton.disabled = false;
    result.innerHTML = renderFileListResult(items);
  });

  txtButton?.addEventListener("click", () => {
    if (state.lastFileListTxtBlob) downloadBlob(state.lastFileListTxtBlob, "goatool-file-list.txt");
  });
  csvButton?.addEventListener("click", () => {
    if (state.lastFileListCsvBlob) downloadBlob(state.lastFileListCsvBlob, "goatool-file-list.csv");
  });
}

function makeFileListText(items) {
  return [
    "goatool 파일 목록",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `파일 수: ${items.length}`,
    `총 용량: ${formatBytes(items.reduce((sum, item) => sum + item.size, 0))}`,
    "",
    ...items.map((item) => `${item.index}. ${item.name} / ${item.extension || "-"} / ${formatBytes(item.size)}`)
  ].join("\n");
}

function renderFileListResult(items) {
  return `
    <div class="stat-grid">
      <div><span>파일 수</span><strong>${items.length}</strong></div>
      <div><span>총 용량</span><strong>${formatBytes(items.reduce((sum, item) => sum + item.size, 0))}</strong></div>
      <div><span>상태</span><strong class="status-ok">목록 생성</strong></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>번호</th><th>파일명</th><th>확장자</th><th>용량</th></tr></thead>
        <tbody>${items.map((item) => `<tr><td>${item.index}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.extension || "-")}</td><td>${formatBytes(item.size)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function bindHashCompareEvents() {
  const form = document.querySelector("#hashCompareForm");
  const fileA = document.querySelector("#hashFileA");
  const fileB = document.querySelector("#hashFileB");
  const fileAName = document.querySelector("#hashFileAName");
  const fileBName = document.querySelector("#hashFileBName");
  const downloadButton = document.querySelector("#downloadHashReport");

  fileA?.addEventListener("change", () => {
    const file = fileA.files?.[0];
    fileAName.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "선택된 파일 없음";
  });
  fileB?.addEventListener("change", () => {
    const file = fileB.files?.[0];
    fileBName.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "선택된 파일 없음";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const a = fileA?.files?.[0];
    const b = fileB?.files?.[0];
    const result = document.querySelector("#hashCompareResult");
    downloadButton.disabled = true;
    if (!a || !b) {
      showResultMessage(result, "비교할 두 파일을 모두 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles([a, b], { maxCount: 2, allowImagesOnly: false });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "두 파일의 SHA-256을 계산하는 중입니다...");
    try {
      const [hashA, hashB] = await Promise.all([hashFile(a), hashFile(b)]);
      const same = hashA === hashB;
      const report = makeHashReport(a, b, hashA, hashB, same);
      state.lastHashReportBlob = new Blob([report], { type: "text/plain;charset=utf-8" });
      downloadButton.disabled = false;
      result.innerHTML = renderHashResult(a, b, hashA, hashB, same);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "해시 계산 중 문제가 생겼습니다. 파일을 나눠 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastHashReportBlob) downloadBlob(state.lastHashReportBlob, "goatool-hash-compare.txt");
  });
}

function makeHashReport(a, b, hashA, hashB, same) {
  return [
    "goatool SHA-256 파일 비교 결과",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `결과: ${same ? "같음" : "다름"}`,
    "",
    `[A] ${a.name}`,
    `용량: ${formatBytes(a.size)}`,
    `SHA-256: ${hashA}`,
    "",
    `[B] ${b.name}`,
    `용량: ${formatBytes(b.size)}`,
    `SHA-256: ${hashB}`
  ].join("\n");
}

function renderHashResult(a, b, hashA, hashB, same) {
  return `
    <div class="stat-grid">
      <div><span>A 용량</span><strong>${formatBytes(a.size)}</strong></div>
      <div><span>B 용량</span><strong>${formatBytes(b.size)}</strong></div>
      <div><span>동일 여부</span><strong class="${same ? "status-ok" : "status-warn"}">${same ? "같음" : "다름"}</strong></div>
    </div>
    <div class="result-block">
      <h3>SHA-256 비교</h3>
      <p class="${same ? "ok-line" : "warning-line"}">${same ? "두 파일의 해시가 완전히 같습니다." : "두 파일의 해시가 다릅니다. 내용이나 저장 방식이 달라졌을 수 있습니다."}</p>
    </div>
    <div class="hash-grid">
      <article><h3>A ${escapeHtml(a.name)}</h3><code>${hashA}</code></article>
      <article><h3>B ${escapeHtml(b.name)}</h3><code>${hashB}</code></article>
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

async function loadPdfLib() {
  return import("pdf-lib");
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

function parseSize(value) {
  const match = String(value || "").match(/^(\d+)x(\d+)$/);
  return {
    width: match ? Number(match[1]) : 350,
    height: match ? Number(match[2]) : 450
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed"));
    }, type, quality);
  });
}

function dateStamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
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

function ratioLabel(width, height) {
  if (!width || !height) return "-";
  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
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

function getRecentTools() {
  return readJsonStorage(STORAGE_KEYS.recentTools, []);
}

function recordToolUse(id) {
  const tool = tools.find((item) => item.id === id);
  if (!tool) return;
  const recent = getRecentTools().filter((item) => item.id !== id);
  recent.unshift({
    id,
    label: tool.label,
    path: tool.path,
    usedAt: Date.now()
  });
  writeJsonStorage(STORAGE_KEYS.recentTools, recent.slice(0, 6));
}

function renderRecentToolsPanel() {
  const recent = getRecentTools()
    .map((item) => tools.find((tool) => tool.id === item.id))
    .filter(Boolean)
    .slice(0, 4);
  const fallback = tools.slice(0, 4);
  const list = recent.length ? recent : fallback;
  return `
    <section class="side-panel">
      <h2>${recent.length ? "최근 사용 도구" : "빠른 시작"}</h2>
      ${list
        .map(
          (tool) => `
            <a href="${tool.path}" data-tool="${tool.id}" data-link class="side-link ${tool.id === state.activeTool ? "on" : ""}" ${tool.id === state.activeTool ? 'aria-current="page"' : ""}>
              <span>${tool.label}</span>
              <span aria-hidden="true">${arrowIcon()}</span>
            </a>
          `
        )
        .join("")}
    </section>
  `;
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

function imageIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><circle cx="9" cy="10" r="2"/><path d="m4 17 5-5 4 4 2-2 5 5"/></svg>`;
}

function pdfIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 14h6"/><path d="M9 17h4"/></svg>`;
}

function renameIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"/><path d="M4 12h8"/><path d="M4 17h6"/><path d="m15 16 4-4-4-4"/><path d="M19 12h-7"/></svg>`;
}

function textIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14"/><path d="M12 5v14"/><path d="M8 19h8"/></svg>`;
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
