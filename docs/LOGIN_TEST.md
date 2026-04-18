# 로그인 테스트 가이드

## 테스트 계정

### 회원 로그인

| 항목        | 값                   |
| ----------- | -------------------- |
| URL         | `/login`             |
| 이메일      | `kim.ss@example.com` |
| 비밀번호    | `test1234`           |
| 이동 페이지 | `/my` (회원 포털)    |

### 관리자 로그인

| 항목        | 값                             |
| ----------- | ------------------------------ |
| URL         | `/login?admin=true`            |
| 이메일      | `admin@god.or.kr`              |
| 비밀번호    | `god2026admin`                 |
| 이동 페이지 | `/dashboard` (관리자 대시보드) |

---

## 테스트 순서

### 1. 회원 로그인 테스트

1. `/login` 페이지 접속
2. 이메일/비밀번호 입력
3. 로그인 버튼 클릭
4. `/my` 회원 포털 이동 확인

### 2. 회원 포털 기능 확인

- `/my` - 대시보드 (미납 회비, 총 후원금, 최근 내역)
- `/my/fees` - 회비 내역 (연도별 그룹, 납부 버튼)
- `/my/donations` - 후원 내역 (연도별 그룹, 영수증)
- `/my/profile` - 내 정보 (회원 정보 확인)

### 3. 라우트 보호 테스트

- 비로그인 상태에서 `/my` 접근 → `/login` 리다이렉트
- 회원 로그인 후 `/dashboard` 접근 → 접근 거부
- 관리자 로그인 후 `/dashboard` 접근 → 정상 접근

### 4. 로그아웃 테스트

- 포털 헤더의 "로그아웃" 버튼 클릭
- `/login` 페이지로 이동 확인

---

## 환경변수 (Render 배포 시 필수)

```
JWT_SECRET=<64자 이상 랜덤 문자열>
ADMIN_EMAILS=admin@god.or.kr
ADMIN_PASSWORD=god2026admin
```

### JWT_SECRET 생성 방법

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## 테스트 계정 설정 API

개발 환경에서 테스트 계정 비밀번호를 설정하려면:

```bash
curl http://localhost:3000/api/test/setup-login
```

응답 예시:

```json
{
  "success": true,
  "testAccount": {
    "email": "kim.ss@example.com",
    "password": "test1234"
  }
}
```

> **주의**: 이 API는 개발용입니다. 프로덕션에서는 `/src/app/api/test/` 폴더를 삭제하세요.

---

## 비밀번호 설정 (기존 회원)

기존 회원이 처음 로그인할 때:

1. 이메일 입력 후 로그인 시도
2. 비밀번호 미설정 시 `/set-password` 페이지로 이동
3. 새 비밀번호 설정 (8자 이상)
4. 자동 로그인 후 `/my`로 이동
