const PRODUCTION_ORIGIN = "https://halo-official.co.kr";

export const PAGE_METADATA = Object.freeze({
  company: Object.freeze({
    title: "HALO, 가족의 일상을 잇다",
    description:
      "서로에게 건네는 안녕에서, 함께하는 하루까지. 가족의 이야기를 담는 HALO와 함께할 시간을 만드는 KIRI를 만듭니다.",
    socialDescription:
      "서로에게 건네는 안녕에서, 함께하는 하루까지. 가족의 이야기를 담고 함께할 시간을 만듭니다.",
    themeColor: "#fafafa",
    canonicalUrl: `${PRODUCTION_ORIGIN}/`,
    image: Object.freeze({
      url: `${PRODUCTION_ORIGIN}/OG-IMAGE.jpg`,
      type: "image/jpeg",
      width: "600",
      height: "600",
      alt: "HALO, 가족의 일상을 잇다",
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
    title: "가족끼리, 취향부터 추억까지, KIRI",
    description:
      "부모님과 서로의 취향을 알아가고, 함께할 일을 찾아 약속하고, 그날의 추억을 남겨보세요.",
    socialDescription:
      "부모님과 서로의 취향을 알아가고, 함께할 일을 찾아 약속하고, 그날의 추억을 남겨보세요.",
    themeColor: "#1a1a1a",
    canonicalUrl: `${PRODUCTION_ORIGIN}/kiri`,
    image: Object.freeze({
      url: `${PRODUCTION_ORIGIN}/OG-IMAGE.jpg`,
      type: "image/jpeg",
      width: "600",
      height: "600",
      alt: "가족끼리, 취향부터 추억까지, KIRI",
    }),
  }),
});
