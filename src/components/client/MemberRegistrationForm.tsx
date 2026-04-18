'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DaumAddressInput } from '@/components/client/DaumAddressInput'
import { toast } from 'sonner'
import { normalizeEmail, sanitizeEmailInput, validateEmail } from '@/lib/email'
import { calcAge } from '@/lib/utils'
import { createMember } from '@/app/actions/members'
import { useRouter } from 'next/navigation'
import { FileUp, Loader2, X, CheckCircle2 } from 'lucide-react'

interface MemberRegistrationData {
  // 기본 정보
  name: string
  birthDate: string
  gender: 'MALE' | 'FEMALE' | ''
  address: string
  phone: string
  smsConsent: boolean
  email: string

  // 회원 정보
  memberType: 'REGULAR' | 'ASSOCIATE' | 'YOUTH' | 'DONOR' | ''
  church: string
  position: string

  // 회비 정보
  feeType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | ''
  paymentMethod:
    | 'CMS'
    | 'DIRECT_TRANSFER'
    | 'BILLING'
    | 'CARD'
    | 'KAKAO_PAY'
    | 'NAVER_PAY'
    | 'TOSS_PAY'
    | 'PHONE'
    | ''

  // CMS 정보 (CMS 선택시)
  cmsInfo?: {
    bankName: string
    accountNo: string
    accountHolder: string
    holderBirthNo: string
    holderPhone: string
    scheduledAmount: string
    withdrawDay: string
  }

  // 개인정보 동의
  consentPrivacy: boolean
  consentMarketing: boolean
  marketingChannel: 'SMS' | 'EMAIL' | 'BOTH' | ''
  consentThirdParty: boolean
}

export function MemberRegistrationForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<MemberRegistrationData>({
    name: '',
    birthDate: '',
    gender: '',
    address: '',
    phone: '',
    smsConsent: false,
    email: '',
    memberType: '',
    church: '',
    position: '',
    feeType: '',
    paymentMethod: '',
    cmsInfo: {
      bankName: '',
      accountNo: '',
      accountHolder: '',
      holderBirthNo: '',
      holderPhone: '',
      scheduledAmount: '',
      withdrawDay: '',
    },
    consentPrivacy: false,
    consentMarketing: false,
    marketingChannel: '',
    consentThirdParty: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfParsing, setPdfParsing] = useState(false)
  const [pdfParsed, setPdfParsed] = useState(false)

  // 나이 계산 및 검증
  const age = formData.birthDate ? calcAge(new Date(formData.birthDate)) : 0

  // PDF 파일 선택 핸들러
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('PDF 또는 이미지 파일만 지원됩니다')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다')
        return
      }
      setPdfFile(file)
      setPdfParsed(false)
    }
  }

  // PDF 자동 채우기 핸들러
  const handlePdfAutoFill = async () => {
    if (!pdfFile) return

    setPdfParsing(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', pdfFile)

      const response = await fetch('/api/members/parse-pdf', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'PDF 파싱에 실패했습니다')
      }

      const result = await response.json()
      if (result.success && result.data) {
        // 추출된 데이터로 폼 채우기
        const data = result.data
        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          birthDate: data.birthDate || prev.birthDate,
          gender: data.gender || prev.gender,
          address: data.address || prev.address,
          phone: data.phone || prev.phone,
          smsConsent: data.smsConsent ?? prev.smsConsent,
          email: data.email ? sanitizeEmailInput(data.email) : prev.email,
          church: data.church || prev.church,
          position: data.position || prev.position,
          memberType: data.memberType || prev.memberType,
          feeType: data.feeType || prev.feeType,
          paymentMethod: data.paymentMethod || prev.paymentMethod,
          cmsInfo: data.cmsInfo
            ? {
                bankName: data.cmsInfo.bankName || prev.cmsInfo?.bankName || '',
                accountNo: data.cmsInfo.accountNo || prev.cmsInfo?.accountNo || '',
                accountHolder: data.cmsInfo.accountHolder || prev.cmsInfo?.accountHolder || '',
                holderBirthNo: data.cmsInfo.holderBirthNo || prev.cmsInfo?.holderBirthNo || '',
                holderPhone: data.cmsInfo.holderPhone || prev.cmsInfo?.holderPhone || '',
                scheduledAmount:
                  data.cmsInfo.scheduledAmount || prev.cmsInfo?.scheduledAmount || '',
                withdrawDay: data.cmsInfo.withdrawDay || prev.cmsInfo?.withdrawDay || '',
              }
            : prev.cmsInfo,
          consentPrivacy: data.consentPrivacy ?? prev.consentPrivacy,
          consentMarketing: data.consentMarketing ?? prev.consentMarketing,
          marketingChannel: data.marketingChannel || prev.marketingChannel,
          consentThirdParty: data.consentThirdParty ?? prev.consentThirdParty,
        }))
        setPdfParsed(true)
        toast.success('신청서 내용을 자동으로 채웠습니다. 내용을 확인해주세요.')
      }
    } catch (error) {
      console.error('PDF 파싱 오류:', error)
      toast.error(error instanceof Error ? error.message : 'PDF 파싱에 실패했습니다')
    } finally {
      setPdfParsing(false)
    }
  }

  // PDF 파일 제거 핸들러
  const handlePdfRemove = () => {
    setPdfFile(null)
    setPdfParsed(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateFormData = (field: string, value: string | boolean | object) => {
    const normalizedValue =
      field === 'email' && typeof value === 'string' ? sanitizeEmailInput(value) : value

    if (field.startsWith('cmsInfo.')) {
      const cmsField = field.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        cmsInfo: {
          ...prev.cmsInfo!,
          [cmsField]: normalizedValue,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: normalizedValue }))
    }
  }

  const validateForm = () => {
    const errors: string[] = []
    const normalizedEmail = normalizeEmail(formData.email)

    // 필수 기본 정보 검증
    if (!formData.name) errors.push('성명을 입력해주세요.')
    if (!formData.birthDate) errors.push('생년월일을 입력해주세요.')
    if (!formData.gender) errors.push('성별을 선택해주세요.')
    if (!formData.address) errors.push('주소를 입력해주세요.')
    if (!formData.phone) errors.push('휴대전화를 입력해주세요.')
    if (!normalizedEmail) errors.push('이메일을 입력해주세요.')
    if (normalizedEmail && !validateEmail(normalizedEmail)) {
      errors.push('올바른 이메일 형식을 입력해주세요.')
    }

    // 회원 정보 검증
    if (!formData.memberType) errors.push('회원구분을 선택해주세요.')

    // 나이 검증 (DONOR는 나이 제한 없음)
    if (formData.birthDate && formData.memberType && formData.memberType !== 'DONOR') {
      if (formData.memberType === 'YOUTH' && (age < 13 || age > 18)) {
        errors.push('청소년회원은 만 13~18세만 가능합니다.')
      }
      if ((formData.memberType === 'REGULAR' || formData.memberType === 'ASSOCIATE') && age < 19) {
        errors.push('정회원/준회원은 만 19세 이상만 가능합니다.')
      }
    }

    // 회비 정보 검증 (청소년/후원회원 제외)
    if (formData.memberType !== 'YOUTH' && formData.memberType !== 'DONOR') {
      if (!formData.feeType) errors.push('회비유형을 선택해주세요.')
      if (!formData.paymentMethod) errors.push('납부방법을 선택해주세요.')
    }

    // CMS 정보 검증
    if (formData.paymentMethod === 'CMS') {
      if (!formData.cmsInfo?.bankName) errors.push('은행명을 입력해주세요.')
      if (!formData.cmsInfo?.accountNo) errors.push('계좌번호를 입력해주세요.')
      if (!formData.cmsInfo?.accountHolder) errors.push('예금주를 입력해주세요.')
      if (!formData.cmsInfo?.holderBirthNo) errors.push('예금주 생년월일을 입력해주세요.')
      if (!formData.cmsInfo?.holderPhone) errors.push('예금주 연락처를 입력해주세요.')
      if (!formData.cmsInfo?.scheduledAmount) errors.push('이체금액을 입력해주세요.')
      if (!formData.cmsInfo?.withdrawDay) errors.push('이체일을 선택해주세요.')
    }

    // 개인정보 동의 검증
    if (!formData.consentPrivacy) errors.push('개인정보 처리 동의는 필수입니다.')
    if (formData.paymentMethod === 'CMS' && !formData.consentThirdParty) {
      errors.push('CMS 자동이체를 선택한 경우 제3자 제공 동의가 필요합니다.')
    }
    if (formData.consentMarketing && !formData.marketingChannel) {
      errors.push('마케팅 수신 동의 시 수신 방법을 선택해주세요.')
    }

    return errors
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    setSubmitting(true)
    try {
      const result = await createMember({
        ...formData,
        email: normalizeEmail(formData.email),
      })

      if (result.success) {
        // BILLING 선택 시 카드 등록 페이지로 리다이렉트
        if (formData.paymentMethod === 'BILLING' && result.data?.id) {
          toast.success('회원 등록이 완료되었습니다. 카드 등록 페이지로 이동합니다.')
          router.push(`/payment/billing?memberId=${result.data.id}`)
        } else {
          toast.success('회원 등록이 완료되었습니다.')
          router.push('/members')
        }
      } else {
        toast.error(result.error || '회원 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error creating member:', error)
      toast.error('회원 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* PDF 업로드 섹션 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileUp className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900">
            회원가입 신청서 PDF 업로드 (선택사항)
          </h2>
        </div>
        <p className="text-sm text-blue-700 mb-4">
          회원가입 신청서 PDF 또는 이미지를 업로드하면 AI가 내용을 자동으로 추출하여 폼을
          채워드립니다.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          onChange={handlePdfSelect}
          className="hidden"
          id="pdf-upload"
        />

        {!pdfFile ? (
          <label
            htmlFor="pdf-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-colors"
          >
            <FileUp className="h-8 w-8 text-blue-400 mb-2" />
            <span className="text-sm text-blue-600">파일을 클릭하여 선택하거나 드래그하세요</span>
            <span className="text-xs text-gray-500 mt-1">PDF, PNG, JPG (최대 10MB)</span>
          </label>
        ) : (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {pdfParsed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <FileUp className="h-5 w-5 text-blue-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{pdfFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(pdfFile.size / 1024).toFixed(1)} KB
                    {pdfParsed && <span className="ml-2 text-green-600">파싱 완료</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePdfRemove}
                  disabled={pdfParsing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {!pdfParsed && (
              <Button
                type="button"
                onClick={handlePdfAutoFill}
                disabled={pdfParsing}
                className="w-full mt-4"
              >
                {pdfParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI가 내용을 추출하는 중...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2" />
                    AI 판독 실행
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">또는 직접 입력</span>
        </div>
      </div>

      {/* 기본 정보 섹션 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">성명 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="성명을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">생년월일 *</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => updateFormData('birthDate', e.target.value)}
            />
            {formData.birthDate && <p className="text-sm text-gray-600">만 {age}세</p>}
          </div>
          <div className="space-y-2">
            <Label>성별 *</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => updateFormData('gender', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MALE" id="male" />
                <Label htmlFor="male">남성</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FEMALE" id="female" />
                <Label htmlFor="female">여성</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">휴대전화 *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일 *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="example@email.com"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="smsConsent"
              checked={formData.smsConsent}
              onCheckedChange={(checked) => updateFormData('smsConsent', checked)}
            />
            <Label htmlFor="smsConsent">SMS 수신 동의</Label>
          </div>
        </div>
        <DaumAddressInput
          value={formData.address}
          onChange={(address) => updateFormData('address', address)}
          required
          label="주소"
          placeholder="주소를 검색해주세요"
        />
      </div>

      {/* 추가 정보 섹션 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">추가 정보</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>회원구분 *</Label>
            <RadioGroup
              value={formData.memberType}
              onValueChange={(value) => updateFormData('memberType', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REGULAR" id="regular" disabled={age > 0 && age < 19} />
                <Label htmlFor="regular" className={age > 0 && age < 19 ? 'text-gray-400' : ''}>
                  정회원 (만 19세 이상)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ASSOCIATE" id="associate" disabled={age > 0 && age < 19} />
                <Label htmlFor="associate" className={age > 0 && age < 19 ? 'text-gray-400' : ''}>
                  준회원 (만 19세 이상)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="YOUTH"
                  id="youth"
                  disabled={age > 0 && (age < 13 || age > 18)}
                />
                <Label
                  htmlFor="youth"
                  className={age > 0 && (age < 13 || age > 18) ? 'text-gray-400' : ''}
                >
                  청소년회원 (만 13~18세)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DONOR" id="donor" />
                <Label htmlFor="donor">후원회원 (나이 제한 없음, 회비 면제)</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="church">출석교회</Label>
              <Input
                id="church"
                value={formData.church}
                onChange={(e) => updateFormData('church', e.target.value)}
                placeholder="출석교회를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">직분</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => updateFormData('position', e.target.value)}
                placeholder="직분을 입력하세요"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 회비 납부 방법 섹션 (청소년/후원회원 제외) */}
      {formData.memberType !== 'YOUTH' && formData.memberType !== 'DONOR' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">회비 납부 방법</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>회비유형 *</Label>
              <RadioGroup
                value={formData.feeType}
                onValueChange={(value) => updateFormData('feeType', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MONTHLY" id="monthly" />
                  <Label htmlFor="monthly">월납 (월 10,000원)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ANNUAL" id="annual" />
                  <Label htmlFor="annual">연납 (연 100,000원)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LIFETIME" id="lifetime" />
                  <Label htmlFor="lifetime">평생회원 (1,000,000원)</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>납부방법 *</Label>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => updateFormData('paymentMethod', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BILLING" id="billing" />
                  <Label htmlFor="billing">카드 정기결제 (권장)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CMS" id="cms" />
                  <Label htmlFor="cms">CMS 자동계좌이체</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DIRECT_TRANSFER" id="direct" />
                  <Label htmlFor="direct">직접입금</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      )}

      {/* CMS 이체 정보 섹션 */}
      {formData.paymentMethod === 'CMS' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">CMS 자동이체 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">은행명 *</Label>
              <Input
                id="bankName"
                value={formData.cmsInfo?.bankName || ''}
                onChange={(e) => updateFormData('cmsInfo.bankName', e.target.value)}
                placeholder="은행명을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNo">계좌번호 *</Label>
              <Input
                id="accountNo"
                value={formData.cmsInfo?.accountNo || ''}
                onChange={(e) => updateFormData('cmsInfo.accountNo', e.target.value)}
                placeholder="계좌번호를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHolder">예금주 *</Label>
              <Input
                id="accountHolder"
                value={formData.cmsInfo?.accountHolder || ''}
                onChange={(e) => updateFormData('cmsInfo.accountHolder', e.target.value)}
                placeholder="예금주를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holderBirthNo">예금주 생년월일 *</Label>
              <Input
                id="holderBirthNo"
                value={formData.cmsInfo?.holderBirthNo || ''}
                onChange={(e) => updateFormData('cmsInfo.holderBirthNo', e.target.value)}
                placeholder="YYMMDD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holderPhone">예금주 연락처 *</Label>
              <Input
                id="holderPhone"
                value={formData.cmsInfo?.holderPhone || ''}
                onChange={(e) => updateFormData('cmsInfo.holderPhone', e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledAmount">이체금액 *</Label>
              <Input
                id="scheduledAmount"
                value={formData.cmsInfo?.scheduledAmount || ''}
                onChange={(e) => updateFormData('cmsInfo.scheduledAmount', e.target.value)}
                placeholder="이체금액을 입력하세요"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="withdrawDay">이체일 *</Label>
              {(() => {
                const WITHDRAW_DAY_OPTIONS = [5, 10, 15, 20, 25]
                const currentDay = formData.cmsInfo?.withdrawDay || ''
                const currentDayNum = parseInt(currentDay)
                const isCustomDay =
                  currentDay !== '' &&
                  !isNaN(currentDayNum) &&
                  !WITHDRAW_DAY_OPTIONS.includes(currentDayNum)
                const radioValue = isCustomDay ? 'custom' : currentDay

                return (
                  <RadioGroup
                    value={radioValue}
                    onValueChange={(value) => {
                      if (value !== 'custom') {
                        updateFormData('cmsInfo.withdrawDay', value)
                      }
                    }}
                  >
                    <div className="flex flex-wrap gap-4">
                      {WITHDRAW_DAY_OPTIONS.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <RadioGroupItem value={day.toString()} id={`day-${day}`} />
                          <Label htmlFor={`day-${day}`}>매월 {day}일</Label>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="day-custom" />
                        <Label htmlFor="day-custom">기타</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          placeholder=""
                          className="w-20"
                          value={isCustomDay ? currentDay : ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                              updateFormData('cmsInfo.withdrawDay', val)
                            }
                          }}
                          onFocus={() => {
                            // "기타"를 선택한 상태가 아니면 값을 초기화
                            if (!isCustomDay) {
                              updateFormData('cmsInfo.withdrawDay', '')
                            }
                          }}
                        />
                        <span className="text-sm text-gray-500">일</span>
                      </div>
                    </div>
                  </RadioGroup>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 카드 정기결제 안내 */}
      {formData.paymentMethod === 'BILLING' && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">카드 정기결제 안내</h3>
          <div className="text-sm text-green-800">
            <p>회원 등록 완료 후 카드 등록 페이지로 이동합니다.</p>
            <p>등록된 카드로 매월 회비가 자동 결제됩니다.</p>
            <p className="mt-2 text-xs">
              * 신용카드, 체크카드, 간편결제(카카오페이, 네이버페이, 토스페이) 지원
            </p>
          </div>
        </div>
      )}

      {/* 직접입금 안내 */}
      {formData.paymentMethod === 'DIRECT_TRANSFER' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">직접입금 계좌 안내</h3>
          <div className="text-sm text-blue-800">
            <p>은행: 국민은행</p>
            <p>계좌: 483901-01-188268</p>
            <p>예금주: 하나님나라연구소</p>
          </div>
        </div>
      )}

      {/* 개인정보 동의 섹션 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">개인정보 처리 동의</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="consentPrivacy"
              checked={formData.consentPrivacy}
              onCheckedChange={(checked) => updateFormData('consentPrivacy', checked)}
            />
            <Label htmlFor="consentPrivacy" className="text-red-600">
              개인정보 처리 동의 * (필수)
            </Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="consentMarketing"
                checked={formData.consentMarketing}
                onCheckedChange={(checked) => {
                  updateFormData('consentMarketing', checked)
                  if (!checked) {
                    updateFormData('marketingChannel', '')
                  }
                }}
              />
              <Label htmlFor="consentMarketing">마케팅 정보 수신 동의 (선택)</Label>
            </div>

            {formData.consentMarketing && (
              <div className="ml-6 space-y-2">
                <Label>수신 방법</Label>
                <RadioGroup
                  value={formData.marketingChannel}
                  onValueChange={(value) => updateFormData('marketingChannel', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SMS" id="marketing-sms" />
                    <Label htmlFor="marketing-sms">문자</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EMAIL" id="marketing-email" />
                    <Label htmlFor="marketing-email">이메일</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BOTH" id="marketing-both" />
                    <Label htmlFor="marketing-both">문자 + 이메일</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          {formData.paymentMethod === 'CMS' && (
            <div className="flex items-center space-x-2">
              <Switch
                id="consentThirdParty"
                checked={formData.consentThirdParty}
                onCheckedChange={(checked) => updateFormData('consentThirdParty', checked)}
              />
              <Label htmlFor="consentThirdParty" className="text-red-600">
                개인정보 제3자 제공 동의 * (CMS 이체 시 필수)
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} className="min-w-[120px]">
          {submitting ? '등록 중...' : '회원 등록'}
        </Button>
      </div>
    </div>
  )
}
