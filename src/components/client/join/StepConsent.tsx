'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { formatAmount } from '@/lib/utils'
import type { JoinFormData } from './JoinWizard'

interface StepConsentProps {
  formData: JoinFormData
  updateFormData: (data: Partial<JoinFormData>) => void
}

const MARKETING_CHANNELS = [
  { value: 'SMS' as const, label: '문자' },
  { value: 'EMAIL' as const, label: '이메일' },
  { value: 'BOTH' as const, label: '문자+이메일' },
]

const getMemberTypeLabel = (type: string) => {
  switch (type) {
    case 'REGULAR':
      return '정회원'
    case 'ASSOCIATE':
      return '준회원'
    case 'YOUTH':
      return '청소년회원'
    case 'DONOR':
      return '후원회원'
    default:
      return type
  }
}

const getFeeTypeLabel = (type: string) => {
  switch (type) {
    case 'MONTHLY':
      return '월납'
    case 'ANNUAL':
      return '연납'
    case 'LIFETIME':
      return '평생'
    default:
      return type
  }
}

const getFeeAmount = (type: string) => {
  switch (type) {
    case 'MONTHLY':
      return 10000
    case 'ANNUAL':
      return 100000
    case 'LIFETIME':
      return 1000000
    default:
      return 0
  }
}

export function StepConsent({ formData, updateFormData }: StepConsentProps) {
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false)

  // 청소년/후원회원은 회비 정보 표시 안 함
  const skipFeeDisplay = formData.memberType === 'YOUTH' || formData.memberType === 'DONOR'

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">동의 및 확인</h2>

      {/* 입력 정보 요약 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-gray-900">입력 정보 확인</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">이름:</span>{' '}
            <span className="font-medium">{formData.name}</span>
          </div>
          <div>
            <span className="text-gray-500">이메일:</span>{' '}
            <span className="font-medium">{formData.email}</span>
          </div>
          <div>
            <span className="text-gray-500">전화:</span>{' '}
            <span className="font-medium">{formData.phone}</span>
          </div>
          <div>
            <span className="text-gray-500">회원구분:</span>{' '}
            <span className="font-medium">{getMemberTypeLabel(formData.memberType)}</span>
          </div>
          {!skipFeeDisplay && formData.feeType && (
            <>
              <div>
                <span className="text-gray-500">회비유형:</span>{' '}
                <span className="font-medium">{getFeeTypeLabel(formData.feeType)}</span>
              </div>
              <div>
                <span className="text-gray-500">회비금액:</span>{' '}
                <span className="font-medium">
                  {formatAmount(getFeeAmount(formData.feeType))}원
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 개인정보 동의 */}
      <div className="space-y-3">
        <div
          className={`p-4 rounded-lg border-2 ${
            formData.consentPrivacy ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => updateFormData({ consentPrivacy: !formData.consentPrivacy })}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                formData.consentPrivacy
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300'
              }`}
            >
              {formData.consentPrivacy && <Check className="h-4 w-4" />}
            </button>
            <div className="flex-1">
              <Label className="font-medium cursor-pointer">
                개인정보 수집·이용 동의 <span className="text-red-500">(필수)</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowPrivacyDetail(!showPrivacyDetail)}
                className="flex items-center gap-1 text-sm text-blue-600 mt-1"
              >
                내용 보기
                {showPrivacyDetail ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showPrivacyDetail && (
                <div className="mt-2 p-3 bg-white rounded text-xs text-gray-600 leading-relaxed">
                  <p className="font-medium mb-2">수집 항목</p>
                  <p>성명, 생년월일, 성별, 연락처, 이메일, 주소</p>
                  <p className="font-medium mt-3 mb-2">수집 목적</p>
                  <p>회원 관리, 회비 납부 안내, 소식지 발송</p>
                  <p className="font-medium mt-3 mb-2">보유 기간</p>
                  <p>회원 탈퇴 시까지 (법령에 따라 최대 5년)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 마케팅 동의 */}
        <div
          className={`p-4 rounded-lg border-2 ${
            formData.consentMarketing ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() =>
                updateFormData({
                  consentMarketing: !formData.consentMarketing,
                  marketingChannel: !formData.consentMarketing ? '' : formData.marketingChannel,
                })
              }
              className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                formData.consentMarketing
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300'
              }`}
            >
              {formData.consentMarketing && <Check className="h-4 w-4" />}
            </button>
            <div className="flex-1">
              <Label className="font-medium cursor-pointer">
                마케팅 정보 수신 동의 <span className="text-gray-400">(선택)</span>
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                성서유니온의 행사, 프로그램 안내를 받아보실 수 있습니다.
              </p>
            </div>
          </div>

          {/* 수신 방법 선택 */}
          {formData.consentMarketing && (
            <div className="mt-4 pl-9">
              <Label className="text-sm">수신 방법</Label>
              <div className="flex gap-2 mt-2">
                {MARKETING_CHANNELS.map((channel) => (
                  <button
                    key={channel.value}
                    type="button"
                    onClick={() => updateFormData({ marketingChannel: channel.value })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.marketingChannel === channel.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        가입하기 버튼을 누르면 위 약관에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  )
}
