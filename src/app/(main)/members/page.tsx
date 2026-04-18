import { Suspense } from 'react'
import { UserPlus } from 'lucide-react'
import { MembersList } from '@/components/server/MembersList'
import { MemberSearchForm } from '@/components/server/MemberSearchForm'
import { TableSkeleton, FormSkeleton } from '@/components/server/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
          <p className="mt-1 text-sm text-gray-600">회원 목록을 조회하고 관리할 수 있습니다.</p>
        </div>
        <Link href="/members/new">
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            회원 등록
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">검색 및 필터</h2>
        <Suspense fallback={<FormSkeleton />}>
          <MemberSearchForm />
        </Suspense>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow">
        <Suspense fallback={<TableSkeleton rows={10} cols={7} />}>
          <MembersList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
