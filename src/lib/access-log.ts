import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export interface AccessLogData {
  action: string
  resource?: string
  userId?: string
  userAgent?: string
  ipAddress: string
  successful?: boolean
  details?: Prisma.InputJsonValue
}

/**
 * 접근 로그를 기록합니다.
 * GDPR 및 개인정보보호법 준수를 위한 감사 추적 기능
 */
export async function logAccess(data: AccessLogData) {
  try {
    await prisma.accessLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        successful: data.successful ?? true,
        details: data.details || undefined,
      },
    })
  } catch (error) {
    // 로그 기록 실패가 메인 기능을 방해하지 않도록 에러를 콘솔에만 기록
    console.error('접근 로그 기록 실패:', error)
  }
}

/**
 * 요청에서 클라이언트 정보를 추출합니다.
 */
export function getClientInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-remote-addr')

  // IP 주소 우선순위: x-forwarded-for > x-real-ip > x-remote-addr > fallback
  let ipAddress = '127.0.0.1' // fallback for local development

  if (forwarded) {
    ipAddress = forwarded.split(',')[0].trim()
  } else if (realIP) {
    ipAddress = realIP
  } else if (remoteAddr) {
    ipAddress = remoteAddr
  }

  return {
    userAgent,
    ipAddress,
  }
}

/**
 * 접근 로그 조회 (관리자용)
 */
export async function getAccessLogs(options: {
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const { action, resource, startDate, endDate, limit = 100 } = options

  const where: Prisma.AccessLogWhereInput = {}

  if (action) where.action = action
  if (resource) where.resource = resource
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  return await prisma.accessLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

/**
 * 특정 리소스에 대한 접근 통계
 */
export async function getAccessStats(resource: string, days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const stats = await prisma.accessLog.groupBy({
    by: ['action'],
    where: {
      resource,
      timestamp: {
        gte: startDate,
      },
    },
    _count: {
      id: true,
    },
  })

  return stats.reduce(
    (acc, stat) => {
      acc[stat.action] = stat._count.id
      return acc
    },
    {} as Record<string, number>
  )
}
