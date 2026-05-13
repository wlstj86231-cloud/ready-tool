# goatool

goatool is a Korean public-interest browser utility site for preparing files before submission.

It includes:

- File readiness checks with filename, size, extension, duplicate detection, SHA-256 hashes, TXT checklist, and ZIP packaging.
- Image privacy cleanup through browser canvas re-save, resize, format selection, and ZIP export.
- CSV and XLSX cleanup for trimming, blank row/column removal, duplicate row removal, and CSV/XLSX export.
- Long-form Korean guide pages for submission workflows, privacy checks, and spreadsheet cleanup.
- Reader retention features such as guide search, category filters, bookmarks, recent guides, reading progress, and PWA support.

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
