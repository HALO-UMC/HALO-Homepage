// @ts-check

import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { corporateMetadata } from "./src/webeditorial/pageMetadata.js";

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}

/** @returns {import("vite").Plugin} */
function corporateHtml() {
  return {
    name: "halo-corporate-metadata",
    apply: "build",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const home = bundle["index.html"];
        if (home?.type !== "asset" || typeof home.source !== "string") {
          this.error("The company HTML entry was not generated.");
        }
        for (const [path, metadata] of Object.entries(corporateMetadata)) {
          const metadataContent = {
            description: metadata.description,
            "og:description": metadata.socialDescription,
            "twitter:description": metadata.socialDescription,
            "og:title": metadata.socialTitle ?? metadata.title,
            "twitter:title": metadata.title,
            "og:url": metadata.canonicalUrl,
            "og:image": metadata.image.url,
            "og:image:secure_url": metadata.image.url,
            "og:image:type": metadata.image.type,
            "og:image:width": metadata.image.width,
            "og:image:height": metadata.image.height,
            "og:image:alt": metadata.image.alt,
            "twitter:image": metadata.image.url,
            "twitter:image:alt": metadata.image.alt,
          };
          const html = home.source
            .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(metadata.title)}</title>`)
            .replace(/((?:name|property)="([^"]+)"\s+content=")([^"]*)/g, (match, prefix, key) =>
              Object.hasOwn(metadataContent, key) ? prefix + escapeHtml(metadataContent[key]) : match)
            .replace(/(rel="canonical"\s+href=")[^"]*/g, (_, prefix) => prefix + escapeHtml(metadata.canonicalUrl));
          this.emitFile({ type: "asset", fileName: `${path.slice(1)}.html`, source: html });
        }
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), corporateHtml()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        halo: fileURLToPath(new URL("./halo.html", import.meta.url)),
        kiri: fileURLToPath(new URL("./kiri.html", import.meta.url)),
        invite: fileURLToPath(new URL("./invite.html", import.meta.url)),
      },
    },
  },
});
