// @ts-check

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { partners, partnershipStatuses } from "../data/companyData.js";
import { collaborationTypes, contactFields, identityFields, proposalFields, validateInquiry } from "../data/partnershipForm.js";
import { CompanyHeader } from "./CompanyPage.jsx";
import { corporateMetadata } from "./pageMetadata.js";
import { ArrowIcon, EditorialFooter } from "./shared.jsx";
import usePageMeta from "./usePageMeta.js";

function CorporateLayout({ children }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("corporate-content")?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="editorial-shell company-page halo-corporate">
      <a className="halo-skip" href="#corporate-content">본문으로 건너뛰기</a>
      <CompanyHeader />
      <main className="halo-subpage" id="corporate-content" tabIndex={-1}>{children}</main>
      <EditorialFooter />
    </div>
  );
}

function PartnerGallery({ partner }) {
  const wellness = partner.slug === "sheimspa";
  return (
    <section className="editorial-container partner-story-section partner-media">
      <h2>{wellness ? "공간 살펴보기" : "제품과 설치 환경"}</h2>
      {partner.gallery.length ? (
        <div className="partner-gallery">
          {partner.gallery.map(({ src, alt }) => <img key={src} src={src} alt={alt} loading="lazy" />)}
        </div>
      ) : (
        <a className="halo-text-link" href={partner.website}>
          {wellness ? "한국관광공사 아쿠아필드 고양 사진과 공간 안내" : "시니허그 공식 제품·설치 사진 보기"}
        </a>
      )}
    </section>
  );
}

function PartnerFollowup({ partner, title, detail, action, sourceLabel }) {
  return (
    <section className="partner-followup">
      <div className="editorial-container">
        <p className="halo-eyebrow">진행 현황</p>
        <h2>{title}</h2>
        <p>{detail}</p>
        <div className="halo-actions">
          <Link className="halo-button" to="/partnership">{action}</Link>
          <a className="halo-text-link" href={partner.website}>{sourceLabel}</a>
        </div>
      </div>
    </section>
  );
}

function PartnerVisual({ partner }) {
  if (!partner.conceptImage) return null;
  return (
    <figure className="partner-visual">
      <img src={partner.conceptImage.src} alt={partner.conceptImage.alt} fetchPriority="high" />
    </figure>
  );
}

function SheimspaStory({ partner }) {
  return (
    <>
      <section className="editorial-container partner-wellness-hero">
        <div className="partner-intro">
          <p className="halo-eyebrow">{partner.field}</p>
          <p className="partner-identity">{partner.name} <span>· {partnershipStatuses[partner.status]}</span></p>
          <h1>{partner.title}</h1>
          <p>각자에게 필요한 휴식과 함께 나누는 시간을 한 번의 외출에 담을 수 있을까요? HALO는 웰니스 공간에서 가족이 자기 속도로 쉬고 대화하는 하루를 구상합니다.</p>
        </div>
        <PartnerVisual partner={partner} />
      </section>

      <section className="partner-story-section halo-tinted">
        <div className="editorial-container halo-split">
          <div><p className="halo-eyebrow">공간과 서비스</p><h2>일상 가까이에서 쉬어갈 수 있는 공간</h2></div>
          <div>
            <p>쉼스파는 아쿠아필드 고양 찜질스파 안에 있는 에스테틱 공간입니다. 한국관광공사는 전문 테라피스트가 마사지와 스톤을 활용한 케어 등을 제공하는 곳으로 소개합니다.</p>
            <p>HALO는 가족이 함께할 활동을 발견하고 약속과 기록으로 이어가는 흐름을 끼리에서 만들고 있습니다. 이 경험을 웰니스 공간으로 확장한다면, 보호자와 자녀가 각자 편한 방식으로 쉰 뒤 다시 만나 이야기를 나누는 하루를 기획할 수 있습니다.</p>
          </div>
        </div>
      </section>

      <section className="editorial-container partner-story-section">
        <p className="halo-eyebrow">프로그램 기획안</p>
        <h2>한 번의 방문을 가족의 기억으로</h2>
        <p>엄마와 딸, 부모와 자녀가 함께 방문하는 경우를 가정한 체험 예시입니다. 이용 연령, 동반 가능 여부, 실제 동선과 소요 시간은 공간 운영 기준을 확인한 뒤 정할 항목입니다.</p>
        <ol className="partner-program">
          <li><h3>가기 전, 서로의 취향 알기</h3><p>조용한 휴식과 대화 중 무엇이 더 기대되는지 이야기하고, 각자의 속도에 맞춰 일정을 정합니다.</p></li>
          <li><h3>현장에서, 각자 쉬고 다시 만나기</h3><p>연령과 상황에 맞는 휴식 옵션을 고르고, 함께 쉬거나 잠시 각자의 시간을 보낸 뒤 만나는 동선을 구상합니다.</p></li>
          <li><h3>돌아온 뒤, 오늘을 남기기</h3><p>서로가 고른 가장 편안했던 순간을 사진과 한 줄로 남기고, 다음 가족 약속을 정합니다.</p></li>
        </ol>
      </section>
      <PartnerGallery partner={partner} />
      <PartnerFollowup partner={partner} title="가족 웰니스 프로그램 검토"
        detail="공동 체험의 일정, 가격, 신청 방법은 확정되면 안내합니다. 지금은 가족 체험 또는 공간 제휴 제안을 문의할 수 있습니다."
        action="가족 체험 프로그램 문의" sourceLabel="한국관광공사 쉼스파 소개" />
    </>
  );
}

function SeniHugStory({ partner }) {
  return (
    <>
      <section className="partner-care-hero">
        <div className="editorial-container partner-care-grid">
          <div className="partner-intro">
            <p className="halo-eyebrow">{partner.field}</p>
            <p className="partner-identity">{partner.name} <span>· {partnershipStatuses[partner.status]}</span></p>
            <h1>{partner.title}</h1>
            <p>부모님이 공유에 동의한 생활 신호가 안부를 묻는 계기가 될 수 있습니다. 시니허그의 비접촉 기술과 HALO의 가족 대화 경험을 연결하는 방법을 살펴봅니다.</p>
          </div>
          <PartnerVisual partner={partner} />
        </div>
      </section>

      <section className="editorial-container partner-story-section partner-care-overview">
        <div>
          <p className="halo-eyebrow">시그코퍼레이션 · SeniHug</p>
          <h2>생활 공간에 설치하는 비접촉 센서</h2>
          <p>시그코퍼레이션은 시니어 케어 시스템 시니허그를 선보입니다. 공식 제품 안내에 따르면 센서를 매트리스 아래에 설치하며, 피부에 닿는 착용 기기 없이 심박과 호흡 신호를 감지합니다.</p>
        </div>
        <dl className="partner-care-facts">
          <div><dt>설치 방식</dt><dd>매트리스 아래에 센서를 두는 방식</dd></div>
          <div><dt>제품 안내</dt><dd>센싱 데이터와 보호자 연동 기능 소개</dd></div>
          <div><dt>가족 적용 검토</dt><dd>부모님 동의, 데이터 공유 범위, 설치 지원과 문의 절차</dd></div>
        </dl>
      </section>

      <section className="partner-story-section partner-care-context">
        <div className="editorial-container halo-split">
          <div><p className="halo-eyebrow">가족 서비스 제안</p><h2>일상의 변화에서 안부 대화로</h2></div>
          <div>
            <p>가족은 부모님과 떨어져 지낼 때 언제 연락하면 좋을지, 어떤 이야기를 꺼내면 좋을지 망설이곤 합니다. HALO는 질문과 기록으로 대화를 시작하는 경험을 만들어 왔습니다. 여기에 부모님이 선택해 공유한 생활 정보를 더한다면 “요즘 잠은 좀 어떠세요?”처럼 구체적인 안부를 나눌 계기를 만들 수 있습니다.</p>
            <p>공유 빈도와 대상은 부모님이 선택하고, 가족은 확인이 필요할 때 직접 연락하는 흐름을 검토합니다. 일상 속 사용 경험과 개인정보에 대한 부담을 함께 살펴보는 것이 중요합니다.</p>
          </div>
        </div>
      </section>

      <section className="editorial-container partner-story-section partner-pilot">
        <div><p className="halo-eyebrow">가족 대상 실증 구상</p><h2>설치부터 대화까지, 가족이 실제로 쓸 수 있는지</h2></div>
        <ol>
          <li><strong>설치와 동의</strong><p>침대 환경에서 설치에 필요한 안내를 확인하고, 부모님이 정보 공유 범위를 이해하고 선택하는지 살핍니다.</p></li>
          <li><strong>가족의 사용 경험</strong><p>부모님과 자녀가 같은 안내를 어떻게 받아들이는지, 안부를 나누는 데 어떤 도움이 되는지 확인합니다.</p></li>
          <li><strong>사용 후 피드백</strong><p>부담스러운 안내, 해석이 어려운 정보, 공유를 중지할 때 필요한 절차를 확인합니다.</p></li>
        </ol>
      </section>
      <PartnerGallery partner={partner} />
      <PartnerFollowup partner={partner} title="가족 체험과 기술 연동 가능성 검토"
        detail="공동 프로젝트와 가족 대상 파일럿 모집은 확정 후 안내합니다. 기술 제휴와 체험 기획에 대한 문의를 받고 있습니다."
        action="파일럿·기술 협력 문의" sourceLabel="시니허그 공식 홈페이지" />
    </>
  );
}

export function PartnerPage({ slug }) {
  const partner = partners.find((item) => item.slug === slug);
  usePageMeta(corporateMetadata[`/partners/${slug}`]);
  const Story = slug === "sheimspa" ? SheimspaStory : SeniHugStory;

  return (
    <CorporateLayout>
      <div className="partner-story">
        <div className="editorial-container partner-back"><a className="halo-text-link" href="/#partners">파트너십 목록</a></div>
        <Story partner={partner} />
      </div>
    </CorporateLayout>
  );
}

const emailLink = "mailto:halo.official.app@gmail.com";

function PrivacyNotice({ policy }) {
  return (
    <details id="inquiry-privacy" className="halo-privacy">
      <summary>제휴·입점 문의 개인정보 처리 안내</summary>
      <dl>
        <dt>개인정보처리자</dt><dd>할로(HALO) · 대표자 이남혁</dd>
        <dt>수집 항목</dt><dd>기업명, 담당자 이름, 연락처 또는 이메일 중 하나, 협업 유형을 수집합니다. 제휴 제안과 홈페이지·SNS 주소는 선택 항목입니다. 접수 시 동의 시각과 고지 버전을 기록하며, 남용 방지를 위해 IP와 회신 수단의 일방향 변환값 및 접수 시각을 사용합니다.</dd>
        <dt>이용 목적</dt><dd>제휴·입점 제안 검토, 회신, 문의 이력 관리 및 접수 남용 방지</dd>
        <dt>보유 기간</dt><dd>문의 접수일로부터 {policy.retentionDays}일. 남용 방지 기록은 접수 제한에 1일간 사용하며 정기 정리 작업에서 삭제합니다.</dd>
        <dt>동의 거부</dt><dd>동의를 거부할 수 있으며, 필수 동의가 없으면 온라인으로 문의를 접수할 수 없습니다.</dd>
        <dt>개인정보 문의</dt><dd><a href={emailLink}>halo.official.app@gmail.com</a></dd>
      </dl>
    </details>
  );
}

function InquiryInput({ field, value, onChange, error, optional = false, contact = false }) {
  const { name, label, type, required, max, autoComplete, placeholder } = field;
  const props = {
    id: `inquiry-${name}`, name, required, value: value ?? "",
    onChange: (event) => onChange(name, event.target.value),
    "aria-invalid": Boolean(error),
    "aria-describedby": [contact && "inquiry-contact-help", error && `error-${name}`].filter(Boolean).join(" ") || undefined,
  };

  return (
    <label className={type === "textarea" || optional ? "halo-field-wide" : undefined}>
      <span>{label} {required && <small>필수</small>}{optional && <small>선택</small>}</span>
      {type === "textarea" ? <textarea {...props} maxLength={max} rows={3} /> :
        <input {...props} type={type || "text"} maxLength={max} autoComplete={autoComplete} placeholder={placeholder} />}
      {error && <span className="halo-error" id={`error-${name}`}>{error}</span>}
    </label>
  );
}

export function PartnershipPage() {
  usePageMeta(corporateMetadata["/partnership"]);
  const [values, setValues] = useState({});
  const [types, setTypes] = useState([]);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [notice, setNotice] = useState("");
  const [policy, setPolicy] = useState(null);
  const [status, setStatus] = useState("loading");
  const [statusAttempt, setStatusAttempt] = useState(0);
  const [result, setResult] = useState("idle");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const outcome = useRef(null);
  const inFlight = useRef(false);
  const requestId = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/partnership-inquiry", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!data.policy?.version || !Number.isInteger(data.policy.retentionDays)) throw new Error();
        if (controller.signal.aborted) return;
        setPolicy(data.policy);
        setStatus("available");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("unavailable");
      });
    return () => controller.abort();
  }, [statusAttempt]);

  useEffect(() => {
    if (result === "success" || result === "failure") outcome.current?.focus();
  }, [result]);

  function updateValue(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
      ...(name === "email" || name === "phone" ? { reply: undefined } : {}),
    }));
    requestId.current = null;
  }

  function checkAvailability() {
    setStatus("loading");
    setStatusAttempt((attempt) => attempt + 1);
  }

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current || status !== "available" || !policy) return;
    const problems = validateInquiry(values, types, consent);
    setErrors(problems);
    if (Object.keys(problems).length) {
      const first = Object.keys(problems)[0];
      requestAnimationFrame(() => document.getElementById(`inquiry-${first === "reply" ? "phone" : first}`)?.focus());
      return;
    }

    inFlight.current = true;
    setResult("sending");
    setNotice("");
    try {
      requestId.current ??= crypto.randomUUID();
      const response = await fetch("/api/partnership-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId.current, values, types, consent, honeypot, version: policy.version }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (response.status === 409 && data.code === "POLICY_CHANGED") {
          setConsent(false);
          requestId.current = null;
          checkAvailability();
        }
        setNotice(data.message || "문의를 접수하지 못했습니다. 잠시 후 다시 제출해 주세요.");
        setResult("failure");
        return;
      }
      setResult("success");
      setValues({});
    } catch {
      setNotice("연결 상태를 확인한 후 다시 제출해 주세요.");
      setResult("failure");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <CorporateLayout>
      <section className="halo-subhero halo-tinted">
        <div className="editorial-container">
          <a className="halo-text-link" href="/#partnership">← HALO 제휴 안내</a>
          <p className="halo-eyebrow">Partnership</p>
          <h1 id="partnership-title">제휴·입점 문의</h1>
          <p>함께하고 싶은 일을 알려주시면 남겨주신 연락처로 회신드립니다.</p>
        </div>
      </section>
      <div className="editorial-container halo-form-layout">
        {result === "success" ? (
          <section className="halo-form-card">
            <h2 ref={outcome} tabIndex={-1}>문의가 접수되었습니다</h2>
            <p>남겨주신 연락처로 회신드리겠습니다.</p>
            <Link className="halo-button" to="/">HALO 홈페이지 <ArrowIcon /></Link>
          </section>
        ) : (
          <form className="halo-form-card" aria-labelledby="partnership-title" aria-busy={result === "sending"} onSubmit={submit} noValidate>
            {status === "loading" && <p role="status" className="halo-form-note">온라인 접수 상태를 확인하고 있습니다.</p>}
            {status === "unavailable" && (
              <div className="halo-form-note">
                <p role="status">현재 온라인 접수를 이용할 수 없습니다.</p>
                <div className="halo-actions">
                  <button className="halo-button halo-button--outline" type="button" onClick={checkAvailability}>접수 상태 다시 확인</button>
                  <a className="halo-text-link" href={emailLink}>이메일 문의</a>
                </div>
              </div>
            )}
            <fieldset disabled={result === "sending"}>
              <div className="halo-fields">
                {identityFields.map((field) => <InquiryInput key={field.name} field={field} value={values[field.name]} onChange={updateValue} error={errors[field.name]} />)}
              </div>

              <fieldset className="halo-contact-fields">
                <legend>회신 받을 연락처 <small>필수</small></legend>
                <p id="inquiry-contact-help" className={errors.reply ? "halo-error" : undefined}>연락처 또는 이메일 중 하나를 입력해 주세요.</p>
                <div className="halo-fields">
                  {contactFields.map((field) => <InquiryInput key={field.name} field={field} value={values[field.name]} onChange={updateValue} error={errors[field.name]} contact />)}
                </div>
              </fieldset>

              <fieldset className="halo-options" aria-describedby={errors.types ? "error-types" : undefined}>
                <legend>협업 희망 유형 <small>필수 · 복수 선택 가능</small></legend>
                {collaborationTypes.map((type, index) => (
                  <label key={type}>
                    <input id={index === 0 ? "inquiry-types" : undefined} type="checkbox" checked={types.includes(type)} onChange={(event) => {
                      setTypes((previous) => event.target.checked ? [...previous, type] : previous.filter((item) => item !== type));
                      setErrors((previous) => ({ ...previous, types: undefined }));
                      requestId.current = null;
                    }} />
                    {type}
                  </label>
                ))}
                {errors.types && <p className="halo-error" id="error-types">{errors.types}</p>}
              </fieldset>

              <div className="halo-fields">
                {proposalFields.map((field) => <InquiryInput key={field.name} field={field} value={values[field.name]} onChange={updateValue} error={errors[field.name]} optional />)}
              </div>

              {policy && <PrivacyNotice policy={policy} />}
              <div className="halo-consent">
                <label>
                  <input id="inquiry-consent" name="consent" type="checkbox" checked={consent} required disabled={status !== "available"}
                    aria-describedby={errors.consent ? "error-consent" : undefined} aria-invalid={Boolean(errors.consent)}
                    onChange={(event) => {
                      setConsent(event.target.checked);
                      setErrors((previous) => ({ ...previous, consent: undefined }));
                    }} />
                  개인정보 처리 안내를 확인했고 수집·이용에 동의합니다 <small>필수</small>
                </label>
                {errors.consent && <p className="halo-error" id="error-consent">{errors.consent}</p>}
              </div>
              <div hidden><label>웹사이트 확인<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} /></label></div>
            </fieldset>
            {notice && <p className="halo-error" role="alert" ref={outcome} tabIndex={-1}>{notice}</p>}
            <div className="halo-actions">
              <button className="halo-button halo-inquiry-submit" type="submit" disabled={result === "sending" || status !== "available"}>
                {result === "sending" ? "제출 중…" : "문의 제출"} <ArrowIcon />
              </button>
            </div>
          </form>
        )}
      </div>
    </CorporateLayout>
  );
}
