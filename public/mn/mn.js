const config = {
  cashmere: {
    prefix: "noos",
    fields: ["batch", "place", "weight", "grade"],
    categories: [
      ["weight", "Жингийн баримт"],
      ["grade", "Ангилал / чанарын зураг"],
      ["package", "Савлагаа / багцын зураг"],
      ["handover", "Хүлээлгэн өгсөн баримт"],
      ["other", "Бусад"],
    ],
    required: ["weight", "grade", "package", "handover"],
  },
  tractor: {
    prefix: "tractor",
    fields: ["model", "serial", "date"],
    categories: [
      ["nameplate", "Загвар / үйлдвэрийн пайз"],
      ["hours", "Ажилласан цагийн тоолуур"],
      ["service", "Засвар үйлчилгээний баримт"],
      ["attachment", "Дагалдах хэрэгсэл"],
      ["handover", "Хүлээлцсэн үеийн зураг"],
      ["other", "Бусад"],
    ],
    required: ["nameplate", "hours", "service", "handover"],
  },
};

const kind = document.body.dataset.kind;
const settings = config[kind];
if (settings) {
  const input = document.getElementById("files");
  const rows = document.getElementById("rows");
  const status = document.getElementById("status");
  const download = document.getElementById("download");
  const choices = new Map(settings.categories);
  let records = [];

  const slug = (value) =>
    String(value).normalize("NFKC").trim().toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "unknown";
  const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const safeCsvCell = (value) => csvCell(/^[=+@\-\t\r]/.test(String(value)) ? `'${value}` : value);
  const proposedName = (record, index) => {
    const lead = kind === "cashmere" ? document.getElementById("batch").value : document.getElementById("model").value;
    const date = kind === "tractor" ? document.getElementById("date").value.replaceAll("-", "") : "";
    const extension = record.file.name.match(/\.[a-z\d]{1,8}$/i)?.[0]?.toLowerCase() || "";
    return [settings.prefix, slug(lead), date, record.category, String(index + 1).padStart(2, "0")].filter(Boolean).join("_") + extension;
  };

  function updateStatus() {
    if (!records.length) {
      status.textContent = "Файл сонгоогүй байна. Баримтыг зөвхөн энэ төхөөрөмжийн браузерт уншина.";
      download.disabled = true;
      return;
    }
    const missing = settings.required.filter((category) => !records.some((record) => record.category === category));
    status.textContent = `${records.length} файл сонгосон. ${missing.length ? "Шалгах зүйл: " + missing.map((category) => choices.get(category)).join(", ") + "." : "Үндсэн төрлийн баримт бүрт файл сонгосон байна."} Энэ нь баримтын бүрэн, үнэн зөвийг батлахгүй.`;
    download.disabled = false;
  }

  function render() {
    rows.replaceChildren();
    records.forEach((record, index) => {
      const tr = document.createElement("tr");
      const name = document.createElement("td"); name.textContent = record.file.name;
      const size = document.createElement("td"); size.textContent = `${(record.file.size / 1024 / 1024).toFixed(2)} MB`;
      const categoryCell = document.createElement("td");
      const select = document.createElement("select");
      select.setAttribute("aria-label", `${record.file.name} баримтын төрөл`);
      settings.categories.forEach(([value, label]) => {
        const option = document.createElement("option"); option.value = value; option.textContent = label;
        select.append(option);
      });
      select.value = record.category;
      select.addEventListener("change", () => { record.category = select.value; render(); });
      categoryCell.append(select);
      const proposed = document.createElement("td"); proposed.textContent = proposedName(record, index);
      tr.append(name, size, categoryCell, proposed);
      rows.append(tr);
    });
    updateStatus();
  }

  input.addEventListener("change", () => {
    records = Array.from(input.files || []).map((file) => ({ file, category: "other" }));
    render();
  });
  settings.fields.forEach((id) => document.getElementById(id).addEventListener("input", render));

  download.addEventListener("click", () => {
    if (!records.length) return;
    const details = settings.fields.map((id) => [id, document.getElementById(id).value]);
    const csv = [
      ["field", "value"].map(safeCsvCell).join(","),
      ...details.map((pair) => pair.map(safeCsvCell).join(",")),
      "",
      ["original_filename", "proposed_filename", "category", "size_bytes", "last_modified"].map(safeCsvCell).join(","),
      ...records.map((record, index) => [record.file.name, proposedName(record, index), choices.get(record.category), record.file.size, new Date(record.file.lastModified).toISOString()].map(safeCsvCell).join(",")),
    ].join("\r\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${settings.prefix}_file_manifest.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
