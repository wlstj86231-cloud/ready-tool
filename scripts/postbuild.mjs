import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { guideIndexMeta, guidePages } from "../src/guides.js";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "../dist");
const base = "https://goatool.com";
const brandIcon = `${base}/brand/goatool-icon-512.png`;
const brandImage = `${base}/brand/goatool-og.png`;
const lastUpdated = "2026-05-14";

const coreRoutes = [
  "/tools/photo-resize/",
  "/tools/pdf-organizer/",
  "/tools/file-viewer/",
  "/tools/pdf-page-labeler/",
  "/tools/pdf-rotate/",
  "/tools/pdf-info/",
  "/tools/pdf-a4-normalizer/",
  "/tools/pdf-splitter/",
  "/tools/pdf-blank-remover/",
  "/tools/pdf-page-delete/",
  "/tools/pdf-metadata-cleaner/",
  "/tools/pdf-password-checker/",
  "/tools/pdf-repair-basic/",
  "/tools/pdf-single-page-zip/",
  "/tools/pdf-odd-even-splitter/",
  "/tools/file-ready/",
  "/tools/required-doc-checker/",
  "/tools/bundle-rule-checker/",
  "/tools/filename-privacy-checker/",
  "/tools/image-privacy/",
  "/tools/image-redactor/",
  "/tools/filename-cleaner/",
  "/tools/filename-numberer/",
  "/tools/filename-date-stamper/",
  "/tools/extension-auto-fixer/",
  "/tools/image-to-pdf/",
  "/tools/zip-inspector/",
  "/tools/zip-repacker/",
  "/tools/zip-extension-checker/",
  "/tools/zip-repair-basic/",
  "/tools/zip-folder-flattener/",
  "/tools/office-zip-repair/",
  "/tools/image-inspector/",
  "/tools/image-compressor/",
  "/tools/image-format-converter/",
  "/tools/image-batch-resizer/",
  "/tools/image-white-canvas/",
  "/tools/image-auto-enhance/",
  "/tools/image-dpi-checker/",
  "/tools/image-aspect-checker/",
  "/tools/image-repair-basic/",
  "/tools/image-background-flattener/",
  "/tools/image-border-trimmer/",
  "/tools/image-square-cropper/",
  "/tools/image-contact-sheet/",
  "/tools/image-sharpness-checker/",
  "/tools/image-transparency-checker/",
  "/tools/scan-readability/",
  "/tools/image-duplicate-finder/",
  "/tools/file-duplicate-finder/",
  "/tools/file-list/",
  "/tools/empty-file-finder/",
  "/tools/temp-file-finder/",
  "/tools/extension-mismatch-checker/",
  "/tools/file-size-sorter/",
  "/tools/folder-tree-exporter/",
  "/tools/file-repair-attempt/",
  "/tools/hash-compare/",
  "/tools/data-clean/",
  "/tools/table-privacy-checker/",
  "/about/",
  "/privacy/",
  "/terms/",
  "/contact/",
  guideIndexMeta.path
];

const routes = [...coreRoutes, ...guidePages.map((guide) => guide.path)];
const guideByPath = new Map(guidePages.map((guide) => [guide.path, guide]));

const routeMeta = {
  "/": {
    title: "goatool - 민원·입사지원 파일 변환, PDF, 사진 규격 도구",
    description:
      "goatool은 민원 제출과 입사지원 전에 PDF 합치기, A4 맞춤, PDF 나누기, ZIP 다시 포장, 증명사진 규격, 제출 규칙 검사, 개인정보 가림, 표 개인정보 점검을 브라우저에서 처리하는 실용 도구입니다."
  },
  "/tools/photo-resize/": {
    title: "증명사진 규격 맞추기 - goatool",
    description:
      "이력서 사진, 응시원서 사진, 민원 첨부 사진을 3x4, 3.5x4.5, 100x140, 150x210 같은 규격과 용량 기준에 맞춰 새 JPG로 만듭니다.",
    type: "SoftwareApplication",
    features: ["증명사진 리사이즈", "JPG 용량 조절", "3x4 비율", "입사지원 사진 규격"]
  },
  "/tools/pdf-organizer/": {
    title: "PDF 합치기·페이지 뽑기 - goatool",
    description:
      "여러 PDF를 하나로 합치거나 긴 PDF에서 필요한 페이지만 추출해 민원·입사지원 제출용 PDF를 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["PDF 합치기", "PDF 페이지 추출", "제출용 PDF", "브라우저 PDF 처리"]
  },
  "/tools/file-viewer/": {
    title: "파일 뷰어 - goatool",
    description: "XLSX, HWPX, PDF, 이미지, ZIP 같은 제출 파일이 열리는지 브라우저에서 미리 확인합니다.",
    type: "SoftwareApplication",
    features: ["파일 미리보기", "PDF 이미지 확인", "ZIP 구조 확인", "브라우저 처리"]
  },
  "/tools/pdf-page-labeler/": {
    title: "PDF 페이지 번호 붙이기 - goatool",
    description:
      "긴 사업계획서, 포트폴리오, 증빙 PDF 하단에 페이지 번호를 붙여 제출본 순서와 누락 여부를 확인하기 쉽게 만듭니다.",
    type: "SoftwareApplication",
    features: ["PDF 페이지 번호", "하단 쪽수", "총쪽수 표시", "브라우저 PDF 처리"]
  },
  "/tools/pdf-rotate/": {
    title: "PDF 페이지 회전 - goatool",
    description:
      "옆으로 누운 스캔본과 증빙 PDF의 전체 또는 일부 페이지를 90도, 180도, 270도로 회전해 새 PDF로 만듭니다.",
    type: "SoftwareApplication",
    features: ["PDF 회전", "일부 페이지 회전", "스캔본 방향 보정", "브라우저 PDF 처리"]
  },
  "/tools/pdf-info/": {
    title: "PDF 구조 점검 - goatool",
    description:
      "PDF 쪽수, 첫 페이지 크기, 가로 페이지, 페이지 크기 혼합 여부를 제출 전에 브라우저에서 확인합니다.",
    type: "SoftwareApplication",
    features: ["PDF 쪽수 확인", "PDF 페이지 크기", "가로 페이지 점검", "구조 점검 TXT"]
  },
  "/tools/pdf-a4-normalizer/": {
    title: "PDF A4 맞춤 - goatool",
    description:
      "크기가 섞인 스캔본과 이미지 PDF 페이지를 A4 여백 안에 맞춰 새 제출용 PDF로 다시 만듭니다.",
    type: "SoftwareApplication",
    features: ["PDF A4 맞춤", "페이지 크기 통일", "A4 세로", "A4 가로"]
  },
  "/tools/pdf-splitter/": {
    title: "PDF 나누기 - goatool",
    description:
      "긴 PDF를 5쪽, 10쪽 같은 일정 쪽수 단위로 나누고 결과 PDF들을 ZIP으로 묶어 내려받습니다.",
    type: "SoftwareApplication",
    features: ["PDF 분할", "쪽수 단위", "결과 ZIP", "PDF 제출 준비"]
  },
  "/tools/pdf-blank-remover/": {
    title: "PDF 빈 페이지 정리 - goatool",
    description:
      "PDF 안의 구조상 빈 페이지를 찾아 제외하고 제출용 새 PDF와 점검 보고서를 만듭니다.",
    type: "SoftwareApplication",
    features: ["PDF 빈 페이지", "빈 쪽 제거", "PDF 정리", "점검 보고서"]
  },
  "/tools/pdf-page-delete/": {
    title: "PDF 페이지 삭제 - goatool",
    description: "PDF에서 필요 없는 페이지를 제외한 새 제출용 PDF를 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["PDF 페이지 삭제", "페이지 범위", "제출용 PDF", "브라우저 PDF 처리"]
  },
  "/tools/pdf-metadata-cleaner/": {
    title: "PDF 메타데이터 정리 - goatool",
    description: "PDF의 제목, 작성자, 주제, 키워드 같은 문서 속성을 비운 새 PDF를 만듭니다.",
    type: "SoftwareApplication",
    features: ["PDF 메타데이터", "작성자 정보 최소화", "문서 속성 정리", "브라우저 PDF 처리"]
  },
  "/tools/pdf-password-checker/": {
    title: "PDF 암호 여부 점검 - goatool",
    description: "여러 PDF가 암호 없이 열리는지 브라우저에서 확인하고 보고서로 정리합니다.",
    type: "SoftwareApplication",
    features: ["PDF 암호 점검", "열림 상태 확인", "손상 가능성 확인", "점검 보고서"]
  },
  "/tools/pdf-repair-basic/": {
    title: "PDF 복구 시도 - goatool",
    description: "브라우저에서 열리는 PDF의 페이지를 새 문서로 복사해 다시 저장합니다.",
    type: "SoftwareApplication",
    features: ["PDF 재저장", "페이지 복사", "복구 시도", "브라우저 처리"]
  },
  "/tools/pdf-single-page-zip/": {
    title: "PDF 페이지별 분리 - goatool",
    description: "PDF를 한 페이지씩 개별 PDF로 나눠 ZIP으로 내려받습니다.",
    type: "SoftwareApplication",
    features: ["PDF 페이지 분리", "개별 PDF", "결과 ZIP", "페이지 확인"]
  },
  "/tools/pdf-odd-even-splitter/": {
    title: "PDF 홀짝 분리 - goatool",
    description: "PDF를 홀수 페이지 묶음과 짝수 페이지 묶음으로 나눕니다.",
    type: "SoftwareApplication",
    features: ["PDF 홀짝 분리", "스캔 정리", "결과 ZIP", "브라우저 처리"]
  },
  "/tools/file-ready/": {
    title: "제출 파일 점검·ZIP - goatool",
    description:
      "여러 파일의 파일명, 용량, 확장자, 중복 여부를 확인하고 제출용 ZIP과 점검표를 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["파일명 점검", "SHA-256 해시", "제출용 ZIP", "점검표 TXT"]
  },
  "/tools/required-doc-checker/": {
    title: "제출서류 누락 대조 - goatool",
    description:
      "정책자금, 고용지원, 민원, 입사지원 유형을 고르면 대표 제출서류를 자동 입력하고 필수 누락, 해당 시 서류, 파일명 주의 신호를 대조합니다.",
    type: "SoftwareApplication",
    features: ["신청별 제출서류 자동 입력", "필수·해당 시 서류 구분", "파일명 날짜 주의", "대조표 TXT"]
  },
  "/tools/bundle-rule-checker/": {
    title: "제출 규칙 검사 - goatool",
    description:
      "접수처의 총용량, 파일별 용량, 허용 확장자 조건에 선택한 제출 파일 묶음이 맞는지 확인합니다.",
    type: "SoftwareApplication",
    features: ["총용량 검사", "파일별 용량 제한", "허용 확장자 확인", "제출 규칙 TXT"]
  },
  "/tools/filename-privacy-checker/": {
    title: "파일명 개인정보 점검 - goatool",
    description:
      "파일명에 전화번호, 이메일, 주민등록번호 형태, 생년월일 같은 민감 단서가 들어갔는지 제출 전에 확인합니다.",
    type: "SoftwareApplication",
    features: ["파일명 개인정보 점검", "전화번호 패턴", "이메일 패턴", "주민등록번호 형태"]
  },
  "/tools/image-privacy/": {
    title: "이미지 용량·개인정보 정리 - goatool",
    description:
      "사진과 캡처 이미지를 캔버스로 다시 저장해 EXIF 노출 가능성을 줄이고 제출용 이미지 ZIP을 만듭니다.",
    type: "SoftwareApplication",
      features: ["캔버스 재저장", "EXIF 노출 가능성 감소", "이미지 리사이즈", "결과 ZIP"]
  },
  "/tools/image-redactor/": {
    title: "이미지 민감정보 가리기 - goatool",
    description:
      "신분증, 등본 캡처, 통장 사본 이미지에서 노출되면 안 되는 영역을 직접 드래그해 가린 JPG 사본을 만듭니다.",
    type: "SoftwareApplication",
    features: ["이미지 가림 처리", "개인정보 마스킹", "캔버스 편집", "JPG 다운로드"]
  },
  "/tools/filename-cleaner/": {
    title: "파일명 일괄 정리 - goatool",
    description:
      "여러 파일의 특수문자, 공백, 번호, 날짜를 정리하고 제출용 파일명 변경표와 ZIP을 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["파일명 일괄 정리", "제출용 ZIP", "변경표 TXT", "특수문자 정리"]
  },
  "/tools/filename-numberer/": {
    title: "파일명 번호 붙이기 - goatool",
    description: "선택한 파일명 앞에 01, 02 번호를 붙인 새 ZIP과 변경표를 만듭니다.",
    type: "SoftwareApplication",
    features: ["파일명 번호", "순서 고정", "제출용 ZIP", "변경표"]
  },
  "/tools/filename-date-stamper/": {
    title: "파일명 날짜 붙이기 - goatool",
    description: "선택한 파일명 앞에 제출일 날짜를 붙인 새 ZIP과 변경표를 만듭니다.",
    type: "SoftwareApplication",
    features: ["파일명 날짜", "날짜 접두어", "제출용 ZIP", "변경표"]
  },
  "/tools/extension-auto-fixer/": {
    title: "확장자 자동 수정 - goatool",
    description: "파일 서명을 확인해 새 ZIP 안에서 PDF, 이미지, ZIP 계열 파일의 확장자를 바로잡습니다.",
    type: "SoftwareApplication",
    features: ["파일 서명 확인", "확장자 수정", "결과 ZIP", "브라우저 처리"]
  },
  "/tools/image-to-pdf/": {
    title: "이미지 PDF 변환 - goatool",
    description:
      "JPG, PNG, WebP 이미지와 스캔본을 페이지별 PDF로 묶어 제출용 첨부 파일을 브라우저에서 만듭니다.",
    type: "SoftwareApplication",
    features: ["JPG PDF 변환", "PNG PDF 변환", "스캔본 PDF", "이미지 묶기"]
  },
  "/tools/zip-inspector/": {
    title: "ZIP 내용 점검 - goatool",
    description:
      "ZIP 파일 안의 내부 파일 수, 폴더 깊이, 파일명 위험 신호를 브라우저에서 확인하고 파일 목록 TXT를 만듭니다.",
    type: "SoftwareApplication",
    features: ["ZIP 내부 목록", "폴더 깊이 확인", "숨김 파일 점검", "파일 목록 TXT"]
  },
  "/tools/zip-repacker/": {
    title: "ZIP 다시 포장 - goatool",
    description:
      "ZIP 안의 숨김·시스템 파일을 제외하고 필요하면 폴더를 평탄화해 새 제출용 ZIP으로 다시 묶습니다.",
    type: "SoftwareApplication",
    features: ["ZIP 재포장", "숨김파일 제거", "폴더 평탄화", "제출용 ZIP"]
  },
  "/tools/zip-extension-checker/": {
    title: "ZIP 확장자 검사 - goatool",
    description: "ZIP 내부 파일 확장자를 허용 목록과 비교해 접수처에서 막힐 수 있는 파일을 찾습니다.",
    type: "SoftwareApplication",
    features: ["ZIP 확장자", "허용 형식 비교", "내부 파일 점검", "점검 보고서"]
  },
  "/tools/zip-repair-basic/": {
    title: "ZIP 복구 시도 - goatool",
    description: "브라우저에서 열리는 ZIP의 내부 항목을 새 ZIP으로 다시 포장합니다.",
    type: "SoftwareApplication",
    features: ["ZIP 재포장", "복구 시도", "읽히는 항목 보존", "결과 ZIP"]
  },
  "/tools/zip-folder-flattener/": {
    title: "ZIP 폴더 평탄화 - goatool",
    description: "ZIP 안의 하위 폴더를 풀어 파일을 한 층으로 모은 새 ZIP을 만듭니다.",
    type: "SoftwareApplication",
    features: ["ZIP 폴더 정리", "한 층 재포장", "파일명 충돌 처리", "결과 ZIP"]
  },
  "/tools/office-zip-repair/": {
    title: "오피스 파일 복구 시도 - goatool",
    description: "DOCX, XLSX, PPTX, HWPX처럼 ZIP 구조를 쓰는 파일을 다시 포장합니다.",
    type: "SoftwareApplication",
    features: ["DOCX 재포장", "XLSX 재포장", "PPTX 재포장", "HWPX 재포장"]
  },
  "/tools/image-inspector/": {
    title: "이미지 규격 확인 - goatool",
    description:
      "사진과 스캔 이미지의 픽셀 크기, 비율, 용량, 확장자를 브라우저에서 확인합니다.",
    type: "SoftwareApplication",
    features: ["이미지 픽셀 확인", "이미지 용량 확인", "비율 계산", "다중 이미지 표"]
  },
  "/tools/image-compressor/": {
    title: "이미지 압축 - goatool",
    description: "사진과 캡처 이미지를 JPG로 다시 저장해 용량을 줄이고 ZIP으로 묶습니다.",
    type: "SoftwareApplication",
    features: ["이미지 압축", "JPG 저장", "긴 변 축소", "결과 ZIP"]
  },
  "/tools/image-format-converter/": {
    title: "이미지 형식 변환 - goatool",
    description: "브라우저가 읽을 수 있는 이미지를 JPG, PNG, WebP 형식으로 다시 저장합니다.",
    type: "SoftwareApplication",
    features: ["이미지 형식 변환", "JPG", "PNG", "WebP"]
  },
  "/tools/image-batch-resizer/": {
    title: "이미지 일괄 리사이즈 - goatool",
    description: "여러 이미지의 긴 변 크기를 기준으로 한 번에 줄여 제출용 ZIP으로 묶습니다.",
    type: "SoftwareApplication",
    features: ["이미지 리사이즈", "일괄 처리", "긴 변 기준", "결과 ZIP"]
  },
  "/tools/image-white-canvas/": {
    title: "흰 배경 캔버스 맞춤 - goatool",
    description: "이미지를 정사각형 또는 A4 비율의 흰 배경 안에 잘리지 않게 배치합니다.",
    type: "SoftwareApplication",
    features: ["흰 배경", "정사각 캔버스", "A4 비율", "이미지 여백"]
  },
  "/tools/image-auto-enhance/": {
    title: "이미지 밝기 보정 - goatool",
    description: "어두운 스캔 이미지와 캡처의 밝기와 대비를 브라우저 캔버스에서 가볍게 보정합니다.",
    type: "SoftwareApplication",
    features: ["이미지 밝기", "대비 보정", "스캔 보정", "결과 ZIP"]
  },
  "/tools/image-dpi-checker/": {
    title: "이미지 DPI 점검 - goatool",
    description: "이미지의 픽셀 크기와 JFIF, PNG 밀도 정보를 확인해 인쇄용 위험 신호를 줄입니다.",
    type: "SoftwareApplication",
    features: ["이미지 DPI", "픽셀 확인", "JFIF", "PNG pHYs"]
  },
  "/tools/image-aspect-checker/": {
    title: "이미지 비율 검사 - goatool",
    description: "여러 이미지가 정사각형, 3:4, A4 같은 목표 비율과 얼마나 다른지 확인합니다.",
    type: "SoftwareApplication",
    features: ["이미지 비율", "목표 비율", "규격 검사", "보고서"]
  },
  "/tools/image-repair-basic/": {
    title: "이미지 복구 시도 - goatool",
    description: "브라우저에서 열리는 이미지를 새 JPG로 다시 저장해 손상 가능성을 줄입니다.",
    type: "SoftwareApplication",
    features: ["이미지 재저장", "JPG 인코딩", "복구 시도", "결과 ZIP"]
  },
  "/tools/image-background-flattener/": {
    title: "투명 배경 흰색 처리 - goatool",
    description: "투명 PNG와 WebP를 흰 배경 JPG로 합성해 제출 화면 배경 문제를 줄입니다.",
    type: "SoftwareApplication",
    features: ["투명 배경 처리", "흰 배경", "JPG 저장", "결과 ZIP"]
  },
  "/tools/image-border-trimmer/": {
    title: "이미지 여백 자동 자르기 - goatool",
    description: "스캔본과 캡처 이미지의 바깥 흰 여백을 찾아 잘라낸 새 이미지를 만듭니다.",
    type: "SoftwareApplication",
    features: ["이미지 여백", "스캔 정리", "자동 자르기", "결과 ZIP"]
  },
  "/tools/image-square-cropper/": {
    title: "이미지 정사각형 크롭 - goatool",
    description: "이미지를 가운데 기준 정사각형으로 잘라 새 JPG로 저장합니다.",
    type: "SoftwareApplication",
    features: ["정사각형 이미지", "가운데 크롭", "JPG 저장", "결과 ZIP"]
  },
  "/tools/image-contact-sheet/": {
    title: "이미지 모아보기 시트 - goatool",
    description: "여러 이미지를 작은 미리보기 격자로 배치한 확인용 JPG를 만듭니다.",
    type: "SoftwareApplication",
    features: ["이미지 모아보기", "확인용 시트", "JPG 저장", "브라우저 처리"]
  },
  "/tools/image-sharpness-checker/": {
    title: "이미지 선명도 점검 - goatool",
    description: "스캔 이미지와 사진의 흐림 가능성을 가장자리 변화량으로 빠르게 확인합니다.",
    type: "SoftwareApplication",
    features: ["이미지 선명도", "흐림 가능성", "스캔 점검", "보고서"]
  },
  "/tools/image-transparency-checker/": {
    title: "투명 배경 점검 - goatool",
    description: "PNG, WebP 이미지에 투명 영역이 남아 있는지 확인합니다.",
    type: "SoftwareApplication",
    features: ["투명도 점검", "알파 채널", "이미지 점검", "보고서"]
  },
  "/tools/scan-readability/": {
    title: "스캔 가독성 점검 - goatool",
    description:
      "스캔본과 증빙 캡처 이미지의 밝기, 대비, 흐림 가능성, 해상도를 계산해 제출 전 읽힘 위험 신호를 확인합니다.",
    type: "SoftwareApplication",
    features: ["스캔 밝기 점검", "이미지 대비 계산", "흐림 가능성 확인", "해상도 점검"]
  },
  "/tools/image-duplicate-finder/": {
    title: "이미지 중복 점검 - goatool",
    description:
      "여러 스캔본과 캡처 이미지의 축소 해시를 비교해 같은 이미지나 매우 비슷한 이미지 후보를 찾습니다.",
    type: "SoftwareApplication",
    features: ["이미지 중복 점검", "스캔본 중복 후보", "캡처 비교", "중복 보고서 TXT"]
  },
  "/tools/file-duplicate-finder/": {
    title: "파일 내용 중복 점검 - goatool",
    description:
      "여러 제출 파일의 SHA-256 값을 계산해 파일명이 달라도 내용이 완전히 같은 중복 파일을 찾습니다.",
    type: "SoftwareApplication",
    features: ["파일 중복 점검", "SHA-256", "내용 동일성", "중복 보고서 TXT"]
  },
  "/tools/file-list/": {
    title: "파일 목록 만들기 - goatool",
    description:
      "선택한 파일의 이름, 확장자, 용량을 TXT와 CSV 목록으로 만들어 제출 전후 기록으로 보관합니다.",
    type: "SoftwareApplication",
    features: ["파일 목록 TXT", "파일 목록 CSV", "확장자 확인", "총 용량 계산"]
  },
  "/tools/empty-file-finder/": {
    title: "빈 파일 찾기 - goatool",
    description: "선택한 파일 묶음에서 0KB 파일과 지나치게 작은 파일을 찾아 보고서로 정리합니다.",
    type: "SoftwareApplication",
    features: ["0KB 파일", "빈 파일 점검", "파일 크기", "보고서"]
  },
  "/tools/temp-file-finder/": {
    title: "임시 파일명 찾기 - goatool",
    description: "파일명에 임시, 복사본, final, tmp 같은 제출 전 정리 후보 단서가 있는지 확인합니다.",
    type: "SoftwareApplication",
    features: ["임시 파일명", "복사본 단서", "최종본 확인", "보고서"]
  },
  "/tools/extension-mismatch-checker/": {
    title: "확장자 불일치 점검 - goatool",
    description: "파일 앞부분의 서명과 확장자를 비교해 PDF, ZIP, JPG, PNG 형식 불일치 후보를 찾습니다.",
    type: "SoftwareApplication",
    features: ["확장자 점검", "파일 서명", "형식 불일치", "보고서"]
  },
  "/tools/file-size-sorter/": {
    title: "파일 용량 순서표 - goatool",
    description: "선택한 파일을 용량 큰 순서로 정리해 업로드 제한에 걸릴 파일을 먼저 찾습니다.",
    type: "SoftwareApplication",
    features: ["파일 용량", "용량 정렬", "큰 파일 확인", "보고서"]
  },
  "/tools/folder-tree-exporter/": {
    title: "폴더 구조 목록 - goatool",
    description: "선택한 폴더의 내부 파일 경로와 용량을 목록 파일로 저장합니다.",
    type: "SoftwareApplication",
    features: ["폴더 구조", "파일 경로", "용량 목록", "제출 기록"]
  },
  "/tools/file-repair-attempt/": {
    title: "파일 복구 시도 - goatool",
    description: "PDF, 이미지, ZIP, 오피스 ZIP 계열 파일을 브라우저에서 열 수 있는 범위에서 다시 저장합니다.",
    type: "SoftwareApplication",
    features: ["파일 복구 시도", "PDF 재저장", "이미지 재저장", "ZIP 재포장"]
  },
  "/tools/hash-compare/": {
    title: "파일 해시 비교 - goatool",
    description:
      "두 파일의 SHA-256 해시를 계산해 제출 전후 파일 동일성을 브라우저에서 비교합니다.",
    type: "SoftwareApplication",
    features: ["SHA-256", "파일 동일성 비교", "제출 전후 검증", "해시 결과 TXT"]
  },
  "/tools/data-clean/": {
    title: "CSV·엑셀 정리 - goatool",
    description:
      "CSV와 XLSX 표의 앞뒤 공백, 빈 행과 빈 열, 중복 행을 정리하고 CSV 또는 XLSX로 다시 내려받습니다.",
    type: "SoftwareApplication",
    features: ["CSV 정리", "XLSX 첫 번째 시트 읽기", "빈 행 제거", "중복 행 제거"]
  },
  "/tools/table-privacy-checker/": {
    title: "표 개인정보 점검 - goatool",
    description:
      "CSV와 XLSX 표에서 전화번호, 이메일, 주민등록번호 형태, 생년월일 단서를 찾아 제출 전 민감정보 노출을 줄입니다.",
    type: "SoftwareApplication",
    features: ["표 개인정보 점검", "CSV 개인정보", "엑셀 개인정보", "전화번호 이메일 패턴"]
  },
  "/about/": {
    title: "소개 - goatool",
    description: "goatool은 제출 전 파일 준비와 개인정보 정리를 돕는 브라우저 도구 모음입니다."
  },
  "/privacy/": {
    title: "개인정보 처리방침 - goatool",
    description: "goatool은 파일을 서버로 업로드하지 않고 브라우저 안에서 처리하는 것을 우선합니다."
  },
  "/terms/": {
    title: "이용안내 - goatool",
    description: "goatool의 브라우저 기반 파일 준비 도구 이용 기준과 주의사항을 안내합니다."
  },
  "/contact/": {
    title: "문의 - goatool",
    description: "goatool 개선 제안과 오류 제보를 위한 안내 페이지입니다."
  },
  [guideIndexMeta.path]: {
    title: guideIndexMeta.metaTitle,
    description: guideIndexMeta.description,
    type: "CollectionPage"
  }
};

const indexHtml = readFileSync(join(dist, "index.html"), "utf8");

writeFileSync(join(dist, "index.html"), htmlForRoute("/", indexHtml), "utf8");

for (const route of routes) {
  const dir = join(dist, route);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), htmlForRoute(route, indexHtml), "utf8");
}

const urls = ["/", ...routes];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((path) => `  <url><loc>${base}${path}</loc><changefreq>monthly</changefreq><lastmod>${lastUpdated}</lastmod></url>`)
  .join("\n")}\n</urlset>\n`;

writeFileSync(join(dist, "sitemap.xml"), sitemap, "utf8");
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`, "utf8");

function htmlForRoute(route, html) {
  const meta = metaForRoute(route);
  const url = `${base}${route}`;
  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapeAttr(meta.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeAttr(meta.title)}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapeAttr(meta.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(
      /<script(?:\s+id="goatool-structured-data")?\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script id="goatool-structured-data" type="application/ld+json">${JSON.stringify(schemaForRoute(route, meta, url))}</script>`
    )
    .replace(/<div id="app"><\/div>/, `<div id="app">${fallbackForRoute(route, meta)}</div>`);
}

function metaForRoute(route) {
  const guide = guideByPath.get(route);
  if (guide) {
    return {
      title: guide.metaTitle,
      description: guide.description,
      type: "Article",
      guide
    };
  }
  return routeMeta[route] || routeMeta["/"];
}

function fallbackForRoute(route, meta) {
  if (meta.guide) return guideFallback(meta.guide);
  if (route === guideIndexMeta.path) return guideIndexFallback();

  const links = [
    ["/tools/photo-resize/", "증명사진 규격 맞추기"],
    ["/tools/pdf-organizer/", "PDF 합치기·페이지 뽑기"],
    ["/tools/file-viewer/", "파일 뷰어"],
    ["/tools/pdf-page-labeler/", "PDF 페이지 번호"],
    ["/tools/pdf-rotate/", "PDF 페이지 회전"],
    ["/tools/pdf-info/", "PDF 구조 점검"],
    ["/tools/pdf-a4-normalizer/", "PDF A4 맞춤"],
    ["/tools/pdf-splitter/", "PDF 나누기"],
    ["/tools/pdf-blank-remover/", "PDF 빈 페이지 정리"],
    ["/tools/pdf-page-delete/", "PDF 페이지 삭제"],
    ["/tools/pdf-metadata-cleaner/", "PDF 메타데이터 정리"],
    ["/tools/pdf-password-checker/", "PDF 암호 여부 점검"],
    ["/tools/pdf-repair-basic/", "PDF 복구 시도"],
    ["/tools/pdf-single-page-zip/", "PDF 페이지별 분리"],
    ["/tools/pdf-odd-even-splitter/", "PDF 홀짝 분리"],
    ["/tools/file-ready/", "파일 준비 점검"],
    ["/tools/required-doc-checker/", "제출서류 누락 대조"],
    ["/tools/bundle-rule-checker/", "제출 규칙 검사"],
    ["/tools/filename-privacy-checker/", "파일명 개인정보 점검"],
    ["/tools/image-privacy/", "이미지 개인정보 정리"],
    ["/tools/image-redactor/", "이미지 민감정보 가리기"],
    ["/tools/filename-cleaner/", "파일명 일괄 정리"],
    ["/tools/filename-numberer/", "파일명 번호 붙이기"],
    ["/tools/filename-date-stamper/", "파일명 날짜 붙이기"],
    ["/tools/extension-auto-fixer/", "확장자 자동 수정"],
    ["/tools/image-to-pdf/", "이미지 PDF 변환"],
    ["/tools/zip-inspector/", "ZIP 내용 점검"],
    ["/tools/zip-repacker/", "ZIP 다시 포장"],
    ["/tools/zip-extension-checker/", "ZIP 확장자 검사"],
    ["/tools/zip-repair-basic/", "ZIP 복구 시도"],
    ["/tools/zip-folder-flattener/", "ZIP 폴더 평탄화"],
    ["/tools/office-zip-repair/", "오피스 파일 복구 시도"],
    ["/tools/image-inspector/", "이미지 규격 확인"],
    ["/tools/image-compressor/", "이미지 압축"],
    ["/tools/image-format-converter/", "이미지 형식 변환"],
    ["/tools/image-batch-resizer/", "이미지 일괄 리사이즈"],
    ["/tools/image-white-canvas/", "흰 배경 캔버스 맞춤"],
    ["/tools/image-auto-enhance/", "이미지 밝기 보정"],
    ["/tools/image-dpi-checker/", "이미지 DPI 점검"],
    ["/tools/image-aspect-checker/", "이미지 비율 검사"],
    ["/tools/image-repair-basic/", "이미지 복구 시도"],
    ["/tools/image-background-flattener/", "투명 배경 흰색 처리"],
    ["/tools/image-border-trimmer/", "이미지 여백 자동 자르기"],
    ["/tools/image-square-cropper/", "이미지 정사각형 크롭"],
    ["/tools/image-contact-sheet/", "이미지 모아보기 시트"],
    ["/tools/image-sharpness-checker/", "이미지 선명도 점검"],
    ["/tools/image-transparency-checker/", "투명 배경 점검"],
    ["/tools/scan-readability/", "스캔 가독성 점검"],
    ["/tools/image-duplicate-finder/", "이미지 중복 점검"],
    ["/tools/file-duplicate-finder/", "파일 내용 중복 점검"],
    ["/tools/file-list/", "파일 목록 만들기"],
    ["/tools/empty-file-finder/", "빈 파일 찾기"],
    ["/tools/temp-file-finder/", "임시 파일명 찾기"],
    ["/tools/extension-mismatch-checker/", "확장자 불일치 점검"],
    ["/tools/file-size-sorter/", "파일 용량 순서표"],
    ["/tools/folder-tree-exporter/", "폴더 구조 목록"],
    ["/tools/file-repair-attempt/", "파일 복구 시도"],
    ["/tools/hash-compare/", "파일 해시 비교"],
    ["/tools/data-clean/", "CSV·엑셀 정리"],
    ["/tools/table-privacy-checker/", "표 개인정보 점검"],
    ["/guides/", "전문 가이드"],
    ["https://policyfundpedia.com/", "정책자금 백과"],
    ["/about/", "소개"],
    ["/privacy/", "개인정보 처리방침"]
  ];
  const featureList = (meta.features || []).map((feature) => `<li>${escapeHtml(feature)}</li>`).join("");
  const featureBlock = featureList
    ? `<section><h2>주요 처리 기준</h2><ul>${featureList}</ul></section>`
    : "";

  return `
    <main class="static-fallback" aria-label="goatool 정적 페이지 요약">
      <p class="static-kicker">goatool</p>
      <h1>${escapeHtml(meta.title.replace(" - goatool", ""))}</h1>
      <p>${escapeHtml(meta.description)}</p>
      ${featureBlock}
      <nav aria-label="goatool 주요 페이지">
        ${links
          .map(([href, label]) => `<a href="${href}"${href === route ? ' aria-current="page"' : ""}>${label}</a>`)
          .join("")}
      </nav>
    </main>
  `;
}

function guideIndexFallback() {
  return `
    <main class="static-fallback static-guide-index" aria-label="goatool 전문 가이드 목록">
      <p class="static-kicker">goatool guide</p>
      <h1>${escapeHtml(guideIndexMeta.title)}</h1>
      <p>${escapeHtml(guideIndexMeta.description)}</p>
      <section>
        <h2>전체 가이드 ${guidePages.length}개</h2>
        <ul>
          ${guidePages.map((guide) => `<li><a href="${guide.path}">${escapeHtml(guide.title)}</a> - ${escapeHtml(guide.keyword)}</li>`).join("")}
        </ul>
      </section>
    </main>
  `;
}

function guideFallback(guide) {
  return `
    <main class="static-fallback static-guide-article" aria-label="${escapeAttr(guide.title)} 정적 본문">
      <article>
        <p class="static-kicker">${escapeHtml(guide.category)}</p>
        <h1>${escapeHtml(guide.title)}</h1>
        <p>${escapeHtml(guide.description)}</p>
        <p>최종 검수 ${guide.dateModified} · 공백 제외 ${guide.nonSpaceLength.toLocaleString("ko-KR")}자 · ${escapeHtml(guide.keyword)}</p>
        ${guide.sections
          .map(
            (section) => `
              <section>
                <h2>${escapeHtml(section.title)}</h2>
                ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                ${section.items ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
              </section>
            `
          )
          .join("")}
        <nav aria-label="관련 페이지">
          <a href="/guides/">전체 전문 가이드</a>
          <a href="/tools/photo-resize/">증명사진 규격 맞추기</a>
          <a href="/tools/pdf-organizer/">PDF 합치기·페이지 뽑기</a>
          <a href="/tools/file-viewer/">파일 뷰어</a>
          <a href="/tools/pdf-page-labeler/">PDF 페이지 번호</a>
          <a href="/tools/pdf-rotate/">PDF 페이지 회전</a>
          <a href="/tools/pdf-info/">PDF 구조 점검</a>
          <a href="/tools/pdf-a4-normalizer/">PDF A4 맞춤</a>
          <a href="/tools/pdf-splitter/">PDF 나누기</a>
          <a href="/tools/pdf-blank-remover/">PDF 빈 페이지 정리</a>
          <a href="/tools/required-doc-checker/">제출서류 누락 대조</a>
          <a href="/tools/bundle-rule-checker/">제출 규칙 검사</a>
          <a href="/tools/filename-privacy-checker/">파일명 개인정보 점검</a>
          <a href="/tools/zip-inspector/">ZIP 내용 점검</a>
          <a href="/tools/zip-repacker/">ZIP 다시 포장</a>
          <a href="/tools/file-ready/">파일 준비 점검</a>
          <a href="/tools/image-privacy/">이미지 개인정보 정리</a>
          <a href="/tools/image-redactor/">이미지 민감정보 가리기</a>
          <a href="/tools/scan-readability/">스캔 가독성 점검</a>
          <a href="/tools/image-duplicate-finder/">이미지 중복 점검</a>
          <a href="/tools/file-duplicate-finder/">파일 내용 중복 점검</a>
          <a href="/tools/data-clean/">CSV·엑셀 정리</a>
          <a href="/tools/table-privacy-checker/">표 개인정보 점검</a>
        </nav>
      </article>
    </main>
  `;
}

function schemaForRoute(route, meta, url) {
  if (meta.type === "Article" && meta.guide) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.guide.title,
      name: meta.guide.title,
      url,
      inLanguage: "ko-KR",
      description: meta.guide.description,
      image: brandImage,
      datePublished: meta.guide.dateModified,
      dateModified: meta.guide.dateModified,
      author: { "@type": "Organization", name: "goatool", url: base },
      publisher: { "@type": "Organization", name: "goatool", url: base, logo: brandIcon },
      articleSection: meta.guide.category,
      keywords: [meta.guide.keyword, ...meta.guide.related],
      wordCount: meta.guide.nonSpaceLength
    };
  }

  if (meta.type === "CollectionPage") {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: meta.title,
      url,
      inLanguage: "ko-KR",
      description: meta.description,
      image: brandImage,
      dateModified: lastUpdated,
      publisher: { "@type": "Organization", name: "goatool", url: base, logo: brandIcon },
      hasPart: guidePages.map((guide) => ({
        "@type": "Article",
        name: guide.title,
        url: `${base}${guide.path}`
      }))
    };
  }

  if (meta.type === "SoftwareApplication") {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: meta.title,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web browser",
      url,
      inLanguage: "ko-KR",
      description: meta.description,
      image: brandImage,
      dateModified: lastUpdated,
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      publisher: { "@type": "Organization", name: "goatool", url: base, logo: brandIcon },
      featureList: meta.features || []
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": route === "/" ? "WebSite" : "WebPage",
    name: meta.title,
    url,
    inLanguage: "ko-KR",
    description: meta.description,
    image: brandImage,
    dateModified: lastUpdated,
    publisher: { "@type": "Organization", name: "goatool", url: base, logo: brandIcon }
  };
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeHtml(value) {
  return escapeAttr(value).replace(/>/g, "&gt;");
}
