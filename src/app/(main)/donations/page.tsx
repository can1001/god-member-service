import { Suspense } from 'react'
import { Plus, Download } from 'lucide-react'
import { DonationsList } from '@/components/server/DonationsList'
import { DonationDialog } from '@/components/client/DonationDialog'
import { TableSkeleton } from '@/components/server/LoadingSkeleton'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">후원금 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            후원금 내역을 조회하고 새로운 후원금을 등록할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Download className="h-4 w-4" />
            Excel 내보내기
          </Button>
          <DonationDialog>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              후원금 등록
            </Button>
          </DonationDialog>
        </div>
      </div>

      {/* Donations List */}
      <div className="bg-white rounded-lg shadow">
        <Suspense fallback={<TableSkeleton rows={10} cols={7} />}>
          <DonationsList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
