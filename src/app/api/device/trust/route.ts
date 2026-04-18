import { NextRequest, NextResponse } from 'next/server'
import { markDeviceAsTrusted, generateDeviceFingerprint } from '@/lib/device-session'
import { getClientInfo } from '@/lib/access-log'

// 현재 디바이스를 신뢰할 수 있는 기기로 등록
export async function POST(request: NextRequest) {
  try {
    const { deviceName } = await request.json()
    const { userAgent, ipAddress } = getClientInfo(request)

    const deviceId = generateDeviceFingerprint(userAgent, ipAddress)

    const updatedSession = await markDeviceAsTrusted(deviceId, deviceName)

    return NextResponse.json({
      success: true,
      data: {
        deviceId: updatedSession.deviceId,
        deviceName: updatedSession.deviceName,
        isTrusted: updatedSession.isTrusted,
        message: '이 기기가 신뢰할 수 있는 기기로 등록되었습니다.',
      },
    })
  } catch (error) {
    console.error('디바이스 신뢰 등록 오류:', error)
    return NextResponse.json(
      { success: false, error: '디바이스 신뢰 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
