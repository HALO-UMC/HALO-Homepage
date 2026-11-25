// @ts-check

import { partners } from "../data/companyData.js";

const PRODUCTION_ORIGIN = "https://www.halo-official.co.kr";

export const PAGE_METADATA = Object.freeze({
  company: Object.freeze({
    title: "HALO | 함께하는 시간을 만듭니다.",
    socialTitle: "HALO — More time together.",
    description:
      "HALO는 디지털 서비스와 오프라인 경험을 통해 가족이 함께하는 시간을 만드는 기업입니다. 가족 활동 플랫폼 끼리(KIRI)를 개발하고 운영합니다.",
    socialDescription:
      "HALO는 디지털 서비스와 오프라인 경험을 통해 가족이 함께하는 시간을 만드는 기업입니다. 가족 활동 플랫폼 끼리(KIRI)를 개발하고 운영합니다.",
    themeColor: "#ffffff",
    canonicalUrl: `${PRODUCTION_ORIGIN}/`,
    image: Object.freeze({
      url: `${PRODUCTION_ORIGIN}/OG-IMAGE.jpg`,
      type: "image/jpeg",
      width: "600",
      height: "600",
      alt: "HALO | 함께하는 시간을 만듭니다.",
    }),
  }),
  halo: Object.freeze({
    title: "HALO, 가족의 일상을 잇다",
    description:
      "사진과 질문으로 부모님의 삶과 취향을 알아가고, 매일 한 장의 가족 스토리북으로 기록하는 HALO 앱입니다.",
    socialDescription:
      "사진과 질문으로 부모님의 삶과 취향을 알아가고, 매일 한 장의 가족 스토리북으로 기록하는 HALO 앱입니다.",
    themeColor: "#ff7b10",
    canonicalUrl: `${PRODUCTION_ORIGIN}/halo`,
    image: Object.freeze({
      url: `${PRODUCTION_ORIGIN}/og-image.svg`,
      type: "image/svg+xml",
      width: "1920",
      height: "1080",
      alt: "HALO, 가족의 일상을 잇다",
    }),
  }),
  kiri: Object.freeze({
    title: "끼리(KIRI)",
    description:
      "이번 주에 뭐 하지? 우리 가족이 함께할 활동을 찾고, 약속부터 그날의 기록까지 끼리에 남겨보세요.",
    socialDescription:
      "가족과 함께할 활동을 찾고, 약속부터 그날의 기록까지 끼리에 남겨보세요.",
    themeColor: "#1a1a1a",
    canonicalUrl: `${PRODUCTION_ORIGIN}/kiri`,
    image: Object.freeze({
      url: `${PRODUCTION_ORIGIN}/images/kiri/KakaoTalk_20261116_010517345.png`,
      type: "image/png",
      width: "1620",
      height: "2880",
      alt: "끼리(KIRI)",
    }),
  }),
  invite: Object.freeze({
    title: "가족 초대가 도착했어요 | 끼리(KIRI)",
    description:
      "끼리 앱에서 초대를 확인하고 가족 공간에 참여해 보세요.",
    socialDescription:
      "끼리 앱에서 초대를 확인하고 가족 공간에 참여해 보세요.",
    themeColor: "#1a1a1a",
    canonicalUrl: `${PRODUCTION_ORIGIN}/invite`,
    robots: "noindex, nofollow, noarchive",
    referrer: "no-referrer",
    image: Object.freeze({
      url: `${PRODUCTION_ORIGIN}/images/kiri/KakaoTalk_20261116_010517345.png`,
      type: "image/png",
      width: "1620",
      height: "2880",
      alt: "가족 초대가 도착했어요 | 끼리(KIRI)",
    }),
  }),
});

/**
 * @param {string} path
 * @param {string} title
 * @param {string} description
 * @param {{url: string, type: string, width: string, height: string, alt: string}} [image]
 */
function createCorporateMetadata(path, title, description, image = PAGE_METADATA.company.image) {
  return {
    ...PAGE_METADATA.company,
    title,
    socialTitle: title,
    description,
    socialDescription: description,
    canonicalUrl: `${PRODUCTION_ORIGIN}${path}`,
    image,
  };
}

export const corporateMetadata = Object.fromEntries([
  ...partners.map((partner) => {
    const path = `/partners/${partner.slug}`;
    const image = {
      url: `${PRODUCTION_ORIGIN}${partner.conceptImage.src}`,
      type: "image/jpeg",
      width: "1440",
      height: "810",
      alt: partner.conceptImage.alt,
    };
    return [path, createCorporateMetadata(path, `${partner.name} | HALO 파트너십`, partner.description, image)];
  }),
  ["/partnership", createCorporateMetadata("/partnership", "제휴·입점 문의 | HALO", "HALO에 가족 프로그램 입점과 공간·상품·기술 제휴를 제안해 주세요.")],
]);
