'use client'

import { useState } from 'react'
import { FileCheck, Search, Printer, CreditCard, Heart } from 'lucide-react'
import { formatAmount, formatDate } from '@/lib/utils'

type SearchResult = {
  member: {
    id: number
    name: string
    email: string
    memberType: string
  }
  fees: Array<{
    id: number
    year: number
    month: number | null
    feeType: string
    amount: number
    status: string
    paidDate: string | null
  }>
  donations: Array<{
    id: number
    receiptNo: string
    amount: number
    date: string
    purpose: string
  }>
}

const feeTypeLabels: Record<string, string> = {
  MONTHLY: '월납',
  ANNUAL: '연납',
  LIFETIME: '평생',
}

const purposeLabels: Record<string, string> = {
  GENERAL: '일반기금',
  SCHOLARSHIP: '장학금',
  OPERATION: '운영비',
  WELFARE: '복지사업',
  PROGRAM: '프로그램',
}

export default function CertificatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setSearchResult(null)

    try {
      const response = await fetch(`/api/certificates/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error('검색에 실패했습니다')
      }
      const data = await response.json()
      if (!data.member) {
        setError('검색 결과가 없습니다')
      } else {
        setSearchResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintFeeReceipt = (feeId: number) => {
    window.open(`/api/certificates/fee-receipt/${feeId}`, '_blank')
  }

  const handlePrintDonationReceipt = (donationId: number) => {
    window.open(`/api/certificates/donation-receipt/${donationId}`, '_blank')
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">증명서 발급</h1>
        <p className="mt-1 text-sm text-gray-500">회비 납부확인서 및 기부금영수증을 발급합니다</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회원 이름 또는 이메일로 검색..."
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="h-5 w-5" />
            {isLoading ? '검색 중...' : '검색'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResult && (
        <div className="space-y-6">
          {/* Member Info */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {searchResult.member.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{searchResult.member.name}</h2>
                <p className="text-gray-500">{searchResult.member.email}</p>
              </div>
            </div>
          </div>

          {/* Fee Receipts */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">회비 납부확인서</h3>
              </div>
            </div>
            <div className="divide-y">
              {searchResult.fees.filter((f) => f.status === 'PAID').length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  납부 완료된 회비가 없습니다
                </div>
              ) : (
                searchResult.fees
                  .filter((f) => f.status === 'PAID')
                  .map((fee) => (
                    <div
                      key={fee.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {fee.year}년 {fee.month ? `${fee.month}월` : ''}{' '}
                          {feeTypeLabels[fee.feeType]}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatAmount(fee.amount)} · 납부일:{' '}
                          {fee.paidDate ? formatDate(fee.paidDate) : '-'}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePrintFeeReceipt(fee.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Printer className="h-4 w-4" />
                        납부확인서 발급
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Donation Receipts */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">기부금영수증</h3>
              </div>
            </div>
            <div className="divide-y">
              {searchResult.donations.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">후원 내역이 없습니다</div>
              ) : (
                searchResult.donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{donation.receiptNo}</div>
                      <div className="text-sm text-gray-500">
                        {formatAmount(donation.amount)} · {purposeLabels[donation.purpose]} ·{' '}
                        {formatDate(donation.date)}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePrintDonationReceipt(donation.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Printer className="h-4 w-4" />
                      영수증 발급
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchResult && !error && !isLoading && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FileCheck className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">회원을 검색하세요</h3>
          <p className="mt-2 text-gray-500">
            회원 이름 또는 이메일로 검색하면 납부확인서와 기부금영수증을 발급할 수 있습니다
          </p>
        </div>
      )}
    </div>
  )
}
