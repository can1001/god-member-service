import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function MemberSearchForm() {
  return (
    <form method="GET" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Query */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            검색어
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              name="search"
              placeholder="이름, 이메일, 전화번호"
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
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
            <option value="DONOR">후원회원</option>
          </select>
        </div>

        {/* Active Status Filter */}
        <div>
          <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
            활성 상태
          </label>
          <select
            id="isActive"
            name="isActive"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
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
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button type="submit" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          검색
        </Button>
        <Link href="/members">
          <Button variant="outline" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            필터 초기화
          </Button>
        </Link>
      </div>
    </form>
  )
}
