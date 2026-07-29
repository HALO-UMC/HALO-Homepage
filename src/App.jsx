import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  brandPrinciples,
  companyStats,
  heroImages,
  navigationItems,
  productFeatures,
  productImages,
  storybooks,
} from "./data/siteData.js";

import { teamGroups } from "./data/teamData.js";

import {
  legalDocuments,
  legalTabs,
} from "./data/legalData.js";

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/halo-image-fallback/1200/900";

function ArrowIcon({ direction = "right" }) {
  const rotateClass =
    direction === "left" ? "rotate-180" : "";

  return (
    <svg
      className={rotateClass}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 8H22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M4 18H22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M20 6L6 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImageWithFallback({
  src,
  alt,
  className = "",
}) {
  const handleError = (event) => {
    const image = event.currentTarget;

    if (image.dataset.fallbackApplied === "true") {
      return;
    }

    image.dataset.fallbackApplied = "true";
    image.src = FALLBACK_IMAGE;
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}

function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className={[
        "inline-flex shrink-0 items-center rounded-xl",
        light
          ? "bg-white px-3 py-2"
          : "",
      ].join(" ")}
      aria-label="Team HALO 홈페이지"
    >
      <img
        src="/logotypo.svg"
        alt="HALO"
        className="h-8 w-auto md:h-9"
      />
    </Link>
  );
}

function Header() {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] =
    useState(false);

  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getNavigationHref = (href) =>
    isHome ? href : `/${href}`;

  return (
    <header
      className={[
        "fixed top-0 left-0 z-50 w-full border-b transition duration-200",
        isScrolled
          ? "border-halo-brown-900/10 bg-halo-cream-50/90 shadow-halo-sm backdrop-blur-xl"
          : "border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-[76px] w-[min(calc(100%-36px),1360px)] items-center justify-between md:h-[88px] md:w-[min(calc(100%-48px),1360px)]">
        <Logo />

        <nav
          className="ml-auto hidden items-center gap-9 md:flex"
          aria-label="주요 메뉴"
        >
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={getNavigationHref(item.href)}
              className="text-sm font-semibold text-halo-brown-600 transition hover:text-halo-orange-500"
            >
              {item.label}
            </a>
          ))}

          <Link
            to="/terms"
            className={[
              "text-sm font-semibold transition",
              location.pathname !== "/"
                ? "text-halo-orange-500"
                : "text-halo-brown-600 hover:text-halo-orange-500",
            ].join(" ")}
          >
            약관
          </Link>
        </nav>

        <a
          href={getNavigationHref("#team")}
          className="ml-10 hidden min-h-12 items-center gap-4 rounded-full border border-halo-brown-900/15 px-5 text-[13px] font-semibold text-halo-brown-800 transition hover:border-halo-orange-500 hover:bg-halo-orange-500 hover:text-white lg:inline-flex"
        >
          Meet the team
          <ArrowIcon />
        </a>

        <button
          type="button"
          className="flex size-12 items-center justify-center rounded-full border border-halo-brown-900/15 text-halo-brown-900 md:hidden"
          aria-label={
            isOpen ? "메뉴 닫기" : "메뉴 열기"
          }
          aria-expanded={isOpen}
          onClick={() =>
            setIsOpen((previous) => !previous)
          }
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div
        className={[
          "fixed inset-0 top-[76px] flex flex-col justify-between bg-halo-brown-950 px-6 py-10 text-white transition duration-300 md:hidden",
          isOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-4 opacity-0",
        ].join(" ")}
      >
        <nav className="flex flex-col">
          {navigationItems.map((item, index) => (
            <a
              key={item.href}
              href={getNavigationHref(item.href)}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-5 border-b border-white/15 py-5 text-4xl font-semibold tracking-[-0.05em]"
            >
              <span className="text-[10px] tracking-[0.14em] text-halo-orange-300">
                {String(index + 1).padStart(
                  2,
                  "0",
                )}
              </span>

              {item.label}
            </a>
          ))}

          <Link
            to="/terms"
            className="flex items-center gap-5 border-b border-white/15 py-5 text-4xl font-semibold tracking-[-0.05em]"
          >
            <span className="text-[10px] tracking-[0.14em] text-halo-orange-300">
              05
            </span>
            약관
          </Link>
        </nav>

        <p className="text-base leading-7 text-white/45">
          매일 한 장,
          <br />
          부모님과 이어가는 따뜻한 안녕
        </p>
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}) {
  return (
    <div className="max-w-[700px]">
      <span
        className={[
          "mb-5 block text-xs font-bold tracking-[0.18em]",
          light
            ? "text-halo-orange-300"
            : "text-halo-orange-600",
        ].join(" ")}
      >
        {eyebrow}
      </span>

      <h2
        className={[
          "text-[40px] leading-[1.15] font-semibold tracking-[-0.055em] md:text-[58px] xl:text-[68px]",
          light
            ? "text-white"
            : "text-halo-brown-900",
        ].join(" ")}
      >
        {title}
      </h2>

      {description && (
        <p
          className={[
            "mt-6 max-w-[580px] text-[15px] leading-8 tracking-[-0.018em] md:text-[17px]",
            light
              ? "text-white/60"
              : "text-halo-brown-500",
          ].join(" ")}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return;
    }

    const timeout = window.setTimeout(() => {
      document
        .querySelector(location.hash)
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 50);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [location.hash]);

  return (
    <>
      <HeroSection />
      <BrandStatement />
      <ProductSection />
      <StorybookSection />
      <NumbersSection />
      <PrinciplesSection />
      <TeamSection />
      <FinalSection />
    </>
  );
}

function HeroSection() {
  return (
    <section
      id="top"
      className="halo-light-surface relative min-h-[900px] overflow-hidden pt-[140px] pb-24 md:pt-[170px]"
    >
      <div className="mx-auto grid w-[min(calc(100%-36px),1240px)] items-center gap-16 md:w-[min(calc(100%-48px),1240px)] xl:grid-cols-[0.92fr_1.08fr] xl:gap-20">
        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-4 text-[11px] font-bold tracking-[0.18em] text-halo-orange-600">
            <span className="h-px w-9 bg-current" />
            RELATIONSHIP DESIGN COMPANY
          </div>

          <h1 className="text-[48px] leading-[1.07] font-medium tracking-[-0.065em] text-halo-brown-900 md:text-[70px] xl:text-[86px]">
            안녕에서 시작된 
            <br />
            <strong className="font-bold text-halo-orange-500">
              HALO
            </strong>
          </h1>

          <p className="mt-8 max-w-[580px] text-base leading-8 tracking-[-0.02em] text-halo-brown-500 md:text-lg">
            Team HALO는 부모님과 자녀가 서로의
            삶을 조금 더 <br></br>자연스럽게 알아갈 수
            있도록, <br></br>대화와 행동 그리고 기록의
            경험을 만듭니다.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#product"
              className="halo-primary-button inline-flex min-h-14 items-center justify-center gap-7 rounded-full px-7 text-sm font-bold text-white transition hover:-translate-y-1"
            >
              Discover HALO
              <ArrowIcon />
            </a>

            <a
              href="#storybook"
              className="inline-flex min-h-14 items-center justify-center gap-7 rounded-full border border-halo-brown-900/15 bg-white/50 px-7 text-sm font-bold text-halo-brown-800 transition hover:-translate-y-1 hover:border-halo-orange-500 hover:text-halo-orange-600"
            >
              Explore storybooks
              <ArrowIcon />
            </a>
          </div>

          <div className="mt-14 border-l-2 border-halo-orange-500 pl-5">
            <span className="block text-[10px] font-bold tracking-[0.18em] text-halo-orange-600">
              OUR FIRST PRODUCT
            </span>

            <strong className="mt-2 block text-[15px] font-semibold text-halo-brown-900">
              HALO: 매일 한 장, 부모님과 이어가는 따뜻한 안녕
            </strong>
          </div>
        </div>

        <div className="relative grid h-[560px] grid-cols-[1fr_0.38fr] gap-4 md:h-[670px]">
          <div className="relative overflow-hidden rounded-[32px] shadow-halo-lg">
            <ImageWithFallback
              src={heroImages.main}
              alt="HALO 서비스 대표 이미지"
              className="h-full w-full object-cover"
            />

            <div className="halo-image-overlay absolute inset-0" />

            <div className="absolute right-8 bottom-8 left-8 text-white">
              <span className="text-[10px] font-bold tracking-[0.17em]">
                TEAM HALO
              </span>

              <strong className="mt-3 block text-3xl leading-tight font-semibold tracking-[-0.04em] md:text-4xl">
                Every relationship
                <br />
                has a story.
              </strong>
            </div>
          </div>

          <div className="grid grid-rows-[0.84fr_1.16fr] gap-4">
            <div className="relative overflow-hidden rounded-[28px] shadow-halo">
              <ImageWithFallback
                src={heroImages.subTop}
                alt="HALO 서비스 이미지"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="relative overflow-hidden rounded-[28px] shadow-halo">
              <ImageWithFallback
                src={heroImages.subBottom}
                alt="HALO 서비스 이미지"
                className="h-full w-full object-cover"
              />

              <div className="halo-image-overlay absolute inset-0" />

              <div className="absolute right-4 bottom-5 left-4 text-white">
                <span className="text-[9px] font-semibold tracking-[0.17em]">
                  ONE PAGE
                </span>

                <strong className="mt-1 block text-xl font-bold">
                  A DAY
                </strong>
              </div>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}

function BrandStatement() {
  return (
    <section
      id="about"
      className="bg-halo-cream-50 py-28 md:py-44"
    >
      <div className="mx-auto w-[min(calc(100%-36px),1240px)] md:w-[min(calc(100%-48px),1240px)]">
        <div className="flex items-center gap-6 text-[11px] font-bold tracking-[0.17em] text-halo-orange-600">
          ABOUT TEAM HALO
          <span className="h-px w-24 bg-halo-orange-300" />
        </div>

        <p className="mt-12 text-[42px] leading-[1.2] font-medium tracking-[-0.06em] text-halo-brown-900 md:text-[64px] xl:text-[82px]">
          마음이 없어서가 아니라,
          <br />
          <strong className="font-bold text-halo-orange-500">
            시작하는 방법을 몰랐기 때문입니다.
          </strong>
        </p>

        <div className="mt-16 ml-auto grid max-w-[840px] gap-6 md:grid-cols-2 md:gap-16">
          <p className="text-base leading-8 text-halo-brown-500">
            우리는 관계를 바꾸는 거창한 결심보다
            오늘 먼저 건넬 수 있는 짧은 안부, 한
            번의 질문, 한 장의 기록에 집중합니다.
          </p>

          <p className="text-base leading-8 text-halo-brown-500">
            HALO는 가족 관계에서 시작해 사람과
            사람 사이의 거리를 자연스럽게 좁히는
            경험을 만들어갑니다.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductSection() {
  return (
    <section
      id="product"
      className="bg-halo-cream-200 py-28 md:py-44"
    >
      <div className="mx-auto w-[min(calc(100%-36px),1240px)] md:w-[min(calc(100%-48px),1240px)]">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="OUR PRODUCT"
            title={
              <>
                매일 한 장,
                <br />
                부모님과 이어가는 안녕
              </>
            }
            description="HALO는 부모님의 삶과 취향을 알아가고, 일상 속 작은 행동으로 관계를 이어갈 수 있도록 돕는 스토리북 서비스입니다."
          />

          <div className="max-w-[300px] pb-2">
            <span className="text-[11px] font-bold tracking-[0.2em] text-halo-orange-500">
              HALO
            </span>

            <p className="mt-4 text-[15px] leading-7 text-halo-brown-500">
              영어의 인사말과
              <br />
              평안할 안녕(安寧)을 함께 담았습니다.
            </p>
          </div>
        </div>

        <div className="mt-20 grid items-center gap-16 xl:grid-cols-[1fr_0.9fr] xl:gap-24">
          <div className="halo-product-surface relative flex min-h-[580px] justify-center overflow-hidden rounded-[38px] p-10 md:min-h-[720px] md:p-14">
            <div className="relative z-10 w-[min(290px,70%)] rounded-[42px] border border-white/40 bg-halo-brown-950 p-2.5 shadow-halo-lg">
              <div className="absolute top-5 left-1/2 z-10 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-halo-brown-950" />

              <ImageWithFallback
                src={productImages.main}
                alt="HALO 앱 화면"
                className="h-full w-full rounded-[32px] object-cover"
              />
            </div>

            <div className="absolute right-4 bottom-8 z-20 w-[170px] rotate-[4deg] rounded-3xl bg-white/90 p-2.5 shadow-halo backdrop-blur-xl md:right-7 md:bottom-14 md:w-[220px]">
              <ImageWithFallback
                src={productImages.detail}
                alt="HALO 상세 화면"
                className="h-[120px] rounded-2xl object-cover md:h-[170px]"
              />

              <span className="block px-2 pt-4 pb-2 text-[9px] font-bold tracking-[0.18em] text-halo-brown-900">
                DAILY STORYBOOK
              </span>
            </div>

            <div className="absolute top-8 left-5 z-20 flex size-24 flex-col items-center justify-center rounded-full border border-white/50 bg-halo-brown-950/85 text-white shadow-halo backdrop-blur-xl md:top-14 md:left-9 md:size-28">
              <span className="text-3xl font-bold">
                10
              </span>

              <small className="mt-1 text-[8px] font-bold tracking-[0.14em]">
                CHAPTERS
              </small>
            </div>
          </div>

          <div className="border-t border-halo-brown-900/15">
            {productFeatures.map((feature) => (
              <article
                key={feature.number}
                className="grid grid-cols-[44px_1fr] gap-4 border-b border-halo-brown-900/15 py-9 md:grid-cols-[60px_1fr] md:gap-8 md:py-11"
              >
                <div className="pt-1 text-xs font-bold text-halo-orange-600">
                  {feature.number}
                </div>

                <div>
                  <span className="text-[9px] font-bold tracking-[0.17em] text-halo-orange-500">
                    {feature.eyebrow}
                  </span>

                  <h3 className="mt-3 text-[27px] font-semibold tracking-[-0.04em] text-halo-brown-900 md:text-[31px]">
                    {feature.title}
                  </h3>

                  <p className="mt-4 max-w-[500px] text-[15px] leading-7 text-halo-brown-500">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StorybookSection() {
  const [activeIndex, setActiveIndex] =
    useState(0);

  const viewportRef = useRef(null);
  const itemRefs = useRef([]);
  const scrollFrameRef = useRef(null);

  const total = storybooks.length;
  const activeStorybook =
    storybooks[activeIndex];

  const moveTo = (requestedIndex) => {
    const normalizedIndex =
      ((requestedIndex % total) + total) % total;

    setActiveIndex(normalizedIndex);

    itemRefs.current[
      normalizedIndex
    ]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const handleScroll = () => {
    if (scrollFrameRef.current) {
      window.cancelAnimationFrame(
        scrollFrameRef.current,
      );
    }

    scrollFrameRef.current =
      window.requestAnimationFrame(() => {
        const viewport = viewportRef.current;

        if (!viewport) {
          return;
        }

        const viewportRect =
          viewport.getBoundingClientRect();

        const viewportCenter =
          viewportRect.left +
          viewportRect.width / 2;

        let closestIndex = activeIndex;
        let closestDistance =
          Number.POSITIVE_INFINITY;

        itemRefs.current.forEach(
          (item, index) => {
            if (!item) {
              return;
            }

            const itemRect =
              item.getBoundingClientRect();

            const itemCenter =
              itemRect.left +
              itemRect.width / 2;

            const distance = Math.abs(
              viewportCenter - itemCenter,
            );

            if (
              distance < closestDistance
            ) {
              closestDistance = distance;
              closestIndex = index;
            }
          },
        );

        if (closestIndex !== activeIndex) {
          setActiveIndex(closestIndex);
        }
      });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTo(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTo(activeIndex + 1);
    }
  };

  return (
    <section
      id="storybook"
      className="halo-dark-surface overflow-hidden py-28 text-white md:py-44"
    >
      <div className="mx-auto flex w-[min(calc(100%-36px),1240px)] flex-col justify-between gap-10 md:w-[min(calc(100%-48px),1240px)] lg:flex-row lg:items-end">
        <SectionHeading
          eyebrow="HALO STORYBOOK"
          title={
            <>
              서로 다른 관계를 위한
              <br />
              열 권의 이야기
            </>
          }
          description="각 스토리북은 부모님과의 현재 관계와 원하는 방향에 따라 다른 시작점을 제공합니다."
          light
        />

        <div className="flex self-end gap-3">
          <button
            type="button"
            aria-label="이전 스토리북"
            onClick={() =>
              moveTo(activeIndex - 1)
            }
            className="flex size-14 items-center justify-center rounded-full border border-white/20 transition hover:-translate-y-1 hover:bg-white hover:text-halo-brown-950"
          >
            <ArrowIcon direction="left" />
          </button>

          <button
            type="button"
            aria-label="다음 스토리북"
            onClick={() =>
              moveTo(activeIndex + 1)
            }
            className="flex size-14 items-center justify-center rounded-full border border-white/20 transition hover:-translate-y-1 hover:bg-white hover:text-halo-brown-950"
          >
            <ArrowIcon />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex="0"
        className="hide-scrollbar mt-12 w-full snap-x snap-mandatory overflow-x-auto px-[calc((100vw-min(76vw,350px))/2)] py-10 md:mt-16 md:px-[calc((100vw-clamp(290px,29vw,390px))/2)]"
        aria-label="HALO 스토리북 슬라이드"
      >
        <div className="flex w-max items-center gap-5 md:gap-6">
          {storybooks.map(
            (storybook, index) => {
              const isActive =
                activeIndex === index;

              return (
                <button
                  type="button"
                  key={storybook.id}
                  ref={(element) => {
                    itemRefs.current[index] =
                      element;
                  }}
                  onClick={() => moveTo(index)}
                  className={[
                    "w-[min(76vw,350px)] shrink-0 snap-center overflow-hidden rounded-[28px] text-left transition duration-500 md:w-[clamp(290px,29vw,390px)]",
                    isActive
                      ? "relative z-10 scale-100 opacity-100"
                      : "scale-[0.86] opacity-40 hover:scale-[0.9] hover:opacity-70",
                  ].join(" ")}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
                    <ImageWithFallback
                      src={storybook.image}
                      alt={`${storybook.title} 대표 이미지`}
                      className={[
                        "h-full w-full object-cover transition duration-700",
                        isActive
                          ? "scale-[1.025] saturate-100"
                          : "saturate-[0.7]",
                      ].join(" ")}
                    />

                    <div className="halo-image-overlay absolute inset-0" />

                    <span className="absolute top-6 left-6 text-[9px] font-bold tracking-[0.17em] text-white/75">
                      STORYBOOK{" "}
                      {storybook.order}
                    </span>

                    <div className="absolute right-7 bottom-7 left-7">
                      <small className="text-[10px] text-white/60">
                        {
                          storybook.englishTitle
                        }
                      </small>

                      <strong className="mt-2 block text-[29px] leading-tight font-semibold tracking-[-0.045em] text-white md:text-4xl">
                        {storybook.title}
                      </strong>
                    </div>
                  </div>
                </button>
              );
            },
          )}
        </div>
      </div>

      <div className="mx-auto w-[min(calc(100%-36px),970px)] md:w-[min(calc(100%-48px),970px)]">
        <div
          key={activeStorybook.id}
          className="animate-detail-fade mt-8 grid gap-6 border-t border-white/15 pt-8 md:grid-cols-[100px_1fr_auto] md:items-end md:gap-10"
        >
          <div className="flex items-baseline gap-2">
            <strong className="text-4xl font-semibold">
              {activeStorybook.order}
            </strong>

            <span className="text-xs text-white/35">
              /{" "}
              {String(total).padStart(
                2,
                "0",
              )}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold tracking-[0.14em] text-halo-orange-300">
              {
                activeStorybook.englishTitle
              }
            </span>

            <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {activeStorybook.title}
            </h3>

            <p className="mt-3 max-w-[640px] text-sm leading-7 text-white/58">
              {activeStorybook.description}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {storybooks.map(
              (storybook, index) => (
                <button
                  type="button"
                  key={storybook.id}
                  onClick={() =>
                    moveTo(index)
                  }
                  aria-label={`${storybook.title}로 이동`}
                  className={[
                    "flex h-5 items-center transition",
                    activeIndex === index
                      ? "w-8"
                      : "w-4",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "block h-0.5 w-full transition",
                      activeIndex === index
                        ? "bg-halo-orange-500"
                        : "bg-white/20",
                    ].join(" ")}
                  />
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function NumbersSection() {
  return (
    <section className="bg-halo-brown-950 pb-28 text-white">
      <div className="mx-auto w-[min(calc(100%-36px),1240px)] md:w-[min(calc(100%-48px),1240px)]">
        <div className="flex flex-col justify-between gap-7 border-b border-white/15 pb-12 md:flex-row md:items-end">
          <span className="text-[10px] font-bold tracking-[0.17em] text-halo-orange-300">
            DESIGNED AS A DAILY EXPERIENCE
          </span>

          <p className="max-w-[500px] text-2xl leading-relaxed font-medium tracking-[-0.035em]">
            관계는 한 번의 큰 행동보다
            <br />
            반복할 수 있는 작은 경험으로
            이어집니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3">
          {companyStats.map(
            (stat, index) => (
              <article
                key={stat.unit}
                className={[
                  "min-h-[230px] border-white/15 py-11 md:min-h-[280px] md:px-10 md:py-14",
                  index !==
                  companyStats.length - 1
                    ? "border-b md:border-r md:border-b-0"
                    : "",
                  index === 0 ? "md:pl-0" : "",
                ].join(" ")}
              >
                <div className="flex items-end gap-3">
                  <strong className="text-[78px] leading-[0.88] font-medium tracking-[-0.07em] md:text-[105px]">
                    {stat.value}
                  </strong>

                  <span className="pb-2 text-[11px] font-semibold tracking-[0.08em] text-halo-orange-300">
                    {stat.unit}
                  </span>
                </div>

                <p className="mt-8 text-sm text-white/50">
                  {stat.label}
                </p>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  return (
    <section className="bg-halo-cream-50 py-28 md:py-44">
      <div className="mx-auto w-[min(calc(100%-36px),1240px)] md:w-[min(calc(100%-48px),1240px)]">
        <SectionHeading
          eyebrow="OUR PRINCIPLES"
          title={
            <>
              좋은 관계를 위한 경험은
              <br />
              다르게 설계되어야 합니다.
            </>
          }
          description="HALO는 기능의 수보다 사용자가 관계를 이어갈 수 있는 방식과 속도를 먼저 생각합니다."
        />

        <div className="mt-16 border-t border-halo-brown-900/15 md:mt-24">
          {brandPrinciples.map(
            (principle) => (
              <article
                key={principle.number}
                className="group grid gap-4 border-b border-halo-brown-900/15 py-9 md:grid-cols-[60px_minmax(240px,0.8fr)_minmax(300px,1fr)_52px] md:items-center md:gap-8"
              >
                <span className="text-xs font-bold text-halo-orange-600">
                  {principle.number}
                </span>

                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-halo-brown-900">
                  {principle.title}
                </h3>

                <p className="max-w-[500px] text-[15px] leading-7 text-halo-brown-500">
                  {principle.description}
                </p>

                <div className="hidden size-12 items-center justify-center rounded-full border border-halo-brown-900/15 transition group-hover:translate-x-1 group-hover:border-halo-orange-500 group-hover:bg-halo-orange-500 group-hover:text-white md:flex">
                  <ArrowIcon />
                </div>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function TeamMemberCard({
  member,
  groupCode,
}) {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.035] shadow-[0_28px_60px_rgba(20,8,3,0.18)] transition duration-300 hover:-translate-y-2 hover:border-halo-orange-300/40 hover:bg-halo-orange-500/[0.07]">
      <div className="relative aspect-[4/4.7] overflow-hidden bg-halo-brown-800">
        <ImageWithFallback
          src={member.image}
          alt={`${member.name} 프로필`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
        />

        <div className="halo-image-overlay absolute inset-0" />

        <div className="absolute top-5 right-5 left-5 flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-[0.16em] text-white/80">
            {groupCode}
          </span>

          {member.isLead && (
            <span className="rounded-full border border-white/35 bg-halo-brown-950/60 px-3 py-2 text-[9px] font-bold text-white backdrop-blur-md">
              {member.position}
            </span>
          )}
        </div>

        <span className="absolute right-6 bottom-5 left-6 text-[10px] font-semibold tracking-[0.08em] text-white/65">
          {member.englishName}
        </span>
      </div>

      <div className="p-7 md:p-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h4 className="text-[31px] leading-tight font-bold tracking-[-0.045em] text-white md:text-[34px]">
              {member.name}
            </h4>

            <p className="mt-2 text-[15px] font-medium text-halo-orange-300">
              {member.role}
            </p>
          </div>

          <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition group-hover:translate-x-1 group-hover:border-halo-orange-500 group-hover:bg-halo-orange-500 group-hover:text-white">
            <ArrowIcon />
          </div>
        </div>

        <p className="mt-6 min-h-[84px] text-base leading-7 text-white/62">
          {member.description}
        </p>
      </div>
    </article>
  );
}

function TeamSection() {
  return (
    <section
      id="team"
      className="halo-team-surface py-28 text-white md:py-44"
    >
      <div className="mx-auto w-[min(calc(100%-36px),1240px)] md:w-[min(calc(100%-48px),1240px)]">
        <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-20">
          <SectionHeading
            eyebrow="TEAM HALO"
            title={
              <>
                하나의 경험을 만드는
                <br />
                서로 다른 전문성
              </>
            }
            description="기획과 디자인, Android와 Spring Boot가 HALO의 경험을 만들어갑니다."
            light
          />

          <p className="text-base leading-8 text-white/60">
            각 파트의 역할을 분리하되, <br></br>서비스의
            기준과 사용자가 경험하는 흐름은 함께
            설계합니다.
          </p>
        </div>

        <div className="mt-20 md:mt-28">
          {teamGroups.map(
            (group, groupIndex) => (
              <section
                key={group.id}
                className="border-t border-white/15 py-16 first:pt-16 last:pb-0 md:py-20"
              >
                <div className="mb-11 grid gap-5 md:grid-cols-[60px_220px_1fr] md:gap-8">
                  <span className="pt-1 text-xs font-bold text-halo-orange-300">
                    {String(
                      groupIndex + 1,
                    ).padStart(2, "0")}
                  </span>

                  <div>
                    <span className="text-[9px] font-bold tracking-[0.18em] text-halo-orange-500">
                      {group.code}
                    </span>

                    <h3 className="mt-2 text-[35px] font-semibold tracking-[-0.045em]">
                      {group.title}
                    </h3>
                  </div>

                  <p className="max-w-[580px] text-base leading-8 text-white/57">
                    {group.description}
                  </p>
                </div>

                <div
                  className={[
                    "grid gap-6",
                    group.members.length === 1
                      ? "md:grid-cols-[minmax(300px,420px)]"
                      : "",
                    group.members.length === 2
                      ? "md:grid-cols-2 xl:grid-cols-[repeat(2,minmax(300px,420px))]"
                      : "",
                    group.members.length === 3
                      ? "md:grid-cols-2 xl:grid-cols-3"
                      : "",
                    group.members.length >= 4
                      ? "md:grid-cols-2 xl:grid-cols-4"
                      : "",
                  ].join(" ")}
                >
                  {group.members.map(
                    (member) => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        groupCode={group.code}
                      />
                    ),
                  )}
                </div>
              </section>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function FinalSection() {
  return (
    <section className="halo-final-surface relative overflow-hidden py-32 text-center text-white md:py-48">

      <div className="relative z-10 mx-auto flex w-[min(calc(100%-36px),900px)] flex-col items-center">
        <span className="text-[10px] font-bold tracking-[0.2em] text-halo-orange-300">
          WE DESIGN THE NEXT HELLO
        </span>

        <h2 className="mt-8 text-[46px] leading-[1.16] font-medium tracking-[-0.06em] md:text-[70px] xl:text-[84px]">
          열 번의 안녕이
          <br />
          <strong className="font-bold">
            한 권의 이야기가 될 때까지.
          </strong>
        </h2>

        <p className="mt-8 max-w-[620px] text-base leading-8 text-white/65">
          Team HALO는 사람과 사람 사이의 관계가
          조금 더 자연스럽게 이어질 수 있는 경험을
          만듭니다.
        </p>

        <a
          href="https://github.com/HALO-UMC"
          target="_blank"
          rel="noreferrer"
          className="mt-11 inline-flex min-h-14 items-center gap-7 rounded-full bg-white px-7 text-sm font-bold text-halo-orange-700 shadow-halo transition hover:-translate-y-1"
        >
          Visit our GitHub
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

function LegalPage({ documentKey }) {
  const document = legalDocuments[documentKey];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [documentKey]);

  if (!document) {
    return <Navigate to="/terms" replace />;
  }

  return (
    <main className="min-h-screen bg-halo-cream-100 pt-[76px] md:pt-[88px]">
      <section className="halo-light-surface border-b border-halo-brown-900/10 py-20 md:py-28">
        <div className="mx-auto w-[min(calc(100%-36px),1080px)] md:w-[min(calc(100%-48px),1080px)]">
          <span className="text-[11px] font-bold tracking-[0.18em] text-halo-orange-600">
            {document.eyebrow}
          </span>

          <h1 className="mt-5 text-[43px] font-bold tracking-[-0.055em] text-halo-brown-900 md:text-[64px]">
            {document.title}
          </h1>

          <p className="mt-5 max-w-[700px] text-base leading-8 text-halo-brown-500">
            {document.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-xs text-halo-brown-500">
            <span>
              공고일자:{" "}
              {document.announcedAt}
            </span>
            <span>
              시행일자:{" "}
              {document.effectiveAt}
            </span>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto w-[min(calc(100%-36px),1080px)] md:w-[min(calc(100%-48px),1080px)]">
          <div className="hide-scrollbar sticky top-[76px] z-20 overflow-x-auto border-b border-halo-brown-900/10 bg-halo-cream-100/95 py-4 backdrop-blur-xl md:top-[88px]">
            <div className="flex min-w-max gap-2">
              {legalTabs.map((tab) => (
                <Link
                  key={tab.key}
                  to={tab.path}
                  className={[
                    "rounded-full px-5 py-3 text-sm font-semibold transition",
                    tab.key === documentKey
                      ? "bg-halo-orange-500 text-white shadow-halo-sm"
                      : "border border-halo-brown-900/10 bg-white text-halo-brown-600 hover:border-halo-orange-300 hover:text-halo-orange-600",
                  ].join(" ")}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-halo-brown-900/10 bg-white p-6 shadow-halo-sm md:p-12">
            <div className="mb-12 rounded-2xl border border-halo-orange-200 bg-halo-orange-50 p-5 text-sm leading-7 text-halo-brown-600">
              본 문서는 HALO MVP 기준 약관
              초안입니다. 실제 배포 전 회사명,
              대표자, 사업자 정보, 고객센터,
              개인정보 보관 기간 및 외부 처리업체
              정보를 확정한 뒤 검토가 필요합니다.
            </div>

            <div className="divide-y divide-halo-brown-900/10">
              {document.sections.map(
                (section) => (
                  <article
                    key={section.title}
                    className="py-10 first:pt-0 last:pb-0"
                  >
                    <h2 className="text-[24px] font-bold tracking-[-0.035em] text-halo-brown-900 md:text-[28px]">
                      {section.title}
                    </h2>

                    <div className="mt-6 space-y-5">
                      {section.blocks.map(
                        (block, index) => {
                          if (
                            block.type ===
                            "paragraph"
                          ) {
                            return (
                              <p
                                key={`${section.title}-${index}`}
                                className="text-[15px] leading-8 text-halo-brown-600 md:text-base"
                              >
                                {block.text}
                              </p>
                            );
                          }

                          if (
                            block.type ===
                            "list"
                          ) {
                            return (
                              <ol
                                key={`${section.title}-${index}`}
                                className="space-y-3"
                              >
                                {block.items.map(
                                  (
                                    item,
                                    itemIndex,
                                  ) => (
                                    <li
                                      key={item}
                                      className="grid grid-cols-[28px_1fr] gap-3 text-[15px] leading-8 text-halo-brown-600 md:text-base"
                                    >
                                      <span className="flex size-7 items-center justify-center rounded-full bg-halo-orange-100 text-[11px] font-bold text-halo-orange-700">
                                        {itemIndex +
                                          1}
                                      </span>

                                      <span>
                                        {item}
                                      </span>
                                    </li>
                                  ),
                                )}
                              </ol>
                            );
                          }

                          if (
                            block.type ===
                            "notice"
                          ) {
                            return (
                              <div
                                key={`${section.title}-${index}`}
                                className="rounded-2xl border-l-4 border-halo-orange-500 bg-halo-orange-50 px-5 py-4 text-[15px] leading-7 text-halo-brown-700"
                              >
                                {block.text}
                              </div>
                            );
                          }

                          return null;
                        },
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Footer() {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="bg-halo-brown-950 py-16 text-white">
      <div className="mx-auto w-[min(calc(100%-36px),1240px)] md:w-[min(calc(100%-48px),1240px)]">
        <div className="grid gap-12 md:grid-cols-[1fr_auto_1fr]">
          <div>
            <Logo light />
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm text-white/60">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={`/${item.href}`}
                className="transition hover:text-halo-orange-300"
              >
                {item.label}
              </a>
            ))}

            <Link
              to="/terms"
              className="transition hover:text-halo-orange-300"
            >
              이용약관
            </Link>

            <Link
              to="/privacy"
              className="transition hover:text-halo-orange-300"
            >
              개인정보 처리방침
            </Link>

            <Link
              to="/content-policy"
              className="transition hover:text-halo-orange-300"
            >
              콘텐츠 안내
            </Link>

            <Link
              to="/marketing"
              className="transition hover:text-halo-orange-300"
            >
              마케팅 동의
            </Link>
          </nav>

          <div className="md:justify-self-end">
            <span className="text-[9px] font-bold tracking-[0.17em] text-halo-orange-300">
              OUR PURPOSE
            </span>

            <p className="mt-3 text-lg leading-7 font-semibold">
              매일 한 장,
              <br />
              부모님과 이어가는 따뜻한 안녕
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-6 text-[9px] font-semibold tracking-[0.14em] text-white/30 md:flex-row md:justify-between">
          <span>
            © {currentYear} TEAM HALO. ALL
            RIGHTS RESERVED.
          </span>

          <span>
            PRODUCT · DESIGN · TECHNOLOGY
          </span>
        </div>
      </div>
    </footer>
  );
}

function AppRoutes() {
  return (
    <>
      <Header />

      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/terms"
          element={
            <LegalPage documentKey="terms" />
          }
        />

        <Route
          path="/privacy"
          element={
            <LegalPage documentKey="privacy" />
          }
        />

        <Route
          path="/content-policy"
          element={
            <LegalPage documentKey="content" />
          }
        />

        <Route
          path="/marketing"
          element={
            <LegalPage documentKey="marketing" />
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;