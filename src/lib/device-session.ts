import { prisma } from './prisma'
import crypto from 'crypto'

/**
 * 브라우저 Fingerprint 생성을 위한 유틸리티
 */
export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const combinedData = `${userAgent}|${ipAddress}`
  return crypto.createHash('sha256').update(combinedData).digest('hex').substring(0, 32)
}

/**
 * 디바이스 이름 자동 생성 (User-Agent 기반)
 */
export function generateDeviceName(userAgent: string): string {
  // Chrome, Firefox, Safari, Edge 등 브라우저 감지
  if (userAgent.includes('Chrome')) {
    if (userAgent.includes('Mobile')) return 'Chrome 모바일'
    if (userAgent.includes('Android')) return 'Android Chrome'
    return 'Chrome 브라우저'
  }
  if (userAgent.includes('Firefox')) {
    if (userAgent.includes('Mobile')) return 'Firefox 모바일'
    return 'Firefox 브라우저'
  }
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'Safari iOS'
    return 'Safari 브라우저'
  }
  if (userAgent.includes('Edge')) return 'Microsoft Edge'

  // OS 정보 포함
  if (userAgent.includes('Windows')) return '윈도우 PC'
  if (userAgent.includes('Mac')) return 'Mac 컴퓨터'
  if (userAgent.includes('Linux')) return '리눅스 컴퓨터'
  if (userAgent.includes('Android')) return 'Android 기기'
  if (userAgent.includes('iPhone')) return 'iPhone'
  if (userAgent.includes('iPad')) return 'iPad'

  return '알 수 없는 기기'
}

/**
 * 위치 정보 추정 (IP 기반 - 간단한 버전)
 */
export function estimateLocation(ipAddress: string): string | null {
  // 실제 구현에서는 GeoIP 서비스 사용
  if (
    ipAddress.startsWith('127.') ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.')
  ) {
    return '로컬 네트워크'
  }

  // MVP에서는 간단한 추정만
  if (
    ipAddress.startsWith('175.') ||
    ipAddress.startsWith('210.') ||
    ipAddress.startsWith('211.')
  ) {
    return '대한민국'
  }

  return null // 위치 추정 불가
}

/**
 * 새 디바이스 세션 등록 또는 기존 세션 업데이트
 */
export async function registerOrUpdateDeviceSession(
  userAgent: string,
  ipAddress: string,
  options: {
    deviceName?: string
    isTrusted?: boolean
    expiresAt?: Date
  } = {}
) {
  const deviceId = generateDeviceFingerprint(userAgent, ipAddress)
  const now = new Date()

  try {
    // 기존 세션 확인
    const existingSession = await prisma.deviceSession.findFirst({
      where: { deviceId },
    })

    if (existingSession) {
      // 기존 세션 업데이트 (마지막 접근 시간 갱신)
      const updatedSession = await prisma.deviceSession.update({
        where: { id: existingSession.id },
        data: {
          lastAccessAt: now,
          ipAddress, // IP가 변경될 수 있음
          isActive: true,
          ...(options.expiresAt && { expiresAt: options.expiresAt }),
        },
      })
      return { session: updatedSession, isNewDevice: false }
    } else {
      // 새 디바이스 세션 생성
      const defaultDeviceName = options.deviceName || generateDeviceName(userAgent)
      const location = estimateLocation(ipAddress)

      const newSession = await prisma.deviceSession.create({
        data: {
          deviceId,
          deviceName: defaultDeviceName,
          userAgent,
          ipAddress,
          location,
          isTrusted: options.isTrusted || false,
          isActive: true,
          lastAccessAt: now,
          expiresAt: options.expiresAt,
        },
      })
      return { session: newSession, isNewDevice: true }
    }
  } catch (error) {
    console.error('디바이스 세션 등록/업데이트 실패:', error)
    throw new Error('디바이스 세션 처리에 실패했습니다.')
  }
}

/**
 * 디바이스를 신뢰할 수 있는 기기로 등록
 */
export async function markDeviceAsTrusted(deviceId: string, deviceName?: string) {
  try {
    const updatedSession = await prisma.deviceSession.update({
      where: { deviceId },
      data: {
        isTrusted: true,
        ...(deviceName && { deviceName }),
      },
    })
    return updatedSession
  } catch (error) {
    console.error('신뢰할 수 있는 기기 등록 실패:', error)
    throw new Error('기기 신뢰 등록에 실패했습니다.')
  }
}

/**
 * 디바이스 세션 비활성화 (로그아웃)
 */
export async function deactivateDeviceSession(deviceId: string) {
  try {
    const updatedSession = await prisma.deviceSession.update({
      where: { deviceId },
      data: { isActive: false },
    })
    return updatedSession
  } catch (error) {
    console.error('디바이스 세션 비활성화 실패:', error)
    throw new Error('세션 비활성화에 실패했습니다.')
  }
}

/**
 * 만료된 세션들을 정리 (배치 작업용)
 */
export async function cleanupExpiredSessions() {
  const now = new Date()

  try {
    const result = await prisma.deviceSession.updateMany({
      where: {
        OR: [
          { expiresAt: { lte: now } }, // 만료 시간이 지난 세션
          { lastAccessAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }, // 30일 동안 미접근 세션
        ],
      },
      data: { isActive: false },
    })

    // eslint-disable-next-line no-console
    console.log(`${result.count}개의 만료된 세션을 비활성화했습니다.`)
    return result.count
  } catch (error) {
    console.error('만료된 세션 정리 실패:', error)
    return 0
  }
}

/**
 * 활성 디바이스 세션 목록 조회
 */
export async function getActiveDeviceSessions(limit = 50) {
  try {
    const sessions = await prisma.deviceSession.findMany({
      where: { isActive: true },
      orderBy: { lastAccessAt: 'desc' },
      take: limit,
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        ipAddress: true,
        location: true,
        isTrusted: true,
        lastAccessAt: true,
        createdAt: true,
      },
    })

    return sessions
  } catch (error) {
    console.error('활성 세션 조회 실패:', error)
    return []
  }
}

/**
 * 의심스러운 접근 감지 (새로운 IP에서의 접근)
 */
export async function detectSuspiciousAccess(
  userAgent: string,
  currentIp: string
): Promise<{
  isSuspicious: boolean
  reason?: string
  existingSession?: Awaited<ReturnType<typeof prisma.deviceSession.findFirst>>
}> {
  const deviceId = generateDeviceFingerprint(userAgent, currentIp)

  try {
    // 같은 디바이스 ID의 기존 세션들을 찾기
    const existingSessions = await prisma.deviceSession.findMany({
      where: { deviceId },
      orderBy: { lastAccessAt: 'desc' },
      take: 5, // 최근 5개 세션만 확인
    })

    if (existingSessions.length === 0) {
      // 완전히 새로운 디바이스
      return { isSuspicious: true, reason: '새로운 디바이스에서의 접근' }
    }

    const latestSession = existingSessions[0]

    // IP 주소가 다른 경우
    if (latestSession.ipAddress !== currentIp) {
      // 신뢰할 수 있는 기기가 아니면 의심스러운 접근으로 간주
      if (!latestSession.isTrusted) {
        return {
          isSuspicious: true,
          reason: '다른 IP 주소에서의 접근',
          existingSession: latestSession,
        }
      }
    }

    // 정상 접근
    return { isSuspicious: false, existingSession: latestSession }
  } catch (error) {
    console.error('의심스러운 접근 감지 실패:', error)
    // 에러 시 안전을 위해 의심스러운 접근으로 간주
    return { isSuspicious: true, reason: '접근 검증 오류' }
  }
}

/**
 * 동시 접속 제한 체크
 */
export async function checkConcurrentSessions(maxSessions = 5): Promise<{
  allowed: boolean
  activeSessions: number
  maxSessions: number
}> {
  try {
    const now = new Date()
    const recentThreshold = new Date(now.getTime() - 30 * 60 * 1000) // 30분 이내

    const activeSessions = await prisma.deviceSession.count({
      where: {
        isActive: true,
        lastAccessAt: { gte: recentThreshold },
      },
    })

    return {
      allowed: activeSessions < maxSessions,
      activeSessions,
      maxSessions,
    }
  } catch (error) {
    console.error('동시 접속 체크 실패:', error)
    // 에러 시 접속 허용 (서비스 중단 방지)
    return { allowed: true, activeSessions: 0, maxSessions }
  }
}
