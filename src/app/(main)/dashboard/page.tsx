import { StatCard } from '@/components/server/StatCard'
import { MemberDistribution } from '@/components/server/MemberDistribution'
import { MonthlyTrend } from '@/components/server/MonthlyTrend'
import { UnpaidMembersTable } from '@/components/server/UnpaidMembersTable'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">회원, 회비, 후원금 현황을 한눈에 확인하세요.</p>
      </div>

      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 회원수 */}
        <StatCard
          title="총 회원수"
          type="members"
          iconBgColor="bg-blue-100"
          icon={
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          }
        />

        {/* 회비 징수율 */}
        <StatCard
          title="회비 징수율"
          type="fee-rate"
          iconBgColor="bg-green-100"
          icon={
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />

        {/* 이번달 후원금 */}
        <StatCard
          title="이번달 후원금"
          type="donations"
          iconBgColor="bg-purple-100"
          icon={
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          }
        />

        {/* 미납 건수 */}
        <StatCard
          title="미납 건수"
          type="unpaid"
          iconBgColor="bg-red-100"
          icon={
            <svg
              className="w-4 h-4 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          }
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 회원 구분별 차트 (도넛 차트) */}
        <MemberDistribution />

        {/* 월별 회비/후원금 추이 차트 (라인 차트) */}
        <MonthlyTrend />
      </div>

      {/* 미납 회원 목록 테이블 */}
      <UnpaidMembersTable />
    </div>
  )
}
