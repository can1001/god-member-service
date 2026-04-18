'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calcAge } from '@/lib/utils'
import type { JoinFormData } from './JoinWizard'

interface StepMemberInfoProps {
  formData: JoinFormData
  updateFormData: (data: Partial<JoinFormData>) => void
}

const MEMBER_TYPES = [
  {
    value: 'REGULAR' as const,
    label: '정회원',
    description: '만 19세 이상, 모든 혜택 이용 가능',
    minAge: 19,
    maxAge: 999,
  },
  {
    value: 'ASSOCIATE' as const,
    label: '준회원',
    description: '만 19세 이상, 일부 혜택 이용 가능',
    minAge: 19,
    maxAge: 999,
  },
  {
    value: 'YOUTH' as const,
    label: '청소년회원',
    description: '만 13~18세, 회비 면제',
    minAge: 13,
    maxAge: 18,
  },
  {
    value: 'DONOR' as const,
    label: '후원회원',
    description: '나이 제한 없음, 후원금만 납부',
    minAge: 0,
    maxAge: 999,
  },
]

export function StepMemberInfo({ formData, updateFormData }: StepMemberInfoProps) {
  const age = formData.birthDate ? calcAge(formData.birthDate) : null

  const isTypeAvailable = (minAge: number, maxAge: number) => {
    if (age === null) return true
    return age >= minAge && age <= maxAge
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">회원 정보</h2>
        {age !== null && <span className="text-sm text-gray-500">현재 나이: 만 {age}세</span>}
      </div>

      {/* 회원 구분 */}
      <div className="space-y-3">
        <Label>
          회원 구분 <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-3">
          {MEMBER_TYPES.map((type) => {
            const available = isTypeAvailable(type.minAge, type.maxAge)
            const selected = formData.memberType === type.value

            return (
              <button
                key={type.value}
                type="button"
                disabled={!available}
                onClick={() => updateFormData({ memberType: type.value })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  selected
                    ? 'border-blue-600 bg-blue-50'
                    : available
                      ? 'border-gray-200 bg-white hover:border-gray-300'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${selected ? 'text-blue-600' : 'text-gray-900'}`}>
                    {type.label}
                  </span>
                  {!available && <span className="text-xs text-red-500">나이 조건 불충족</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{type.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 출석교회 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="church">출석교회</Label>
        <Input
          id="church"
          type="text"
          placeholder="예) 서울제일교회"
          value={formData.church}
          onChange={(e) => updateFormData({ church: e.target.value })}
          className="h-12"
        />
      </div>

      {/* 직분 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="position">직분</Label>
        <Input
          id="position"
          type="text"
          placeholder="예) 장로, 권사, 집사"
          value={formData.position}
          onChange={(e) => updateFormData({ position: e.target.value })}
          className="h-12"
        />
      </div>
    </div>
  )
}
