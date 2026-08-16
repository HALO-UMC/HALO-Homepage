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

function StorybookIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5.5C4 4.672 4.672 4 5.5 4H9C10.657 4 12 5.343 12 7V20C12 18.343 10.657 17 9 17H4V5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M20 5.5C20 4.672 19.328 4 18.5 4H15C13.343 4 12 5.343 12 7V20C12 18.343 13.343 17 15 17H20V5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg
      width="25"
      height="28"
      viewBox="0 0 25 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.7 1.35C1.24 1.84 1 2.58 1 3.53V24.47C1 25.42 1.24 26.16 1.7 26.65L1.79 26.73L13.52 14.99V14.72L1.79 1.27L1.7 1.35Z"
        fill="#00D26A"
      />

      <path
        d="M17.43 18.91L13.52 14.99V14.72L17.44 10.8L17.53 10.85L22.17 13.49C23.5 14.24 23.5 15.47 22.17 16.23L17.53 18.86L17.43 18.91Z"
        fill="#FFCC00"
      />

      <path
        d="M17.53 18.86L13.52 14.86L1.7 26.65C2.43 27.43 3.65 27.52 5.03 26.74L17.53 19.65V18.86Z"
        fill="#FF3D4A"
      />

      <path
        d="M17.53 10.85L5.03 1.76C3.65 0.98 2.43 1.07 1.7 1.35L13.52 14.86L17.53 10.85Z"
        fill="#2F80ED"
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
  eager = false,
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
      loading={eager ? "eager" : "lazy"}
    />
  );
}

function SplashScreen() {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const secondStageTimer = window.setTimeout(() => {
      setStage(1);
    }, 1300);

    const fadeOutTimer = window.setTimeout(() => {
      setStage(2);
    }, 2400);

    const removeTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => {
      window.clearTimeout(secondStageTimer);
      window.clearTimeout(fadeOutTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <style>
        {`
          @keyframes haloSplashWiggle {
            0% {
              transform: rotate(-7deg);
            }

            50% {
              transform: rotate(7deg);
            }

            100% {
              transform: rotate(-7deg);
            }
          }
        `}
      </style>

      <div
        className={[
          "fixed inset-0 z-[9999] overflow-hidden bg-[#FF7B10]",
          "transition-opacity duration-[600ms] ease-out",
          stage === 2
            ? "pointer-events-none opacity-0"
            : "opacity-100",
        ].join(" ")}
        aria-hidden="true"
      >
        {/* FIRST SPLASH */}
        <div
          className={[
            "absolute inset-0 flex flex-col items-center justify-center",
            "transition-all duration-500 ease-out",
            stage === 0
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0",
          ].join(" ")}
        >
          <img
            src="/images/logo.png"
            alt=""
            draggable="false"
            className="h-[190px] w-auto max-w-[86vw] select-none object-contain md:h-[240px]"
            style={{
              animation:
                stage === 0
                  ? "haloSplashWiggle 520ms ease-in-out infinite"
                  : "none",
              transformOrigin: "50% 78%",
            }}
          />

          <p className="mt-7 text-[16px] font-semibold tracking-[-0.025em] text-white md:text-[18px]">
            익숙하지만 어려운, 안녕
          </p>
        </div>

        {/* SECOND SPLASH */}
        <div
          className={[
            "absolute inset-0 flex flex-col items-center justify-center",
            "transition-all duration-500 ease-out",
            stage === 1
              ? "translate-y-0 scale-100 opacity-100"
              : stage === 0
                ? "translate-y-3 scale-[0.98] opacity-0"
                : "-translate-y-1 scale-[0.99] opacity-0",
          ].join(" ")}
        >
          <img
            src="/images/logotypo.png"
            alt=""
            draggable="false"
            className="h-[76px] w-auto max-w-[80vw] select-none object-contain md:h-[94px]"
          />

          <p className="mt-7 text-center text-[15px] leading-6 font-medium tracking-[-0.025em] text-white md:text-[16px]">
            부모님과의 관계를
            <br />
            한 권의 이야기로
          </p>
        </div>
      </div>
    </>
  );
}

function Logo() {
  return (
    <Link
      to="/"
      className="inline-flex shrink-0 items-center"
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
  const [isScrolled, setIsScrolled] = useState(false);

  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const currentScrollY = window.scrollY;

    const previousBodyPosition =
      document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousBodyOverflow =
      document.body.style.overflow;
    const previousHtmlOverflow =
      document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";

    document.body.style.position = "fixed";
    document.body.style.top = `-${currentScrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow =
        previousHtmlOverflow;

      document.body.style.position =
        previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.body.style.overflow =
        previousBodyOverflow;

      window.scrollTo(0, currentScrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

  const getNavigationHref = (href) =>
    isHome ? href : `/${href}`;

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <header
        className={[
          "fixed top-0 left-0 z-[80] w-full border-b transition-all duration-300",
          isOpen
            ? "border-white/10 bg-[#19110E]"
            : isScrolled
              ? "border-halo-brown-900/10 bg-halo-cream-50/90 shadow-halo-sm backdrop-blur-xl"
              : "border-transparent bg-transparent",
        ].join(" ")}
      >
        <div className="relative z-[90] mx-auto flex h-[76px] w-[min(calc(100%-36px),1360px)] items-center justify-between md:h-[88px] md:w-[min(calc(100%-48px),1360px)]">
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
            className={[
              "flex size-12 touch-manipulation items-center justify-center rounded-full border transition md:hidden",
              isOpen
                ? "border-white/20 bg-white/10 text-white"
                : "border-halo-brown-900/15 bg-white/40 text-halo-brown-900",
            ].join(" ")}
            aria-label={
              isOpen ? "메뉴 닫기" : "메뉴 열기"
            }
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => {
              setIsOpen((previous) => !previous);
            }}
          >
            {isOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      {isOpen && (
        <div
          id="mobile-navigation"
          className="fixed inset-0 z-[70] h-[100dvh] overflow-y-auto bg-[#19110E] pt-[76px] text-white md:hidden"
        >
          <div className="flex min-h-[calc(100dvh-76px)] flex-col justify-between px-6 py-8">
            <nav
              className="flex flex-col"
              aria-label="모바일 메뉴"
            >
              {navigationItems.map(
                (item, index) => (
                  <a
                    key={item.href}
                    href={getNavigationHref(item.href)}
                    onClick={closeMenu}
                    className="flex items-center gap-5 border-b border-white/15 py-5 text-[38px] font-semibold tracking-[-0.05em] text-white transition active:text-halo-orange-300"
                  >
                    <span className="text-[10px] tracking-[0.14em] text-halo-orange-300">
                      {String(index + 1).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    {item.label}
                  </a>
                ),
              )}

              <Link
                to="/terms"
                onClick={closeMenu}
                className="flex items-center gap-5 border-b border-white/15 py-5 text-[38px] font-semibold tracking-[-0.05em] text-white transition active:text-halo-orange-300"
              >
                <span className="text-[10px] tracking-[0.14em] text-halo-orange-300">
                  05
                </span>

                약관
              </Link>
            </nav>

            <div className="mt-16 border-t border-white/10 pt-8">
              <p className="text-base leading-7 text-white/45">
                관계가 이어지는 방식을
                <br />
                설계합니다.
              </p>

              <div className="mt-6 flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-white/30">
                <span>TEAM HALO</span>
                <span className="h-px w-8 bg-white/20" />
                <span>2026</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}) {
  return (
    <div className="max-w-[720px]">
      <span
        className={[
          "mb-5 block text-[10px] font-bold tracking-[0.2em]",
          light
            ? "text-halo-orange-300"
            : "text-halo-orange-600",
        ].join(" ")}
      >
        {eyebrow}
      </span>

      <h2
        className={[
          "text-[40px] leading-[1.14] font-semibold tracking-[-0.055em] md:text-[58px] xl:text-[68px]",
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
            "mt-6 max-w-[600px] text-[15px] leading-8 tracking-[-0.018em] md:text-[17px]",
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
      <TeamSection />
      <FinalSection />
    </>
  );
}

function HeroSection() {
  return (
    <section
      id="top"
      className="halo-light-surface relative min-h-screen overflow-hidden pt-[128px] pb-20 md:pt-[150px] md:pb-28"
    >
      <div className="pointer-events-none absolute top-[18%] left-[-12%] size-[420px] rounded-full bg-halo-orange-200/20 blur-[100px]" />

      <div className="pointer-events-none absolute right-[-8%] bottom-[-5%] size-[520px] rounded-full bg-halo-orange-300/15 blur-[120px]" />

      <div className="relative mx-auto grid w-[min(calc(100%-36px),1320px)] items-center gap-16 md:w-[min(calc(100%-48px),1320px)] xl:grid-cols-[0.83fr_1.17fr] xl:gap-12">
        {/* LEFT CONTENT */}
        <div className="relative z-20">
          <div className="mb-8 flex items-center gap-4">
            <span className="text-[10px] font-bold tracking-[0.2em] text-halo-orange-700">
              STORYBOOK APP
            </span>
          </div>

          <h1 className="max-w-[700px] text-[49px] leading-[1.06] font-semibold tracking-[-0.067em] text-halo-brown-950 md:text-[60px] xl:text-[65px]">
            부모님과의 이야기를,
            <br />

            <span className="text-halo-orange-500">
              하루 한 장씩.
            </span>
          </h1>

          <p className="mt-8 max-w-[570px] text-[16px] leading-8 tracking-[-0.02em] text-halo-brown-500 md:text-[18px]">
            HALO는 부모님과 나누기 어려웠던 이야기를
            하루 한 장의 스토리로 바꾸고,
            함께한 순간을 우리 가족만의 기록으로 남깁니다.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href="YOUR_PLAY_STORE_URL"
              target="_blank"
              rel="noreferrer"
              aria-label="Google Play에서 HALO 다운로드"
              className="group inline-flex min-h-[62px] w-fit shrink-0 items-center gap-4 rounded-[16px] border border-black/10 bg-[#111111] px-6 text-left text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:bg-black hover:shadow-[0_24px_55px_rgba(0,0,0,0.26)]"
            >
              <GooglePlayIcon />

              <span className="flex flex-col">
                <span className="text-[9px] leading-none font-medium tracking-[0.06em] text-white/65">
                  GET IT ON
                </span>

                <span className="mt-1 text-[18px] leading-none font-semibold tracking-[-0.03em] text-white">
                  Google Play
                </span>
              </span>
            </a>

            <a
              href="#storybook"
              aria-label="HALO 스토리북 둘러보기"
              className="group inline-flex min-h-[62px] w-fit shrink-0 items-center gap-4 rounded-[16px] border border-halo-brown-900/10 bg-white/80 px-5 text-left text-halo-brown-900 shadow-[0_14px_38px_rgba(69,41,24,0.10)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-halo-orange-300 hover:bg-white hover:shadow-[0_20px_48px_rgba(69,41,24,0.16)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-halo-orange-100 text-halo-orange-600 transition duration-300 group-hover:bg-halo-orange-500 group-hover:text-white">
                <StorybookIcon />
              </span>

              <span className="flex flex-col">
                <span className="text-[9px] leading-none font-bold tracking-[0.12em] text-halo-brown-400">
                  EXPLORE
                </span>

                <span className="mt-1.5 text-[17px] leading-none font-semibold tracking-[-0.03em] text-halo-brown-900">
                  스토리북 둘러보기
                </span>
              </span>
            </a>
          </div>

          {/* STATS */}
          <div className="mt-16 flex items-center gap-5 border-t border-halo-brown-900/10 pt-7">
            <div>
              <strong className="block text-xl font-bold tracking-[-0.04em] text-halo-brown-900">
                10 Themes
              </strong>

              <span className="mt-1 block text-xs text-halo-brown-400">
                관계마다 다른 이야기
              </span>
            </div>

            <span className="h-10 w-px bg-halo-brown-900/10" />

            <div>
              <strong className="block text-xl font-bold tracking-[-0.04em] text-halo-brown-900">
                1 Page
              </strong>

              <span className="mt-1 block text-xs text-halo-brown-400">
                하루 한 장의 경험
              </span>
            </div>

            <span className="h-10 w-px bg-halo-brown-900/10" />

            <div>
              <strong className="block text-xl font-bold tracking-[-0.04em] text-halo-brown-900">
                1 Story
              </strong>

              <span className="mt-1 block text-xs text-halo-brown-400">
                우리 가족의 기록
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT VISUAL */}
        <div className="relative mx-auto h-[620px] w-full max-w-[720px] md:h-[770px]">
          {/* LEFT CARD */}
          <div className="absolute top-[8%] left-[-1%] z-10 w-[36%] -rotate-[12deg] overflow-hidden rounded-[28px] bg-white p-[4px] shadow-[0_28px_70px_rgba(34,26,21,0.14)] md:left-[-3%]">
            <ImageWithFallback
              src={heroImages.subTop}
              alt="HALO 스토리북 화면"
              className="aspect-[3/4.25] w-full rounded-[24px] object-cover"
              eager
            />
          </div>

          {/* MAIN METALLIC PHONE */}
          <div
            className="
              absolute top-0 left-1/2 z-30
              w-[49%] -translate-x-1/2
              rounded-[47px]
              bg-[linear-gradient(145deg,#f7f7f6_0%,#a4a3a1_18%,#eeeeec_38%,#777674_60%,#d9d8d5_82%,#999896_100%)]
              p-[3px]
              shadow-[0_35px_85px_rgba(25,20,17,0.24)]
              md:w-[50%]
            "
          >
            <div className="relative aspect-[9/20.4] overflow-hidden rounded-[44px] bg-[#090909] p-[4px]">
              {/* Dynamic Island */}
              <div className="absolute top-[11px] left-1/2 z-30 h-[18px] w-[70px] -translate-x-1/2 rounded-full bg-[#090909] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />

              <ImageWithFallback
                src={productImages.main}
                alt="HALO 앱 메인 화면"
                className="h-full w-full rounded-[40px] object-cover"
                eager
              />

              {/* subtle internal highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-[44px] ring-1 ring-inset ring-white/10" />
            </div>

            {/* LEFT SIDE BUTTONS */}
            <span className="absolute top-[108px] -left-[2px] h-[46px] w-[2px] rounded-l-full bg-[#858482]" />

            <span className="absolute top-[170px] -left-[2px] h-[72px] w-[2px] rounded-l-full bg-[#858482]" />

            {/* RIGHT SIDE BUTTON */}
            <span className="absolute top-[148px] -right-[2px] h-[90px] w-[2px] rounded-r-full bg-[#72716f]" />
          </div>

          {/* RIGHT CARD */}
          <div className="absolute top-[20%] right-[-2%] z-20 w-[35%] rotate-[13deg] overflow-hidden rounded-[27px] bg-white p-[4px] shadow-[0_28px_70px_rgba(34,26,21,0.14)] md:right-[-4%]">
            <ImageWithFallback
              src={heroImages.subBottom}
              alt="HALO 기록 화면"
              className="aspect-[3/4.25] w-full rounded-[23px] object-cover"
              eager
            />
          </div>

          {/* TODAY CARD */}
          <div className="absolute right-[2%] bottom-[9%] z-40 max-w-[245px] rounded-[22px] border border-halo-brown-900/8 bg-white/94 p-5 shadow-[0_16px_45px_rgba(35,26,20,0.10)] backdrop-blur-xl md:p-6">
            <span className="text-[9px] font-bold tracking-[0.18em] text-halo-orange-600">
              TODAY&apos;S PAGE
            </span>

            <p className="mt-3 text-lg leading-7 font-semibold tracking-[-0.035em] text-halo-brown-900">
              오늘 부모님과
              <br />
              어떤 이야기를 나눴나요?
            </p>

            <div className="mt-5 flex items-center gap-2">
              <span className="size-2 rounded-full bg-halo-orange-500" />

              <span className="text-xs font-medium text-halo-brown-400">
                하루에 한 장씩
              </span>
            </div>
          </div>

          {/* BRAND SIGNATURE */}
          <div className="absolute bottom-[3%] left-[1%] z-40 rounded-[18px] border border-halo-brown-900/8 bg-white/94 px-5 py-4 shadow-[0_14px_38px_rgba(35,26,20,0.08)] backdrop-blur-xl">
            <span className="block text-[8px] font-bold tracking-[0.18em] text-halo-orange-600">
              TEAM HALO
            </span>

            <strong className="mt-1.5 block text-[14px] leading-[1.35] font-semibold tracking-[-0.025em] text-halo-brown-900">
              Every relationship
              <br />
              has a story.
            </strong>
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
      className="overflow-hidden bg-halo-brown-950 py-28 text-white md:py-44"
    >
      <div className="mx-auto w-[min(calc(100%-36px),1240px)] md:w-[min(calc(100%-48px),1240px)]">
        <div className="flex items-center gap-6 text-[10px] font-bold tracking-[0.2em] text-halo-orange-300">
          WHY HALO
          <span className="h-px w-24 bg-halo-orange-300/40" />
        </div>

        <div className="mt-12 grid gap-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <p className="text-[42px] leading-[1.16] font-medium tracking-[-0.06em] md:text-[45px] xl:text-[60px]">
            가까이 지내왔지만,
            <br></br>
            <strong className="font-semibold text-halo-orange-300">
              아직 모르는 이야기가 많습니다.
            </strong>
          </p>

          <div className="border-l border-white/15 pl-7">
            <p className="text-base leading-8 text-white/58">
              마음이 없어서가 아니라,<br></br>
              어디서부터 어떻게 시작해야 할지
              몰랐기 때문일 수 있습니다.
            </p>

            <p className="mt-7 text-xl leading-8 font-medium tracking-[-0.03em] text-white">
              그래서 HALO는 관계의 시작을
              <br />
              ‘하루 한 장’으로 만들었습니다.
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-[30px] border border-white/10 bg-white/10 md:grid-cols-3">
          <article className="bg-halo-brown-950 p-8 md:p-10">
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/35">
              BEFORE
            </span>

            <strong className="mt-8 block text-2xl font-semibold tracking-[-0.04em]">
              무슨 말을 해야 할지
              <br />
              모르겠는 순간
            </strong>
          </article>

          <article className="bg-halo-brown-950 p-8 md:p-10">
            <span className="text-[10px] font-bold tracking-[0.18em] text-halo-orange-300">
              HALO
            </span>

            <strong className="mt-8 block text-2xl font-semibold tracking-[-0.04em]">
              오늘 할 수 있는
              <br />
              하나의 이야기
            </strong>
          </article>

          <article className="bg-halo-brown-950 p-8 md:p-10">
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/35">
              AFTER
            </span>

            <strong className="mt-8 block text-2xl font-semibold tracking-[-0.04em]">
              함께한 시간이 남는
              <br />
              우리 가족의 기록
            </strong>
          </article>
        </div>
      </div>
    </section>
  );
}

function ProductSection() {
  return (
    <section
      id="product"
      className="bg-halo-cream-50 py-28 md:py-44"
    >
      <div className="mx-auto w-[min(calc(100%-36px),1240px)] md:w-[min(calc(100%-48px),1240px)]">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <SectionHeading
            eyebrow="HOW HALO WORKS"
            title={
              <>
                마음을,
                <br />
                오늘 할 수 있는 행동으로.
              </>
            }
            description="HALO는 추천에서 시작해 하루 한 장의 경험을 거쳐, 함께한 시간을 다시 꺼내볼 수 있는 기록으로 완성합니다."
          />

          <p className="max-w-[450px] text-[15px] leading-8 text-halo-brown-500 lg:justify-self-end">
            한꺼번에 관계를 바꾸려 하지 않습니다.
            사용자의 현재 관계와 속도에 맞춰
            작은 행동을 반복할 수 있도록 설계했습니다.
          </p>
        </div>

        <div className="mt-20 space-y-6 md:mt-28">
          {productFeatures.map((feature, index) => {
            const isReverse = index % 2 === 1;

            return (
              <article
                key={feature.number}
                className="overflow-hidden rounded-[34px] border border-halo-brown-900/10 bg-halo-cream-100"
              >
                <div
                  className={[
                    "grid min-h-[560px] lg:grid-cols-2",
                    isReverse ? "lg:[&>*:first-child]:order-2" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col justify-between p-8 md:p-12 lg:p-14">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-[0.18em] text-halo-orange-600">
                          {feature.eyebrow}
                        </span>

                        <span className="text-sm font-bold text-halo-brown-300">
                          {feature.number}
                        </span>
                      </div>

                      <h3 className="mt-10 text-[38px] leading-[1.15] font-semibold tracking-[-0.055em] text-halo-brown-950 md:text-[50px]">
                        {feature.title}
                      </h3>

                      <p className="mt-6 max-w-[470px] text-[15px] leading-8 text-halo-brown-500 md:text-base">
                        {feature.description}
                      </p>
                    </div>

                    <div className="mt-12 flex items-center gap-3 text-xs font-semibold text-halo-brown-400">
                      <span className="flex size-8 items-center justify-center rounded-full bg-halo-orange-500 text-white">
                        {index + 1}
                      </span>

                      <span>
                        {index === 0 &&
                          "관계에 맞는 시작점 찾기"}

                        {index === 1 &&
                          "부담 없이 하루 한 장 채우기"}

                        {index === 2 &&
                          "함께한 시간을 다시 꺼내보기"}

                        {index === 3 &&
                          "완성한 이야기를 하나씩 모아보기"}
                      </span>
                    </div>
                  </div>

                  <ProductVisual index={index} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductVisual({ index }) {
  if (index === 0) {
    return (
      <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-[#111111] p-8 md:min-h-[560px] md:p-10">
        {/* NUMBER */}
        <span className="absolute top-7 left-7 text-[11px] font-semibold tracking-[0.14em] text-white/35">
          01
        </span>

        {/* MAIN RECOMMENDATION UI */}
        <div className="relative z-10 w-full max-w-[390px] rounded-[26px] border border-white/10 bg-[#1A1A1A] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <span className="text-[9px] font-bold tracking-[0.18em] text-halo-orange-300">
            RECOMMENDED FOR YOU
          </span>

          <h4 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-white">
            지금 시작하기 좋은
            <br />
            두 권의 스토리북
          </h4>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {storybooks.slice(0, 2).map((storybook) => (
              <div
                key={storybook.id}
                className="overflow-hidden rounded-[18px] bg-[#242424]"
              >
                <ImageWithFallback
                  src={storybook.image}
                  alt={storybook.title}
                  className="aspect-[3/4] w-full object-cover"
                />

                <div className="p-3">
                  <strong className="text-sm font-semibold text-white">
                    {storybook.title}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-[#111111] p-8 md:min-h-[560px] md:p-10">
        {/* BACKGROUND DETAIL */}
        <div className="pointer-events-none absolute top-[-120px] right-[-100px] size-[320px] rounded-full bg-halo-orange-500/10 blur-[100px]" />

        <div className="pointer-events-none absolute bottom-[-140px] left-[-120px] size-[340px] rounded-full bg-white/[0.04] blur-[100px]" />

        {/* MAIN PHONE */}
        <div className="relative z-10 w-[225px] rounded-[42px] bg-[linear-gradient(145deg,#f5f5f3_0%,#8e8d8a_18%,#ecebe8_40%,#666563_62%,#d4d3d0_82%,#888784_100%)] p-[3px] shadow-[0_32px_80px_rgba(0,0,0,0.5)] md:w-[255px]">
          <div className="relative aspect-[9/20.3] overflow-hidden rounded-[39px] bg-black p-[4px]">
            {/* Dynamic Island */}
            <div className="absolute top-[10px] left-1/2 z-30 h-[17px] w-[66px] -translate-x-1/2 rounded-full bg-black" />

            <ImageWithFallback
              src={productImages.main}
              alt="HALO 하루 한 장 화면"
              className="h-full w-full rounded-[35px] object-cover"
            />

            <div className="pointer-events-none absolute inset-0 rounded-[39px] ring-1 ring-inset ring-white/10" />
          </div>
        </div>

        {/* DETAIL IMAGE */}
        <div className="absolute right-[6%] bottom-[8%] z-20 w-[175px] md:right-[7%] md:w-[190px]">
          <ImageWithFallback
            src={productImages.detail}
            alt="HALO 하루 한 장 상세 화면"
            className="mx-auto w-[88%] object-contain"
          />

          <span className="mt-3 block text-center text-[8px] font-bold tracking-[0.17em] text-white/45">
            ONE PAGE A DAY
          </span>
        </div>

        {/* NUMBER */}
        <span className="absolute top-7 left-7 text-[11px] font-semibold tracking-[0.14em] text-white/35">
          02
        </span>
      </div>
    );
  }

  if (index === 3) {
    return (
      <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-[#111111] p-5 md:min-h-[560px] md:p-7">
        {/* NUMBER */}
        <span className="absolute top-7 left-7 z-20 text-[11px] font-semibold tracking-[0.14em] text-white/35">
          04
        </span>

        {/* MAIN THEME IMAGE */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <ImageWithFallback
            src={productImages.theme}
            alt="HALO 테마함"
            className="max-h-[510px] w-[94%] object-contain md:max-h-[545px] md:w-[96%]"
          />
        </div>

        {/* LABEL */}
        <span className="absolute right-7 bottom-7 z-20 text-[9px] font-bold tracking-[0.17em] text-white/45">
          THEME COLLECTION
        </span>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-[#111111] p-8 md:min-h-[560px] md:p-10">
        {/* NUMBER */}
        <span className="absolute top-7 left-7 z-20 text-[11px] font-semibold tracking-[0.14em] text-white/35">
          03
        </span>

        {/* METALLIC PHONE */}
        <div
          className="
          relative z-10
          w-[230px]
          rounded-[44px]
          bg-[linear-gradient(145deg,#f7f7f6_0%,#a4a3a1_18%,#eeeeec_38%,#777674_60%,#d9d8d5_82%,#999896_100%)]
          p-[3px]
          shadow-[0_34px_85px_rgba(0,0,0,0.50)]
          md:w-[260px]
        "
        >
          <div className="relative aspect-[9/20.4] overflow-hidden rounded-[41px] bg-[#090909] p-[4px]">
            {/* DYNAMIC ISLAND */}
            <div className="absolute top-[11px] left-1/2 z-30 h-[18px] w-[68px] -translate-x-1/2 rounded-full bg-[#090909] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />

            {/* CALENDAR SCREEN */}
            <ImageWithFallback
              src={productImages.calendar}
              alt="HALO 기록 캘린더 화면"
              className="h-full w-full rounded-[37px] object-cover"
            />

            {/* INNER HIGHLIGHT */}
            <div className="pointer-events-none absolute inset-0 rounded-[41px] ring-1 ring-inset ring-white/10" />
          </div>

          {/* LEFT SIDE BUTTONS */}
          <span className="absolute top-[108px] -left-[2px] h-[44px] w-[2px] rounded-l-full bg-[#858482]" />

          <span className="absolute top-[168px] -left-[2px] h-[68px] w-[2px] rounded-l-full bg-[#858482]" />

          {/* RIGHT SIDE BUTTON */}
          <span className="absolute top-[146px] -right-[2px] h-[88px] w-[2px] rounded-r-full bg-[#72716f]" />
        </div>

        {/* LABEL */}
        <span className="absolute right-7 bottom-7 text-[9px] font-bold tracking-[0.17em] text-white/40">
          MONTHLY RECORD
        </span>
      </div>
    );
  }
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
              우리의 일상에는,
              <br />
              이미 많은 이야기가 있습니다.
            </>
          }
          description="누구나 공감할 수 있는 일상의 순간을 10개의 스토리북으로 담았습니다."
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
                HALO를 만드는 사람들
              </>
            }
            description="기획, 디자인, Android, Spring Boot가 함께 HALO를 만들고 있습니다."
            light
          />

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

        <h2 className="mt-8 text-[46px] leading-[1.16] font-medium tracking-[-0.06em] md:text-[70px] xl:text-[84px]">
          부모님께 건네는
          <br />
          <strong className="font-bold">
            다음 한 장을 시작해보세요.
          </strong>
        </h2>

        <p className="mt-8 max-w-[600px] text-base leading-8 text-white/60">
          열 번의 작은 이야기가 모이면
          우리 가족만의 한 권이 됩니다.
        </p>

        <div className="mt-11 flex flex-col gap-3 sm:flex-row">
          <a
            href="YOUR_PLAY_STORE_URL"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex min-h-[62px] items-center gap-4 rounded-[16px] border border-white/20 bg-[#111111] px-6 text-left text-white shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-black hover:shadow-[0_24px_55px_rgba(0,0,0,0.4)]"
          >
            <GooglePlayIcon />

            <span className="flex flex-col">
              <span className="text-[9px] leading-none font-medium tracking-[0.06em] text-white/65">
                GET IT ON
              </span>

              <span className="mt-1 text-[18px] leading-none font-semibold tracking-[-0.03em] text-white">
                Google Play
              </span>
            </span>
          </a>

          <a
            href="https://github.com/HALO-UMC"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[62px] items-center justify-center gap-7 rounded-[16px] border border-white/20 bg-white/5 px-7 text-sm font-bold text-white backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-halo-brown-900"
          >
            Team HALO GitHub
            <ArrowIcon />
          </a>
        </div>
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
              공고일자: {document.announcedAt}
            </span>

            <span>
              시행일자: {document.effectiveAt}
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
                                        {itemIndex + 1}
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
            <Logo />
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
      <SplashScreen />

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