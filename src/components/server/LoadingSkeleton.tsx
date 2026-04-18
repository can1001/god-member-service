import { Skeleton } from '@/components/ui/skeleton'

// 테이블 로딩 스켈레톤
export function TableSkeleton({ rows = 10, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border">
      {/* 테이블 헤더 */}
      <div className="border-b bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>

      {/* 테이블 바디 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b p-4 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 카드 로딩 스켈레톤
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  )
}

// 차트 로딩 스켈레톤
export function ChartSkeleton({ height: _height = 300 }: { height?: number }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 폼 로딩 스켈레톤
export function FormSkeleton() {
  return (
    <div className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      {/* 섹션 제목 */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-px w-full" />
      </div>

      {/* 입력 필드들 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      {/* 버튼 영역 */}
      <div className="flex gap-3 pt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// 목록 아이템 로딩 스켈레톤
export function ListSkeleton({ items = 10 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

// 페이지 로딩 스켈레톤 (전체 페이지용)
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* 페이지 헤더 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* 액션 버튼들 */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// 대시보드 로딩 스켈레톤
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* KPI 카드들 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* 차트 섹션 */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* 테이블 섹션 */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <TableSkeleton rows={8} cols={5} />
      </div>
    </div>
  )
}

// 채팅 로딩 스켈레톤
export function ChatSkeleton() {
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* 환영 메시지 */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* 대화 메시지들 */}
      <div className="space-y-4 flex-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            {/* 사용자 메시지 */}
            <div className="flex items-start gap-3 justify-end">
              <div className="flex-1 space-y-2 text-right">
                <Skeleton className="h-4 w-1/3 ml-auto" />
                <Skeleton className="h-16 w-2/3 ml-auto rounded-lg" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* AI 응답 */}
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-20 w-3/4 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 입력 영역 */}
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
