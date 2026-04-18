'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { WizardProgress } from './WizardProgress'
import { WizardNavigation } from './WizardNavigation'
import { StepVerification, VerificationData } from './StepVerification'
import { StepBasicInfo } from './StepBasicInfo'
import { StepAddress } from './StepAddress'
import { StepMemberInfo } from './StepMemberInfo'
import { StepFeeSelection } from './StepFeeSelection'
import { StepConsent } from './StepConsent'
import { joinMember } from '@/app/actions/join'
import { normalizeEmail, validateEmail } from '@/lib/email'
import { calcAge } from '@/lib/utils'

export interface JoinFormData {
  // 0단계: 본인인증 (추가)
  verification: VerificationData
  // 1단계: 기본정보
  name: string
  birthDate: string
  gender: 'MALE' | 'FEMALE' | ''
  phone: string
  email: string
  smsConsent: boolean
  // 2단계: 주소
  address: string
  // 3단계: 회원정보
  memberType: 'REGULAR' | 'ASSOCIATE' | 'YOUTH' | 'DONOR' | ''
  church: string
  position: string
  // 4단계: 회비선택
  feeType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | ''
  // 5단계: 동의
  consentPrivacy: boolean
  consentMarketing: boolean
  marketingChannel: 'SMS' | 'EMAIL' | 'BOTH' | ''
}

const initialFormData: JoinFormData = {
  verification: {
    isVerified: false,
  },
  name: '',
  birthDate: '',
  gender: '',
  phone: '',
  email: '',
  smsConsent: false,
  address: '',
  memberType: '',
  church: '',
  position: '',
  feeType: '',
  consentPrivacy: false,
  consentMarketing: false,
  marketingChannel: '',
}

const STEP_LABELS = ['본인인증', '기본정보', '주소', '회원정보', '회비선택', '동의']

export function JoinWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<JoinFormData>(initialFormData)

  // 청소년/후원회원은 5단계(회비선택) 건너뛰기 (0단계 추가로 인해 +1)
  const skipFeeSelection = formData.memberType === 'YOUTH' || formData.memberType === 'DONOR'
  const totalSteps = skipFeeSelection ? 5 : 6

  // 실제 단계 번호 (회비선택 건너뛰는 경우 5단계가 6단계로)
  const getActualStep = (step: number) => {
    if (skipFeeSelection && step >= 5) {
      return step + 1 // 5->6
    }
    return step
  }

  const updateFormData = (data: Partial<JoinFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const updateVerificationData = (data: Partial<VerificationData>) => {
    setFormData((prev) => ({
      ...prev,
      verification: { ...prev.verification, ...data },
    }))

    // 본인인증 완료 시 기본정보 자동 입력
    if (data.isVerified && data.verifiedInfo) {
      const { name, birthDate, gender, phone } = data.verifiedInfo
      setFormData((prev) => ({
        ...prev,
        name,
        birthDate,
        gender: gender as 'MALE' | 'FEMALE',
        phone,
      }))
    }
  }

  // 중복가입 확인 (페이지 로드 시)
  useEffect(() => {
    const existingMember = searchParams.get('existing_member')
    const memberName = searchParams.get('existing_member_name')
    const memberEmail = searchParams.get('existing_member_email')
    const joinDate = searchParams.get('existing_member_join_date')

    if (existingMember === 'true' && memberName) {
      const joinDateStr = joinDate ? new Date(joinDate).toLocaleDateString('ko-KR') : ''
      toast.error(
        `이미 가입된 회원입니다.\n회원명: ${memberName}\n이메일: ${memberEmail || '정보 없음'}\n가입일: ${joinDateStr}`,
        {
          duration: 10000,
          style: { whiteSpace: 'pre-line' },
        }
      )
      // URL에서 파라미터 제거
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('existing_member')
      newUrl.searchParams.delete('existing_member_name')
      newUrl.searchParams.delete('existing_member_email')
      newUrl.searchParams.delete('existing_member_join_date')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  const validateStep = (step: number): boolean => {
    const actualStep = getActualStep(step)

    switch (actualStep) {
      case 0: {
        if (!formData.verification.isVerified) {
          toast.error('본인인증을 완료해주세요.')
          return false
        }
        return true
      }
      case 1: {
        const normalizedEmail = normalizeEmail(formData.email)

        if (!formData.name.trim()) {
          toast.error('이름을 입력해주세요.')
          return false
        }
        if (!formData.birthDate) {
          toast.error('생년월일을 입력해주세요.')
          return false
        }
        if (!formData.gender) {
          toast.error('성별을 선택해주세요.')
          return false
        }
        if (!formData.phone.trim()) {
          toast.error('휴대전화를 입력해주세요.')
          return false
        }
        if (!normalizedEmail) {
          toast.error('이메일을 입력해주세요.')
          return false
        }

        if (!validateEmail(normalizedEmail)) {
          toast.error('올바른 이메일 형식을 입력해주세요.')
          return false
        }
        return true
      }
      case 2: {
        if (!formData.address.trim()) {
          toast.error('주소를 입력해주세요.')
          return false
        }
        return true
      }
      case 3: {
        if (!formData.memberType) {
          toast.error('회원 구분을 선택해주세요.')
          return false
        }
        // 나이 검증 (DONOR는 나이 제한 없음)
        if (formData.memberType !== 'DONOR') {
          const age = calcAge(formData.birthDate)
          if (formData.memberType === 'YOUTH' && (age < 13 || age > 18)) {
            toast.error('청소년 회원은 만 13~18세만 가입 가능합니다.')
            return false
          }
          if (
            (formData.memberType === 'REGULAR' || formData.memberType === 'ASSOCIATE') &&
            age < 19
          ) {
            toast.error('정회원/준회원은 만 19세 이상만 가입 가능합니다.')
            return false
          }
        }
        return true
      }
      case 4: {
        if (!formData.feeType) {
          toast.error('회비 유형을 선택해주세요.')
          return false
        }
        return true
      }
      case 5: {
        if (!formData.feeType) {
          toast.error('회비 유형을 선택해주세요.')
          return false
        }
        return true
      }
      case 6: {
        if (!formData.consentPrivacy) {
          toast.error('개인정보 수집·이용에 동의해주세요.')
          return false
        }
        if (formData.consentMarketing && !formData.marketingChannel) {
          toast.error('마케팅 수신 방법을 선택해주세요.')
          return false
        }
        return true
      }
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await joinMember({
        name: formData.name,
        birthDate: formData.birthDate,
        gender: formData.gender as 'MALE' | 'FEMALE',
        phone: formData.phone,
        email: normalizeEmail(formData.email),
        smsConsent: formData.smsConsent,
        address: formData.address,
        memberType: formData.memberType as 'REGULAR' | 'ASSOCIATE' | 'YOUTH' | 'DONOR',
        church: formData.church || undefined,
        position: formData.position || undefined,
        feeType: skipFeeSelection
          ? undefined
          : (formData.feeType as 'MONTHLY' | 'ANNUAL' | 'LIFETIME'),
        consentPrivacy: formData.consentPrivacy,
        consentMarketing: formData.consentMarketing,
        marketingChannel: formData.consentMarketing
          ? (formData.marketingChannel as 'SMS' | 'EMAIL' | 'BOTH')
          : undefined,
      })

      if (result.success) {
        // 성공 페이지로 이동, 회원 정보 전달
        const params = new URLSearchParams({
          name: formData.name,
          memberType: formData.memberType,
          feeType: formData.feeType || '',
        })
        router.push(`/join/success?${params.toString()}`)
      } else {
        toast.error(result.error || '가입에 실패했습니다.')
      }
    })
  }

  const renderStep = () => {
    const actualStep = getActualStep(currentStep)

    switch (actualStep) {
      case 0:
        return (
          <StepVerification
            verificationData={formData.verification}
            updateVerificationData={updateVerificationData}
          />
        )
      case 1:
        return <StepBasicInfo formData={formData} updateFormData={updateFormData} />
      case 2:
        return <StepAddress formData={formData} updateFormData={updateFormData} />
      case 3:
        return <StepMemberInfo formData={formData} updateFormData={updateFormData} />
      case 4:
        return <StepFeeSelection formData={formData} updateFormData={updateFormData} />
      case 5:
        return <StepFeeSelection formData={formData} updateFormData={updateFormData} />
      case 6:
        return <StepConsent formData={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  // 표시용 단계 레이블 (회비선택 건너뛰면 5단계 제외)
  const displayLabels = skipFeeSelection ? STEP_LABELS.filter((_, i) => i !== 4) : STEP_LABELS

  return (
    <div className="space-y-6">
      <WizardProgress currentStep={currentStep} totalSteps={totalSteps} labels={displayLabels} />

      <div className="bg-white rounded-xl p-5 shadow-sm border">{renderStep()}</div>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrev={handlePrev}
        onNext={handleNext}
        isSubmitting={isPending}
      />
    </div>
  )
}
