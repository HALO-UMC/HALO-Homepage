// @ts-check

import { milestones, partners, partnershipStatuses } from "../data/companyData.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowIcon,
  CompanyWordmark,
  EditorialFooter,
} from "./shared.jsx";
import usePageMeta from "./usePageMeta.js";
import { PAGE_METADATA } from "./pageMetadata.js";
import { KIRI_STORE_URLS } from "./kiriConfig.js";
import {
  ANALYTICS_EVENT_NAMES,
  CTA_LOCATIONS,
  PAGE_NAMES,
  SERVICES,
  STORES,
} from "../analytics/config.js";
import { trackAnalyticsEvent } from "../analytics/index.js";

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
  { label: "파트너십", href: "#partners" },
  { label: "연혁", href: "#journey" },
  { label: "제휴·협업", href: "#partnership" },
];

export function CompanyHeader({ home = false }) {
  const menuButton = useRef(null);
  const mobileMenu = useRef(null);
  const menuHref = (href) => home ? href : `/${href}`;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 800px)");
    const closeOnDesktop = () => {
      if (!mediaQuery.matches) setIsOpen(false);
    };
    const focusTargets = [menuButton.current, ...mobileMenu.current.querySelectorAll("a")];
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButton.current?.focus();
      }
      if (event.key !== "Tab") return;
      const current = focusTargets.indexOf(document.activeElement);
      const next = current + (event.shiftKey ? -1 : 1);
      if (current < 0 || next < 0 || next === focusTargets.length) {
        event.preventDefault();
        focusTargets[event.shiftKey ? focusTargets.length - 1 : 0]?.focus();
      }
    };

    menuButton.current?.focus();
    document.documentElement.classList.add("editorial-menu-open");
    window.addEventListener("keydown", handleKeyDown);
    mediaQuery.addEventListener("change", closeOnDesktop);

    return () => {
      document.documentElement.classList.remove("editorial-menu-open");
      window.removeEventListener("keydown", handleKeyDown);
      mediaQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [isOpen]);

  return (
    <header className="company-header">
      <div className="editorial-container company-header__inner">
        <CompanyWordmark />

        <nav className="company-header__desktop" aria-label="기업 홈페이지 주요 메뉴">
          {navigation.map((item) => (
            <a key={item.href} href={menuHref(item.href)}>
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          ref={menuButton}
          className="company-header__menu-button"
          aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isOpen}
          aria-controls="company-mobile-menu"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span />
          <span />
        </button>
        <Link className="halo-button halo-header-cta" to="/partnership">제휴 문의 <ArrowIcon /></Link>
      </div>

      <div
        id="company-mobile-menu"
        ref={mobileMenu}
        className={`company-mobile-menu${isOpen ? " is-open" : ""}`}
        inert={!isOpen}
        aria-hidden={!isOpen}
      >
        <nav aria-label="기업 홈페이지 모바일 메뉴">
          {navigation.map((item) => (
            <a key={item.href} href={menuHref(item.href)} onClick={() => setIsOpen(false)}>
              {item.label}
            </a>
          ))}
          <a
            className="company-mobile-menu__app-store"
            href={KIRI_STORE_URLS.appStore}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              setIsOpen(false);
              trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.CLICK_APP_STORE, {
                page_name: PAGE_NAMES.COMPANY,
                service: SERVICES.KIRI,
                cta_location: CTA_LOCATIONS.HEADER,
                store: STORES.APP_STORE,
              });
            }}
          >
            <img
              src="/images/badges/app-store-ko.svg"
              alt="App Store에서 다운로드"
              width="130"
              height="40"
            />
          </a>
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

function CompanyActivitySlider({ slides, label = "HALO 팀 활동 사진" }) {
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
      className="company-activity-slider company-activity-slider--activity"
      aria-roledescription="carousel"
      aria-label={label}
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
                style={/** @type {import("react").CSSProperties} */ ({
                  "--activity-focus": slide.objectPosition ?? "50% 50%",
                  "--activity-focus-mobile":
                    slide.mobileObjectPosition ?? slide.objectPosition ?? "50% 50%",
                })}
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
          <h1 id="company-hero-title">함께하는 시간을 만듭니다.</h1>
          <p>
            디지털 서비스와 오프라인 경험을 통해 가족이 함께하는 시간을 만드는 기업입니다.
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
                aria-label="이전 사진"
                onClick={() => showSlide(activeIndex - 1)}
              >
                <SliderArrow direction="previous" />
              </button>
              <button
                type="button"
                aria-label="다음 사진"
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

            <div className="company-activity-slider__position" aria-label="사진 선택">
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  className={index === activeIndex ? "is-active" : ""}
                  aria-label={`${index + 1}번째 사진 보기`}
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
        <Link
          className="service-feature__page-button service-feature__page-button--halo"
          to="/halo"
          onClick={() =>
            trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.CLICK_SERVICE, {
              page_name: PAGE_NAMES.COMPANY,
              service: SERVICES.HALO,
              cta_location: CTA_LOCATIONS.SERVICE_SECTION,
            })
          }
        >
          HALO 보러 가기
          <ArrowIcon />
        </Link>
        <a
          className="service-feature__store-badge"
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Google Play에서 HALO 다운로드하기 (새 탭)"
          onClick={() =>
            trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.CLICK_APP_STORE, {
              page_name: PAGE_NAMES.COMPANY,
              service: SERVICES.HALO,
              cta_location: CTA_LOCATIONS.SERVICE_SECTION,
              store: STORES.GOOGLE_PLAY,
            })
          }
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
      <Link
        className="service-feature__page-button service-feature__page-button--kiri"
        to="/kiri"
        onClick={() =>
          trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.CLICK_SERVICE, {
            page_name: PAGE_NAMES.COMPANY,
            service: SERVICES.KIRI,
            cta_location: CTA_LOCATIONS.SERVICE_SECTION,
          })
        }
      >
        끼리 보러 가기
        <ArrowIcon />
      </Link>
      <a
        className="service-feature__store-badge service-feature__store-badge--app-store"
        href={KIRI_STORE_URLS.appStore}
        target="_blank"
        rel="noreferrer"
        aria-label="KIRI App Store에서 다운로드"
        onClick={() =>
          trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.CLICK_APP_STORE, {
            page_name: PAGE_NAMES.COMPANY,
            service: SERVICES.KIRI,
            cta_location: CTA_LOCATIONS.SERVICE_SECTION,
            store: STORES.APP_STORE,
          })
        }
      >
        <img
          src="/images/badges/app-store-ko.svg"
          alt="App Store에서 다운로드"
          width="130"
          height="40"
        />
      </a>
    </div>
  );
}

function Journey() {
  const timeline = useRef(null);

  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.animate([{ opacity: 0.5, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 420, easing: "ease-out" });
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.2 });
    timeline.current.querySelectorAll("li").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="journey" className="halo-section">
      <div className="editorial-container halo-split">
        <div><p className="halo-eyebrow">Our Journey</p><h2>HALO가 걸어온 길</h2></div>
        <ol className="halo-timeline" ref={timeline}>
          {milestones.map((milestone) => (
            <li key={milestone.title} className={milestone.current ? "is-current" : undefined}>
              <time dateTime={milestone.month}>{milestone.displayDate ?? milestone.month.replace("-", ".")}</time>
              <h3>{milestone.title}</h3>
              <p>{milestone.description}</p>
              {milestone.href && <a className="halo-text-link" href={milestone.href}>{milestone.linkLabel} <ArrowIcon /></a>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function CompanyPage() {
  usePageMeta(PAGE_METADATA.company);

  return (
    <div className="editorial-shell company-page halo-corporate">
      <a className="halo-skip" href="#main-content">본문으로 건너뛰기</a>
      <CompanyHeader home />
      <main id="main-content" tabIndex={-1}>
        <section id="company" className="company-hero" aria-labelledby="company-hero-title">
          <div className="editorial-container">
            <CompanyActivitySlider slides={activitySlides} />
          </div>
        </section>

        <section id="about" className="halo-section halo-tinted">
          <div className="editorial-container halo-split">
            <div>
              <p className="halo-eyebrow">More time together.</p>
              <h2>가족이 서로를 더 잘 알아가고<br />함께하는 시간을 만들도록.</h2>
            </div>
            <p className="halo-lead">HALO는 가족이 서로를 더 잘 알아가고 함께하는 시간을 만들어갈 수 있도록 돕습니다. 실제 사람들의 이야기를 듣고, 그 경험을 바탕으로 디지털 서비스와 오프라인 프로그램을 기획하고 개발합니다.</p>
          </div>
        </section>

        <section id="services" className="company-services halo-section">
          <div className="editorial-container">
            <p className="halo-eyebrow">Our Product</p>
            <h2>우리 가족의 시간을 만드는 끼리</h2>
            <article className="halo-product">
              <div className="service-feature__copy">
                <img className="service-feature__app-logo service-feature__app-logo--kiri" src="/images/kiri/kiri-logo.svg" alt="끼리 KIRI" width="276" height="100" />
                <h3>가족끼리, 취향부터 활동까지.</h3>
                <p>가족 구성원의 취향을 알아가고, 맞춤 활동과 장소 추천부터 가족 일정, 사진과 리뷰 기록까지 연결합니다.</p>
                <ServiceActions service="kiri" />
              </div>
              <div className="halo-product-art">
                <img src="/images/kiri/KakaoTalk_20261116_010517345.png" alt="끼리 로고와 가족 활동을 탐색하는 앱 화면" width="1620" height="2880" loading="lazy" />
              </div>
            </article>
            <article className="halo-product halo-legacy">
              <div className="service-feature__copy">
                <img className="service-feature__app-logo service-feature__app-logo--halo" src="/logotypo.svg" alt="HALO 앱" width="918" height="250" />
                <h3>부모님과의 이야기를, 하루 한 장씩.</h3>
                <p>10개의 스토리북 테마로 평소 나누지 못한 이야기를 시작하고, 가족과 함께한 활동과 사진, 대화를 기록합니다.</p>
                <ServiceActions service="halo" />
              </div>
              <div className="halo-product-art halo-product-art--activity">
                <img src="/images/company-activities/halo_activity2.jpg" alt="데모데이에서 HALO 서비스를 소개하는 팀" width="4032" height="3024" loading="lazy" />
              </div>
            </article>
          </div>
        </section>

        <section id="business" className="halo-section halo-tinted">
          <div className="editorial-container">
            <p className="halo-eyebrow">What We Do</p><h2>가족의 일상을 잇는 세 가지 일</h2>
            <div className="halo-business-grid">
              {[
                ["디지털 서비스", "가족의 취향을 발견하고 함께할 활동을 찾으며 경험을 기록하는 서비스를 개발하고 운영합니다."],
                ["가족 프로그램", "가족이 함께 참여하는 체험과 소통 프로그램을 기획합니다. HALO만의 프로그램 운영을 준비하고 있습니다."],
                ["기업·기관 협력", "기업·기관과의 협력을 모색해 가족에게 필요한 활동과 상품·서비스를 연결하고, 지역사회 연계 프로그램을 준비합니다."],
              ].map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="partners" className="halo-section">
          <div className="editorial-container">
            <h2>Our Partners</h2>
            <p className="halo-lead">가족에게 더 다양한 경험을 제공하기 위해 여러 기업 및 기관과의 협력을 만들어가고 있습니다.</p>
            <ul className="halo-partner-logos">
              {partners.map((partner) => (
                <li key={partner.slug}>
                  <div className="halo-partner-logo">
                    {partner.logo ? <img src={partner.logo} alt={partner.name} /> : partner.name}
                  </div>
                  <span className="halo-partner-state">{partnershipStatuses[partner.status]}</span>
                  <Link className="halo-button halo-button--outline" to={`/partners/${partner.slug}`} aria-label={`${partner.name} 상세 보기`}>
                    상세 보기
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Journey />

        <section id="partnership" className="company-partnership halo-section">
          <div className="editorial-container">
            <div className="halo-callout halo-split">
              <div><p className="halo-eyebrow">Partnership</p><h2>가족을 위한 경험을<br />함께할 파트너를 기다립니다.</h2></div>
              <div><p>가족 체험과 문화·여가 프로그램, 가족 관련 상품·서비스, 지역 연계와 케어, 공동 마케팅까지 함께할 제안을 기다립니다.</p>
                <div className="halo-actions"><Link className="halo-button" to="/partnership">제휴·입점 문의 <ArrowIcon /></Link><a className="halo-text-link" href="mailto:halo.official.app@gmail.com?subject=%5BHALO%5D%20%EC%A0%9C%ED%9C%B4%C2%B7%EC%9E%85%EC%A0%90%20%EB%AC%B8%EC%9D%98">이메일 문의</a></div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <EditorialFooter />
    </div>
  );
}
