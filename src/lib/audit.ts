/**
 * 감사 로그 유틸리티
 *
 * 기록 항목:
 * - VIEW: 조회
 * - UPDATE: 수정
 * - DELETE: 삭제
 * - CREATE: 생성
 * - DOWNLOAD: 다운로드
 * - LOGIN: 로그인
 * - LOGOUT: 로그아웃
 */

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'

export type AuditAction =
  | 'MEMBER_VIEW'
  | 'MEMBER_UPDATE'
  | 'MEMBER_DELETE'
  | 'MEMBER_CREATE'
  | 'DOCUMENT_DOWNLOAD'
  | 'CERTIFICATE_ISSUE'
  | 'LOGIN'
  | 'LOGOUT'

export type ResourceType = 'MEMBER' | 'FEE' | 'DONATION' | 'DOCUMENT' | 'CERTIFICATE' | 'SYSTEM'

export interface AuditLogParams {
  action: AuditAction
  resourceType: ResourceType
  resourceId?: number
  details?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * 감사 로그 기록
 */
export async function logAccess(params: AuditLogParams): Promise<void> {
  try {
    const user = await getCurrentUser()

    await prisma.accessLog.create({
      data: {
        action: params.action,
        resource: params.resourceId
          ? `${params.resourceType}:${params.resourceId}`
          : params.resourceType,
        userId: user?.id?.toString() ?? 'anonymous',
        ipAddress: params.ipAddress ?? '127.0.0.1',
        userAgent: params.userAgent,
        details: params.details ? { message: params.details } : undefined,
        successful: true,
      },
    })
  } catch (error) {
    // 로그 기록 실패해도 메인 작업에 영향 없도록 처리
    console.error('Failed to log access:', error)
  }
}

/**
 * 회원 조회 로그 기록
 */
export async function logMemberView(memberId: number, memberName: string): Promise<void> {
  await logAccess({
    action: 'MEMBER_VIEW',
    resourceType: 'MEMBER',
    resourceId: memberId,
    details: `Viewed member: ${memberName}`,
  })
}

/**
 * 회원 수정 로그 기록
 */
export async function logMemberUpdate(
  memberId: number,
  memberName: string,
  changes?: object
): Promise<void> {
  await logAccess({
    action: 'MEMBER_UPDATE',
    resourceType: 'MEMBER',
    resourceId: memberId,
    details: `Updated member: ${memberName}${changes ? ` - ${JSON.stringify(changes)}` : ''}`,
  })
}

/**
 * 회원 삭제 로그 기록
 */
export async function logMemberDelete(memberId: number, memberName: string): Promise<void> {
  await logAccess({
    action: 'MEMBER_DELETE',
    resourceType: 'MEMBER',
    resourceId: memberId,
    details: `Deleted member: ${memberName}`,
  })
}

/**
 * 문서 다운로드 로그 기록
 */
export async function logDocumentDownload(
  documentId: number,
  fileName: string,
  memberId: number
): Promise<void> {
  await logAccess({
    action: 'DOCUMENT_DOWNLOAD',
    resourceType: 'DOCUMENT',
    resourceId: documentId,
    details: `Downloaded document: ${fileName} for member ID ${memberId}`,
  })
}

/**
 * 증명서 발급 로그 기록
 */
export async function logCertificateIssue(
  certificateType: string,
  memberId: number,
  memberName: string
): Promise<void> {
  await logAccess({
    action: 'CERTIFICATE_ISSUE',
    resourceType: 'CERTIFICATE',
    resourceId: memberId,
    details: `Issued ${certificateType} for member: ${memberName}`,
  })
}

/**
 * 최근 감사 로그 조회
 */
export async function getRecentLogs(limit = 100): Promise<unknown[]> {
  return prisma.accessLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

/**
 * 특정 리소스의 감사 로그 조회
 */
export async function getResourceLogs(
  resourceType: ResourceType,
  resourceId: number,
  limit = 50
): Promise<unknown[]> {
  return prisma.accessLog.findMany({
    where: {
      resource: `${resourceType}:${resourceId}`,
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}
