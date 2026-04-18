# god-member-service PRD

# 하나님나라연구소 회원·회비·후원금 통합 관리 시스템

---

## 도메인 모델

### Member (회원)

| 필드              | 타입             | 필수 | 설명                                     |
| ----------------- | ---------------- | ---- | ---------------------------------------- |
| id                | Int              | -    | PK                                       |
| name              | String           | ✅   | 성명                                     |
| birthDate         | DateTime         | ✅   | 생년월일 (나이 자동 계산)                |
| gender            | Gender           | ✅   | MALE / FEMALE                            |
| address           | String           | ✅   | 주소                                     |
| phone             | String           | ✅   | 휴대전화                                 |
| smsConsent        | Boolean          | ✅   | 문자 수신 여부                           |
| email             | String @unique   | ✅   | 이메일주소                               |
| memberType        | MemberType       | ✅   | REGULAR / ASSOCIATE / YOUTH / DONOR      |
| church            | String           | ❌   | 출석교회                                 |
| position          | String           | ❌   | 직분                                     |
| joinDate          | DateTime         | ✅   | 가입일                                   |
| feeType           | FeeType          | ✅   | MONTHLY / ANNUAL / LIFETIME              |
| isActive          | Boolean          | ✅   | 활성 여부 (기본값: true)                 |
| consentPrivacy    | Boolean          | ✅   | [필수] 개인정보 수집·이용 동의           |
| consentMarketing  | Boolean          | ✅   | [선택] 웹진·교육 안내 발송 동의          |
| marketingChannel  | MarketingChannel | ❌   | SMS / EMAIL / BOTH                       |
| consentThirdParty | Boolean          | ✅   | [필수] 개인정보 제3자 제공 동의 (CMS용)  |
| consentDate       | DateTime         | ✅   | 동의 서명일                              |
| isVerified        | Boolean          | ✅   | 본인인증 완료 여부 (기본값: false)       |
| verifiedAt        | DateTime         | ❌   | 본인인증 완료일                          |
| verificationCi    | String           | ❌   | 본인인증 CI (중복가입 방지용)            |
| passwordHash      | String?          | ❌   | 비밀번호 해시 (bcrypt, 기존 회원은 null) |
| lastLoginAt       | DateTime?        | ❌   | 마지막 로그인 시간                       |
| failedLoginCount  | Int              | ❌   | 로그인 실패 횟수 (기본값: 0)             |
| lockedUntil       | DateTime?        | ❌   | 계정 잠금 해제 시간                      |
| createdAt         | DateTime         | -    | 생성일                                   |
| updatedAt         | DateTime         | -    | 수정일                                   |

#### enum MemberType

| 값        | 표시명     | 나이      | 직분                  | 권리                    |
| --------- | ---------- | --------- | --------------------- | ----------------------- |
| REGULAR   | 정회원     | 19세 이상 | 지부위원 / SUT 정회원 | 총회 의결권 / 피선거권  |
| ASSOCIATE | 준회원     | 19세 이상 | -                     | 정회원 승급 교육 참여권 |
| YOUTH     | 청소년회원 | 13~18세   | 청소년                | -                       |
| DONOR     | 후원회원   | 제한없음  | -                     | 후원금 납부             |

#### enum FeeType

| 값       | 표시명 | 설명            |
| -------- | ------ | --------------- |
| MONTHLY  | 월납   | 매월 납부       |
| ANNUAL   | 연납   | 연 1회 납부     |
| LIFETIME | 평생   | 일시납 평생회원 |

#### enum Gender

- MALE (남), FEMALE (여)

#### enum MarketingChannel

- SMS (문자), EMAIL (이메일), BOTH (문자+이메일)

---

### MemberFee (회비)

| 필드          | 타입          | 필수 | 설명                               |
| ------------- | ------------- | ---- | ---------------------------------- |
| id            | Int           | -    | PK                                 |
| memberId      | Int           | ✅   | FK → Member                        |
| year          | Int           | ✅   | 연도                               |
| month         | Int?          | ❌   | 월 (월납만 사용, 연납·평생은 null) |
| feeType       | FeeType       | ✅   | MONTHLY / ANNUAL / LIFETIME        |
| amount        | Int           | ✅   | 납부 금액 (원 단위 정수)           |
| status        | FeeStatus     | ✅   | PAID / UNPAID / EXEMPT             |
| paymentMethod | PaymentMethod | ❌   | CMS / DIRECT_TRANSFER              |
| paidDate      | DateTime?     | ❌   | 납부일 (납부 처리 시 자동 기록)    |
| createdAt     | DateTime      | -    | 생성일                             |

Unique 제약: [memberId, year, month]

#### 회비 기준표

| 구분               | 월납          | 연납           | 평생             |
| ------------------ | ------------- | -------------- | ---------------- |
| 정회원 (REGULAR)   | 10,000원 이상 | 120,000원 이상 | 1,000,000원 이상 |
| 준회원 (ASSOCIATE) | 10,000원 이상 | 120,000원 이상 | -                |
| 청소년회원 (YOUTH) | 없음          | 없음           | -                |
| 후원회원 (DONOR)   | 없음          | 없음           | -                |

※ 사단법인 회비는 세법에 따라 기부금영수증이 발급되지 않습니다.

#### enum FeeStatus

- PAID (납부완료), UNPAID (미납), EXEMPT (면제)

#### enum PaymentMethod

- CMS : CMS 자동계좌이체 (금융결제원 연동 - Phase 2)
- DIRECT_TRANSFER : 직접입금
  → 입금 계좌: 카카오뱅크 7942-25-97234 (박기형, 하나님나라연구소 후원계좌)

---

### CmsInfo (CMS 자동이체 정보)

| 필드            | 타입        | 필수 | 설명                              |
| --------------- | ----------- | ---- | --------------------------------- |
| id              | Int         | -    | PK                                |
| memberId        | Int @unique | ✅   | FK → Member (1:1)                 |
| bankName        | String      | ✅   | 은행명                            |
| accountNo       | String      | ✅   | 계좌번호 (MVP: 마스킹 저장)       |
| accountHolder   | String      | ✅   | 예금주                            |
| holderBirthNo   | String      | ✅   | 주민번호 앞 6자리 (MVP: 마스킹)   |
| holderPhone     | String      | ✅   | 예금주 휴대전화                   |
| scheduledAmount | Int         | ✅   | 약정금액 (10000 / 20000 / 기타)   |
| withdrawDay     | Int         | ✅   | 지정 출금일 (10 / 20 / 25 / 기타) |
| isActive        | Boolean     | ✅   | 활성 여부                         |
| registeredAt    | DateTime    | ✅   | 등록일                            |

#### 약정금액 옵션

- 10,000원 / 20,000원 / 기타(직접 입력)

#### 출금일 옵션

- 10일 / 20일 / 25일 / 기타(직접 입력)

---

### Donation (후원금)

| 필드      | 타입            | 필수 | 설명                             |
| --------- | --------------- | ---- | -------------------------------- |
| id        | Int             | -    | PK                               |
| receiptNo | String @unique  | ✅   | 영수증 번호 (DON-YYYYMM-0001)    |
| donorName | String          | ✅   | 후원자명                         |
| donorType | DonorType       | ✅   | MEMBER / INDIVIDUAL / CORPORATE  |
| amount    | Int             | ✅   | 금액 (원 단위 정수)              |
| date      | DateTime        | ✅   | 후원일                           |
| purpose   | DonationPurpose | ✅   | 후원 목적                        |
| note      | String?         | ❌   | 비고                             |
| memberId  | Int?            | ❌   | FK → Member (회원 후원자인 경우) |
| createdAt | DateTime        | -    | 생성일                           |

#### enum DonorType

- MEMBER (회원), INDIVIDUAL (개인), CORPORATE (법인)

#### enum DonationPurpose

- GENERAL (일반기금), SCHOLARSHIP (장학금), OPERATION (운영비), WELFARE (복지사업), PROGRAM (프로그램)

---

### IdentityVerification (본인인증)

| 필드              | 타입               | 필수 | 설명                       |
| ----------------- | ------------------ | ---- | -------------------------- |
| id                | Int                | -    | PK                         |
| method            | VerificationMethod | ✅   | 인증 수단                  |
| status            | VerificationStatus | ✅   | 인증 상태                  |
| targetPhone       | String             | ❌   | 인증 요청 휴대폰           |
| targetEmail       | String             | ❌   | 인증 요청 이메일           |
| verifiedName      | String             | ❌   | 인증된 실명                |
| verifiedPhone     | String             | ❌   | 인증된 휴대폰              |
| verifiedBirthDate | DateTime           | ❌   | 인증된 생년월일            |
| verifiedGender    | Gender             | ❌   | 인증된 성별                |
| ci                | String             | ❌   | 연계정보 (중복가입 방지용) |
| di                | String             | ❌   | 중복가입확인정보           |
| otpCode           | String             | ❌   | OTP 코드 (해시)            |
| otpExpiresAt      | DateTime           | ❌   | OTP 만료시간               |
| otpAttempts       | Int                | ❌   | OTP 시도 횟수              |
| externalTxId      | String             | ❌   | 외부 서비스 거래ID         |
| memberId          | Int                | ❌   | FK → Member                |
| requestedAt       | DateTime           | ✅   | 인증 요청 시각             |
| verifiedAt        | DateTime           | ❌   | 인증 완료 시각             |
| expiresAt         | DateTime           | ✅   | 인증 유효기간              |

#### enum VerificationMethod

| 값        | 표시명          | 설명                             |
| --------- | --------------- | -------------------------------- |
| PHONE     | 휴대폰 본인인증 | KG이니시스/다날 통신사 기반 인증 |
| KAKAO     | 카카오 간편인증 | 카카오 앱 기반 인증              |
| NAVER     | 네이버 간편인증 | 네이버 앱 기반 인증              |
| PASS      | PASS 간편인증   | PASS 앱 기반 인증                |
| EMAIL_OTP | 이메일 OTP      | 이메일로 인증번호 발송           |
| SMS_OTP   | SMS OTP         | 문자로 인증번호 발송             |

#### enum VerificationStatus

- PENDING (대기), VERIFIED (완료), EXPIRED (만료), FAILED (실패)

---

## 비즈니스 로직

### 1. 회원 등록 시 처리 흐름

1. birthDate로 나이 계산 → memberType 유효성 검증
   - YOUTH: 만 13~18세
   - REGULAR / ASSOCIATE: 만 19세 이상
   - DONOR: 나이 제한 없음
2. consentPrivacy = false이면 등록 불가
3. feeType에 따라 MemberFee 레코드 자동 생성
   - MONTHLY → 가입 월 ~ 12월까지 각 UNPAID 레코드 생성
   - ANNUAL → 해당 연도 UNPAID 레코드 1건 생성
   - LIFETIME → UNPAID 레코드 1건 생성 후 EXEMPT 처리
   - YOUTH / DONOR → 생성 안 함 (회비 면제)
4. paymentMethod = CMS → CmsInfo 레코드 함께 저장
5. consentThirdParty = false + CMS 선택 → CMS 신청 불가 (폼 검증)

### 2. 회비 처리

- 납부 처리: status = PAID, paidDate = 오늘 날짜
- 납부 취소: status = UNPAID, paidDate = null
- 일괄 납부: 체크박스로 선택한 UNPAID 항목 일괄 PAID 처리
- 평생회원 등록 → 이후 월/연납 레코드 자동 EXEMPT 처리

### 3. 후원금 영수증 번호 채번

- 형식: DON-YYYYMM-XXXX (예: DON-202503-0001)
- 월별 시퀀스: 해당 월의 마지막 번호 +1
- src/lib/receipt.ts에 분리 구현

### 4. 본인인증 처리

1. 회원가입 시 본인인증 필수 (Step 0)
   - 인증 수단: 휴대폰 / 카카오 / 네이버 / PASS / 이메일 OTP / SMS OTP
2. 인증 완료 시 CI 값으로 기존 회원 여부 확인
   - 동일 CI 존재 → 중복가입 차단, 기존 계정 안내
3. 인증된 정보(실명, 생년월일, 성별, 휴대폰) 기본정보에 자동 입력
4. 인증 유효기간: 30분 (초과 시 재인증 필요)
5. OTP 시도 횟수: 최대 5회 (초과 시 재발송 필요)
6. Member 모델에 isVerified, verifiedAt, verificationCi 필드 추가

### 5. 회원 로그인 및 인증 처리

1. **로그인 플로우**
   - 이메일 + 비밀번호 입력
   - 비밀번호 검증 (bcrypt compare)
   - 5회 연속 실패 시 15분 계정 잠금 (lockedUntil)
   - 성공 시 JWT 세션 생성 (HTTP-only 쿠키, 7일 만료)
   - lastLoginAt 업데이트, failedLoginCount 초기화

2. **비밀번호 설정 (기존 회원)**
   - passwordHash가 null인 기존 회원 대상
   - 로그인 시도 시 /set-password 페이지로 리다이렉트
   - 8자 이상 비밀번호 검증
   - 설정 완료 후 자동 로그인

3. **관리자 로그인**
   - /login?admin=true 접근
   - 환경변수 기반 인증 (ADMIN_EMAILS, ADMIN_PASSWORD)
   - 성공 시 ADMIN 역할 세션 생성 → /dashboard 리다이렉트

4. **라우트 보호 (middleware.ts)**
   - /my/\* : MEMBER 또는 ADMIN 필요
   - /dashboard/_, /members/_, /fees/_, /donations/_ : ADMIN 필요
   - /login, /join : 비인증 사용자만 접근

5. **결제 연동 (토스페이먼츠)**
   - 회비 납부: /my/payment → 토스페이먼츠 위젯
   - 카드 등록: /my/payment/billing → 빌링키 발급
   - BillingKey 모델에 카드 정보 저장

---

## 페이지 목록

### 관리자 페이지 (/dashboard, /members 등)

| 경로         | 설명                                    |
| ------------ | --------------------------------------- |
| /dashboard   | KPI 카드 4개 + 차트 2개 + 미납회원 목록 |
| /members     | 목록 (검색/필터) + 수정/삭제            |
| /members/new | 회원가입 신청서 기반 등록 폼            |
| /fees        | 연월 필터 + 납부처리 + 일괄처리         |
| /donations   | 목록 + 입력 다이얼로그                  |
| /ai          | Claude 채팅 (실시간 DB 컨텍스트 주입)   |

### 인증 페이지

| 경로          | 설명                             |
| ------------- | -------------------------------- |
| /login        | 회원/관리자 로그인               |
| /set-password | 비밀번호 초기 설정 (기존 회원용) |

### 회원 포털 (/my/\*)

| 경로                | 설명                                 |
| ------------------- | ------------------------------------ |
| /my                 | 회원 대시보드 (미납 현황, 최근 내역) |
| /my/profile         | 내 정보 조회                         |
| /my/fees            | 회비 내역 조회 및 납부               |
| /my/donations       | 후원 내역 조회                       |
| /my/payment         | 결제 페이지 (회비 납부)              |
| /my/payment/billing | 카드 등록 (빌링키 발급)              |

---

## 회원 등록 폼 구성 (/members/new)

### 섹션 1 — 기본 정보 (필수)

- 성명 \*
- 생년월일 \* (나이·회원구분 자동 검증)
- 성별 \* (남 / 여)
- 주소 \*
- 휴대전화 \*
- 문자 수신 여부 \* (예 / 아니오)
- 이메일주소 \*
- 회원 구분 \* (정회원 / 준회원 / 청소년회원)

### 섹션 2 — 추가 정보

- 출석교회
- 직분

### 섹션 3 — 회비 납부 방법

- 납부 유형: 월납 / 연납 / 평생
- 납부 방법: CMS 자동이체 / 직접입금

### 섹션 4 — CMS 이체 정보 (CMS 선택 시에만 표시)

- 계좌번호 \*
- 예금주 \*
- 은행명 \*
- 약정금액 \* (10,000원 / 20,000원 / 기타)
- 지정 출금일 \* (10일 / 20일 / 25일 / 기타)
- 주민번호 앞자리 \*
- 예금주 휴대전화 \*

### 섹션 5 — 개인정보 동의

- [필수] 개인정보 수집·이용 동의 (체크박스)
  - 목적: 회원관리, 회비 결제 및 내역 조회
  - 항목: 성명, 생년월일, 연락처, 주소, 이메일
  - 보유기간: 5년 (소득세법 기준)
- [선택] 웹진·교육 안내 발송 동의 (체크박스)
  - 발송 수단 선택: 문자 / 이메일 / 문자+이메일
- [필수] 개인정보 제3자 제공 동의 (CMS 선택 시에만 필수)
  - 제공 대상: 금융결제원 (CMS 자동출금 처리)
- 서명일

---

## 대시보드 KPI 정의

| 카드          | 계산 방식                                            |
| ------------- | ---------------------------------------------------- |
| 총 회원수     | isActive = true 전체 수 (구분별 breakdown)           |
| 회비 징수율   | 당해 연도 PAID 금액 합계 / 전체 청구 금액 합계 × 100 |
| 이번달 후원금 | 당월 Donation.amount 합계                            |
| 미납 건수     | status = UNPAID 전체 건수 + 미납 금액 합계           |

---

## MVP 제외 → Phase 2 예정

| 기능            | 설명                                   |
| --------------- | -------------------------------------- |
| CMS 실연동      | 금융결제원 CMS 자동출금 API 연동       |
| 기부금영수증    | 후원금 한정 PDF 자동 발급              |
| 이메일/SMS 발송 | 미납 안내, 웹진 자동 발송              |
| 공개 가입 신청  | 온라인 회원가입 신청 페이지 (공개 URL) |
| 평생회원 증서   | PDF 출력 기능                          |
| 회원 승급 관리  | 준회원 → 정회원 승급 프로세스          |

---

## 업무 분석 - 확장 기능 (Phase 2+)

### 1. 후원금 관리

| 기능              | 설명                                                         |
| ----------------- | ------------------------------------------------------------ |
| 다양한 결제 수단  | 신용카드, 계좌이체, CMS, 간편결제(카카오페이, 네이버페이 등) |
| 기부금영수증 발급 | 연말정산용 기부금영수증 PDF 자동 생성 및 국세청 연동         |
| 정기후원 관리     | 월정액 자동결제, 약정 관리, 갱신 알림                        |
| 후원자 감사       | 자동 감사 이메일/문자, 후원 리포트 발송                      |

### 2. 회비 관리

| 기능           | 설명                                   |
| -------------- | -------------------------------------- |
| 자동 청구      | 월/연 단위 자동 청구서 발송            |
| 연체 관리      | 미납 알림, 연체료 정책, 회원 자격 정지 |
| 납부 내역 조회 | 회원별 납부 이력, 영수증 재발급        |
| 회비 감면      | 특수 상황 감면 신청 및 승인 워크플로우 |

### 3. 훈련 관리

| 기능           | 설명                                       |
| -------------- | ------------------------------------------ |
| 훈련 과정 등록 | 오프라인/온라인 훈련 과정 생성 및 관리     |
| 수강 신청      | 회원 수강 신청, 대기자 관리, 정원 제한     |
| 출석 관리      | QR코드/NFC 출석 체크, 출석률 통계          |
| 수료 관리      | 수료 기준 충족 여부 자동 판정, 수료증 발급 |
| 강사 관리      | 강사 프로필, 배정, 평가                    |

### 4. 사역 관리

| 기능          | 설명                               |
| ------------- | ---------------------------------- |
| 사역팀 구성   | 사역팀 생성, 팀원 배정, 역할 부여  |
| 사역 일정     | 캘린더 기반 사역 스케줄 관리       |
| 사역 보고     | 주간/월간 사역 보고서 작성 및 제출 |
| 자원봉사 관리 | 봉사 시간 기록, 봉사 확인서 발급   |

### 5. 정기구독 관리

| 기능           | 설명                                        |
| -------------- | ------------------------------------------- |
| 구독 상품      | 웹진, 교재, 디지털 콘텐츠 등 구독 상품 관리 |
| 구독 신청/해지 | 셀프서비스 구독 관리, 해지 방어             |
| 배송 관리      | 실물 상품 배송 주소 관리, 배송 추적         |
| 구독 갱신      | 자동 갱신, 갱신 알림, 결제 실패 재시도      |

---

## 시스템 요구사항 (Phase 2+)

### 기술 요구사항

- [x] **멀티 디바이스 지원**: PC, Tablet, Handphone 등 모든 디바이스에서 제약 없이 사용 가능 (반응형 웹 + PWA)
- [x] **회원 등록 문서 보관**: 서면, Google Forms, 홈페이지 등 다양한 경로의 등록 정보를 PDF로 보관, 조회/출력 가능
- [x] **개인정보보호 규정 준수**: 대한민국 개인정보보호법 철저 준수 (암호화, 접근 로그, 동의 관리, 파기 정책)
- [x] **다양한 결제 수단**: 신용카드, 계좌이체, CMS, 간편결제 등 복수 결제 수단 지원
- [x] **증명서 발급**: 기부금영수증, 납부확인서, 수료증 등 각종 증명서 PDF 생성 및 출력

### 권한 체계

| 권한 레벨        | 대상        | 권한 범위                                          |
| ---------------- | ----------- | -------------------------------------------------- |
| 개인 회원        | 일반 회원   | 본인 정보 조회/수정, 납부 내역 조회, 증명서 출력   |
| 권역별 책임자    | 지역 담당자 | 소속 권역 회원 관리, 회비/후원금 조회, 기본 리포트 |
| 리더십 (대표 등) | 임원진      | 전체 회원 관리, 재정 현황, 의사결정 리포트         |
| 시스템 관리자    | IT 담당     | 전체 시스템 설정, 권한 관리, 감사 로그, 백업/복구  |

### 디바이스 허용 정책

- [x] 권한별 접근 가능 디바이스 제한 설정
- [x] 신뢰할 수 있는 디바이스 등록 및 관리
- [x] 비인가 디바이스 접근 시 알림 및 차단
- [x] 세션 관리 및 동시 접속 제한

---

## 구현 태스크 (Ralph Loop용)

### Phase 1: 기본 레이아웃 & 인프라

- [x] 메인 레이아웃 구현 (사이드바 + 헤더)
- [x] 사이드바 네비게이션 컴포넌트
- [x] 로딩 Skeleton 컴포넌트
- [x] 빈 상태(Empty State) 컴포넌트

### Phase 2: 대시보드

- [x] 대시보드 페이지 레이아웃
- [x] StatCard 서버 컴포넌트 (총 회원수)
- [x] StatCard 서버 컴포넌트 (회비 징수율)
- [x] StatCard 서버 컴포넌트 (이번달 후원금)
- [x] StatCard 서버 컴포넌트 (미납 건수)
- [x] 회원 구분별 차트 (도넛 차트)
- [x] 월별 회비/후원금 추이 차트 (라인 차트)
- [x] 미납 회원 목록 테이블

### Phase 3: 회원 관리

- [x] 회원 목록 페이지 (검색/필터)
- [x] 회원 목록 테이블 컴포넌트
- [x] 회원 검색 기능 (이름, 이메일, 전화번호)
- [x] 회원 필터 기능 (회원구분, 활성상태)
- [x] 회원 상세 다이얼로그
- [x] 회원 수정 기능
- [x] 회원 삭제 기능
- [x] 회원 등록 페이지 (/members/new)
- [x] 회원 등록 폼 - 기본 정보 섹션
- [x] 회원 등록 폼 - 추가 정보 섹션
- [x] 회원 등록 폼 - 회비 납부 방법 섹션
- [x] 회원 등록 폼 - CMS 이체 정보 섹션
- [x] 회원 등록 폼 - 개인정보 동의 섹션
- [x] 회원 등록 Server Action (나이 검증 + 회비 자동 생성)

### Phase 4: 회비 관리

- [x] 회비 목록 페이지
- [x] 회비 연월 필터 컴포넌트
- [x] 회비 목록 테이블
- [x] 회비 납부 처리 기능
- [x] 회비 납부 취소 기능
- [x] 회비 일괄 납부 처리 기능
- [x] 회비 Server Actions (납부/취소/일괄처리)

### Phase 5: 후원금 관리

- [x] 후원금 목록 페이지
- [x] 후원금 목록 테이블
- [x] 후원금 등록 다이얼로그
- [x] 후원금 등록 폼
- [x] 영수증 번호 자동 채번 (src/lib/receipt.ts)
- [x] 후원금 Server Actions

### Phase 6: AI 어시스턴트

- [x] AI 채팅 페이지 레이아웃
- [x] AI 채팅 클라이언트 컴포넌트
- [x] AI API 라우트 (스트리밍)
- [x] DB 집계 쿼리 → 시스템 프롬프트 주입

### Phase 7: 추가 기능

- [x] 회원 등록 시 회원가입 신청서 PDF 파일 업로드로 회원 등록 기능

#### PDF 파싱 개선 항목

- [x] SMS 수신여부 파싱 개선: 문자 수신여부 "예" 체크 시 smsConsent가 true로 파싱되도록 수정
- [x] 우편번호 자동 추출: 입력한 주소를 기반으로 우편번호를 자동 추출하는 기능 구현 (address.ts)
- [x] CMS 이체일 파싱 개선: 지정 출금일(예: 25일) 체크 시 withdrawDay가 파싱되도록 수정
- [x] 마케팅 수신 방법 파싱 개선: 마케팅 정보 수신 동의의 수신 방법(문자+이메일) 체크 시 marketingChannel이 파싱되도록 수정
- [x] 이체일 UI 개선: "기타" 옵션 추가하여 1~31일 직접 입력 가능

### Phase 8: 본인인증

- [x] Prisma 스키마 업데이트 (IdentityVerification 모델)
- [x] Member 모델에 isVerified, verifiedAt, verificationCi 필드 추가
- [x] 마이그레이션 실행
- [x] OTP 인증 구현 (SMS/이메일)
- [x] 휴대폰 본인인증 연동 (KG이니시스/다날)
- [x] 간편인증 연동 (카카오/네이버/PASS)
- [x] 본인인증 API 엔드포인트 구현
- [x] 회원가입 플로우에 본인인증 단계 추가 (Step 0)
- [x] 인증 완료 후 기본정보 자동 입력
- [x] CI 기반 중복가입 방지

### Phase 9: 회원 인증 및 로그인 (구현완료)

- [x] Member 모델에 인증 필드 추가 (passwordHash, lastLoginAt, failedLoginCount, lockedUntil)
- [x] bcryptjs 비밀번호 암호화
- [x] JWT 세션 관리 (jose 라이브러리, HTTP-only 쿠키)
- [x] 로그인 페이지 구현 (/login)
- [x] 비밀번호 설정 페이지 구현 (/set-password)
- [x] 라우트 보호 미들웨어 구현 (middleware.ts)
- [x] 회원 포털 레이아웃 및 대시보드 (/my)
- [x] 회비 내역 페이지 (/my/fees)
- [x] 후원 내역 페이지 (/my/donations)
- [x] 내 정보 페이지 (/my/profile)
- [x] 결제 페이지 이동 (/my/payment)
- [x] 토스페이먼츠 결제 위젯 연동
- [x] 빌링키 발급 기능 (/my/payment/billing)

---

## 작업 일지

### 2026-03-18

#### 후원회원(DONOR) 회원 구분 추가

회비 납부 없이 후원금만 납부할 수 있는 "후원회원" 옵션 추가 완료.

| 회원 구분            | 나이 제한    | 회비     | 비고              |
| -------------------- | ------------ | -------- | ----------------- |
| 정회원 (REGULAR)     | 만 19세 이상 | 필수     | 모든 혜택         |
| 준회원 (ASSOCIATE)   | 만 19세 이상 | 필수     | 일부 혜택         |
| 청소년회원 (YOUTH)   | 만 13~18세   | 면제     | -                 |
| **후원회원 (DONOR)** | **없음**     | **면제** | **후원금만 납부** |

**변경 파일:**

- `prisma/schema.prisma` - MemberType enum에 DONOR 추가
- `src/app/actions/join.ts` - 나이 검증 제외, 회비 생성 제외
- `src/app/actions/members.ts` - 회비 생성 로직에 DONOR 제외
- `src/components/client/join/StepMemberInfo.tsx` - DONOR 옵션 추가
- `src/components/client/join/JoinWizard.tsx` - 회비선택 단계 건너뛰기
- `src/components/client/MemberRegistrationForm.tsx` - 관리자 등록 폼에 DONOR 추가
- `src/components/server/MemberSearchForm.tsx` - 검색 필터에 DONOR 추가
- `src/components/server/MembersList.tsx` - 라벨/뱃지 함수 업데이트
- `src/components/server/StatCard.tsx` - DONOR 카운트 추가
- `src/components/server/MemberDistribution.tsx` - 차트에 DONOR 추가
- `src/lib/ai-context.ts` - AI 컨텍스트에 DONOR 통계 추가
- 기타 페이지별 getMemberTypeLabel/getMemberTypeBadge 함수 업데이트 (9개 파일)

**커밋:**

- `feat: 회원 구분에 '후원회원(DONOR)' 옵션 추가`
- `chore: 미사용 코드 및 import 정리`

### 2026-03-30

#### PDF 파싱 개선 - 이체일 및 마케팅 채널 추출 강화

회원가입 신청서 PDF 업로드 시 이체일(withdrawDay)과 마케팅 수신 방법(marketingChannel) 파싱 정확도 개선.

**문제:**

- PDF에서 25일을 선택했는데 파싱 결과에 withdrawDay가 누락됨
- 문자+이메일 둘 다 체크했는데 marketingChannel이 "EMAIL"로만 추출됨

**해결:**

1. AI 프롬프트 대폭 강화
   - withdrawDay: 체크박스 위치와 체크마크 형태를 구체적으로 명시
   - marketingChannel: 문자/이메일 각각의 체크박스를 개별 확인하도록 지시
2. 이체일 UI에 "기타" 옵션 추가 (1~31일 직접 입력 가능)
3. 주소 처리 유틸리티 추가 (address.ts)

**변경 파일:**

- `src/app/api/members/parse-pdf/route.ts` - AI 프롬프트 개선
- `src/components/client/MemberRegistrationForm.tsx` - 이체일 "기타" 옵션 추가, 버튼 텍스트 변경
- `src/lib/address.ts` - 주소 처리 유틸리티 (우편번호 자동 추출)

**커밋:**

- `feat: PDF 파싱 개선 - 이체일/마케팅채널 추출 강화 및 기타 옵션 추가`
- `fix: 이체일 기타 옵션 placeholder 제거`
