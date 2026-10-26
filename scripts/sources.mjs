// Official and primary sources cited on goatool.com, shared by the guide and tool pages.
// Each entry: [title, institution, url]. `checked` is the date the source was last opened
// and compared with the sentence that cites it; change it only after re-checking.

export const SOURCES_CHECKED = "2026-10-26";

export const sources = {
  standard: ["「농산물 표준규격」 (국립농산물품질관리원 고시 제2025-6호, 2025-08-04 시행)", "국가법령정보센터", "https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=2100000262624"],
  qualityRule7: ["「농수산물 품질관리법 시행규칙」 제7조(표준규격품의 출하 및 표시방법 등)", "국가법령정보센터", "https://www.law.go.kr/법령/농수산물품질관리법시행규칙/제7조"],
  origin: ["「농수산물의 원산지 표시 등에 관한 법률」 제5조(원산지 표시)", "국가법령정보센터", "https://www.law.go.kr/법령/농수산물의원산지표시등에관한법률/제5조"],
  originDecree: ["「농수산물의 원산지 표시 등에 관한 법률 시행령」 제3조(원산지의 표시대상)와 별표 1(원산지의 표시기준)", "국가법령정보센터", "https://www.law.go.kr/법령/농수산물의원산지표시등에관한법률시행령"],
  originRule3: ["「농수산물의 원산지 표시 등에 관한 법률 시행규칙」 제3조(원산지의 표시방법)와 별표 3(통신판매의 경우 원산지 표시방법)", "국가법령정보센터", "https://www.law.go.kr/법령/농수산물의원산지표시등에관한법률시행규칙/제3조"],
  commerce146: ["「상법」 제146조(운송인의 책임소멸)", "국가법령정보센터", "https://www.law.go.kr/법령/상법/제146조"],
  parcelTerms: ["「택배업 표준약관 개정」 보도자료 (공정거래위원회, 2020-06-18)", "대한민국 정책브리핑", "https://www.korea.kr/news/policyNewsView.do?newsId=156396329"],
  grain20_2: ["「양곡관리법」 제20조의2(생산연도·품질 등의 표시)", "국가법령정보센터", "https://www.law.go.kr/법령/양곡관리법/제20조의2"],
  grainRule7_3: ["「양곡관리법 시행규칙」 제7조의3(양곡의 표시사항 등)과 별표 4(양곡의 표시사항 및 표시방법)", "국가법령정보센터", "https://www.law.go.kr/법령/양곡관리법시행규칙/제7조의3"],
  waste8: ["「폐기물관리법」 제8조(폐기물의 투기 금지 등)", "국가법령정보센터", "https://www.law.go.kr/법령/폐기물관리법/제8조"],
  privacy2: ["「개인정보 보호법」 제2조(정의)", "국가법령정보센터", "https://www.law.go.kr/법령/개인정보보호법/제2조"],
  ecrm: ["사이버범죄 신고시스템(ECRM)", "경찰청", "https://ecrm.police.go.kr/minwon/main"],
  exif: ["CIPA DC-008 「Exif(Exchangeable image file format) 표준」", "카메라영상기기공업회(CIPA)·전자정보기술산업협회(JEITA)", "https://www.cipa.jp/e/std/std-sec.html"],
  sha256: ["FIPS 180-4 「Secure Hash Standard」 (SHA-256 정의)", "미국 국립표준기술연구소(NIST)", "https://csrc.nist.gov/pubs/fips/180-4/upd1/final"],
  webcrypto: ["「Web Cryptography Level 2」 (브라우저의 digest 기능)", "W3C", "https://www.w3.org/TR/webcrypto-2/"],
  canvas: ["HTML 표준 — canvas 요소와 toBlob()", "WHATWG", "https://html.spec.whatwg.org/multipage/canvas.html"],
  pdfLib: ["pdf-lib 공식 문서 (이 도구가 쓰는 PDF 라이브러리)", "pdf-lib 프로젝트", "https://pdf-lib.js.org/"],
  excelCsv: ["「텍스트(.txt 또는 .csv) 파일 가져오기 또는 내보내기」", "Microsoft 지원", "https://support.microsoft.com/ko-kr/excel/get-started/import-or-export-text-txt-or-csv-files"],
};

export function sourceEntries(keys) {
  return keys.map((key) => {
    if (!sources[key]) throw new Error(`unknown source: ${key}`);
    const [title, org, url] = sources[key];
    return { key, title, org, url };
  });
}
