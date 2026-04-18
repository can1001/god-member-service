import { X, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function FeeFilterForm() {
  const currentYear = new Date().getFullYear()

  return (
    <form method="GET" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Year Filter */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            연도
          </label>
          <select
            id="year"
            name="year"
            defaultValue={currentYear.toString()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
              <option key={year} value={year.toString()}>
                {year}년
              </option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
            월
          </label>
          <select
            id="month"
            name="month"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month.toString()}>
                {month}월
              </option>
            ))}
          </select>
        </div>

        {/* Fee Type Filter */}
        <div>
          <label htmlFor="feeType" className="block text-sm font-medium text-gray-700 mb-1">
            회비 유형
          </label>
          <select
            id="feeType"
            name="feeType"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="MONTHLY">월납</option>
            <option value="ANNUAL">연납</option>
            <option value="LIFETIME">평생</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            납부 상태
          </label>
          <select
            id="status"
            name="status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="PAID">납부완료</option>
            <option value="UNPAID">미납</option>
            <option value="EXEMPT">면제</option>
          </select>
        </div>

        {/* Member Type Filter */}
        <div>
          <label htmlFor="memberType" className="block text-sm font-medium text-gray-700 mb-1">
            회원 구분
          </label>
          <select
            id="memberType"
            name="memberType"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="REGULAR">정회원</option>
            <option value="ASSOCIATE">준회원</option>
            <option value="YOUTH">청소년회원</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button type="submit" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          필터 적용
        </Button>
        <Link href="/fees">
          <Button variant="outline" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            필터 초기화
          </Button>
        </Link>
      </div>
    </form>
  )
}
