import { prisma } from '@/lib/prisma'
import { formatAmount } from '@/lib/utils'

export async function UnpaidMembersTable() {
  try {
    // 미납 회원 정보 조회
    const unpaidMembers = await prisma.member.findMany({
      where: {
        isActive: true,
        fees: {
          some: {
            status: 'UNPAID',
          },
        },
      },
      include: {
        fees: {
          where: {
            status: 'UNPAID',
          },
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        },
      },
    })

    // 회원별 미납 금액 및 기간 계산
    const unpaidData = unpaidMembers.map((member) => {
      const unpaidFees = member.fees
      const totalUnpaidAmount = unpaidFees.reduce((sum, fee) => sum + fee.amount, 0)

      // 미납 기간 계산
      const periods = unpaidFees.map((fee) => {
        if (fee.feeType === 'MONTHLY') {
          return `${fee.year}년 ${fee.month}월`
        } else if (fee.feeType === 'ANNUAL') {
          return `${fee.year}년`
        } else {
          return '평생'
        }
      })

      const unpaidPeriod =
        periods.length > 3 ? `${periods[0]} 외 ${periods.length - 1}건` : periods.join(', ')

      return {
        id: member.id,
        name: member.name,
        memberType: member.memberType,
        unpaidPeriod,
        unpaidAmount: totalUnpaidAmount,
        phone: member.phone,
        unpaidCount: unpaidFees.length,
      }
    })

    // 미납 금액 기준 내림차순 정렬
    unpaidData.sort((a, b) => b.unpaidAmount - a.unpaidAmount)

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">미납 회원 목록</h2>
              <p className="text-sm text-gray-600">회비가 미납인 회원들의 목록입니다</p>
            </div>
            <div className="text-sm text-gray-500">총 {unpaidData.length}명</div>
          </div>
        </div>

        <div className="p-6">
          {unpaidData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">미납 회원이 없습니다</div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        회원명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        회원구분
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        미납 기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        미납 금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unpaidData.slice(0, 10).map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              member.memberType === 'REGULAR'
                                ? 'bg-blue-100 text-blue-800'
                                : member.memberType === 'ASSOCIATE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {member.memberType === 'REGULAR'
                              ? '정회원'
                              : member.memberType === 'ASSOCIATE'
                                ? '준회원'
                                : '청소년회원'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.unpaidPeriod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatAmount(member.unpaidAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.phone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {unpaidData.slice(0, 10).map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">{member.name}</h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.memberType === 'REGULAR'
                              ? 'bg-blue-100 text-blue-800'
                              : member.memberType === 'ASSOCIATE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {member.memberType === 'REGULAR'
                            ? '정회원'
                            : member.memberType === 'ASSOCIATE'
                              ? '준회원'
                              : '청소년회원'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          {formatAmount(member.unpaidAmount)}
                        </div>
                        <div className="text-xs text-gray-500">{member.unpaidCount}건 미납</div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">미납 기간</span>
                        <span className="text-gray-900">{member.unpaidPeriod}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">연락처</span>
                        <span className="text-gray-900">{member.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {unpaidData.length > 10 && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-500">
                    상위 10명만 표시됨 (전체 {unpaidData.length}명)
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('미납 회원 목록 조회 실패:', error)

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">미납 회원 목록</h2>
          <p className="text-sm text-gray-600">회비가 미납인 회원들의 목록입니다</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-red-500 text-sm">데이터를 불러올 수 없습니다</div>
          </div>
        </div>
      </div>
    )
  }
}
