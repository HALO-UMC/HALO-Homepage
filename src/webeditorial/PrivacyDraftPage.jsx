import { Link } from "react-router-dom";

import { ArrowIcon, CompanyWordmark } from "./shared.jsx";
import usePageMeta from "./usePageMeta.js";
import usePreregistrationStatus from "./usePreregistrationStatus.js";

export default function PrivacyDraftPage() {
  const preregistration = usePreregistrationStatus();
  usePageMeta({
    title: "KIRI 사전예약 개인정보 안내 — 정책 초안",
    description:
      "KIRI 사전예약에 적용할 개인정보 수집·이용 안내 초안입니다. 공개 전에 운영 주체와 보유 기간을 확정해야 합니다.",
    themeColor: "#f3efe6",
  });

  const retentionLabel =
    preregistration.policy?.retentionLabel ||
    import.meta.env.VITE_KIRI_PRIVACY_RETENTION_LABEL ||
    "공개 전 확정 필요";
  const dataController =
    preregistration.policy?.dataControllerName ||
    import.meta.env.VITE_KIRI_DATA_CONTROLLER_NAME ||
    "공개 전 확정 필요";

  return (
    <div className="editorial-shell privacy-draft-page">
      <header className="privacy-draft-header">
        <div className="editorial-container">
          <CompanyWordmark />
          <Link to="/kiri">
            KIRI로 돌아가기
            <ArrowIcon />
          </Link>
        </div>
      </header>

      <main className="editorial-container privacy-draft">
        <div className="privacy-draft__heading">
          <p>공개 전 확인이 필요한 정책 초안</p>
          <h1>KIRI 사전예약 개인정보 수집·이용 안내</h1>
          <p>
            이 문서는 기존 HALO 앱 개인정보 처리방침을 복사한 약관이 아닙니다. KIRI
            사전예약에 필요한 최소 수집 범위만 정리한 초안이며, 실제 접수를 열기 전에
            운영 주체·보유 기간·정책 버전을 확정해야 합니다.
          </p>
        </div>

        <div className="privacy-draft__notice" role="note">
          현재 상태: 정책 초안 · 서버는 정책 버전 환경변수가 없으면 접수를 성공 처리하지
          않습니다.
        </div>

        <div className="privacy-draft__sections">
          <section>
            <span>01</span>
            <div>
              <h2>운영 주체</h2>
              <p>{dataController}</p>
              <p className="privacy-draft__pending">
                공개 전 확정 필요: 실제 개인정보처리자의 정식 명칭과 문의 경로를 고지해야
                합니다.
              </p>
            </div>
          </section>
          <section>
            <span>02</span>
            <div>
              <h2>수집 항목</h2>
              <p>필수: 이메일, 개인정보 수집·이용 동의 여부와 동의 시각</p>
              <p>선택: 닉네임, 사용 기기, 가족 체험단 참여 의향</p>
              <p>수집하지 않음: 전화번호, 주소, 생년월일, 가족 구성원 각각의 개인정보</p>
            </div>
          </section>
          <section>
            <span>03</span>
            <div>
              <h2>이용 목적</h2>
              <p>KIRI 출시 소식 안내</p>
              <p>사용자가 선택한 경우 가족 체험단 모집 안내</p>
              <p>접수 중복 방지와 서비스 안정성 확보</p>
            </div>
          </section>
          <section>
            <span>04</span>
            <div>
              <h2>보유 기간</h2>
              <p>{retentionLabel}</p>
              <p className="privacy-draft__pending">
                공개 전 확정 필요: 출시 알림 이후의 파기 시점과 체험단 안내를 선택한 경우의
                보유 기준을 운영·법무 검토 후 고지해야 합니다.
              </p>
            </div>
          </section>
          <section>
            <span>05</span>
            <div>
              <h2>동의 거부 권리와 영향</h2>
              <p>
                사용자는 개인정보 수집·이용 동의를 거부할 수 있습니다. 다만 이메일과 필수
                동의가 없으면 출시 소식 전달을 위한 사전예약 신청을 처리할 수 없습니다.
              </p>
            </div>
          </section>
          <section>
            <span>06</span>
            <div>
              <h2>문의와 삭제 요청</h2>
              <p>
                현재 저장소에서 공식적으로 확인되는 연락처는
                halo.official.app@gmail.com입니다. KIRI 운영 주체의 최종 개인정보 문의
                연락처는 공개 전에 별도로 확정해야 합니다.
              </p>
              <a href="mailto:halo.official.app@gmail.com">halo.official.app@gmail.com</a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
