import { prisma } from '@/lib/prisma'
import { formatDate, calcAge } from '@/lib/utils'
import { EmptyMembers, EmptyMemberSearch } from '@/components/server/EmptyState'
import { MemberDetailDialog } from '@/components/client/MemberDetailDialog'
import { MemberEditDialog } from '@/components/client/MemberEditDialog'
import { MemberDeleteDialog } from '@/components/client/MemberDeleteDialog'
import { Prisma, MemberType, FeeType } from '@prisma/client'

interface MembersListProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function MembersList({ searchParams }: MembersListProps) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const memberType = typeof params.memberType === 'string' ? params.memberType : ''
  const isActive = typeof params.isActive === 'string' ? params.isActive : ''
  const feeType = typeof params.feeType === 'string' ? params.feeType : ''

  const members = await getMembers({ search, memberType, isActive, feeType })

  if (members.length === 0) {
    if (search || memberType || isActive || feeType) {
      return <EmptyMemberSearch />
    }
    return <EmptyMembers />
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                회원 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                회원 구분
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                회비 유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                가입일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => {
              const age = calcAge(member.birthDate)
              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        {member.gender === 'MALE' ? '남성' : '여성'}, {age}세
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMemberTypeBadge(member.memberType)}`}
                    >
                      {getMemberTypeLabel(member.memberType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFeeTypeBadge(member.feeType)}`}
                    >
                      {getFeeTypeLabel(member.feeType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(member.joinDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {member.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <MemberDetailDialog memberId={member.id} memberName={member.name} />
                      <MemberEditDialog memberId={member.id} memberName={member.name} />
                      <MemberDeleteDialog memberId={member.id} memberName={member.name} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {members.map((member) => {
          const age = calcAge(member.birthDate)
          return (
            <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500">
                    {member.gender === 'MALE' ? '남성' : '여성'}, {age}세
                  </p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMemberTypeBadge(member.memberType)}`}
                  >
                    {getMemberTypeLabel(member.memberType)}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {member.isActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center text-sm">
                  <span className="w-16 text-gray-500">이메일</span>
                  <span className="text-gray-900">{member.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-16 text-gray-500">전화</span>
                  <span className="text-gray-900">{member.phone}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-16 text-gray-500">회비</span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFeeTypeBadge(member.feeType)}`}
                  >
                    {getFeeTypeLabel(member.feeType)}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-16 text-gray-500">가입일</span>
                  <span className="text-gray-900">{formatDate(member.joinDate)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <MemberDetailDialog memberId={member.id} memberName={member.name} />
                <MemberEditDialog memberId={member.id} memberName={member.name} />
                <MemberDeleteDialog memberId={member.id} memberName={member.name} />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

async function getMembers({
  search,
  memberType,
  isActive,
  feeType,
}: {
  search: string
  memberType: string
  isActive: string
  feeType: string
}) {
  try {
    const where: Prisma.MemberWhereInput = {}

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Member type filter
    if (memberType) {
      where.memberType = memberType as MemberType
    }

    // Active status filter
    if (isActive) {
      where.isActive = isActive === 'true'
    }

    // Fee type filter
    if (feeType) {
      where.feeType = feeType as FeeType
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { joinDate: 'desc' }],
      take: 50, // Limit to 50 results for performance
    })

    return members
  } catch (error) {
    console.error('Error fetching members:', error)
    return []
  }
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
