# 다음 주소 API 연동

## 개요

회원가입 및 회원 정보 수정 시 다음 우편번호 서비스(Daum Postcode)를 사용하여 정확한 주소 입력을 지원합니다.

## 서비스 정보

| 항목     | 내용                                 |
| -------- | ------------------------------------ |
| 서비스명 | 다음 우편번호 서비스 (Daum Postcode) |
| 제공     | Kakao                                |
| 비용     | 무료                                 |
| API 키   | 불필요                               |
| 방식     | 클라이언트 사이드 JavaScript 팝업    |
| 문서     | https://postcode.map.daum.net/guide  |

## 적용 페이지

| 페이지          | 파일 경로                                          |
| --------------- | -------------------------------------------------- |
| 모바일 회원가입 | `src/components/client/join/StepAddress.tsx`       |
| 관리자 회원등록 | `src/components/client/MemberRegistrationForm.tsx` |
| 회원정보 수정   | `src/components/client/MemberEditDialog.tsx`       |

## UI 구조

```
┌─────────────────────────────────────────┐
│ [우편번호] [주소 검색] 버튼              │
├─────────────────────────────────────────┤
│ [기본주소 (readonly)]                    │
├─────────────────────────────────────────┤
│ [상세주소 입력]                          │
└─────────────────────────────────────────┘
```

### 입력 흐름

1. "주소 검색" 버튼 클릭
2. 다음 주소 검색 팝업 표시
3. 주소 검색 및 선택
4. 우편번호, 기본주소 자동 입력 (읽기 전용)
5. 상세주소 직접 입력 (동/호수 등)

## 데이터 저장 형식

```
(우편번호) 기본주소, 상세주소
```

**예시:**

```
(06234) 서울특별시 강남구 테헤란로 123, 101동 1001호
```

- 기존 `address` 필드에 전체 주소를 저장
- DB 스키마 변경 없음

## 컴포넌트 사용법

### DaumAddressInput

```tsx
import { DaumAddressInput } from '@/components/client/DaumAddressInput'
;<DaumAddressInput
  value={address}
  onChange={(fullAddress) => setAddress(fullAddress)}
  required
  label="주소"
  placeholder="주소를 검색해주세요"
/>
```

### Props

| Prop        | 타입                        | 필수 | 기본값                  | 설명            |
| ----------- | --------------------------- | ---- | ----------------------- | --------------- |
| value       | `string`                    | O    | -                       | 현재 주소 값    |
| onChange    | `(address: string) => void` | O    | -                       | 주소 변경 콜백  |
| required    | `boolean`                   | -    | `false`                 | 필수 입력 여부  |
| label       | `string`                    | -    | `"주소"`                | 레이블 텍스트   |
| placeholder | `string`                    | -    | `"주소를 검색해주세요"` | 플레이스홀더    |
| className   | `string`                    | -    | `""`                    | 추가 CSS 클래스 |

## 파일 구조

```
src/
├── types/
│   └── daum.d.ts                    # 다음 주소 API 타입 정의
└── components/
    └── client/
        ├── DaumAddressInput.tsx     # 주소 입력 컴포넌트
        ├── join/
        │   └── StepAddress.tsx      # 모바일 가입 주소 단계
        ├── MemberRegistrationForm.tsx
        └── MemberEditDialog.tsx
```

## 기술 구현

### 스크립트 로딩

다음 주소 스크립트는 컴포넌트 마운트 시 동적으로 로딩됩니다.

```typescript
useEffect(() => {
  if (typeof window !== 'undefined' && window.daum?.Postcode) {
    setIsScriptLoaded(true)
    return
  }

  const script = document.createElement('script')
  script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
  script.async = true
  script.onload = () => setIsScriptLoaded(true)
  document.head.appendChild(script)
}, [])
```

### 주소 검색 핸들러

```typescript
const handleSearch = () => {
  new window.daum.Postcode({
    oncomplete: (data: DaumPostcodeData) => {
      const selectedAddress = data.roadAddress || data.jibunAddress
      setZonecode(data.zonecode)
      setRoadAddress(selectedAddress)
      setDetailAddress('')
      updateFullAddress(data.zonecode, selectedAddress, '')
    },
  }).open()
}
```

### 반환 데이터

다음 주소 API에서 반환하는 주요 데이터:

| 필드         | 설명          | 예시                                |
| ------------ | ------------- | ----------------------------------- |
| zonecode     | 우편번호      | `"06234"`                           |
| roadAddress  | 도로명주소    | `"서울특별시 강남구 테헤란로 123"`  |
| jibunAddress | 지번주소      | `"서울특별시 강남구 역삼동 123-45"` |
| buildingName | 건물명        | `"OO빌딩"`                          |
| apartment    | 공동주택 여부 | `"Y"` 또는 `"N"`                    |

## 기존 데이터 호환

기존에 저장된 주소 데이터도 정상적으로 표시됩니다:

- `(12345) 주소, 상세주소` 형식: 파싱하여 각 필드에 표시
- 우편번호 없는 형식: 기본주소로 표시
- 상세주소 없는 형식: 기본주소만 표시

## 주의사항

1. **클라이언트 사이드 전용**: 서버 사이드 렌더링에서는 스크립트가 로드되지 않습니다.

2. **팝업 차단**: 브라우저 팝업 차단 설정에 따라 팝업이 열리지 않을 수 있습니다.

3. **모바일 지원**: 모바일 기기에서도 정상 동작하며, 화면 크기에 맞게 팝업이 조정됩니다.

4. **HTTPS**: HTTP에서도 동작하지만, 프로덕션 환경에서는 HTTPS 사용을 권장합니다.
