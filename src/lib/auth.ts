/**
 * 권한 검증 유틸리티
 *
 * 권한 레벨:
 * - MEMBER: 본인 정보 조회만 가능
 * - REGIONAL: 지역 회원 조회 가능
 * - LEADERSHIP: 전체 조회 가능
 * - ADMIN: 전체 조회/수정/삭제 가능
 */

export type Role = 'MEMBER' | 'REGIONAL' | 'LEADERSHIP' | 'ADMIN'

export type Permission = 'VIEW' | 'UPDATE' | 'DELETE' | 'CREATE'

export interface User {
  id: number
  role: Role
  memberId?: number // 회원인 경우 본인 회원 ID
  region?: string // 지역 담당자인 경우 담당 지역
}

// 역할별 권한 매핑
const rolePermissions: Record<Role, Permission[]> = {
  MEMBER: ['VIEW'],
  REGIONAL: ['VIEW'],
  LEADERSHIP: ['VIEW'],
  ADMIN: ['VIEW', 'UPDATE', 'DELETE', 'CREATE'],
}

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 */
export function hasPermission(user: User, permission: Permission): boolean {
  return rolePermissions[user.role].includes(permission)
}

/**
 * 사용자가 특정 회원 정보에 접근할 수 있는지 확인
 */
export function canAccessMember(user: User, targetMemberId: number): boolean {
  switch (user.role) {
    case 'ADMIN':
    case 'LEADERSHIP':
      return true
    case 'REGIONAL':
      // TODO: 지역 검증 로직 추가 필요
      return true
    case 'MEMBER':
      return user.memberId === targetMemberId
    default:
      return false
  }
}

/**
 * 사용자가 특정 작업을 수행할 수 있는지 확인
 */
export function canPerformAction(user: User, action: Permission, targetMemberId?: number): boolean {
  // 권한 체크
  if (!hasPermission(user, action)) {
    return false
  }

  // VIEW 권한의 경우 대상 회원 접근 권한도 확인
  if (action === 'VIEW' && targetMemberId !== undefined) {
    return canAccessMember(user, targetMemberId)
  }

  // UPDATE, DELETE는 ADMIN만 가능
  if (action === 'UPDATE' || action === 'DELETE') {
    return user.role === 'ADMIN'
  }

  return true
}

/**
 * 현재 사용자 정보 가져오기 (MVP: 세션/인증 시스템이 없으므로 임시 구현)
 *
 * TODO: 실제 인증 시스템 연동 시 수정 필요
 * - NextAuth.js 또는 자체 세션 관리 시스템 연동
 * - 쿠키/토큰 기반 인증
 */
export async function getCurrentUser(): Promise<User | null> {
  // MVP: 임시로 ADMIN 권한 부여
  // 실제 구현 시 세션에서 사용자 정보 조회
  return {
    id: 1,
    role: 'ADMIN',
  }
}

/**
 * 권한 검증 데코레이터 (Server Action용)
 */
export function withAuth(requiredPermission: Permission) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(action: T): T {
    return (async (...args: unknown[]) => {
      const user = await getCurrentUser()

      if (!user) {
        return { success: false, error: '인증이 필요합니다.' }
      }

      if (!hasPermission(user, requiredPermission)) {
        return { success: false, error: '권한이 없습니다.' }
      }

      return action(...args)
    }) as T
  }
}
