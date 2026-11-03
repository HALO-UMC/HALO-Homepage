# KIRI 사전예약 설정

사전예약은 `GET /api/kiri-preregister-status`가 Supabase 저장소와 서버 정책을 확인한 뒤
활성화됩니다. 제출은 `POST /api/kiri-preregister`에서 검증하고 저장 성공을 확인한 경우에만
완료로 응답합니다. 접수 목록 조회 API와 출시 알림 메일 발송은 제공하지 않습니다.

## 환경변수

| 변수 | 필수 | 용도 |
| --- | --- | --- |
| `SUPABASE_URL` | 예 | Supabase Project URL |
| `SUPABASE_SECRET_KEY` | 예 | 새 Supabase Secret key (`sb_secret_...`). 서버 전용이며 `VITE_`를 붙이지 않습니다. |
| `KIRI_RATE_LIMIT_SALT` | 아니요 | 요청 IP 해시용 서버 비밀값. 없으면 서버 인스턴스에서 임시 무작위 salt를 생성합니다. |
| `KIRI_ALLOWED_ORIGINS` | 아니요 | 허용 Origin 목록. 비우면 요청과 같은 Origin만 허용합니다. |
| `KIRI_PREREGISTER_TABLE` | 아니요 | 테이블 이름. 기본값 `kiri_preregistrations` |

개인정보처리자, 보유 기간, 수집·이용 문구와 정책 버전은 `api/kiri-policy.js`의 공통 서버
정책에서 관리합니다. 보유 기간이 확정되어 정책에 반영되기 전까지 상태 API는 접수를 열지
않습니다. 동의 문구는 이 정책 응답을 화면에 표시하고, 저장 행에는 같은 정책 버전·처리자·
보유 기간을 함께 기록합니다. 동의 내용이 변경되면 코드의 `policyVersion`도 올립니다.

## 적용 순서

1. Supabase Dashboard에서 사용할 프로젝트를 선택하고 Project URL과 새 Secret key를 확인합니다.
   기존 프로젝트가 없다면 Supabase에서 프로젝트를 생성합니다. 새 Secret key는 서버에서만
   사용하며 `apikey` 헤더에만 전송합니다.
2. Supabase Dashboard → SQL Editor에서 저장소의
   [`supabase/kiri-preregistrations.sql`](../supabase/kiri-preregistrations.sql)을 실행합니다.
   Table Editor에서 테이블, unique 제약, RLS 활성화를 확인합니다.
3. Vercel Project Settings → Environment Variables에서 `SUPABASE_URL`과
   `SUPABASE_SECRET_KEY`를 Production/Preview 등 사용할 환경에 직접 입력합니다. Secret key는
   채팅이나 소스 저장소에 넣지 않습니다. 보유 기간이 확정되면 `api/kiri-policy.js`의
   공통 정책 값으로 반영한 뒤 새 빌드를 배포해야 합니다.
4. 접수 상태 API가 `ready: true`인지 확인한 다음, 운영 신청과 구분되는 테스트 이메일로 한 번
   접수합니다. HTTP 201과 Supabase의 신규 행을 확인하고, 같은 이메일로 다시 요청해
   `duplicate` 응답과 행 미추가를 확인합니다. 운영 배포는 별도 요청 없이 진행하지 않습니다.

고정 salt가 필요하면 로컬 PowerShell에서 아래 명령을 실행해 무작위 32바이트 값을 클립보드로
복사하고 Vercel의 `KIRI_RATE_LIMIT_SALT`에 바로 붙여넣습니다. 명령은 값을 터미널에 출력하지
않습니다. 입력 후 클립보드를 비우고 값을 채팅·저장소에 복사하지 마세요.

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" | Set-Clipboard
```

고정 salt를 설정하지 않아도 요청 제한은 작동하지만 서버리스 인스턴스별 임시 salt를 사용합니다.
현재 제한은 인스턴스 메모리 기준 10분당 IP 해시 5회이며, 전역 제한은 아닙니다.

API는 이메일을 NFKC 정규화한 뒤 저장합니다. 데이터베이스의 unique 제약이 중복을 막고,
RLS와 권한 설정으로 브라우저의 직접 접근을 차단합니다. 실제 신청 목록은 Supabase
Dashboard → Table Editor → `kiri_preregistrations`에서 확인할 수 있습니다.
