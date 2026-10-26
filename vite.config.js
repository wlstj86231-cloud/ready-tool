import { resolve } from "node:path";
import { defineConfig } from "vite";
import { SITE, commonHead, graph, jsonLd, orgRef, siteFooter, siteHeader, toolAbout, toolGraph, WEBSITE_ID } from "./scripts/site-shell.mjs";
import { toolInfo } from "./scripts/tool-info.mjs";

const root = import.meta.dirname;

export const toolPages = ["evidence-pack", "photo-rename", "pdf-organizer", "image-redactor", "settlement-csv", "hash-compare"];

const homeGraph = () =>
  graph({
    "@type": "WebPage",
    "@id": `${SITE.base}/#webpage`,
    name: "거래 증빙 도우미 - 농기계·농산물 거래 사진과 서류 정리",
    url: `${SITE.base}/`,
    inLanguage: "ko-KR",
    description: "중고 농기계 사고팔기, 농산물 출하, 정산에 남길 사진과 서류를 안내하고 브라우저 안에서 이름을 붙여 묶어 주는 도구 모음입니다.",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: orgRef,
    dateModified: SITE.checked,
  });

function info(name) {
  const entry = toolInfo[name];
  if (!entry) throw new Error(`no tool-info entry for ${name}`);
  return entry;
}

// Fills the shared head, header, footer, structured data and tool "about" placeholders.
function siteShell() {
  return {
    name: "goatool-site-shell",
    transformIndexHtml(html) {
      return html
        .replace(/<!--site:common(?::(noads))?-->/, (_m, noads) => commonHead({ ads: !noads }))
        .replace(/<!--site:header(?::([a-z]+))?-->/, (_m, active) => siteHeader(active || ""))
        .replace("<!--site:footer-->", siteFooter())
        .replace("<!--site:jsonld:home-->", () => jsonLd(homeGraph()))
        .replace(/<!--site:jsonld:tool:([a-z-]+)-->/, (_m, name) => jsonLd(toolGraph(name, info(name))))
        .replace(/<!--site:toolabout:([a-z-]+)-->/, (_m, name) => toolAbout(info(name)));
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
