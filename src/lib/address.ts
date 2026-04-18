/**
 * 주소 파싱 및 우편번호 검색 유틸리티
 */

export interface ParsedAddress {
  postalCode: string
  roadAddress: string
  detailAddress: string
  fullAddress: string
}

/**
 * 한국 도로명주소에서 기본주소와 상세주소를 분리
 *
 * 예시:
 * - "서울시 광진구 자양로 21길 8 경일빌라 303호"
 *   → 기본: "서울시 광진구 자양로 21길 8", 상세: "경일빌라 303호"
 * - "(05052) 서울시 강남구 테헤란로 123, 삼성빌딩 5층"
 *   → 우편번호: "05052", 기본: "서울시 강남구 테헤란로 123", 상세: "삼성빌딩 5층"
 */
export function parseKoreanAddress(fullAddress: string): {
  roadAddress: string
  detailAddress: string
  existingPostalCode: string | null
} {
  let address = fullAddress.trim()
  let existingPostalCode: string | null = null

  // 1. 기존 우편번호 추출 (괄호 안 5자리 또는 앞쪽 5자리)
  const postalMatch = address.match(/^\((\d{5})\)\s*/)
  if (postalMatch) {
    existingPostalCode = postalMatch[1]
    address = address.slice(postalMatch[0].length)
  } else {
    // 주소 앞에 5자리 숫자가 있는 경우
    const postalMatch2 = address.match(/^(\d{5})\s+/)
    if (postalMatch2) {
      existingPostalCode = postalMatch2[1]
      address = address.slice(postalMatch2[0].length)
    }
  }

  // 2. 쉼표로 분리 시도 (가장 확실한 구분자)
  const commaIndex = address.indexOf(',')
  if (commaIndex > -1) {
    return {
      roadAddress: address.slice(0, commaIndex).trim(),
      detailAddress: address.slice(commaIndex + 1).trim(),
      existingPostalCode,
    }
  }

  // 3. 도로명주소 패턴으로 분리
  // 도로명 패턴: ~로, ~길, ~대로 + 숫자 (예: 자양로 21길 8, 테헤란로 123)
  // 건물번호 뒤의 내용이 상세주소
  const roadPattern = /^(.+?(?:로|길|대로)\s*\d+(?:-\d+)?(?:길\s*\d+(?:-\d+)?)?)\s+(.+)$/
  const match = address.match(roadPattern)
  if (match) {
    return {
      roadAddress: match[1].trim(),
      detailAddress: match[2].trim(),
      existingPostalCode,
    }
  }

  // 4. 분리 실패 시 전체를 기본주소로
  return {
    roadAddress: address,
    detailAddress: '',
    existingPostalCode,
  }
}

/**
 * Kakao Local API를 사용하여 도로명주소로 우편번호 검색
 *
 * @param roadAddress - 도로명주소 (예: "서울시 광진구 자양로 21길 8")
 * @returns 우편번호 (5자리) 또는 null
 */
export async function searchPostalCode(roadAddress: string): Promise<string | null> {
  const apiKey = process.env.KAKAO_REST_API_KEY
  if (!apiKey) {
    console.warn('KAKAO_REST_API_KEY not configured - skipping postal code search')
    return null
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(roadAddress)}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Kakao API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    // 도로명주소 정보에서 우편번호(zone_no) 추출
    const document = data.documents?.[0]
    if (document?.road_address?.zone_no) {
      return document.road_address.zone_no
    }

    // 일반 주소에서도 시도
    if (document?.address?.zip_code) {
      return document.address.zip_code
    }

    return null
  } catch (error) {
    console.error('Postal code search failed:', error)
    return null
  }
}

/**
 * 우편번호, 기본주소, 상세주소를 조합하여 전체 주소 생성
 * 형식: "(우편번호) 기본주소, 상세주소"
 */
export function formatFullAddress(
  postalCode: string | null,
  roadAddress: string,
  detailAddress: string
): string {
  if (!roadAddress) return ''

  let fullAddress = ''

  if (postalCode) {
    fullAddress = `(${postalCode}) ${roadAddress}`
  } else {
    fullAddress = roadAddress
  }

  if (detailAddress.trim()) {
    fullAddress += `, ${detailAddress.trim()}`
  }

  return fullAddress
}

/**
 * 전체 주소 처리: 파싱 + 우편번호 검색 + 조합
 */
export async function processAddress(rawAddress: string): Promise<ParsedAddress> {
  // 1. 주소 파싱
  const parsed = parseKoreanAddress(rawAddress)

  // 2. 우편번호가 없으면 API로 검색
  let postalCode = parsed.existingPostalCode || ''
  if (!postalCode && parsed.roadAddress) {
    const searchedPostalCode = await searchPostalCode(parsed.roadAddress)
    if (searchedPostalCode) {
      postalCode = searchedPostalCode
    }
  }

  // 3. 전체 주소 조합
  const fullAddress = formatFullAddress(postalCode, parsed.roadAddress, parsed.detailAddress)

  return {
    postalCode,
    roadAddress: parsed.roadAddress,
    detailAddress: parsed.detailAddress,
    fullAddress,
  }
}
