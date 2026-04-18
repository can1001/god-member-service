# Mock Data 생성 가이드

## 개요

개발 및 테스트를 위한 mock data 생성 스크립트를 제공합니다.

## 스크립트 목록

| 스크립트                   | 설명                | 생성 데이터                 |
| -------------------------- | ------------------- | --------------------------- |
| `prisma/seed.ts`           | 기본 시드 데이터    | 회원 6명, 회비, 후원금 5건  |
| `prisma/seed-donations.ts` | 후원금 mock data    | 후원금 100건                |
| `prisma/seed-documents.ts` | 문서/로그 mock data | 문서 100건, 접근 로그 100건 |

---

## 실행 방법

### 1. 기본 시드 데이터

```bash
npx prisma db seed
```

또는

```bash
npx tsx prisma/seed.ts
```

### 2. 후원금 Mock Data (100건)

```bash
npx tsx prisma/seed-donations.ts
```

### 3. 문서/로그 Mock Data (각 100건)

```bash
npx tsx prisma/seed-documents.ts
```

### 전체 실행 (순서대로)

```bash
npx tsx prisma/seed.ts && \
npx tsx prisma/seed-donations.ts && \
npx tsx prisma/seed-documents.ts
```

---

## 후원금 Mock Data (`seed-donations.ts`)

### 생성 데이터

- **총 100건** 후원금 레코드
- **기간**: 2024년 1월 ~ 2025년 3월

### 데이터 분포

#### 후원자 유형

| 유형       | 비율 | 설명                       |
| ---------- | ---- | -------------------------- |
| MEMBER     | 40%  | 회원 후원 (기존 회원 연결) |
| INDIVIDUAL | 45%  | 개인 후원                  |
| CORPORATE  | 15%  | 기업 후원                  |

#### 후원 목적

| 목적               | 비율 |
| ------------------ | ---- |
| GENERAL (일반)     | 35%  |
| SCHOLARSHIP (장학) | 20%  |
| OPERATION (운영)   | 15%  |
| WELFARE (복지)     | 15%  |
| PROGRAM (프로그램) | 15%  |

#### 금액 범위

| 유형       | 금액 범위             |
| ---------- | --------------------- |
| MEMBER     | 10,000 ~ 500,000원    |
| INDIVIDUAL | 10,000 ~ 1,000,000원  |
| CORPORATE  | 100,000 ~ 5,000,000원 |

### 영수증 번호

형식: `DON-YYYYMM-XXXX`

예시:

- `DON-202401-0001` (2024년 1월 첫 번째)
- `DON-202503-0015` (2025년 3월 15번째)

---

## 문서/로그 Mock Data (`seed-documents.ts`)

### 생성 데이터

- **MemberDocument**: 100건 (회원별 문서)
- **AccessLog**: 100건 (접근 로그)
- **기간**: 2024년 1월 ~ 2025년 3월

### MemberDocument 분포

#### 문서 유형

| 유형                 | 비율 | 설명              |
| -------------------- | ---- | ----------------- |
| REGISTRATION_FORM    | 30%  | 회원등록신청서    |
| CONSENT_FORM         | 25%  | 동의서            |
| PAPER_FORM           | 15%  | 서면 신청서       |
| GOOGLE_FORM_RESPONSE | 10%  | Google Forms 응답 |
| WEBSITE_SUBMISSION   | 10%  | 홈페이지 신청서   |
| ID_COPY              | 5%   | 신분증 사본       |
| OTHER                | 5%   | 기타              |

#### 파일 형식

| MIME 타입          | 비율 | 확장자 |
| ------------------ | ---- | ------ |
| application/pdf    | 60%  | .pdf   |
| image/jpeg         | 25%  | .jpg   |
| image/png          | 10%  | .png   |
| application/msword | 5%   | .docx  |

#### 파일명 규칙

**원본 파일명**: `{문서유형}_{회원명}.{확장자}`

- 예: `회원가입신청서_김성서.pdf`

**저장 파일명**: `{회원ID}_{문서유형}_{타임스탬프}_{해시}.{확장자}`

- 예: `1_REGISTRATION_FORM_1709123456789_a1b2c3d4.pdf`

### AccessLog 분포

#### 액션 유형

| 액션              | 비율 | 설명          |
| ----------------- | ---- | ------------- |
| DOCUMENT_DOWNLOAD | 40%  | 문서 다운로드 |
| CERTIFICATE_ISSUE | 30%  | 증명서 발급   |
| MEMBER_VIEW       | 20%  | 회원 조회     |
| MEMBER_UPDATE     | 10%  | 회원 수정     |

#### 로그 정보

- **성공률**: 95%
- **IP 주소**: 샘플 IP 풀에서 랜덤 선택
- **User Agent**: 다양한 브라우저/디바이스 정보

---

## 주의사항

1. **실행 순서**: `seed.ts` → `seed-donations.ts` → `seed-documents.ts`
   - 후원금과 문서는 회원 데이터에 의존합니다.

2. **데이터 삭제**: 각 스크립트는 해당 테이블의 기존 데이터를 삭제한 후 생성합니다.

3. **문서 파일**: `seed-documents.ts`는 DB 레코드만 생성하며, 실제 파일은 생성하지 않습니다.

4. **환경 변수**: `.env.local` 파일에 `DATABASE_URL`이 설정되어 있어야 합니다.

---

## 확인 방법

| 데이터 | 확인 페이지     |
| ------ | --------------- |
| 회원   | `/members`      |
| 회비   | `/fees`         |
| 후원금 | `/donations`    |
| 문서   | `/documents`    |
| 증명서 | `/certificates` |
