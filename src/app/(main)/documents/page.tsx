import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { FileText, Download, Search, Filter } from 'lucide-react'
import { Prisma, DocumentType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const documentTypeLabels: Record<string, string> = {
  REGISTRATION_FORM: '회원등록신청서',
  GOOGLE_FORM_RESPONSE: 'Google Forms',
  WEBSITE_SUBMISSION: '홈페이지 신청서',
  PAPER_FORM: '서면 신청서',
  CONSENT_FORM: '동의서',
  ID_COPY: '신분증 사본',
  OTHER: '기타',
}

async function getDocuments(searchQuery?: string, documentType?: string) {
  const where: Prisma.MemberDocumentWhereInput = {}

  if (searchQuery) {
    where.member = {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ],
    }
  }

  if (documentType && documentType !== 'all') {
    where.documentType = documentType as DocumentType
  }

  const documents = await prisma.memberDocument.findMany({
    where,
    include: {
      member: {
        select: {
          id: true,
          name: true,
          email: true,
          memberType: true,
        },
      },
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  })

  return documents
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { search?: string; type?: string }
}) {
  const documents = await getDocuments(searchParams.search, searchParams.type)

  const stats = {
    total: documents.length,
    byType: documents.reduce(
      (acc, doc) => {
        acc[doc.documentType] = (acc[doc.documentType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">문서 보관</h1>
        <p className="mt-1 text-sm text-gray-500">회원 등록 문서를 조회하고 관리합니다</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">전체 문서</div>
        </div>
        {Object.entries(documentTypeLabels).map(([key, label]) => (
          <div key={key} className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.byType[key] || 0}</div>
            <div className="text-sm text-gray-500 truncate">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <form className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="회원 이름 또는 이메일로 검색..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              name="type"
              defaultValue={searchParams.type || 'all'}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체 문서 유형</option>
              {Object.entries(documentTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              필터
            </button>
          </div>
        </form>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회원
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  문서 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  파일명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  크기
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업로드일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">문서가 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      검색 조건을 변경하거나 회원 상세에서 문서를 업로드하세요
                    </p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.member.name}</div>
                          <div className="text-sm text-gray-500">{doc.member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {documentTypeLabels[doc.documentType] || doc.documentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doc.originalName}</div>
                      {doc.description && (
                        <div className="text-sm text-gray-500">{doc.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/api/documents/download/${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="다운로드"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
