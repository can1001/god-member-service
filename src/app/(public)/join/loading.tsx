import { Skeleton } from '@/components/ui/skeleton'

export default function JoinLoading() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* 진행 표시기 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-8" />
          ))}
        </div>
      </div>

      {/* 제목 스켈레톤 */}
      <Skeleton className="h-8 w-32" />

      {/* 폼 필드 스켈레톤 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* 버튼 스켈레톤 */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
    </div>
  )
}
