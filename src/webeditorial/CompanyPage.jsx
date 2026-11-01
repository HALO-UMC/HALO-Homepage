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
  { label: "우리의 여정", href: "#journey" },
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
          {navigation.map((item, index) => (
            <a key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </a>
          ))}
          <Link to="/kiri" onClick={() => setIsOpen(false)}>
            <span>05</span>
            KIRI 사전예약
          </Link>
        </nav>
      </div>
    </header>
  );
}

function RelationFigure() {
  // return (
  //   <figure className="relation-figure" aria-label="관계의 계기를 표현한 편집형 그래픽">
  //     <div className="relation-figure__topline">
  //       <span>관계 노트 · 제1호</span>
  //       <span>HALO</span>
  //     </div>
  //     <p className="relation-figure__word">사이</p>
  //     <div className="relation-figure__orbit" aria-hidden="true">
  //       <span />
  //       <span />
  //     </div>
  //     <div className="relation-figure__index">
  //       <div>
  //         <span>01</span>
  //         <p>대화에서 시작되는 이해</p>
  //       </div>
  //       <div>
  //         <span>02</span>
  //         <p>관심에서 이어지는 경험</p>
  //       </div>
  //     </div>
  //     <figcaption>
  //       서로를 알아보는 작은 질문과 함께할 수 있는 경험 사이에 HALO가 있습니다.
  //     </figcaption>
  //   </figure>
  // );
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
              <p className="company-hero__issue">HALO COMPANY</p>
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

            <RelationFigure />
          </div>
          <div className="company-hero__marquee" aria-hidden="true">
            <span>대화</span>
            <i />
            <span>이해</span>
            <i />
            <span>경험</span>
            <i />
            <span>기록</span>
          </div>
        </section>

        <section id="company" className="company-about editorial-section">
          <div className="editorial-container">
            <SectionLabel number="01">회사 소개</SectionLabel>
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
                <span>관찰 01</span>
                <h3>알고 싶지만, 무엇을 물어야 할지 막막합니다.</h3>
                <p>
                  일상의 안부는 오가도 서로의 취향과 지난 이야기를 천천히 묻는 일은
                  생각보다 어렵습니다.
                </p>
              </article>
              <article>
                <span>관찰 02</span>
                <h3>함께하고 싶지만, 마음만으로는 약속이 되지 않습니다.</h3>
                <p>
                  “다음에 같이 가자”는 말이 장소와 날짜를 만나 실제 시간이 되기까지는
                  작은 계기가 필요합니다.
                </p>
              </article>
              <article>
                <span>HALO의 역할</span>
                <h3>대화와 경험 사이에 자연스러운 시작점을 놓습니다.</h3>
                <p>
                  질문으로 서로를 알아가고, 발견한 관심이 함께하는 행동과 오래 남는
                  기록으로 이어지도록 설계합니다.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="services" className="company-services editorial-section">
          <div className="editorial-container">
            <SectionLabel number="02">서비스</SectionLabel>
            <div className="company-services__heading">
              <h2>관계를 위한 두 가지 시작</h2>
              <p>
                한 사람의 이야기를 오래 바라보는 일에서, 가족이 함께할 다음 시간을
                발견하는 일까지.
              </p>
            </div>

            <article className="service-feature service-feature--halo">
              <div className="service-feature__copy">
                <div className="service-feature__meta">
                  <span>서비스 01</span>
                  <span>출시 서비스</span>
                </div>
                <p className="service-feature__brand">HALO APP</p>
                <h3>매일 한 장, 부모님과 이어가는 따뜻한 안녕</h3>
                <p>
                  사진과 질문을 통해 부모님의 삶과 취향을 알아가고, 매일의 대화를 한
                  권의 가족 스토리북으로 기록하는 서비스입니다.
                </p>
                <Link className="editorial-button service-cta--halo" to="/halo">
                  HALO 알아보기
                  <ArrowIcon />
                </Link>
              </div>
              <figure className="service-feature__visual service-feature__visual--halo">
                <img
                  src="/images/hero/hero-main.svg"
                  alt="HALO 앱의 가족 스토리북 화면"
                  loading="lazy"
                />
                <figcaption>부모님의 이야기를 발견하고 기록하는 가족 스토리북</figcaption>
              </figure>
            </article>

            <article className="service-feature service-feature--kiri">
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
                <div className="service-feature__meta">
                  <span>서비스 02</span>
                  <span>출시 준비 중</span>
                </div>
                <h3>우리 가족만의 취향, 우리 가족만의 시간</h3>
                <p>
                  질문으로 서로를 알아가고, 가족의 취향과 상황에 맞는 활동을 발견해
                  약속과 기록으로 이어가는 서비스입니다.
                </p>
                <Link className="kiri-link" to="/kiri">
                  KIRI 알아보기
                  <ArrowIcon />
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section id="journey" className="company-journey editorial-section">
          <div className="editorial-container">
            <SectionLabel number="03">우리의 여정</SectionLabel>
            <div className="company-journey__grid">
              <h2>
                기록에서 경험으로,
                <br />
                관계의 문제를 더 넓게 봅니다.
              </h2>
              <div className="journey-list">
                <article>
                  <span>01</span>
                  <div>
                    <h3>가족 스토리북 서비스 HALO 개발·출시</h3>
                    <p>질문과 사진으로 부모님의 이야기를 알아가고 기록하는 경험을 만들었습니다.</p>
                  </div>
                </article>
                <article>
                  <span>02</span>
                  <div>
                    <h3>기록과 대화에서 공동 활동으로 확장</h3>
                    <p>서로를 아는 일을 넘어, 함께할 시간을 실제로 만드는 문제를 바라봤습니다.</p>
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <h3>KIRI 개발 및 출시 준비</h3>
                    <p>가족의 취향을 발견하고 활동·약속·기록으로 연결하는 서비스를 준비하고 있습니다.</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section id="partnership" className="company-partnership editorial-section">
          <div className="editorial-container">
            <SectionLabel number="04">제휴·협업</SectionLabel>
            <div className="company-partnership__content">
              <div>
                <p className="company-partnership__eyebrow">함께 만들 다음 장면</p>
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
