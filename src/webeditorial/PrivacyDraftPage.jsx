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

  const policy = preregistration.policy;

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
            이 안내는 KIRI 사전예약을 위한 개인정보 수집·이용 내용입니다. 화면 동의문과
            신청 기록은 서버 공통 정책을 함께 사용합니다.
          </p>
        </div>

        <div className="privacy-draft__notice" role="note">
          {preregistration.ready
            ? `적용 정책 버전: ${policy?.policyVersion}`
            : "보유 기간을 확정하고 Supabase 연결을 마치기 전까지 접수는 비활성화됩니다."}
        </div>

        <div className="privacy-draft__sections">
          <section>
            <span>01</span>
            <div>
              <h2>운영 주체</h2>
              <p>{policy?.dataControllerName || "할로(HALO)"}</p>
              <p>대표자: {policy?.dataControllerRepresentative || "이남혁"}</p>
            </div>
          </section>
          <section>
            <span>02</span>
            <div>
              <h2>수집 항목</h2>
              <p>{policy?.collectionItems || "이메일(필수), 닉네임·사용 기기·가족 체험단 참여 의향(선택)"}</p>
              <p>동의 여부·동의 시각과 적용 정책 버전도 함께 기록합니다.</p>
              <p>수집하지 않음: 전화번호, 주소, 생년월일, 가족 구성원 각각의 개인정보</p>
            </div>
          </section>
          <section>
            <span>03</span>
            <div>
              <h2>이용 목적</h2>
              <p>{policy?.processingPurpose || "KIRI 출시 소식 안내 및 선택한 경우 가족 체험단 모집 안내"}</p>
              <p>중복 접수 방지와 사전예약 저장을 위해 사용합니다.</p>
            </div>
          </section>
          <section>
            <span>04</span>
            <div>
              <h2>보유 기간</h2>
              <p>{policy?.retentionLabel || "보유 기간 결정 후 표시됩니다."}</p>
              <p>정한 기간이 지나거나 처리 목적을 달성해 불필요해진 정보는 파기합니다.</p>
            </div>
          </section>
          <section>
            <span>05</span>
            <div>
              <h2>동의 거부 권리와 영향</h2>
              <p>
                {policy?.consentRefusal ||
                  "동의를 거부할 수 있으며, 필수 동의를 거부하면 사전예약 신청이 어렵습니다."}
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
          <section>
            <span>07</span>
            <div>
              <h2>안내 버전</h2>
              <p>{policy?.policyVersion || "접수 정책 준비 중"}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
