import { Suspense } from 'react'
import Link from 'next/link'
import { SetPasswordForm } from '@/components/client/SetPasswordForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: '비밀번호 설정 - 성서유니온선교회',
  description: '회원 비밀번호 설정 페이지',
}

export default function SetPasswordPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">비밀번호 설정</CardTitle>
        <CardDescription>처음 로그인하시는 회원님은 비밀번호를 설정해주세요</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<SetPasswordFormSkeleton />}>
          <SetPasswordForm />
        </Suspense>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-gray-500 hover:text-gray-700">
            ← 로그인으로 돌아가기
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function SetPasswordFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  )
}
