// 다음 우편번호 서비스 타입 정의
// https://postcode.map.daum.net/guide

declare global {
  interface Window {
    daum: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance
    }
  }
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void
  onclose?: (state: string) => void
  onresize?: (size: { width: number; height: number }) => void
  width?: string | number
  height?: string | number
  animation?: boolean
  autoMapping?: boolean
  shorthand?: boolean
  pleaseReadGuide?: number
  pleaseReadGuideTimer?: number
  maxSuggestItems?: number
  showMoreHName?: boolean
  hideMapBtn?: boolean
  hideEngBtn?: boolean
  alwaysShowEngAddr?: boolean
  submitMode?: boolean
  useSuggest?: boolean
  focusInput?: boolean
  focusContent?: boolean
}

interface DaumPostcodeInstance {
  open: (options?: { q?: string; left?: number; top?: number; popupKey?: string }) => void
  embed: (element: HTMLElement, options?: { q?: string; autoClose?: boolean }) => void
}

export interface DaumPostcodeData {
  /** 국가기초구역번호 (우편번호) */
  zonecode: string
  /** 기본 주소 (검색 결과에서 첫줄에 , , 나타나는 주소) */
  address: string
  /** 기본 영문 주소 */
  addressEnglish: string
  /** 검색된 기본 주소 타입: R(도로명), J(지번) */
  addressType: 'R' | 'J'
  /** 검색 결과에서 사용자가 선택한 주소의 타입 */
  userSelectedType: 'R' | 'J'
  /** 연관 주소에서 "선택 안함" , 부분을 , , , 선택했을 경우를 , 구분할 수 있는 , 항목 */
  noSelected: 'Y' | 'N'
  /** 검색 결과에서 사용자가 선택한 주소의 언어 타입: K(한글주소), E(영문주소) */
  userLanguageType: 'K' | 'E'
  /** 도로명 주소 */
  roadAddress: string
  /** 영문 도로명 주소 */
  roadAddressEnglish: string
  /** 지번 주소 */
  jibunAddress: string
  /** 영문 지번 주소 */
  jibunAddressEnglish: string
  /** 사용자가 입력한 검색어 */
  query: string
  /** 도/시 이름 */
  sido: string
  /** 시/군/구 이름 */
  sigungu: string
  /** 시/군/구 코드 */
  sigunguCode: string
  /** 도로명 코드 */
  roadnameCode: string
  /** 법정동/법정리 코드 */
  bcode: string
  /** 도로명 값 */
  roadname: string
  /** 법정동/법정리 이름 */
  bname: string
  /** 법정리의 읍/면 이름 */
  bname1: string
  /** 법정동/법정리 이름 */
  bname2: string
  /** 행정동 이름 */
  hname: string
  /** 건물 코드 */
  buildingCode: string
  /** 건물 이름 */
  buildingName: string
  /** 공동주택 여부 (1: 공동주택, 0: 공동주택 아님) */
  apartment: 'Y' | 'N'
  /** 지번 주소 상세 건물명 */
  jibunAddressDetail: string
  /** 도로명 주소 상세 건물명 */
  roadAddressDetail: string
  /** autoJibunAddress의 상세 건물명 */
  autoJibunAddressDetail: string
  /** autoRoadAddress의 상세 건물명 */
  autoRoadAddressDetail: string
  /** 자동 입력된 지번 주소 */
  autoJibunAddress: string
  /** 자동 입력된 도로명 주소 */
  autoRoadAddress: string
}

export {}
