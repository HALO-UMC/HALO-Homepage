// @ts-check

export const partnershipStatuses = {
  proposed: "협력 검토",
  discussing: "협의 중",
  mou: "MOU 체결",
  developing: "공동 프로젝트 추진",
  operating: "실제 프로그램 운영 중",
};

export const partners = [
  {
    slug: "sheimspa",
    name: "쉼스파",
    field: "Family Experience / Wellness",
    title: "가족이 함께 쉬어가는 특별한 하루",
    status: "proposed",
    logo: "/shimspa_logo.jpeg",
    gallery: [],
    website: "https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=84128fcc-cc0d-4dee-be4f-74b81a131079",
    conceptImage: {
      src: "/images/partners/sheimspa/wellness-concept.jpg",
      alt: "가상의 휴식 공간에서 차를 마시며 대화하는 어머니와 성인 딸",
    },
    description: "아쿠아필드 고양의 쉼스파 공간과 함께 기획할 수 있는 가족 웰니스 경험을 소개합니다.",
  },
  {
    slug: "sig-corporation",
    name: "시그코퍼레이션",
    field: "Family Care / Technology",
    title: "부모님의 일상에 더 가까이 다가가는 기술",
    status: "proposed",
    logo: "/senihug_logo.png",
    gallery: [],
    website: "https://www.senihug.com/",
    conceptImage: {
      src: "/images/partners/sig-corporation/family-care-concept.jpg",
      alt: "가상의 가정에서 마주 앉아 안부를 나누는 아버지와 성인 딸",
    },
    description: "시니허그의 비접촉 센싱 기술과 HALO 가족 서비스를 연결하는 돌봄 경험을 살펴봅니다.",
  },
];

export const milestones = [
  {
    month: "2026-11",
    title: "끼리(KIRI) iOS/Android 출시",
    description: "가족 스토리북에서 출발해 함께할 활동을 찾고 약속과 기록을 남기는 끼리로 서비스를 확장했습니다.",
    href: "/kiri",
    linkLabel: "끼리 서비스 보기",
  },
  {
    month: "2026-10",
    title: "모두의창업 2차 1라운드 진출",
    description: "모두의창업 2차 모집에서 1라운드에 진출했습니다.",
  },
  {
    month: "2026-08",
    title: "HALO 1.0 Android 출시",
    description: "사진과 질문으로 부모님과의 대화를 기록하는 HALO 앱을 Google Play에 공개했습니다.",
    href: "https://play.google.com/store/apps/details?id=com.umc.halo",
    linkLabel: "Google Play에서 보기",
  },
  {
    month: "2026-08",
    title: "UMC 데모데이 참가 및 5위",
    description: "데모데이 현장에서 가족 스토리북을 시연하고 5위를 기록했습니다.",
  },
];
