# goatool

goatool is a Korean browser utility site for public-service submissions, job applications, and school or institution file preparation.

It includes:

- Photo resizing for job-application and public-application image presets.
- Broad file viewing for PDF, images, SVG, video, audio, fonts, Markdown, JSON/JSONL, XML, YAML/TOML/INI/ENV config files, SRT/VTT subtitles, LOG files, source code, RTF, ICS calendar, VCF contacts, EML email, EPUB metadata and chapters, CSS color palettes, UTF-8/UTF-16/CP949 text, auto-delimited CSV/TSV, ODS, XLSX/XLSM, ZIP-based bundles, DOCX/DOCM, PPTX/PPTM, HWPX, ODT, ODP, signature mismatch warnings, and raw-byte fallback checks.
- PDF merge and page extraction for submission-ready documents.
- File readiness checks with filename, size, extension, duplicate detection, SHA-256 hashes, TXT checklist, and ZIP packaging.
- Image privacy and file-size cleanup through browser canvas re-save, resize, format selection, and ZIP export.
- Batch filename cleanup with ZIP export and rename map.
- Image-to-PDF conversion for scanned documents and evidence images.
- ZIP content inspection for internal file lists and folder-depth warnings.
- Text length and UTF-8 byte counting for application forms.
- Text whitespace cleanup for form paste workflows.
- Image dimension inspection for pixel, ratio, and size checks.
- Fast TXT/CSV file-list generation.
- SHA-256 file comparison for before/after verification.
- CSV and XLSX cleanup for trimming, blank row/column removal, duplicate row removal, and CSV/XLSX export.
- Long-form Korean guide pages for submission workflows, privacy checks, and spreadsheet cleanup.
- Reader retention features such as popular-task lanes, recent tools, guide search, category filters, bookmarks, recent guides, reading progress, and PWA support.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production output is generated in `dist/`.

## Cloudflare Pages

Recommended Cloudflare Pages settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Node.js: use the Cloudflare default current Node runtime unless a project setting requires pinning.

## Privacy Model

goatool prioritizes browser-side processing. Selected files are read in the user's browser and result files are generated locally by the browser.
