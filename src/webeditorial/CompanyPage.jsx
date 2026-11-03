import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowIcon,
  CompanyWordmark,
  EditorialFooter,
  SectionLabel,
} from "./shared.jsx";
import usePageMeta from "./usePageMeta.js";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.umc.halo";
const SLIDE_INTERVAL = 5500;

// 실제 활동 사진이 저장소에 추가되면 이 목록에 확인된 설명과 초점 위치를 함께 등록합니다.
// 실제 사진은 public/images/company-activities/에 넣고 파일별 alt 및 초점 좌표를 등록합니다.
const activitySlides = [
  { src: "/images/company-activities/halo_activity1.jpg", alt: "HALO 팀 회의와 협업", caption: "팀 회의와 협업", objectPosition: "50% 55%", mobileObjectPosition: "50% 52%" },
  { src: "/images/company-activities/halo_activity2.jpg", alt: "HALO 팀의 데모데이 부스 활동", caption: "데모데이 부스 운영", objectPosition: "45% 50%", mobileObjectPosition: "48% 50%" },
  { src: "/images/company-activities/halo_activity3.jpg", alt: "가족에게 전할 메시지를 준비한 HALO 현장 활동", caption: "가족에게 전할 안녕을 준비한 현장", objectPosition: "50% 50%", mobileObjectPosition: "50% 50%" },
  { src: "/images/company-activities/halo_activity4.jpg", alt: "HALO 팀의 부산역 현장 활동", caption: "부산역 현장 활동", objectPosition: "50% 60%", mobileObjectPosition: "50% 58%" },
  { src: "/images/company-activities/halo_activity5.jpg", alt: "HALO 서비스 시연과 발표", caption: "서비스 시연과 발표", objectPosition: "50% 50%", mobileObjectPosition: "50% 48%" },
  { src: "/images/company-activities/halo_activity6.jpg", alt: "HALO 서비스 발표 현장", caption: "서비스 발표 현장", objectPosition: "50% 50%", mobileObjectPosition: "50% 48%" },
  { src: "/images/company-activities/halo_activity7.jpg", alt: "HALO 서비스와 팀 활동을 소개하는 현장", caption: "서비스와 팀 활동 소개", objectPosition: "50% 50%", mobileObjectPosition: "50% 50%" },
];

const navigation = [
  { label: "회사", href: "#company" },
  { label: "서비스", href: "#services" },
  { label: "제휴·협업", href: "#partnership" },
];

function CompanyHeader() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.documentElement.classList.add("editorial-menu-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.classList.remove("editorial-menu-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header className="company-header">
      <div className="editorial-container company-header__inner">
        <CompanyWordmark />

        <nav className="company-header__desktop" aria-label="기업 홈페이지 주요 메뉴">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="company-header__menu-button"
          aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isOpen}
          aria-controls="company-mobile-menu"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span />
          <span />
        </button>
      </div>

      <div
        id="company-mobile-menu"
        className={`company-mobile-menu${isOpen ? " is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <nav aria-label="기업 홈페이지 모바일 메뉴">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
              {item.label}
            </a>
          ))}
          <Link to="/kiri#kiri-preregister" onClick={() => setIsOpen(false)}>
            KIRI 사전 출시 알림
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SliderArrow({ direction }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.7" />
      <path
        d={direction === "previous" ? "m10 7-5 5 5 5" : "m14 7 5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayPauseIcon({ isPlaying }) {
  return isPlaying ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path d="M8 6v12M16 6v12" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path d="m9 6 9 6-9 6V6Z" fill="currentColor" />
    </svg>
  );
}

function CompanyActivitySlider({ slides }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const touchStartRef = useRef(null);
  const hasMultipleSlides = slides.length > 1;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
      if (mediaQuery.matches) {
        setIsPlaying(false);
      }
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const showSlide = useCallback(
    (index, manual = true) => {
      if (!slides.length) {
        return;
      }

      setActiveIndex((index + slides.length) % slides.length);
      if (manual) {
        setIsPlaying(false);
      }
    },
    [slides.length],
  );

  useEffect(() => {
    if (
      !hasMultipleSlides ||
      !isPlaying ||
      isHovered ||
      isFocusWithin ||
      !isPageVisible ||
      prefersReducedMotion
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [
    hasMultipleSlides,
    isFocusWithin,
    isHovered,
    isPageVisible,
    isPlaying,
    prefersReducedMotion,
    slides.length,
  ]);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsFocusWithin(false);
    }
  };

  const handleTouchStart = (event) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current || !hasMultipleSlides) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    showSlide(activeIndex + (deltaX < 0 ? 1 : -1));
  };

  return (
    <div
      className="company-activity-slider"
      aria-roledescription="carousel"
      aria-label="HALO 팀 활동 사진"
      data-slide-count={slides.length}
      data-playing={hasMultipleSlides && isPlaying && !prefersReducedMotion}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="company-activity-slider__viewport">
        {slides.length ? (
          slides.map((slide, index) => (
            <figure
              key={slide.src}
              className={`company-activity-slider__slide${index === activeIndex ? " is-active" : ""}`}
              aria-hidden={index !== activeIndex}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                style={{
                  "--activity-focus": slide.objectPosition ?? "50% 50%",
                  "--activity-focus-mobile":
                    slide.mobileObjectPosition ?? slide.objectPosition ?? "50% 50%",
                }}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
              {slide.caption && <figcaption>{slide.caption}</figcaption>}
            </figure>
          ))
        ) : (
          <div className="company-activity-slider__empty" role="status">
            <p>HALO의 활동 사진을 준비하고 있습니다.</p>
          </div>
        )}

        <div className="company-activity-slider__shade" aria-hidden="true" />

        <div className="company-hero__copy">
          <h1 id="company-hero-title">작은 안녕으로, 가족의 내일을 잇습니다.</h1>
          <p>
            HALO는 서로에게 건네는 인사와 평안한 일상을 뜻하는 ‘안녕’에서 시작합니다.
          </p>
          <a className="company-hero__cta" href="#services">
            서비스 만나보기
            <ArrowIcon />
          </a>
        </div>

        {hasMultipleSlides && (
          <div className="company-activity-slider__controls">
            <div className="company-activity-slider__buttons">
              <button
                type="button"
                aria-label="이전 활동 사진"
                onClick={() => showSlide(activeIndex - 1)}
              >
                <SliderArrow direction="previous" />
              </button>
              <button
                type="button"
                aria-label="다음 활동 사진"
                onClick={() => showSlide(activeIndex + 1)}
              >
                <SliderArrow direction="next" />
              </button>
              <button
                type="button"
                aria-label={isPlaying ? "자동 전환 일시정지" : "자동 전환 재생"}
                aria-pressed={!isPlaying}
                disabled={prefersReducedMotion}
                onClick={() => setIsPlaying((current) => !current)}
              >
                <PlayPauseIcon isPlaying={isPlaying && !prefersReducedMotion} />
              </button>
            </div>

            <div className="company-activity-slider__position" aria-label="활동 사진 선택">
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  className={index === activeIndex ? "is-active" : ""}
                  aria-label={`${index + 1}번째 활동 사진 보기`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => showSlide(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceActions({ service }) {
  if (service === "halo") {
    return (
      <div className="service-feature__actions">
        <Link className="service-feature__page-button" to="/halo">
          HALO 보러가기
          <ArrowIcon />
        </Link>
        <a
          className="service-feature__store-badge"
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Google Play에서 HALO 다운로드하기 (새 탭)"
        >
          <img
            src="/images/badges/google-play-ko.png"
            alt="Google Play에서 다운로드하기"
            width="646"
            height="250"
          />
        </a>
      </div>
    );
  }

  return (
    <div className="service-feature__actions">
      <Link className="service-feature__page-button service-feature__page-button--kiri" to="/kiri">
        KIRI 보러가기
        <ArrowIcon />
      </Link>
      <Link
        className="service-feature__release-button"
        to="/kiri#kiri-preregister"
        aria-label="KIRI 사전 출시 알림 준비 영역 보기"
      >
        사전 출시 알림 · 준비 중
        <ArrowIcon />
      </Link>
    </div>
  );
}

export default function CompanyPage() {
  usePageMeta({
    title: "HALO — 작은 안녕으로, 가족의 내일을 잇습니다",
    description:
      "HALO는 서로에게 건네는 인사와 평안한 일상을 뜻하는 안녕에서 시작해 가족의 소통과 연결을 위한 서비스를 만듭니다.",
    themeColor: "#fafafa",
  });

  return (
    <div className="editorial-shell company-page">
      <CompanyHeader />

      <main>
        <section
          id="company"
          className="company-hero"
          aria-labelledby="company-hero-title"
        >
          <div className="editorial-container">
            <CompanyActivitySlider slides={activitySlides} />
          </div>
        </section>

        <section id="services" className="company-services editorial-section">
          <div className="editorial-container">
            <div className="company-services__heading">
              <p>서비스</p>
              <h2>가족의 연결을 만드는 두 서비스</h2>
            </div>

            <article className="service-feature service-feature--halo">
              <div className="service-feature__copy">
                <img
                  className="service-feature__app-logo service-feature__app-logo--halo"
                  src="/logotypo.svg"
                  alt="HALO 앱"
                  width="918"
                  height="250"
                />
                <h3>매일 한 장, 부모님과 이어가는 따뜻한 안녕</h3>
                <p>
                  사진과 질문으로 부모님의 삶과 취향을 알아가고, 매일의 대화를 한 권의 가족
                  스토리북으로 기록합니다.
                </p>
                <ServiceActions service="halo" />
              </div>

              <Link className="service-feature__visual-link" to="/halo" aria-label="HALO 소개 보기">
                <figure className="service-feature__visual service-feature__visual--halo">
                  <img
                    src="/images/hero/hero-main.svg"
                    alt="HALO 가족 스토리북 화면"
                    loading="lazy"
                  />
                </figure>
              </Link>
            </article>

            <article className="service-feature service-feature--kiri">
              <Link className="service-feature__visual-link" to="/kiri" aria-label="KIRI 소개 보기">
                <div className="service-feature__visual service-feature__visual--kiri">
                  <img
                    className="service-feature__kiri-screen"
                    src="/images/kiri/kiri-home.png"
                    alt="KIRI 홈 화면"
                    loading="lazy"
                  />
                  <img
                    className="service-feature__kiri-mascot"
                    src="/images/kiri/kiri-mascot.svg"
                    alt=""
                    width="56"
                    height="56"
                  />
                </div>
              </Link>

              <div className="service-feature__copy">
                <img
                  className="service-feature__app-logo service-feature__app-logo--kiri"
                  src="/images/kiri/kiri-logo.svg"
                  alt="KIRI"
                  width="276"
                  height="100"
                />
                <h3>우리 가족만의 취향, 우리 가족만의 시간</h3>
                <p>
                  질문으로 서로를 알아가고, 가족에게 맞는 활동을 발견해 약속과 기록으로
                  이어갑니다.
                </p>
                <ServiceActions service="kiri" />
              </div>
            </article>
          </div>
        </section>

        <section id="partnership" className="company-partnership editorial-section">
          <div className="editorial-container">
            <SectionLabel>제휴·협업</SectionLabel>
            <div className="company-partnership__content">
              <div>
                <h2>
                  가족에게 새로운 경험을 건넬
                  <br />
                  장소와 브랜드를 기다립니다.
                </h2>
              </div>
              <div className="company-partnership__details">
                <p>
                  가족이 함께 방문하고 경험할 수 있는 장소·브랜드의 제휴, 서비스와 콘텐츠
                  협업을 이야기하고 싶습니다.
                </p>
                <a
                  className="editorial-button"
                  href="mailto:halo.official.app@gmail.com?subject=%5BHALO%5D%20%EC%A0%9C%ED%9C%B4%C2%B7%ED%98%91%EC%97%85%20%EB%AC%B8%EC%9D%98"
                >
                  제휴·협업 문의
                  <ArrowIcon />
                </a>
                <small>halo.official.app@gmail.com</small>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}
