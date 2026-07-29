import { useEffect, useRef, useState } from "react";

import {
  brandPrinciples,
  companyStats,
  heroImages,
  navigationItems,
  productFeatures,
  productImages,
  storybooks,
  teamGroups,
} from "./data/siteData";

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/halo-image-fallback/1200/900";

function ImageWithFallback({ src, alt, className = "" }) {
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

function ArrowIcon({ direction = "right" }) {
  const rotation = direction === "left" ? "rotate(180 12 12)" : undefined;

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <g transform={rotation}>
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
      </g>
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

function HaloMark() {
  return (
    <span className="halo-mark" aria-hidden="true">
      <span className="halo-mark__ring" />
      <span className="halo-mark__point" />
    </span>
  );
}

function Logo({ light = false }) {
  return (
    <a
      href="#top"
      className={`logo ${light ? "logo--light" : ""}`}
      aria-label="Team HALO 홈으로 이동"
    >
      <HaloMark />

      <span className="logo__text">
        <strong>HALO</strong>
        <small>TEAM HALO</small>
      </span>
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
}) {
  return (
    <div
      className={[
        "section-heading",
        align === "center" ? "section-heading--center" : "",
        light ? "section-heading--light" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="section-heading__eyebrow">{eyebrow}</span>

      <h2>{title}</h2>

      {description && <p>{description}</p>}
    </div>
  );
}

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header className={`header ${isScrolled ? "header--scrolled" : ""}`}>
      <div className="header__inner">
        <Logo />

        <nav className="desktop-navigation" aria-label="주요 메뉴">
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header__contact" href="#team">
          Meet the team
          <ArrowIcon />
        </a>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((previous) => !previous)}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div className={`mobile-menu ${isOpen ? "is-open" : ""}`}>
        <nav aria-label="모바일 메뉴">
          {navigationItems.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <p>
          관계가 이어지는 방식을
          <br />
          설계합니다.
        </p>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__background-orbit hero__background-orbit--one" />
      <div className="hero__background-orbit hero__background-orbit--two" />

      <div className="container hero__inner">
        <div className="hero__content">
          <div className="hero__eyebrow">
            <span />
            RELATIONSHIP DESIGN COMPANY
          </div>

          <h1>
            관계가 이어지는
            <br />
            <strong>방식을 설계합니다.</strong>
          </h1>

          <p className="hero__description">
            Team HALO는 부모님과 자녀가 서로의 삶을 조금 더 자연스럽게
            알아갈 수 있도록, 대화와 행동 그리고 기록의 경험을 만듭니다.
          </p>

          <div className="hero__actions">
            <a className="button button--primary" href="#product">
              Discover HALO
              <ArrowIcon />
            </a>

            <a className="button button--text" href="#storybook">
              Explore storybooks
              <ArrowIcon />
            </a>
          </div>

          <div className="hero__summary">
            <span>OUR FIRST PRODUCT</span>
            <strong>HALO: 부모님과 나의 이야기</strong>
          </div>
        </div>

        <div className="hero-visual" aria-label="HALO 이미지 영역">
          <div className="hero-visual__main">
            <ImageWithFallback
              src={heroImages.main}
              alt="HALO 서비스 대표 이미지"
            />

            <div className="hero-visual__main-overlay">
              <span>TEAM HALO</span>

              <strong>
                Every relationship
                <br />
                has a story.
              </strong>
            </div>
          </div>

          <div className="hero-visual__side">
            <div className="hero-visual__small">
              <ImageWithFallback
                src={heroImages.subTop}
                alt="HALO 서비스 이미지"
              />
            </div>

            <div className="hero-visual__small hero-visual__small--dark">
              <ImageWithFallback
                src={heroImages.subBottom}
                alt="HALO 서비스 이미지"
              />

              <div>
                <span>ONE PAGE</span>
                <strong>A DAY</strong>
              </div>
            </div>
          </div>

          <div className="hero-visual__badge">
            <HaloMark />

            <span>
              Designed for
              <br />
              lasting relationships
            </span>
          </div>
        </div>
      </div>

      <div className="hero__bottom-line">
        <span>PRODUCT · DESIGN · TECHNOLOGY</span>
        <span>SEOUL, SOUTH KOREA</span>
      </div>
    </section>
  );
}

function BrandStatement() {
  return (
    <section className="brand-statement" id="about">
      <div className="container">
        <div className="brand-statement__label">
          <span>ABOUT TEAM HALO</span>
          <span className="brand-statement__line" />
        </div>

        <p className="brand-statement__copy">
          마음이 없어서가 아니라,
          <br />
          <strong>시작하는 방법을 몰랐기 때문입니다.</strong>
        </p>

        <div className="brand-statement__bottom">
          <p>
            우리는 관계를 바꾸는 거창한 결심보다 오늘 먼저 건넬 수 있는
            짧은 안부, 한 번의 질문, 한 장의 기록에 집중합니다.
          </p>

          <p>
            HALO는 가족 관계에서 시작해 사람과 사람 사이의 거리를
            자연스럽게 좁히는 경험을 만들어갑니다.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductOverview() {
  return (
    <section className="product-section" id="product">
      <div className="container">
        <div className="product-section__intro">
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

          <div className="product-section__note">
            <span>HALO</span>

            <p>
              영어의 인사말과
              <br />
              평안할 안녕(安寧)을 함께 담았습니다.
            </p>
          </div>
        </div>

        <div className="product-showcase">
          <div className="product-showcase__visual">
            <div className="product-device">
              <div className="product-device__speaker" />

              <ImageWithFallback
                src={productImages.main}
                alt="HALO 앱 화면을 넣을 수 있는 영역"
              />
            </div>

            <div className="product-showcase__floating-image">
              <ImageWithFallback
                src={productImages.detail}
                alt="HALO 상세 이미지 영역"
              />

              <span>DAILY STORYBOOK</span>
            </div>

            <div className="product-showcase__circle">
              <span>10</span>
              <small>CHAPTERS</small>
            </div>
          </div>

          <div className="product-features">
            {productFeatures.map((feature) => (
              <article className="product-feature" key={feature.number}>
                <div className="product-feature__number">{feature.number}</div>

                <div className="product-feature__content">
                  <span>{feature.eyebrow}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StorybookSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  const viewportRef = useRef(null);
  const itemRefs = useRef([]);
  const scrollFrameRef = useRef(null);

  const total = storybooks.length;
  const activeStorybook = storybooks[activeIndex];

  const moveTo = (requestedIndex) => {
    const normalizedIndex = ((requestedIndex % total) + total) % total;

    setActiveIndex(normalizedIndex);

    itemRefs.current[normalizedIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const movePrevious = () => {
    moveTo(activeIndex - 1);
  };

  const moveNext = () => {
    moveTo(activeIndex + 1);
  };

  const handleScroll = () => {
    if (scrollFrameRef.current) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const viewportCenter = viewportRect.left + viewportRect.width / 2;

      let closestIndex = activeIndex;
      let closestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((item, index) => {
        if (!item) {
          return;
        }

        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(viewportCenter - itemCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== activeIndex) {
        setActiveIndex(closestIndex);
      }
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      movePrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveNext();
    }
  };

  return (
    <section className="storybook-section" id="storybook">
      <div className="container">
        <div className="storybook-section__header">
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

          <div className="storybook-controls">
            <button
              type="button"
              aria-label="이전 스토리북"
              onClick={movePrevious}
            >
              <ArrowIcon direction="left" />
            </button>

            <button
              type="button"
              aria-label="다음 스토리북"
              onClick={moveNext}
            >
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="storybook-viewport"
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex="0"
        aria-label="HALO 스토리북 슬라이드"
      >
        <div className="storybook-track">
          {storybooks.map((storybook, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                type="button"
                key={storybook.id}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                className={`storybook-card ${
                  isActive ? "is-active" : ""
                }`}
                onClick={() => moveTo(index)}
                aria-label={`${storybook.title} 스토리북 보기`}
                aria-current={isActive ? "true" : undefined}
              >
                <div className="storybook-card__image">
                  <ImageWithFallback
                    src={storybook.image}
                    alt={`${storybook.title} 스토리북 대표 이미지`}
                  />

                  <div className="storybook-card__shade" />

                  <span className="storybook-card__order">
                    STORYBOOK {storybook.order}
                  </span>

                  <div className="storybook-card__title">
                    <small>{storybook.englishTitle}</small>
                    <strong>{storybook.title}</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="container">
        <div
          className="storybook-detail"
          aria-live="polite"
          key={activeStorybook.id}
        >
          <div className="storybook-detail__count">
            <strong>{activeStorybook.order}</strong>
            <span>/ {String(total).padStart(2, "0")}</span>
          </div>

          <div className="storybook-detail__content">
            <span>{activeStorybook.englishTitle}</span>
            <h3>{activeStorybook.title}</h3>
            <p>{activeStorybook.description}</p>
          </div>

          <div className="storybook-progress">
            {storybooks.map((storybook, index) => (
              <button
                type="button"
                key={storybook.id}
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => moveTo(index)}
                aria-label={`${storybook.title}로 이동`}
              >
                <span />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NumbersSection() {
  return (
    <section className="numbers-section">
      <div className="container">
        <div className="numbers-section__intro">
          <span>DESIGNED AS A DAILY EXPERIENCE</span>

          <p>
            관계는 한 번의 큰 행동보다
            <br />
            반복할 수 있는 작은 경험으로 이어집니다.
          </p>
        </div>

        <div className="numbers-grid">
          {companyStats.map((stat) => (
            <article className="number-card" key={stat.unit}>
              <div className="number-card__value">
                <strong>{stat.value}</strong>
                <span>{stat.unit}</span>
              </div>

              <p>{stat.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  return (
    <section className="principles-section">
      <div className="container">
        <SectionHeading
          eyebrow="OUR PRINCIPLES"
          title={
            <>
              좋은 관계를 위한 경험은
              <br />
              다르게 설계되어야 합니다.
            </>
          }
          description="Team HALO는 기능의 수보다 사용자가 관계를 이어갈 수 있는 방식과 속도를 먼저 생각합니다."
        />

        <div className="principles-list">
          {brandPrinciples.map((principle) => (
            <article className="principle-item" key={principle.number}>
              <span>{principle.number}</span>

              <h3>{principle.title}</h3>

              <p>{principle.description}</p>

              <div className="principle-item__icon">
                <ArrowIcon />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section className="team-section" id="team">
      <div className="container">
        <div className="team-section__header">
          <SectionHeading
            eyebrow="TEAM HALO"
            title={
              <>
                하나의 경험을 만드는
                <br />
                서로 다른 전문성
              </>
            }
            description="기획과 디자인, Android와 Spring Boot가 하나의 기준으로 HALO의 경험을 만들어갑니다."
            light
          />

          <p className="team-section__side-copy">
            PRODUCT
            <br />
            DESIGN
            <br />
            TECHNOLOGY
          </p>
        </div>

        <div className="team-grid">
          {teamGroups.map((group, index) => (
            <article className="team-card" key={group.code}>
              <div className="team-card__top">
                <span>{group.code}</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>

              <h3>{group.title}</h3>

              <p>{group.description}</p>

              <ul>
                {group.members.map((member) => (
                  <li key={member}>{member}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalSection() {
  return (
    <section className="final-section">
      <div className="final-section__orbit final-section__orbit--one" />
      <div className="final-section__orbit final-section__orbit--two" />

      <div className="container final-section__inner">
        <HaloMark />

        <span className="final-section__eyebrow">
          WE DESIGN THE NEXT HELLO
        </span>

        <h2>
          열 번의 안녕이
          <br />
          <strong>한 권의 이야기가 될 때까지.</strong>
        </h2>

        <p>
          Team HALO는 사람과 사람 사이의 관계가 조금 더 자연스럽게
          이어질 수 있는 경험을 만듭니다.
        </p>

        <a
          className="button button--light"
          href="https://github.com/HALO-UMC"
          target="_blank"
          rel="noreferrer"
        >
          Visit our GitHub
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__top">
        <Logo light />

        <div className="footer__navigation">
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="footer__message">
          <span>OUR PURPOSE</span>

          <p>
            관계가 이어지는 방식을
            <br />
            설계합니다.
          </p>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© {currentYear} TEAM HALO. ALL RIGHTS RESERVED.</span>
        <span>PRODUCT · DESIGN · TECHNOLOGY</span>
      </div>
    </footer>
  );
}

function App() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <BrandStatement />
        <ProductOverview />
        <StorybookSlider />
        <NumbersSection />
        <PrinciplesSection />
        <TeamSection />
        <FinalSection />
      </main>

      <Footer />
    </>
  );
}

export default App;