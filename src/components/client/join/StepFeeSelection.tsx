'use client'

import { Label } from '@/components/ui/label'
import { formatAmount } from '@/lib/utils'
import type { JoinFormData } from './JoinWizard'

interface StepFeeSelectionProps {
  formData: JoinFormData
  updateFormData: (data: Partial<JoinFormData>) => void
}

const FEE_TYPES = [
  {
    value: 'MONTHLY' as const,
    label: '월납',
    amount: 10000,
    period: '월',
    description: '매월 회비를 납부합니다',
  },
  {
    value: 'ANNUAL' as const,
    label: '연납',
    amount: 100000,
    period: '연',
    description: '연간 회비를 한 번에 납부합니다',
    badge: '추천',
  },
  {
    value: 'LIFETIME' as const,
    label: '평생회원',
    amount: 1000000,
    period: '1회',
    description: '평생 회원 자격이 유지됩니다',
  },
]

export function StepFeeSelection({ formData, updateFormData }: StepFeeSelectionProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">회비 선택</h2>

      {/* 회비 유형 선택 */}
      <div className="space-y-3">
        <Label>
          회비 유형 <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-3">
          {FEE_TYPES.map((type) => {
            const selected = formData.feeType === type.value

            return (
              <button
                key={type.value}
                type="button"
                onClick={() => updateFormData({ feeType: type.value })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  selected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${selected ? 'text-blue-600' : 'text-gray-900'}`}>
                      {type.label}
                    </span>
                    {type.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                        {type.badge}
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${selected ? 'text-blue-600' : 'text-gray-900'}`}>
                    {formatAmount(type.amount)}/{type.period}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{type.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 입금 안내 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h3 className="font-medium text-gray-900">입금 계좌 안내</h3>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-500">은행:</span>{' '}
            <span className="font-medium">카카오뱅크</span>
          </p>
          <p>
            <span className="text-gray-500">계좌번호:</span>{' '}
            <span className="font-medium">7942-25-97234</span>
          </p>
          <p>
            <span className="text-gray-500">예금주:</span>{' '}
            <span className="font-medium">박기형</span>
          </p>
        </div>
        <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          가입 완료 후 위 계좌로 회비를 입금해주세요.
        </p>
      </div>
    </div>
  )
}
