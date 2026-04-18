import Link from 'next/link'
import { CheckCircle, CreditCard, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAmount } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{
    name?: string
    memberType?: string
    feeType?: string
  }>
}

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

const getMemberTypeBadge = (type: string) => {
  switch (type) {
    case 'REGULAR':
      return 'bg-blue-100 text-blue-800'
    case 'ASSOCIATE':
      return 'bg-green-100 text-green-800'
    case 'YOUTH':
      return 'bg-purple-100 text-purple-800'
    case 'DONOR':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
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

export default async function JoinSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { name = '회원', memberType = '', feeType = '' } = params

  // 청소년/후원회원은 회비 정보 표시 안 함
  const skipFeeDisplay = memberType === 'YOUTH' || memberType === 'DONOR'

  return (
    <div className="px-4 py-8 space-y-6">
      {/* 성공 아이콘 */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">가입이 완료되었습니다!</h1>
          <p className="text-gray-600 mt-1">
            <span className="font-medium">{name}</span>님, 환영합니다.
          </p>
        </div>
      </div>

      {/* 회원 정보 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">회원 구분</span>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${getMemberTypeBadge(memberType)}`}
          >
            {getMemberTypeLabel(memberType)}
          </span>
        </div>
        {!skipFeeDisplay && feeType && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">회비 유형</span>
            <span className="font-medium">
              {getFeeTypeLabel(feeType)} ({formatAmount(getFeeAmount(feeType))})
            </span>
          </div>
        )}
      </div>

      {/* 입금 안내 (청소년 제외) */}
      {!skipFeeDisplay && feeType && (
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 space-y-4">
          <div className="flex items-center gap-2 text-blue-800">
            <CreditCard className="w-5 h-5" />
            <h2 className="font-semibold">회비 납부 안내</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">은행</span>
              <span className="font-medium">[은행명]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">계좌번호</span>
              <span className="font-medium">[계좌번호]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">예금주</span>
              <span className="font-medium">하나님나라연구소</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">납부 금액</span>
              <span className="font-bold text-blue-700">{formatAmount(getFeeAmount(feeType))}</span>
            </div>
          </div>
          <p className="text-xs text-blue-700 pt-2 border-t border-blue-200">
            입금 시 입금자명을 회원 본인 이름으로 해주세요.
          </p>
        </div>
      )}

      {/* 이메일 안내 */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
        <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600">
          입력하신 이메일로 가입 확인 메일이 발송됩니다. 메일이 오지 않는 경우 스팸함을
          확인해주세요.
        </p>
      </div>

      {/* 홈 버튼 */}
      <div className="pt-4">
        <Link href="/my">
          <Button className="w-full h-12">회원 페이지로 이동</Button>
        </Link>
      </div>
    </div>
  )
}
