const filesInput = document.querySelector('#evidence-files');
const result = document.querySelector('#evidence-result');
const checklist = document.querySelector('#evidence-check');
const download = document.querySelector('#download-evidence');
const tradeKind = document.querySelector('#trade-kind');

const reviewItems = {
  machinery: [
    '기계 전체와 명판(모델·제조번호)이 같은 실물인지 대조',
    '작업시간 계기판·냉간 시동·유압·PTO·누유 상태 기록',
    '판매자와 소유 관계, 계약서·정비 영수증 확인',
    '작업기 포함 여부와 상차·운송·하차 비용·인도 시점 기록'
  ],
  produce: [
    '품목·품종·등급·실중량·상자 수량과 판매 조건 대조',
    '수확·선별·포장·출하일 및 실제 발송 주체 확인',
    '판매자·예금주 관계와 계약·정산 내역 확인',
    '발송·수령·하자 사진을 시간 순서로 보관'
  ]
};

let preparedFiles = [];
let run = 0;

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function size(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function currentChecks() {
  return [...checklist.querySelectorAll('input[type="checkbox"]')].map((input) => ({
    label: input.closest('label').querySelector('span').textContent,
    checked: input.checked
  }));
}

function renderChecks() {
  checklist.replaceChildren();
  const title = document.createElement('h3');
  title.textContent = '사람이 직접 확인할 항목';
  const description = document.createElement('p');
  description.textContent = '파일 이름이나 해시는 항목 완료를 자동 확인하지 않습니다. 실제 사진·서류와 원본을 보고 표시하세요.';
  checklist.append(title, description);
  reviewItems[tradeKind.value].forEach((value) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const text = document.createElement('span');
    text.textContent = value;
    label.append(checkbox, text);
    checklist.append(label);
  });
}

async function digest(file) {
  if (!globalThis.crypto?.subtle) return '브라우저 SHA-256 미지원';
  if (file.size > 50 * 1024 * 1024) return '50 MB 초과로 해시 생략';
  try {
    const bytes = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join('');
  } catch {
    return '해시 계산 실패';
  }
}

async function prepareFiles() {
  const currentRun = ++run;
  const files = [...filesInput.files];
  preparedFiles = [];
  download.disabled = true;
  result.replaceChildren();
  if (!files.length) {
    result.textContent = '아직 선택한 파일이 없습니다.';
    return;
  }
  if (files.length > 30) {
    result.textContent = '한 번에 최대 30개 파일을 선택하세요. 원본 파일은 변경되지 않았습니다.';
    return;
  }
  result.textContent = `${files.length}개 파일의 SHA-256을 이 브라우저에서 계산하는 중입니다…`;
  const entries = [];
  for (const file of files) {
    entries.push({ name: file.name, size: file.size, hash: await digest(file) });
    if (currentRun !== run) return;
  }
  preparedFiles = entries;
  result.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = `${entries.length}개 파일 · ${size(entries.reduce((sum, file) => sum + file.size, 0))}`;
  const list = document.createElement('ol');
  entries.forEach((file, index) => {
    const row = document.createElement('li');
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('b');
    name.textContent = file.name;
    const detail = document.createElement('small');
    detail.textContent = `${size(file.size)} · ${file.hash.length === 64 ? `SHA-256 ${file.hash.slice(0, 12)}…` : file.hash}`;
    row.append(number, name, detail);
    list.append(row);
  });
  result.append(heading, list);
  download.disabled = false;
}

filesInput.addEventListener('change', prepareFiles);
tradeKind.addEventListener('change', renderChecks);
download.addEventListener('click', () => {
  if (!preparedFiles.length) return;
  const lines = [
    '농업 거래 증빙 파일 확인표',
    `작성일: ${today()}`,
    `거래 유형: ${tradeKind.selectedOptions[0].textContent.trim()}`,
    '파일 내용은 서버로 전송하지 않았습니다. 이 목록은 원본의 진위·촬영일·거래 안전을 증명하지 않습니다.',
    '', '[파일 원본 목록과 SHA-256]',
    ...preparedFiles.map((file, index) => `${String(index + 1).padStart(2, '0')}. ${file.name.replace(/[\r\n\t|]+/g, ' ')} | ${file.size} bytes | ${file.hash}`),
    '', '[사람이 직접 확인한 항목]',
    ...currentChecks().map((item) => `${item.checked ? '[확인]' : '[미확인]'} ${item.label}`),
    '', '원본을 별도 보관하고 공유본의 전화번호·계좌·주소·제조번호 노출을 다시 확인하세요.'
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `농업거래_증빙확인_${today()}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const machineDate = document.querySelector('#machine-date');
machineDate.value = today();
const nameFields = ['machine-type', 'machine-model', 'machine-date', 'machine-shot'];
function updateName() {
  const values = nameFields.map((id) => document.getElementById(id).value.trim().replace(/[^0-9A-Za-z가-힣_-]+/g, '_'));
  document.querySelector('#filename-output').textContent = `${values[2] || '날짜미입력'}_${values[0] || '농기계'}_${values[1] || '모델미입력'}_${values[3] || '사진'}_01.jpg`;
}
nameFields.forEach((id) => document.getElementById(id).addEventListener('input', updateName));
document.querySelector('#copy-filename').addEventListener('click', async (event) => {
  try {
    await navigator.clipboard.writeText(document.querySelector('#filename-output').textContent);
    event.currentTarget.textContent = '복사됨';
  } catch {
    event.currentTarget.textContent = '복사 실패 · 파일명을 직접 선택하세요';
  }
});

document.querySelectorAll('a[href*="boribay.com"]').forEach((link) => {
  link.addEventListener('click', () => window.gtag && window.gtag('event', 'owned_referral_click', {
    source_domain: 'goatool.com', destination: link.href
  }));
});

renderChecks();
updateName();
if (window.lucide) window.lucide.createIcons();
