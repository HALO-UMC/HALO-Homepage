import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const DIST_DIRECTORY = path.resolve("dist");

const pages = [
  {
    route: "/",
    fileName: "index.html",
    title: "HALO, 가족의 일상을 잇다",
    description:
      "서로에게 건네는 안녕에서, 함께하는 하루까지. 가족의 이야기를 담는 HALO와 함께할 시간을 만드는 KIRI를 만듭니다.",
    socialDescription:
      "서로에게 건네는 안녕에서, 함께하는 하루까지. 가족의 이야기를 담고 함께할 시간을 만듭니다.",
    canonicalUrl: "https://www.halo-official.co.kr/",
    imageUrl: "https://www.halo-official.co.kr/OG-IMAGE.jpg",
    imageType: "image/jpeg",
    imageWidth: "600",
    imageHeight: "600",
  },
  {
    route: "/halo",
    fileName: "halo.html",
    title: "HALO, 가족의 일상을 잇다",
    description:
      "사진과 질문으로 부모님의 삶과 취향을 알아가고, 매일 한 장의 가족 스토리북으로 기록하는 HALO 앱입니다.",
    socialDescription:
      "사진과 질문으로 부모님의 삶과 취향을 알아가고, 매일 한 장의 가족 스토리북으로 기록하는 HALO 앱입니다.",
    canonicalUrl: "https://www.halo-official.co.kr/halo",
    imageUrl: "https://www.halo-official.co.kr/og-image.svg",
    imageType: "image/svg+xml",
    imageWidth: "1920",
    imageHeight: "1080",
  },
  {
    route: "/kiri",
    fileName: "kiri.html",
    title: "가족끼리, 취향부터 추억까지, KIRI",
    description:
      "부모님과 서로의 취향을 알아가고, 함께할 일을 찾아 약속하고, 그날의 추억을 남겨보세요.",
    socialDescription:
      "부모님과 서로의 취향을 알아가고, 함께할 일을 찾아 약속하고, 그날의 추억을 남겨보세요.",
    canonicalUrl: "https://www.halo-official.co.kr/kiri",
    imageUrl: "https://www.halo-official.co.kr/OG-IMAGE.jpg",
    imageType: "image/jpeg",
    imageWidth: "600",
    imageHeight: "600",
  },
];

function attributes(element) {
  const values = new Map();
  const pattern = /([^\s=]+)\s*=\s*"([^"]*)"/g;
  let match;

  while ((match = pattern.exec(element)) !== null) {
    values.set(match[1], match[2]);
  }

  return values;
}

function elementWith(html, elementName, attribute, value) {
  const elements = html.match(new RegExp(`<${elementName}\\b[^>]*>`, "gi")) ?? [];
  const element = elements.find(
    (candidate) => attributes(candidate).get(attribute) === value,
  );

  assert.ok(element, `${elementName}[${attribute}="${value}"] is missing`);
  return attributes(element);
}

function metaContent(html, attribute, value) {
  return elementWith(html, "meta", attribute, value).get("content");
}

function jpegDimensions(buffer) {
  assert.equal(buffer.readUInt16BE(0), 0xffd8, "JPEG signature is invalid");
  const startOfFrameMarkers = new Set([
    0xc0,
    0xc1,
    0xc2,
    0xc3,
    0xc5,
    0xc6,
    0xc7,
    0xc9,
    0xca,
    0xcb,
    0xcd,
    0xce,
    0xcf,
  ]);

  let offset = 2;
  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    offset += segmentLength + 2;
  }

  throw new Error("JPEG dimensions were not found");
}

test("production HTML entry points contain route-specific metadata", async (t) => {
  for (const page of pages) {
    await t.test(page.route, async () => {
      const html = await readFile(
        path.join(DIST_DIRECTORY, page.fileName),
        "utf8",
      );
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1];

      assert.equal(title, page.title);
      assert.equal(metaContent(html, "name", "description"), page.description);
      assert.equal(
        elementWith(html, "link", "rel", "canonical").get("href"),
        page.canonicalUrl,
      );
      assert.equal(metaContent(html, "property", "og:url"), page.canonicalUrl);
      assert.equal(metaContent(html, "property", "og:title"), page.title);
      assert.equal(
        metaContent(html, "property", "og:description"),
        page.socialDescription,
      );
      assert.equal(metaContent(html, "property", "og:image"), page.imageUrl);
      assert.equal(
        metaContent(html, "property", "og:image:secure_url"),
        page.imageUrl,
      );
      assert.equal(
        metaContent(html, "property", "og:image:type"),
        page.imageType,
      );
      assert.equal(
        metaContent(html, "property", "og:image:width"),
        page.imageWidth,
      );
      assert.equal(
        metaContent(html, "property", "og:image:height"),
        page.imageHeight,
      );
      assert.equal(metaContent(html, "property", "og:image:alt"), page.title);
      assert.equal(metaContent(html, "name", "twitter:title"), page.title);
      assert.equal(
        metaContent(html, "name", "twitter:description"),
        page.socialDescription,
      );
      assert.equal(metaContent(html, "name", "twitter:image"), page.imageUrl);
      assert.equal(metaContent(html, "name", "twitter:image:alt"), page.title);
    });
  }
});

test("share images are emitted with their declared type and dimensions", async () => {
  const jpg = await readFile(path.join(DIST_DIRECTORY, "OG-IMAGE.jpg"));
  const svg = await readFile(path.join(DIST_DIRECTORY, "og-image.svg"), "utf8");

  assert.deepEqual(jpegDimensions(jpg), { width: 600, height: 600 });
  assert.match(
    svg.slice(0, 512),
    /<svg\s+width="1920"\s+height="1080"[^>]*>/,
  );
});

test("Vercel serves clean route HTML before the SPA fallback", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));

  assert.equal(config.cleanUrls, true);
  assert.equal(config.trailingSlash, false);
  assert.equal(config.rewrites.at(-1)?.destination, "/index");
});
