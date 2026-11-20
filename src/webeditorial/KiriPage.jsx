import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { ArrowIcon, EditorialFooter } from "./shared.jsx";
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

const KIRI_IMAGES = Object.freeze({
  hero: "/images/kiri/KakaoTalk_20261116_010517345.png",
  home: "/images/kiri/KakaoTalk_20261116_010517345_01.png",
  aiRecommendation: "/images/kiri/KakaoTalk_20261116_010517345_02.png",
  invitation: "/images/kiri/KakaoTalk_20261116_010517345_03.png",
  discovery: "/images/kiri/KakaoTalk_20261116_010517345_04.png",
  calendar: "/images/kiri/KakaoTalk_20261116_010517345_05.png",
});

const KIRI_FEATURES = [
  {
    id: "home",
    label: "홈",
    description: "가족의 답변과 이번 주 추천 미션을 한눈에 확인해요.",
    image: KIRI_IMAGES.home,
    alt: "가족 답변과 이번 주 추천 미션을 보여주는 끼리 홈 화면",
  },
  {
    id: "discovery",
    label: "미션 둘러보기",
    description: "전시부터 산책까지, 가족과 함께할 활동을 찾아봐요.",
    image: KIRI_IMAGES.discovery,
    alt: "가족과 함께할 활동을 검색하고 탐색하는 끼리 미션 둘러보기 화면",
  },
  {
    id: "ai-recommendation",
    label: "AI 맞춤 활동",
    description: "우리 가족의 취향과 상황에 꼭 맞는 활동을 AI가 추천해요.",
    image: KIRI_IMAGES.aiRecommendation,
    alt: "우리 가족에게 맞는 활동을 추천하는 끼리 AI 맞춤 활동 화면",
  },
  {
    id: "invitation",
    label: "미션 초대",
    description: "함께할 활동과 날짜를 골라 가족에게 한 번에 보내요.",
    image: KIRI_IMAGES.invitation,
    alt: "활동과 날짜를 골라 가족에게 보내는 끼리 미션 초대 화면",
  },
  {
    id: "calendar",
    label: "캘린더",
    description: "다가올 약속과 함께한 날의 기록을 한곳에서 돌아봐요.",
    image: KIRI_IMAGES.calendar,
    alt: "다가올 약속과 함께한 날의 기록을 확인하는 끼리 캘린더 화면",
  },
];

function trackStoreClick(location, store = STORES.APP_STORE) {
  trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.CLICK_APP_STORE, {
    page_name: PAGE_NAMES.KIRI,
    service: SERVICES.KIRI,
    cta_location: location,
    store,
  });
}

function KiriStoreButtons({ location }) {
  const googlePlayButton = KIRI_STORE_URLS.googlePlay ? (
    <a
      className="kiri-store-badge kiri-store-badge--google"
      href={KIRI_STORE_URLS.googlePlay}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackStoreClick(location, STORES.GOOGLE_PLAY)}
    >
      <img
        src="/images/badges/google-play-ko.png"
        alt="Google Play에서 다운로드"
        width="646"
        height="250"
      />
    </a>
  ) : (
    <button
      className="kiri-store-badge kiri-store-badge--google is-disabled"
      type="button"
      disabled
      aria-label="Google Play는 준비 중입니다"
    >
      <img
        src="/images/badges/google-play-ko.png"
        alt=""
        width="646"
        height="250"
      />
      <span>준비 중</span>
    </button>
  );

  return (
    <div className="kiri-store-badges">
      <a
        className="kiri-store-badge kiri-store-badge--apple"
        href={KIRI_STORE_URLS.appStore}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackStoreClick(location)}
      >
        <img
          src="/images/badges/app-store-ko.svg"
          alt="App Store에서 다운로드"
          width="130"
          height="40"
        />
      </a>
      {googlePlayButton}
    </div>
  );
}

function KiriHeader() {
  return (
    <header className="kiri-header">
      <div className="editorial-container kiri-header__inner">
        <Link to="/kiri" aria-label="끼리 공식 홈페이지" className="kiri-header__brand">
          <img src="/images/kiri/kiri-logo.svg" alt="KIRI" width="276" height="100" />
        </Link>

        <nav aria-label="끼리 페이지 주요 메뉴">
          <a href="#kiri-features">기능 둘러보기</a>
        </nav>
      </div>
    </header>
  );
}

function KiriFeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef([]);
  const cardRefs = useRef([]);
  const carouselRef = useRef(null);
  const animationFrameRef = useRef(null);
  const activeFeature = KIRI_FEATURES[activeIndex];

  const scrollToCard = (index) => {
    cardRefs.current[index]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const selectFeature = (index, { moveFocus = false, scroll = true } = {}) => {
    setActiveIndex(index);

    if (scroll) {
      scrollToCard(index);
    }

    if (moveFocus) {
      window.requestAnimationFrame(() => tabRefs.current[index]?.focus());
    }
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % KIRI_FEATURES.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + KIRI_FEATURES.length) % KIRI_FEATURES.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = KIRI_FEATURES.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    selectFeature(nextIndex, { moveFocus: true });
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) {
      return undefined;
    }

    const updateActiveCard = () => {
      const carouselBounds = carousel.getBoundingClientRect();
      const carouselCenter = carouselBounds.left + carouselBounds.width / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      cardRefs.current.forEach((card, index) => {
        if (!card) {
          return;
        }

        const cardBounds = card.getBoundingClientRect();
        const cardCenter = cardBounds.left + cardBounds.width / 2;
        const distance = Math.abs(cardCenter - carouselCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
      animationFrameRef.current = null;
    };

    const handleScroll = () => {
      if (animationFrameRef.current !== null) {
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(updateActiveCard);
    };

    carousel.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      carousel.removeEventListener("scroll", handleScroll);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="kiri-showcase">
      <div className="kiri-showcase__controls">
        <div className="kiri-showcase__tabs" role="tablist" aria-label="끼리 기능 선택">
          {KIRI_FEATURES.map((feature, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={feature.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`kiri-feature-tab-${feature.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="kiri-feature-description"
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectFeature(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {feature.label}
              </button>
            );
          })}
        </div>

        <div
          key={activeFeature.id}
          id="kiri-feature-description"
          className="kiri-showcase__active-copy"
          role="tabpanel"
          aria-labelledby={`kiri-feature-tab-${activeFeature.id}`}
        >
          <strong>{activeFeature.label}</strong>
          <p>{activeFeature.description}</p>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="kiri-showcase__carousel"
        aria-label="끼리 기능 화면 미리보기"
      >
        {KIRI_FEATURES.map((feature, index) => (
          <figure
            key={feature.id}
            id={`kiri-feature-card-${feature.id}`}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            className="kiri-showcase__card"
            aria-label={`${index + 1} / ${KIRI_FEATURES.length}, ${feature.label}`}
          >
            <img
              src={feature.image}
              alt={feature.alt}
              width="1620"
              height="2880"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
            <figcaption className="kiri-visually-hidden">
              {feature.description}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="kiri-showcase__hint">옆으로 넘겨 끼리의 기능을 둘러보세요.</p>
    </div>
  );
}

export default function KiriPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  usePageMeta(PAGE_METADATA.kiri);

  return (
    <div className="editorial-shell kiri-page">
      <KiriHeader />

      <main>
        <section className="kiri-hero" aria-labelledby="kiri-hero-title">
          <div className="editorial-container kiri-hero__grid">
            <div className="kiri-hero__copy">
              <p className="kiri-hero__eyebrow">끼리(KIRI)</p>
              <h1 id="kiri-hero-title">가족과 함께할 활동을 찾고, 추억을 남겨요.</h1>
              <p className="kiri-hero__description">
                이번 주에 뭐 하지? 우리 가족이 함께할 활동을 찾고, 약속부터 그날의
                기록까지 끼리에 남겨보세요.
              </p>
              <KiriStoreButtons location={CTA_LOCATIONS.HERO} />
            </div>

            <div className="kiri-hero__visual">
              <img
                src={KIRI_IMAGES.hero}
                alt="큰 KIRI 로고와 함께할 활동을 찾고 추억을 남겨요 문구, 끼리 앱 홈 화면이 담긴 대표 이미지"
                width="1620"
                height="2880"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <section id="kiri-features" className="kiri-features" aria-labelledby="kiri-features-title">
          <div className="editorial-container">
            <p className="kiri-section-label">끼리에서 할 수 있는 일</p>
            <div className="kiri-features__heading">
              <h2 id="kiri-features-title">가족의 다음 시간을 함께 만들어요.</h2>
              <p>활동을 발견하고 약속한 뒤, 함께한 날까지 한곳에 차곡차곡 남겨보세요.</p>
            </div>
            <KiriFeatureShowcase />
          </div>
        </section>

        <section className="kiri-company-link">
          <div className="editorial-container">
            <p>끼리는 가족이 함께하는 시간을 만드는 HALO의 서비스입니다.</p>
            <Link to="/">
              HALO 회사 이야기 보기
              <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>

      <EditorialFooter variant="kiri" />
    </div>
  );
}
