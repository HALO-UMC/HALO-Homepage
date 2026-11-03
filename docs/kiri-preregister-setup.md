# KIRI 사전예약 저장소 연결

브라우저는 먼저 `GET /api/kiri-preregister-status`에서 정책·저장소 준비 상태를 확인합니다.
준비되지 않은 경우 입력 필드를 렌더링하지 않고 `사전예약 접수 준비 중` 상태만 표시합니다.
준비된 경우에만 `POST /api/kiri-preregister`로 제출합니다.

API는 Supabase Secret key를 서버에서만 사용합니다. 새 `sb_secret_...` 키는 JWT가 아니므로
`apikey` 헤더로만 전송합니다. 접수 목록 조회 API는 제공하지 않으며, 브라우저에는 준비 여부와
공개 가능한 정책 문구만 반환합니다.

## 환경변수 구분

| 변수 | 범위 | 비밀값 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| `VITE_KIRI_DATA_CONTROLLER_NAME` | 프론트 공개 | 아니요 | 권장 | 빌드 시 화면에 포함되는 운영 주체 fallback 문구. 서버 상태 응답이 우선합니다. |
| `VITE_KIRI_PRIVACY_RETENTION_LABEL` | 프론트 공개 | 아니요 | 권장 | 빌드 시 화면에 포함되는 보유 기간 fallback 문구. 서버 상태 응답이 우선합니다. |
| `SUPABASE_URL` | 서버 전용 설정 | 아니요 | 예 | Supabase Project URL |
| `SUPABASE_SECRET_KEY` | 서버 전용 | **예** | 새 키 사용 시 | Supabase 새 Secret key (`sb_secret_...`). `VITE_` 접두사를 절대 붙이지 않습니다. |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | **예** | 이전 키 사용 시 | 기존 JWT service_role 키 호환용. 새 Secret key를 쓰면 설정하지 않습니다. |
| `KIRI_PREREGISTER_TABLE` | 서버 전용 설정 | 아니요 | 아니요 | 기본값 `kiri_preregistrations` |
| `KIRI_PRIVACY_POLICY_VERSION` | 서버 전용 설정·공개 가능 | 아니요 | 예 | 사용자가 동의한 정책 버전. DB에 저장됩니다. |
| `KIRI_DATA_CONTROLLER_NAME` | 서버 전용 설정·공개 가능 | 아니요 | 예 | 확정된 개인정보처리자 정식 명칭. 상태 API와 DB에 반영됩니다. |
| `KIRI_PRIVACY_RETENTION_LABEL` | 서버 전용 설정·공개 가능 | 아니요 | 예 | 동의 화면에 표시할 확정 보유 기간. DB에 함께 저장됩니다. |
| `KIRI_ALLOWED_ORIGINS` | 서버 전용 설정 | 아니요 | 아니요 | 쉼표로 구분한 정확한 Origin 목록. 비우면 요청 Host와 같은 Origin만 허용합니다. |
| `KIRI_RATE_LIMIT_SALT` | 서버 전용 | **예** | 예 | 요청 IP를 메모리에서 해시할 긴 무작위 값 |

비밀값은 채팅이나 소스 코드에 붙여넣지 않습니다. 로컬은 `.env.local`, 배포 환경은 Vercel
Project Settings → Environment Variables에 직접 입력합니다.

## Origin 설정

- 로컬 Vercel 개발 서버가 `http://localhost:3000`이면 해당 Origin을 추가합니다.
- 운영 도메인은 스킴을 포함한 정확한 Origin을 추가합니다. 경로와 마지막 `/`는 넣지 않습니다.
- Preview 배포에서도 실제 접수를 시험할 때만 해당 Preview Origin을 명시적으로 추가합니다.
- `KIRI_ALLOWED_ORIGINS`를 비우면 동일 Host의 same-origin 요청만 허용하므로 일반적인 단일
  도메인 배포에는 안전한 기본값으로 사용할 수 있습니다.

## 보안 및 속도 제한 범위

- 이메일은 서버에서 NFKC 정규화, 공백 제거, 소문자 변환 후 저장합니다.
- DB의 unique 제약이 정규화 이메일 중복을 최종 차단합니다.
- `anon`, `authenticated`, `public`의 테이블 권한을 회수하고 RLS를 활성화합니다.
- 서비스 키는 API 함수에서만 읽으며 Vite 클라이언트 번들에 포함되지 않습니다.
- 현재 속도 제한은 서버리스 인스턴스 메모리에서 IP 해시별 10분 5회입니다. 인스턴스·리전
  사이에 공유되지 않고 cold start 때 초기화되므로 기본 방어일 뿐 전역 제한이 아닙니다.
  운영 트래픽이 커지면 Upstash Redis 또는 Supabase 기반 원자적 rate-limit 저장소로
  교체해야 합니다.

## 외부 설정 순서

### 1. Supabase에서 할 일

1. 사용할 Supabase 프로젝트를 선택하거나 생성합니다.
2. Project Settings → API Keys에서 Project URL과 새 Secret key (`sb_secret_...`)를 확인합니다.
3. 키는 복사 후 로컬 `.env.local` 또는 Vercel 환경변수 화면에 직접 입력합니다.

### 2. SQL 적용 방법

1. Supabase Dashboard → SQL Editor → New query를 엽니다.
2. `supabase/kiri-preregistrations.sql` 전체를 붙여넣고 실행합니다.
3. Table Editor에서 `kiri_preregistrations` 테이블과 unique 제약을 확인합니다.
4. RLS가 활성화됐고 anon/authenticated용 읽기 정책이 없는지 확인합니다.

### 3. 로컬·Vercel 환경변수 설정

1. 운영 주체, 보유 기간, 정책 버전을 먼저 확정합니다.
2. 로컬에서는 `.env.example`을 참고해 추적되지 않는 `.env.local`에 값을 입력합니다.
3. Vercel에서는 Project Settings → Environment Variables에 같은 값을 직접 입력합니다.
4. `SUPABASE_SECRET_KEY`, `KIRI_RATE_LIMIT_SALT`에는 `VITE_` 접두사를 붙이지 않습니다.
5. 새 Secret key는 서버 환경변수 `SUPABASE_SECRET_KEY`에만 저장합니다. API가 `sb_secret_` 키를
   `Authorization: Bearer`에 보내지 않고 `apikey` 헤더에만 전달합니다.

### 4. 설정 변경 후 재배포

Vite의 `VITE_*` 값은 빌드 시 번들에 포함되므로 변경 후 반드시 다시 빌드·배포해야 합니다.
Vercel 서버 환경변수 변경도 기존 배포에 자동 반영되지 않으므로 새 배포가 필요합니다.

### 5. 정상·중복 접수 확인

1. 상태 API가 `ready: true`인지 확인합니다.
2. 실제 운영 데이터와 구분되는 전용 테스트 이메일로 한 번 제출합니다.
3. HTTP 201, `status: created`와 Supabase의 신규 행 1개를 확인합니다.
4. 같은 이메일의 대소문자와 앞뒤 공백을 바꿔 다시 제출합니다.
5. HTTP 200, `status: duplicate`가 반환되고 DB 행이 추가되지 않았는지 확인합니다.
6. 테스트가 끝나면 운영 정책에 따라 테스트 행을 관리자 화면에서 명시적으로 정리합니다.

접수 저장과 출시 알림 메일 발송은 분리되어 있습니다. 이 구현은 이메일을 자동 발송하지
않습니다.
