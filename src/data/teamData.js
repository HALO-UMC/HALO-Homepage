export const teamGroups = [
  {
    id: "product",
    code: "PRODUCT",
    title: "Product",
    description:
      "사용자의 문제를 정의하고 HALO가 제공해야 할 경험과 서비스의 기준을 설계합니다.",
    members: [
      {
        id: "namhyuk",
        name: "이남혁",
        englishName: "Namhyuk Lee",
        role: "Product Manager · Team Lead",
        position: "PM",
        isLead: true,
        description:
          "HALO의 서비스 방향과 핵심 기능을 설계하고, 일정과 파트 간 협업을 조율했습니다. 기획부터 QA와 출시 준비까지 프로젝트 전반을 리드했습니다.",
        image: "/images/team/namhyuk.svg",
      },
    ],
  },
  {
    id: "design",
    code: "DESIGN",
    title: "Design",
    description:
      "HALO의 사용자 경험과 브랜드, 캐릭터 그리고 서비스 전반의 시각적 언어를 설계합니다.",
    members: [
      {
        id: "juyeon",
        name: "김주연",
        englishName: "Juyeon Kim",
        role: "UI/UX Designer",
        position: "UI/UX",
        isLead: true,
        description:
          "HALO의 핵심 화면과 사용자 흐름을 설계하고 일관된 디자인 시스템을 구축합니다.",
        image: "/images/team/juyeon.svg",
      },
      {
        id: "hamin",
        name: "임하민",
        englishName: "Hamin Lim",
        role: "Brand Designer",
        position: "BRANDING",
        isLead: true,
        description:
          "브랜드 아이덴티티와 캐릭터, 일러스트 등 HALO의 시각적 인상을 만드는 자산을 제작합니다.",
        image: "/images/team/hamin.svg",
      },
    ],
  },
  {
    id: "android",
    code: "ANDROID",
    title: "Android",
    description:
      "사용자가 HALO의 스토리북과 기록을 안정적으로 경험할 수 있는 모바일 환경을 구현합니다.",
    members: [
      {
        id: "chaeryeong",
        name: "오채령",
        englishName: "Chaeryeong Oh",
        role: "Android Developer",
        position: "PL",
        isLead: true,
        description:
          "Android 개발 기준을 정리하고 앱 구조와 주요 기능 구현, 파트 진행을 이끌고 있습니다.",
        image: "/images/team/chaeryeong.svg",
      },
      {
        id: "doyeop",
        name: "김도엽",
        englishName: "Doyeop Kim",
        role: "Android Developer",
        position: "ANDROID",
        isLead: false,
        description:
          "소셜 로그인과 약관 동의, 캘린더 등 사용자가 서비스를 시작하고 기록하는 흐름을 구현합니다.",
        image: "/images/team/doyeop.svg",
      },
      {
        id: "jaehwan",
        name: "김재환",
        englishName: "Jaehwan Kim",
        role: "Android Developer",
        position: "ANDROID",
        isLead: false,
        description:
          "홈과 스토리북, 통합 네비게이션 등 HALO의 주요 탐색 경험과 화면을 구현합니다.",
        image: "/images/team/jaehwan.svg",
      },
    ],
  },
  {
    id: "server",
    code: "SPRING BOOT",
    title: "Spring Boot",
    description:
      "회원과 스토리북, 기록과 알림을 연결하며 HALO 서비스의 데이터와 시스템을 구축합니다.",
    members: [
      {
        id: "seohyeon",
        name: "김서현",
        englishName: "Seohyeon Kim",
        role: "Backend Developer",
        position: "PL",
        isLead: true,
        description:
          "서버 구조와 데이터 기준, 배포 환경을 설계하고 Spring Boot 파트의 개발을 이끌고 있습니다.",
        image: "/images/team/seohyeon.svg",
      },
      {
        id: "jeongmin",
        name: "홍정민",
        englishName: "Jungmin Hong",
        role: "Backend Developer",
        position: "SPRING BOOT",
        isLead: false,
        description:
          "테마와 캘린더 등 서비스의 주요 데이터 흐름과 사용자 기록을 위한 API를 구현합니다.",
        image: "/images/team/jeongmin.svg",
      },
      {
        id: "jaehyeon",
        name: "신재현",
        englishName: "Jaehyeon Shin",
        role: "Backend Developer",
        position: "SPRING BOOT",
        isLead: false,
        description:
          "회원 온보딩과 알림, AI 요약 등 개인화된 서비스 경험을 위한 기능을 구현합니다.",
        image: "/images/team/jaehyeon.svg",
      },
      {
        id: "hyedam",
        name: "한혜담",
        englishName: "Hyedam Han",
        role: "Backend Developer",
        position: "SPRING BOOT",
        isLead: false,
        description:
          "기념일과 API 문서화 등 서비스 운영과 앱 연동에 필요한 서버 기능과 스토리북과 관련된 데이터 등 서비스 주요 기능을 구현합니다.",
        image: "/images/team/hyedam.svg",
      },
    ],
  },
];