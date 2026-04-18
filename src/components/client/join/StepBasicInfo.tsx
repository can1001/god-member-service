'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { sanitizeEmailInput, validateEmail } from '@/lib/email'
import type { JoinFormData } from './JoinWizard'

interface StepBasicInfoProps {
  formData: JoinFormData
  updateFormData: (data: Partial<JoinFormData>) => void
}

export function StepBasicInfo({ formData, updateFormData }: StepBasicInfoProps) {
  const emailValue = sanitizeEmailInput(formData.email)
  const showEmailError = emailValue.length > 0 && !validateEmail(emailValue)

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">기본 정보</h2>

      {/* 이름 */}
      <div className="space-y-2">
        <Label htmlFor="name">
          성명 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="홍길동"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="h-12"
        />
      </div>

      {/* 생년월일 */}
      <div className="space-y-2">
        <Label htmlFor="birthDate">
          생년월일 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="birthDate"
          type="date"
          value={formData.birthDate}
          onChange={(e) => updateFormData({ birthDate: e.target.value })}
          className="h-12"
        />
      </div>

      {/* 성별 */}
      <div className="space-y-2">
        <Label>
          성별 <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateFormData({ gender: 'MALE' })}
            className={`h-12 rounded-lg border-2 font-medium transition-colors ${
              formData.gender === 'MALE'
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            남성
          </button>
          <button
            type="button"
            onClick={() => updateFormData({ gender: 'FEMALE' })}
            className={`h-12 rounded-lg border-2 font-medium transition-colors ${
              formData.gender === 'FEMALE'
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            여성
          </button>
        </div>
      </div>

      {/* 휴대전화 */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          휴대전화 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="010-1234-5678"
          value={formData.phone}
          onChange={(e) => updateFormData({ phone: e.target.value })}
          className="h-12"
        />
      </div>

      {/* 이메일 */}
      <div className="space-y-2">
        <Label htmlFor="email">
          이메일 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="example@email.com"
          value={formData.email}
          onChange={(e) => updateFormData({ email: sanitizeEmailInput(e.target.value) })}
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-12"
        />
        {showEmailError && <p className="text-sm text-red-600">이메일 형식에 맞게 입력해주세요.</p>}
      </div>

      {/* SMS 수신 동의 */}
      <div className="flex items-center justify-between py-3 border-t">
        <Label htmlFor="smsConsent" className="cursor-pointer">
          SMS 수신 동의
        </Label>
        <Switch
          id="smsConsent"
          checked={formData.smsConsent}
          onCheckedChange={(checked) => updateFormData({ smsConsent: checked })}
        />
      </div>
    </div>
  )
}
