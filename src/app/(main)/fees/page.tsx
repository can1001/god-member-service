import { Suspense } from 'react'
import { Download } from 'lucide-react'
import { FeesList } from '@/components/server/FeesList'
import { FeeFilterForm } from '@/components/server/FeeFilterForm'
import { TableSkeleton, FormSkeleton } from '@/components/server/LoadingSkeleton'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회비 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            회원들의 회비 납부 현황을 조회하고 관리할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Download className="h-4 w-4" />
            Excel 내보내기
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">필터</h2>
        <Suspense fallback={<FormSkeleton />}>
          <FeeFilterForm />
        </Suspense>
      </div>

      {/* Fees List */}
      <div className="bg-white rounded-lg shadow">
        <Suspense fallback={<TableSkeleton rows={10} cols={8} />}>
          <FeesList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
