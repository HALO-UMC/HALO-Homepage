import { Link, useLocation } from "react-router-dom";

import { KIRI_STORE_URLS } from "./kiriConfig.js";
import { getInviteAppUrl, parseInviteToken } from "./inviteConfig.js";
import { PAGE_METADATA } from "./pageMetadata.js";
import usePageMeta from "./usePageMeta.js";

import "./invite.css";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.8 12.7c0-2.4 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-1.9c-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9A4.9 4.9 0 0 0 4 9.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8s2.3-1.2 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9-.1 0-3-.9-3-4.2ZM14.3 5.5c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.4.7-3.2 1.6a4.5 4.5 0 0 0-1.1 3.2c1.2.1 2.5-.6 3.2-1.5Z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3.6 2.5 10.6 9.4v.2L3.6 21.5a2.3 2.3 0 0 1-.6-1.6V4.1c0-.7.2-1.2.6-1.6Zm11.8 10.6 2.7 2.4-11.4 6.4c-.6.3-1.1.4-1.6.2l10.3-9Zm3.9-2.2c1 .6 1 1.6 0 2.2l-1.8 1-2.9-2.1 2.9-2.1 1.8 1ZM6.7 2.1l11.4 6.4-2.7 2.4L5.1 1.9c.5-.2 1-.1 1.6.2Z" />
    </svg>
  );
}

function StoreLink({ children, href, icon }) {
  return (
    <a
      className="invite-store-link"
      href={href}
      target="_blank"
      rel="noreferrer"
      referrerPolicy="no-referrer"
    >
      {icon}
      <span>{children}</span>
      <ArrowIcon />
    </a>
  );
}

export default function InvitePage() {
  const { pathname } = useLocation();
  const token = parseInviteToken(pathname);
  const appUrl = token
    ? getInviteAppUrl(token, window.navigator.userAgent)
    : null;

  usePageMeta(PAGE_METADATA.invite);

  return (
    <main className="invite-page">
      <div className="invite-page__glow" aria-hidden="true" />

      <section className="invite-card" aria-labelledby="invite-title">
        <Link className="invite-card__brand" to="/kiri" aria-label="끼리 소개 페이지">
          <img
            src="/images/kiri/kiri-logo.svg"
            alt="KIRI"
            width="276"
            height="100"
          />
        </Link>

        <div className="invite-card__eyebrow">FAMILY INVITATION</div>
        <h1 id="invite-title">가족 초대가 도착했어요</h1>

        {token ? (
          <>
            <p className="invite-card__description">
              끼리 앱에서 초대를 확인하고 가족 공간에 참여해 보세요.
            </p>

            <a
              className="invite-open-button"
              href={appUrl}
              referrerPolicy="no-referrer"
            >
              <span>끼리 앱에서 열기</span>
              <ArrowIcon />
            </a>

            <div className="invite-divider" aria-hidden="true">
              <span>앱이 없다면</span>
            </div>
          </>
        ) : (
          <p className="invite-card__error" role="alert">
            가족에게 받은 초대 링크 전체를 다시 열어 주세요
          </p>
        )}

        <div className="invite-store-links" aria-label="끼리 앱 다운로드">
          <StoreLink href={KIRI_STORE_URLS.appStore} icon={<AppleIcon />}>
            App Store에서 다운로드
          </StoreLink>

          {KIRI_STORE_URLS.googlePlay ? (
            <StoreLink
              href={KIRI_STORE_URLS.googlePlay}
              icon={<GooglePlayIcon />}
            >
              Google Play에서 다운로드
            </StoreLink>
          ) : (
            <div
              className="invite-store-link invite-store-link--disabled"
              aria-disabled="true"
            >
              <GooglePlayIcon />
              <span>Google Play 다운로드 준비 중</span>
            </div>
          )}
        </div>

        {token && (
          <p className="invite-card__help">
            앱을 설치한 뒤, 받은 초대 링크를 다시 눌러 주세요.
          </p>
        )}
      </section>

      <p className="invite-page__footer">KIRI · 우리 가족이 함께하는 시간</p>
    </main>
  );
}
