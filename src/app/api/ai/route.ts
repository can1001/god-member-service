import { NextRequest, NextResponse } from 'next/server'
import { generateAiContext } from '@/lib/ai-context'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: '메시지가 필요합니다.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return NextResponse.json({ error: 'AI 서비스 설정이 완료되지 않았습니다.' }, { status: 500 })
    }

    // 실시간 DB 집계 데이터 생성
    const dbContext = await generateAiContext()

    // Claude API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `
당신은 하나님나라연구소의 회원·회비·후원금 통합 관리 시스템의 AI 어시스턴트입니다.

다음과 같은 역할을 수행해주세요:
1. 실시간 회원, 회비, 후원금 데이터를 바탕으로 정확한 정보 제공
2. 한국어로 친근하고 전문적인 답변
3. 숫자는 항상 한국어 형식으로 표시 (예: 1,000,000원)
4. 개인정보는 절대 노출하지 않기 (이름 등은 익명화)
5. 질문이 업무 범위를 벗어나면 정중히 안내

현재 시스템 데이터:
${dbContext}

답변 시 위 데이터를 참고하여 정확한 정보를 제공해주세요.
`,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', response.status, errorText)
      return NextResponse.json({ error: 'AI 서비스 응답 오류가 발생했습니다.' }, { status: 500 })
    }

    // 스트리밍 응답 설정
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // SSE 데이터 파싱
            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)

                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)

                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    // 텍스트 델타만 클라이언트로 전송
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          type: 'text',
                          content: parsed.delta.text,
                        })}\n\n`
                      )
                    )
                  } else if (parsed.type === 'message_stop') {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          type: 'done',
                        })}\n\n`
                      )
                    )
                  }
                } catch {
                  // JSON 파싱 오류는 무시 (다른 이벤트 타입일 수 있음)
                  continue
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
