import { Link } from "react-router-dom";

export function ArrowIcon({ direction = "right" }) {
  return (
    <svg
      aria-hidden="true"
      className={direction === "up-right" ? "arrow-up-right" : ""}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
    >
      <path d="M4 12h15" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m14 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function CompanyWordmark({ light = false }) {
  return (
    <Link
      to="/"
      className={`company-wordmark${light ? " company-wordmark--light" : ""}`}
      aria-label="HALO 회사 홈페이지"
    >
      <span>HALO</span>
      <small>COMPANY</small>
    </Link>
  );
}

export function SectionLabel({ number, children, light = false }) {
  const className = [
    "section-label",
    light ? "section-label--light" : "",
    number ? "" : "section-label--plain",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {number && <span>{number}</span>}
      <p>{children}</p>
    </div>
  );
}

export function EditorialFooter({ variant = "company" }) {
  const isKiri = variant === "kiri";

  return (
    <footer className={`editorial-footer editorial-footer--${variant}`}>
      <div className="editorial-container editorial-footer__grid">
        <div>
          {isKiri ? (
            <img
              className="editorial-footer__kiri-logo"
              src="/images/kiri/kiri-logo.svg"
              alt="KIRI"
              width="276"
              height="100"
            />
          ) : (
            <p className="editorial-footer__name">HALO</p>
          )}
        </div>

        <div className="editorial-footer__links">
          <div>
            <p className="editorial-footer__label">바로가기</p>
            <Link to="/">HALO 회사</Link>
            <Link to="/halo">HALO 앱</Link>
            <Link to="/kiri">KIRI</Link>
          </div>
          <div>
            <p className="editorial-footer__label">문의</p>
            <a href="mailto:halo.official.app@gmail.com">
              halo.official.app@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="editorial-container editorial-footer__business">
        <span>상호명 할로(HALO)</span>
        <span>대표자 이남혁</span>
        <span>사업자등록번호 624-21-02643</span>
      </div>

      <div className="editorial-container editorial-footer__bottom">
        <span>© {new Date().getFullYear()} HALO</span>
      </div>
    </footer>
  );
}
