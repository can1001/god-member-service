# god-member-service

## 프로젝트 개요

하나님나라연구소 회원·회비·후원금 통합 관리 시스템

## 스택

- Next.js 14 App Router, TypeScript strict mode
- Neon PostgreSQL + Prisma ORM
- Tailwind CSS + shadcn/ui
- Anthropic Claude API (claude-sonnet-4-20250514)
- 배포: Render

## 디렉토리 구조

```
src/
├── app/
│   ├── (main)/           # 관리자 대시보드 (사이드바 포함)
│   │   ├── dashboard/
│   │   ├── members/
│   │   │   └── new/
│   │   ├── fees/
│   │   ├── donations/
│   │   └── ai/
│   ├── (public)/         # 공개 페이지 (로그인 불필요)
│   │   └── join/
│   ├── (auth)/           # 인증 관련 페이지
│   │   ├── login/
│   │   └── set-password/
│   ├── (portal)/         # 회원 포털 (로그인 필요)
│   │   └── my/
│   │       ├── page.tsx        # 대시보드
│   │       ├── profile/        # 내 정보
│   │       ├── fees/           # 회비 내역
│   │       ├── donations/      # 후원 내역
│   │       └── payment/        # 결제 페이지
│   │           ├── billing/    # 빌링키 등록
│   │           ├── success/
│   │           └── fail/
│   ├── actions/          # Server Actions
│   │   ├── members.ts
│   │   ├── fees.ts
│   │   ├── donations.ts
│   │   └── auth.ts       # 인증 액션 (로그인/로그아웃/비밀번호)
│   ├── api/
│   │   ├── ai/route.ts
│   │   └── payment/      # 토스페이먼츠 결제 API
│   │       └── billing/
│   └── lib/
│       ├── prisma.ts     # Prisma 싱글톤
│       ├── receipt.ts    # 영수증 번호 자동 채번
│       ├── session.ts    # JWT 세션 관리
│       └── utils.ts      # formatAmount, formatDate, calcAge
├── components/
│   ├── client/           # "use client" 컴포넌트
│   │   ├── Charts.tsx
│   │   ├── MemberDialog.tsx
│   │   ├── DonationDialog.tsx
│   │   ├── AiChat.tsx
│   │   ├── LoginForm.tsx
│   │   └── SetPasswordForm.tsx
│   └── server/           # Server 컴포넌트
│       ├── Sidebar.tsx
│       └── StatCard.tsx
├── middleware.ts         # 라우트 보호 미들웨어
```

## 코딩 규칙

- DB 변경은 반드시 app/actions/ Server Action 사용
- 조회는 Server Component에서 직접 prisma 호출
- 클라이언트 컴포넌트는 components/client/ 폴더, 상단에 "use client" 선언
- 서버 컴포넌트는 components/server/ 폴더
- 금액은 정수(원 단위) 저장, 표시할 때만 toLocaleString() 사용
- 반환 타입: { success: boolean; data?: T; error?: string }
- Tailwind만 사용, 인라인 스타일 금지
- 컴포넌트 파일명 PascalCase, 유틸 파일명 camelCase
- 에러 처리는 try/catch + toast 알림
- 빈 상태(empty state) 및 로딩 Skeleton 반드시 처리

## 환경변수

- DATABASE_URL : Neon pooling connection string
- DIRECT_URL : Neon direct connection string
- ANTHROPIC_API_KEY : Claude API 키
- JWT_SECRET : JWT 서명 키 (64자 이상 랜덤 문자열, 필수)
- ADMIN_EMAILS : 관리자 이메일 (쉼표 구분)
- ADMIN_PASSWORD : 관리자 비밀번호
- NEXT_PUBLIC_TOSS_CLIENT_KEY : 토스페이먼츠 위젯 클라이언트 키
- TOSS_SECRET_KEY : 토스페이먼츠 시크릿 키

## Prisma datasource 설정

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

## 추가 도메인 규칙 (신청서 기반)

### 민감정보 처리

- CmsInfo.accountNo, holderBirthNo → 저장 시 [ENCRYPTED] placeholder 처리
- 화면 출력 시 마스킹: 계좌 뒤 4자리만 표시 (\*\*\*\*1234)
- MVP에서는 실제 암호화 없이 마스킹 UI만 구현

### 나이 검증 (birthDate 기반 자동 계산)

- YOUTH : 만 13~18세만 가능
- REGULAR / ASSOCIATE : 만 19세 이상만 가능

### 회비 자동 생성 규칙 (회원 등록 시)

- MONTHLY → 가입 월 ~ 12월까지 UNPAID MemberFee 레코드 자동 생성
- ANNUAL → 당해 연도 연납 UNPAID 레코드 1건 생성
- LIFETIME → 평생 레코드 1건 생성 후, 이후 발생 레코드 EXEMPT 처리
- YOUTH(청소년) → 회비 레코드 생성 안 함 (회비 없음)

### 필수 동의 강제

- consentPrivacy = false → 회원 등록 불가 (폼 레벨 검증)
- consentThirdParty → CMS 자동이체 선택 시에만 필수

### 입금 계좌 (직접입금 안내용 상수)

- 은행: [은행명]
- 계좌: [계좌번호]
- 예금주: 하나님나라연구소

## AI 어시스턴트 규칙

- 모델: claude-sonnet-4-20250514
- API route: app/api/ai/route.ts (스트리밍 응답)
- 호출 전 DB 집계 쿼리 실행 → system prompt에 한국어로 주입
- 집계 항목: 회원수/구분별 현황, 징수율, 미납 목록, 후원금 합계

## 인증 & 세션 관리

### JWT 세션 관리 (lib/session.ts)

- `jose` 라이브러리 사용
- HTTP-only 쿠키 기반 세션 (7일 만료)
- 주요 함수:
  - `createSession(payload)` - 세션 생성
  - `verifySession()` - 토큰 검증
  - `getSession()` - 현재 세션 조회
  - `deleteSession()` - 로그아웃

### 인증 Server Actions (actions/auth.ts)

- `login(email, password)` - 회원 로그인 (5회 실패 시 15분 계정 잠금)
- `adminLogin(email, password)` - 관리자 로그인 (환경변수 기반)
- `logout()` - 로그아웃
- `setPassword(memberId, password)` - 비밀번호 설정 (기존 회원용)
- `changePassword(memberId, oldPassword, newPassword)` - 비밀번호 변경

### 라우트 보호 (middleware.ts)

| 경로              | 권한            |
| ----------------- | --------------- |
| `/my/*`           | MEMBER, ADMIN   |
| `/dashboard/*`    | ADMIN only      |
| `/members/*`      | ADMIN only      |
| `/fees/*`         | ADMIN only      |
| `/donations/*`    | ADMIN only      |
| `/login`, `/join` | 비인증 사용자만 |

### 역할 (Role)

- MEMBER: 회원 (회원 포털 접근)
- ADMIN: 관리자 (관리자 대시보드 접근)
