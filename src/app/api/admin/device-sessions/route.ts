import { NextRequest, NextResponse } from 'next/server'
import { getActiveDeviceSessions, cleanupExpiredSessions } from '@/lib/device-session'

// 활성 디바이스 세션 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const sessions = await getActiveDeviceSessions(limit)

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        totalCount: sessions.length,
      },
    })
  } catch (error) {
    console.error('디바이스 세션 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '세션 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 만료된 세션 정리 (관리자용 배치 작업)
export async function DELETE(_request: NextRequest) {
  try {
    const cleanedCount = await cleanupExpiredSessions()

    return NextResponse.json({
      success: true,
      data: {
        cleanedCount,
        message: `${cleanedCount}개의 만료된 세션을 정리했습니다.`,
      },
    })
  } catch (error) {
    console.error('만료된 세션 정리 오류:', error)
    return NextResponse.json(
      { success: false, error: '세션 정리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
