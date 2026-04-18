'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

const SALT_ROUNDS = 12
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15분

type LoginResult =
  | { success: true; redirectTo: string; error?: never; needsPasswordSetup?: never; email?: never }
  | {
      success: false
      error: string
      needsPasswordSetup?: boolean
      email?: string
      redirectTo?: never
    }

/**
 * 로그인
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    // 이메일로 회원 조회
    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!member) {
      return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }

    // 계정 잠금 확인
    if (member.lockedUntil && member.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((member.lockedUntil.getTime() - Date.now()) / 60000)
      return {
        success: false,
        error: `계정이 잠겼습니다. ${remainingMinutes}분 후 다시 시도해주세요.`,
      }
    }

    // 비밀번호가 설정되지 않은 경우
    if (!member.passwordHash) {
      return {
        success: false,
        error: 'PASSWORD_NOT_SET',
        needsPasswordSetup: true,
        email: member.email,
      }
    }

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, member.passwordHash)

    if (!isValid) {
      // 실패 횟수 증가
      const newFailedCount = member.failedLoginCount + 1
      const updates: { failedLoginCount: number; lockedUntil?: Date } = {
        failedLoginCount: newFailedCount,
      }

      // 최대 실패 횟수 초과 시 계정 잠금
      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
      }

      await prisma.member.update({
        where: { id: member.id },
        data: updates,
      })

      const remaining = MAX_FAILED_ATTEMPTS - newFailedCount
      if (remaining > 0) {
        return {
          success: false,
          error: `이메일 또는 비밀번호가 올바르지 않습니다. (${remaining}회 남음)`,
        }
      } else {
        return {
          success: false,
          error: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
        }
      }
    }

    // 로그인 성공: 실패 횟수 초기화 및 마지막 로그인 시간 업데이트
    await prisma.member.update({
      where: { id: member.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    // 세션 생성 (일반 회원은 MEMBER 역할)
    await createSession({
      memberId: member.id,
      role: 'MEMBER',
      email: member.email,
      name: member.name,
    })

    return { success: true, redirectTo: '/my' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' }
  }
}

type AdminLoginResult =
  | { success: true; redirectTo: string; error?: never }
  | { success: false; error: string; redirectTo?: never }

/**
 * 관리자 로그인
 */
export async function adminLogin(email: string, password: string): Promise<AdminLoginResult> {
  try {
    // 관리자 이메일 확인 (환경변수로 관리)
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@god.or.kr').split(',')

    if (!adminEmails.includes(email.toLowerCase().trim())) {
      return { success: false, error: '관리자 권한이 없습니다.' }
    }

    // 관리자 비밀번호 확인 (환경변수)
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      return { success: false, error: '관리자 설정이 올바르지 않습니다.' }
    }

    if (password !== adminPassword) {
      return { success: false, error: '비밀번호가 올바르지 않습니다.' }
    }

    // 관리자 세션 생성
    await createSession({
      memberId: 0, // 관리자는 memberId 0
      role: 'ADMIN',
      email: email,
      name: '관리자',
    })

    return { success: true, redirectTo: '/dashboard' }
  } catch (error) {
    console.error('Admin login error:', error)
    return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' }
  }
}

/**
 * 로그아웃
 */
export async function logout() {
  await deleteSession()
  redirect('/login')
}

/**
 * 비밀번호 설정 (기존 회원용)
 */
export async function setPassword(email: string, password: string) {
  try {
    // 비밀번호 유효성 검사
    if (password.length < 8) {
      return { success: false, error: '비밀번호는 8자 이상이어야 합니다.' }
    }

    // 회원 조회
    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!member) {
      return { success: false, error: '회원 정보를 찾을 수 없습니다.' }
    }

    // 이미 비밀번호가 설정된 경우
    if (member.passwordHash) {
      return { success: false, error: '이미 비밀번호가 설정되어 있습니다.' }
    }

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // 비밀번호 저장
    await prisma.member.update({
      where: { id: member.id },
      data: {
        passwordHash,
        lastLoginAt: new Date(),
      },
    })

    // 세션 생성 (자동 로그인)
    await createSession({
      memberId: member.id,
      role: 'MEMBER',
      email: member.email,
      name: member.name,
    })

    return { success: true, redirectTo: '/my' }
  } catch (error) {
    console.error('Set password error:', error)
    return { success: false, error: '비밀번호 설정 중 오류가 발생했습니다.' }
  }
}

/**
 * 비밀번호 변경 (로그인된 회원용)
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'MEMBER') {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 새 비밀번호 유효성 검사
    if (newPassword.length < 8) {
      return { success: false, error: '새 비밀번호는 8자 이상이어야 합니다.' }
    }

    // 회원 조회
    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
    })

    if (!member || !member.passwordHash) {
      return { success: false, error: '회원 정보를 찾을 수 없습니다.' }
    }

    // 현재 비밀번호 확인
    const isValid = await bcrypt.compare(currentPassword, member.passwordHash)
    if (!isValid) {
      return { success: false, error: '현재 비밀번호가 올바르지 않습니다.' }
    }

    // 새 비밀번호 해시
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // 비밀번호 업데이트
    await prisma.member.update({
      where: { id: member.id },
      data: { passwordHash },
    })

    return { success: true }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: '비밀번호 변경 중 오류가 발생했습니다.' }
  }
}

/**
 * 현재 로그인된 사용자 정보 조회
 */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session) {
    return null
  }

  if (session.role === 'ADMIN') {
    return {
      id: session.memberId,
      role: session.role,
      email: session.email,
      name: session.name,
    }
  }

  // 회원인 경우 DB에서 최신 정보 조회
  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: {
      id: true,
      name: true,
      email: true,
      memberType: true,
      isActive: true,
    },
  })

  if (!member || !member.isActive) {
    await deleteSession()
    return null
  }

  return {
    id: member.id,
    role: 'MEMBER' as const,
    email: member.email,
    name: member.name,
    memberType: member.memberType,
  }
}
