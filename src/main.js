import JSZip from "jszip";
import { getGuideByPath, guideIndexMeta, guidePages } from "./guides.js";
import "./styles.css";

const BRAND = "goatool";
const baseDomain = "https://goatool.com";
const brandLogoPath = "/brand/goatool-logo.png";
const brandOgPath = "/brand/goatool-og.png";
const brandIconPath = "/brand/goatool-icon-512.png";
const lastUpdated = "2026-05-14";
const LIMITS = {
  fileCount: 80,
  imageCount: 60,
  totalBytes: 250 * 1024 * 1024,
  singleBytes: 80 * 1024 * 1024,
  csvTextBytes: 8 * 1024 * 1024,
  viewerTextBytes: 6 * 1024 * 1024,
  viewerPreviewChars: 120000,
  viewerHexBytes: 4096,
  viewerArchiveEntries: 1000,
  viewerTableRows: 120,
  viewerTableCols: 24,
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
    id: "pdf-page-labeler",
    path: "/tools/pdf-page-labeler/",
    group: "PDF 보조",
    label: "PDF 페이지 번호",
    short: "하단 번호, 총쪽수",
    title: "제출용 PDF에 페이지 번호를 붙이기",
    description: "긴 사업계획서, 포트폴리오, 증빙 PDF 하단에 페이지 번호를 넣어 담당자가 누락 여부와 순서를 확인하기 쉽게 만듭니다.",
    tags: ["PDF", "페이지 번호", "제출본"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "pdf-rotate",
    path: "/tools/pdf-rotate/",
    group: "PDF 보조",
    label: "PDF 페이지 회전",
    short: "90도, 180도, 일부 페이지",
    title: "옆으로 누운 PDF 페이지 방향을 바로잡기",
    description: "스캔본이나 증빙 PDF에서 방향이 돌아간 페이지를 전체 또는 일부 페이지만 골라 회전한 새 PDF로 만듭니다.",
    tags: ["PDF", "회전", "스캔본"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "pdf-info",
    path: "/tools/pdf-info/",
    group: "PDF 점검",
    label: "PDF 구조 점검",
    short: "쪽수, 크기, 방향",
    title: "PDF 쪽수와 페이지 방향을 제출 전에 점검하기",
    description: "여러 PDF의 쪽수, 첫 페이지 크기, 가로 페이지, 서로 다른 페이지 크기 여부를 표로 확인해 업로드 전 위험 신호를 줄입니다.",
    tags: ["PDF", "쪽수", "방향 점검"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "file-viewer",
    path: "/tools/file-viewer/",
    group: "제출 상위",
    label: "파일 뷰어",
    short: "XLSX, HWPX, PDF, ZIP",
    title: "파일 뷰어",
    description: "XLSX 표, HWPX 문서, PDF, 이미지, ZIP처럼 형식이 다른 제출 파일을 업로드 전 한 화면에서 미리 확인합니다.",
    tags: ["XLSX 뷰어", "HWPX 뷰어", "PDF"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "pdf-a4-normalizer",
    path: "/tools/pdf-a4-normalizer/",
    group: "PDF 보조",
    label: "PDF A4 맞춤",
    short: "페이지 크기 통일",
    title: "크기가 섞인 PDF 페이지를 A4로 맞추기",
    description: "스캔본과 이미지 PDF처럼 페이지 크기가 제각각인 PDF를 A4 여백 안에 맞춰 새 제출본으로 다시 만듭니다.",
    tags: ["PDF", "A4", "페이지 크기"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "pdf-splitter",
    path: "/tools/pdf-splitter/",
    group: "PDF 보조",
    label: "PDF 나누기",
    short: "쪽수 단위 ZIP",
    title: "긴 PDF를 제출 제한에 맞게 나누기",
    description: "긴 PDF를 5쪽, 10쪽처럼 일정 쪽수 단위로 나누고 결과 PDF들을 ZIP으로 묶어 내려받습니다.",
    tags: ["PDF", "분할", "ZIP"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "pdf-blank-remover",
    path: "/tools/pdf-blank-remover/",
    group: "PDF 점검",
    label: "PDF 빈 페이지 정리",
    short: "빈 쪽 제거",
    title: "PDF 안의 구조상 빈 페이지를 찾아 제거하기",
    description: "스캔이나 PDF 변환 과정에서 생긴 구조상 빈 페이지를 찾아 제외한 새 PDF를 만듭니다.",
    tags: ["PDF", "빈 페이지", "정리"],
    situations: ["public", "job", "school", "share"]
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
    id: "required-doc-checker",
    path: "/tools/required-doc-checker/",
    group: "민원 상위",
    label: "제출서류 누락 대조",
    short: "신청별 서류 자동 대조",
    title: "필수 서류 목록과 실제 파일을 대조하기",
    description: "정책자금, 고용지원, 민원, 입사지원 유형을 고르면 대표 제출서류가 자동으로 들어가고 실제 파일명 기준으로 빠진 서류를 대조합니다.",
    tags: ["누락 점검", "서류 목록", "파일명"],
    situations: ["public", "job", "school"]
  },
  {
    id: "bundle-rule-checker",
    path: "/tools/bundle-rule-checker/",
    group: "제출 상위",
    label: "제출 규칙 검사",
    short: "총용량, 개별용량, 확장자",
    title: "접수처 제한에 맞게 제출 파일 묶음을 검사하기",
    description: "접수 화면의 총용량, 파일별 용량, 허용 확장자 조건을 입력하고 선택한 파일 묶음이 조건을 넘는지 바로 확인합니다.",
    tags: ["용량 제한", "확장자", "제출 검사"],
    situations: ["public", "job", "school"]
  },
  {
    id: "filename-privacy-checker",
    path: "/tools/filename-privacy-checker/",
    group: "제출 보조",
    label: "파일명 개인정보 점검",
    short: "전화, 이메일, 주민번호",
    title: "파일명에 드러난 개인정보를 제출 전에 찾기",
    description: "파일명에 전화번호, 이메일, 주민등록번호 형태, 생년월일 같은 민감 단서가 들어갔는지 확인해 공유 전 실수를 줄입니다.",
    tags: ["파일명", "개인정보", "점검"],
    situations: ["public", "job", "school", "share"]
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
    id: "image-redactor",
    path: "/tools/image-redactor/",
    group: "민원 상위",
    label: "이미지 민감정보 가리기",
    short: "주소, 번호, 얼굴 가림",
    title: "이미지에서 보이는 민감정보를 직접 가리기",
    description: "신분증, 등본 캡처, 통장 사본 이미지에서 노출되면 안 되는 영역을 검은 박스로 가린 제출용 사본을 만듭니다.",
    tags: ["이미지", "가림 처리", "개인정보"],
    situations: ["public", "job", "school", "share"]
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
    id: "zip-repacker",
    path: "/tools/zip-repacker/",
    group: "민원 상위",
    label: "ZIP 다시 포장",
    short: "숨김파일 제거, 평탄화",
    title: "제출 ZIP에서 불필요한 숨김파일을 빼고 다시 묶기",
    description: "ZIP 안의 __MACOSX, .DS_Store 같은 숨김·시스템 파일을 빼고 필요하면 폴더를 평탄화해 새 ZIP으로 만듭니다.",
    tags: ["ZIP", "숨김파일", "재포장"],
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
    id: "scan-readability",
    path: "/tools/scan-readability/",
    group: "제출 상위",
    label: "스캔 가독성 점검",
    short: "밝기, 대비, 흐림",
    title: "스캔본과 캡처 이미지가 읽히는지 점검하기",
    description: "증빙 이미지의 밝기, 대비, 흐림 가능성, 최소 해상도를 계산해 글자가 안 읽히는 제출본을 미리 걸러냅니다.",
    tags: ["스캔본", "가독성", "흐림 점검"],
    situations: ["public", "school", "job"]
  },
  {
    id: "image-duplicate-finder",
    path: "/tools/image-duplicate-finder/",
    group: "제출 보조",
    label: "이미지 중복 점검",
    short: "같은 캡처, 중복 스캔",
    title: "스캔 이미지와 캡처 파일의 중복 가능성 찾기",
    description: "여러 이미지의 축소 해시를 비교해 같은 스캔본이나 거의 같은 캡처가 제출 묶음에 두 번 들어갔는지 확인합니다.",
    tags: ["이미지", "중복", "스캔본"],
    situations: ["public", "job", "school", "share"]
  },
  {
    id: "file-duplicate-finder",
    path: "/tools/file-duplicate-finder/",
    group: "검증",
    label: "파일 내용 중복 점검",
    short: "SHA-256 중복 찾기",
    title: "파일명이 달라도 내용이 같은 중복 파일 찾기",
    description: "여러 제출 파일의 SHA-256 값을 계산해 이름은 달라도 내용이 완전히 같은 파일이 묶음에 들어갔는지 확인합니다.",
    tags: ["SHA-256", "중복", "파일 검증"],
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
  },
  {
    id: "table-privacy-checker",
    path: "/tools/table-privacy-checker/",
    group: "자료 점검",
    label: "표 개인정보 점검",
    short: "CSV·엑셀 패턴 검사",
    title: "CSV와 엑셀 표 안의 개인정보 패턴 찾기",
    description: "CSV나 XLSX 표에서 전화번호, 이메일, 주민등록번호 형태, 생년월일 단서를 찾아 제출 전 민감정보 노출을 줄입니다.",
    tags: ["CSV", "XLSX", "개인정보"],
    situations: ["public", "job", "school", "share"]
  }
];

const simpleToolCopy = {
  "photo-resize": {
    label: "증명사진 규격",
    short: "사진 크기와 용량 맞추기",
    title: "증명사진 규격 맞추기",
    description: "사진을 고르고 필요한 규격만 선택하면 제출용 JPG로 정리합니다."
  },
  "pdf-organizer": {
    label: "PDF 합치기",
    short: "합치기 또는 페이지만 뽑기",
    title: "PDF 합치기·페이지 뽑기",
    description: "여러 PDF를 하나로 묶거나 필요한 페이지만 골라 새 PDF로 만듭니다."
  },
  "pdf-page-labeler": {
    label: "PDF 페이지 번호",
    short: "하단 번호와 총쪽수 붙이기",
    title: "PDF 페이지 번호 붙이기",
    description: "PDF 하단에 페이지 번호를 넣어 누락과 순서를 확인하기 쉽게 만듭니다."
  },
  "pdf-rotate": {
    label: "PDF 회전",
    short: "돌아간 페이지 방향 바로잡기",
    title: "PDF 페이지 회전",
    description: "스캔본 PDF에서 방향이 틀어진 페이지를 전체 또는 일부만 골라 회전합니다."
  },
  "pdf-info": {
    label: "PDF 구조 점검",
    short: "쪽수, 방향, 크기 확인",
    title: "PDF 구조 점검",
    description: "PDF 쪽수와 페이지 크기, 가로 페이지 여부를 제출 전에 한 번에 확인합니다."
  },
  "file-viewer": {
    label: "파일 뷰어",
    short: "XLSX·HWPX·PDF 미리보기",
    title: "파일 뷰어",
    description: "파일 하나를 고르면 XLSX 표 보기, HWPX 문서 텍스트 추출, PDF·이미지 미리보기를 자동으로 보여줍니다."
  },
  "pdf-a4-normalizer": {
    label: "PDF A4 맞춤",
    short: "페이지 크기 통일",
    title: "PDF A4 맞춤",
    description: "크기가 섞인 PDF 페이지를 A4 여백 안에 맞춘 새 PDF로 만듭니다."
  },
  "pdf-splitter": {
    label: "PDF 나누기",
    short: "쪽수 단위로 나눠 ZIP 만들기",
    title: "PDF 나누기",
    description: "긴 PDF를 일정 쪽수 단위로 나누고 결과 PDF를 ZIP으로 묶습니다."
  },
  "pdf-blank-remover": {
    label: "PDF 빈 페이지",
    short: "구조상 빈 쪽 제거",
    title: "PDF 빈 페이지 정리",
    description: "PDF 안의 구조상 빈 페이지를 제외한 새 PDF를 만듭니다."
  },
  "file-ready": {
    label: "제출 파일 점검",
    short: "파일명·용량·ZIP 확인",
    title: "제출 파일 점검",
    description: "파일명, 용량, 확장자, 중복 여부를 확인하고 제출용 ZIP을 만듭니다."
  },
  "required-doc-checker": {
    label: "서류 누락 대조",
    short: "신청별 필수서류 자동 입력",
    title: "제출서류 누락 대조",
    description: "정책자금·민원·신청 유형을 고르면 제출서류 목록을 자동으로 채우고 실제 파일명과 비교합니다."
  },
  "bundle-rule-checker": {
    label: "제출 규칙 검사",
    short: "용량과 확장자 조건 확인",
    title: "제출 규칙 검사",
    description: "접수처의 총용량, 개별용량, 허용 확장자 조건에 파일 묶음이 맞는지 확인합니다."
  },
  "filename-privacy-checker": {
    label: "파일명 개인정보",
    short: "전화·이메일·주민번호 단서 찾기",
    title: "파일명 개인정보 점검",
    description: "파일명에 민감정보 단서가 들어갔는지 공유 전에 확인합니다."
  },
  "image-privacy": {
    label: "이미지 개인정보",
    short: "EXIF 줄이고 이미지 정리",
    title: "이미지 개인정보 정리",
    description: "이미지를 다시 저장해 사진 메타데이터 노출 가능성을 줄입니다."
  },
  "image-redactor": {
    label: "이미지 가림 처리",
    short: "보이는 민감정보 직접 가리기",
    title: "이미지 민감정보 가리기",
    description: "이미지에서 노출되면 안 되는 영역을 직접 박스로 가린 사본을 만듭니다."
  },
  "filename-cleaner": {
    label: "파일명 정리",
    short: "번호·날짜·특수문자 정리",
    title: "파일명 일괄 정리",
    description: "여러 파일 이름을 제출처가 읽기 쉬운 규칙으로 한 번에 정리합니다."
  },
  "image-to-pdf": {
    label: "이미지 PDF",
    short: "사진 여러 장을 PDF로",
    title: "이미지 PDF 변환",
    description: "JPG, PNG, WebP 이미지를 순서대로 묶어 제출용 PDF로 만듭니다."
  },
  "zip-inspector": {
    label: "ZIP 점검",
    short: "압축 안 파일 목록 확인",
    title: "ZIP 내용 점검",
    description: "ZIP 안에 들어간 파일 이름, 폴더 깊이, 누락 가능성을 빠르게 확인합니다."
  },
  "zip-repacker": {
    label: "ZIP 다시 포장",
    short: "숨김파일 빼고 새 ZIP",
    title: "ZIP 다시 포장",
    description: "압축파일 안의 숨김·시스템 파일을 제외하고 새 제출용 ZIP을 만듭니다."
  },
  "text-counter": {
    label: "글자수 계산",
    short: "공백 포함·제외·바이트",
    title: "글자수·바이트 계산",
    description: "자기소개서나 민원 문장의 글자수와 UTF-8 바이트를 바로 계산합니다."
  },
  "text-cleaner": {
    label: "텍스트 정리",
    short: "공백과 줄바꿈 정리",
    title: "텍스트 공백 정리",
    description: "붙여넣기 전에 과한 공백, 빈 줄, 줄바꿈을 읽기 좋게 정리합니다."
  },
  "image-inspector": {
    label: "이미지 정보",
    short: "픽셀·용량·비율 확인",
    title: "이미지 규격 확인",
    description: "이미지의 크기, 비율, 용량을 한 번에 확인합니다."
  },
  "scan-readability": {
    label: "스캔 가독성",
    short: "밝기·대비·흐림 확인",
    title: "스캔 가독성 점검",
    description: "스캔본과 캡처 이미지가 제출 후 읽히기 좋은지 계산합니다."
  },
  "image-duplicate-finder": {
    label: "이미지 중복 점검",
    short: "같은 스캔본과 캡처 찾기",
    title: "이미지 중복 점검",
    description: "이미지 축소 해시를 비교해 같은 스캔본이 두 번 들어갔는지 찾습니다."
  },
  "file-duplicate-finder": {
    label: "파일 내용 중복",
    short: "SHA-256으로 같은 파일 찾기",
    title: "파일 내용 중복 점검",
    description: "파일명이 달라도 내용이 같은 파일을 해시로 찾아냅니다."
  },
  "file-list": {
    label: "파일 목록",
    short: "TXT·CSV 목록 만들기",
    title: "파일 목록 만들기",
    description: "선택한 파일의 이름, 확장자, 용량 목록을 TXT나 CSV로 저장합니다."
  },
  "hash-compare": {
    label: "파일 해시 비교",
    short: "SHA-256으로 동일성 확인",
    title: "파일 해시 비교",
    description: "파일의 SHA-256 값을 계산해 제출 전후 파일이 같은지 확인합니다."
  },
  "data-clean": {
    label: "CSV·엑셀 정리",
    short: "공백·빈 행·중복 정리",
    title: "CSV·엑셀 정리",
    description: "CSV나 XLSX 표의 공백, 빈 행, 중복 행을 정리해 다시 내려받습니다."
  },
  "table-privacy-checker": {
    label: "표 개인정보 점검",
    short: "전화·이메일·주민번호 단서",
    title: "표 개인정보 점검",
    description: "CSV와 XLSX 표 안의 개인정보 패턴을 제출 전에 확인합니다."
  }
};

const requiredDocPresets = [
  {
    id: "policy-smallbiz-general",
    group: "정책자금",
    label: "소상공인 일반경영안정자금",
    note: "지역, 보증기관, 접수 연도에 따라 매출·업력 증빙이 추가될 수 있습니다.",
    href: "https://policyfundpedia.com/소상공인-일반경영안정자금/",
    docs: [
      "정책자금 신청서",
      "사업자등록증명원",
      "대표자 신분증 사본",
      "부가가치세 과세표준증명원",
      "최근 3개월 매출 자료",
      "국세 납세증명서",
      "지방세 납세증명서",
      "임대차계약서 사본",
      "통장 사본"
    ]
  },
  {
    id: "policy-smallbiz-emergency",
    group: "정책자금",
    label: "소상공인 긴급경영안정자금",
    note: "피해 유형별 확인서 명칭이 다르므로 지자체·소진공 공고명을 마지막에 맞춰야 합니다.",
    href: "https://policyfundpedia.com/소상공인-긴급경영안정자금/",
    docs: [
      "정책자금 신청서",
      "사업자등록증",
      "대표자 신분증 사본",
      "피해사실 확인서",
      "피해 규모 자료",
      "매출 감소 증빙 자료",
      "국세 납세증명서",
      "지방세 납세증명서",
      "통장 사본"
    ]
  },
  {
    id: "policy-smart-store",
    group: "정책자금",
    label: "소상공인 스마트상점 기술보급",
    note: "도입 기술, 공급기업, 매장 보유 형태에 따라 견적·사진·계약 증빙이 달라질 수 있습니다.",
    href: "https://policyfundpedia.com/소상공인-스마트상점-기술보급사업/",
    docs: [
      "참여 신청서",
      "사업자등록증명원",
      "소상공인 확인서",
      "스마트기술 도입 계획서",
      "공급기업 견적서",
      "국세 납세증명서",
      "지방세 납세증명서",
      "개인정보 수집 이용 동의서",
      "매장 사진 또는 임대차계약서"
    ]
  },
  {
    id: "policy-jinheung-innovation",
    group: "정책자금",
    label: "중진공 혁신성장자금",
    note: "시설·운전·기술사업화 구분에 따라 사업계획서와 기술 증빙의 깊이가 달라집니다.",
    href: "https://policyfundpedia.com/2026년-중진공-혁신성장자금/",
    docs: [
      "융자 신청서",
      "사업자등록증명원",
      "최근 3개년 재무제표",
      "국세 납세증명서",
      "지방세 납세증명서",
      "사업계획서",
      "기술성 또는 혁신성 증빙자료",
      "법인등기부등본",
      "주주명부"
    ]
  },
  {
    id: "policy-export-voucher",
    group: "정책자금",
    label: "수출바우처 사업",
    note: "수출 실적 유무와 우대 요건에 따라 계약서, 실적증명, 인증서류가 추가됩니다.",
    href: "https://policyfundpedia.com/2026년-수출바우처-사업/",
    docs: [
      "수출바우처 신청서",
      "사업자등록증명원",
      "중소기업 확인서",
      "최근 재무제표",
      "수출실적증명서 또는 수출계약서",
      "국세 납세증명서",
      "지방세 납세증명서",
      "개인정보 제공 동의서"
    ]
  },
  {
    id: "policy-pre-startup",
    group: "정책자금",
    label: "예비창업패키지",
    note: "예비창업자 여부, 팀 구성, 가점 항목에 따라 사실증명과 증빙서류가 달라질 수 있습니다.",
    href: "https://policyfundpedia.com/2026년-예비창업패키지/",
    docs: [
      "온라인 사업신청서",
      "사업계획서",
      "대표자 신분증 사본",
      "사업자등록 사실여부 사실증명",
      "개인정보 수집 이용 동의서",
      "가점 증빙서류",
      "발표자료"
    ]
  },
  {
    id: "policy-early-startup",
    group: "정책자금",
    label: "초기창업패키지",
    note: "창업 업력과 법인 여부에 따라 등기부등본, 매출·고용 증빙이 달라질 수 있습니다.",
    href: "https://policyfundpedia.com/2026년-초기창업패키지/",
    docs: [
      "사업신청서",
      "사업계획서",
      "사업자등록증명원",
      "법인등기부등본",
      "최근 매출 증빙자료",
      "고용 증빙자료",
      "개인정보 수집 이용 동의서",
      "가점 증빙서류"
    ]
  },
  {
    id: "policy-growth-startup",
    group: "정책자금",
    label: "창업도약패키지",
    note: "성장성 평가가 들어가므로 매출, 투자, 수출, 고용 실적 증빙을 빠뜨리기 쉽습니다.",
    href: "https://policyfundpedia.com/2026년-창업도약패키지/",
    docs: [
      "사업신청서",
      "사업계획서",
      "사업자등록증명원",
      "법인등기부등본",
      "최근 3개년 재무제표",
      "4대보험 가입자 명부",
      "매출 실적 증빙자료",
      "투자 또는 수출 실적 증빙자료",
      "개인정보 수집 이용 동의서"
    ]
  },
  {
    id: "policy-rechallenge",
    group: "정책자금",
    label: "재도전성공패키지",
    note: "폐업 이력, 재창업 상태, 채무조정 여부에 따라 확인 서류가 달라질 수 있습니다.",
    href: "https://policyfundpedia.com/재도전성공패키지/",
    docs: [
      "사업자등록증 또는 폐업사실증명원",
      "재창업 사업계획서",
      "대표자 신분증 사본",
      "폐업 또는 재도전 관련 증빙자료",
      "개인정보 수집 이용 동의서",
      "발표자료"
    ]
  },
  {
    id: "policy-youth-academy",
    group: "정책자금",
    label: "청년창업사관학교",
    note: "입교 단계별로 온라인 지원서, 발표자료, 가점 증빙 제출 시점이 나뉠 수 있습니다.",
    href: "https://policyfundpedia.com/청년창업사관학교/",
    docs: [
      "온라인 지원서",
      "사업계획서 또는 아이디어 기획안",
      "발표자료",
      "대표자 신분증 사본",
      "사업자등록 사실여부 증빙",
      "가점 증빙서류",
      "개인정보 수집 이용 동의서"
    ]
  },
  {
    id: "employment-retention",
    group: "고용지원",
    label: "고용유지지원금",
    note: "휴업·휴직 방식과 사업장 상황에 따라 계획서, 임금대장, 매출 감소 자료가 함께 필요합니다.",
    href: "https://policyfundpedia.com/고용유지지원금/",
    docs: [
      "사업자등록증",
      "고용유지조치 계획서",
      "매출 감소 증빙 자료",
      "근로자 명부",
      "근로계약서",
      "임금대장",
      "임금 지급 서류",
      "통장 사본"
    ]
  },
  {
    id: "employment-youth-job",
    group: "고용지원",
    label: "청년일자리도약장려금",
    note: "청년 요건, 채용일, 고용보험 가입 상태 확인 자료를 함께 묶어두는 편이 안전합니다.",
    href: "https://policyfundpedia.com/청년일자리도약장려금/",
    docs: [
      "사업자등록증",
      "근로계약서",
      "채용 청년 요건 확인 서류",
      "고용보험 가입 확인 자료",
      "임금 지급 내역",
      "사업주 확인서",
      "개인정보 제공 동의서"
    ]
  },
  {
    id: "employment-durunuri",
    group: "고용지원",
    label: "두루누리 사회보험료 지원",
    note: "근로자 보수와 가입 상태 자료가 핵심이므로 사업장·근로자 정보가 맞는지 먼저 보세요.",
    href: "https://policyfundpedia.com/두루누리-사회보험료-지원사업/",
    docs: [
      "지원 신청서",
      "사업자등록증",
      "사업장 가입자 명부",
      "근로자 보수월액 자료",
      "보험료 고지내역",
      "대표자 신분증 사본",
      "통장 사본"
    ]
  },
  {
    id: "civil-business-registration",
    group: "민원·신청",
    label: "사업자등록 신청",
    note: "업종 인허가가 필요한 경우 허가증·신고필증이 빠지면 접수가 지연됩니다.",
    docs: [
      "사업자등록 신청서",
      "대표자 신분증",
      "임대차계약서 사본",
      "인허가증 또는 신고필증",
      "동업계약서",
      "법인등기부등본",
      "정관 또는 주주명부"
    ]
  },
  {
    id: "civil-mailorder",
    group: "민원·신청",
    label: "통신판매업 신고",
    note: "쇼핑몰 주소, 구매안전서비스 확인증, 사업자 정보가 서로 일치해야 반려가 줄어듭니다.",
    docs: [
      "통신판매업 신고서",
      "사업자등록증명원",
      "구매안전서비스 이용 확인증",
      "대표자 신분증",
      "법인등기부등본",
      "도메인 또는 쇼핑몰 정보"
    ]
  },
  {
    id: "civil-transfer-address",
    group: "민원·신청",
    label: "전입신고",
    note: "세대주 확인이나 대리 신청이면 위임 자료가 추가됩니다.",
    docs: [
      "전입신고서",
      "신고인 신분증",
      "임대차계약서",
      "세대주 확인 자료",
      "위임장",
      "위임자 신분증 사본"
    ]
  },
  {
    id: "civil-health-dependent",
    group: "민원·신청",
    label: "건강보험 피부양자 등록",
    note: "가족관계, 소득, 재학·재직 상태 증빙이 같이 요구되는 경우가 많습니다.",
    docs: [
      "피부양자 자격취득 신고서",
      "가족관계증명서",
      "혼인관계증명서 또는 기본증명서",
      "소득 확인 자료",
      "재학증명서 또는 재직증명서",
      "신분증 사본"
    ]
  },
  {
    id: "civil-unemployment-benefit",
    group: "민원·신청",
    label: "실업급여 수급자격 신청",
    note: "이직확인서 처리 여부와 퇴사 사유 증빙을 먼저 확인하면 재방문을 줄일 수 있습니다.",
    docs: [
      "수급자격 인정 신청서",
      "신분증",
      "이직확인서",
      "통장 사본",
      "구직신청 확인 자료",
      "퇴사 사유 증빙자료"
    ]
  },
  {
    id: "civil-housing-benefit",
    group: "민원·신청",
    label: "주거급여 신청",
    note: "가구원 소득·재산 자료와 임대차계약서 정보가 접수 기준과 맞아야 합니다.",
    docs: [
      "사회보장급여 신청서",
      "금융정보 등 제공 동의서",
      "임대차계약서",
      "소득 재산 신고서",
      "통장 사본",
      "신분증"
    ]
  },
  {
    id: "civil-emergency-welfare",
    group: "민원·신청",
    label: "긴급복지 지원 신청",
    note: "위기사유를 보여주는 증빙이 핵심이며 의료비·주거비 등 지출 자료가 같이 쓰입니다.",
    docs: [
      "긴급복지 신청서",
      "신분증",
      "위기사유 증빙자료",
      "소득 재산 확인 자료",
      "통장 사본",
      "의료비 또는 주거비 지출 증빙"
    ]
  },
  {
    id: "application-job-basic",
    group: "입사지원·기관",
    label: "입사지원 기본 제출",
    note: "회사별로 졸업·성적·경력 증빙 제출 시점이 다르므로 공고문 요구 순서에 맞춰 정리하세요.",
    docs: [
      "이력서",
      "자기소개서",
      "경력기술서",
      "포트폴리오",
      "졸업증명서",
      "성적증명서",
      "자격증 사본",
      "경력증명서"
    ]
  },
  {
    id: "application-school-scholarship",
    group: "입사지원·기관",
    label: "학교 장학금 신청",
    note: "소득분위, 가족관계, 성적 기준 서류는 발급일 기준을 함께 확인해야 합니다.",
    docs: [
      "장학금 신청서",
      "재학증명서",
      "성적증명서",
      "가족관계증명서",
      "소득분위 확인서",
      "통장 사본",
      "개인정보 제공 동의서"
    ]
  }
];

const toolOrder = [
  "photo-resize",
  "pdf-organizer",
  "image-to-pdf",
  "file-viewer",
  "file-ready",
  "required-doc-checker",
  "bundle-rule-checker",
  "pdf-page-labeler",
  "pdf-rotate",
  "pdf-info",
  "pdf-a4-normalizer",
  "pdf-splitter",
  "pdf-blank-remover",
  "filename-cleaner",
  "filename-privacy-checker",
  "zip-inspector",
  "zip-repacker",
  "image-privacy",
  "image-redactor",
  "text-counter",
  "text-cleaner",
  "image-inspector",
  "scan-readability",
  "image-duplicate-finder",
  "file-duplicate-finder",
  "file-list",
  "hash-compare",
  "data-clean",
  "table-privacy-checker"
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
    "goatool은 민원 제출과 입사지원 전에 파일 뷰어, PDF 합치기, A4 맞춤, PDF 나누기, ZIP 다시 포장, 증명사진 규격, 제출 규칙 검사, 개인정보 가림, 표 개인정보 점검을 브라우저에서 처리하는 실용 도구입니다."
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
  "pdf-page-labeler": {
    summary: "PDF 페이지 번호 붙이기는 긴 제출본에서 담당자가 누락 페이지와 순서를 빠르게 확인할 수 있게 돕는 도구입니다. PDF 내용을 새로 해석하지 않고 각 페이지 하단에 번호만 추가합니다.",
    method: [
      "PDF를 브라우저에서 읽고 각 페이지 크기를 확인합니다.",
      "하단 중앙에 현재 페이지 또는 전체 페이지 수 포함 번호를 그립니다.",
      "원본 PDF는 그대로 두고 번호가 들어간 새 PDF를 내려받게 합니다."
    ],
    limits: [
      "암호가 걸린 PDF나 손상된 PDF는 읽지 못할 수 있습니다.",
      "전자서명된 PDF는 번호를 붙인 뒤 서명 상태가 달라질 수 있으므로 제출 전 확인해야 합니다.",
      "페이지 번호가 기존 푸터와 겹칠 수 있어 결과 PDF를 반드시 열어봐야 합니다."
    ],
    checklist: ["결과 PDF를 열어 번호 위치 확인", "기존 하단 문구와 겹치지 않는지 확인", "제출처가 원본 그대로를 요구하지 않는지 확인"],
    faq: [
      ["PDF가 서버로 올라가나요?", "아니요. PDF는 브라우저에서 읽고 새 파일로 저장합니다."],
      ["한글 페이지 문구도 넣을 수 있나요?", "현재 도구는 호환성을 위해 숫자 중심 페이지 번호를 넣습니다."]
    ]
  },
  "pdf-rotate": {
    summary: "PDF 페이지 회전은 스캔 과정에서 옆으로 누운 페이지를 제출 전에 바로잡는 도구입니다. PDF 페이지의 회전 정보를 새로 저장해 전체 문서 또는 일부 페이지 방향만 고칩니다.",
    method: [
      "PDF를 브라우저에서 읽고 각 페이지의 현재 회전값을 확인합니다.",
      "전체 페이지 또는 입력한 범위의 페이지에 90도, 180도, 270도 회전을 더합니다.",
      "원본은 유지하고 회전값이 반영된 새 PDF를 내려받게 합니다."
    ],
    limits: [
      "암호가 걸린 PDF나 손상된 PDF는 읽지 못할 수 있습니다.",
      "일부 스캐너가 이미지 자체를 비뚤게 저장한 경우 회전만으로 기울기는 보정되지 않습니다.",
      "전자서명·양식 PDF는 결과를 반드시 열어 서명과 입력값 상태를 확인해야 합니다."
    ],
    checklist: ["회전할 페이지 범위 확인", "결과 PDF를 열어 모든 페이지 방향 확인", "가로 문서가 의도된 문서인지 구분"],
    faq: [
      ["PDF 내용이 서버로 전송되나요?", "아니요. 페이지 회전은 브라우저에서 처리됩니다."],
      ["몇 페이지만 돌릴 수 있나요?", "예. 1-3, 5처럼 페이지 범위를 입력하면 해당 페이지만 회전합니다."]
    ]
  },
  "pdf-info": {
    summary: "PDF 구조 점검은 제출 전에 PDF의 쪽수, 방향, 페이지 크기 차이를 빠르게 확인하는 도구입니다. 업로드 실패나 누락 의심을 만드는 PDF 상태를 먼저 보는 데 초점을 둡니다.",
    method: [
      "PDF 파일을 브라우저에서 열고 페이지 수와 각 페이지 크기를 읽습니다.",
      "가로 방향 페이지 수와 서로 다른 페이지 크기 여부를 계산합니다.",
      "여러 PDF를 표로 비교하고 확인해야 할 항목을 TXT 보고서로 남깁니다."
    ],
    limits: [
      "PDF 내부 글자 내용이나 서류 진위 여부는 판정하지 않습니다.",
      "암호화되었거나 손상된 PDF는 브라우저에서 읽지 못할 수 있습니다.",
      "기관별 요구 쪽수, 용량, 양식 기준은 접수 화면에서 마지막으로 확인해야 합니다."
    ],
    checklist: ["쪽수가 예상과 맞는지 확인", "가로 페이지가 의도된 것인지 확인", "서로 다른 페이지 크기가 섞였는지 확인"],
    faq: [
      ["왜 페이지 크기를 확인해야 하나요?", "스캔본을 합치는 과정에서 A4와 이미지 크기 페이지가 섞이면 출력이나 검토 화면에서 어색하게 보일 수 있습니다."],
      ["PDF를 수정하나요?", "아니요. 구조 점검은 읽기 전용이며 결과 PDF를 만들지 않습니다."]
    ]
  },
  "file-viewer": {
    summary: "파일 뷰어는 제출 직전에 XLSX, HWPX, PDF, 이미지, ZIP 파일이 제대로 열리는지 한 화면에서 확인하는 읽기 전용 뷰어입니다. 브라우저가 직접 표시할 수 있는 파일은 원본 미리보기로 열고, 문서·압축·표 파일은 구조와 텍스트 일부를 꺼내 보여줍니다.",
    method: [
      "확장자, MIME, 파일 앞부분 서명을 함께 보고 PDF, 이미지, 미디어, 텍스트, 표, 압축, 오피스 XML 계열을 자동 분류합니다.",
      "CP949/EUC-KR, UTF-8, UTF-16 텍스트를 비교 해석하고 CSV는 쉼표·탭·세미콜론·파이프 구분자를 자동 추정합니다.",
      "PDF·이미지·영상·음성은 브라우저 내장 뷰어로 열고 CSV·ODS·XLSX·XLSM은 상위 행을 표로 보여줍니다.",
      "Markdown은 읽기 화면, JSON·XML은 구조 요약, ICS·VCF·EML은 일정·연락처·메일 요약, CSS 계열은 색상 팔레트를 함께 보여줍니다.",
      "YAML·TOML·INI·ENV 설정 파일, SRT·VTT 자막, LOG, RTF, SVG, 코드 파일은 구조와 핵심 줄을 따로 요약합니다.",
      "TTF·OTF·WOFF 폰트는 브라우저 FontFace 샘플로 열고, DOCX, DOCM, PPTX, PPTM, HWPX, ODT, EPUB처럼 ZIP 기반 문서는 내부 텍스트와 목차 후보를 추출합니다."
    ],
    limits: [
      "HWP 같은 폐쇄형 바이너리 문서는 전체 레이아웃을 재현하지 않고 파일 정보와 일부 원시 미리보기만 제공합니다.",
      "암호화된 PDF, 손상된 ZIP, 매우 큰 문서는 브라우저 메모리 보호를 위해 제한될 수 있습니다.",
      "HTML·SVG 등 실행 가능한 요소가 섞일 수 있는 파일은 보안을 위해 원본 실행보다 안전한 표시 방식을 우선합니다."
    ],
    checklist: ["제출 전 실제 파일명과 확장자 확인", "미리보기에서 내용이 깨지지 않는지 확인", "추출 텍스트와 원본 표시가 다르면 원본 프로그램으로 한 번 더 확인"],
    faq: [
      ["파일이 서버로 올라가나요?", "아니요. 선택한 파일은 브라우저에서만 읽고 미리보기와 추출 텍스트도 로컬에서 만듭니다."],
      ["DOCX나 HWPX도 보이나요?", "DOCX, DOCM, PPTX, PPTM, HWPX처럼 ZIP 기반 문서는 내부 텍스트를 추출해 확인할 수 있습니다. 다만 원본 편집기 레이아웃과 완전히 같지는 않을 수 있습니다."]
    ]
  },
  "pdf-a4-normalizer": {
    summary: "PDF A4 맞춤은 페이지 크기가 섞인 스캔본이나 이미지 PDF를 A4 한 규격으로 다시 배치하는 도구입니다. 원본 페이지를 흰 A4 페이지 안에 축소 배치해 제출 화면과 출력 화면에서 크기 튐을 줄입니다.",
    method: [
      "원본 PDF의 각 페이지를 브라우저에서 읽고 새 PDF에 임베드합니다.",
      "A4 세로, A4 가로, 원본 방향 자동 중 하나를 선택해 새 페이지를 만듭니다.",
      "여백 안에 원본 페이지가 잘리지 않도록 비율을 유지해 가운데 배치합니다."
    ],
    limits: [
      "PDF 내용을 다시 OCR하거나 선명하게 보정하지 않습니다.",
      "이미 기울어진 스캔 이미지의 기울기는 바로잡지 않습니다.",
      "전자서명·양식 PDF는 결과를 열어 서명과 입력값 상태를 확인해야 합니다."
    ],
    checklist: ["A4 세로/가로 방향 선택", "결과 PDF를 열어 잘림 여부 확인", "원본 PDF를 별도로 보관"],
    faq: [
      ["원본 페이지가 잘리나요?", "비율을 유지해 A4 여백 안에 맞추므로 일반적으로 잘리지 않습니다. 대신 여백이 생길 수 있습니다."],
      ["용량이 줄어드나요?", "페이지 재배치 도구라 압축 효과는 보장하지 않습니다."]
    ]
  },
  "pdf-splitter": {
    summary: "PDF 나누기는 접수처가 파일당 쪽수나 용량을 제한할 때 긴 PDF를 일정 쪽수 단위로 빠르게 나누는 도구입니다. 결과 PDF는 ZIP으로 묶어 내려받습니다.",
    method: [
      "PDF를 브라우저에서 읽고 전체 쪽수를 계산합니다.",
      "입력한 쪽수 단위로 페이지 범위를 나누어 각각 새 PDF로 만듭니다.",
      "나눠진 PDF와 작업 보고서를 하나의 ZIP으로 생성합니다."
    ],
    limits: [
      "실제 용량 기준으로 자동 최적 분할하지 않고 쪽수 기준으로 나눕니다.",
      "암호가 걸린 PDF나 손상된 PDF는 처리하지 못할 수 있습니다.",
      "전자서명·양식 PDF는 분할 뒤 서명과 입력값 상태를 확인해야 합니다."
    ],
    checklist: ["접수처의 파일당 쪽수와 용량 확인", "나눌 쪽수 단위 입력", "ZIP 안 PDF 파일 수와 페이지 범위 확인"],
    faq: [
      ["PDF가 서버로 올라가나요?", "아니요. PDF 분할은 브라우저 안에서 진행됩니다."],
      ["용량 기준으로 자동으로 나누나요?", "현재는 예측이 쉬운 쪽수 기준으로 나눕니다."]
    ]
  },
  "pdf-blank-remover": {
    summary: "PDF 빈 페이지 정리는 변환 과정에서 생긴 구조상 빈 페이지를 찾아 제외하는 도구입니다. 스캔 이미지가 들어 있는 흰 페이지까지 완전하게 판정하는 OCR 도구는 아니며, PDF 구조상 내용 스트림이 없는 페이지를 안전하게 정리합니다.",
    method: [
      "PDF 각 페이지의 내용 스트림 존재 여부를 브라우저에서 확인합니다.",
      "내용 스트림이 없는 페이지를 빈 페이지 후보로 분류합니다.",
      "빈 페이지 후보를 제외한 새 PDF와 점검 결과를 만듭니다."
    ],
    limits: [
      "흰 종이를 스캔한 이미지처럼 실제 픽셀이 있는 빈 페이지는 빈 페이지로 잡지 않을 수 있습니다.",
      "암호화되거나 손상된 PDF는 읽지 못할 수 있습니다.",
      "모든 페이지가 빈 페이지로 감지되면 새 PDF를 만들지 않습니다."
    ],
    checklist: ["감지된 빈 페이지 번호 확인", "결과 PDF를 열어 필요한 페이지가 빠지지 않았는지 확인", "원본 PDF 별도 보관"],
    faq: [
      ["흰 스캔 페이지도 지워지나요?", "이미지로 들어간 흰 페이지는 내용 스트림이 있으므로 자동 제거되지 않을 수 있습니다."],
      ["원본 PDF가 바뀌나요?", "아니요. 빈 페이지 후보를 제외한 새 PDF만 만듭니다."]
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
  "required-doc-checker": {
    summary: "제출서류 누락 대조는 정책자금, 고용지원, 민원, 입사지원 유형을 먼저 고르면 대표 제출서류 목록을 자동으로 채우고 실제 파일명과 비교해 빠진 항목을 찾는 도구입니다. 필수 누락, 해당 시 확인, 파일명 확인 필요를 나누어 보여주기 때문에 실제 제출 직전 판단이 더 빨라집니다.",
    method: [
      "선택한 신청 유형의 대표 제출서류를 줄 단위 항목으로 자동 입력합니다.",
      "세부 공고문이나 접수 화면과 다른 부분은 사용자가 목록에서 바로 수정할 수 있습니다.",
      "각 항목에서 의미 있는 키워드와 대체서류 표현을 추출하고 선택한 파일명과 비교합니다.",
      "매칭된 파일, 누락 가능 항목, 목록에 없는 추가 파일을 대조표와 TXT로 만듭니다."
    ],
    limits: [
      "파일명 기준 점검이므로 파일 안의 실제 내용이 맞는지는 확인하지 않습니다.",
      "공고문 표현과 파일명이 너무 다르면 누락으로 표시될 수 있습니다.",
      "자동 목록은 준비용 기준입니다. 접수 연도, 지역, 기관, 세부 공고가 요구하는 최종 서류와 다를 수 있습니다.",
      "제출처가 요구하는 원본, 사본, 직인, 발급일 조건은 사람이 마지막에 확인해야 합니다."
    ],
    checklist: ["신청 유형을 먼저 선택해 기본 서류 자동 입력", "공고문과 다른 서류명은 목록에서 바로 수정", "파일명에 서류명이 드러나도록 정리", "누락 항목은 실제 파일 내용까지 열어 확인"],
    faq: [
      ["자동으로 뜨는 제출서류가 최종 기준인가요?", "아니요. goatool은 사용자가 빠르게 준비를 시작하도록 대표 목록을 제공합니다. 실제 제출은 해당 공고문과 접수 화면이 최종 기준입니다."],
      ["서류 내용을 읽어서 맞는지 판단하나요?", "아니요. 개인정보 보호와 브라우저 처리 원칙상 파일명과 목록을 기준으로만 대조합니다."],
      ["왜 파일명 정리가 중요한가요?", "서류명이 파일명에 들어가야 자동 대조와 담당자 확인이 모두 쉬워집니다."]
    ]
  },
  "bundle-rule-checker": {
    summary: "제출 규칙 검사는 접수 화면에 적힌 파일 제한을 사용자가 직접 입력하고 실제 제출 파일 묶음이 그 조건을 넘는지 확인하는 도구입니다. 기관별 조건이 달라지는 부분을 하드코딩하지 않고 현장 규칙을 바로 반영합니다.",
    method: [
      "선택한 파일의 확장자, 개별 용량, 총용량, 파일명 위험 신호를 읽습니다.",
      "입력한 총용량 제한, 파일별 용량 제한, 허용 확장자 목록과 비교합니다.",
      "위반 항목과 통과 항목을 표로 보여주고 제출 전 확인 TXT를 만듭니다."
    ],
    limits: [
      "파일 안의 내용이 올바른 서류인지 판정하지 않습니다.",
      "기관별 세부 규칙은 사용자가 접수 화면에서 보고 입력해야 합니다.",
      "브라우저 안정성을 위해 지나치게 큰 파일 묶음은 나누어 점검하는 것이 안전합니다."
    ],
    checklist: ["접수 화면의 총용량과 개별 용량 확인", "허용 확장자를 그대로 입력", "위반 파일은 이름·용량·형식을 고친 뒤 다시 점검"],
    faq: [
      ["허용 확장자를 어떻게 적나요?", "pdf,jpg,png,docx처럼 쉼표로 적으면 됩니다. 점은 붙여도 되고 빼도 됩니다."],
      ["기관별 규칙을 자동으로 알 수 있나요?", "아니요. 접수처마다 조건이 달라 사용자가 본 규칙을 입력하는 방식으로 설계했습니다."]
    ]
  },
  "filename-privacy-checker": {
    summary: "파일명 개인정보 점검은 파일 내용이 아니라 파일명 자체에 드러난 민감 단서를 찾는 도구입니다. 공유용 ZIP이나 제출 묶음에서 전화번호, 이메일, 주민등록번호 형태가 파일명에 남아 있는 실수를 줄입니다.",
    method: [
      "선택한 파일의 이름만 읽고 정규식 기반 위험 단서를 찾습니다.",
      "전화번호, 이메일, 주민등록번호 형태, 생년월일 8자리 같은 패턴을 분리해 표시합니다.",
      "원본 파일명은 바꾸지 않고, 점검 결과를 TXT로 내려받게 합니다."
    ],
    limits: [
      "파일 내용 안의 개인정보는 검사하지 않습니다.",
      "패턴 기반 검사라 실제 개인정보가 아니어도 후보로 표시될 수 있습니다.",
      "파일명을 안전하게 바꾸려면 파일명 일괄 정리 도구를 이어서 사용해야 합니다."
    ],
    checklist: ["공유 전 파일명에 연락처와 주민번호가 없는지 확인", "후보 파일은 원본을 열지 말고 이름부터 정리", "제출처가 요구하는 이름 형식과 함께 재확인"],
    faq: [
      ["파일을 열어서 검사하나요?", "아니요. 파일명 문자열만 확인합니다."],
      ["파일명을 자동으로 바꾸나요?", "아니요. 이 도구는 점검 전용입니다. 변경은 파일명 일괄 정리 도구에서 처리합니다."]
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
  "image-redactor": {
    summary: "이미지 민감정보 가리기는 이미지 안에 실제로 보이는 주소, 주민번호 일부, 계좌번호, 얼굴 같은 영역을 사용자가 직접 박스로 덮는 도구입니다. 자동 판정 대신 사용자가 눈으로 확인하며 가리는 방식으로 오탐과 누락을 줄입니다.",
    method: [
      "이미지를 브라우저 캔버스에 불러온 뒤 원본 크기 기준으로 좌표를 계산합니다.",
      "사용자가 드래그한 영역을 검은색 또는 흰색 박스로 덮습니다.",
      "가림이 적용된 캔버스를 새 JPG 이미지로 내려받게 합니다."
    ],
    limits: [
      "OCR로 개인정보를 자동 탐지하지 않습니다.",
      "가린 뒤에도 주변 맥락으로 개인정보가 추정될 수 있으므로 결과를 확대 확인해야 합니다.",
      "원본 파일은 바뀌지 않으며, 결과 이미지를 따로 보관해야 합니다."
    ],
    checklist: ["주소, 주민번호, 계좌번호, 얼굴, 서명 영역 확인", "가림 후 확대해서 빈틈 확인", "원본과 가림본을 헷갈리지 않게 파일명 정리"],
    faq: [
      ["자동으로 개인정보를 찾아주나요?", "아니요. 사용자가 직접 영역을 선택해 가리는 방식입니다."],
      ["원본 이미지가 바뀌나요?", "아니요. 원본은 유지되고 가림 처리된 새 JPG를 내려받습니다."]
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
  "zip-repacker": {
    summary: "ZIP 다시 포장은 제출 ZIP 안에 섞인 숨김 파일, 시스템 파일, 불필요한 폴더 중첩을 줄이기 위한 도구입니다. ZIP을 서버에 올리지 않고 브라우저에서 다시 묶습니다.",
    method: [
      "ZIP 내부 목록을 읽고 파일 항목만 새 ZIP에 복사합니다.",
      "__MACOSX, .DS_Store, Thumbs.db 같은 시스템 파일을 제외할 수 있습니다.",
      "필요하면 폴더 경로를 제거하고 파일명만 남겨 평탄화합니다."
    ],
    limits: [
      "암호가 걸린 ZIP이나 손상된 ZIP은 읽지 못할 수 있습니다.",
      "같은 파일명이 여러 폴더에 있으면 자동으로 번호를 붙여 충돌을 피합니다.",
      "파일 내용이 올바른 서류인지까지 검수하지 않습니다."
    ],
    checklist: ["숨김 파일 제거 옵션 확인", "폴더 구조를 유지할지 평탄화할지 선택", "새 ZIP 내부 파일 수와 원본을 비교"],
    faq: [
      ["ZIP이 서버로 올라가나요?", "아니요. ZIP 읽기와 재포장은 브라우저에서 처리됩니다."],
      ["폴더를 모두 없앨 수 있나요?", "네. 평탄화 옵션을 켜면 파일명만 남겨 새 ZIP에 넣습니다."]
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
  "scan-readability": {
    summary: "스캔 가독성 점검은 증빙 이미지가 너무 어둡거나 흐리거나 대비가 낮아 제출 후 반려될 위험을 줄이기 위한 계산 도구입니다. 이미지 내용을 판독하지 않고 밝기, 대비, 선명도 신호를 수치로 봅니다.",
    method: [
      "이미지를 작은 캔버스에 그려 픽셀 밝기 값을 계산합니다.",
      "평균 밝기, 대비 표준편차, 인접 픽셀 차이를 이용해 흐림 가능성을 추정합니다.",
      "해상도와 용량까지 함께 보고 재촬영 또는 재스캔이 필요한지 표시합니다."
    ],
    limits: [
      "문자 인식 OCR이나 신분증 진위 판정은 하지 않습니다.",
      "도장, 서명, 작은 글씨의 실제 판독 가능성은 사람이 확대해 확인해야 합니다.",
      "사진 종류에 따라 선명도 수치는 다르게 나올 수 있어 경고는 보조 기준입니다."
    ],
    checklist: ["작은 글씨를 150% 이상 확대해 확인", "너무 어둡거나 밝은 이미지는 다시 촬영", "스캔본은 원본과 제출본을 따로 보관"],
    faq: [
      ["글자를 읽어서 판단하나요?", "아니요. OCR 없이 이미지 품질 신호만 계산합니다."],
      ["흐림 경고가 뜨면 무조건 반려되나요?", "아니요. 다만 제출 전에 다시 열어보고 필요하면 재촬영하는 것이 안전합니다."]
    ]
  },
  "image-duplicate-finder": {
    summary: "이미지 중복 점검은 같은 스캔본이나 거의 같은 캡처가 제출 묶음에 두 번 들어가는 실수를 줄이기 위한 도구입니다. 원본 이미지를 서버로 보내지 않고 축소 해시만 브라우저에서 비교합니다.",
    method: [
      "각 이미지를 8×8 캔버스로 축소하고 밝기 기준의 간단한 해시를 만듭니다.",
      "이미지끼리 해시 거리를 비교해 같은 이미지 또는 매우 비슷한 이미지 후보를 찾습니다.",
      "중복 후보 쌍과 유사도를 표로 보여주고 TXT 보고서로 남깁니다."
    ],
    limits: [
      "완전한 이미지 포렌식이나 저작권 판정 도구가 아닙니다.",
      "밝기 보정, 자르기, 회전이 큰 이미지는 실제 중복이어도 놓칠 수 있습니다.",
      "비슷한 서식의 서로 다른 문서가 중복 후보로 잡힐 수 있어 사람이 마지막에 확인해야 합니다."
    ],
    checklist: ["중복 후보 파일을 직접 열어 내용 비교", "같은 파일이면 하나만 제출 묶음에 남기기", "원본 스캔본과 정리본을 혼동하지 않게 파일명 정리"],
    faq: [
      ["이미지를 업로드하나요?", "아니요. 이미지를 브라우저에서 작게 읽어 비교한 뒤 결과만 표시합니다."],
      ["완전히 같은 파일만 찾나요?", "균형 모드에서는 거의 같은 캡처나 스캔본도 후보로 보여줍니다."]
    ]
  },
  "file-duplicate-finder": {
    summary: "파일 내용 중복 점검은 파일명이 달라도 실제 바이트가 완전히 같은 파일을 찾는 도구입니다. 제출 묶음에 같은 PDF나 같은 이미지가 이름만 바뀌어 두 번 들어가는 문제를 SHA-256 해시로 확인합니다.",
    method: [
      "각 파일을 브라우저에서 읽어 SHA-256 해시를 계산합니다.",
      "같은 해시를 가진 파일을 한 그룹으로 묶어 중복 후보로 표시합니다.",
      "중복 그룹과 전체 파일 목록을 TXT 보고서로 남깁니다."
    ],
    limits: [
      "내용이 조금이라도 달라진 파일은 중복으로 묶이지 않습니다.",
      "같은 문서를 다시 저장해 메타데이터가 바뀌면 해시가 달라질 수 있습니다.",
      "파일 내용이 올바른 서류인지까지 판단하지는 않습니다."
    ],
    checklist: ["중복 그룹의 파일을 직접 열어 하나만 남길지 결정", "서로 다른 서류가 같은 이름으로 저장되지 않았는지 확인", "최종 제출 ZIP 만들기 전에 다시 점검"],
    faq: [
      ["파일명이 달라도 찾을 수 있나요?", "네. 파일명 대신 SHA-256 해시로 비교합니다."],
      ["비슷한 파일도 찾아주나요?", "아니요. 이 도구는 완전히 같은 파일만 찾습니다. 비슷한 이미지는 이미지 중복 점검을 사용하세요."]
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
  },
  "table-privacy-checker": {
    summary: "표 개인정보 점검은 CSV나 XLSX 표 안에 전화번호, 이메일, 주민등록번호 형태, 생년월일 단서가 남아 있는지 찾는 도구입니다. 데이터를 외부로 보내지 않고 브라우저에서 첫 번째 시트 또는 CSV 본문을 검사합니다.",
    method: [
      "CSV 또는 XLSX 첫 번째 시트를 행과 열 배열로 읽습니다.",
      "각 셀을 정규식 기반 개인정보 후보 패턴과 비교합니다.",
      "발견 위치, 후보 유형, 마스킹된 미리보기를 표와 TXT로 남깁니다."
    ],
    limits: [
      "패턴 기반 점검이라 실제 개인정보가 아닌 값도 후보로 표시될 수 있습니다.",
      "XLSX는 첫 번째 시트만 검사합니다.",
      "대용량 표는 브라우저 안정성을 위해 행과 셀 수 제한을 둡니다."
    ],
    checklist: ["검사할 시트가 첫 번째 시트인지 확인", "후보 셀을 원본에서 직접 확인", "제출 전 불필요한 개인정보 열 삭제"],
    faq: [
      ["표 내용을 서버로 올리나요?", "아니요. 표 파일은 브라우저 안에서 읽고 후보 위치만 표시합니다."],
      ["개인정보를 자동 삭제하나요?", "아니요. 이 도구는 점검 전용이며 원본을 수정하지 않습니다."]
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
      ["최종 업데이트", `${lastUpdated} 기준으로 증명사진 규격, PDF 정리, PDF 페이지 번호, PDF 회전, PDF 구조 점검, PDF A4 맞춤, PDF 나누기, PDF 빈 페이지 정리, ZIP 다시 포장, 제출 규칙 검사, 파일명 개인정보 점검, 이미지 민감정보 가리기, 제출서류 누락 대조, 스캔 가독성 점검, 이미지 중복 점검, 파일 내용 중복 점검, 표 개인정보 점검, 파일명 정리, 해시 비교, 글자수 계산, CSV·엑셀 정리 기능과 설명을 검수했습니다.`]
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
  lastPdfLabelBlob: null,
  lastPdfRotateBlob: null,
  lastPdfInfoReportBlob: null,
  lastViewerObjectUrl: null,
  lastViewerText: "",
  lastViewerTextBlob: null,
  lastPdfA4Blob: null,
  lastPdfSplitZipBlob: null,
  lastPdfSplitReportBlob: null,
  lastPdfBlankBlob: null,
  lastPdfBlankReportBlob: null,
  lastRequiredChecklistBlob: null,
  lastBundleRuleReportBlob: null,
  lastFilenamePrivacyReportBlob: null,
  lastRenameZipBlob: null,
  lastRenameMapBlob: null,
  lastImagePdfBlob: null,
  lastZipReportBlob: null,
  lastZipRepackBlob: null,
  lastZipRepackName: null,
  lastZipRepackReportBlob: null,
  lastScanReportBlob: null,
  lastImageDuplicateReportBlob: null,
  lastImageRedactedBlob: null,
  lastImageRedactedName: null,
  redactor: null,
  lastFileDuplicateReportBlob: null,
  lastCleanText: "",
  lastFileListTxtBlob: null,
  lastFileListCsvBlob: null,
  lastHashReportBlob: null,
  lastCsvBlob: null,
  lastXlsxBlob: null,
  lastTablePrivacyReportBlob: null,
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

function orderedTools() {
  return toolOrder.map((id) => tools.find((tool) => tool.id === id)).filter(Boolean);
}

function simpleTool(tool) {
  return simpleToolCopy[tool.id] || {
    label: tool.label,
    short: tool.short,
    title: tool.title,
    description: tool.description
  };
}

function toolCue(tool) {
  if (["text-counter", "text-cleaner"].includes(tool.id)) return "먼저 텍스트를 붙여넣으세요";
  if (tool.id === "data-clean") return "CSV·엑셀을 고르거나 표를 붙여넣으세요";
  if (tool.id === "required-doc-checker") return "신청 유형을 고르고 파일을 대조하세요";
  if (tool.id === "pdf-page-labeler") return "페이지 번호를 붙일 PDF를 고르세요";
  if (tool.id === "pdf-rotate") return "방향을 돌릴 PDF를 고르세요";
  if (tool.id === "pdf-info") return "구조를 점검할 PDF를 고르세요";
  if (tool.id === "file-viewer") return "XLSX, HWPX, PDF 같은 파일 하나를 고르세요";
  if (tool.id === "pdf-a4-normalizer") return "A4로 맞출 PDF를 고르세요";
  if (tool.id === "pdf-splitter") return "나눌 PDF와 쪽수 단위를 고르세요";
  if (tool.id === "pdf-blank-remover") return "빈 페이지를 정리할 PDF를 고르세요";
  if (tool.id === "bundle-rule-checker") return "접수 규칙을 입력하고 파일을 고르세요";
  if (tool.id === "filename-privacy-checker") return "개인정보 단서를 찾을 파일을 고르세요";
  if (tool.id === "image-redactor") return "가릴 정보가 보이는 이미지를 고르세요";
  if (tool.id === "zip-repacker") return "다시 포장할 ZIP을 고르세요";
  if (tool.id === "scan-readability") return "읽힘 상태를 볼 스캔 이미지를 고르세요";
  if (tool.id === "image-duplicate-finder") return "중복을 찾을 이미지를 고르세요";
  if (tool.id === "file-duplicate-finder") return "내용 중복을 찾을 파일을 고르세요";
  if (tool.id === "table-privacy-checker") return "개인정보 패턴을 찾을 표 파일을 고르세요";
  return "먼저 파일을 고르세요";
}

function render() {
  const selected = activeTool();
  const currentPath = normalizePath(location.pathname);
  const activeRouteToolId = toolFromRoute(location.pathname);
  const infoPage = infoPageFromRoute(location.pathname);
  const guidePage = getGuideByPath(location.pathname);
  const isGuideIndex = currentPath === guideIndexMeta.path;
  const isReferencePage = Boolean(infoPage || guidePage || isGuideIndex);
  const shouldShowWorkbench = !isReferencePage && Boolean(activeRouteToolId);
  if (guidePage) recordGuideVisit(guidePage);
  updateDocumentMeta(selected, infoPage, guidePage, isGuideIndex);
  const pickerTools = orderedTools();
  const primaryPickerTools = pickerTools.slice(0, 6);
  const secondaryPickerTools = pickerTools.slice(6);
  const selectedCopy = simpleTool(selected);
  const filteredTools = pickerTools;
  const publicTools = pickerTools.filter((tool) => tool.situations.includes("public")).slice(0, 5);
  const jobTools = pickerTools.filter((tool) => tool.situations.includes("job")).slice(0, 5);

  app.innerHTML = `
    ${guidePage ? `<div class="read-progress" aria-hidden="true"><span></span></div>` : ""}
    <a class="skip-link" href="#mainContent">본문 바로가기</a>
    <header class="site-header">
      <div class="header-main">
        <a class="brand" href="/" data-link aria-label="goatool 홈">
          <span class="brand-logo-frame">
            <img class="brand-logo" src="${brandLogoPath}" alt="" width="188" height="45" decoding="async" />
            <small>브라우저 제출 도구</small>
          </span>
        </a>
        <nav class="header-nav" aria-label="주요 이동">
          <a href="/" data-link class="${!isReferencePage ? "on" : ""}" ${!isReferencePage ? 'aria-current="page"' : ""}>
            도구 선택
          </a>
          <a href="/guides/" data-link class="${isGuideIndex || guidePage ? "on" : ""}" ${isGuideIndex || guidePage ? 'aria-current="page"' : ""}>
            가이드
          </a>
          <a class="nav-sibling" href="https://policyfundpedia.com/" target="_blank" rel="noopener">
            정책자금 백과
          </a>
        </nav>
      </div>
    </header>

    <main class="page-shell ${isReferencePage ? "reference-shell" : "tool-shell"}" id="mainContent" tabindex="-1">
      <section class="content">
        ${infoPage ? renderInfoPage(infoPage) : ""}
        ${isGuideIndex ? renderGuideIndexPage() : ""}
        ${guidePage ? renderGuidePage(guidePage) : ""}
        <section class="workspace-intro simple-intro ${isReferencePage || shouldShowWorkbench ? "is-hidden" : ""}" aria-labelledby="workspaceTitle">
          <div class="intro-copy">
            <h1 id="workspaceTitle">필요한 도구를 하나만 고르세요</h1>
            <p>버튼을 누르면 아래 설정 화면으로 바로 이동합니다.</p>
            <div class="intro-points" aria-label="goatool 처리 기준">
              <span>브라우저 처리</span>
              <span>정리본 다운로드</span>
              <span>제출 전 검수</span>
            </div>
          </div>
          <nav class="tool-picker" aria-label="도구 선택">
            ${primaryPickerTools.map((tool) => renderToolPickerButton(tool, selected, isReferencePage, shouldShowWorkbench)).join("")}
            <details class="more-tools">
              <summary>다른 도구 보기</summary>
              <div>
                ${secondaryPickerTools.map((tool) => renderToolPickerButton(tool, selected, isReferencePage, shouldShowWorkbench)).join("")}
              </div>
            </details>
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

        ${
          shouldShowWorkbench
            ? `<section class="tool-workbench" id="toolWorkbench" aria-labelledby="toolTitle">
          <div class="tool-heading">
            <div>
              <p class="section-label">${selected.group}</p>
              <h2 id="toolTitle">${selectedCopy.title}</h2>
              <p>${selectedCopy.description}</p>
            </div>
            <a class="tool-url" href="${selected.path}" data-link>${baseDomain}${selected.path}</a>
          </div>
          <div class="flow-steps focus-cue" aria-label="현재 할 일">
            <span><b>1</b> ${toolCue(selected)}</span>
          </div>
          ${renderTool(selected.id)}
        </section>`
            : ""
        }

        ${shouldShowWorkbench ? renderExpertisePanel(selected) : ""}

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
        <img class="footer-logo" src="${brandLogoPath}" alt="goatool" width="156" height="37" loading="lazy" decoding="async" />
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
  setMeta("og:url", `${baseDomain}${path}`, "property");
  setMeta("og:image", `${baseDomain}${brandOgPath}`, "property");
  setMeta("og:image:width", "1200", "property");
  setMeta("og:image:height", "630", "property");
  setMeta("og:image:alt", "GOATool logo", "property");
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:image", `${baseDomain}${brandOgPath}`);
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
    image: `${baseDomain}${brandOgPath}`,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain, logo: `${baseDomain}${brandIconPath}` }
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
    image: `${baseDomain}${brandOgPath}`,
    datePublished: guide.dateModified,
    dateModified: guide.dateModified,
    author: { "@type": "Organization", name: BRAND, url: baseDomain },
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain, logo: `${baseDomain}${brandIconPath}` },
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
    image: `${baseDomain}${brandOgPath}`,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain, logo: `${baseDomain}${brandIconPath}` },
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
    image: `${baseDomain}${brandOgPath}`,
    dateModified: lastUpdated,
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain, logo: `${baseDomain}${brandIconPath}` },
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
    image: `${baseDomain}${brandOgPath}`,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: BRAND, url: baseDomain, logo: `${baseDomain}${brandIconPath}` }
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
  const copy = simpleTool(tool);
  return `
    <details class="expert-panel compact-expert">
      <summary>
        <span>${copy.label} 사용 기준 보기</span>
        <small>최종 검수 ${lastUpdated}</small>
      </summary>
      <div class="expert-head">
        <div>
          <h2 id="expertTitle">${copy.label} 전문 기준</h2>
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
    </details>
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

function renderToolPickerButton(tool, selected, isReferencePage, showActive = true) {
  const active = showActive && !isReferencePage && tool.id === selected.id;
  const copy = simpleTool(tool);
  return `
    <a href="${tool.path}" data-tool="${tool.id}" data-link class="tool-pick ${active ? "on" : ""}" aria-label="${escapeAttr(`${copy.label}: ${copy.short}`)}" ${active ? 'aria-current="page"' : ""}>
      <strong>${copy.label}</strong>
    </a>
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
  if (id === "pdf-page-labeler") return renderPdfPageLabelerTool();
  if (id === "pdf-rotate") return renderPdfRotateTool();
  if (id === "pdf-info") return renderPdfInfoTool();
  if (id === "file-viewer") return renderFileViewerTool();
  if (id === "pdf-a4-normalizer") return renderPdfA4NormalizerTool();
  if (id === "pdf-splitter") return renderPdfSplitterTool();
  if (id === "pdf-blank-remover") return renderPdfBlankRemoverTool();
  if (id === "required-doc-checker") return renderRequiredDocCheckerTool();
  if (id === "bundle-rule-checker") return renderBundleRuleCheckerTool();
  if (id === "filename-privacy-checker") return renderFilenamePrivacyCheckerTool();
  if (id === "image-privacy") return renderImagePrivacyTool();
  if (id === "image-redactor") return renderImageRedactorTool();
  if (id === "filename-cleaner") return renderFilenameCleanerTool();
  if (id === "image-to-pdf") return renderImageToPdfTool();
  if (id === "zip-inspector") return renderZipInspectorTool();
  if (id === "zip-repacker") return renderZipRepackerTool();
  if (id === "text-counter") return renderTextCounterTool();
  if (id === "text-cleaner") return renderTextCleanerTool();
  if (id === "image-inspector") return renderImageInspectorTool();
  if (id === "scan-readability") return renderScanReadabilityTool();
  if (id === "image-duplicate-finder") return renderImageDuplicateFinderTool();
  if (id === "file-duplicate-finder") return renderFileDuplicateFinderTool();
  if (id === "file-list") return renderFileListTool();
  if (id === "hash-compare") return renderHashCompareTool();
  if (id === "data-clean") return renderDataCleanTool();
  if (id === "table-privacy-checker") return renderTablePrivacyCheckerTool();
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

function renderPdfPageLabelerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="pdfPageLabelerForm" novalidate>
        <label class="field">
          <span>PDF 파일 선택</span>
          <input id="pdfLabelInput" class="file-native" type="file" accept="application/pdf,.pdf" aria-label="페이지 번호를 붙일 PDF 선택" />
          <span class="file-picker">${pdfIcon()} PDF 고르기</span>
          <em id="pdfLabelCount" class="file-count">페이지 번호를 붙일 PDF를 선택하세요</em>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 번호 방식 변경</summary>
          <div class="field two-col">
            <label>
              <span>표기 방식</span>
              <select id="pdfLabelMode">
                <option value="total" selected>1 / 전체쪽수</option>
                <option value="single">쪽수만 표시</option>
              </select>
            </label>
            <label>
              <span>시작 번호</span>
              <input id="pdfLabelStart" type="number" min="1" max="9999" value="1" />
            </label>
          </div>
          <label class="field">
            <span>결과 파일명</span>
            <input id="pdfLabelName" type="text" value="goatool_numbered_pdf" maxlength="80" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${pdfIcon()} 번호 붙이기</button>
          <button class="ghost-button" type="button" id="downloadPdfLabel" disabled>${downloadIcon()} PDF</button>
        </div>
        <p class="helper-text">하단 중앙에 숫자만 넣습니다. 기존 푸터나 전자서명이 있는 PDF는 결과를 열어 확인하세요.</p>
      </form>
      <div class="result-panel" id="pdfPageLabelerResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">PDF를 선택하면 각 페이지 하단에 번호를 붙인 새 PDF를 만듭니다.</p>
      </div>
    </div>
  `;
}

function renderPdfRotateTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="pdfRotateForm" novalidate>
        <label class="field">
          <span>PDF 파일 선택</span>
          <input id="pdfRotateInput" class="file-native" type="file" accept="application/pdf,.pdf" aria-label="회전할 PDF 선택" />
          <span class="file-picker">${pdfIcon()} PDF 고르기</span>
          <em id="pdfRotateCount" class="file-count">방향을 바로잡을 PDF를 선택하세요</em>
        </label>
        <label class="field">
          <span>회전 방향</span>
          <select id="pdfRotateDegrees">
            <option value="90" selected>오른쪽으로 90도</option>
            <option value="270">왼쪽으로 90도</option>
            <option value="180">180도 뒤집기</option>
          </select>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 일부 페이지만 회전</summary>
          <label class="field">
            <span>회전할 페이지</span>
            <select id="pdfRotateMode">
              <option value="all" selected>전체 페이지</option>
              <option value="range">입력한 페이지만</option>
            </select>
          </label>
          <label class="field">
            <span>페이지 범위</span>
            <input id="pdfRotateRanges" type="text" value="1" placeholder="예: 1-3, 5, 8-10" />
          </label>
          <label class="field">
            <span>결과 파일명</span>
            <input id="pdfRotateName" type="text" value="goatool_rotated_pdf" maxlength="80" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${pdfIcon()} 회전 적용</button>
          <button class="ghost-button" type="button" id="downloadPdfRotate" disabled>${downloadIcon()} PDF</button>
        </div>
        <p class="helper-text">방향 정보만 수정합니다. 기울어진 촬영본의 비스듬함이나 잘림은 보정하지 않습니다.</p>
      </form>
      <div class="result-panel" id="pdfRotateResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">PDF를 선택하면 전체 또는 일부 페이지 방향을 회전한 새 PDF를 만듭니다.</p>
      </div>
    </div>
  `;
}

function renderPdfInfoTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="pdfInfoForm" novalidate>
        <label class="field">
          <span>PDF 파일 선택</span>
          <input id="pdfInfoInput" class="file-native" type="file" accept="application/pdf,.pdf" multiple aria-label="구조를 점검할 PDF 선택" />
          <span class="file-picker">${pdfIcon()} PDF 고르기</span>
          <em id="pdfInfoCount" class="file-count">쪽수와 방향을 확인할 PDF를 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 구조 점검</button>
          <button class="ghost-button" type="button" id="downloadPdfInfoReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">읽기 전용 점검입니다. PDF를 수정하지 않고 쪽수, 페이지 크기, 가로 페이지 신호만 확인합니다.</p>
      </form>
      <div class="result-panel" id="pdfInfoResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">PDF를 선택하면 제출 전에 확인할 구조 정보를 표로 보여줍니다.</p>
      </div>
    </div>
  `;
}

function renderFileViewerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="fileViewerForm" novalidate>
        <div class="viewer-support-card" aria-label="파일 뷰어 지원 형식">
          <strong>파일 뷰어</strong>
          <p>XLSX는 표로, HWPX는 문서 내부 텍스트로 바로 확인합니다.</p>
          <div class="viewer-format-grid" aria-label="주요 지원 형식">
            <span><b>XLSX</b><em>엑셀 첫 시트 표 보기</em></span>
            <span><b>HWPX</b><em>한글 문서 텍스트 추출</em></span>
            <span><b>PDF</b><em>내장 뷰어 미리보기</em></span>
            <span><b>ZIP</b><em>압축 내부 목록 확인</em></span>
          </div>
        </div>
        <label class="field">
          <span>파일 선택</span>
          <input id="fileViewerInput" class="file-native" type="file" aria-label="미리 볼 파일 선택" />
          <span class="file-picker">${viewerIcon()} 파일 고르기</span>
          <em id="fileViewerCount" class="file-count">XLSX, HWPX, PDF, 이미지, ZIP, 문서, 표, 코드 파일을 선택하세요</em>
        </label>
        <label class="field">
          <span>보기 방식</span>
          <select id="fileViewerMode">
            <option value="auto" selected>자동으로 맞춰 보기</option>
            <option value="table">XLSX·CSV 표 보기</option>
            <option value="office">HWPX·DOCX 문서 보기</option>
            <option value="text">텍스트로 보기</option>
            <option value="archive">ZIP 내부 목록 보기</option>
            <option value="hex">원시 바이트 보기</option>
          </select>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 보기 옵션 변경</summary>
          <label class="field">
            <span>찾을 단어</span>
            <input id="fileViewerQuery" type="search" placeholder="예: 이름, 금액, 증명서" autocomplete="off" />
          </label>
          <div class="check-grid">
            <label><input id="fileViewerLineNumbers" type="checkbox" checked /> 텍스트 줄 번호</label>
            <label><input id="fileViewerSafeOnly" type="checkbox" checked /> 실행 대신 안전 표시</label>
          </div>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${viewerIcon()} 파일 보기</button>
          <button class="ghost-button" type="button" id="copyViewerText" disabled>텍스트 복사</button>
          <button class="ghost-button" type="button" id="downloadViewerText" disabled>${downloadIcon()} TXT 저장</button>
        </div>
        <p class="helper-text">파일은 브라우저 안에서만 읽습니다. XLSX는 첫 번째 시트를 표로, HWPX는 내부 XML 텍스트를 추출해 보여줍니다.</p>
      </form>
      <div class="result-panel" id="fileViewerResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">파일을 선택하면 형식에 맞는 미리보기와 구조 정보가 표시됩니다.</p>
      </div>
    </div>
  `;
}

function renderPdfA4NormalizerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="pdfA4Form" novalidate>
        <label class="field">
          <span>PDF 파일 선택</span>
          <input id="pdfA4Input" class="file-native" type="file" accept="application/pdf,.pdf" aria-label="A4로 맞출 PDF 선택" />
          <span class="file-picker">${pdfIcon()} PDF 고르기</span>
          <em id="pdfA4Count" class="file-count">크기를 통일할 PDF를 선택하세요</em>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 A4 배치 변경</summary>
          <div class="field two-col">
            <label>
              <span>A4 방향</span>
              <select id="pdfA4Orientation">
                <option value="auto" selected>원본 방향에 맞춤</option>
                <option value="portrait">A4 세로</option>
                <option value="landscape">A4 가로</option>
              </select>
            </label>
            <label>
              <span>여백</span>
              <select id="pdfA4Margin">
                <option value="12" selected>좁게</option>
                <option value="24">보통</option>
                <option value="36">넓게</option>
                <option value="0">없음</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>결과 파일명</span>
            <input id="pdfA4Name" type="text" value="goatool_a4_pdf" maxlength="80" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${pdfIcon()} A4로 맞추기</button>
          <button class="ghost-button" type="button" id="downloadPdfA4" disabled>${downloadIcon()} PDF</button>
        </div>
        <p class="helper-text">페이지를 A4 안에 비율 유지로 배치합니다. 잘림은 줄이고 여백이 생길 수 있습니다.</p>
      </form>
      <div class="result-panel" id="pdfA4Result" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">PDF를 선택하면 페이지 크기를 A4로 통일한 새 PDF를 만듭니다.</p>
      </div>
    </div>
  `;
}

function renderPdfSplitterTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="pdfSplitterForm" novalidate>
        <label class="field">
          <span>PDF 파일 선택</span>
          <input id="pdfSplitterInput" class="file-native" type="file" accept="application/pdf,.pdf" aria-label="나눌 PDF 선택" />
          <span class="file-picker">${pdfIcon()} PDF 고르기</span>
          <em id="pdfSplitterCount" class="file-count">나눌 PDF를 선택하세요</em>
        </label>
        <label class="field">
          <span>몇 쪽마다 나눌까요?</span>
          <input id="pdfSplitChunkSize" type="number" min="1" max="200" value="10" />
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 파일명 변경</summary>
          <label class="field">
            <span>결과 파일 접두어</span>
            <input id="pdfSplitPrefix" type="text" value="goatool_split" maxlength="60" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${packageIcon()} PDF 나누기</button>
          <button class="ghost-button" type="button" id="downloadPdfSplitZip" disabled>${downloadIcon()} ZIP</button>
          <button class="ghost-button" type="button" id="downloadPdfSplitReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">쪽수 기준으로 나눕니다. 용량 제한이 엄격한 접수처는 결과 ZIP 안의 각 PDF 용량도 확인하세요.</p>
      </form>
      <div class="result-panel" id="pdfSplitterResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">PDF와 쪽수 단위를 선택하면 여러 PDF로 나누어 ZIP을 만듭니다.</p>
      </div>
    </div>
  `;
}

function renderPdfBlankRemoverTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="pdfBlankForm" novalidate>
        <label class="field">
          <span>PDF 파일 선택</span>
          <input id="pdfBlankInput" class="file-native" type="file" accept="application/pdf,.pdf" aria-label="빈 페이지를 정리할 PDF 선택" />
          <span class="file-picker">${pdfIcon()} PDF 고르기</span>
          <em id="pdfBlankCount" class="file-count">빈 페이지를 찾을 PDF를 선택하세요</em>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 파일명 변경</summary>
          <label class="field">
            <span>결과 파일명</span>
            <input id="pdfBlankName" type="text" value="goatool_no_blank_pages" maxlength="80" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 빈 페이지 정리</button>
          <button class="ghost-button" type="button" id="downloadPdfBlank" disabled>${downloadIcon()} PDF</button>
          <button class="ghost-button" type="button" id="downloadPdfBlankReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">PDF 구조상 내용이 없는 페이지만 빈 페이지 후보로 봅니다. 흰 종이를 스캔한 이미지 페이지는 직접 확인하세요.</p>
      </form>
      <div class="result-panel" id="pdfBlankResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">PDF를 선택하면 구조상 빈 페이지를 찾아 제외한 새 PDF를 만듭니다.</p>
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

function renderRequiredDocPresetOptions() {
  const groups = [...new Set(requiredDocPresets.map((preset) => preset.group))];
  return groups
    .map((group) => {
      const options = requiredDocPresets
        .filter((preset) => preset.group === group)
        .map((preset) => `<option value="${escapeAttr(preset.id)}">${escapeHtml(preset.label)}</option>`)
        .join("");
      return `<optgroup label="${escapeAttr(group)}">${options}</optgroup>`;
    })
    .join("");
}

function findRequiredDocPreset(id) {
  return requiredDocPresets.find((preset) => preset.id === id) || null;
}

function requiredDocPresetText(preset) {
  return preset?.docs?.join("\n") || "";
}

function renderRequiredDocPresetPreview(preset) {
  if (!preset) {
    return `
      <div class="preset-card preset-empty">
        <strong>신청 유형을 먼저 고르세요</strong>
        <p>정책자금, 고용지원, 민원, 입사지원 유형을 선택하면 대표 제출서류가 아래 목록에 자동으로 들어갑니다.</p>
      </div>
    `;
  }

  const source = preset.href
    ? `<a href="${escapeAttr(preset.href)}" target="_blank" rel="noopener">정책자금백과에서 보기</a>`
    : "";
  return `
    <div class="preset-card">
      <strong>${escapeHtml(preset.label)}</strong>
      <p>${escapeHtml(preset.group)} 기준 대표 제출서류 ${preset.docs.length}개가 자동 입력됩니다.</p>
      <ol class="preset-doc-list">
        ${preset.docs.map((doc) => `<li>${escapeHtml(doc)}</li>`).join("")}
      </ol>
      <p class="preset-warning">${escapeHtml(preset.note)} 공고문과 접수 화면이 최종 기준입니다.</p>
      ${source ? `<p class="preset-source">${source}</p>` : ""}
    </div>
  `;
}

function renderRequiredDocCheckerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="requiredDocForm" novalidate>
        <label class="field">
          <span>신청 유형 선택</span>
          <select id="requiredDocPreset" aria-describedby="requiredDocPresetHelp">
            <option value="">직접 목록 붙여넣기</option>
            ${renderRequiredDocPresetOptions()}
          </select>
          <em id="requiredDocPresetHelp" class="field-note">유형을 고르면 아래 제출서류 목록이 자동으로 채워집니다.</em>
        </label>
        <div class="preset-preview" id="requiredDocPresetPreview" aria-live="polite">
          ${renderRequiredDocPresetPreview(null)}
        </div>
        <label class="field">
          <span>제출서류 목록</span>
          <textarea id="requiredDocText" rows="10" maxlength="${LIMITS.textChars}" placeholder="위 신청 유형을 고르거나 직접 붙여넣으세요.&#10;예:&#10;사업자등록증명원&#10;대표자 신분증 사본&#10;통장 사본"></textarea>
        </label>
        <label class="field">
          <span>실제 제출 파일 선택</span>
          <input id="requiredDocFiles" class="file-native" type="file" multiple aria-label="제출서류와 대조할 파일 선택" />
          <span class="file-picker">${checkIcon()} 파일 고르기</span>
          <em id="requiredDocCount" class="file-count">목록과 비교할 파일을 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 누락 대조</button>
          <button class="ghost-button" type="button" id="downloadRequiredDocReport" disabled>${downloadIcon()} 대조표</button>
        </div>
        <p class="helper-text">자동 목록은 준비용 기준입니다. 접수 연도, 지역, 기관, 세부 공고에 따라 추가 서류가 붙을 수 있으니 최종 공고문과 함께 확인하세요.</p>
      </form>
      <div class="result-panel" id="requiredDocResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">신청 유형을 고르고 파일을 넣으면 빠진 항목을 바로 보여줍니다.</p>
      </div>
    </div>
  `;
}

function renderBundleRuleCheckerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="bundleRuleForm" novalidate>
        <label class="field">
          <span>제출 파일 선택</span>
          <input id="bundleRuleFiles" class="file-native" type="file" multiple aria-label="제출 규칙을 검사할 파일 선택" />
          <span class="file-picker">${checkIcon()} 파일 고르기</span>
          <em id="bundleRuleCount" class="file-count">검사할 파일을 선택하세요</em>
        </label>
        <details class="advanced-options" open>
          <summary>접수 화면에 적힌 제한 입력</summary>
          <div class="field two-col">
            <label>
              <span>총용량 제한 MB</span>
              <input id="bundleMaxTotal" type="number" min="1" max="500" value="25" />
            </label>
            <label>
              <span>파일별 제한 MB</span>
              <input id="bundleMaxSingle" type="number" min="1" max="200" value="10" />
            </label>
          </div>
          <label class="field">
            <span>허용 확장자</span>
            <input id="bundleAllowedExt" type="text" value="pdf,jpg,jpeg,png,doc,docx,hwp,hwpx,zip" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 규칙 검사</button>
          <button class="ghost-button" type="button" id="downloadBundleRuleReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">기관마다 제한이 달라서 규칙을 직접 입력하는 방식입니다. 파일 내용은 열어 판정하지 않습니다.</p>
      </form>
      <div class="result-panel" id="bundleRuleResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">파일과 접수 제한을 넣으면 용량, 확장자, 파일명 위험 신호를 확인합니다.</p>
      </div>
    </div>
  `;
}

function renderFilenamePrivacyCheckerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="filenamePrivacyForm" novalidate>
        <label class="field">
          <span>파일 선택</span>
          <input id="filenamePrivacyFiles" class="file-native" type="file" multiple aria-label="파일명 개인정보를 점검할 파일 선택" />
          <span class="file-picker">${shieldIcon()} 파일 고르기</span>
          <em id="filenamePrivacyCount" class="file-count">파일명을 점검할 파일을 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${shieldIcon()} 파일명 점검</button>
          <button class="ghost-button" type="button" id="downloadFilenamePrivacyReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">파일 내용은 열지 않고 파일명만 검사합니다. 후보가 나오면 파일명 정리 도구로 이름을 바꾸세요.</p>
      </form>
      <div class="result-panel" id="filenamePrivacyResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">파일을 선택하면 전화번호, 이메일, 주민번호 형태 같은 파일명 위험 단서를 찾습니다.</p>
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

function renderImageRedactorTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="imageRedactorForm" novalidate>
        <label class="field">
          <span>이미지 선택</span>
          <input id="imageRedactorInput" class="file-native" type="file" accept="image/*" aria-label="가림 처리할 이미지 선택" />
          <span class="file-picker">${shieldIcon()} 이미지 고르기</span>
          <em id="imageRedactorCount" class="file-count">가릴 정보가 보이는 이미지를 선택하세요</em>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 가림 색 변경</summary>
          <label class="field">
            <span>가림 색</span>
            <select id="imageRedactorColor">
              <option value="#111827" selected>검은색</option>
              <option value="#ffffff">흰색</option>
            </select>
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${shieldIcon()} 이미지 열기</button>
          <button class="ghost-button" type="button" id="undoRedaction" disabled>되돌리기</button>
          <button class="ghost-button" type="button" id="resetRedaction" disabled>초기화</button>
          <button class="ghost-button" type="button" id="downloadRedactedImage" disabled>${downloadIcon()} JPG</button>
        </div>
        <p class="helper-text">이미지를 연 뒤 캔버스에서 가릴 영역을 드래그하세요. 원본 파일은 바뀌지 않습니다.</p>
      </form>
      <div class="result-panel" id="imageRedactorResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">이미지를 선택하면 드래그로 민감정보를 가릴 수 있는 작업 화면이 열립니다.</p>
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

function renderZipRepackerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="zipRepackerForm" novalidate>
        <label class="field">
          <span>ZIP 파일 선택</span>
          <input id="zipRepackInput" class="file-native" type="file" accept=".zip,application/zip" aria-label="다시 포장할 ZIP 파일 선택" />
          <span class="file-picker">${packageIcon()} ZIP 고르기</span>
          <em id="zipRepackCount" class="file-count">다시 포장할 ZIP을 선택하세요</em>
        </label>
        <details class="advanced-options" open>
          <summary>제출용 기본 정리</summary>
          <div class="check-grid">
            <label><input id="zipRemoveSystem" type="checkbox" checked /> 숨김·시스템 파일 제외</label>
            <label><input id="zipFlatten" type="checkbox" /> 폴더 경로 없애기</label>
          </div>
          <label class="field">
            <span>결과 ZIP 이름</span>
            <input id="zipRepackName" type="text" value="goatool_clean_zip" maxlength="80" autocomplete="off" />
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${packageIcon()} ZIP 다시 포장</button>
          <button class="ghost-button" type="button" id="downloadZipRepack" disabled>${downloadIcon()} ZIP</button>
          <button class="ghost-button" type="button" id="downloadZipRepackReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">ZIP 안 파일을 새 ZIP으로 다시 묶습니다. 원본 ZIP은 바뀌지 않습니다.</p>
      </form>
      <div class="result-panel" id="zipRepackerResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">ZIP을 선택하면 숨김파일 제거와 폴더 평탄화 옵션으로 새 ZIP을 만듭니다.</p>
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

function renderScanReadabilityTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="scanReadabilityForm" novalidate>
        <label class="field">
          <span>스캔본·캡처 이미지 선택</span>
          <input id="scanReadabilityInput" class="file-native" type="file" accept="image/*" multiple aria-label="가독성을 점검할 이미지 선택" />
          <span class="file-picker">${imageIcon()} 이미지 고르기</span>
          <em id="scanReadabilityCount" class="file-count">문서 사진, 스캔본, 캡처 이미지를 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 가독성 점검</button>
          <button class="ghost-button" type="button" id="downloadScanReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">OCR은 하지 않습니다. 밝기, 대비, 흐림 가능성과 해상도만 계산해 재촬영 여부를 판단하게 돕습니다.</p>
      </form>
      <div class="result-panel" id="scanReadabilityResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">이미지를 선택하면 제출 전 읽힘 위험 신호를 계산합니다.</p>
      </div>
    </div>
  `;
}

function renderImageDuplicateFinderTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="imageDuplicateForm" novalidate>
        <label class="field">
          <span>이미지 선택</span>
          <input id="imageDuplicateInput" class="file-native" type="file" accept="image/*" multiple aria-label="중복을 점검할 이미지 선택" />
          <span class="file-picker">${imageIcon()} 이미지 고르기</span>
          <em id="imageDuplicateCount" class="file-count">스캔본이나 캡처 이미지를 선택하세요</em>
        </label>
        <details class="advanced-options">
          <summary>필요할 때만 민감도 변경</summary>
          <label class="field">
            <span>중복 후보 기준</span>
            <select id="imageDuplicateSensitivity">
              <option value="strict">같은 이미지 중심</option>
              <option value="balanced" selected>균형</option>
              <option value="loose">비슷한 이미지까지 넓게</option>
            </select>
          </label>
        </details>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 중복 점검</button>
          <button class="ghost-button" type="button" id="downloadImageDuplicateReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">이미지 축소 해시를 비교합니다. 비슷한 서식의 서로 다른 문서가 후보로 잡힐 수 있어 마지막 확인은 직접 열어보세요.</p>
      </form>
      <div class="result-panel" id="imageDuplicateResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">이미지를 선택하면 같은 스캔본이나 비슷한 캡처 후보를 찾습니다.</p>
      </div>
    </div>
  `;
}

function renderFileDuplicateFinderTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="fileDuplicateForm" novalidate>
        <label class="field">
          <span>파일 선택</span>
          <input id="fileDuplicateFiles" class="file-native" type="file" multiple aria-label="내용 중복을 점검할 파일 선택" />
          <span class="file-picker">${checkIcon()} 파일 고르기</span>
          <em id="fileDuplicateCount" class="file-count">내용 중복을 찾을 파일을 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${checkIcon()} 중복 점검</button>
          <button class="ghost-button" type="button" id="downloadFileDuplicateReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">파일명을 보지 않고 SHA-256 해시로 완전히 같은 파일만 찾습니다.</p>
      </form>
      <div class="result-panel" id="fileDuplicateResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">파일을 선택하면 이름이 달라도 내용이 같은 파일 후보를 찾아줍니다.</p>
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

function renderTablePrivacyCheckerTool() {
  return `
    <div class="tool-grid">
      <form class="control-panel" id="tablePrivacyForm" novalidate>
        <label class="field">
          <span>CSV 또는 XLSX 파일</span>
          <input id="tablePrivacyInput" class="file-native" type="file" accept=".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="개인정보 패턴을 점검할 표 파일 선택" />
          <span class="file-picker">${tableIcon()} 표 파일 고르기</span>
          <em id="tablePrivacyCount" class="file-count">개인정보 패턴을 찾을 표 파일을 선택하세요</em>
        </label>
        <div class="control-row single-action">
          <button class="primary-button" type="submit">${shieldIcon()} 표 점검</button>
          <button class="ghost-button" type="button" id="downloadTablePrivacyReport" disabled>${downloadIcon()} 결과 TXT</button>
        </div>
        <p class="helper-text">CSV와 XLSX 첫 번째 시트 기준입니다. 원본은 수정하지 않고 후보 위치만 보여줍니다.</p>
      </form>
      <div class="result-panel" id="tablePrivacyResult" role="status" aria-live="polite" aria-atomic="false">
        <p class="empty-result">표 파일을 선택하면 전화번호, 이메일, 주민등록번호 형태, 생년월일 단서를 찾습니다.</p>
      </div>
    </div>
  `;
}

function scrollToWorkbench() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = document.querySelector("#toolWorkbench");
      if (!target) return;
      const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
      const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 10;
      scrollTo({ top: Math.max(0, top), behavior: "auto" });
    });
  });
}

function bindShellEvents() {
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
      document.querySelector("#mainContent")?.focus({ preventScroll: true });
      scrollToWorkbench();
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
    scrollToWorkbench();
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
  if (id === "pdf-page-labeler") {
    bindPdfPageLabelerEvents();
    return;
  }
  if (id === "pdf-rotate") {
    bindPdfRotateEvents();
    return;
  }
  if (id === "pdf-info") {
    bindPdfInfoEvents();
    return;
  }
  if (id === "file-viewer") {
    bindFileViewerEvents();
    return;
  }
  if (id === "pdf-a4-normalizer") {
    bindPdfA4NormalizerEvents();
    return;
  }
  if (id === "pdf-splitter") {
    bindPdfSplitterEvents();
    return;
  }
  if (id === "pdf-blank-remover") {
    bindPdfBlankRemoverEvents();
    return;
  }
  if (id === "required-doc-checker") {
    bindRequiredDocCheckerEvents();
    return;
  }
  if (id === "bundle-rule-checker") {
    bindBundleRuleCheckerEvents();
    return;
  }
  if (id === "filename-privacy-checker") {
    bindFilenamePrivacyCheckerEvents();
    return;
  }
  if (id === "image-privacy") {
    bindImagePrivacyEvents();
    return;
  }
  if (id === "image-redactor") {
    bindImageRedactorEvents();
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
  if (id === "zip-repacker") {
    bindZipRepackerEvents();
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
  if (id === "scan-readability") {
    bindScanReadabilityEvents();
    return;
  }
  if (id === "image-duplicate-finder") {
    bindImageDuplicateFinderEvents();
    return;
  }
  if (id === "file-duplicate-finder") {
    bindFileDuplicateFinderEvents();
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
  if (id === "table-privacy-checker") {
    bindTablePrivacyCheckerEvents();
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

function bindPdfPageLabelerEvents() {
  const form = document.querySelector("#pdfPageLabelerForm");
  const input = document.querySelector("#pdfLabelInput");
  const count = document.querySelector("#pdfLabelCount");
  const downloadButton = document.querySelector("#downloadPdfLabel");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "페이지 번호를 붙일 PDF를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#pdfPageLabelerResult");
    downloadButton.disabled = true;
    if (!file) {
      showResultMessage(result, "페이지 번호를 붙일 PDF를 먼저 선택하세요.", "warn");
      return;
    }
    if (extensionOf(file.name) !== "pdf") {
      showResultMessage(result, "PDF 파일만 처리할 수 있습니다.", "warn");
      return;
    }
    if (file.size > LIMITS.singleBytes) {
      showResultMessage(result, `${file.name} 파일이 ${formatBytes(LIMITS.singleBytes)}를 넘습니다.`, "warn");
      return;
    }

    setResultBusy(result, true, "PDF 페이지 번호를 붙이는 중입니다...");
    try {
      const output = await addPdfPageLabels(file, {
        mode: document.querySelector("#pdfLabelMode")?.value || "total",
        start: Math.max(1, Number(document.querySelector("#pdfLabelStart")?.value || 1))
      });
      const baseName = safeBaseName(document.querySelector("#pdfLabelName")?.value || "goatool_numbered_pdf");
      state.lastPdfLabelBlob = output.blob;
      state.lastPdfName = `${baseName}.pdf`;
      downloadButton.disabled = false;
      result.innerHTML = renderPdfPageLabelResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "PDF를 처리하지 못했습니다. 암호가 없는 일반 PDF인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastPdfLabelBlob) downloadBlob(state.lastPdfLabelBlob, state.lastPdfName || "goatool-numbered.pdf");
  });
}

async function addPdfPageLabels(file, options) {
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const total = pages.length;
  const start = options.start || 1;
  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const number = start + index;
    const text = options.mode === "single" ? String(number) : `${number} / ${start + total - 1}`;
    const size = 10;
    page.drawText(text, {
      x: Math.max(18, (width - font.widthOfTextAtSize(text, size)) / 2),
      y: 16,
      size,
      font,
      color: rgb(0.32, 0.38, 0.46)
    });
  });
  const bytes = await pdf.save();
  return { blob: new Blob([bytes], { type: "application/pdf" }), pageCount: total, originalSize: file.size };
}

function renderPdfPageLabelResult(output) {
  return `
    <div class="stat-grid">
      <div><span>페이지 수</span><strong>${output.pageCount}</strong></div>
      <div><span>결과 용량</span><strong>${formatBytes(output.blob.size)}</strong></div>
      <div><span>상태</span><strong class="status-ok">번호 완료</strong></div>
    </div>
    <div class="result-block">
      <h3>페이지 번호 처리 결과</h3>
      <p class="ok-line">각 페이지 하단 중앙에 번호를 넣었습니다. 제출 전 기존 푸터와 겹치지 않는지 확인하세요.</p>
    </div>
    <div class="metric-list">
      <p><strong>원본 용량</strong><span>${formatBytes(output.originalSize)}</span></p>
      <p><strong>검수 포인트</strong><span>전자서명 PDF, 양식 PDF, 하단 도장이 있는 문서는 결과를 열어서 직접 확인하세요.</span></p>
    </div>
  `;
}

function bindPdfRotateEvents() {
  const form = document.querySelector("#pdfRotateForm");
  const input = document.querySelector("#pdfRotateInput");
  const count = document.querySelector("#pdfRotateCount");
  const downloadButton = document.querySelector("#downloadPdfRotate");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "방향을 바로잡을 PDF를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#pdfRotateResult");
    downloadButton.disabled = true;
    if (!file) {
      showResultMessage(result, "회전할 PDF를 먼저 선택하세요.", "warn");
      return;
    }
    if (extensionOf(file.name) !== "pdf") {
      showResultMessage(result, "PDF 파일만 회전할 수 있습니다.", "warn");
      return;
    }
    if (file.size > LIMITS.singleBytes) {
      showResultMessage(result, `${file.name} 파일이 ${formatBytes(LIMITS.singleBytes)}를 넘습니다.`, "warn");
      return;
    }

    setResultBusy(result, true, "PDF 페이지 방향을 적용하는 중입니다...");
    try {
      const output = await rotatePdfPages(file, {
        degrees: Number(document.querySelector("#pdfRotateDegrees")?.value || 90),
        mode: document.querySelector("#pdfRotateMode")?.value || "all",
        ranges: document.querySelector("#pdfRotateRanges")?.value || "1"
      });
      const baseName = safeBaseName(document.querySelector("#pdfRotateName")?.value || "goatool_rotated_pdf");
      state.lastPdfRotateBlob = output.blob;
      state.lastPdfName = `${baseName}.pdf`;
      downloadButton.disabled = false;
      result.innerHTML = renderPdfRotateResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "PDF 회전에 실패했습니다. 암호가 없는 일반 PDF인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastPdfRotateBlob) downloadBlob(state.lastPdfRotateBlob, state.lastPdfName || "goatool-rotated.pdf");
  });
}

async function rotatePdfPages(file, options) {
  const { PDFDocument, degrees } = await loadPdfLib();
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  const pages = pdf.getPages();
  const indices = options.mode === "range" ? parsePageRanges(options.ranges, pages.length) : pages.map((_, index) => index);
  const amount = Number(options.degrees || 90);

  indices.forEach((index) => {
    const page = pages[index];
    const current = page.getRotation().angle || 0;
    page.setRotation(degrees((current + amount + 360) % 360));
  });

  const bytes = await pdf.save();
  return {
    blob: new Blob([bytes], { type: "application/pdf" }),
    originalSize: file.size,
    pageCount: pages.length,
    rotatedCount: indices.length,
    rotatedPages: indices.map((index) => index + 1),
    degrees: amount
  };
}

function renderPdfRotateResult(output) {
  const previewPages = output.rotatedPages.slice(0, 12).join(", ");
  const more = output.rotatedPages.length > 12 ? ` 외 ${output.rotatedPages.length - 12}쪽` : "";
  return `
    <div class="stat-grid">
      <div><span>전체 쪽수</span><strong>${output.pageCount}</strong></div>
      <div><span>회전 쪽수</span><strong>${output.rotatedCount}</strong></div>
      <div><span>결과 용량</span><strong>${formatBytes(output.blob.size)}</strong></div>
    </div>
    <div class="result-block">
      <h3>PDF 회전 결과</h3>
      <p class="ok-line">${output.degrees}도 회전을 적용했습니다. 내려받은 PDF를 열어 페이지 방향을 확인하세요.</p>
    </div>
    <div class="metric-list">
      <p><strong>회전 페이지</strong><span>${escapeHtml(previewPages || "-")}${escapeHtml(more)}</span></p>
      <p><strong>원본 용량</strong><span>${formatBytes(output.originalSize)}</span></p>
    </div>
  `;
}

function bindPdfInfoEvents() {
  const form = document.querySelector("#pdfInfoForm");
  const input = document.querySelector("#pdfInfoInput");
  const count = document.querySelector("#pdfInfoCount");
  const reportButton = document.querySelector("#downloadPdfInfoReport");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 PDF 선택됨` : "쪽수와 방향을 확인할 PDF를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#pdfInfoResult");
    reportButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "구조를 점검할 PDF를 먼저 선택하세요.", "warn");
      return;
    }
    if (files.length > LIMITS.pdfCount) {
      showResultMessage(result, `한 번에 ${LIMITS.pdfCount}개 이하의 PDF만 점검하세요.`, "warn");
      return;
    }
    const invalid = files.find((file) => extensionOf(file.name) !== "pdf");
    if (invalid) {
      showResultMessage(result, `${invalid.name} 파일은 PDF로 인식되지 않습니다.`, "warn");
      return;
    }

    setResultBusy(result, true, "PDF 쪽수와 페이지 방향을 읽는 중입니다...");
    try {
      const output = await inspectPdfStructure(files);
      state.lastPdfInfoReportBlob = new Blob([makePdfInfoReport(output)], { type: "text/plain;charset=utf-8" });
      reportButton.disabled = false;
      result.innerHTML = renderPdfInfoResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "PDF 구조를 읽지 못했습니다. 암호가 없는 일반 PDF인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastPdfInfoReportBlob) downloadBlob(state.lastPdfInfoReportBlob, "goatool-pdf-structure.txt");
  });
}

async function inspectPdfStructure(files) {
  const { PDFDocument } = await loadPdfLib();
  const items = [];
  for (const file of files) {
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
    const pages = pdf.getPages().map((page, index) => {
      const { width, height } = page.getSize();
      const angle = page.getRotation().angle || 0;
      const landscape = angle % 180 === 0 ? width > height : height > width;
      return {
        index: index + 1,
        width,
        height,
        angle,
        landscape
      };
    });
    const uniqueSizes = [...new Set(pages.map((page) => `${Math.round(page.width)}×${Math.round(page.height)}`))];
    const landscapePages = pages.filter((page) => page.landscape).map((page) => page.index);
    const warnings = collectPdfStructureWarnings(file, pages, uniqueSizes, landscapePages);
    const first = pages[0] || { width: 0, height: 0, angle: 0 };
    items.push({
      name: file.name,
      size: file.size,
      pageCount: pdf.getPageCount(),
      firstSize: `${Math.round(first.width)}×${Math.round(first.height)}`,
      firstAngle: first.angle,
      uniqueSizes,
      landscapePages,
      warnings
    });
  }
  return { items, totalPages: items.reduce((sum, item) => sum + item.pageCount, 0) };
}

function collectPdfStructureWarnings(file, pages, uniqueSizes, landscapePages) {
  const warnings = [];
  if (!pages.length) warnings.push("페이지 없음");
  if (file.size > 25 * 1024 * 1024) warnings.push("25MB 초과");
  if (uniqueSizes.length > 1) warnings.push("페이지 크기 섞임");
  if (landscapePages.length) warnings.push("가로 페이지 있음");
  if (pages.some((page) => page.angle !== 0)) warnings.push("회전값 있음");
  return warnings;
}

function makePdfInfoReport(output) {
  return [
    "goatool PDF 구조 점검표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `PDF 수: ${output.items.length}`,
    `총 쪽수: ${output.totalPages}`,
    "",
    ...output.items.map((item, index) => {
      const status = item.warnings.length ? item.warnings.join(", ") : "확인 완료";
      return `${index + 1}. ${item.name} / ${item.pageCount}쪽 / 첫 페이지 ${item.firstSize} / 가로 ${item.landscapePages.length}쪽 / ${status}`;
    })
  ].join("\n");
}

function renderPdfInfoResult(output) {
  const warnCount = output.items.filter((item) => item.warnings.length).length;
  return `
    <div class="stat-grid">
      <div><span>PDF 수</span><strong>${output.items.length}</strong></div>
      <div><span>총 쪽수</span><strong>${output.totalPages}</strong></div>
      <div><span>확인 필요</span><strong class="${warnCount ? "status-warn" : "status-ok"}">${warnCount}</strong></div>
    </div>
    <div class="result-block">
      <h3>PDF 구조 점검 결과</h3>
      ${
        warnCount
          ? `<ul class="warning-list">${output.items
              .filter((item) => item.warnings.length)
              .map((item) => `<li>${escapeHtml(item.name)}: ${escapeHtml(item.warnings.join(", "))}</li>`)
              .join("")}</ul>`
          : `<p class="ok-line">쪽수, 방향, 페이지 크기에서 큰 위험 신호가 보이지 않습니다.</p>`
      }
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>PDF</th><th>쪽수</th><th>첫 페이지</th><th>가로 쪽</th><th>상태</th></tr></thead>
        <tbody>
          ${output.items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${item.pageCount}</td>
                  <td>${escapeHtml(item.firstSize)}</td>
                  <td>${item.landscapePages.length ? escapeHtml(item.landscapePages.slice(0, 8).join(", ")) : "-"}</td>
                  <td><strong class="${item.warnings.length ? "status-warn" : "status-ok"}">${item.warnings.length ? escapeHtml(item.warnings.join(", ")) : "확인 완료"}</strong></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindFileViewerEvents() {
  const form = document.querySelector("#fileViewerForm");
  const input = document.querySelector("#fileViewerInput");
  const count = document.querySelector("#fileViewerCount");
  const mode = document.querySelector("#fileViewerMode");
  const query = document.querySelector("#fileViewerQuery");
  const lineNumbers = document.querySelector("#fileViewerLineNumbers");
  const safeOnly = document.querySelector("#fileViewerSafeOnly");
  const copyButton = document.querySelector("#copyViewerText");
  const downloadButton = document.querySelector("#downloadViewerText");

  const rerun = () => {
    if (input?.files?.[0]) form?.requestSubmit();
  };

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "XLSX, HWPX, PDF, 이미지, ZIP, 문서, 표, 코드 파일을 선택하세요";
    rerun();
  });

  mode?.addEventListener("change", rerun);
  lineNumbers?.addEventListener("change", rerun);
  safeOnly?.addEventListener("change", rerun);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#fileViewerResult");
    copyButton.disabled = true;
    downloadButton.disabled = true;
    state.lastViewerText = "";
    state.lastViewerTextBlob = null;
    if (state.lastViewerObjectUrl) {
      URL.revokeObjectURL(state.lastViewerObjectUrl);
      state.lastViewerObjectUrl = null;
    }

    if (!file) {
      showResultMessage(result, "볼 파일을 먼저 선택하세요.", "warn");
      return;
    }
    if (file.size > LIMITS.singleBytes) {
      showResultMessage(result, `${file.name} 파일이 ${formatBytes(LIMITS.singleBytes)}를 넘습니다. 브라우저에서 안정적으로 보기 어렵습니다.`, "warn");
      return;
    }

    setResultBusy(result, true, "파일 형식을 확인하고 미리보기를 준비하는 중입니다...");
    try {
      const output = await inspectViewerFile(file, {
        mode: mode?.value || "auto",
        query: query?.value || "",
        lineNumbers: Boolean(lineNumbers?.checked),
        safeOnly: Boolean(safeOnly?.checked)
      });
      state.lastViewerText = output.text || "";
      if (state.lastViewerText) {
        state.lastViewerTextBlob = new Blob([state.lastViewerText], { type: "text/plain;charset=utf-8" });
        copyButton.disabled = false;
        downloadButton.disabled = false;
      }
      result.innerHTML = renderFileViewerResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "파일을 읽지 못했습니다. 손상, 암호화, 또는 브라우저가 읽기 어려운 형식인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  query?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      rerun();
    }
  });

  copyButton?.addEventListener("click", async () => {
    if (!state.lastViewerText) return;
    try {
      await navigator.clipboard.writeText(state.lastViewerText);
      const original = copyButton.textContent;
      copyButton.textContent = "복사 완료";
      window.setTimeout(() => {
        copyButton.textContent = original || "텍스트 복사";
      }, 1200);
    } catch {
      downloadBlob(state.lastViewerTextBlob, "goatool-viewer-text.txt");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastViewerTextBlob) downloadBlob(state.lastViewerTextBlob, "goatool-viewer-text.txt");
  });
}

async function inspectViewerFile(file, options) {
  const ext = extensionOf(file.name);
  const detection = await detectViewerKind(file);
  const detected = detection.kind;
  const mode = options.mode === "auto" ? detected : options.mode;
  const base = {
    fileName: file.name,
    extension: ext || "-",
    size: file.size,
    mime: file.type || "알 수 없음",
    modified: file.lastModified ? new Date(file.lastModified).toLocaleString("ko-KR") : "-",
    detectedLabel: detection.label,
    query: options.query.trim(),
    notes: [],
    text: "",
    previewHtml: ""
  };
  if (detection.warning) base.notes.push(detection.warning);
  if (file.size === 0) base.notes.push("빈 파일입니다. 파일명과 형식 정보만 확인할 수 있습니다.");

  if (mode === "hex") return inspectViewerAsHex(file, base);
  if (mode === "archive") return inspectViewerWithFallback(() => inspectViewerAsArchive(file, base), file, base, "압축 구조로 열지 못해 원시 바이트 보기로 전환했습니다.");
  if (mode === "table") return inspectViewerWithFallback(() => inspectViewerAsTable(file, base, options), file, base, "표 구조로 읽지 못해 원시 바이트 보기로 전환했습니다.");
  if (mode === "office") return inspectViewerWithFallback(() => inspectViewerAsOfficeText(file, base, options), file, base, "문서 내부 텍스트를 읽지 못해 원시 바이트 보기로 전환했습니다.");
  if (mode === "text") return inspectViewerAsText(file, base, options);

  if (detected === "font") return inspectViewerWithFallback(() => inspectViewerAsFont(file, base), file, base, "폰트 미리보기를 만들지 못해 원시 바이트 보기로 전환했습니다.");
  if (detected === "markdown") return inspectViewerAsMarkdown(file, base, options);
  if (detected === "json") return inspectViewerAsJson(file, base, options);
  if (detected === "xml") return inspectViewerAsXml(file, base, options);
  if (detected === "calendar") return inspectViewerAsCalendar(file, base, options);
  if (detected === "contact") return inspectViewerAsContact(file, base, options);
  if (detected === "email") return inspectViewerAsEmail(file, base, options);
  if (detected === "svg") return inspectViewerAsSvg(file, base, options);
  if (detected === "config") return inspectViewerAsConfig(file, base, options);
  if (detected === "subtitle") return inspectViewerAsSubtitle(file, base, options);
  if (detected === "log") return inspectViewerAsLog(file, base, options);
  if (detected === "code") return inspectViewerAsCode(file, base, options);
  if (detected === "rtf") return inspectViewerAsRtf(file, base, options);
  if (detected === "epub") return inspectViewerAsEpubWithFallback(file, base, options);
  if (detected === "image") return inspectViewerAsImage(file, base);
  if (detected === "pdf") return inspectViewerAsPdf(file, base);
  if (detected === "audio" || detected === "video") return inspectViewerAsMedia(file, base, detected);
  if (detected === "table") return inspectViewerWithFallback(() => inspectViewerAsTable(file, base, options), file, base, "표 구조로 읽지 못해 원시 바이트 보기로 전환했습니다.");
  if (detected === "office-text") return inspectViewerWithFallback(() => inspectViewerAsOfficeText(file, base, options), file, base, "문서 내부 텍스트를 읽지 못해 원시 바이트 보기로 전환했습니다.");
  if (detected === "archive") return inspectViewerWithFallback(() => inspectViewerAsArchive(file, base), file, base, "압축 구조로 열지 못해 원시 바이트 보기로 전환했습니다.");
  if (detected === "text") return inspectViewerAsText(file, base, options);
  return inspectViewerAsHex(file, base, "브라우저가 바로 표시하기 어려운 바이너리 파일입니다. 파일 정보와 앞부분 바이트를 보여줍니다.");
}

async function inspectViewerWithFallback(action, file, base, message) {
  try {
    return await action();
  } catch {
    if (!base.notes.includes(message)) base.notes.push(message);
    return inspectViewerAsHex(file, base, "대체 보기로 파일 앞부분 바이트를 표시합니다.");
  }
}

async function detectViewerKind(file) {
  const ext = extensionOf(file.name);
  const mime = file.type || "";
  const signature = await sniffViewerSignature(file, ext).catch(() => ({ kind: "", label: "" }));
  const extKind = viewerKindFromExtension(ext);
  const nameKind = viewerKindFromFileName(file.name);
  const mimeKind = viewerKindFromMime(mime);
  const signatureKind = (extKind === "config" || nameKind === "config") && ["code", "text"].includes(signature.kind) ? "" : signature.kind;
  const kind = signatureKind || extKind || nameKind || mimeKind || (isViewerTextFile(file) ? "text" : "binary");
  const label = signatureKind ? signature.label || viewerKindLabel(kind, ext, mime) : viewerKindLabel(kind, ext, mime);
  const warning =
    signatureKind && extKind && signatureKind !== extKind && !viewerKindsCompatible(signatureKind, extKind)
      ? `확장자는 .${ext}이지만 내부 서명은 ${signature.label}로 보입니다. 내부 서명 기준으로 표시합니다.`
      : "";
  return { kind, label, warning };
}

function viewerKindFromExtension(ext) {
  if (ext === "pdf") return "pdf";
  if (["ttf", "otf", "woff", "woff2"].includes(ext)) return "font";
  if (ext === "svg") return "svg";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "avif", "ico"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "m4v", "ogv", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(ext)) return "audio";
  if (["md", "markdown"].includes(ext)) return "markdown";
  if (["json", "jsonl", "ndjson", "geojson", "webmanifest"].includes(ext)) return "json";
  if (["xml", "xhtml", "plist", "kml", "gpx"].includes(ext)) return "xml";
  if (["ics", "ifb"].includes(ext)) return "calendar";
  if (["vcf", "vcard"].includes(ext)) return "contact";
  if (["eml"].includes(ext)) return "email";
  if (["yml", "yaml", "toml", "ini", "env", "properties"].includes(ext)) return "config";
  if (["srt", "vtt"].includes(ext)) return "subtitle";
  if (ext === "log") return "log";
  if (ext === "rtf") return "rtf";
  if (ext === "epub") return "epub";
  if (isViewerCodeExtension(ext)) return "code";
  if (["csv", "tsv", "xlsx", "xlsm", "xltx", "ods"].includes(ext)) return "table";
  if (["docx", "docm", "pptx", "pptm", "hwpx", "odt", "odp"].includes(ext)) return "office-text";
  if (["zip", "jar", "cbz", "apk", "ipa", "vsix", "pages", "numbers", "key"].includes(ext)) return "archive";
  if (["xls", "xlsb", "doc", "ppt", "hwp"].includes(ext)) return "binary";
  if (isViewerTextExtension(ext)) return "text";
  return "";
}

function viewerKindFromFileName(name) {
  const lower = String(name || "").toLowerCase().split(/[\\/]/).pop() || "";
  if (/^\.env(?:\.|$)/.test(lower) || lower.endsWith(".env")) return "config";
  if (["dockerfile", "makefile", "rakefile", "gemfile", "procfile"].includes(lower)) return "code";
  if ([".gitignore", ".gitattributes", ".npmrc", ".yarnrc", ".editorconfig"].includes(lower)) return "config";
  return "";
}

function viewerKindFromMime(mime) {
  if (!mime) return "";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("font/") || mime.includes("font-") || mime.includes("font")) return "font";
  if (mime === "image/svg+xml") return "svg";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "text/markdown") return "markdown";
  if (mime === "application/json" || mime.endsWith("+json")) return "json";
  if (mime === "application/xml" || mime.endsWith("+xml")) return "xml";
  if (mime === "text/calendar") return "calendar";
  if (mime === "text/vcard" || mime === "text/x-vcard") return "contact";
  if (mime === "message/rfc822") return "email";
  if (mime === "text/vtt") return "subtitle";
  if (mime === "application/rtf" || mime === "text/rtf") return "rtf";
  if (mime.includes("yaml") || mime.includes("toml") || mime.includes("ini")) return "config";
  if (mime.includes("epub")) return "epub";
  if (mime === "application/javascript" || mime === "text/javascript" || mime.includes("x-sh")) return "code";
  if (mime.startsWith("text/") || mime.endsWith("+json") || mime.endsWith("+xml")) return "text";
  if (mime.includes("spreadsheet") || mime.includes("csv")) return "table";
  if (mime.includes("wordprocessing") || mime.includes("presentation") || mime.includes("opendocument")) return "office-text";
  if (mime.includes("zip") || mime.includes("archive")) return "archive";
  return "";
}

function viewerKindsCompatible(a, b) {
  const zipFamily = new Set(["archive", "office-text", "table"]);
  if (zipFamily.has(a) && zipFamily.has(b)) return true;
  if ((a === "svg" && ["image", "xml", "text"].includes(b)) || (b === "svg" && ["image", "xml", "text"].includes(a))) return true;
  return a === b;
}

async function sniffViewerSignature(file, ext) {
  const bytes = new Uint8Array(await file.slice(0, 560).arrayBuffer());
  if (!bytes.length) return { kind: viewerKindFromExtension(ext) || "text", label: "빈 파일" };
  const ascii = bytesToAscii(bytes);
  if (ascii.startsWith("%PDF-")) return { kind: "pdf", label: "PDF 서명" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { kind: "image", label: "JPEG 이미지" };
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "image", label: "PNG 이미지" };
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) return { kind: "image", label: "GIF 이미지" };
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return { kind: "image", label: "WebP 이미지" };
  if (ascii.startsWith("BM")) return { kind: "image", label: "BMP 이미지" };
  if (ascii.slice(4, 8) === "ftyp" && /avif|avis/.test(ascii.slice(8, 24))) return { kind: "image", label: "AVIF 이미지" };
  if (ascii.slice(4, 8) === "ftyp") return { kind: "video", label: "MP4/MOV 계열 미디어" };
  if (startsWithBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: "video", label: "WebM/MKV 계열 미디어" };
  if (ascii.startsWith("ID3") || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return { kind: "audio", label: "MP3 오디오" };
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WAVE") return { kind: "audio", label: "WAV 오디오" };
  if (ascii.startsWith("OggS")) return { kind: "audio", label: "OGG 미디어" };
  if (ascii.startsWith("fLaC")) return { kind: "audio", label: "FLAC 오디오" };
  if (startsWithBytes(bytes, [0x00, 0x01, 0x00, 0x00])) return { kind: "font", label: "TrueType 폰트" };
  if (ascii.startsWith("OTTO")) return { kind: "font", label: "OpenType 폰트" };
  if (ascii.startsWith("wOFF")) return { kind: "font", label: "WOFF 폰트" };
  if (ascii.startsWith("wOF2")) return { kind: "font", label: "WOFF2 폰트" };
  if (startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWithBytes(bytes, [0x50, 0x4b, 0x05, 0x06]) || startsWithBytes(bytes, [0x50, 0x4b, 0x07, 0x08])) {
    return { kind: viewerKindFromExtension(ext) || "archive", label: ext ? `ZIP 기반 .${ext}` : "ZIP 압축" };
  }
  if (startsWithBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { kind: "binary", label: "구형 Office/OLE 바이너리" };
  if (ascii.startsWith("HWP Document File")) return { kind: "binary", label: "HWP 바이너리 문서" };
  const leading = decodeAsciiPreview(bytes).trimStart().slice(0, 80).toLowerCase();
  if (leading.startsWith("{\\rtf")) return { kind: "rtf", label: "RTF 문서" };
  if (leading.startsWith("webvtt")) return { kind: "subtitle", label: "WebVTT 자막" };
  if (leading.startsWith("<svg") || ext === "svg" && leading.startsWith("<?xml") || leading.startsWith("<?xml") && leading.includes("<svg")) return { kind: "svg", label: "SVG 벡터 이미지" };
  if (leading.startsWith("#!") || leading.startsWith("import ") || leading.startsWith("export ") || leading.startsWith("function ")) return { kind: "code", label: "코드 텍스트" };
  if (leading.startsWith("{") || leading.startsWith("[") || leading.startsWith("<!doctype") || leading.startsWith("<html") || leading.startsWith("<?xml")) {
    if (leading.startsWith("{") || leading.startsWith("[")) return { kind: "json", label: "JSON 텍스트" };
    if (leading.startsWith("<?xml")) return { kind: "xml", label: "XML 텍스트" };
    return { kind: "text", label: "텍스트 기반 문서" };
  }
  return { kind: "", label: "" };
}

function isViewerCodeExtension(ext) {
  return ["js", "mjs", "cjs", "ts", "tsx", "jsx", "py", "java", "c", "cpp", "h", "go", "rs", "php", "rb", "vue", "svelte", "sh", "bat", "ps1", "sql"].includes(ext);
}

function startsWithBytes(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function bytesToAscii(bytes) {
  return [...bytes].map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "\u0000")).join("");
}

function decodeAsciiPreview(bytes) {
  return [...bytes].map((byte) => (byte >= 9 && byte <= 126 ? String.fromCharCode(byte) : " ")).join("");
}

function viewerKindLabel(kind, ext, mime) {
  if (ext) return `.${ext} ${kind}`;
  if (mime) return mime;
  return kind || "알 수 없음";
}

function isViewerTextFile(file) {
  const ext = extensionOf(file.name);
  const mime = file.type || "";
  return (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml" ||
    mime === "application/javascript" ||
    mime.endsWith("+json") ||
    mime.endsWith("+xml") ||
    Boolean(viewerKindFromFileName(file.name)) ||
    isViewerTextExtension(ext)
  );
}

function isViewerTextExtension(ext) {
  return [
    "txt",
    "md",
      "markdown",
      "jsonl",
      "ndjson",
      "geojson",
      "webmanifest",
      "json",
      "xml",
      "xhtml",
      "plist",
      "kml",
      "gpx",
      "html",
      "htm",
      "svg",
      "css",
      "scss",
      "sass",
      "less",
      "js",
    "mjs",
    "cjs",
    "ts",
    "tsx",
    "jsx",
    "yml",
    "yaml",
    "log",
    "ini",
    "env",
    "toml",
    "properties",
    "sql",
    "rtf",
      "srt",
      "vtt",
      "ics",
      "ifb",
      "vcf",
      "vcard",
      "eml",
      "py",
    "java",
    "c",
    "cpp",
    "h",
    "go",
    "rs",
    "php",
    "rb",
    "vue",
    "svelte",
    "sh",
    "bat",
    "ps1",
    "csv",
    "tsv"
  ].includes(ext);
}

async function inspectViewerAsImage(file, base) {
  const url = createViewerObjectUrl(file);
  const dimensions = await readImageDimensions(url).catch(() => null);
  return {
    ...base,
    kindLabel: "이미지",
    title: "이미지 미리보기",
    message: "브라우저 내장 이미지 표시로 원본을 바로 확인합니다.",
    detail: dimensions ? `${dimensions.width}×${dimensions.height}px · ${ratioLabel(dimensions.width, dimensions.height)}` : "크기 확인 불가",
    previewHtml: `
      <figure class="viewer-media image-viewer">
        <img src="${url}" alt="${escapeAttr(file.name)} 미리보기" />
        <figcaption>${escapeHtml(file.name)}</figcaption>
      </figure>
    `
  };
}

async function inspectViewerAsPdf(file, base) {
  const url = createViewerObjectUrl(file);
  let pageCount = "-";
  try {
    const { PDFDocument } = await loadPdfLib();
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
    pageCount = pdf.getPageCount();
  } catch {
    base.notes.push("PDF 구조 정보는 읽지 못했습니다. 브라우저 내장 뷰어로 표시만 시도합니다.");
  }
  return {
    ...base,
    kindLabel: "PDF",
    title: "PDF 미리보기",
    message: "내장 PDF 뷰어로 열어 제출 전 페이지가 보이는지 확인합니다.",
    detail: `${pageCount}쪽`,
    previewHtml: `
      <object class="viewer-frame" data="${url}" type="application/pdf" aria-label="${escapeAttr(file.name)} PDF 미리보기">
        <p class="empty-result warn">이 브라우저에서 PDF 내장 보기가 막혔습니다. 원본 파일은 선택된 상태이며 파일 정보는 확인했습니다.</p>
      </object>
    `
  };
}

function inspectViewerAsMedia(file, base, kind) {
  const url = createViewerObjectUrl(file);
  const tag = kind === "video" ? "video" : "audio";
  const label = kind === "video" ? "영상" : "음성";
  return {
    ...base,
    kindLabel: label,
    title: `${label} 미리보기`,
    message: "브라우저 기본 플레이어로 재생 가능 여부를 확인합니다.",
    detail: file.type || extensionOf(file.name).toUpperCase(),
    previewHtml: `
      <div class="viewer-media">
        <${tag} controls preload="metadata" src="${url}"></${tag}>
      </div>
    `
  };
}

async function inspectViewerAsFont(file, base) {
  const url = createViewerObjectUrl(file);
  const family = `goatoolViewerFont_${Date.now().toString(36)}`;
  let loaded = false;
  try {
    const font = new FontFace(family, `url(${url})`);
    await font.load();
    document.fonts.add(font);
    loaded = true;
  } catch {
    base.notes.push("브라우저가 이 폰트를 바로 로드하지 못했습니다. 파일 정보와 샘플 영역만 표시합니다.");
  }
  return {
    ...base,
    kindLabel: "폰트",
    title: "폰트 미리보기",
    message: loaded ? "브라우저 FontFace로 폰트를 불러와 문장 샘플을 표시합니다." : "폰트 로드가 제한되어 기본 글꼴로 샘플을 표시합니다.",
    detail: extensionOf(file.name).toUpperCase(),
    previewHtml: renderViewerFontPreview(family, loaded, file.name)
  };
}

async function inspectViewerAsMarkdown(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  if (output.truncated) base.notes.push(`${formatBytes(LIMITS.viewerTextBytes)}까지만 읽었습니다.`);
  const stats = summarizeMarkdown(text);
  return {
    ...base,
    kindLabel: "Markdown",
    title: "Markdown 미리보기",
    message: `제목 ${stats.headings}개, 목록 ${stats.lists}개, 링크 ${stats.links}개를 읽었습니다.`,
    detail: `${text.split(/\r\n|\r|\n/).length.toLocaleString("ko-KR")}줄`,
    text,
    previewHtml: `${renderViewerMarkdownPreview(text)}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsJson(file, base, options) {
  const output = await readViewerText(file);
  let text = output.text;
  addViewerTextNotes(base, output);
  if (output.truncated) base.notes.push(`${formatBytes(LIMITS.viewerTextBytes)}까지만 읽었습니다.`);
  let parsed = null;
  let rows = [];
  const ext = extensionOf(file.name);
  try {
    if (["jsonl", "ndjson"].includes(ext)) {
      rows = text
        .split(/\r\n|\r|\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, LIMITS.viewerTableRows)
        .map((line) => JSON.parse(line));
      parsed = rows;
      text = rows.map((row) => JSON.stringify(row)).join("\n");
    } else {
      parsed = JSON.parse(text);
      text = JSON.stringify(parsed, null, 2);
    }
  } catch {
    base.notes.push("JSON 구조 파싱에는 실패했지만 원문은 표시합니다.");
  }
  const stats = parsed ? summarizeJsonValue(parsed) : null;
  return {
    ...base,
    kindLabel: "JSON",
    title: "JSON 구조 미리보기",
    message: stats ? `객체 ${stats.objects}개, 배열 ${stats.arrays}개, 값 ${stats.values}개를 확인했습니다.` : "JSON 원문을 읽기 전용으로 표시합니다.",
    detail: stats ? `${stats.keys.length.toLocaleString("ko-KR")}개 키` : `${text.length.toLocaleString("ko-KR")}자`,
    text,
    previewHtml: `${parsed ? renderViewerJsonSummary(parsed, stats) : ""}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsXml(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  if (output.truncated) base.notes.push(`${formatBytes(LIMITS.viewerTextBytes)}까지만 읽었습니다.`);
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) base.notes.push("XML 파싱 오류가 있어 원문 중심으로 표시합니다.");
  const outline = parserError ? null : summarizeXmlDocument(doc);
  return {
    ...base,
    kindLabel: "XML",
    title: "XML 구조 미리보기",
    message: outline ? `루트 ${outline.root} 아래 요소 ${outline.total.toLocaleString("ko-KR")}개를 확인했습니다.` : "XML 원문을 읽기 전용으로 표시합니다.",
    detail: outline ? `${outline.unique.length}개 태그` : `${text.length.toLocaleString("ko-KR")}자`,
    text,
    previewHtml: `${outline ? renderViewerXmlSummary(outline) : ""}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsCalendar(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  const events = parseIcsEvents(text).slice(0, LIMITS.viewerTableRows);
  return {
    ...base,
    kindLabel: "일정",
    title: "일정 파일 미리보기",
    message: events.length ? `${events.length}개 일정 후보를 표로 표시합니다.` : "일정 항목을 찾지 못해 원문을 표시합니다.",
    detail: `${events.length}개 일정`,
    text,
    previewHtml: `${events.length ? renderViewerEventTable(events) : ""}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsContact(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  const contacts = parseVcfContacts(text).slice(0, LIMITS.viewerTableRows);
  return {
    ...base,
    kindLabel: "연락처",
    title: "연락처 파일 미리보기",
    message: contacts.length ? `${contacts.length}개 연락처 후보를 표로 표시합니다.` : "연락처 항목을 찾지 못해 원문을 표시합니다.",
    detail: `${contacts.length}개 연락처`,
    text,
    previewHtml: `${contacts.length ? renderViewerContactTable(contacts) : ""}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsEmail(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  const email = parseEmlPreview(text);
  return {
    ...base,
    kindLabel: "이메일",
    title: "이메일 원문 미리보기",
    message: email.subject ? `"${email.subject}" 메일 헤더와 본문을 분리해 표시합니다.` : "메일 원문을 헤더와 본문으로 나눠 표시합니다.",
    detail: email.subject || "제목 없음",
    text,
    previewHtml: `${renderViewerEmailSummary(email)}${renderViewerTextPreview(email.body || text, options)}`
  };
}

async function inspectViewerAsSvg(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  const svg = summarizeSvg(text);
  if (!svg.safeSvg) base.notes.push("SVG 파싱 오류가 있어 원문 중심으로 표시합니다.");
  else if (svg.removed) base.notes.push(`보안을 위해 실행 가능 요소와 이벤트 속성 ${svg.removed}개를 제거했습니다.`);
  return {
    ...base,
    kindLabel: "SVG",
    title: "SVG 벡터 미리보기",
    message: svg.safeSvg ? `벡터 요소 ${svg.elements.toLocaleString("ko-KR")}개를 안전 미리보기로 표시합니다.` : "SVG 원문을 읽기 전용으로 표시합니다.",
    detail: svg.viewBox || svg.size || `${text.length.toLocaleString("ko-KR")}자`,
    text,
    previewHtml: `${svg.safeSvg ? renderViewerSvgPreview(svg) : ""}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsConfig(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  const summary = summarizeConfigText(text, extensionOf(file.name));
  const safeText = redactConfigText(text);
  if (safeText !== text) base.notes.push("민감값으로 보이는 설정값은 화면과 복사 텍스트에서 축약했습니다.");
  return {
    ...base,
    kindLabel: "설정",
    title: "설정 파일 미리보기",
    message: `키 ${summary.keys.length.toLocaleString("ko-KR")}개와 섹션 ${summary.sections.length.toLocaleString("ko-KR")}개를 요약했습니다.`,
    detail: `${summary.meaningfulLines.toLocaleString("ko-KR")}개 설정 줄`,
    text: safeText,
    previewHtml: `${renderViewerConfigSummary(summary)}${renderViewerTextPreview(safeText, options)}`
  };
}

async function inspectViewerAsSubtitle(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  const cues = parseSubtitleCues(text).slice(0, LIMITS.viewerTableRows);
  return {
    ...base,
    kindLabel: "자막",
    title: "자막 파일 미리보기",
    message: cues.length ? `${cues.length.toLocaleString("ko-KR")}개 자막 구간을 시간순으로 표시합니다.` : "자막 시간 구간을 찾지 못해 원문을 표시합니다.",
    detail: `${cues.length}개 구간`,
    text,
    previewHtml: `${cues.length ? renderViewerSubtitleTable(cues) : ""}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsLog(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  const summary = summarizeLogText(text);
  return {
    ...base,
    kindLabel: "로그",
    title: "로그 파일 미리보기",
    message: `오류 ${summary.counts.ERROR || 0}건, 경고 ${summary.counts.WARN || 0}건, 정보 ${summary.counts.INFO || 0}건을 우선 분류했습니다.`,
    detail: `${summary.lines.toLocaleString("ko-KR")}줄`,
    text,
    previewHtml: `${renderViewerLogSummary(summary)}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsCode(file, base, options) {
  const output = await readViewerText(file);
  const text = output.text;
  addViewerTextNotes(base, output);
  const summary = summarizeCodeText(text, extensionOf(file.name));
  return {
    ...base,
    kindLabel: "코드",
    title: "코드 파일 미리보기",
    message: `${summary.language} 코드로 보고 함수·클래스 ${summary.symbols.length}개, import ${summary.imports}개, TODO ${summary.todos}개를 찾았습니다.`,
    detail: `${summary.lines.toLocaleString("ko-KR")}줄`,
    text,
    previewHtml: `${renderViewerCodeSummary(summary)}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsRtf(file, base, options) {
  const output = await readViewerText(file);
  const source = output.text;
  addViewerTextNotes(base, output);
  const text = rtfToPlainViewerText(source);
  return {
    ...base,
    kindLabel: "RTF",
    title: "RTF 텍스트 미리보기",
    message: text ? "RTF 제어 코드를 걷어내고 본문 텍스트를 우선 표시합니다." : "RTF 본문을 추출하지 못해 원문을 표시합니다.",
    detail: text ? `${text.length.toLocaleString("ko-KR")}자` : `${source.length.toLocaleString("ko-KR")}자`,
    text: text || source,
    previewHtml: renderViewerTextPreview(text || source, options)
  };
}

async function inspectViewerAsEpub(file, base, options) {
  const epub = await readEpubPreview(file);
  if (epub.truncated) base.notes.push("전자책 본문이 길어 상위 일부 장만 표시합니다.");
  if (!epub.text) base.notes.push("전자책에서 바로 추출 가능한 본문을 찾지 못했습니다.");
  return {
    ...base,
    kindLabel: "전자책",
    title: "EPUB 전자책 미리보기",
    message: epub.title ? `"${epub.title}" 메타데이터와 목차 후보를 표시합니다.` : "EPUB 내부 메타데이터와 목차 후보를 표시합니다.",
    detail: epub.chapters.length ? `${epub.chapters.length.toLocaleString("ko-KR")}개 장` : "목차 없음",
    text: epub.text,
    previewHtml: `${renderViewerEpubSummary(epub)}${epub.text ? renderViewerTextPreview(epub.text, options) : ""}${renderViewerArchiveTable(epub.entries.slice(0, 80), epub.folderCount, Math.max(0, epub.entries.length - 80))}`
  };
}

async function inspectViewerAsEpubWithFallback(file, base, options) {
  try {
    return await inspectViewerAsEpub(file, base, options);
  } catch {
    const archiveMessage = "전자책 메타데이터를 읽지 못해 ZIP 내부 목록으로 전환했습니다.";
    if (!base.notes.includes(archiveMessage)) base.notes.push(archiveMessage);
    return inspectViewerWithFallback(
      () => inspectViewerAsArchive(file, base),
      file,
      base,
      "전자책과 압축 구조를 모두 읽지 못해 원시 바이트 보기로 전환했습니다."
    );
  }
}

async function inspectViewerAsText(file, base, options) {
  if (!isViewerTextFile(file) && options.mode === "text") {
    base.notes.push("텍스트 파일로 확정되지 않아 일부 문자가 깨질 수 있습니다.");
  }
  const output = await readViewerText(file);
  let text = output.text;
  addViewerTextNotes(base, output);
  if (["json"].includes(extensionOf(file.name))) {
    try {
      text = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      base.notes.push("JSON 형식 검증에는 실패했지만 원문은 표시합니다.");
    }
  }
  if (output.truncated) base.notes.push(`${formatBytes(LIMITS.viewerTextBytes)}까지만 읽었습니다.`);
  const hits = countViewerMatches(text, options.query);
  const htmlPreview = !options.safeOnly && ["html", "htm"].includes(extensionOf(file.name)) ? renderViewerHtmlPreview(text, file.name) : "";
  if (htmlPreview) base.notes.push("HTML은 sandbox 미리보기로 열었고 스크립트 권한은 주지 않았습니다.");
  const colors = extractViewerColors(text);
  const colorPreview = colors.length ? renderViewerColorPalette(colors) : "";
  return {
    ...base,
    kindLabel: "텍스트",
    title: "텍스트 미리보기",
    message: options.query ? `찾은 단어 ${hits}건을 표시합니다.` : "텍스트 내용을 읽기 전용으로 표시합니다.",
    detail: `${text.split(/\r\n|\r|\n/).length.toLocaleString("ko-KR")}줄`,
    text,
    previewHtml: `${htmlPreview}${colorPreview}${renderViewerTextPreview(text, options)}`
  };
}

async function inspectViewerAsTable(file, base, options) {
  const ext = extensionOf(file.name);
  let rows = [];
  let source = "";
  let truncated = false;
  if (["xls", "xlsb"].includes(ext)) {
    throw new Error("구형 Excel 바이너리는 브라우저 표 파서로 직접 열 수 없습니다.");
  }
  if (["xlsx", "xlsm", "xltx"].includes(ext)) {
    const preview = await readWorkbookPreview(file);
    rows = preview.rows;
    source = preview.sheetName ? `${preview.sheetName} 시트` : "첫 번째 시트";
    truncated = preview.truncated;
    if (preview.sheetCount > 1) base.notes.push(`통합문서에 ${preview.sheetCount}개 시트가 있어 첫 번째 시트만 미리보기로 표시합니다.`);
  } else if (ext === "ods") {
    const preview = await readOdsPreview(file);
    rows = preview.rows;
    source = preview.sheetName ? `${preview.sheetName} 시트` : "ODS 첫 번째 표";
    truncated = preview.truncated;
  } else {
    const preview = await readDelimitedPreview(file, ext === "tsv" ? "\t" : "auto");
    rows = preview.rows;
    source = preview.delimiterLabel ? `${ext === "tsv" ? "TSV" : "CSV"}(${preview.delimiterLabel})` : ext === "tsv" ? "TSV" : "CSV";
    truncated = preview.truncated;
    if (preview.encoding && preview.encoding !== "utf-8") base.notes.push(`${preview.encoding.toUpperCase()} 인코딩으로 해석했습니다.`);
    if (preview.binaryLike) base.notes.push("바이너리 바이트가 섞여 있어 표 일부가 깨질 수 있습니다.");
  }
  if (truncated) base.notes.push("상위 일부 행만 미리보기로 표시합니다.");
  const text = toCsv(rows);
  return {
    ...base,
    kindLabel: "표",
    title: "표 미리보기",
    message: `${source} 데이터를 상위 행 기준으로 보여줍니다.`,
    detail: `${rows.length}행`,
    text,
    previewHtml: renderViewerTable(rows, source)
  };
}

async function inspectViewerAsArchive(file, base) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files)
    .map((entry) => ({
      name: entry.name,
      originalName: entry.unsafeOriginalName || entry.name,
      dir: entry.dir,
      size: entry._data?.uncompressedSize || 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const files = entries.filter((entry) => !entry.dir);
  const folders = entries.filter((entry) => entry.dir);
  const totalUncompressed = files.reduce((sum, entry) => sum + entry.size, 0);
  const riskyPaths = files.filter((entry) => /(^\/|^[A-Za-z]:|(^|\/)\.\.(\/|$))/.test(entry.originalName)).slice(0, 5);
  const systemJunk = files.filter((entry) => entry.name.startsWith("__MACOSX/") || /(^|\/)\.DS_Store$/.test(entry.name)).length;
  if (entries.length > LIMITS.viewerArchiveEntries) base.notes.push(`내부 항목이 많아 상위 ${LIMITS.viewerArchiveEntries.toLocaleString("ko-KR")}개 기준으로 표시합니다.`);
  if (riskyPaths.length) base.notes.push(`상위 폴더로 빠져나가는 위험 경로 후보가 있습니다: ${riskyPaths.map((entry) => entry.originalName).join(", ")}`);
  if (systemJunk) base.notes.push(`제출과 무관한 macOS 시스템 항목 ${systemJunk}개가 보입니다.`);
  const text = entries.map((entry) => `${entry.dir ? "[폴더]" : "[파일]"} ${entry.originalName || entry.name}${entry.size ? ` / ${formatBytes(entry.size)}` : ""}`).join("\n");
  return {
    ...base,
    kindLabel: "압축",
    title: "압축 내부 보기",
    message: `ZIP 기반 파일의 내부 목록을 열어 표시합니다. 압축 해제 예상 용량은 ${formatBytes(totalUncompressed)}입니다.`,
    detail: `${files.length}개 파일`,
    text,
    previewHtml: renderViewerArchiveTable(files.slice(0, Math.min(220, LIMITS.viewerArchiveEntries)), folders.length, Math.max(0, files.length - 220))
  };
}

async function inspectViewerAsOfficeText(file, base, options) {
  const extracted = await extractOfficeText(file);
  const text = extracted.text || "";
  const fallback = text ? renderViewerTextPreview(text, options) : `<p class="empty-result warn">추출 가능한 텍스트를 찾지 못했습니다. 내부 파일 목록으로 구조만 확인하세요.</p>`;
  const archive = extracted.entries?.length ? renderViewerArchiveTable(extracted.entries.slice(0, 80), extracted.folderCount || 0, Math.max(0, extracted.entries.length - 80)) : "";
  if (extracted.truncated) base.notes.push("문서 텍스트가 길어 상위 일부만 표시합니다.");
  if (extracted.skipped) base.notes.push(`읽을 수 없는 내부 XML ${extracted.skipped}개는 건너뛰었습니다.`);
  return {
    ...base,
    kindLabel: "문서",
    title: "문서 텍스트 미리보기",
    message: `${extensionOf(file.name).toUpperCase()} 내부 XML에서 텍스트를 추출했습니다.`,
    detail: text ? `${text.length.toLocaleString("ko-KR")}자` : "텍스트 없음",
    text,
    previewHtml: `${fallback}${archive}`
  };
}

async function inspectViewerAsHex(file, base, message = "파일 앞부분 바이트를 원시 미리보기로 표시합니다.") {
  const hex = await readHexPreview(file);
  return {
    ...base,
    kindLabel: "바이너리",
    title: "원시 바이트 미리보기",
    message,
    detail: `${Math.min(file.size, LIMITS.viewerHexBytes).toLocaleString("ko-KR")}바이트`,
    text: hex,
    previewHtml: `<pre class="viewer-text hex-viewer">${escapeHtml(hex)}</pre>`
  };
}

function createViewerObjectUrl(file) {
  if (state.lastViewerObjectUrl) URL.revokeObjectURL(state.lastViewerObjectUrl);
  state.lastViewerObjectUrl = URL.createObjectURL(file);
  return state.lastViewerObjectUrl;
}

function readImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = url;
  });
}

async function readViewerText(file) {
  const truncated = file.size > LIMITS.viewerTextBytes;
  const blob = truncated ? file.slice(0, LIMITS.viewerTextBytes) : file;
  const buffer = await blob.arrayBuffer();
  const decoded = decodeViewerTextBuffer(buffer);
  return {
    text: decoded.text.slice(0, LIMITS.viewerPreviewChars),
    truncated: truncated || decoded.text.length > LIMITS.viewerPreviewChars,
    encoding: decoded.encoding,
    binaryLike: decoded.binaryLike
  };
}

async function readDelimitedPreview(file, delimiter) {
  const output = await readViewerText(file);
  const delimiterInfo = delimiter === "auto" ? detectViewerDelimiter(output.text) : { delimiter, label: delimiter === "\t" ? "탭" : "쉼표" };
  const rows = parseDelimited(output.text, delimiterInfo.delimiter);
  return {
    rows: rows.slice(0, LIMITS.viewerTableRows).map((row) => row.slice(0, LIMITS.viewerTableCols)),
    truncated: output.truncated || rows.length > LIMITS.viewerTableRows || rows.some((row) => row.length > LIMITS.viewerTableCols),
    delimiterLabel: delimiterInfo.label,
    encoding: output.encoding,
    binaryLike: output.binaryLike
  };
}

async function readWorkbookPreview(file) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { rows: [], sheetName: "", truncated: false };
  const rows = [];
  const rowLimit = LIMITS.viewerTableRows;
  const colLimit = Math.min(worksheet.columnCount || LIMITS.viewerTableCols, LIMITS.viewerTableCols);
  for (let rowIndex = 1; rowIndex <= Math.min(worksheet.rowCount, rowLimit); rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    const values = [];
    for (let colIndex = 1; colIndex <= colLimit; colIndex += 1) {
      values.push(normalizeExcelValue(row.getCell(colIndex).value));
    }
    rows.push(values);
  }
  return { rows, sheetName: worksheet.name, sheetCount: workbook.worksheets.length, truncated: worksheet.rowCount > rowLimit || worksheet.columnCount > colLimit };
}

async function readOdsPreview(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const content = zip.file("content.xml");
  if (!content) throw new Error("ODS content.xml not found");
  const xml = await content.async("text");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error("ODS XML parse failed");
  const table = [...doc.getElementsByTagName("*")].find((node) => node.localName === "table");
  if (!table) return { rows: [], sheetName: "", truncated: false };
  const rows = [];
  const tableName = table.getAttribute("table:name") || table.getAttribute("name") || "";
  const rowNodes = [...table.children].filter((node) => node.localName === "table-row");
  for (const rowNode of rowNodes.slice(0, LIMITS.viewerTableRows)) {
    const row = [];
    const repeatRows = Math.min(Number(rowNode.getAttribute("table:number-rows-repeated") || 1), LIMITS.viewerTableRows - rows.length);
    const cellNodes = [...rowNode.children].filter((node) => node.localName === "table-cell" || node.localName === "covered-table-cell");
    cellNodes.forEach((cellNode) => {
      const repeat = Math.min(Number(cellNode.getAttribute("table:number-columns-repeated") || 1), LIMITS.viewerTableCols - row.length);
      const cellText = [...cellNode.getElementsByTagName("*")]
        .filter((node) => node.localName === "p")
        .map((node) => node.textContent || "")
        .join("\n");
      for (let index = 0; index < repeat; index += 1) row.push(cellText);
    });
    for (let index = 0; index < repeatRows; index += 1) rows.push(row.slice(0, LIMITS.viewerTableCols));
    if (rows.length >= LIMITS.viewerTableRows) break;
  }
  return { rows, sheetName: tableName, truncated: rowNodes.length > LIMITS.viewerTableRows || rows.some((row) => row.length > LIMITS.viewerTableCols) };
}

function decodeViewerTextBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  if (!bytes.length) return { text: "", encoding: "utf-8", binaryLike: false };
  const bom = detectTextBom(bytes);
  if (bom) {
    const text = new TextDecoder(bom.encoding).decode(bytes.slice(bom.offset));
    return { text: stripBom(text), encoding: bom.encoding, binaryLike: false };
  }

  const nullRatio = bytes.filter((byte) => byte === 0).length / bytes.length;
  const utf16Guess = guessUtf16Encoding(bytes);
  const labels = utf16Guess ? [utf16Guess, "utf-8", "euc-kr"] : ["utf-8", "euc-kr", "utf-16le", "utf-16be"];
  const candidates = labels
    .map((encoding) => {
      try {
        const text = new TextDecoder(encoding).decode(bytes);
        return { encoding, text: stripBom(text), score: scoreDecodedText(text) };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);
  const best = candidates[0] || { encoding: "utf-8", text: new TextDecoder().decode(bytes) };
  return { text: best.text, encoding: best.encoding, binaryLike: nullRatio > 0.05 && !best.encoding.startsWith("utf-16") };
}

function detectTextBom(bytes) {
  if (startsWithBytes(bytes, [0xef, 0xbb, 0xbf])) return { encoding: "utf-8", offset: 3 };
  if (startsWithBytes(bytes, [0xff, 0xfe])) return { encoding: "utf-16le", offset: 2 };
  if (startsWithBytes(bytes, [0xfe, 0xff])) return { encoding: "utf-16be", offset: 2 };
  return null;
}

function guessUtf16Encoding(bytes) {
  const sample = bytes.slice(0, Math.min(bytes.length, 200));
  let evenNulls = 0;
  let oddNulls = 0;
  sample.forEach((byte, index) => {
    if (byte === 0 && index % 2 === 0) evenNulls += 1;
    if (byte === 0 && index % 2 === 1) oddNulls += 1;
  });
  if (oddNulls > sample.length * 0.25) return "utf-16le";
  if (evenNulls > sample.length * 0.25) return "utf-16be";
  return "";
}

function scoreDecodedText(text) {
  const replacement = (text.match(/\uFFFD/g) || []).length;
  const controls = (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
  const hangul = (text.match(/[가-힣]/g) || []).length;
  const printable = text.replace(/\s/g, "").length;
  return replacement * 120 + controls * 10 - Math.min(hangul, 80) - Math.min(printable, 200) * 0.01;
}

function stripBom(text) {
  return String(text || "").replace(/^\uFEFF/, "");
}

function detectViewerDelimiter(text) {
  const candidates = [
    { delimiter: ",", label: "쉼표" },
    { delimiter: "\t", label: "탭" },
    { delimiter: ";", label: "세미콜론" },
    { delimiter: "|", label: "파이프" }
  ];
  const lines = String(text || "")
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim())
    .slice(0, 20);
  const ranked = candidates
    .map((candidate) => {
      const counts = lines.map((line) => splitDelimitedLine(line, candidate.delimiter).length);
      const useful = counts.filter((count) => count > 1);
      const variance = useful.length ? Math.max(...useful) - Math.min(...useful) : 99;
      return { ...candidate, score: useful.length * 20 + Math.max(0, Math.min(...useful, 0)) - variance * 4 };
    })
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score > 0 ? ranked[0] : candidates[0];
}

async function extractOfficeText(file) {
  const ext = extensionOf(file.name);
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const candidates = entries.filter((entry) => !entry.dir && isOfficeTextEntry(ext, entry.name)).slice(0, 24);
  let text = "";
  let skipped = 0;
  for (const entry of candidates) {
    try {
      const xml = await entry.async("text");
      const extracted = xmlMarkupToText(xml);
      if (extracted) text += `${text ? "\n\n" : ""}[${entry.name}]\n${extracted}`;
      if (text.length > LIMITS.viewerPreviewChars) break;
    } catch {
      skipped += 1;
    }
  }
  const fileEntries = entries
    .filter((entry) => !entry.dir)
    .map((entry) => ({
      name: entry.name,
      dir: false,
      size: entry._data?.uncompressedSize || 0
    }));
  return {
    text: text.slice(0, LIMITS.viewerPreviewChars),
    truncated: text.length > LIMITS.viewerPreviewChars,
    skipped,
    entries: fileEntries,
    folderCount: entries.filter((entry) => entry.dir).length
  };
}

function isOfficeTextEntry(ext, name) {
  const lower = name.toLowerCase();
  if (["docx", "docm"].includes(ext)) return /^word\/(document|header|footer|footnotes|endnotes).*\.xml$/.test(lower);
  if (["pptx", "pptm"].includes(ext)) return /^ppt\/slides\/slide\d+\.xml$/.test(lower) || /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(lower);
  if (ext === "hwpx") return lower.endsWith(".xml") && (lower.includes("contents/") || lower.includes("bodytext/") || lower.includes("section"));
  if (["odt", "odp", "epub"].includes(ext)) return lower === "content.xml" || lower.endsWith(".xhtml") || lower.endsWith(".html");
  return lower.endsWith(".xml");
}

function xmlMarkupToText(xml) {
  return decodeHtmlEntities(
    String(xml || "")
      .replace(/<w:tab\s*\/>/gi, "\t")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:w:p|a:p|hp:p|text:p|p|h[1-6]|tr)>/gi, "\n")
      .replace(/<\/(?:w:tbl|table)>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

function decodeHtmlEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

async function readHexPreview(file) {
  const buffer = await file.slice(0, LIMITS.viewerHexBytes).arrayBuffer();
  const bytes = [...new Uint8Array(buffer)];
  const lines = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const chunk = bytes.slice(offset, offset + 16);
    const hex = chunk.map((byte) => byte.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const ascii = chunk.map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".")).join("");
    lines.push(`${offset.toString(16).padStart(8, "0")}  ${hex}  ${ascii}`);
  }
  return lines.join("\n");
}

function renderFileViewerResult(output) {
  const hitCount = output.text && output.query ? countViewerMatches(output.text, output.query) : 0;
  return `
    <div class="stat-grid">
      <div><span>보기 형식</span><strong>${escapeHtml(output.kindLabel || "-")}</strong></div>
      <div><span>용량</span><strong>${formatBytes(output.size)}</strong></div>
      <div><span>${output.query ? "검색 결과" : "세부 정보"}</span><strong>${output.query ? `${hitCount}건` : escapeHtml(output.detail || output.extension)}</strong></div>
    </div>
    <div class="result-block compact-result">
      <h3>${escapeHtml(output.title || "파일 미리보기")}</h3>
      <p>${escapeHtml(output.message || "파일 정보를 확인했습니다.")}</p>
      ${
        output.notes?.length
          ? `<ul class="warning-list">${output.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
          : ""
      }
    </div>
    <div class="viewer-meta">
      <span>${escapeHtml(output.fileName)}</span>
      <span>.${escapeHtml(output.extension)}</span>
      <span>${escapeHtml(output.mime)}</span>
      <span>판별: ${escapeHtml(output.detectedLabel || output.kindLabel || "-")}</span>
      <span>${escapeHtml(output.modified)}</span>
    </div>
    ${output.previewHtml}
  `;
}

function renderViewerTextPreview(text, options) {
  const lines = String(text || "").split(/\r\n|\r|\n/).slice(0, 520);
  const hidden = Math.max(0, String(text || "").split(/\r\n|\r|\n/).length - lines.length);
  const body = lines
    .map((line, index) => {
      const content = highlightViewerQuery(escapeHtml(line || " "), options.query);
      if (!options.lineNumbers) return `<span class="viewer-line"><span class="viewer-line-body">${content}</span></span>`;
      return `<span class="viewer-line"><span class="viewer-line-no">${index + 1}</span><span class="viewer-line-body">${content}</span></span>`;
    })
    .join("");
  return `
    <pre class="viewer-text ${options.lineNumbers ? "with-lines" : ""}">${body}</pre>
    ${hidden ? `<p class="helper-text">아래 ${hidden.toLocaleString("ko-KR")}줄은 미리보기에서 생략했습니다. TXT 저장으로 추출 텍스트를 확인하세요.</p>` : ""}
  `;
}

function renderViewerHtmlPreview(html, fileName) {
  const safeHtml = sanitizeViewerHtml(html);
  return `
    <iframe
      class="viewer-frame html-viewer"
      sandbox
      srcdoc="${escapeAttr(safeHtml)}"
      title="${escapeAttr(fileName)} HTML 미리보기"
    ></iframe>
  `;
}

function sanitizeViewerHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ""), "text/html");
  doc.querySelectorAll("script, iframe, object, embed, applet, frame, frameset, meta[http-equiv], link[rel='preload']").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || "").trim();
      if (name.startsWith("on")) node.removeAttribute(attr.name);
      if (["href", "src", "xlink:href", "formaction"].includes(name) && /^(javascript:|data:text\/html)/i.test(value)) {
        node.setAttribute(attr.name, "#");
      }
    });
  });
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

function addViewerTextNotes(base, output) {
  if (output.binaryLike) base.notes.push("바이너리 성격의 바이트가 섞여 있어 텍스트가 일부 깨질 수 있습니다.");
  if (output.encoding && output.encoding !== "utf-8") base.notes.push(`${output.encoding.toUpperCase()} 인코딩으로 해석했습니다.`);
}

function renderViewerFontPreview(family, loaded, fileName) {
  const fontFamily = loaded ? `"${family}", "Noto Sans KR", sans-serif` : `"Noto Sans KR", system-ui, sans-serif`;
  const samples = [
    "goatool 제출 파일 미리보기",
    "가나다라마바사 ABCDEFG 1234567890",
    "The quick brown fox jumps over the lazy dog."
  ];
  return `
    <div class="viewer-rich font-preview">
      <div class="viewer-summary-grid">
        <div><span>파일</span><strong>${escapeHtml(fileName)}</strong></div>
        <div><span>로드 상태</span><strong>${loaded ? "미리보기 가능" : "기본 글꼴 대체"}</strong></div>
      </div>
      <div class="font-preview-sample" style="font-family: ${escapeAttr(fontFamily)}">
        ${samples.map((sample) => `<p>${escapeHtml(sample)}</p>`).join("")}
      </div>
    </div>
  `;
}

function summarizeMarkdown(text) {
  const lines = String(text || "").split(/\r\n|\r|\n/);
  return {
    headings: lines.filter((line) => /^#{1,6}\s+/.test(line)).length,
    lists: lines.filter((line) => /^\s*(?:[-*+]|\d+\.)\s+/.test(line)).length,
    links: (String(text || "").match(/\[[^\]]+\]\([^)]+\)/g) || []).length
  };
}

function renderViewerMarkdownPreview(text) {
  const html = markdownToViewerHtml(String(text || "").slice(0, LIMITS.viewerPreviewChars));
  return `
    <div class="viewer-rich markdown-preview">
      ${html || `<p>표시할 Markdown 내용이 없습니다.</p>`}
    </div>
  `;
}

function markdownToViewerHtml(text) {
  const lines = String(text || "").split(/\r\n|\r|\n/).slice(0, 220);
  const html = [];
  let inList = false;
  let inCode = false;
  let codeLines = [];

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };
  const closeCode = () => {
    if (inCode) {
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      inCode = false;
      codeLines = [];
    }
  };

  lines.forEach((line) => {
    if (/^```/.test(line.trim())) {
      if (inCode) closeCode();
      else {
        closeList();
        inCode = true;
        codeLines = [];
      }
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(3, heading[1].length);
      html.push(`<h${level}>${inlineMarkdownToHtml(heading[2])}</h${level}>`);
      return;
    }
    const item = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.+)$/);
    if (item) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdownToHtml(item[1])}</li>`);
      return;
    }
    if (/^>\s?/.test(line)) {
      closeList();
      html.push(`<blockquote>${inlineMarkdownToHtml(line.replace(/^>\s?/, ""))}</blockquote>`);
      return;
    }
    closeList();
    if (line.trim()) html.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
  });
  closeCode();
  closeList();
  return html.join("");
}

function inlineMarkdownToHtml(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function summarizeJsonValue(value) {
  const stats = { objects: 0, arrays: 0, values: 0, keys: [] };
  const seenKeys = new Set();
  const walk = (item, depth = 0) => {
    if (depth > 8) return;
    if (Array.isArray(item)) {
      stats.arrays += 1;
      item.slice(0, 80).forEach((child) => walk(child, depth + 1));
      return;
    }
    if (item && typeof item === "object") {
      stats.objects += 1;
      Object.keys(item).forEach((key) => {
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          stats.keys.push(key);
        }
        walk(item[key], depth + 1);
      });
      return;
    }
    stats.values += 1;
  };
  walk(value);
  return stats;
}

function renderViewerJsonSummary(value, stats) {
  const arrayRows = Array.isArray(value) ? value.filter((row) => row && typeof row === "object" && !Array.isArray(row)).slice(0, 20) : [];
  const keys = stats.keys.slice(0, 24);
  return `
    <div class="viewer-rich">
      <div class="viewer-summary-grid">
        <div><span>객체</span><strong>${stats.objects}</strong></div>
        <div><span>배열</span><strong>${stats.arrays}</strong></div>
        <div><span>값</span><strong>${stats.values}</strong></div>
      </div>
      ${
        keys.length
          ? `<div class="viewer-pill-list">${keys.map((key) => `<span>${escapeHtml(key)}</span>`).join("")}</div>`
          : ""
      }
      ${arrayRows.length ? renderViewerTable(arrayRowsToCells(arrayRows), "JSON 배열") : ""}
    </div>
  `;
}

function arrayRowsToCells(rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].slice(0, LIMITS.viewerTableCols);
  return [keys, ...rows.map((row) => keys.map((key) => formatJsonCell(row[key])))];
}

function formatJsonCell(value) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function summarizeXmlDocument(doc) {
  const elements = [...doc.getElementsByTagName("*")];
  const counts = new Map();
  elements.forEach((element) => counts.set(element.nodeName, (counts.get(element.nodeName) || 0) + 1));
  return {
    root: doc.documentElement?.nodeName || "-",
    total: elements.length,
    unique: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30),
    outline: elements.slice(0, 80).map((element) => ({
      name: element.nodeName,
      attrs: element.attributes?.length || 0,
      text: String(element.textContent || "").trim().slice(0, 80)
    }))
  };
}

function renderViewerXmlSummary(outline) {
  return `
    <div class="viewer-rich">
      <div class="viewer-summary-grid">
        <div><span>루트</span><strong>${escapeHtml(outline.root)}</strong></div>
        <div><span>요소</span><strong>${outline.total}</strong></div>
        <div><span>태그 종류</span><strong>${outline.unique.length}</strong></div>
      </div>
      <div class="viewer-pill-list">${outline.unique.map(([name, count]) => `<span>${escapeHtml(name)} ${count}</span>`).join("")}</div>
      <div class="table-wrap viewer-table">
        <table>
          <thead><tr><th>태그</th><th>속성</th><th>텍스트 일부</th></tr></thead>
          <tbody>${outline.outline.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.attrs}</td><td>${escapeHtml(item.text)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function unfoldCalendarLines(text) {
  const lines = String(text || "").split(/\r\n|\r|\n/);
  const unfolded = [];
  lines.forEach((line) => {
    if (/^[ \t]/.test(line) && unfolded.length) unfolded[unfolded.length - 1] += line.slice(1);
    else unfolded.push(line);
  });
  return unfolded;
}

function parseStructuredLine(line) {
  const index = line.indexOf(":");
  const name = index < 0 ? line : line.slice(0, index);
  const parts = splitStructuredName(name);
  const key = (parts.shift() || "").trim().toUpperCase();
  return { key, value: index < 0 ? "" : line.slice(index + 1), params: parseStructuredParams(parts) };
}

function splitStructuredName(value) {
  const parts = [];
  let current = "";
  let quoted = false;
  String(value || "").split("").forEach((char) => {
    if (char === "\"") quoted = !quoted;
    if (char === ";" && !quoted) {
      parts.push(current);
      current = "";
      return;
    }
    current += char;
  });
  parts.push(current);
  return parts;
}

function parseStructuredParams(parts) {
  return parts.reduce((params, part) => {
    const index = part.indexOf("=");
    const rawName = index >= 0 ? part.slice(0, index) : part;
    const name = rawName.trim().toUpperCase();
    if (!name) return params;
    const rawValue = index >= 0 ? part.slice(index + 1).trim() : "true";
    params[name] = rawValue.replace(/^"(.*)"$/, "$1");
    return params;
  }, {});
}

function parseIcsEvents(text) {
  const events = [];
  let current = null;
  unfoldCalendarLines(text).forEach((line) => {
    const { key, value, params } = parseStructuredLine(line);
    if (key === "BEGIN" && value === "VEVENT") current = {};
    else if (key === "END" && value === "VEVENT" && current) {
      events.push(current);
      current = null;
    } else if (current && ["SUMMARY", "DTSTART", "DTEND", "LOCATION", "DESCRIPTION"].includes(key)) {
      current[key.toLowerCase()] = decodeStructuredText(value, params);
    }
  });
  return events;
}

function decodeIcsText(value) {
  return String(value || "").replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function decodeStructuredText(value, params = {}) {
  const encoding = String(params.ENCODING || "").trim().toUpperCase();
  const charset = params.CHARSET || "utf-8";
  if (encoding === "QUOTED-PRINTABLE" || encoding === "QP") {
    return decodeIcsText(decodeQuotedPrintable(value, charset));
  }
  if (encoding === "BASE64" || encoding === "B") {
    return decodeIcsText(decodeBase64Text(value, charset));
  }
  return decodeIcsText(decodeMimeHeader(value));
}

function renderViewerEventTable(events) {
  const rows = [["제목", "시작", "종료", "장소"], ...events.map((event) => [event.summary || "-", formatIcsDate(event.dtstart), formatIcsDate(event.dtend), event.location || "-"])];
  return renderViewerTable(rows, "일정");
}

function formatIcsDate(value) {
  if (!value) return "-";
  const match = String(value).match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!match) return value;
  return `${match[1]}-${match[2]}-${match[3]}${match[4] ? ` ${match[4]}:${match[5]}` : ""}`;
}

function parseVcfContacts(text) {
  const contacts = [];
  let current = null;
  unfoldCalendarLines(text).forEach((line) => {
    const { key, value, params } = parseStructuredLine(line);
    if (key === "BEGIN" && value === "VCARD") current = {};
    else if (key === "END" && value === "VCARD" && current) {
      contacts.push(current);
      current = null;
    } else if (current && ["FN", "ORG", "TEL", "EMAIL", "TITLE"].includes(key)) {
      appendContactField(current, key, decodeStructuredText(value, params));
    }
  });
  return contacts;
}

function appendContactField(contact, key, value) {
  const field = key.toLowerCase();
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return;
  contact[field] = contact[field] ? `${contact[field]}, ${cleanValue}` : cleanValue;
}

function renderViewerContactTable(contacts) {
  const rows = [["이름", "소속", "이메일", "전화"], ...contacts.map((contact) => [contact.fn || "-", contact.org || contact.title || "-", contact.email || "-", contact.tel || "-"])];
  return renderViewerTable(rows, "연락처");
}

function parseEmlPreview(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const root = splitEmailSection(normalized);
  const headers = parseEmailHeaders(root.headerText);
  let body = root.body;
  let bodyHeaders = headers;
  const boundary = getHeaderParam(headers["content-type"], "boundary");
  if (boundary && /multipart\//i.test(headers["content-type"] || "")) {
    const part = selectEmailTextPart(root.body, boundary);
    if (part) {
      body = part.body;
      bodyHeaders = part.headers;
    }
  }
  const contentType = bodyHeaders["content-type"] || headers["content-type"] || "";
  const decodedBody = decodeEmailBody(body, bodyHeaders);
  return {
    from: headers.from || "",
    to: headers.to || "",
    subject: headers.subject || "",
    date: headers.date || "",
    body: normalizeEmailBodyForPreview(decodedBody, contentType)
  };
}

function decodeMimeHeader(value) {
  return String(value || "").replace(/(\?=)\s+(=\?)/g, "$1$2").replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_match, charset, encoding, body) => {
    try {
      if (encoding.toUpperCase() === "Q") return decodeQuotedPrintable(body.replace(/_/g, " "), charset);
      return decodeBase64Text(body, charset);
    } catch {
      return body;
    }
  }).trim();
}

function parseEmailHeaders(headerText) {
  const headers = {};
  unfoldCalendarLines(headerText).forEach((line) => {
    const index = line.indexOf(":");
    if (index <= 0) return;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = decodeMimeHeader(line.slice(index + 1).trim());
    headers[key] = headers[key] ? `${headers[key]}, ${value}` : value;
  });
  return headers;
}

function splitEmailSection(source) {
  const normalized = String(source || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const splitIndex = normalized.search(/\n\n/);
  if (splitIndex < 0) return { headerText: normalized, body: "" };
  return { headerText: normalized.slice(0, splitIndex), body: normalized.slice(splitIndex + 2) };
}

function selectEmailTextPart(body, boundary) {
  const marker = `--${boundary}`;
  const parts = String(body || "")
    .split(marker)
    .slice(1)
    .map((part) => part.replace(/^\n/, ""))
    .filter((part) => part.trim() && !part.trim().startsWith("--"))
    .map((part) => {
      const section = splitEmailSection(part);
      return { headers: parseEmailHeaders(section.headerText), body: section.body };
    });
  const nested = parts
    .map((part) => {
      const nestedBoundary = getHeaderParam(part.headers["content-type"], "boundary");
      return nestedBoundary && /multipart\//i.test(part.headers["content-type"] || "") ? selectEmailTextPart(part.body, nestedBoundary) : null;
    })
    .find(Boolean);
  if (nested) return nested;
  return parts.find((part) => isInlineEmailTextPart(part, "text/plain")) || parts.find((part) => isInlineEmailTextPart(part, "text/html")) || null;
}

function isInlineEmailTextPart(part, mime) {
  const contentType = part.headers["content-type"] || "";
  const disposition = part.headers["content-disposition"] || "";
  return contentType.toLowerCase().includes(mime) && !/attachment/i.test(disposition);
}

function decodeEmailBody(body, headers) {
  const transferEncoding = String(headers["content-transfer-encoding"] || "").trim().toLowerCase();
  const charset = getHeaderParam(headers["content-type"], "charset") || "utf-8";
  if (transferEncoding === "quoted-printable") return decodeQuotedPrintable(body, charset);
  if (transferEncoding === "base64") return decodeBase64Text(body, charset);
  return String(body || "");
}

function normalizeEmailBodyForPreview(body, contentType) {
  const text = String(body || "");
  if (/text\/html/i.test(contentType || "")) return htmlToPlainViewerText(text);
  return text.replace(/\n{4,}/g, "\n\n\n").trim();
}

function htmlToPlainViewerText(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  doc.querySelectorAll("script, style, noscript, iframe, object, embed").forEach((node) => node.remove());
  return (doc.body?.textContent || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function getHeaderParam(value, name) {
  const match = String(value || "").match(new RegExp(`${escapeRegExp(name)}\\s*=\\s*(?:"([^"]*)"|([^;\\s]+))`, "i"));
  return match ? (match[1] || match[2] || "").trim() : "";
}

function decodeQuotedPrintable(value, charset = "utf-8") {
  return decodeBytesWithCharset(quotedPrintableToBytes(value), charset);
}

function quotedPrintableToBytes(value) {
  const source = String(value || "").replace(/=\r?\n/g, "");
  const bytes = [];
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const hex = source.slice(index + 1, index + 3);
    if (char === "=" && /^[0-9a-f]{2}$/i.test(hex)) {
      bytes.push(parseInt(hex, 16));
      index += 2;
      continue;
    }
    const code = char.charCodeAt(0);
    if (code <= 0xff) bytes.push(code);
    else bytes.push(...new TextEncoder().encode(char));
  }
  return new Uint8Array(bytes);
}

function decodeBase64Text(value, charset = "utf-8") {
  const compact = String(value || "").replace(/[^A-Za-z0-9+/=]/g, "");
  if (!compact) return "";
  const binary = atob(compact);
  return decodeBytesWithCharset(Uint8Array.from(binary, (char) => char.charCodeAt(0)), charset);
}

function decodeBytesWithCharset(bytes, charset = "utf-8") {
  const labels = [...new Set([normalizeTextCharset(charset), "utf-8", "euc-kr"].filter(Boolean))];
  const candidates = labels
    .map((label) => {
      try {
        const text = new TextDecoder(label).decode(bytes);
        return { text, score: scoreDecodedText(text) };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);
  return candidates[0]?.text || "";
}

function normalizeTextCharset(charset) {
  const label = String(charset || "utf-8").trim().toLowerCase().replace(/^"|"$/g, "").replace(/_/g, "-");
  if (!label || label === "utf8") return "utf-8";
  if (["ks-c-5601-1987", "ks-c-5601", "cp949", "ms949", "x-windows-949", "euc-kr"].includes(label)) return "euc-kr";
  if (label === "us-ascii" || label === "ascii") return "utf-8";
  return label;
}

function renderViewerEmailSummary(email) {
  return `
    <div class="viewer-rich">
      <div class="viewer-summary-grid email-summary">
        <div><span>제목</span><strong>${escapeHtml(email.subject || "-")}</strong></div>
        <div><span>보낸 사람</span><strong>${escapeHtml(email.from || "-")}</strong></div>
        <div><span>받는 사람</span><strong>${escapeHtml(email.to || "-")}</strong></div>
        <div><span>날짜</span><strong>${escapeHtml(email.date || "-")}</strong></div>
      </div>
    </div>
  `;
}

function summarizeSvg(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(text || ""), "image/svg+xml");
  if (doc.querySelector("parsererror") || doc.documentElement?.nodeName.toLowerCase() !== "svg") return { safeSvg: "", elements: 0, removed: 0, size: "", viewBox: "" };
  let removed = 0;
  doc.querySelectorAll("script, foreignObject, iframe, object, embed, audio, video, style").forEach((node) => {
    node.remove();
    removed += 1;
  });
  doc.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || "").trim();
      if (name.startsWith("on") || isUnsafeSvgAttribute(name, value)) {
        node.removeAttribute(attr.name);
        removed += 1;
      }
    });
  });
  const root = doc.documentElement;
  const width = root.getAttribute("width") || "";
  const height = root.getAttribute("height") || "";
  return {
    safeSvg: new XMLSerializer().serializeToString(root),
    elements: doc.getElementsByTagName("*").length,
    removed,
    size: width && height ? `${width}×${height}` : "",
    viewBox: root.getAttribute("viewBox") || ""
  };
}

function isUnsafeSvgAttribute(name, value) {
  if (["href", "xlink:href", "src"].includes(name)) {
    return value && !value.startsWith("#") && !/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value);
  }
  if (name === "style") return /url\s*\(/i.test(value);
  return /url\s*\(\s*['"]?(?:https?:|data:text\/html|javascript:)/i.test(value);
}

function renderViewerSvgPreview(svg) {
  const html = `<!doctype html><html><body style="margin:0;display:grid;place-items:center;min-height:360px;background:#f8fbfd;">${svg.safeSvg}</body></html>`;
  return `
    <div class="viewer-rich">
      <div class="viewer-summary-grid">
        <div><span>viewBox</span><strong>${escapeHtml(svg.viewBox || "-")}</strong></div>
        <div><span>크기</span><strong>${escapeHtml(svg.size || "-")}</strong></div>
        <div><span>요소</span><strong>${svg.elements}</strong></div>
      </div>
      <iframe class="viewer-frame svg-viewer" sandbox srcdoc="${escapeAttr(html)}" title="SVG 안전 미리보기"></iframe>
    </div>
  `;
}

function summarizeConfigText(text, ext) {
  const lines = String(text || "").split(/\r\n|\r|\n/);
  const keys = [];
  const sections = [];
  let comments = 0;
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (/^(#|\/\/|;)/.test(trimmed)) {
      comments += 1;
      return;
    }
    const section = trimmed.match(/^\[([^\]]+)]$/);
    if (section) {
      sections.push({ line: index + 1, name: section[1] });
      return;
    }
    const yaml = trimmed.match(/^([A-Za-z0-9_.-][^:#={}\[\]]{0,80})\s*:\s*(.*)$/);
    const equals = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]{0,80})\s*=\s*(.*)$/);
    const match = ["yml", "yaml"].includes(ext) ? yaml || equals : equals || yaml;
    if (match) keys.push({ line: index + 1, key: match[1].trim(), value: maskConfigSecret(match[2].trim(), match[1].trim()) });
  });
  return {
    keys: keys.slice(0, 100),
    sections: sections.slice(0, 40),
    comments,
    meaningfulLines: keys.length + sections.length
  };
}

function maskConfigSecret(value, key = "") {
  if (!value) return "";
  if (isSensitiveConfigKey(key)) return "민감값 가능성 - 화면 축약";
  if (/^(["']?)(?:[A-Za-z0-9+/=_-]{24,}|sk-|pk_|ghp_|AKIA)/.test(value)) return "민감값 가능성 - 화면 축약";
  return value.slice(0, 120);
}

function isSensitiveConfigKey(key) {
  return /(secret|token|password|passwd|pwd|api[_-]?key|private[_-]?key|credential|auth|client[_-]?secret)/i.test(String(key || ""));
}

function redactConfigText(text) {
  return String(text || "")
    .split(/\r\n|\r|\n/)
    .map((line) => {
      const match = line.match(/^(\s*(?:export\s+)?([A-Za-z0-9_.-]{1,80})\s*[:=]\s*)(.*)$/);
      if (!match) return line;
      const masked = maskConfigSecret(match[3].trim(), match[2]);
      return masked === match[3].trim() ? line : `${match[1]}${masked}`;
    })
    .join("\n");
}

function renderViewerConfigSummary(summary) {
  const rows = [["줄", "키", "값 일부"], ...summary.keys.slice(0, 60).map((item) => [item.line, item.key, item.value || "-"])];
  return `
    <div class="viewer-rich">
      <div class="viewer-summary-grid">
        <div><span>키</span><strong>${summary.keys.length}</strong></div>
        <div><span>섹션</span><strong>${summary.sections.length}</strong></div>
        <div><span>주석</span><strong>${summary.comments}</strong></div>
      </div>
      ${summary.sections.length ? `<div class="viewer-pill-list">${summary.sections.slice(0, 24).map((item) => `<span>${escapeHtml(item.name)}</span>`).join("")}</div>` : ""}
      ${renderViewerTable(rows, "설정 키")}
    </div>
  `;
}

function parseSubtitleCues(text) {
  return String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!lines.length || /^WEBVTT/i.test(lines[0]) || /^NOTE\b/i.test(lines[0])) return null;
      if (/^\d+$/.test(lines[0]) && lines[1]?.includes("-->")) lines.shift();
      const timingIndex = lines.findIndex((line) => line.includes("-->"));
      if (timingIndex < 0) return null;
      const [start, end] = lines[timingIndex].split("-->").map((part) => normalizeSubtitleTime(part));
      const body = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();
      return { start, end, body };
    })
    .filter(Boolean);
}

function normalizeSubtitleTime(value) {
  return String(value || "").split(/\s+/)[0].replace(",", ".");
}

function renderViewerSubtitleTable(cues) {
  const rows = [["시작", "종료", "자막"], ...cues.map((cue) => [cue.start, cue.end, cue.body])];
  return renderViewerTable(rows, "자막 구간");
}

function summarizeLogText(text) {
  const lines = String(text || "").split(/\r\n|\r|\n/);
  const counts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0 };
  const important = [];
  lines.forEach((line, index) => {
    const level = detectLogLevel(line);
    if (level) counts[level] = (counts[level] || 0) + 1;
    if ((level === "ERROR" || level === "WARN" || level === "INFO") && important.length < 80) {
      important.push({ line: index + 1, level, time: detectLogTime(line), text: line.trim().slice(0, 180) });
    }
  });
  return { lines: lines.length, counts, important };
}

function detectLogLevel(line) {
  const match = String(line || "").match(/\b(FATAL|CRITICAL|ERROR|ERR|WARN|WARNING|NOTICE|INFO|DEBUG|TRACE)\b/i);
  if (!match) return "";
  const level = match[1].toUpperCase();
  if (["FATAL", "CRITICAL", "ERR"].includes(level)) return "ERROR";
  if (level === "WARNING" || level === "NOTICE") return "WARN";
  return level;
}

function detectLogTime(line) {
  return String(line || "").match(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}|\d{2}:\d{2}:\d{2}/)?.[0] || "-";
}

function renderViewerLogSummary(summary) {
  const rows = [["줄", "레벨", "시각", "내용"], ...summary.important.map((item) => [item.line, item.level, item.time, item.text])];
  return `
    <div class="viewer-rich">
      <div class="viewer-summary-grid">
        <div><span>ERROR</span><strong>${summary.counts.ERROR || 0}</strong></div>
        <div><span>WARN</span><strong>${summary.counts.WARN || 0}</strong></div>
        <div><span>INFO</span><strong>${summary.counts.INFO || 0}</strong></div>
      </div>
      ${renderViewerTable(rows, "로그 핵심 줄")}
    </div>
  `;
}

function summarizeCodeText(text, ext) {
  const lines = String(text || "").split(/\r\n|\r|\n/);
  const symbols = [];
  let imports = 0;
  let comments = 0;
  let todos = 0;
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^(import\b|from\b|const\s+\w+\s*=\s*require\(|#include\b|using\b|use\b|package\b)/.test(trimmed)) imports += 1;
    if (/^(\/\/|#|--|\/\*|\*)/.test(trimmed)) comments += 1;
    if (/\b(TODO|FIXME|BUG|HACK)\b/i.test(trimmed)) todos += 1;
    const symbol = detectCodeSymbol(trimmed);
    if (symbol && symbols.length < 80) symbols.push({ line: index + 1, ...symbol });
  });
  return { language: codeLanguageLabel(ext), lines: lines.length, imports, comments, todos, symbols };
}

function detectCodeSymbol(line) {
  const patterns = [
    { type: "class", regex: /^(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/ },
    { type: "function", regex: /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/ },
    { type: "function", regex: /^(?:def|func|fn)\s+([A-Za-z_][\w]*)/ },
    { type: "type", regex: /^(?:interface|type|struct|enum)\s+([A-Za-z_$][\w$]*)/ },
    { type: "component", regex: /^(?:const|let|var)\s+([A-Z][A-Za-z0-9_$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/ },
    { type: "sql", regex: /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i }
  ];
  for (const pattern of patterns) {
    const match = line.match(pattern.regex);
    if (match) return { type: pattern.type, name: match[1] };
  }
  return null;
}

function codeLanguageLabel(ext) {
  const labels = {
    js: "JavaScript",
    mjs: "JavaScript",
    cjs: "JavaScript",
    ts: "TypeScript",
    tsx: "TypeScript JSX",
    jsx: "JavaScript JSX",
    py: "Python",
    java: "Java",
    c: "C",
    cpp: "C++",
    h: "C/C++ Header",
    go: "Go",
    rs: "Rust",
    php: "PHP",
    rb: "Ruby",
    vue: "Vue",
    svelte: "Svelte",
    sh: "Shell",
    bat: "Batch",
    ps1: "PowerShell",
    sql: "SQL"
  };
  return labels[ext] || "Code";
}

function renderViewerCodeSummary(summary) {
  const rows = [["줄", "종류", "이름"], ...summary.symbols.map((item) => [item.line, item.type, item.name])];
  return `
    <div class="viewer-rich">
      <div class="viewer-summary-grid">
        <div><span>언어</span><strong>${escapeHtml(summary.language)}</strong></div>
        <div><span>import</span><strong>${summary.imports}</strong></div>
        <div><span>TODO</span><strong>${summary.todos}</strong></div>
      </div>
      ${summary.symbols.length ? renderViewerTable(rows, "코드 구조") : ""}
    </div>
  `;
}

function rtfToPlainViewerText(value) {
  return String(value || "")
    .replace(/\\u(-?\d+)\??/g, (_match, code) => {
      const number = Number(code);
      return Number.isFinite(number) ? String.fromCharCode(number < 0 ? number + 65536 : number) : "";
    })
    .replace(/\\'([0-9a-f]{2})/gi, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\(?:par|line)\b/g, "\n")
    .replace(/\\tab\b/g, "\t")
    .replace(/\\[a-z]+\d* ?/gi, "")
    .replace(/\\./g, "")
    .replace(/[{}]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readEpubPreview(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const opfPath = await findEpubOpfPath(zip);
  const opf = opfPath ? await zip.file(opfPath)?.async("text") : "";
  const doc = opf ? new DOMParser().parseFromString(opf, "application/xml") : null;
  const metadata = doc && !doc.querySelector("parsererror") ? extractEpubMetadata(doc) : {};
  const chapters = doc && !doc.querySelector("parsererror") ? extractEpubChapters(doc, opfPath, zip) : [];
  let text = "";
  for (const chapter of chapters.slice(0, 12)) {
    try {
      const html = await zip.file(chapter.path)?.async("text");
      const extracted = xmlMarkupToText(html || "");
      if (extracted) text += `${text ? "\n\n" : ""}[${chapter.label}]\n${extracted}`;
      if (text.length > LIMITS.viewerPreviewChars) break;
    } catch {
      // EPUB 내부 장 하나가 깨져도 나머지 장은 계속 표시한다.
    }
  }
  return {
    ...metadata,
    chapters,
    text: text.slice(0, LIMITS.viewerPreviewChars),
    truncated: text.length > LIMITS.viewerPreviewChars,
    entries: entries.filter((entry) => !entry.dir).map((entry) => ({ name: entry.name, size: entry._data?.uncompressedSize || 0 })),
    folderCount: entries.filter((entry) => entry.dir).length
  };
}

async function findEpubOpfPath(zip) {
  const container = zip.file("META-INF/container.xml");
  if (container) {
    const xml = await container.async("text");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const rootfile = [...doc.getElementsByTagName("*")].find((node) => node.localName === "rootfile");
    const path = rootfile?.getAttribute("full-path");
    if (path && zip.file(path)) return path;
  }
  return Object.keys(zip.files).find((name) => name.toLowerCase().endsWith(".opf")) || "";
}

function extractEpubMetadata(doc) {
  return {
    title: getXmlLocalText(doc, "title"),
    creator: getXmlLocalText(doc, "creator"),
    language: getXmlLocalText(doc, "language"),
    identifier: getXmlLocalText(doc, "identifier")
  };
}

function extractEpubChapters(doc, opfPath, zip) {
  const baseDir = opfPath.split("/").slice(0, -1).join("/");
  const manifest = new Map();
  [...doc.getElementsByTagName("*")]
    .filter((node) => node.localName === "item")
    .forEach((item) => {
      const id = item.getAttribute("id");
      const href = item.getAttribute("href");
      if (id && href) manifest.set(id, { href, media: item.getAttribute("media-type") || "" });
    });
  const ordered = [...doc.getElementsByTagName("*")]
    .filter((node) => node.localName === "itemref")
    .map((item) => item.getAttribute("idref"))
    .filter(Boolean)
    .map((id) => manifest.get(id))
    .filter(Boolean);
  const candidates = (ordered.length ? ordered : [...manifest.values()]).filter((item) => /xhtml|html/i.test(item.media) || /\.(xhtml|html?)$/i.test(item.href));
  return candidates
    .map((item, index) => {
      const path = normalizeZipPath(baseDir, item.href);
      return { path, label: decodeURIComponentSafe(item.href.split("/").pop() || `chapter-${index + 1}`), exists: Boolean(zip.file(path)) };
    })
    .filter((item) => item.exists)
    .slice(0, 80);
}

function getXmlLocalText(doc, name) {
  return [...doc.getElementsByTagName("*")].find((node) => node.localName === name)?.textContent?.trim() || "";
}

function normalizeZipPath(baseDir, href) {
  const parts = `${baseDir ? `${baseDir}/` : ""}${decodeURIComponentSafe(href).split("#")[0]}`.split("/");
  const stack = [];
  parts.forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") stack.pop();
    else stack.push(part);
  });
  return stack.join("/");
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function renderViewerEpubSummary(epub) {
  const rows = [["순서", "파일"], ...epub.chapters.slice(0, 40).map((chapter, index) => [index + 1, chapter.path])];
  return `
    <div class="viewer-rich">
      <div class="viewer-summary-grid">
        <div><span>제목</span><strong>${escapeHtml(epub.title || "-")}</strong></div>
        <div><span>저자</span><strong>${escapeHtml(epub.creator || "-")}</strong></div>
        <div><span>언어</span><strong>${escapeHtml(epub.language || "-")}</strong></div>
      </div>
      ${epub.identifier ? `<div class="viewer-pill-list"><span>${escapeHtml(epub.identifier)}</span></div>` : ""}
      ${renderViewerTable(rows, "EPUB 목차 후보")}
    </div>
  `;
}

function extractViewerColors(text) {
  const matches = String(text || "").match(/#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/gi) || [];
  return [...new Set(matches.map((item) => item.trim()))].filter(isSafeCssColor).slice(0, 48);
}

function isSafeCssColor(value) {
  return /^(#[0-9a-f]{3,8}|rgba?\([0-9.,% \t-]+\)|hsla?\([0-9.,% \t-]+\))$/i.test(value);
}

function renderViewerColorPalette(colors) {
  return `
    <div class="viewer-rich">
      <h3>색상 팔레트</h3>
      <div class="viewer-color-grid">
        ${colors.map((color) => `<span class="viewer-color-chip"><i style="background:${escapeAttr(color)}"></i>${escapeHtml(color)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderViewerTable(rows, caption) {
  const colCount = Math.max(1, ...rows.map((row) => row.length));
  const safeRows = rows.length ? rows : [["표시할 셀이 없습니다."]];
  return `
    <div class="table-wrap viewer-table">
      <table>
        <thead>
          <tr><th colspan="${Math.max(1, colCount)}">${escapeHtml(caption)} 미리보기</th></tr>
        </thead>
        <tbody>
          ${safeRows
            .map((row) => `<tr>${Array.from({ length: Math.max(1, colCount) }, (_, index) => `<td>${escapeHtml(row[index] ?? "")}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderViewerArchiveTable(files, folderCount, omitted) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>내부 경로</th><th>확장자</th><th>용량</th></tr></thead>
        <tbody>
          ${
            files.length
              ? files
                  .map((entry) => {
                    const displayName = entry.originalName && entry.originalName !== entry.name ? `${entry.originalName} → ${entry.name}` : entry.name;
                    return `<tr><td>${escapeHtml(displayName)}</td><td>${escapeHtml(extensionOf(entry.name) || "-")}</td><td>${entry.size ? formatBytes(entry.size) : "-"}</td></tr>`;
                  })
                  .join("")
              : `<tr><td colspan="3">파일 항목이 없습니다. 폴더 ${folderCount}개만 확인됐습니다.</td></tr>`
          }
          ${omitted ? `<tr><td colspan="3">외 ${omitted.toLocaleString("ko-KR")}개 파일은 화면에서 생략했습니다.</td></tr>` : ""}
        </tbody>
      </table>
    </div>
  `;
}

function highlightViewerQuery(escapedText, query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return escapedText;
  const escapedQuery = escapeHtml(trimmed);
  return escapedText.replace(new RegExp(escapeRegExp(escapedQuery), "gi"), (match) => `<mark>${match}</mark>`);
}

function countViewerMatches(text, query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return 0;
  return (String(text || "").match(new RegExp(escapeRegExp(trimmed), "gi")) || []).length;
}

function parseTsv(text) {
  return parseDelimited(text, "\t");
}

function parseDelimited(text, delimiter = ",") {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  const source = String(text || "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
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

function splitDelimitedLine(line, delimiter = ",") {
  return parseDelimited(line, delimiter)[0] || [String(line || "")];
}

function bindPdfA4NormalizerEvents() {
  const form = document.querySelector("#pdfA4Form");
  const input = document.querySelector("#pdfA4Input");
  const count = document.querySelector("#pdfA4Count");
  const downloadButton = document.querySelector("#downloadPdfA4");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "크기를 통일할 PDF를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#pdfA4Result");
    downloadButton.disabled = true;
    if (!file) {
      showResultMessage(result, "A4로 맞출 PDF를 먼저 선택하세요.", "warn");
      return;
    }
    if (extensionOf(file.name) !== "pdf") {
      showResultMessage(result, "PDF 파일만 A4로 맞출 수 있습니다.", "warn");
      return;
    }
    if (file.size > LIMITS.singleBytes) {
      showResultMessage(result, `${file.name} 파일이 ${formatBytes(LIMITS.singleBytes)}를 넘습니다.`, "warn");
      return;
    }

    setResultBusy(result, true, "PDF 페이지를 A4로 다시 배치하는 중입니다...");
    try {
      const output = await normalizePdfToA4(file, {
        orientation: document.querySelector("#pdfA4Orientation")?.value || "auto",
        margin: Number(document.querySelector("#pdfA4Margin")?.value || 12)
      });
      const baseName = safeBaseName(document.querySelector("#pdfA4Name")?.value || "goatool_a4_pdf");
      state.lastPdfA4Blob = output.blob;
      state.lastPdfName = `${baseName}.pdf`;
      downloadButton.disabled = false;
      result.innerHTML = renderPdfA4Result(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "PDF를 A4로 다시 배치하지 못했습니다. 암호가 없는 일반 PDF인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (state.lastPdfA4Blob) downloadBlob(state.lastPdfA4Blob, state.lastPdfName || "goatool-a4.pdf");
  });
}

async function normalizePdfToA4(file, options) {
  const { PDFDocument } = await loadPdfLib();
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  const output = await PDFDocument.create();
  const a4Portrait = { width: 595.28, height: 841.89 };
  const a4Landscape = { width: 841.89, height: 595.28 };
  const pages = source.getPages();
  const summary = [];

  for (const page of pages) {
    const { width, height } = page.getSize();
    const target =
      options.orientation === "portrait"
        ? a4Portrait
        : options.orientation === "landscape"
          ? a4Landscape
          : width > height
            ? a4Landscape
            : a4Portrait;
    const margin = Math.max(0, Math.min(72, Number(options.margin || 0)));
    const contentWidth = Math.max(1, target.width - margin * 2);
    const contentHeight = Math.max(1, target.height - margin * 2);
    const scale = Math.min(contentWidth / width, contentHeight / height);
    const newPage = output.addPage([target.width, target.height]);
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    let drawn = true;
    const hasDrawableContents = Boolean(page.node?.Contents?.());
    if (hasDrawableContents) {
      try {
        const embedded = await output.embedPage(page);
        newPage.drawPage(embedded, {
          x: (target.width - drawWidth) / 2,
          y: (target.height - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight
        });
      } catch (error) {
        drawn = false;
        console.warn("PDF page could not be embedded and was kept as a blank A4 page.", error);
      }
    } else {
      drawn = false;
    }
    summary.push({
      sourceSize: `${Math.round(width)}×${Math.round(height)}`,
      targetSize: `${Math.round(target.width)}×${Math.round(target.height)}`,
      scale,
      drawn
    });
  }

  const bytes = await output.save();
  return {
    blob: new Blob([bytes], { type: "application/pdf" }),
    originalSize: file.size,
    pageCount: output.getPageCount(),
    summary
  };
}

function renderPdfA4Result(output) {
  const changed = output.summary.filter((item) => item.sourceSize !== item.targetSize).length;
  return `
    <div class="stat-grid">
      <div><span>쪽수</span><strong>${output.pageCount}</strong></div>
      <div><span>A4 배치</span><strong class="status-ok">${changed}</strong></div>
      <div><span>결과 용량</span><strong>${formatBytes(output.blob.size)}</strong></div>
    </div>
    <div class="result-block">
      <h3>PDF A4 맞춤 결과</h3>
      <p class="ok-line">모든 페이지를 A4 페이지 안에 다시 배치했습니다. 결과 PDF를 열어 잘림과 여백을 확인하세요.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>쪽</th><th>원본 크기</th><th>결과 크기</th><th>배율</th><th>상태</th></tr></thead>
        <tbody>
          ${output.summary
            .map(
              (item, index) =>
                `<tr><td>${index + 1}</td><td>${escapeHtml(item.sourceSize)}</td><td>${escapeHtml(item.targetSize)}</td><td>${Math.round(item.scale * 100)}%</td><td><strong class="${item.drawn ? "status-ok" : "status-warn"}">${item.drawn ? "배치 완료" : "빈 페이지 처리"}</strong></td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindPdfSplitterEvents() {
  const form = document.querySelector("#pdfSplitterForm");
  const input = document.querySelector("#pdfSplitterInput");
  const count = document.querySelector("#pdfSplitterCount");
  const zipButton = document.querySelector("#downloadPdfSplitZip");
  const reportButton = document.querySelector("#downloadPdfSplitReport");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "나눌 PDF를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#pdfSplitterResult");
    zipButton.disabled = true;
    reportButton.disabled = true;
    if (!file) {
      showResultMessage(result, "나눌 PDF를 먼저 선택하세요.", "warn");
      return;
    }
    if (extensionOf(file.name) !== "pdf") {
      showResultMessage(result, "PDF 파일만 나눌 수 있습니다.", "warn");
      return;
    }
    if (file.size > LIMITS.singleBytes) {
      showResultMessage(result, `${file.name} 파일이 ${formatBytes(LIMITS.singleBytes)}를 넘습니다.`, "warn");
      return;
    }

    setResultBusy(result, true, "PDF를 쪽수 단위로 나누는 중입니다...");
    try {
      const output = await splitPdfIntoZip(file, {
        chunkSize: Math.max(1, Math.min(200, Number(document.querySelector("#pdfSplitChunkSize")?.value || 10))),
        prefix: safeBaseName(document.querySelector("#pdfSplitPrefix")?.value || "goatool_split")
      });
      state.lastPdfSplitZipBlob = output.zipBlob;
      state.lastPdfSplitReportBlob = new Blob([makePdfSplitReport(output)], { type: "text/plain;charset=utf-8" });
      zipButton.disabled = false;
      reportButton.disabled = false;
      result.innerHTML = renderPdfSplitResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "PDF를 나누지 못했습니다. 암호가 없는 일반 PDF인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  zipButton?.addEventListener("click", () => {
    if (state.lastPdfSplitZipBlob) downloadBlob(state.lastPdfSplitZipBlob, "goatool-split-pdf.zip");
  });
  reportButton?.addEventListener("click", () => {
    if (state.lastPdfSplitReportBlob) downloadBlob(state.lastPdfSplitReportBlob, "goatool-pdf-split-report.txt");
  });
}

async function splitPdfIntoZip(file, options) {
  const { PDFDocument } = await loadPdfLib();
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  const totalPages = source.getPageCount();
  const chunkSize = Math.max(1, options.chunkSize);
  const chunks = [];
  const zip = new JSZip();
  for (let start = 0; start < totalPages; start += chunkSize) {
    const end = Math.min(totalPages - 1, start + chunkSize - 1);
    const output = await PDFDocument.create();
    const indices = [];
    for (let index = start; index <= end; index += 1) indices.push(index);
    const copied = await output.copyPages(source, indices);
    copied.forEach((page) => output.addPage(page));
    const bytes = await output.save();
    const fileName = `${options.prefix}_${String(chunks.length + 1).padStart(2, "0")}_p${start + 1}-${end + 1}.pdf`;
    zip.file(fileName, bytes);
    chunks.push({ fileName, from: start + 1, to: end + 1, pages: end - start + 1, size: bytes.length });
  }
  zip.file(`${options.prefix}_split_report.txt`, makePdfSplitReport({ sourceName: file.name, totalPages, chunkSize, chunks }));
  return {
    sourceName: file.name,
    totalPages,
    chunkSize,
    chunks,
    zipBlob: await zip.generateAsync({ type: "blob" })
  };
}

function makePdfSplitReport(output) {
  return [
    "goatool PDF 나누기 결과",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `원본 PDF: ${output.sourceName}`,
    `전체 쪽수: ${output.totalPages}`,
    `나눔 단위: ${output.chunkSize}쪽`,
    `결과 PDF: ${output.chunks.length}개`,
    "",
    ...output.chunks.map((chunk, index) => `${index + 1}. ${chunk.fileName} / ${chunk.from}-${chunk.to}쪽 / ${formatBytes(chunk.size)}`)
  ].join("\n");
}

function renderPdfSplitResult(output) {
  return `
    <div class="stat-grid">
      <div><span>전체 쪽수</span><strong>${output.totalPages}</strong></div>
      <div><span>결과 PDF</span><strong>${output.chunks.length}</strong></div>
      <div><span>ZIP 용량</span><strong>${formatBytes(output.zipBlob.size)}</strong></div>
    </div>
    <div class="result-block">
      <h3>PDF 나누기 결과</h3>
      <p class="ok-line">${output.chunkSize}쪽 단위로 PDF를 나누어 ZIP을 만들었습니다.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>결과 PDF</th><th>페이지</th><th>쪽수</th><th>용량</th></tr></thead>
        <tbody>
          ${output.chunks.map((chunk) => `<tr><td>${escapeHtml(chunk.fileName)}</td><td>${chunk.from}-${chunk.to}</td><td>${chunk.pages}</td><td>${formatBytes(chunk.size)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindPdfBlankRemoverEvents() {
  const form = document.querySelector("#pdfBlankForm");
  const input = document.querySelector("#pdfBlankInput");
  const count = document.querySelector("#pdfBlankCount");
  const pdfButton = document.querySelector("#downloadPdfBlank");
  const reportButton = document.querySelector("#downloadPdfBlankReport");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "빈 페이지를 찾을 PDF를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#pdfBlankResult");
    pdfButton.disabled = true;
    reportButton.disabled = true;
    if (!file) {
      showResultMessage(result, "빈 페이지를 정리할 PDF를 먼저 선택하세요.", "warn");
      return;
    }
    if (extensionOf(file.name) !== "pdf") {
      showResultMessage(result, "PDF 파일만 정리할 수 있습니다.", "warn");
      return;
    }

    setResultBusy(result, true, "PDF 빈 페이지 후보를 찾는 중입니다...");
    try {
      const output = await removeBlankPdfPages(file);
      const baseName = safeBaseName(document.querySelector("#pdfBlankName")?.value || "goatool_no_blank_pages");
      state.lastPdfBlankBlob = output.blob;
      state.lastPdfName = `${baseName}.pdf`;
      state.lastPdfBlankReportBlob = new Blob([makePdfBlankReport(output)], { type: "text/plain;charset=utf-8" });
      pdfButton.disabled = false;
      reportButton.disabled = false;
      result.innerHTML = renderPdfBlankResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "PDF 빈 페이지를 정리하지 못했습니다.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  pdfButton?.addEventListener("click", () => {
    if (state.lastPdfBlankBlob) downloadBlob(state.lastPdfBlankBlob, state.lastPdfName || "goatool-no-blank-pages.pdf");
  });
  reportButton?.addEventListener("click", () => {
    if (state.lastPdfBlankReportBlob) downloadBlob(state.lastPdfBlankReportBlob, "goatool-pdf-blank-pages.txt");
  });
}

async function removeBlankPdfPages(file) {
  const { PDFDocument } = await loadPdfLib();
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  const output = await PDFDocument.create();
  const pages = source.getPages();
  const blankPages = [];
  const keptPages = [];

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const hasContents = Boolean(page.node?.Contents?.());
    if (!hasContents) {
      blankPages.push(index + 1);
      continue;
    }
    const [copied] = await output.copyPages(source, [index]);
    output.addPage(copied);
    keptPages.push(index + 1);
  }

  if (!keptPages.length) throw new Error("모든 페이지가 구조상 빈 페이지로 감지되어 새 PDF를 만들지 않았습니다.");
  const bytes = await output.save();
  return {
    sourceName: file.name,
    blob: new Blob([bytes], { type: "application/pdf" }),
    originalPages: pages.length,
    keptPages,
    blankPages
  };
}

function makePdfBlankReport(output) {
  return [
    "goatool PDF 빈 페이지 정리 결과",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `원본 PDF: ${output.sourceName}`,
    `원본 쪽수: ${output.originalPages}`,
    `제거 후보: ${output.blankPages.length ? output.blankPages.join(", ") : "없음"}`,
    `남긴 쪽: ${output.keptPages.join(", ")}`
  ].join("\n");
}

function renderPdfBlankResult(output) {
  return `
    <div class="stat-grid">
      <div><span>원본 쪽수</span><strong>${output.originalPages}</strong></div>
      <div><span>빈 페이지 후보</span><strong class="${output.blankPages.length ? "status-warn" : "status-ok"}">${output.blankPages.length}</strong></div>
      <div><span>결과 쪽수</span><strong>${output.keptPages.length}</strong></div>
    </div>
    <div class="result-block">
      <h3>PDF 빈 페이지 정리 결과</h3>
      ${
        output.blankPages.length
          ? `<p class="ok-line">${output.blankPages.join(", ")}쪽을 구조상 빈 페이지 후보로 제외했습니다. 결과 PDF를 열어 필요한 페이지가 빠지지 않았는지 확인하세요.</p>`
          : `<p class="ok-line">구조상 빈 페이지 후보가 보이지 않습니다. 동일한 페이지 구성으로 새 PDF를 만들었습니다.</p>`
      }
    </div>
    <div class="metric-list">
      <p><strong>남긴 페이지</strong><span>${output.keptPages.join(", ")}</span></p>
      <p><strong>주의</strong><span>흰 종이를 스캔한 이미지 페이지는 내용 스트림이 있어 자동 제거되지 않을 수 있습니다.</span></p>
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

function bindRequiredDocCheckerEvents() {
  const form = document.querySelector("#requiredDocForm");
  const presetSelect = document.querySelector("#requiredDocPreset");
  const presetPreview = document.querySelector("#requiredDocPresetPreview");
  const textArea = document.querySelector("#requiredDocText");
  const fileInput = document.querySelector("#requiredDocFiles");
  const count = document.querySelector("#requiredDocCount");
  const reportButton = document.querySelector("#downloadRequiredDocReport");

  presetSelect?.addEventListener("change", () => {
    const preset = findRequiredDocPreset(presetSelect.value);
    if (preset && textArea) textArea.value = requiredDocPresetText(preset);
    if (presetPreview) presetPreview.innerHTML = renderRequiredDocPresetPreview(preset);
  });

  fileInput?.addEventListener("change", () => {
    count.textContent = fileInput.files?.length ? `${fileInput.files.length}개 파일 선택됨` : "목록과 비교할 파일을 선택하세요";
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const preset = findRequiredDocPreset(presetSelect?.value);
    const text = textArea?.value || "";
    const files = Array.from(fileInput?.files || []);
    const result = document.querySelector("#requiredDocResult");
    reportButton.disabled = true;

    const required = parseRequiredDocuments(text);
    if (!required.length) {
      showResultMessage(result, "신청 유형을 고르거나 공고문·접수 화면의 제출서류 목록을 먼저 붙여넣으세요.", "warn");
      return;
    }
    if (!files.length) {
      showResultMessage(result, "대조할 실제 파일을 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.fileCount, allowImagesOnly: false });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    const output = matchRequiredDocuments(required, files, preset);
    state.lastRequiredChecklistBlob = new Blob([makeRequiredDocReport(output)], { type: "text/plain;charset=utf-8" });
    reportButton.disabled = false;
    result.innerHTML = renderRequiredDocResult(output);
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastRequiredChecklistBlob) downloadBlob(state.lastRequiredChecklistBlob, "goatool-required-doc-check.txt");
  });
}

function parseRequiredDocuments(text) {
  return String(text || "")
    .split(/\r\n|\r|\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^[\s\-*•·□■✓✔\d.)\]]+/, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((line) => line.length >= 2)
    .slice(0, 80);
}

function matchRequiredDocuments(required, files, preset = null) {
  const fileItems = files.map((file, index) => ({
    file,
    index,
    name: file.name,
    normalized: normalizeMatchText(removeExtension(file.name)),
    size: file.size,
    matched: false
  }));

  const rows = required.map((title) => {
    const meta = analyzeRequiredDocument(title);
    const best = fileItems
      .map((item) => ({ item, score: scoreRequiredMatch(title, item.normalized) }))
      .filter(({ item }) => !item.matched || fileContainsRequiredTitle(title, item.normalized))
      .sort((a, b) => b.score - a.score)[0];
    const match = best?.score >= 0.5 ? best.item : null;
    if (match) match.matched = true;
    const score = best?.score || 0;
    return { title, meta, match, score, status: requiredDocRowStatus(meta, match, score) };
  });

  const warnings = inspectRequiredDocFiles(files, rows);
  return {
    rows,
    extras: fileItems.filter((item) => !item.matched),
    fileCount: files.length,
    summary: summarizeRequiredDocRows(rows),
    warnings,
    preset
  };
}

function normalizeMatchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[()[\]{}]/g, " ")
    .replace(/[_\-+.,/\\:;|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactMatchText(value) {
  return normalizeMatchText(value).replace(/\s/g, "");
}

function fileContainsRequiredTitle(title, fileNormalized) {
  const compactTitle = compactMatchText(title);
  const compactFile = String(fileNormalized || "").replace(/\s/g, "");
  return requiredTitleVariants(title).some((variant) => {
    const compactVariant = compactMatchText(variant);
    return compactVariant.length >= 3 && compactFile.includes(compactVariant);
  });
}

function hasRequiredKeywordMismatch(compactTitle, compactFile) {
  const exclusiveGroups = [["국세", "지방세"]];
  return exclusiveGroups.some((group) => {
    const requiredKeyword = group.find((keyword) => compactTitle.includes(keyword));
    return requiredKeyword && !compactFile.includes(requiredKeyword);
  });
}

function requirementTokens(title) {
  const stop = new Set(["사본", "원본", "제출", "첨부", "필수", "선택", "해당", "파일", "서류", "및", "또는", "각", "부", "제출용"]);
  return normalizeMatchText(title)
    .split(" ")
    .map((token) => token.replace(/^\d+|\d+$/g, ""))
    .filter((token) => token.length >= 2 && !stop.has(token));
}

function scoreRequiredMatch(title, fileNormalized) {
  return Math.max(...requiredTitleVariants(title).map((variant) => scoreRequiredMatchVariant(variant, fileNormalized)));
}

function scoreRequiredMatchVariant(title, fileNormalized) {
  const titleNormalized = normalizeMatchText(title);
  if (!titleNormalized || !fileNormalized) return 0;
  const compactTitle = titleNormalized.replace(/\s/g, "");
  const compactFile = fileNormalized.replace(/\s/g, "");
  if (compactTitle.length >= 3 && compactFile.includes(compactTitle)) return 1;
  if (hasRequiredKeywordMismatch(compactTitle, compactFile)) return 0;
  const tokens = requirementTokens(title);
  if (!tokens.length) return compactFile.includes(compactTitle) ? 1 : 0;
  const hits = tokens.filter((token) => compactFile.includes(token.replace(/\s/g, ""))).length;
  return hits / tokens.length;
}

function splitAlternativeRequiredTitle(title) {
  return String(title || "")
    .split(/\s+(?:또는|혹은|or)\s+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function conditionalRequirementReason(title) {
  const compact = compactMatchText(title);
  if (compact.includes("가점")) return "가점 항목이 있는 경우";
  if (compact.includes("발표자료")) return "발표평가 단계에서 요청된 경우";
  if (compact.includes("법인등기부등본") || compact.includes("주주명부") || compact.includes("정관")) return "법인 또는 주주 구성 확인이 필요한 경우";
  if (compact.includes("동업계약서")) return "공동사업자인 경우";
  if (compact.includes("인허가증") || compact.includes("신고필증")) return "해당 업종 인허가가 필요한 경우";
  if (compact.includes("퇴사사유")) return "퇴사 사유 소명이 필요한 경우";
  if (compact.includes("재학증명서") || compact.includes("재직증명서")) return "해당 신분 확인이 필요한 경우";
  if (compact.includes("혼인관계증명서") || compact.includes("기본증명서")) return "가족관계만으로 확인이 어려운 경우";
  if (compact.includes("의료비") || compact.includes("주거비")) return "해당 지원 항목 지출을 증명해야 하는 경우";
  return "";
}

function analyzeRequiredDocument(title) {
  const alternatives = splitAlternativeRequiredTitle(title);
  const condition = conditionalRequirementReason(title);
  const kind = condition ? "conditional" : alternatives.length > 1 ? "alternative" : "required";
  return {
    kind,
    label: kind === "conditional" ? "해당 시" : kind === "alternative" ? "대체 가능" : "필수",
    condition,
    alternatives
  };
}

function requiredTitleVariants(title) {
  const base = [title, ...splitAlternativeRequiredTitle(title)];
  const aliasRules = [
    ["사업자등록증명원", ["사업자등록증", "사업자 등록 증명"]],
    ["부가가치세 과세표준증명원", ["부가세 과세표준증명", "부가가치세 증명"]],
    ["국세 납세증명서", ["국세완납증명서", "국세 완납증명"]],
    ["지방세 납세증명서", ["지방세완납증명서", "지방세 완납증명"]],
    ["임대차계약서", ["임대차 계약", "임대 계약서"]],
    ["통장 사본", ["계좌 사본", "통장표지", "계좌개설확인서"]],
    ["대표자 신분증", ["대표 신분증", "주민등록증", "운전면허증", "여권"]],
    ["가족관계증명서", ["가족관계"]],
    ["4대보험 가입자 명부", ["4대보험가입자명부", "사업장가입자명부"]],
    ["소상공인 확인서", ["소상공인확인서"]],
    ["중소기업 확인서", ["중소기업확인서"]]
  ];

  aliasRules.forEach(([keyword, aliases]) => {
    if (compactMatchText(title).includes(compactMatchText(keyword))) base.push(...aliases);
  });
  return [...new Set(base.filter(Boolean))];
}

function requiredDocRowStatus(meta, match, score) {
  if (match && score >= 0.75) return { key: "ok", label: "확인됨", className: "status-ok" };
  if (match) return { key: "review", label: "파일명 확인", className: "status-review" };
  if (meta.kind === "conditional") return { key: "conditional", label: "해당 시 확인", className: "status-muted" };
  if (meta.kind === "alternative") return { key: "missing", label: "대체서류 누락 가능", className: "status-warn" };
  return { key: "missing", label: "누락 가능", className: "status-warn" };
}

function summarizeRequiredDocRows(rows) {
  return {
    total: rows.length,
    ok: rows.filter((row) => row.status.key === "ok").length,
    missing: rows.filter((row) => row.status.key === "missing").length,
    conditional: rows.filter((row) => row.status.key === "conditional").length,
    review: rows.filter((row) => row.status.key === "review").length
  };
}

function extractFileNameDate(name) {
  const text = removeExtension(name);
  const candidates = [];
  const fullDatePattern = /(?:^|[^\d])((?:20)\d{2})[.\-_/년\s]?(\d{1,2})[.\-_/월\s]?(\d{1,2})(?:일)?(?:[^\d]|$)/g;
  const compactDatePattern = /(?:^|[^\d])((?:20)\d{2})(\d{2})(\d{2})(?:[^\d]|$)/g;
  [fullDatePattern, compactDatePattern].forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text))) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) candidates.push(date);
    }
  });
  return candidates.sort((a, b) => b.getTime() - a.getTime())[0] || null;
}

function inspectRequiredDocFiles(files, rows) {
  const warnings = [];
  const normalizedNames = new Map();
  files.forEach((file) => {
    const stableName = compactMatchText(removeExtension(file.name).replace(/\((?:복사본|copy|\d+)\)$/i, ""));
    if (normalizedNames.has(stableName)) warnings.push(`${file.name}: 비슷한 이름의 파일이 중복 선택되었습니다.`);
    normalizedNames.set(stableName, file.name);

    const date = extractFileNameDate(file.name);
    if (date) {
      const days = Math.floor((Date.now() - date.getTime()) / 86400000);
      if (days > 90) warnings.push(`${file.name}: 파일명 날짜가 90일보다 오래되어 발급일 제한을 확인해야 합니다.`);
      if (days < -1) warnings.push(`${file.name}: 파일명 날짜가 미래로 보입니다.`);
    }
  });

  rows
    .filter((row) => row.status.key === "review")
    .forEach((row) => warnings.push(`${row.title}: ${row.match.name} 파일명이 일부만 맞습니다. 접수 전 파일명을 더 명확하게 바꾸세요.`));

  return warnings.slice(0, 12);
}

function makeRequiredDocReport(output) {
  const missing = output.rows.filter((row) => row.status.key === "missing");
  const conditional = output.rows.filter((row) => row.status.key === "conditional");
  const review = output.rows.filter((row) => row.status.key === "review");
  return [
    "goatool 제출서류 누락 대조표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `선택 유형: ${output.preset ? `${output.preset.group} - ${output.preset.label}` : "직접 입력"}`,
    ...(output.preset ? [`주의: ${output.preset.note}`, "자동 목록은 준비용 기준이며 공고문과 접수 화면이 최종 기준입니다."] : []),
    `요구 서류: ${output.rows.length}개`,
    `선택 파일: ${output.fileCount}개`,
    `필수 누락 가능: ${missing.length}개`,
    `해당 시 확인: ${conditional.length}개`,
    `파일명 확인 필요: ${review.length}개`,
    "",
    "[요구 서류 대조]",
    ...output.rows.map((row, index) => `${index + 1}. [${row.meta.label}] ${row.title} -> ${row.match ? row.match.name : "-"} / ${row.status.label}`),
    "",
    "[확인 필요]",
    ...(missing.length ? missing.map((row) => `- 필수 누락 가능: ${row.title}`) : ["- 필수 누락 가능 항목 없음"]),
    ...(conditional.length ? conditional.map((row) => `- 해당 시 확인: ${row.title}${row.meta.condition ? ` (${row.meta.condition})` : ""}`) : []),
    ...(review.length ? review.map((row) => `- 파일명 확인: ${row.title} -> ${row.match.name}`) : []),
    "",
    "[파일명 주의 신호]",
    ...(output.warnings.length ? output.warnings.map((item) => `- ${item}`) : ["- 없음"]),
    "",
    "[목록에 직접 매칭되지 않은 파일]",
    ...(output.extras.length ? output.extras.map((item) => `- ${item.name}`) : ["- 없음"])
  ].join("\n");
}

function renderRequiredDocResult(output) {
  const missing = output.rows.filter((row) => row.status.key === "missing");
  const conditional = output.rows.filter((row) => row.status.key === "conditional");
  const review = output.rows.filter((row) => row.status.key === "review");
  return `
    <div class="stat-grid doc-stat-grid">
      <div><span>요구 서류</span><strong>${output.summary.total}</strong></div>
      <div><span>필수 누락</span><strong class="${missing.length ? "status-warn" : "status-ok"}">${missing.length}</strong></div>
      <div><span>해당 시</span><strong>${conditional.length}</strong></div>
      <div><span>파일명 확인</span><strong class="${review.length ? "status-review" : "status-ok"}">${review.length}</strong></div>
    </div>
    ${
      output.preset
        ? `<div class="result-block compact-result"><h3>${escapeHtml(output.preset.label)} 기준</h3><p>${escapeHtml(output.preset.note)} 공고문과 접수 화면이 최종 기준입니다.</p></div>`
        : ""
    }
    <div class="result-block">
      <h3>서류 대조 결과</h3>
      ${
        missing.length
          ? `<ul class="warning-list">${missing.map((row) => `<li>${escapeHtml(row.title)} 파일을 먼저 확인하세요.</li>`).join("")}</ul>`
          : `<p class="ok-line">필수 서류 기준으로 큰 누락 신호는 보이지 않습니다. 파일 내용과 발급일은 마지막에 직접 확인하세요.</p>`
      }
      ${
        conditional.length || review.length || output.warnings.length
          ? `<div class="doc-attention-list">
              ${
                conditional.length
                  ? `<p><strong>해당 시 확인</strong><span>${conditional.map((row) => `${escapeHtml(row.title)}${row.meta.condition ? ` (${escapeHtml(row.meta.condition)})` : ""}`).join(", ")}</span></p>`
                  : ""
              }
              ${
                review.length
                  ? `<p><strong>파일명 확인</strong><span>${review.map((row) => `${escapeHtml(row.title)} → ${escapeHtml(row.match.name)}`).join(", ")}</span></p>`
                  : ""
              }
              ${
                output.warnings.length
                  ? `<p><strong>파일명 주의</strong><span>${output.warnings.map((item) => escapeHtml(item)).join(" / ")}</span></p>`
                  : ""
              }
            </div>`
          : ""
      }
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>구분</th><th>요구 서류</th><th>매칭된 파일</th><th>상태</th></tr></thead>
        <tbody>
          ${output.rows
            .map(
              (row) => `
                <tr>
                  <td><span class="doc-kind">${escapeHtml(row.meta.label)}</span></td>
                  <td>${escapeHtml(row.title)}</td>
                  <td>${row.match ? escapeHtml(row.match.name) : "-"}</td>
                  <td><strong class="${row.status.className}">${row.status.label}</strong></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    ${
      output.extras.length
        ? `<div class="metric-list extra-list"><p><strong>목록에 없는 파일</strong><span>${output.extras.map((item) => escapeHtml(item.name)).join(", ")}</span></p></div>`
        : ""
    }
  `;
}

function bindBundleRuleCheckerEvents() {
  const form = document.querySelector("#bundleRuleForm");
  const input = document.querySelector("#bundleRuleFiles");
  const count = document.querySelector("#bundleRuleCount");
  const reportButton = document.querySelector("#downloadBundleRuleReport");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 파일 선택됨` : "검사할 파일을 선택하세요";
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#bundleRuleResult");
    reportButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "규칙을 검사할 파일을 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.fileCount, allowImagesOnly: false });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    const options = {
      maxTotalBytes: Math.max(1, Number(document.querySelector("#bundleMaxTotal")?.value || 25)) * 1024 * 1024,
      maxSingleBytes: Math.max(1, Number(document.querySelector("#bundleMaxSingle")?.value || 10)) * 1024 * 1024,
      allowed: parseAllowedExtensions(document.querySelector("#bundleAllowedExt")?.value || "")
    };
    const output = checkBundleRules(files, options);
    state.lastBundleRuleReportBlob = new Blob([makeBundleRuleReport(output)], { type: "text/plain;charset=utf-8" });
    reportButton.disabled = false;
    result.innerHTML = renderBundleRuleResult(output);
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastBundleRuleReportBlob) downloadBlob(state.lastBundleRuleReportBlob, "goatool-bundle-rule-check.txt");
  });
}

function parseAllowedExtensions(value) {
  return new Set(
    String(value || "")
      .split(/[,\s]+/)
      .map((item) => item.trim().replace(/^\./, "").toLowerCase())
      .filter(Boolean)
  );
}

function checkBundleRules(files, options) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const duplicateNames = new Map();
  files.forEach((file) => {
    const key = file.name.toLowerCase();
    duplicateNames.set(key, (duplicateNames.get(key) || 0) + 1);
  });

  const items = files.map((file) => {
    const extension = extensionOf(file.name);
    const warnings = [];
    if (!extension) warnings.push("확장자 없음");
    if (options.allowed.size && !options.allowed.has(extension)) warnings.push("허용되지 않은 확장자");
    if (file.size > options.maxSingleBytes) warnings.push("파일별 용량 초과");
    if (file.name.length > 80) warnings.push("파일명 김");
    if (/\s{2,}/.test(file.name)) warnings.push("연속 공백");
    if (/[\\/:*?"<>|]/.test(file.name)) warnings.push("특수문자");
    if ((duplicateNames.get(file.name.toLowerCase()) || 0) > 1) warnings.push("중복 파일명");
    return {
      name: file.name,
      size: file.size,
      extension,
      warnings
    };
  });

  const globalWarnings = [];
  if (totalSize > options.maxTotalBytes) globalWarnings.push(`총용량 ${formatBytes(totalSize)}가 제한 ${formatBytes(options.maxTotalBytes)}를 넘습니다.`);
  if (!options.allowed.size) globalWarnings.push("허용 확장자 목록이 비어 있어 확장자 검사를 건너뛰었습니다.");

  return {
    items,
    totalSize,
    maxTotalBytes: options.maxTotalBytes,
    maxSingleBytes: options.maxSingleBytes,
    allowed: [...options.allowed],
    globalWarnings
  };
}

function makeBundleRuleReport(output) {
  const problemItems = output.items.filter((item) => item.warnings.length);
  return [
    "goatool 제출 규칙 검사표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `파일 수: ${output.items.length}`,
    `총 용량: ${formatBytes(output.totalSize)} / 제한 ${formatBytes(output.maxTotalBytes)}`,
    `파일별 제한: ${formatBytes(output.maxSingleBytes)}`,
    `허용 확장자: ${output.allowed.length ? output.allowed.join(", ") : "미입력"}`,
    "",
    "[전체 경고]",
    ...(output.globalWarnings.length ? output.globalWarnings.map((item) => `- ${item}`) : ["- 없음"]),
    "",
    "[파일별 검사]",
    ...output.items.map((item, index) => `${index + 1}. ${item.name} / ${formatBytes(item.size)} / .${item.extension || "-"} / ${item.warnings.length ? item.warnings.join(", ") : "통과"}`),
    "",
    `확인 필요 파일: ${problemItems.length}개`
  ].join("\n");
}

function renderBundleRuleResult(output) {
  const problemItems = output.items.filter((item) => item.warnings.length);
  const hasWarnings = Boolean(problemItems.length || output.globalWarnings.length);
  return `
    <div class="stat-grid">
      <div><span>파일 수</span><strong>${output.items.length}</strong></div>
      <div><span>총 용량</span><strong class="${output.totalSize > output.maxTotalBytes ? "status-warn" : "status-ok"}">${formatBytes(output.totalSize)}</strong></div>
      <div><span>확인 필요</span><strong class="${hasWarnings ? "status-warn" : "status-ok"}">${problemItems.length + output.globalWarnings.length}</strong></div>
    </div>
    <div class="result-block">
      <h3>제출 규칙 검사 결과</h3>
      ${
        hasWarnings
          ? `<ul class="warning-list">${[...output.globalWarnings, ...problemItems.map((item) => `${item.name}: ${item.warnings.join(", ")}`)].map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : `<p class="ok-line">입력한 규칙 기준으로 용량, 확장자, 파일명 위험 신호가 보이지 않습니다.</p>`
      }
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>파일명</th><th>확장자</th><th>용량</th><th>상태</th></tr></thead>
        <tbody>
          ${output.items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${escapeHtml(item.extension || "-")}</td>
                  <td>${formatBytes(item.size)}</td>
                  <td><strong class="${item.warnings.length ? "status-warn" : "status-ok"}">${item.warnings.length ? escapeHtml(item.warnings.join(", ")) : "통과"}</strong></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindFilenamePrivacyCheckerEvents() {
  const form = document.querySelector("#filenamePrivacyForm");
  const input = document.querySelector("#filenamePrivacyFiles");
  const count = document.querySelector("#filenamePrivacyCount");
  const reportButton = document.querySelector("#downloadFilenamePrivacyReport");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 파일 선택됨` : "파일명을 점검할 파일을 선택하세요";
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#filenamePrivacyResult");
    reportButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "파일명을 점검할 파일을 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.fileCount, allowImagesOnly: false });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    const output = inspectFilenamePrivacy(files);
    state.lastFilenamePrivacyReportBlob = new Blob([makeFilenamePrivacyReport(output)], { type: "text/plain;charset=utf-8" });
    reportButton.disabled = false;
    result.innerHTML = renderFilenamePrivacyResult(output);
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastFilenamePrivacyReportBlob) downloadBlob(state.lastFilenamePrivacyReportBlob, "goatool-filename-privacy.txt");
  });
}

function filenamePrivacyRules() {
  return [
    { label: "이메일", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
    { label: "전화번호", pattern: /(?:01[016789]|02|0[3-6]\d)[-.\s]?\d{3,4}[-.\s]?\d{4}/g },
    { label: "주민등록번호 형태", pattern: /\d{6}[-\s]?[1-4]\d{6}/g },
    { label: "생년월일 8자리", pattern: /(?:19|20)\d{2}[-._]?(?:0[1-9]|1[0-2])[-._]?(?:0[1-9]|[12]\d|3[01])/g }
  ];
}

function inspectFilenamePrivacy(files) {
  const rules = filenamePrivacyRules();
  const items = files.map((file) => {
    const hits = [];
    rules.forEach((rule) => {
      const matches = file.name.match(rule.pattern) || [];
      if (matches.length) hits.push({ label: rule.label, count: matches.length });
    });
    return {
      name: file.name,
      extension: extensionOf(file.name),
      size: file.size,
      hits
    };
  });
  return { items, problemCount: items.filter((item) => item.hits.length).length };
}

function makeFilenamePrivacyReport(output) {
  return [
    "goatool 파일명 개인정보 점검표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `파일 수: ${output.items.length}`,
    `확인 필요: ${output.problemCount}개`,
    "",
    ...output.items.map((item, index) => {
      const status = item.hits.length ? item.hits.map((hit) => hit.label).join(", ") : "위험 단서 없음";
      return `${index + 1}. ${item.name} / ${status}`;
    })
  ].join("\n");
}

function renderFilenamePrivacyResult(output) {
  return `
    <div class="stat-grid">
      <div><span>파일 수</span><strong>${output.items.length}</strong></div>
      <div><span>확인 필요</span><strong class="${output.problemCount ? "status-warn" : "status-ok"}">${output.problemCount}</strong></div>
      <div><span>검사 기준</span><strong>4</strong></div>
    </div>
    <div class="result-block">
      <h3>파일명 개인정보 점검 결과</h3>
      ${
        output.problemCount
          ? `<ul class="warning-list">${output.items
              .filter((item) => item.hits.length)
              .map((item) => `<li>${escapeHtml(item.name)}: ${escapeHtml(item.hits.map((hit) => hit.label).join(", "))}</li>`)
              .join("")}</ul>`
          : `<p class="ok-line">파일명에서 전화번호, 이메일, 주민등록번호 형태, 생년월일 8자리 단서가 보이지 않습니다.</p>`
      }
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>파일명</th><th>확장자</th><th>용량</th><th>상태</th></tr></thead>
        <tbody>
          ${output.items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${escapeHtml(item.extension || "-")}</td>
                  <td>${formatBytes(item.size)}</td>
                  <td><strong class="${item.hits.length ? "status-warn" : "status-ok"}">${item.hits.length ? escapeHtml(item.hits.map((hit) => hit.label).join(", ")) : "위험 단서 없음"}</strong></td>
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

function bindImageRedactorEvents() {
  const form = document.querySelector("#imageRedactorForm");
  const input = document.querySelector("#imageRedactorInput");
  const count = document.querySelector("#imageRedactorCount");
  const undoButton = document.querySelector("#undoRedaction");
  const resetButton = document.querySelector("#resetRedaction");
  const downloadButton = document.querySelector("#downloadRedactedImage");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "가릴 정보가 보이는 이미지를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#imageRedactorResult");
    undoButton.disabled = true;
    resetButton.disabled = true;
    downloadButton.disabled = true;
    state.lastImageRedactedBlob = null;
    if (!file) {
      showResultMessage(result, "가림 처리할 이미지를 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles([file], { maxCount: 1, allowImagesOnly: true });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "이미지를 작업 화면에 여는 중입니다...");
    try {
      const source = await loadImageSource(file);
      result.innerHTML = renderImageRedactorWorkspace(file, source);
      state.redactor = {
        file,
        source,
        rects: [],
        color: document.querySelector("#imageRedactorColor")?.value || "#111827",
        dragStart: null,
        previewRect: null
      };
      setupRedactorCanvas();
      document.querySelector("#imageRedactorCanvas")?.scrollIntoView({ block: "center" });
      undoButton.disabled = false;
      resetButton.disabled = false;
      downloadButton.disabled = false;
      updateRedactorButtons();
    } catch (error) {
      console.error(error);
      showResultMessage(result, "이미지를 열지 못했습니다. 일반 JPG, PNG, WebP 파일로 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  document.querySelector("#imageRedactorColor")?.addEventListener("change", (event) => {
    if (!state.redactor) return;
    state.redactor.color = event.target.value;
    drawRedactorCanvas();
  });

  undoButton?.addEventListener("click", () => {
    if (!state.redactor?.rects.length) return;
    state.redactor.rects.pop();
    drawRedactorCanvas();
    updateRedactorButtons();
  });

  resetButton?.addEventListener("click", () => {
    if (!state.redactor) return;
    state.redactor.rects = [];
    drawRedactorCanvas();
    updateRedactorButtons();
  });

  downloadButton?.addEventListener("click", async () => {
    const canvas = document.querySelector("#imageRedactorCanvas");
    if (!canvas) return;
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
    state.lastImageRedactedBlob = blob;
    state.lastImageRedactedName = `${removeExtension(safeBaseName(state.redactor?.file?.name || "image"))}_redacted.jpg`;
    downloadBlob(blob, state.lastImageRedactedName);
  });
}

function renderImageRedactorWorkspace(file, source) {
  return `
    <div class="stat-grid">
      <div><span>원본 픽셀</span><strong>${source.width}×${source.height}</strong></div>
      <div><span>가림 영역</span><strong id="redactorRectCount">0</strong></div>
      <div><span>원본 용량</span><strong>${formatBytes(file.size)}</strong></div>
    </div>
    <div class="result-block">
      <h3>가림 작업</h3>
      <p class="ok-line">아래 이미지에서 숨길 부분을 드래그하세요. 드래그를 끝내면 바로 박스가 적용됩니다.</p>
    </div>
    <div class="redactor-stage">
      <canvas id="imageRedactorCanvas" class="redactor-canvas" width="${source.width}" height="${source.height}" aria-label="이미지 민감정보 가림 캔버스"></canvas>
    </div>
  `;
}

function setupRedactorCanvas() {
  const canvas = document.querySelector("#imageRedactorCanvas");
  if (!canvas || !state.redactor) return;
  drawRedactorCanvas();

  canvas.addEventListener("pointerdown", (event) => {
    if (!state.redactor) return;
    canvas.setPointerCapture?.(event.pointerId);
    state.redactor.dragStart = redactorPoint(event, canvas);
    state.redactor.previewRect = null;
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.redactor?.dragStart) return;
    state.redactor.previewRect = rectFromPoints(state.redactor.dragStart, redactorPoint(event, canvas));
    drawRedactorCanvas();
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!state.redactor?.dragStart) return;
    const rect = rectFromPoints(state.redactor.dragStart, redactorPoint(event, canvas));
    if (rect.width >= 6 && rect.height >= 6) state.redactor.rects.push(rect);
    state.redactor.dragStart = null;
    state.redactor.previewRect = null;
    drawRedactorCanvas();
    updateRedactorButtons();
  });

  canvas.addEventListener("pointercancel", () => {
    if (!state.redactor) return;
    state.redactor.dragStart = null;
    state.redactor.previewRect = null;
    drawRedactorCanvas();
  });
}

function redactorPoint(event, canvas) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(canvas.width, ((event.clientX - bounds.left) / bounds.width) * canvas.width)),
    y: Math.max(0, Math.min(canvas.height, ((event.clientY - bounds.top) / bounds.height) * canvas.height))
  };
}

function rectFromPoints(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y)
  };
}

function drawRedactorCanvas() {
  const canvas = document.querySelector("#imageRedactorCanvas");
  if (!canvas || !state.redactor) return;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(state.redactor.source.image, 0, 0, canvas.width, canvas.height);
  context.fillStyle = state.redactor.color;
  state.redactor.rects.forEach((rect) => context.fillRect(rect.x, rect.y, rect.width, rect.height));
  if (state.redactor.previewRect) {
    context.save();
    context.globalAlpha = 0.72;
    context.fillStyle = state.redactor.color;
    context.fillRect(state.redactor.previewRect.x, state.redactor.previewRect.y, state.redactor.previewRect.width, state.redactor.previewRect.height);
    context.strokeStyle = "#ffffff";
    context.lineWidth = Math.max(2, Math.round(canvas.width / 360));
    context.strokeRect(state.redactor.previewRect.x, state.redactor.previewRect.y, state.redactor.previewRect.width, state.redactor.previewRect.height);
    context.restore();
  }
}

function updateRedactorButtons() {
  const count = state.redactor?.rects.length || 0;
  const counter = document.querySelector("#redactorRectCount");
  const undoButton = document.querySelector("#undoRedaction");
  const resetButton = document.querySelector("#resetRedaction");
  if (counter) counter.textContent = String(count);
  if (undoButton) undoButton.disabled = count === 0;
  if (resetButton) resetButton.disabled = count === 0;
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

function bindZipRepackerEvents() {
  const form = document.querySelector("#zipRepackerForm");
  const input = document.querySelector("#zipRepackInput");
  const count = document.querySelector("#zipRepackCount");
  const zipButton = document.querySelector("#downloadZipRepack");
  const reportButton = document.querySelector("#downloadZipRepackReport");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "다시 포장할 ZIP을 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#zipRepackerResult");
    zipButton.disabled = true;
    reportButton.disabled = true;
    state.lastZipRepackName = null;
    if (!file) {
      showResultMessage(result, "다시 포장할 ZIP을 먼저 선택하세요.", "warn");
      return;
    }
    if (extensionOf(file.name) !== "zip") {
      showResultMessage(result, "ZIP 파일만 다시 포장할 수 있습니다.", "warn");
      return;
    }

    setResultBusy(result, true, "ZIP을 읽고 새 ZIP으로 다시 묶는 중입니다...");
    try {
      const output = await repackZip(file, {
        removeSystem: document.querySelector("#zipRemoveSystem")?.checked ?? true,
        flatten: document.querySelector("#zipFlatten")?.checked ?? false,
        baseName: safeBaseName(document.querySelector("#zipRepackName")?.value || "goatool_clean_zip")
      });
      state.lastZipRepackBlob = output.blob;
      state.lastZipRepackName = output.fileName;
      state.lastZipRepackReportBlob = new Blob([makeZipRepackReport(output)], { type: "text/plain;charset=utf-8" });
      zipButton.disabled = false;
      reportButton.disabled = false;
      result.innerHTML = renderZipRepackResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "ZIP을 다시 포장하지 못했습니다. 암호가 걸렸거나 손상된 ZIP인지 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  zipButton?.addEventListener("click", () => {
    if (state.lastZipRepackBlob) downloadBlob(state.lastZipRepackBlob, state.lastZipRepackName || "goatool-clean.zip");
  });
  reportButton?.addEventListener("click", () => {
    if (state.lastZipRepackReportBlob) downloadBlob(state.lastZipRepackReportBlob, "goatool-zip-repack-report.txt");
  });
}

async function repackZip(file, options) {
  const source = await JSZip.loadAsync(await file.arrayBuffer());
  const output = new JSZip();
  const usedNames = new Set();
  const items = [];
  const skipped = [];
  const entries = Object.values(source.files).filter((entry) => !entry.dir);

  for (const entry of entries) {
    if (options.removeSystem && isSystemZipEntry(entry.name)) {
      skipped.push(entry.name);
      continue;
    }
    const rawName = options.flatten ? entry.name.split("/").filter(Boolean).pop() || "file" : entry.name;
    const safeName = uniqueZipName(safeZipEntryName(rawName), usedNames);
    const blob = await entry.async("blob");
    output.file(safeName, blob);
    items.push({ originalName: entry.name, newName: safeName, size: blob.size });
  }

  output.file(`${options.baseName}_report.txt`, makeZipRepackReport({ sourceName: file.name, items, skipped, blob: { size: 0 } }));
  return {
    sourceName: file.name,
    fileName: `${options.baseName}.zip`,
    items,
    skipped,
    blob: await output.generateAsync({ type: "blob" })
  };
}

function isSystemZipEntry(name) {
  const parts = String(name).split("/").filter(Boolean);
  return parts.some((part) => part === "__MACOSX" || part === ".DS_Store" || part === "Thumbs.db" || part.startsWith("._"));
}

function safeZipEntryName(name) {
  const cleaned = String(name || "file")
    .split("/")
    .map((part) => safeBaseName(part))
    .filter(Boolean)
    .join("/");
  return cleaned || "file";
}

function uniqueZipName(name, used) {
  const ext = extensionOf(name);
  const stem = removeExtension(name);
  let next = name;
  let index = 2;
  while (used.has(next.toLowerCase())) {
    next = ext ? `${stem}_${index}.${ext}` : `${stem}_${index}`;
    index += 1;
  }
  used.add(next.toLowerCase());
  return next;
}

function makeZipRepackReport(output) {
  return [
    "goatool ZIP 다시 포장 결과",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `원본 ZIP: ${output.sourceName}`,
    `포함 파일: ${output.items.length}`,
    `제외 파일: ${output.skipped.length}`,
    output.blob?.size ? `결과 ZIP 용량: ${formatBytes(output.blob.size)}` : "",
    "",
    "[포함 파일]",
    ...(output.items.length ? output.items.map((item, index) => `${index + 1}. ${item.originalName} -> ${item.newName}`) : ["- 없음"]),
    "",
    "[제외 파일]",
    ...(output.skipped.length ? output.skipped.map((item) => `- ${item}`) : ["- 없음"])
  ]
    .filter(Boolean)
    .join("\n");
}

function renderZipRepackResult(output) {
  return `
    <div class="stat-grid">
      <div><span>포함 파일</span><strong>${output.items.length}</strong></div>
      <div><span>제외 파일</span><strong class="${output.skipped.length ? "status-warn" : "status-ok"}">${output.skipped.length}</strong></div>
      <div><span>결과 ZIP</span><strong>${formatBytes(output.blob.size)}</strong></div>
    </div>
    <div class="result-block">
      <h3>ZIP 다시 포장 결과</h3>
      ${output.items.length ? `<p class="ok-line">선택한 기준으로 새 ZIP을 만들었습니다. 접수 전 내부 파일 수를 다시 확인하세요.</p>` : `<p class="warning-line">새 ZIP에 포함할 파일이 없습니다. 옵션과 원본 ZIP을 확인하세요.</p>`}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>원본 경로</th><th>새 ZIP 안 파일명</th><th>용량</th></tr></thead>
        <tbody>
          ${output.items.length ? output.items.map((item) => `<tr><td>${escapeHtml(item.originalName)}</td><td>${escapeHtml(item.newName)}</td><td>${formatBytes(item.size)}</td></tr>`).join("") : `<tr><td colspan="3">포함된 파일이 없습니다.</td></tr>`}
        </tbody>
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
  if (!value) {
    return `<p class="empty-result">텍스트를 붙여넣으면 글자수와 바이트를 계산합니다.</p>`;
  }
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

function bindScanReadabilityEvents() {
  const form = document.querySelector("#scanReadabilityForm");
  const input = document.querySelector("#scanReadabilityInput");
  const count = document.querySelector("#scanReadabilityCount");
  const reportButton = document.querySelector("#downloadScanReport");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 이미지 선택됨` : "문서 사진, 스캔본, 캡처 이미지를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#scanReadabilityResult");
    reportButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "가독성을 점검할 이미지를 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.imageCount, allowImagesOnly: true });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "밝기와 선명도 신호를 계산하는 중입니다...");
    try {
      const items = [];
      for (const file of files) {
        items.push(await inspectScanReadability(file));
      }
      state.lastScanReportBlob = new Blob([makeScanReport(items)], { type: "text/plain;charset=utf-8" });
      reportButton.disabled = false;
      result.innerHTML = renderScanReadabilityResult(items);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "이미지 품질을 계산하지 못했습니다. 일반 JPG, PNG, WebP 파일로 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastScanReportBlob) downloadBlob(state.lastScanReportBlob, "goatool-scan-readability.txt");
  });
}

async function inspectScanReadability(file) {
  const source = await loadImageSource(file);
  const maxSide = 360;
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(source.image, 0, 0, width, height);
  source.close?.();

  const data = context.getImageData(0, 0, width, height).data;
  const lum = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const value = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    lum[p] = value;
    sum += value;
  }
  const brightness = sum / lum.length;
  let variance = 0;
  for (let i = 0; i < lum.length; i += 1) variance += (lum[i] - brightness) ** 2;
  const contrast = Math.sqrt(variance / lum.length);
  let edge = 0;
  let samples = 0;
  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const idx = y * width + x;
      edge += Math.abs(lum[idx] - lum[idx - 1]) + Math.abs(lum[idx] - lum[idx - width]);
      samples += 2;
    }
  }
  const sharpness = samples ? edge / samples : 0;
  const warnings = collectScanWarnings({
    width: source.width,
    height: source.height,
    size: file.size,
    brightness,
    contrast,
    sharpness
  });

  return {
    name: file.name,
    width: source.width,
    height: source.height,
    size: file.size,
    brightness,
    contrast,
    sharpness,
    warnings
  };
}

function collectScanWarnings(item) {
  const warnings = [];
  if (Math.min(item.width, item.height) < 700) warnings.push("해상도 낮음");
  if (item.brightness < 72) warnings.push("너무 어두움");
  if (item.brightness > 222) warnings.push("너무 밝음");
  if (item.contrast < 28) warnings.push("대비 낮음");
  if (item.sharpness < 7) warnings.push("흐림 가능");
  if (item.size > 10 * 1024 * 1024) warnings.push("용량 큼");
  return warnings;
}

function makeScanReport(items) {
  return [
    "goatool 스캔 가독성 점검표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `이미지 수: ${items.length}`,
    "",
    ...items.map((item, index) => {
      const status = item.warnings.length ? item.warnings.join(", ") : "읽기 좋음";
      return `${index + 1}. ${item.name} / ${item.width}x${item.height} / 밝기 ${Math.round(item.brightness)} / 대비 ${Math.round(item.contrast)} / 선명도 ${item.sharpness.toFixed(1)} / ${status}`;
    })
  ].join("\n");
}

function renderScanReadabilityResult(items) {
  const warnCount = items.filter((item) => item.warnings.length).length;
  const averageSharpness = items.length ? items.reduce((sum, item) => sum + item.sharpness, 0) / items.length : 0;
  return `
    <div class="stat-grid">
      <div><span>이미지 수</span><strong>${items.length}</strong></div>
      <div><span>확인 필요</span><strong class="${warnCount ? "status-warn" : "status-ok"}">${warnCount}</strong></div>
      <div><span>평균 선명도</span><strong>${averageSharpness.toFixed(1)}</strong></div>
    </div>
    <div class="result-block">
      <h3>가독성 점검 결과</h3>
      ${
        warnCount
          ? `<ul class="warning-list">${items
              .filter((item) => item.warnings.length)
              .map((item) => `<li>${escapeHtml(item.name)}: ${escapeHtml(item.warnings.join(", "))}</li>`)
              .join("")}</ul>`
          : `<p class="ok-line">밝기, 대비, 흐림 신호에서 큰 위험은 보이지 않습니다. 작은 글씨는 확대해 마지막으로 확인하세요.</p>`
      }
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>파일명</th><th>픽셀</th><th>밝기</th><th>대비</th><th>선명도</th><th>상태</th></tr></thead>
        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${item.width}×${item.height}</td>
                  <td>${Math.round(item.brightness)}</td>
                  <td>${Math.round(item.contrast)}</td>
                  <td>${item.sharpness.toFixed(1)}</td>
                  <td><strong class="${item.warnings.length ? "status-warn" : "status-ok"}">${item.warnings.length ? escapeHtml(item.warnings.join(", ")) : "읽기 좋음"}</strong></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindImageDuplicateFinderEvents() {
  const form = document.querySelector("#imageDuplicateForm");
  const input = document.querySelector("#imageDuplicateInput");
  const count = document.querySelector("#imageDuplicateCount");
  const reportButton = document.querySelector("#downloadImageDuplicateReport");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 이미지 선택됨` : "스캔본이나 캡처 이미지를 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#imageDuplicateResult");
    reportButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "중복을 점검할 이미지를 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.imageCount, allowImagesOnly: true });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "이미지 중복 후보를 계산하는 중입니다...");
    try {
      const sensitivity = document.querySelector("#imageDuplicateSensitivity")?.value || "balanced";
      const output = await findImageDuplicates(files, sensitivity);
      state.lastImageDuplicateReportBlob = new Blob([makeImageDuplicateReport(output)], { type: "text/plain;charset=utf-8" });
      reportButton.disabled = false;
      result.innerHTML = renderImageDuplicateResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "이미지 중복을 계산하지 못했습니다. 일반 JPG, PNG, WebP 파일로 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastImageDuplicateReportBlob) downloadBlob(state.lastImageDuplicateReportBlob, "goatool-image-duplicates.txt");
  });
}

async function findImageDuplicates(files, sensitivity) {
  const thresholds = { strict: 0, balanced: 5, loose: 10 };
  const threshold = thresholds[sensitivity] ?? thresholds.balanced;
  const items = [];
  for (const file of files) {
    items.push(await imageAverageHash(file));
  }

  const pairs = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const distance = hammingDistance(items[i].hash, items[j].hash);
      if (distance <= threshold) {
        pairs.push({
          a: items[i],
          b: items[j],
          distance,
          similarity: Math.round((1 - distance / 64) * 100)
        });
      }
    }
  }
  pairs.sort((a, b) => a.distance - b.distance || a.a.name.localeCompare(b.a.name));
  return { items, pairs, threshold, sensitivity };
}

async function imageAverageHash(file) {
  const source = await loadImageSource(file);
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(source.image, 0, 0, 8, 8);
  source.close?.();

  const data = context.getImageData(0, 0, 8, 8).data;
  const values = [];
  for (let i = 0; i < data.length; i += 4) {
    values.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    name: file.name,
    size: file.size,
    width: source.width,
    height: source.height,
    hash: values.map((value) => (value >= average ? "1" : "0")).join("")
  };
}

function hammingDistance(a, b) {
  let distance = 0;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) distance += 1;
  }
  return distance + Math.abs(a.length - b.length);
}

function makeImageDuplicateReport(output) {
  return [
    "goatool 이미지 중복 점검표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `이미지 수: ${output.items.length}`,
    `중복 후보: ${output.pairs.length}쌍`,
    `기준 거리: ${output.threshold}`,
    "",
    "[중복 후보]",
    ...(output.pairs.length
      ? output.pairs.map((pair, index) => `${index + 1}. ${pair.a.name} <-> ${pair.b.name} / 유사도 ${pair.similarity}% / 거리 ${pair.distance}`)
      : ["- 없음"]),
    "",
    "[검사 이미지]",
    ...output.items.map((item, index) => `${index + 1}. ${item.name} / ${item.width}x${item.height} / ${formatBytes(item.size)}`)
  ].join("\n");
}

function renderImageDuplicateResult(output) {
  return `
    <div class="stat-grid">
      <div><span>이미지 수</span><strong>${output.items.length}</strong></div>
      <div><span>중복 후보</span><strong class="${output.pairs.length ? "status-warn" : "status-ok"}">${output.pairs.length}</strong></div>
      <div><span>기준 거리</span><strong>${output.threshold}</strong></div>
    </div>
    <div class="result-block">
      <h3>이미지 중복 점검 결과</h3>
      ${
        output.pairs.length
          ? `<ul class="warning-list">${output.pairs.slice(0, 8).map((pair) => `<li>${escapeHtml(pair.a.name)} ↔ ${escapeHtml(pair.b.name)} · 유사도 ${pair.similarity}%</li>`).join("")}</ul>`
          : `<p class="ok-line">선택한 기준에서는 뚜렷한 중복 후보가 보이지 않습니다.</p>`
      }
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>이미지 A</th><th>이미지 B</th><th>유사도</th><th>거리</th></tr></thead>
        <tbody>
          ${
            output.pairs.length
              ? output.pairs
                  .map(
                    (pair) => `
                      <tr>
                        <td>${escapeHtml(pair.a.name)}</td>
                        <td>${escapeHtml(pair.b.name)}</td>
                        <td><strong class="status-warn">${pair.similarity}%</strong></td>
                        <td>${pair.distance}</td>
                      </tr>
                    `
                  )
                  .join("")
              : `<tr><td colspan="4">중복 후보가 없습니다.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function bindFileDuplicateFinderEvents() {
  const form = document.querySelector("#fileDuplicateForm");
  const input = document.querySelector("#fileDuplicateFiles");
  const count = document.querySelector("#fileDuplicateCount");
  const reportButton = document.querySelector("#downloadFileDuplicateReport");

  input?.addEventListener("change", () => {
    count.textContent = input.files?.length ? `${input.files.length}개 파일 선택됨` : "내용 중복을 찾을 파일을 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(input?.files || []);
    const result = document.querySelector("#fileDuplicateResult");
    reportButton.disabled = true;
    if (!files.length) {
      showResultMessage(result, "내용 중복을 점검할 파일을 먼저 선택하세요.", "warn");
      return;
    }
    const validation = validateFiles(files, { maxCount: LIMITS.fileCount, allowImagesOnly: false });
    if (!validation.ok) {
      showResultMessage(result, validation.message, "warn");
      return;
    }

    setResultBusy(result, true, "파일 해시를 계산해 중복 그룹을 찾는 중입니다...");
    try {
      const output = await findFileDuplicates(files);
      state.lastFileDuplicateReportBlob = new Blob([makeFileDuplicateReport(output)], { type: "text/plain;charset=utf-8" });
      reportButton.disabled = false;
      result.innerHTML = renderFileDuplicateResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, "파일 해시를 계산하지 못했습니다. 대용량 파일은 나누어 다시 시도하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastFileDuplicateReportBlob) downloadBlob(state.lastFileDuplicateReportBlob, "goatool-file-duplicates.txt");
  });
}

async function findFileDuplicates(files) {
  const items = [];
  for (const file of files) {
    items.push({
      name: file.name,
      size: file.size,
      extension: extensionOf(file.name),
      hash: await hashFile(file)
    });
  }
  const groupsMap = new Map();
  items.forEach((item) => {
    const group = groupsMap.get(item.hash) || [];
    group.push(item);
    groupsMap.set(item.hash, group);
  });
  const duplicateGroups = [...groupsMap.values()].filter((group) => group.length > 1);
  return { items, duplicateGroups };
}

function makeFileDuplicateReport(output) {
  return [
    "goatool 파일 내용 중복 점검표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `파일 수: ${output.items.length}`,
    `중복 그룹: ${output.duplicateGroups.length}개`,
    "",
    "[중복 그룹]",
    ...(output.duplicateGroups.length
      ? output.duplicateGroups.map((group, index) => `${index + 1}. ${group.map((item) => item.name).join(" / ")} / SHA-256 ${group[0].hash}`)
      : ["- 없음"]),
    "",
    "[전체 파일]",
    ...output.items.map((item, index) => `${index + 1}. ${item.name} / ${formatBytes(item.size)} / SHA-256 ${item.hash}`)
  ].join("\n");
}

function renderFileDuplicateResult(output) {
  const duplicateFileCount = output.duplicateGroups.reduce((sum, group) => sum + group.length, 0);
  return `
    <div class="stat-grid">
      <div><span>파일 수</span><strong>${output.items.length}</strong></div>
      <div><span>중복 그룹</span><strong class="${output.duplicateGroups.length ? "status-warn" : "status-ok"}">${output.duplicateGroups.length}</strong></div>
      <div><span>중복 파일</span><strong>${duplicateFileCount}</strong></div>
    </div>
    <div class="result-block">
      <h3>파일 내용 중복 점검 결과</h3>
      ${
        output.duplicateGroups.length
          ? `<ul class="warning-list">${output.duplicateGroups.map((group) => `<li>${group.map((item) => escapeHtml(item.name)).join(" / ")}</li>`).join("")}</ul>`
          : `<p class="ok-line">SHA-256 기준으로 완전히 같은 파일은 보이지 않습니다.</p>`
      }
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>파일명</th><th>용량</th><th>SHA-256 앞 12자리</th><th>상태</th></tr></thead>
        <tbody>
          ${output.items
            .map((item) => {
              const duplicated = output.duplicateGroups.some((group) => group.some((groupItem) => groupItem.hash === item.hash));
              return `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${formatBytes(item.size)}</td>
                  <td><code>${item.hash.slice(0, 12)}</code></td>
                  <td><strong class="${duplicated ? "status-warn" : "status-ok"}">${duplicated ? "중복" : "단일"}</strong></td>
                </tr>
              `;
            })
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

function bindTablePrivacyCheckerEvents() {
  const form = document.querySelector("#tablePrivacyForm");
  const input = document.querySelector("#tablePrivacyInput");
  const count = document.querySelector("#tablePrivacyCount");
  const reportButton = document.querySelector("#downloadTablePrivacyReport");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    count.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : "개인정보 패턴을 찾을 표 파일을 선택하세요";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input?.files?.[0];
    const result = document.querySelector("#tablePrivacyResult");
    reportButton.disabled = true;
    if (!file) {
      showResultMessage(result, "점검할 CSV 또는 XLSX 파일을 먼저 선택하세요.", "warn");
      return;
    }
    if (!["csv", "txt", "xlsx"].includes(extensionOf(file.name))) {
      showResultMessage(result, "CSV, TXT, XLSX 파일만 점검할 수 있습니다.", "warn");
      return;
    }
    if (file.size > LIMITS.csvTextBytes && extensionOf(file.name) !== "xlsx") {
      showResultMessage(result, `${file.name} 파일이 ${formatBytes(LIMITS.csvTextBytes)}를 넘습니다. 필요한 행만 남긴 뒤 다시 시도하세요.`, "warn");
      return;
    }

    setResultBusy(result, true, "표 안의 개인정보 패턴을 찾는 중입니다...");
    try {
      const rows = await readTableFile(file);
      validateTableSize(rows);
      const output = inspectTablePrivacy(file, rows);
      state.lastTablePrivacyReportBlob = new Blob([makeTablePrivacyReport(output)], { type: "text/plain;charset=utf-8" });
      reportButton.disabled = false;
      result.innerHTML = renderTablePrivacyResult(output);
    } catch (error) {
      console.error(error);
      showResultMessage(result, error.message || "표 파일을 점검하지 못했습니다. CSV 형식 또는 XLSX 첫 번째 시트를 확인하세요.", "warn");
    } finally {
      result.removeAttribute("aria-busy");
    }
  });

  reportButton?.addEventListener("click", () => {
    if (state.lastTablePrivacyReportBlob) downloadBlob(state.lastTablePrivacyReportBlob, "goatool-table-privacy-check.txt");
  });
}

function privacyPatternRules() {
  return [
    { label: "이메일", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
    { label: "전화번호", pattern: /(?:01[016789]|02|0[3-6]\d)[-.\s]?\d{3,4}[-.\s]?\d{4}/g },
    { label: "주민등록번호 형태", pattern: /\d{6}[-\s]?[1-4]\d{6}/g },
    { label: "생년월일 8자리", pattern: /(?:19|20)\d{2}[-._]?(?:0[1-9]|1[0-2])[-._]?(?:0[1-9]|[12]\d|3[01])/g }
  ];
}

function inspectTablePrivacy(file, rows) {
  const rules = privacyPatternRules();
  const hits = [];
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const value = String(cell ?? "");
      if (!value.trim()) return;
      rules.forEach((rule) => {
        const matches = [...value.matchAll(rule.pattern)];
        matches.forEach((match) => {
          hits.push({
            row: rowIndex + 1,
            col: colIndex + 1,
            type: rule.label,
            preview: maskPrivacyPreview(match[0]),
            cellPreview: maskPrivacyPreview(value)
          });
        });
      });
    });
  });
  return {
    fileName: file.name,
    rows: rows.length,
    cols: Math.max(0, ...rows.map((row) => row.length)),
    hits: hits.slice(0, 200),
    hitOverflow: Math.max(0, hits.length - 200),
    totalHits: hits.length
  };
}

function maskPrivacyPreview(value) {
  const text = String(value ?? "");
  if (text.length <= 4) return "*".repeat(text.length);
  const masked = `${text.slice(0, 2)}${"*".repeat(Math.min(12, Math.max(3, text.length - 4)))}${text.slice(-2)}`;
  return masked.length > 40 ? `${masked.slice(0, 18)}...${masked.slice(-12)}` : masked;
}

function makeTablePrivacyReport(output) {
  return [
    "goatool 표 개인정보 점검표",
    `생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    `파일명: ${output.fileName}`,
    `행/열: ${output.rows}/${output.cols}`,
    `후보 수: ${output.totalHits}`,
    output.hitOverflow ? `표시 제외 후보: ${output.hitOverflow}` : "",
    "",
    ...(
      output.hits.length
        ? output.hits.map((hit, index) => `${index + 1}. ${hit.row}행 ${hit.col}열 / ${hit.type} / ${hit.preview}`)
        : ["후보 없음"]
    )
  ]
    .filter(Boolean)
    .join("\n");
}

function renderTablePrivacyResult(output) {
  return `
    <div class="stat-grid">
      <div><span>행/열</span><strong>${output.rows}/${output.cols}</strong></div>
      <div><span>후보 수</span><strong class="${output.totalHits ? "status-warn" : "status-ok"}">${output.totalHits}</strong></div>
      <div><span>표시</span><strong>${output.hits.length}</strong></div>
    </div>
    <div class="result-block">
      <h3>표 개인정보 점검 결과</h3>
      ${
        output.totalHits
          ? `<ul class="warning-list">${output.hits.slice(0, 8).map((hit) => `<li>${hit.row}행 ${hit.col}열: ${escapeHtml(hit.type)} 후보</li>`).join("")}</ul>`
          : `<p class="ok-line">검사 기준에서 개인정보 패턴 후보가 보이지 않습니다.</p>`
      }
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>위치</th><th>유형</th><th>후보</th><th>셀 미리보기</th></tr></thead>
        <tbody>
          ${
            output.hits.length
              ? output.hits
                  .map((hit) => `<tr><td>${hit.row}행 ${hit.col}열</td><td>${escapeHtml(hit.type)}</td><td>${escapeHtml(hit.preview)}</td><td>${escapeHtml(hit.cellPreview)}</td></tr>`)
                  .join("")
              : `<tr><td colspan="4">후보가 없습니다.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function parseCsv(text) {
  return parseDelimited(text, ",");
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

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>`;
}

function viewerIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h5"/><circle cx="17" cy="15" r="2"/><path d="m18.5 16.5 2 2"/></svg>`;
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
