import { decodeText, parseDelimited, readXlsxFirstSheet } from "../lib/table.js";
import { $, downloadBlob, escapeHtml, extensionOf, setStatus, toCsv, ymd } from "../lib/util.js";

const MAX_ROWS = 5000;
const PREVIEW_ROWS = 200;

const HEADERS = ["날짜", "구매자(별칭)", "품목", "규격", "수량", "단가", "판매금액", "배송비", "수수료·공제", "받을 금액", "입금일", "입금액", "운송장번호", "메모"];
const EXAMPLE_ROWS = [
  ["2026-10-18", "단골A", "사과(홍로)", "10kg 상자", "3", "45000", "135000", "4000", "0", "139000", "2026-10-18", "139000", "", "예시 줄입니다. 숫자는 설명용이며 실제 시세가 아닙니다."],
  ["2026-10-19", "주문0219", "사과(홍로)", "5kg 상자", "2", "25000", "50000", "4000", "0", "54000", "", "", "", "예시: 아직 입금 전"],
  ["2026-10-20", "이웃C", "배(신고)", "7.5kg 상자", "1", "38000", "38000", "0", "2000", "36000", "2026-10-21", "36000", "", "예시: 직접 전달, 카드 수수료 2000원"],
];

// Field detection: checked in this order so that "입금일" is not taken for "입금액",
// and "받을 금액" is not taken for "판매금액".
const FIELDS = [
  { key: "waybill", label: "운송장번호", words: ["운송장", "송장"] },
  { key: "paidDate", label: "입금일", words: ["입금일", "입금날짜", "결제일", "입금일자"] },
  { key: "expected", label: "받을 금액", words: ["받을금액", "받을돈", "청구액", "청구금액", "정산액", "정산금액", "입금예정"] },
  { key: "paid", label: "입금액", words: ["입금액", "받은금액", "받은돈", "입금금액", "결제금액", "입금"] },
  { key: "shipping", label: "배송비", words: ["배송비", "택배비", "운송비", "배달비"] },
  { key: "fee", label: "수수료·공제", words: ["수수료", "공제", "차감", "환불", "할인"] },
  { key: "price", label: "단가", words: ["단가", "개당", "상자당", "판매단가", "가격"] },
  { key: "amount", label: "판매금액", words: ["판매금액", "판매액", "매출", "금액", "합계금액", "소계"] },
  { key: "qty", label: "수량", words: ["수량", "개수", "상자수", "박스수", "박스", "수"] },
  { key: "date", label: "날짜", words: ["날짜", "주문일", "출고일", "판매일", "발송일", "일자", "거래일"] },
  { key: "buyer", label: "구매자", words: ["구매자", "고객", "주문자", "거래처", "받는사람", "주문번호"] },
  { key: "item", label: "품목", words: ["품목", "상품명", "상품", "품명", "품종"] },
];
const NUMERIC = ["qty", "price", "amount", "shipping", "fee", "expected", "paid"];
const PII_HEADER = /(전화|연락처|휴대폰|핸드폰|주소|계좌|이메일|메일|주민)/;
const PII_PATTERNS = [
  { label: "전화번호", re: /(^|[^\d])01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}([^\d]|$)/ },
  { label: "주민등록번호", re: /(^|[^\d])\d{6}[-\s]?[1-4]\d{6}([^\d]|$)/ },
  { label: "이메일", re: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  // Hyphenated digit groups with 10+ digits that are not a mobile number (dates have only 8).
  { label: "계좌번호", test: (value) => (value.match(/\d{2,6}-\d{2,6}-\d{2,8}(-\d{1,4})?/g) || []).some((part) => part.replace(/-/g, "").length >= 10 && !/^01[016789]/.test(part)) },
];

const state = { header: [], rows: [], map: {}, sourceName: "", analysis: null };
const statusLine = $("#status");

$("#blankTemplate").addEventListener("click", () => downloadBlob(new Blob([toCsv([HEADERS])], { type: "text/csv;charset=utf-8" }), "정산표_서식.csv"));
$("#exampleTemplate").addEventListener("click", () => downloadBlob(new Blob([toCsv([HEADERS, ...EXAMPLE_ROWS])], { type: "text/csv;charset=utf-8" }), "정산표_서식_예시.csv"));
$("#pick").addEventListener("click", () => $("#fileInput").click());
$("#fileInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (file) await loadFile(file);
});
$("#usePaste").addEventListener("click", () => {
  const text = $("#paste").value;
  if (!text.trim()) {
    setStatus(statusLine, "붙여넣은 내용이 없습니다.", "warn");
    return;
  }
  loadRows(parseDelimited(text, text.includes("\t") ? "\t" : undefined), "붙여넣은 표");
});
$("#mapping").addEventListener("change", (event) => {
  const select = event.target.closest("[data-field]");
  if (!select) return;
  const key = select.dataset.field;
  const value = select.value === "" ? -1 : Number(select.value);
  Object.keys(state.map).forEach((other) => {
    if (other !== key && state.map[other] === value && value >= 0) state.map[other] = -1;
  });
  state.map[key] = value;
  analyseAndRender();
});
$("#resultCsv").addEventListener("click", () => downloadBlob(new Blob([resultCsv()], { type: "text/csv;charset=utf-8" }), `${ymd(new Date())}_정산표_점검결과.csv`));
$("#shareCsv").addEventListener("click", () => downloadBlob(new Blob([shareCsv()], { type: "text/csv;charset=utf-8" }), `${ymd(new Date())}_정산표_공유용.csv`));

async function loadFile(file) {
  setStatus(statusLine, `${file.name} 읽는 중…`, "busy");
  try {
    const buffer = await file.arrayBuffer();
    const ext = extensionOf(file.name);
    if (ext === "xls") throw new Error("오래된 엑셀 형식(.xls)은 읽지 못합니다. 엑셀에서 '다른 이름으로 저장 → CSV UTF-8' 또는 .xlsx로 저장해 넣어 주세요.");
    const rows = ext === "xlsx" ? await readXlsxFirstSheet(buffer) : parseDelimited(decodeText(buffer));
    loadRows(rows, file.name);
  } catch (error) {
    console.error(error);
    setStatus(statusLine, error.message || "파일을 읽지 못했습니다.", "bad");
  }
}

function loadRows(allRows, sourceName) {
  const rows = allRows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));
  if (rows.length < 2) {
    setStatus(statusLine, "제목 줄과 내용 줄이 있는 표인지 확인해 주세요. 읽은 줄이 너무 적습니다.", "warn");
    return;
  }
  const headerIndex = findHeaderRow(rows);
  state.header = rows[headerIndex].map((cell, index) => String(cell || `열${index + 1}`).trim());
  state.rows = rows.slice(headerIndex + 1, headerIndex + 1 + MAX_ROWS).map((row) => state.header.map((_, index) => String(row[index] ?? "").trim()));
  state.sourceName = sourceName;
  state.map = detectColumns(state.header);
  const cut = rows.length - headerIndex - 1 - state.rows.length;
  setStatus(statusLine, `${sourceName}에서 ${state.rows.length}줄을 읽었습니다.${cut > 0 ? ` (${MAX_ROWS}줄까지만 점검하고 ${cut}줄은 뺐습니다)` : ""}`, cut > 0 ? "warn" : "ok");
  analyseAndRender();
}

// The header is the first of the top rows that names at least two known columns.
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const found = Object.values(detectColumns(rows[i].map((cell) => String(cell ?? "")))).filter((index) => index >= 0).length;
    if (found >= 2) return i;
  }
  return 0;
}

function norm(text) {
  return String(text || "").replace(/[\s()·_\-\/.,:]/g, "").toLowerCase();
}

function detectColumns(header) {
  const map = {};
  const taken = new Set();
  const names = header.map(norm);
  for (const field of FIELDS) {
    map[field.key] = -1;
    for (const word of field.words) {
      const index = names.findIndex((name, i) => !taken.has(i) && (word.length <= 1 ? name === word : name.includes(word)));
      if (index >= 0) {
        map[field.key] = index;
        taken.add(index);
        break;
      }
    }
  }
  return map;
}

function toNumber(raw) {
  const text = String(raw ?? "").trim();
  if (!text || text === "-") return null;
  let cleaned = text.replace(/[원₩\s,]/g, "").replace(/[−–]/g, "-");
  let negative = false;
  if (/^\(.*\)$/.test(cleaned)) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  const value = Number(cleaned);
  return negative ? -value : value;
}

function won(value) {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString("ko-KR")}원` : "-";
}

function cell(row, key) {
  const index = state.map[key];
  return index >= 0 ? row[index] : "";
}

function analyse() {
  const has = (key) => state.map[key] >= 0;
  const results = [];
  const seen = new Map();
  const totals = { qty: 0, amount: 0, shipping: 0, fee: 0, target: 0, paid: 0 };
  let skippedTotals = 0;
  state.rows.forEach((row, index) => {
    const line = index + 2;
    // A total line ("합계" in the first cells, no real date) or a line with no trade data is not a trade.
    const isTotal = /(합계|총계|소계|total)/i.test(row.slice(0, 3).join(" ")) && !/\d/.test(cell(row, "date"));
    const hasTradeData = ["date", "buyer", "item", "qty", "price", "amount", "paid"].some((key) => String(cell(row, key) || "").trim());
    if (isTotal || !hasTradeData) {
      if (isTotal) skippedTotals += 1;
      results.push({ row, line, issues: [], skipped: true, reason: isTotal ? "합계 줄로 보고 계산에서 뺌" : "거래 내용이 없는 줄이라 계산에서 뺌" });
      return;
    }
    const issues = [];
    const n = {};
    for (const key of NUMERIC) {
      if (!has(key)) continue;
      n[key] = toNumber(cell(row, key));
      if (Number.isNaN(n[key])) issues.push({ level: "warn", text: `${FIELDS.find((field) => field.key === key).label} 칸의 "${cell(row, key)}"를 숫자로 읽지 못했습니다.` });
    }
    const num = (key) => (Number.isFinite(n[key]) ? n[key] : null);
    let amount = num("amount");
    if (num("qty") !== null && num("price") !== null) {
      const computed = num("qty") * num("price");
      if (amount === null) amount = computed;
      else if (Math.abs(computed - amount) > 1) issues.push({ level: "bad", text: `수량×단가는 ${won(computed)}인데 판매금액은 ${won(amount)}입니다.` });
    }
    let target = amount !== null ? amount + (num("shipping") || 0) - (num("fee") || 0) : null;
    if (num("expected") !== null) {
      if (target !== null && Math.abs(target - num("expected")) > 1) issues.push({ level: "bad", text: `판매금액+배송비−수수료는 ${won(target)}인데 받을 금액 칸은 ${won(num("expected"))}입니다.` });
      target = num("expected");
    }
    if (has("paid") && target !== null) {
      const paid = num("paid");
      if (paid === null || paid === 0) issues.push({ level: "warn", text: `입금이 확인되지 않았습니다 (받을 금액 ${won(target)}).` });
      else if (paid < target - 1) issues.push({ level: "bad", text: `${won(target - paid)} 덜 들어왔습니다 (받을 ${won(target)}, 입금 ${won(paid)}).` });
      else if (paid > target + 1) issues.push({ level: "warn", text: `${won(paid - target)} 더 들어왔습니다 (받을 ${won(target)}, 입금 ${won(paid)}). 다른 주문 입금이 합쳐졌는지 확인하세요.` });
      if (paid && has("paidDate") && !cell(row, "paidDate")) issues.push({ level: "warn", text: "입금액은 있는데 입금일이 비어 있습니다." });
    }
    if (has("date") && !cell(row, "date")) issues.push({ level: "warn", text: "날짜가 비어 있습니다." });
    if (amount === null && !has("qty") && !has("amount")) issues.push({ level: "warn", text: "판매금액을 계산할 열(수량·단가 또는 판매금액)이 없습니다." });
    const key = [cell(row, "date"), cell(row, "buyer"), cell(row, "item"), cell(row, "amount") || cell(row, "qty")].join("|");
    if (key.replace(/\|/g, "")) {
      if (seen.has(key)) issues.push({ level: "warn", text: `${seen.get(key)}행과 날짜·구매자·품목·금액이 같습니다. 같은 주문이 두 번 적혔는지 확인하세요.` });
      else seen.set(key, line);
    }
    totals.qty += num("qty") || 0;
    totals.amount += amount || 0;
    totals.shipping += num("shipping") || 0;
    totals.fee += num("fee") || 0;
    totals.target += target || 0;
    totals.paid += num("paid") || 0;
    results.push({ row, line, issues, amount, target, paid: num("paid") });
  });

  const piiColumns = [];
  state.header.forEach((name, column) => {
    const kinds = new Set();
    if (PII_HEADER.test(name)) kinds.add("열 이름");
    for (const row of state.rows) {
      const value = row[column];
      if (!value) continue;
      if (NUMERIC.some((key) => state.map[key] === column) || state.map.waybill === column) continue;
      for (const pattern of PII_PATTERNS) if (pattern.test ? pattern.test(value) : pattern.re.test(value)) kinds.add(pattern.label);
    }
    if (kinds.size) piiColumns.push({ column, name, kinds: [...kinds] });
  });
  return { results, totals, piiColumns, skippedTotals, has };
}

function analyseAndRender() {
  state.analysis = analyse();
  renderMapping();
  renderReport();
  $("#resultCsv").disabled = !state.rows.length;
  $("#shareCsv").disabled = !state.rows.length;
}

function renderMapping() {
  const options = (selected) => [`<option value="">없음</option>`, ...state.header.map((name, index) => `<option value="${index}"${index === selected ? " selected" : ""}>${escapeHtml(name)}</option>`)].join("");
  const important = ["date", "buyer", "item", "qty", "price", "amount", "shipping", "fee", "expected", "paid", "paidDate"];
  $("#mapping").innerHTML = `<details class="faq"${important.slice(3, 6).every((key) => state.map[key] < 0) ? " open" : ""}>
    <summary>열을 이렇게 읽었습니다 (틀리면 고쳐 주세요)</summary>
    <div class="explain-grid">${important
      .map((key) => {
        const field = FIELDS.find((entry) => entry.key === key);
        return `<label class="field" style="margin:4px 0"><span>${escapeHtml(field.label)}</span><select data-field="${key}">${options(state.map[key])}</select></label>`;
      })
      .join("")}</div>
  </details>`;
}

function renderReport() {
  const { results, totals, piiColumns, skippedTotals, has } = state.analysis;
  const checked = results.filter((result) => !result.skipped);
  const bad = checked.filter((result) => result.issues.some((issue) => issue.level === "bad"));
  const warn = checked.filter((result) => result.issues.length && !result.issues.some((issue) => issue.level === "bad"));
  const unpaid = checked.filter((result) => result.issues.some((issue) => issue.text.startsWith("입금이 확인되지")));
  const diff = totals.target - totals.paid;
  const summaryLines = [];
  if (!bad.length && !warn.length) summaryLines.push(`<div class="notice ok"><p><strong>점검한 ${checked.length}줄에서 계산이 틀린 곳이나 빈 칸을 찾지 못했습니다.</strong> 그래도 입금 내역과 한 번 더 맞춰 보세요.</p></div>`);
  if (bad.length) summaryLines.push(`<div class="notice bad"><p><strong>계산이 맞지 않거나 덜 들어온 줄 ${bad.length}개</strong>가 있습니다. 아래 표에서 빨간 줄을 먼저 확인하세요.</p></div>`);
  if (warn.length) summaryLines.push(`<div class="notice warn"><p><strong>확인이 필요한 줄 ${warn.length}개</strong> (빈 칸, 입금 전, 중복 의심 등)가 있습니다.</p></div>`);
  if (!has("paid")) summaryLines.push(`<div class="notice"><p>입금액 열을 찾지 못해 입금 대조는 하지 않았습니다. 입금액 열이 있다면 위 "열을 이렇게 읽었습니다"에서 골라 주세요.</p></div>`);
  if (piiColumns.length) summaryLines.push(`<div class="notice warn"><p><strong>개인정보로 보이는 값이 든 열:</strong> ${piiColumns.map((entry) => `${escapeHtml(entry.name)}(${entry.kinds.join("·")})`).join(", ")}. 남에게 보낼 때는 <strong>공유용 CSV</strong>를 쓰세요. 이 열들이 빠집니다.</p></div>`);
  if (skippedTotals) summaryLines.push(`<p class="muted">'합계'로 보이는 줄 ${skippedTotals}개는 계산에서 뺐습니다.</p>`);

  const issueRows = checked.filter((result) => result.issues.length);
  $("#report").innerHTML = `
    <div class="stat-row">
      <div><span>점검한 줄</span><strong>${checked.length}</strong></div>
      <div><span>받을 금액 합계</span><strong>${won(totals.target)}</strong></div>
      <div><span>입금액 합계</span><strong>${has("paid") ? won(totals.paid) : "-"}</strong></div>
      <div><span>차액 (받을 − 입금)</span><strong class="${has("paid") && Math.abs(diff) > 1 ? "bad" : "good"}">${has("paid") ? won(diff) : "-"}</strong></div>
    </div>
    <p class="muted">판매금액 합계 ${won(totals.amount)} · 배송비 ${won(totals.shipping)} · 수수료·공제 ${won(totals.fee)}${has("qty") ? ` · 수량 합계 ${totals.qty.toLocaleString("ko-KR")}` : ""}${unpaid.length ? ` · 입금 확인 안 된 줄 ${unpaid.length}개` : ""}</p>
    ${summaryLines.join("")}
    ${
      issueRows.length
        ? `<h3>확인할 줄 ${issueRows.length}개</h3><div class="table-scroll"><table>
      <thead><tr><th scope="col">행</th><th scope="col">날짜 · 구매자 · 품목</th><th scope="col">확인할 점</th></tr></thead>
      <tbody>${issueRows
        .slice(0, PREVIEW_ROWS)
        .map((result) => `<tr class="${result.issues.some((issue) => issue.level === "bad") ? "row-bad" : "row-warn"}"><td class="num">${result.line}</td><td>${escapeHtml([cell(result.row, "date"), cell(result.row, "buyer"), cell(result.row, "item")].filter(Boolean).join(" · ") || "-")}</td><td>${result.issues.map((issue) => escapeHtml(issue.text)).join("<br>")}</td></tr>`)
        .join("")}</tbody>
    </table></div>${issueRows.length > PREVIEW_ROWS ? `<p class="muted">화면에는 ${PREVIEW_ROWS}줄까지만 보입니다. 전체는 점검 결과 CSV에 있습니다.</p>` : ""}`
        : ""
    }
    <p class="muted">행 번호는 엑셀에서 보이는 줄 번호 기준(제목 줄이 1행)입니다.</p>`;
}

function resultCsv() {
  const { results } = state.analysis;
  return toCsv([
    [...state.header, "계산한 판매금액", "계산한 받을 금액", "차액(입금−받을)", "확인할 점"],
    ...results.map((result) => [
      ...result.row,
      result.skipped ? "" : result.amount ?? "",
      result.skipped ? "" : result.target ?? "",
      result.skipped || result.target === null || result.target === undefined || result.paid === null || result.paid === undefined ? "" : result.paid - result.target,
      result.skipped ? result.reason : result.issues.map((issue) => issue.text).join(" / ") || "이상 없음",
    ]),
  ]);
}

function shareCsv() {
  const drop = new Set(state.analysis.piiColumns.map((entry) => entry.column));
  const keep = state.header.map((_, index) => index).filter((index) => !drop.has(index));
  return toCsv([keep.map((index) => state.header[index]), ...state.rows.map((row) => keep.map((index) => row[index]))]);
}
