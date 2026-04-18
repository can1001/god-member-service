# Ralph Loop - su-member-service-mvp 자동 개선

## 중요: 반드시 읽고 따를 것

너는 하나님나라연구소 회원·회비·후원금 통합 관리 시스템을 **실제로 구현**하는 AI 개발자다.
이 문서를 읽으면 **반드시 1개의 TASK를 처리**하고, **git commit**까지 완료해야 한다.

**절대 하면 안 되는 것:**

- git commit 없이 종료하는 것
- `<promise>COMPLETE</promise>`를 미완료 `- [ ]`가 있는데 출력하는 것
- 분석만 하고 아무 파일도 수정하지 않는 것

**반드시 해야 하는 것:**

- PRD.md에서 첫 번째 `- [ ]` TASK를 찾는다
- 해당 TASK가 이미 구현되어 있으면: PRD.md에서 `- [ ]`를 `- [x]`로 변경하고 커밋
- 해당 TASK가 구현 필요하면: 코드 작성 후 PRD.md 체크하고 커밋
- **어떤 경우든 git commit을 반드시 실행**

---

## 실행 순서 (반드시 따를 것)

### Step 1: PRD.md 읽기

```bash
# PRD.md에서 미완료 TASK 확인
cat PRD.md | grep -n "\- \[ \]"
```

- `- [ ]` 체크박스가 있는 항목 중 **가장 먼저 나오는 것** 선택
- 해당 TASK가 무엇인지 정확히 파악

### Step 2: 구현하기

1. 관련 파일 읽기
2. 코드 작성/수정
3. 타입 검사: `npx tsc --noEmit`
4. 빌드 검사: `npm run build`

### Step 3: 완료 처리 (필수!)

```bash
# 1. PRD.md에서 해당 TASK 체크
# - [ ] → - [x] 로 변경

# 2. git commit (반드시!)
git add -A
git commit -m "feat: [TASK 내용] 구현"

# 3. progress.txt 기록
echo "[TASK] 완료 - $(date +%H:%M)" >> progress.txt
```

---

## 프로젝트 정보

### 기술 스택

- Next.js 14 (App Router), TypeScript strict mode
- PostgreSQL (Neon) + Prisma 7
- Tailwind CSS + shadcn/ui
- Anthropic Claude API (claude-sonnet-4-20250514)

### 주요 디렉토리

```
src/
├── app/
│   ├── (main)/           # 메인 레이아웃 (사이드바 포함)
│   │   ├── dashboard/
│   │   ├── members/
│   │   │   └── new/
│   │   ├── fees/
│   │   ├── donations/
│   │   └── ai/
│   ├── actions/          # Server Actions
│   ├── api/ai/           # AI API 라우트
│   └── lib/              # 유틸리티
├── components/
│   ├── client/           # "use client" 컴포넌트
│   └── server/           # Server 컴포넌트
```

### 도메인 모델

- **Member**: 회원 (REGULAR/ASSOCIATE/YOUTH)
- **MemberFee**: 회비 (MONTHLY/ANNUAL/LIFETIME)
- **CmsInfo**: CMS 자동이체 정보
- **Donation**: 후원금

---

## 코딩 규칙

- DB 변경은 반드시 `app/actions/` Server Action 사용
- 조회는 Server Component에서 직접 prisma 호출
- 클라이언트 컴포넌트는 `components/client/` 폴더, 상단에 `"use client"` 선언
- 서버 컴포넌트는 `components/server/` 폴더
- 금액은 정수(원 단위) 저장, 표시할 때만 `toLocaleString()` 사용
- 반환 타입: `{ success: boolean; data?: T; error?: string }`
- Tailwind만 사용, 인라인 스타일 금지
- 빈 상태(empty state) 및 로딩 Skeleton 반드시 처리

### 나이 검증 규칙

- YOUTH: 만 13~18세
- REGULAR / ASSOCIATE: 만 19세 이상

### 회비 자동 생성 규칙

- MONTHLY → 가입 월 ~ 12월까지 UNPAID 레코드 생성
- ANNUAL → 당해 연도 UNPAID 레코드 1건
- LIFETIME → UNPAID 레코드 1건 (이후 EXEMPT)
- YOUTH → 회비 레코드 생성 안 함

---

## 막혔을 때

- 빌드 실패 → `git checkout -- .` 후 다음 TASK
- 5번 시도 후 미해결 → progress.txt에 "SKIP" 기록 후 다음 TASK

---

## 종료 조건 (중요!)

**먼저 확인:**

```bash
grep -c "\- \[ \]" PRD.md
```

**결과가 0이 아니면:**

- 절대 `<promise>COMPLETE</promise>` 출력 금지
- 첫 번째 `- [ ]` TASK를 처리하고 git commit

**결과가 0일 때만:**

```
<promise>COMPLETE</promise>
```

---

## 요약: 이번 실행에서 해야 할 일

1. PRD.md에서 첫 번째 `- [ ]` 찾기
2. 해당 기능이 이미 있으면 → `- [x]`로 변경
3. 해당 기능이 없으면 → 구현 후 `- [x]`로 변경
4. `git add -A && git commit -m "feat: [TASK명]"`
5. 끝
