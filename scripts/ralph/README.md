# Ralph Loop 사용 가이드

> AI 기반 자동 개발 루프 시스템

Ralph Loop는 PRD.md의 태스크 체크리스트를 읽고, Claude AI를 활용하여 순차적으로 구현하는 자동화 시스템입니다.

---

## 목차

1. [개요](#개요)
2. [사전 요구사항](#사전-요구사항)
3. [빠른 시작](#빠른-시작)
4. [상세 사용법](#상세-사용법)
5. [설정 및 커스터마이징](#설정-및-커스터마이징)
6. [모니터링](#모니터링)
7. [문제 해결](#문제-해결)
8. [주의사항](#주의사항)

---

## 개요

### Ralph Loop란?

Ralph Loop는 다음 사이클을 반복하는 자동화 시스템입니다:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   1. PRD.md에서 첫 번째 미완료 태스크 찾기          │
│                        ↓                            │
│   2. Claude AI가 해당 기능 구현                     │
│                        ↓                            │
│   3. PRD.md에서 태스크 체크 (- [ ] → - [x])         │
│                        ↓                            │
│   4. git commit 생성                                │
│                        ↓                            │
│   5. 미완료 태스크가 남아있으면 1번으로             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 주요 특징

- **자율 구현**: 사람 개입 없이 태스크 순차 처리
- **자동 커밋**: 각 태스크 완료 시 git commit 생성
- **진행 추적**: 로그 파일과 progress.txt로 진행 상황 기록
- **안전 장치**: 최대 반복 횟수, PID 파일을 통한 중단 기능

---

## 사전 요구사항

### 1. Claude CLI 설치

```bash
# npm으로 설치
npm install -g @anthropic-ai/claude-code

# 또는 Homebrew (macOS)
brew install claude-code
```

### 2. Claude CLI 인증

```bash
claude login
```

### 3. PRD.md 태스크 체크리스트 준비

PRD.md에 다음 형식의 체크리스트가 있어야 합니다:

```markdown
## 구현 태스크

### Phase 1: 기본 설정

- [ ] 태스크 1
- [ ] 태스크 2
- [x] 완료된 태스크 (이미 체크됨)
```

---

## 빠른 시작

### 1. 스크립트 실행 권한 부여

```bash
chmod +x scripts/ralph/ralph.sh
```

### 2. Ralph Loop 실행

```bash
# 기본 (최대 20회 반복)
./scripts/ralph/ralph.sh

# 반복 횟수 지정
./scripts/ralph/ralph.sh 50
```

### 3. 진행 상황 확인

```bash
# 실시간 로그 확인
tail -f ralph_log_*.txt

# 미완료 태스크 확인
grep -c "\- \[ \]" PRD.md
```

### 4. 중단

```bash
kill $(cat ralph.pid)
```

---

## 상세 사용법

### 실행 명령어

```bash
./scripts/ralph/ralph.sh [최대반복횟수]
```

| 인자         | 기본값 | 설명                |
| ------------ | ------ | ------------------- |
| 최대반복횟수 | 20     | 루프 최대 실행 횟수 |

### 생성되는 파일

| 파일                            | 설명                     |
| ------------------------------- | ------------------------ |
| `ralph_log_YYYYMMDD_HHMMSS.txt` | 실행 로그 (타임스탬프별) |
| `ralph.pid`                     | 프로세스 ID (중단용)     |
| `progress.txt`                  | 진행 상황 기록           |

### 종료 조건

Ralph Loop는 다음 조건에서 종료됩니다:

1. **모든 태스크 완료**: PRD.md에 `- [ ]`가 없을 때
2. **최대 반복 도달**: 지정된 횟수만큼 반복 완료
3. **수동 중단**: `kill $(cat ralph.pid)` 실행

---

## 설정 및 커스터마이징

### ralph.sh 설정 변수

```bash
MAX_ITERATIONS=${1:-20}           # 최대 반복 횟수
LOG_FILE="ralph_log_$(date +%Y%m%d_%H%M%S).txt"  # 로그 파일
PID_FILE="ralph.pid"              # PID 파일
CLAUDE_PROMPT="scripts/ralph/CLAUDE.md"  # AI 지침서
```

### CLAUDE.md 커스터마이징

`scripts/ralph/CLAUDE.md` 파일을 수정하여 AI 동작을 조정할 수 있습니다:

```markdown
## 프로젝트 정보

### 기술 스택

- 프로젝트 기술 스택 정보

### 코딩 규칙

- 프로젝트별 코딩 규칙
```

### 대기 시간 조정

API 레이트 리밋 방지를 위한 대기 시간 (기본 10초):

```bash
# ralph.sh 67번째 줄
sleep 10  # 원하는 시간으로 변경
```

---

## 모니터링

### 실시간 로그 확인

```bash
# 전체 로그
tail -f ralph_log_*.txt

# 최근 로그만
tail -100 ralph_log_*.txt
```

### 진행 상황 요약

```bash
# 완료/미완료 태스크 수
echo "완료: $(grep -c '\- \[x\]' PRD.md)개"
echo "미완료: $(grep -c '\- \[ \]' PRD.md)개"

# 생성된 커밋 수
git log --oneline | head -20
```

### progress.txt 확인

```bash
cat progress.txt
```

---

## 문제 해결

### Claude CLI 오류

```
⚠️  Claude 실행 오류 (exit: 1) - 재시도
```

**원인**: API 오류, 네트워크 문제, 권한 문제
**해결**:

1. `claude login`으로 재인증
2. 네트워크 연결 확인
3. API 사용량 한도 확인

### 빌드 실패로 무한 루프

**해결**: CLAUDE.md에 다음 지침이 있어 자동 스킵됩니다.

```
빌드 실패 → git checkout -- . 후 다음 TASK
5번 시도 후 미해결 → progress.txt에 "SKIP" 기록
```

### 프로세스 강제 종료

```bash
# PID 파일로 종료
kill $(cat ralph.pid)

# 프로세스 직접 찾아서 종료
ps aux | grep ralph
kill -9 [PID]
```

### 로그 파일 정리

```bash
# 오래된 로그 삭제
rm ralph_log_*.txt

# progress.txt 초기화
rm progress.txt
```

---

## 주의사항

### 실행 전 체크리스트

- [ ] PRD.md에 `- [ ]` 형식의 태스크가 있는지 확인
- [ ] git 저장소가 clean 상태인지 확인
- [ ] Claude CLI 인증 상태 확인
- [ ] 충분한 API 크레딧이 있는지 확인

### 권장 사항

1. **브랜치 분리**: main 브랜치 대신 별도 브랜치에서 실행

   ```bash
   git checkout -b feat/ralph-implementation
   ./scripts/ralph/ralph.sh 30
   ```

2. **백업**: 중요한 변경사항은 미리 커밋

   ```bash
   git add -A && git commit -m "chore: backup before ralph loop"
   ```

3. **소규모 시작**: 처음에는 적은 반복 횟수로 테스트

   ```bash
   ./scripts/ralph/ralph.sh 3  # 3회만 테스트
   ```

4. **모니터링**: 첫 몇 번은 로그를 실시간으로 확인
   ```bash
   ./scripts/ralph/ralph.sh 10 &
   tail -f ralph_log_*.txt
   ```

### 비용 고려

- 각 반복마다 Claude API 호출 발생
- 복잡한 태스크는 여러 번의 API 호출 필요
- 예상 비용을 미리 계산하고 시작

---

## 예시 실행 결과

```
[15:30:00] 🚀 Ralph Loop 시작 (최대 20회)
[15:30:00] 📋 로그 파일: ralph_log_20260316_153000.txt
[15:30:00] 🛑 중단하려면: kill $(cat ralph.pid)
---
[15:30:01] 🔄 Iteration 1 / 20
[15:30:01] 📌 미완료 TASK: 38개
[15:31:15] ⏳ 다음 반복까지 10초 대기...
[15:31:25] 🔄 Iteration 2 / 20
[15:31:25] 📌 미완료 TASK: 37개
...
[16:45:00] 🎉 모든 TASK 완료! Ralph Loop 종료
[16:45:00] 📊 최종 결과:
[16:45:00]    완료 TASK: 38개
[16:45:00]    미완료 TASK: 0개
[16:45:00]    총 git commits: 38개
[16:45:00] ✨ Ralph Loop 종료
```

---

## 참고 자료

- [Claude CLI 문서](https://docs.anthropic.com/claude-code)
- [PRD.md 작성 가이드](../PRD.md)
- [프로젝트 CLAUDE.md](../../CLAUDE.md)
