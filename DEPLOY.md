# Render 배포 가이드

## 사전 준비

- [Render](https://render.com) 계정
- GitHub 저장소 연결
- Neon PostgreSQL 데이터베이스 URL
- Anthropic API 키

## 환경변수

| 변수명              | 설명                     | 예시                                                             |
| ------------------- | ------------------------ | ---------------------------------------------------------------- |
| `DATABASE_URL`      | Neon pooling 연결 문자열 | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL`        | Neon direct 연결 문자열  | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `ANTHROPIC_API_KEY` | Claude API 키            | `sk-ant-...`                                                     |

## 방법 1: Blueprint 배포 (권장)

프로젝트에 `render.yaml`이 포함되어 있어 Blueprint로 쉽게 배포할 수 있습니다.

### 단계

1. [Render Dashboard](https://dashboard.render.com) 접속
2. 좌측 사이드바에서 **Blueprints** 클릭
3. **New Blueprint Instance** 클릭
4. GitHub 저장소 `su-member-service-mvp` 선택
5. Render가 `render.yaml` 자동 감지
6. 환경변수 입력 화면에서 위 3개 값 입력
7. **Apply** 클릭

### render.yaml 설정 내용

```yaml
services:
  - type: web
    name: su-member-service-mvp
    env: node
    plan: free
    buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: DIRECT_URL
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: NODE_VERSION
        value: 22.12.0
```

## 방법 2: 수동 Web Service 생성

1. [Render Dashboard](https://dashboard.render.com) 접속
2. **New +** → **Web Service** 선택
3. GitHub 저장소 연결
4. 다음 설정 입력:

| 항목              | 값                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Name**          | su-member-service-mvp                                                              |
| **Environment**   | Node                                                                               |
| **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| **Start Command** | `npm start`                                                                        |

5. **Environment** 탭에서 환경변수 추가
6. **Create Web Service** 클릭

## 배포 확인

- 배포 완료 후 Render에서 제공하는 URL 접속
- 예: `https://su-member-service-mvp.onrender.com`

## 자동 배포

- `main` 브랜치에 push 시 자동 배포
- Dashboard에서 **Manual Deploy** → **Deploy latest commit**으로 수동 배포 가능

## 트러블슈팅

### 빌드 실패 - Prisma 관련

```bash
# 로컬에서 먼저 마이그레이션 확인
npx prisma migrate status
npx prisma migrate deploy
```

### 데이터베이스 연결 실패

- `DATABASE_URL`에 `?sslmode=require` 포함 확인
- Neon Dashboard에서 연결 문자열 재확인

### 무료 플랜 제한

- 15분 비활동 시 슬립 모드 (첫 요청 시 15-30초 지연)
- 월 750시간 빌드 시간 제한

## 입금 계좌 정보 (참고)

직접입금 안내용:

- 은행: 국민은행
- 계좌: 483901-01-188268
- 예금주: 성서유니온선교회
