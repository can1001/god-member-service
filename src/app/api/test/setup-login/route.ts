import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// 테스트용 API - 프로덕션에서는 삭제하세요
export async function GET() {
  try {
    // 회원 목록 조회
    const members = await prisma.member.findMany({
      select: { id: true, name: true, email: true, passwordHash: true },
      take: 5,
    })

    // 첫 번째 회원에 테스트 비밀번호 설정
    if (members.length > 0) {
      const testMember = members[0]
      const testPassword = 'test1234'
      const passwordHash = await bcrypt.hash(testPassword, 12)

      await prisma.member.update({
        where: { id: testMember.id },
        data: { passwordHash },
      })

      return NextResponse.json({
        success: true,
        message: '테스트 계정 설정 완료',
        testAccount: {
          email: testMember.email,
          password: testPassword,
        },
        members: members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          hasPassword: !!m.passwordHash,
        })),
      })
    }

    return NextResponse.json({
      success: false,
      message: '회원이 없습니다',
    })
  } catch (error) {
    console.error('Test setup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    )
  }
}
