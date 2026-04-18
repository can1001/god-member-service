import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { formatDate, calcAge } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, CreditCard, Building } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '내 정보 - 성서유니온선교회',
  description: '회원 정보 확인',
}

async function getMemberProfile(memberId: number) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      billingKey: true,
    },
  })

  return member
}

export default async function MyProfilePage() {
  const session = await getSession()

  if (!session || session.role !== 'MEMBER') {
    redirect('/login')
  }

  const member = await getMemberProfile(session.memberId)

  if (!member) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/my">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 정보</h1>
          <p className="text-gray-500">회원 정보를 확인하세요</p>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="이름" value={member.name} />
          <InfoRow
            label="생년월일"
            value={`${formatDate(member.birthDate)} (만 ${calcAge(member.birthDate)}세)`}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow label="성별" value={member.gender === 'MALE' ? '남성' : '여성'} />
          <InfoRow
            label="주소"
            value={member.address}
            icon={<MapPin className="h-4 w-4 text-gray-400" />}
          />
        </CardContent>
      </Card>

      {/* 연락처 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            연락처
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow
            label="전화번호"
            value={member.phone}
            icon={<Phone className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="이메일"
            value={member.email}
            icon={<Mail className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="SMS 수신"
            value={member.smsConsent ? '동의' : '거부'}
            badge={member.smsConsent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
          />
          {member.church && (
            <InfoRow
              label="소속교회"
              value={`${member.church}${member.position ? ` (${member.position})` : ''}`}
              icon={<Building className="h-4 w-4 text-gray-400" />}
            />
          )}
        </CardContent>
      </Card>

      {/* 회원 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            회원 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow
            label="회원 구분"
            value={getMemberTypeLabel(member.memberType)}
            badge={getMemberTypeBadge(member.memberType)}
          />
          <InfoRow
            label="회비 유형"
            value={getFeeTypeLabel(member.feeType)}
            badge={getFeeTypeBadge(member.feeType)}
          />
          <InfoRow label="납부 방법" value={getPaymentMethodLabel(member.paymentMethod)} />
          <InfoRow label="가입일" value={formatDate(member.joinDate)} />
        </CardContent>
      </Card>

      {/* 등록된 카드 (빌링키) */}
      {member.paymentMethod === 'BILLING' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              등록된 카드
            </CardTitle>
            <CardDescription>정기결제에 사용되는 카드 정보</CardDescription>
          </CardHeader>
          <CardContent>
            {member.billingKey && member.billingKey.isActive ? (
              <div className="space-y-3">
                <InfoRow label="카드사" value={member.billingKey.cardCompany} />
                <InfoRow label="카드번호" value={member.billingKey.cardNumber} />
                <InfoRow
                  label="카드유형"
                  value={member.billingKey.cardType === 'CREDIT' ? '신용카드' : '체크카드'}
                />
                <InfoRow label="등록일" value={formatDate(member.billingKey.authenticatedAt)} />
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">등록된 카드가 없습니다.</p>
                <Link href={`/my/payment/billing?memberId=${member.id}`}>
                  <Button>
                    <CreditCard className="h-4 w-4 mr-2" />
                    카드 등록하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 개인정보 동의 */}
      <Card>
        <CardHeader>
          <CardTitle>개인정보 처리 동의</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ConsentBadge label="개인정보 수집·이용" agreed={member.consentPrivacy} />
            <ConsentBadge label="마케팅 활용" agreed={member.consentMarketing} />
            <ConsentBadge label="제3자 제공" agreed={member.consentThirdParty} />
            <div>
              <p className="text-sm text-gray-500">동의일</p>
              <p className="font-medium">{formatDate(member.consentDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({
  label,
  value,
  icon,
  badge,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  badge?: string
}) {
  return (
    <div className="flex items-center gap-3">
      {icon && icon}
      <div className="w-24 text-sm text-gray-500">{label}</div>
      {badge ? (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge}`}>{value}</span>
      ) : (
        <div className="font-medium">{value}</div>
      )}
    </div>
  )
}

function ConsentBadge({ label, agreed }: { label: string; agreed: boolean }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <span
        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
          agreed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {agreed ? '동의' : '거부'}
      </span>
    </div>
  )
}

function getMemberTypeLabel(type: string) {
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

function getMemberTypeBadge(type: string) {
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

function getFeeTypeLabel(type: string) {
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

function getFeeTypeBadge(type: string) {
  switch (type) {
    case 'MONTHLY':
      return 'bg-orange-100 text-orange-800'
    case 'ANNUAL':
      return 'bg-indigo-100 text-indigo-800'
    case 'LIFETIME':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'CMS':
      return 'CMS 자동이체'
    case 'DIRECT_TRANSFER':
      return '직접입금'
    case 'BILLING':
      return '카드 정기결제'
    case 'CARD':
      return '신용/체크카드'
    case 'KAKAO_PAY':
      return '카카오페이'
    case 'NAVER_PAY':
      return '네이버페이'
    case 'TOSS_PAY':
      return '토스페이'
    case 'PHONE':
      return '휴대폰 결제'
    default:
      return method
  }
}
