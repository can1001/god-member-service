'use client'

import { DaumAddressInput } from '@/components/client/DaumAddressInput'
import type { JoinFormData } from './JoinWizard'

interface StepAddressProps {
  formData: JoinFormData
  updateFormData: (data: Partial<JoinFormData>) => void
}

export function StepAddress({ formData, updateFormData }: StepAddressProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">주소</h2>

      <DaumAddressInput
        value={formData.address}
        onChange={(address) => updateFormData({ address })}
        required
        label="주소"
        placeholder="주소를 검색해주세요"
      />
      <p className="text-xs text-gray-500">우편물 발송을 위해 정확한 주소를 입력해주세요.</p>
    </div>
  )
}
