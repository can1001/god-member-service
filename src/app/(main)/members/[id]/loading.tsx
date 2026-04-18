export default function MemberDetailLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-24 bg-gray-200 rounded"></div>
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-gray-200 rounded"></div>
          <div className="h-9 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* 요약 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-5 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* 탭 스켈레톤 */}
      <div className="bg-white rounded-lg border">
        <div className="border-b p-4 flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-20 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex gap-4">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
