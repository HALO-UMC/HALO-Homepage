import { useEffect } from "react";

const metadataAttributes = (metadata) => [
  ['meta[name="description"]', "content", metadata.description],
  ['meta[name="theme-color"]', "content", metadata.themeColor],
  ['link[rel="canonical"]', "href", metadata.canonicalUrl],
  ['meta[property="og:url"]', "content", metadata.canonicalUrl],
  ['meta[property="og:title"]', "content", metadata.title],
  [
    'meta[property="og:description"]',
    "content",
    metadata.socialDescription,
  ],
  ['meta[property="og:image"]', "content", metadata.image.url],
  ['meta[property="og:image:secure_url"]', "content", metadata.image.url],
  ['meta[property="og:image:type"]', "content", metadata.image.type],
  ['meta[property="og:image:width"]', "content", metadata.image.width],
  ['meta[property="og:image:height"]', "content", metadata.image.height],
  ['meta[property="og:image:alt"]', "content", metadata.image.alt],
  ['meta[name="twitter:title"]', "content", metadata.title],
  [
    'meta[name="twitter:description"]',
    "content",
    metadata.socialDescription,
  ],
  ['meta[name="twitter:image"]', "content", metadata.image.url],
  ['meta[name="twitter:image:alt"]', "content", metadata.image.alt],
];

export default function usePageMeta(metadata) {
  useEffect(() => {
    const previousTitle = document.title;
    const attributes = metadataAttributes(metadata).map(
      ([selector, attribute, value]) => {
        const element = document.querySelector(selector);
        const previousValue = element?.getAttribute(attribute) ?? null;

        element?.setAttribute(attribute, value);

        return { attribute, element, previousValue };
      },
    );

    document.title = metadata.title;

    return () => {
      document.title = previousTitle;
      attributes.forEach(({ attribute, element, previousValue }) => {
        if (previousValue === null) {
          element?.removeAttribute(attribute);
          return;
        }

        element?.setAttribute(attribute, previousValue);
      });
    };
  }, [metadata]);
}
