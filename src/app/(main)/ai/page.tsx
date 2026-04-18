import { Suspense } from 'react'
import { AiChat } from '@/components/client/AiChat'
import { ChatSkeleton } from '@/components/server/LoadingSkeleton'
import { Bot, Zap, Database, BarChart3 } from 'lucide-react'

export default function AiPage() {
  return (
    <div className="flex h-full min-h-[calc(100vh-2rem)]">
      {/* Sidebar with AI Info */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI 어시스턴트</h1>
              <p className="text-sm text-gray-600">Claude Sonnet 4</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            성서유니온선교회 회원·회비·후원금 관리에 대해 실시간 데이터를 바탕으로 도움을 드립니다.
          </p>
        </div>

        {/* Features */}
        <div className="p-6 space-y-4 flex-1">
          <h2 className="font-semibold text-gray-900 text-sm">주요 기능</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Zap className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-green-900">실시간 조회</div>
                <div className="text-xs text-green-700">
                  회원수, 회비 징수율, 후원금 현황 등을 실시간으로 확인
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Database className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-900">데이터 분석</div>
                <div className="text-xs text-blue-700">
                  회원 구분별 현황, 미납자 목록, 후원 패턴 분석
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="h-4 w-4 text-purple-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-purple-900">리포트 생성</div>
                <div className="text-xs text-purple-700">
                  월별/연별 통계, 트렌드 분석, 맞춤형 보고서
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="p-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">질문 예시</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="p-2 bg-gray-50 rounded">
              &ldquo;이번 달 회비 징수율이 어떻게 되나요?&rdquo;
            </div>
            <div className="p-2 bg-gray-50 rounded">
              &ldquo;미납 회원은 몇 명이고 누구인가요?&rdquo;
            </div>
            <div className="p-2 bg-gray-50 rounded">
              &ldquo;후원금 목적별 분석을 보여주세요&rdquo;
            </div>
            <div className="p-2 bg-gray-50 rounded">&ldquo;정회원 중 연납 선택 비율은?&rdquo;</div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 p-6">
          <Suspense fallback={<ChatSkeleton />}>
            <AiChat />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
