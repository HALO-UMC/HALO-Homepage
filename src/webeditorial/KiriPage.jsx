import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  ArrowIcon,
  EditorialFooter,
  SectionLabel,
} from "./shared.jsx";
import usePageMeta from "./usePageMeta.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const experienceSteps = [
  {
    number: "01",
    tabLabel: "질문",
    title: "질문으로 서로 알아가기",
    description:
      "가족에게 직접 묻기 어려웠던 취향을 한 번에 하나씩 나누며 서로를 알아갑니다.",
    image: "/images/kiri/kiri-question.png",
    alt: "가장 좋아하는 음식을 묻는 KIRI 질문 화면",
  },
  {
    number: "02",
    tabLabel: "활동 발견",
    title: "우리에게 맞는 활동과 장소 발견",
    description:
      "가족의 취향과 상황을 바탕으로 함께해 볼 활동을 살펴보고 관심 있는 장소를 발견합니다.",
    image: "/images/kiri/kiri-places.png",
    alt: "가족 활동과 장소를 탐색하는 KIRI 플레이스 화면",
  },
  {
    number: "03",
    tabLabel: "일정",
    title: "관심 활동을 약속으로 이어가기",
    description:
      "저장한 활동에 날짜와 함께할 가족을 더해, ‘다음에’라는 말을 구체적인 제안으로 바꿉니다.",
    image: "/images/kiri/kiri-schedule.png",
    alt: "가족과의 일정을 제안하는 KIRI 일정 등록 화면",
  },
  {
    number: "04",
    tabLabel: "기록",
    title: "함께한 시간을 사진과 기록으로 보관",
    description:
      "가족과 보낸 날의 사진과 각자의 기록을 한곳에 모아 다시 꺼내 볼 수 있도록 준비하고 있습니다.",
    image: "/images/kiri/kiri-record.png",
    alt: "함께한 가족 활동의 사진과 기록을 모아보는 KIRI 기록 화면",
  },
];

function KiriHeader() {
  return (
    <header className="kiri-header">
      <div className="editorial-container kiri-header__inner">
        <Link to="/kiri" aria-label="KIRI 소개 페이지" className="kiri-header__brand">
          <img src="/images/kiri/kiri-logo.svg" alt="KIRI" width="276" height="100" />
          <span>출시 준비 중</span>
        </Link>

        <nav aria-label="KIRI 페이지 주요 메뉴">
          <a href="#kiri-problem">왜 KIRI인가요</a>
          <a href="#kiri-experience">서비스 경험</a>
          <a className="kiri-header__cta" href="#kiri-preregister">
            사전예약
          </a>
        </nav>

        <Link className="kiri-header__company" to="/">
          HALO 회사
          <ArrowIcon direction="up-right" />
        </Link>
      </div>
    </header>
  );
}

function KiriPreregisterForm() {
  const [preregistration, setPreregistration] = useState({
    phase: "loading",
    ready: false,
    policy: null,
  });
  const [values, setValues] = useState({
    email: "",
    nickname: "",
    device: "undecided",
    familyTrial: false,
    privacyAgreed: false,
    company: "",
  });
  const [errors, setErrors] = useState({});
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/kiri-preregister-status", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("사전예약 접수 상태를 확인하지 못했습니다.");
        }

        return response.json();
      })
      .then((result) => {
        if (!cancelled) {
          setPreregistration({
            phase: "ready",
            ready:
              result.ready === true &&
              Boolean(
                result.policy?.policyVersion &&
                  result.policy?.dataControllerName,
              ),
            policy: result.policy || null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreregistration({ phase: "ready", ready: false, policy: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const retentionLabel =
    preregistration.policy?.retentionLabel ||
    "접수 시작 전 안내 예정";
  const dataController =
    preregistration.policy?.dataControllerName ||
    "할로(HALO)";

  const updateValue = (event) => {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    const normalizedEmail = values.email.trim();

    if (!normalizedEmail) {
      nextErrors.email = "출시 소식을 받을 이메일을 입력해주세요.";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = "이메일 형식을 확인해주세요.";
    }

    if (values.nickname.trim().length > 24) {
      nextErrors.nickname = "닉네임은 24자 이내로 입력해주세요.";
    }

    if (!values.privacyAgreed) {
      nextErrors.privacyAgreed = "사전예약을 위해 개인정보 수집·이용 동의가 필요합니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!preregistration.ready || isSubmittingRef.current || !validate()) {
      return;
    }

    isSubmittingRef.current = true;
    setSubmitState({ status: "submitting", message: "신청 내용을 안전하게 저장하고 있어요." });

    try {
      const response = await fetch("/api/kiri-preregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          nickname: values.nickname,
          device: values.device,
          familyTrial: values.familyTrial,
          privacyAgreed: values.privacyAgreed,
          company: values.company,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "신청 내용을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
      }

      setSubmitState({
        status: result.status === "duplicate" ? "duplicate" : "success",
        message:
          result.status === "duplicate"
            ? "이미 사전예약된 이메일이에요. 출시 소식은 기존 신청 이메일로 안내드릴게요."
            : "사전예약이 완료됐어요. 출시 소식을 신청한 이메일로 안내드릴게요.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "신청 내용을 저장하지 못했습니다. 입력 내용은 그대로 두었어요.",
      });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  if (preregistration.phase === "loading") {
    return (
      <div className="kiri-form-gate" role="status" aria-live="polite">
        <span className="kiri-form-gate__pulse" aria-hidden="true" />
        <p>사전예약 접수 가능 여부를 확인하고 있어요.</p>
      </div>
    );
  }

  if (!preregistration.ready) {
    return (
      <div className="kiri-form-gate" role="status" aria-live="polite">
        <img src="/images/kiri/kiri-mascot.svg" alt="" width="56" height="56" />
        <p className="kiri-form-gate__label">사전예약 접수 준비 중</p>
        <h3>사전예약 접수를 준비하고 있어요.</h3>
        <p>
          접수가 시작되면 이곳에서 바로 신청하고 KIRI의 출시 소식을 받아볼 수 있어요.
        </p>
        <button type="button" disabled>
          사전예약 접수 준비 중
        </button>
      </div>
    );
  }

  if (submitState.status === "success" || submitState.status === "duplicate") {
    return (
      <div className="kiri-form-complete" role="status" aria-live="polite">
        <img src="/images/kiri/kiri-mascot.svg" alt="KIRI 캐릭터" width="56" height="56" />
        <p className="kiri-form-complete__label">
          {submitState.status === "duplicate" ? "이미 함께하고 있어요" : "신청 완료"}
        </p>
        <h3>{submitState.message}</h3>
        <p>KIRI의 다음 소식은 신청한 이메일로 안내드릴게요.</p>
      </div>
    );
  }

  return (
    <form className="kiri-form" noValidate onSubmit={handleSubmit}>
      <div className="kiri-form__preparing" role="status">
        <span aria-hidden="true" />
        <div>
          <strong>사전예약을 받고 있어요</strong>
          <p>이메일을 등록하고 KIRI 출시 소식을 받아보세요.</p>
        </div>
      </div>

      <div className="kiri-form__row">
        <div className="kiri-field">
          <label htmlFor="kiri-email">
            이메일 <span>필수</span>
          </label>
          <input
            id="kiri-email"
            name="email"
            type="email"
            value={values.email}
            onChange={updateValue}
            autoComplete="email"
            placeholder="name@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "kiri-email-error" : "kiri-email-help"}
          />
          <p id="kiri-email-help" className="kiri-field__help">
            출시 소식을 안내하는 용도로만 사용합니다.
          </p>
          {errors.email && (
            <p id="kiri-email-error" className="kiri-field__error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="kiri-field">
          <label htmlFor="kiri-nickname">
            닉네임 <span className="is-optional">선택</span>
          </label>
          <input
            id="kiri-nickname"
            name="nickname"
            type="text"
            value={values.nickname}
            onChange={updateValue}
            autoComplete="nickname"
            maxLength="24"
            placeholder="어떻게 불러드릴까요?"
            aria-invalid={Boolean(errors.nickname)}
            aria-describedby={errors.nickname ? "kiri-nickname-error" : undefined}
          />
          {errors.nickname && (
            <p id="kiri-nickname-error" className="kiri-field__error">
              {errors.nickname}
            </p>
          )}
        </div>
      </div>

      <fieldset className="kiri-fieldset">
        <legend>사용 기기</legend>
        <div className="kiri-choice-grid">
          {[
            ["android", "Android"],
            ["ios", "iOS"],
            ["both", "둘 다"],
            ["undecided", "미정"],
          ].map(([value, label]) => (
            <label key={value} className="kiri-radio">
              <input
                type="radio"
                name="device"
                value={value}
                checked={values.device === value}
                onChange={updateValue}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="kiri-check">
        <input
          type="checkbox"
          name="familyTrial"
          checked={values.familyTrial}
          onChange={updateValue}
        />
        <span>
          가족 체험단이 운영될 경우 참여 의향이 있어요
          <small>선택 · 체험단 모집이 확정된 것은 아닙니다.</small>
        </span>
      </label>

      <div className="kiri-consent">
        <label className="kiri-check kiri-check--consent">
          <input
            type="checkbox"
            name="privacyAgreed"
            checked={values.privacyAgreed}
            onChange={updateValue}
            aria-invalid={Boolean(errors.privacyAgreed)}
            aria-describedby={errors.privacyAgreed ? "kiri-privacy-error" : "kiri-privacy-details"}
          />
          <span>[필수] 사전예약 개인정보 수집·이용에 동의합니다.</span>
        </label>
        <div id="kiri-privacy-details" className="kiri-consent__details">
          <dl>
            <div>
              <dt>운영 주체</dt>
              <dd>{dataController}</dd>
            </div>
            <div>
              <dt>수집 항목</dt>
              <dd>이메일(필수), 닉네임·사용 기기·가족 체험단 참여 의향(선택)</dd>
            </div>
            <div>
              <dt>이용 목적</dt>
              <dd>KIRI 출시 소식 안내 및 선택한 경우 가족 체험단 모집 안내</dd>
            </div>
            <div>
              <dt>보유 기간</dt>
              <dd>{retentionLabel}</dd>
            </div>
            <div>
              <dt>동의 거부</dt>
              <dd>동의를 거부할 수 있으며, 필수 동의를 거부하면 사전예약 신청이 어렵습니다.</dd>
            </div>
          </dl>
        </div>
        {errors.privacyAgreed && (
          <p id="kiri-privacy-error" className="kiri-field__error">
            {errors.privacyAgreed}
          </p>
        )}
      </div>

      <div className="kiri-honeypot" aria-hidden="true">
        <label htmlFor="kiri-company">회사명</label>
        <input
          id="kiri-company"
          name="company"
          type="text"
          value={values.company}
          onChange={updateValue}
          tabIndex="-1"
          autoComplete="off"
        />
      </div>

      {submitState.status === "error" && (
        <div className="kiri-form__notice" role="alert">
          <strong>저장하지 못했어요.</strong>
          <p>{submitState.message}</p>
          <span>입력 내용은 유지되어 있으니 잠시 후 다시 시도해주세요.</span>
        </div>
      )}

      <button
        className="kiri-submit"
        type="submit"
        disabled={!preregistration.ready || submitState.status === "submitting"}
      >
        {submitState.status === "submitting" ? (
          <>
            <span className="kiri-submit__spinner" aria-hidden="true" />
            저장 중
          </>
        ) : (
          <>
            출시 알림 신청하기
            <ArrowIcon />
          </>
        )}
      </button>

      <p className="kiri-form__footnote" aria-live="polite">
        {submitState.status === "submitting"
          ? submitState.message
          : "광고성 정보 수신 동의를 별도로 묶지 않습니다."}
      </p>
    </form>
  );
}

function KiriExperienceShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef([]);
  const activeStep = experienceSteps[activeIndex];

  const selectStep = (index, moveFocus = false) => {
    setActiveIndex(index);

    if (moveFocus) {
      requestAnimationFrame(() => tabRefs.current[index]?.focus());
    }
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % experienceSteps.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + experienceSteps.length) % experienceSteps.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = experienceSteps.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    selectStep(nextIndex, true);
  };

  return (
    <div className="kiri-showcase">
      <div className="kiri-showcase__tabs" role="tablist" aria-label="KIRI 서비스 경험 선택">
        {experienceSteps.map((step, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={step.number}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`kiri-experience-tab-${step.number}`}
              type="button"
              role="tab"
              data-experience-index={index}
              aria-selected={isActive}
              aria-controls="kiri-experience-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectStep(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {step.tabLabel}
            </button>
          );
        })}
      </div>

      <div
        key={activeStep.number}
        id="kiri-experience-panel"
        className="kiri-showcase__panel"
        role="tabpanel"
        aria-labelledby={`kiri-experience-tab-${activeStep.number}`}
      >
        <div className="kiri-showcase__copy">
          <h3>{activeStep.title}</h3>
          <p>{activeStep.description}</p>
        </div>
        <figure className="kiri-phone">
          <img src={activeStep.image} alt={activeStep.alt} />
        </figure>
      </div>
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

  usePageMeta({
    title: "KIRI — 우리 가족만의 취향, 우리 가족만의 시간",
    description:
      "질문으로 가족의 취향을 알아가고, 함께할 활동을 발견해 약속과 기록으로 이어가는 KIRI의 출시 소식을 신청하세요.",
    themeColor: "#1a1a1a",
  });

  return (
    <div className="editorial-shell kiri-page">
      <KiriHeader />

      <main>
        <section className="kiri-hero" aria-labelledby="kiri-hero-title">
          <div className="editorial-container kiri-hero__grid">
            <div className="kiri-hero__copy">
              <div className="kiri-hero__status">
                <span />
                출시 준비 중
              </div>
              <img
                className="kiri-hero__logo"
                src="/images/kiri/kiri-logo.svg"
                alt="KIRI"
                width="276"
                height="100"
              />
              <h1 id="kiri-hero-title">
                우리 가족만의 취향,
                <br />
                우리 가족만의 시간
              </h1>
              <p>
                서로의 취향을 알아가는 질문부터 함께할 활동의 발견, 약속과 기록까지.
                KIRI는 가족이 함께할 다음 시간을 구체적으로 만들어갑니다.
              </p>
              <a className="kiri-primary-button" href="#kiri-preregister">
                사전예약 준비 보기
                <ArrowIcon />
              </a>
            </div>

            <div className="kiri-hero__visual">
              <div className="kiri-hero__type" aria-hidden="true">KIRI</div>
              <figure className="kiri-phone kiri-phone--hero">
                <img src="/images/kiri/kiri-home.png" alt="KIRI 홈 화면" />
              </figure>
              <img
                className="kiri-hero__mascot"
                src="/images/kiri/kiri-mascot.svg"
                alt="KIRI 캐릭터"
                width="56"
                height="56"
              />
            </div>
          </div>
        </section>

        <section id="kiri-problem" className="kiri-problem editorial-section">
          <div className="editorial-container">
            <SectionLabel light>왜 KIRI인가요</SectionLabel>
            <div className="kiri-problem__lead">
              <h2>
                함께하고 싶은 마음은 있는데,
                <br />
                다음 장면이 잘 떠오르지 않을 때.
              </h2>
              <p>
                KIRI는 가족이라서 오히려 묻지 못했던 취향을 발견하고, 막연한 약속이
                구체적인 시간이 되도록 돕기 위해 시작했습니다.
              </p>
            </div>
            <div className="kiri-problem__moments">
              <article>
                <span>01</span>
                <p>가족이지만 서로 무엇을 좋아하는지 잘 모를 때가 있습니다.</p>
              </article>
              <article>
                <span>02</span>
                <p>부모님과 시간을 보내고 싶어도 무엇을 할지 막막합니다.</p>
              </article>
              <article>
                <span>03</span>
                <p>“다음에 같이 가자”는 말이 실제 약속으로 이어지기 어렵습니다.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="kiri-experience" className="kiri-experience editorial-section">
          <div className="editorial-container">
            <SectionLabel light>서비스 경험</SectionLabel>
            <div className="kiri-experience__heading">
              <h2>알아가는 질문이 함께한 하루의 기록이 되기까지</h2>
            </div>

            <KiriExperienceShowcase />
          </div>
        </section>

        <section id="kiri-preregister" className="kiri-preregister editorial-section">
          <div className="editorial-container kiri-preregister__grid">
            <div className="kiri-preregister__intro">
              <SectionLabel light>사전예약</SectionLabel>
              <h2>
                KIRI의 첫 소식을
                <br />
                가장 먼저 만나보세요.
              </h2>
              <p>
                접수가 시작되면 필요한 정보만 남기고 KIRI의 출시 소식을 받아볼 수 있어요.
              </p>
              <div className="kiri-preregister__aside">
                <span>수집하지 않는 정보</span>
                <p>전화번호 · 주소 · 생년월일 · 가족 구성원별 개인정보</p>
              </div>
            </div>
            <KiriPreregisterForm />
          </div>
        </section>

        <section className="kiri-company-link">
          <div className="editorial-container">
            <p>KIRI는 사람 사이의 계기를 만드는 HALO의 두 번째 서비스입니다.</p>
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
