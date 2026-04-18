import { prisma } from '@/lib/prisma'
import { MemberDistributionChart } from '@/components/client/Charts'

async function getMemberDistribution() {
  const memberStats = await prisma.member.groupBy({
    by: ['memberType'],
    where: {
      isActive: true,
    },
    _count: {
      id: true,
    },
  })

  // 회원 구분별 데이터 변환
  const chartData = [
    {
      name: '정회원',
      value: memberStats.find((stat) => stat.memberType === 'REGULAR')?._count.id || 0,
      color: '#3B82F6', // blue-500
    },
    {
      name: '준회원',
      value: memberStats.find((stat) => stat.memberType === 'ASSOCIATE')?._count.id || 0,
      color: '#10B981', // green-500
    },
    {
      name: '청소년회원',
      value: memberStats.find((stat) => stat.memberType === 'YOUTH')?._count.id || 0,
      color: '#8B5CF6', // purple-500
    },
    {
      name: '후원회원',
      value: memberStats.find((stat) => stat.memberType === 'DONOR')?._count.id || 0,
      color: '#F97316', // orange-500
    },
  ]

  return chartData
}

export async function MemberDistribution() {
  const data = await getMemberDistribution()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">회원 구분별 현황</h2>
      <div className="relative">
        <MemberDistributionChart data={data} />
      </div>
      {/* 범례 */}
      <div className="flex justify-center space-x-6 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="ml-2 text-sm text-gray-600">
              {item.name} ({item.value}명)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
