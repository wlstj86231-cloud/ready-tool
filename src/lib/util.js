export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const pad = (value) => String(value).padStart(2, "0");

export function ymd(date, separator = "-") {
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join(separator);
}

export function hm(date, separator = ":") {
  return `${pad(date.getHours())}${separator}${pad(date.getMinutes())}`;
}

export function dateTimeLabel(date) {
  return `${ymd(date)} ${hm(date)}`;
}

export function koreanDate(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// Keeps Hangul, letters, digits, dash and underscore so names work on Windows, Mac and phones.
export function cleanNamePart(value, fallback = "") {
  const cleaned = String(value ?? "")
    .normalize("NFC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 40);
  return cleaned || fallback;
}

export function extensionOf(name) {
  const match = /\.([0-9a-z]{1,6})$/i.exec(name || "");
  return match ? match[1].toLowerCase() : "";
}

export function baseNameOf(name) {
  return String(name || "").replace(/\.[^.]+$/, "");
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// UTF-8 with BOM so Korean opens correctly when the CSV is double-clicked in Excel.
export function toCsv(rows) {
  return `﻿${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function setStatus(element, message, tone = "") {
  element.textContent = message;
  element.dataset.tone = tone;
  element.hidden = !message;
}

export function loadPdfLib() {
  return import("pdf-lib");
}
