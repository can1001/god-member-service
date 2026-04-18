import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/client/LoginForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: '로그인 - 하나님나라연구소',
  description: '회원 로그인 페이지',
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">회원 로그인</CardTitle>
        <CardDescription>이메일과 비밀번호를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">아직 회원이 아니신가요? </span>
          <Link href="/join" className="text-blue-600 hover:underline font-medium">
            회원가입
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <Link href="/login?admin=true" className="text-xs text-gray-400 hover:text-gray-600">
            관리자 로그인
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  )
}
