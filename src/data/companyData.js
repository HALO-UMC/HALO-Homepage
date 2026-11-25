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
    displayDate: "현재",
    current: true,
    title: "가족 프로그램 및 기업·기관 협력 준비",
    description: "HALO 자체 가족 프로그램 운영과 지역사회 연계 사업을 준비하며, 가족에게 필요한 활동과 서비스를 살펴보고 있습니다.",
  },
  {
    month: "2026-11",
    title: "끼리(KIRI) iOS 출시 및 사업화 추진",
    description: "iOS 정식 출시 후 서비스를 개선하고 있습니다. 모두의 창업 멘토링과 기업 네트워킹으로 사업 방향을 구체화했으며, 인터뷰 영상 2편은 누적 약 3,000회 조회됐습니다.",
    href: "/kiri",
    linkLabel: "끼리 서비스 보기",
  },
  {
    month: "2026-10",
    title: "끼리 개발·고객 인터뷰 및 모두의 창업 진출",
    description: "잠재 고객 인터뷰로 가족의 취향과 활동 요구를 살피고, 모두의 창업 2차 1라운드에 진출했습니다.",
  },
  {
    month: "2026-09",
    title: "HALO 2기 조직 개편 및 신규 서비스 기획",
    description: "사용자 피드백을 바탕으로 가족 기록에서 가족 활동으로 서비스 방향을 확장했습니다.",
  },
  {
    month: "2026-08",
    title: "HALO 출시 및 부산 UMC 데모데이 5위",
    description: "개인사업자 등록 후 HALO를 Google Play에 출시했습니다. 데모데이에서 잠재 고객 약 50명에게 서비스를 소개하고 5위를 기록했습니다.",
    href: "https://play.google.com/store/apps/details?id=com.umc.halo",
    linkLabel: "Google Play에서 보기",
  },
  {
    month: "2026-06",
    displayDate: "2026.06–07",
    title: "팀 구성, HALO 기획·개발 및 사용자 테스트",
    description: "6월 팀을 구성해 가족 기록 서비스 기획·개발을 시작하고, 7월 오프라인 테스트에서 사용 경험과 개선점을 확인했습니다.",
  },
];
