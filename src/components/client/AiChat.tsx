'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '안녕하세요! 성서유니온선교회 AI 어시스턴트입니다. 회원, 회비, 후원금 관리에 대해 무엇이든 물어보세요. 실시간 데이터를 바탕으로 정확한 답변을 드리겠습니다.',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // AI 응답 메시지 준비
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      })

      if (!response.ok) {
        throw new Error('API 요청 실패')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('스트리밍 응답을 읽을 수 없습니다')
      }

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'text') {
                accumulatedContent += parsed.content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg
                  )
                )
              } else if (parsed.type === 'done') {
                setIsLoading(false)
                return
              }
            } catch {
              // JSON 파싱 오류 무시
              continue
            }
          }
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.' }
            : msg
        )
      )
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`flex-shrink-0 p-2 rounded-full ${
                message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-blue-600" />
              ) : (
                <Bot className="h-4 w-4 text-gray-600" />
              )}
            </div>

            <div className={`flex-1 space-y-2 ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className="text-xs text-gray-500">
                {message.role === 'user' ? '나' : 'AI 어시스턴트'} ·{' '}
                {message.timestamp.toLocaleTimeString()}
              </div>
              <div
                className={`inline-block p-4 rounded-lg max-w-[80%] ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-full bg-gray-100">
              <Bot className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-xs text-gray-500">AI 어시스턴트가 입력 중...</div>
              <div className="inline-block p-4 rounded-lg bg-gray-100">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-6">
        <div className="flex gap-3">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="회원 현황, 회비 징수율, 후원금 분석 등에 대해 질문해보세요..."
            className="resize-none"
            rows={3}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="lg"
            className="px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500">Shift + Enter로 줄바꿈, Enter로 전송</div>
      </div>
    </div>
  )
}
