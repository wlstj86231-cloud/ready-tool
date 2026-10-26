import { resolve } from "node:path";
import { defineConfig } from "vite";
import { commonHead, siteFooter, siteHeader } from "./scripts/site-shell.mjs";

const root = import.meta.dirname;

export const toolPages = ["evidence-pack", "photo-rename", "pdf-organizer", "image-redactor", "settlement-csv", "hash-compare"];

// Fills the shared head, header and footer placeholders in each HTML entry.
function siteShell() {
  return {
    name: "goatool-site-shell",
    transformIndexHtml(html) {
      return html
        .replace(/<!--site:common(?::(noads))?-->/, (_m, noads) => commonHead({ ads: !noads }))
        .replace(/<!--site:header(?::([a-z]+))?-->/, (_m, active) => siteHeader(active || ""))
        .replace("<!--site:footer-->", siteFooter());
    },
  };
}

export default defineConfig({
  plugins: [siteShell()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, "index.html"),
        ...Object.fromEntries(toolPages.map((name) => [name, resolve(root, "tools", name, "index.html")])),
      },
    },
  },
});
