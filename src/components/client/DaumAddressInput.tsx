'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import type { DaumPostcodeData } from '@/types/daum'

interface DaumAddressInputProps {
  value: string
  onChange: (fullAddress: string) => void
  required?: boolean
  label?: string
  placeholder?: string
  className?: string
}

export function DaumAddressInput({
  value,
  onChange,
  required = false,
  label = '주소',
  placeholder = '주소를 검색해주세요',
  className = '',
}: DaumAddressInputProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [zonecode, setZonecode] = useState('')
  const [roadAddress, setRoadAddress] = useState('')
  const [detailAddress, setDetailAddress] = useState('')

  // 기존 값이 있을 경우 파싱
  useEffect(() => {
    if (value && !roadAddress) {
      // 기존 형식: "(12345) 서울시 강남구 테헤란로 123, 상세주소"
      const zoneMatch = value.match(/^\((\d{5})\)\s*/)
      if (zoneMatch) {
        setZonecode(zoneMatch[1])
        const rest = value.slice(zoneMatch[0].length)
        const commaIndex = rest.indexOf(', ')
        if (commaIndex > -1) {
          setRoadAddress(rest.slice(0, commaIndex))
          setDetailAddress(rest.slice(commaIndex + 2))
        } else {
          setRoadAddress(rest)
        }
      } else {
        // 우편번호 없는 기존 데이터
        const commaIndex = value.indexOf(', ')
        if (commaIndex > -1) {
          setRoadAddress(value.slice(0, commaIndex))
          setDetailAddress(value.slice(commaIndex + 2))
        } else {
          setRoadAddress(value)
        }
      }
    }
  }, [value, roadAddress])

  // 다음 주소 스크립트 동적 로딩
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

    return () => {
      // 스크립트는 제거하지 않음 (다른 컴포넌트에서 재사용)
    }
  }, [])

  // 전체 주소 조합하여 부모에게 전달
  const updateFullAddress = useCallback(
    (newZonecode: string, newRoadAddress: string, newDetailAddress: string) => {
      if (!newRoadAddress) {
        onChange('')
        return
      }

      let fullAddress = ''
      if (newZonecode) {
        fullAddress = `(${newZonecode}) ${newRoadAddress}`
      } else {
        fullAddress = newRoadAddress
      }

      if (newDetailAddress.trim()) {
        fullAddress += `, ${newDetailAddress.trim()}`
      }

      onChange(fullAddress)
    },
    [onChange]
  )

  // 주소 검색 핸들러
  const handleSearch = () => {
    if (!isScriptLoaded || !window.daum?.Postcode) {
      alert('주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

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

  // 상세주소 변경 핸들러
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDetail = e.target.value
    setDetailAddress(newDetail)
    updateFullAddress(zonecode, roadAddress, newDetail)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {/* 우편번호 + 검색 버튼 */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={zonecode}
          placeholder="우편번호"
          readOnly
          className="w-28 h-12 bg-gray-50"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={!isScriptLoaded}
          className="h-12 px-4"
        >
          <Search className="h-4 w-4 mr-2" />
          주소 검색
        </Button>
      </div>

      {/* 기본 주소 (읽기 전용) */}
      <Input
        type="text"
        value={roadAddress}
        placeholder={placeholder}
        readOnly
        className="h-12 bg-gray-50"
      />

      {/* 상세 주소 */}
      <Input
        type="text"
        value={detailAddress}
        onChange={handleDetailChange}
        placeholder="상세주소 (동/호수 등)"
        className="h-12"
      />
    </div>
  )
}
