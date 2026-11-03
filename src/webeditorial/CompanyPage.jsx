import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowIcon,
  CompanyWordmark,
  EditorialFooter,
  SectionLabel,
} from "./shared.jsx";
import usePageMeta from "./usePageMeta.js";

const navigation = [
  { label: "회사 소개", href: "#company" },
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
          <Link to="/kiri" onClick={() => setIsOpen(false)}>
            KIRI 사전예약
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function CompanyPage() {
  usePageMeta({
    title: "HALO는 사람과 사람 사이, 가까워질 계기를 만듭니다",
    description:
      "HALO는 대화와 경험을 통해 사람들이 서로를 알아가고 함께할 계기를 만드는 서비스를 개발합니다.",
    themeColor: "#f3efe6",
  });

  return (
    <div className="editorial-shell company-page">
      <CompanyHeader />

      <main>
        <section className="company-hero" aria-labelledby="company-hero-title">
          <div className="editorial-container company-hero__grid">
            <div className="company-hero__copy">
              <h1 id="company-hero-title">
                가까운 사람에게 마음을 전하고,
                <br />
                <em>함께할 계기</em>를
                <br />
                만드는 기업
              </h1>
              <div className="company-hero__intro">
                <p>
                  HALO는 서로를 더 알아가고, 함께하고 싶은 마음이 실제 경험으로
                  이어지도록 돕는 서비스를 기획하고 만듭니다.
                </p>
                <a className="editorial-button" href="#services">
                  서비스 살펴보기
                  <ArrowIcon />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="company" className="company-about editorial-section">
          <div className="editorial-container">
            <SectionLabel>회사 소개</SectionLabel>
            <div className="company-about__lead">
              <h2>
                가까운 사이라고 해서
                <br />
                서로를 다 아는 것은 아니니까.
              </h2>
              <p>
                우리는 관계의 거리가 마음의 거리와 늘 같지는 않다는 데서 출발했습니다.
                좋아하는 것, 요즘의 마음, 함께해 보고 싶은 일은 가까운 사이에서도 쉽게
                꺼내기 어렵습니다.
              </p>
            </div>

            <div className="company-about__notes">
              <article>
                <h3>서로를 알아가는 대화를 시작합니다.</h3>
                <p>
                  가까운 사이에서도 꺼내기 어려웠던 취향과 지난 이야기를 자연스럽게
                  나눌 수 있도록 돕습니다.
                </p>
              </article>
              <article>
                <h3>함께하고 싶은 마음을 실제 경험으로 잇습니다.</h3>
                <p>
                  발견한 관심이 함께하는 활동과 약속, 오래 남는 기록으로 이어지도록
                  관계의 다음 계기를 설계합니다.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="services" className="company-services editorial-section">
          <div className="editorial-container">
            <SectionLabel>서비스</SectionLabel>
            <div className="company-services__heading">
              <h2>관계를 위한 두 가지 시작</h2>
            </div>

            <article className="service-feature service-feature--halo">
              <Link className="service-feature__link" to="/halo">
                <div className="service-feature__copy">
                  <p className="service-feature__status">출시 서비스</p>
                  <h3>HALO — 매일 한 장, 부모님과 이어가는 따뜻한 안녕</h3>
                  <p>
                    사진과 질문을 통해 부모님의 삶과 취향을 알아가고, 매일의 대화를 한
                    권의 가족 스토리북으로 기록하는 서비스입니다.
                  </p>
                  <span className="editorial-button service-cta--halo">
                    HALO 알아보기
                    <ArrowIcon />
                  </span>
                </div>
                <figure className="service-feature__visual service-feature__visual--halo">
                  <img
                    src="/images/hero/hero-main.svg"
                    alt="HALO 앱의 가족 스토리북 화면"
                    loading="lazy"
                  />
                </figure>
              </Link>
            </article>

            <article className="service-feature service-feature--kiri">
              <Link className="service-feature__link" to="/kiri">
                <div className="service-feature__visual service-feature__visual--kiri">
                  <img
                    className="service-feature__kiri-logo"
                    src="/images/kiri/kiri-logo.svg"
                    alt="KIRI"
                    width="276"
                    height="100"
                  />
                  <img
                    className="service-feature__kiri-screen"
                    src="/images/kiri/kiri-home.png"
                    alt="KIRI 홈 화면"
                    loading="lazy"
                  />
                  <img
                    className="service-feature__kiri-mascot"
                    src="/images/kiri/kiri-mascot.svg"
                    alt="KIRI 캐릭터"
                    width="56"
                    height="56"
                  />
                </div>
                <div className="service-feature__copy">
                  <p className="service-feature__status">출시 준비 중</p>
                  <h3>KIRI — 우리 가족만의 취향, 우리 가족만의 시간</h3>
                  <p>
                    질문으로 서로를 알아가고, 가족의 취향과 상황에 맞는 활동을 발견해
                    약속과 기록으로 이어가는 서비스입니다.
                  </p>
                  <span className="kiri-link">
                    KIRI 알아보기
                    <ArrowIcon />
                  </span>
                </div>
              </Link>
            </article>
          </div>
        </section>

        <section id="partnership" className="company-partnership editorial-section">
          <div className="editorial-container">
            <SectionLabel light>제휴·협업</SectionLabel>
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
                  가족이 함께 방문하고 경험할 수 있는 장소·브랜드 제휴, 서비스와 콘텐츠
                  협업을 이야기하고 싶습니다.
                </p>
                <a
                  className="editorial-button editorial-button--dark"
                  href="mailto:halo.official.app@gmail.com?subject=%5BHALO%5D%20%EC%A0%9C%ED%9C%B4%C2%B7%ED%98%91%EC%97%85%20%EB%AC%B8%EC%9D%98"
                >
                  제휴·협업 문의
                  <ArrowIcon />
                </a>
                <small>
                  halo.official.app@gmail.com
                </small>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}
