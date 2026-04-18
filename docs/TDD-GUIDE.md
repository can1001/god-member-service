# TDD 개발 가이드

## 개요

이 프로젝트는 TDD(Test-Driven Development) 방법론을 적용하여 개발합니다.

## 설치된 도구

### 코드 품질

| 도구     | 용도                  |
| -------- | --------------------- |
| ESLint   | 코드 스타일/품질 검사 |
| Prettier | 코드 포맷팅           |

### 테스트

| 도구            | 용도                  |
| --------------- | --------------------- |
| Vitest          | 단위/통합 테스트      |
| Testing Library | React 컴포넌트 테스트 |
| Playwright      | E2E 테스트            |

### 자동화

| 도구           | 용도              |
| -------------- | ----------------- |
| Husky          | Git 훅 관리       |
| lint-staged    | 커밋 전 자동 검증 |
| GitHub Actions | CI/CD 파이프라인  |

## npm scripts

```bash
# 개발
npm run dev           # 개발 서버 실행

# 린트 & 포맷
npm run lint          # ESLint 검사
npm run lint:fix      # ESLint 자동 수정
npm run format        # Prettier 포맷팅
npm run format:check  # Prettier 검사만

# 단위 테스트
npm run test          # 테스트 (watch 모드)
npm run test:ui       # 테스트 UI
npm run test:run      # 테스트 1회 실행
npm run test:coverage # 커버리지 포함 테스트

# E2E 테스트
npm run test:e2e      # Playwright 테스트
npm run test:e2e:ui   # Playwright UI 모드
```

## 디렉토리 구조

```
src/
├── __tests__/              # 단위 테스트
│   ├── setup.ts            # 테스트 setup
│   └── *.test.ts           # 테스트 파일
e2e/
└── *.spec.ts               # E2E 테스트
```

## TDD 워크플로우

### 1. Red: 실패하는 테스트 작성

```typescript
// src/__tests__/example.test.ts
import { describe, it, expect } from 'vitest'

describe('calculateTotal', () => {
  it('should sum all items', () => {
    const result = calculateTotal([100, 200, 300])
    expect(result).toBe(600)
  })
})
```

### 2. Green: 테스트 통과하는 최소 코드 작성

```typescript
// src/lib/utils.ts
export function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0)
}
```

### 3. Refactor: 코드 개선

테스트가 통과한 상태에서 코드를 개선합니다.

## 컴포넌트 테스트 예시

```typescript
// src/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## E2E 테스트 예시

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

## 커버리지 임계값

`vitest.config.ts`에서 설정:

```typescript
coverage: {
  thresholds: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  }
}
```

## Pre-commit 훅

커밋 시 자동으로 실행:

1. ESLint 검사 + 자동 수정
2. Prettier 포맷팅

## CI/CD 파이프라인

`.github/workflows/ci.yml`:

| Job   | 설명              |
| ----- | ----------------- |
| lint  | ESLint 검사       |
| test  | Vitest + 커버리지 |
| e2e   | Playwright 테스트 |
| build | Next.js 빌드      |

## 권장 사항

1. **테스트 먼저 작성**: 기능 구현 전 테스트 작성
2. **작은 단위로**: 한 번에 하나의 기능만 테스트
3. **의미 있는 테스트 이름**: 무엇을 테스트하는지 명확하게
4. **독립적인 테스트**: 테스트 간 의존성 없이
5. **커버리지 유지**: 임계값 이상 유지
