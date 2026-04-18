'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { login, adminLogin } from '@/app/actions/auth'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get('admin') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요.')
      return
    }

    startTransition(async () => {
      if (isAdmin) {
        const result = await adminLogin(email, password)
        if (result.success) {
          toast.success('로그인 성공!')
          router.push(result.redirectTo)
          router.refresh()
        } else {
          toast.error(result.error || '로그인에 실패했습니다.')
        }
      } else {
        const result = await login(email, password)
        if (result.success) {
          toast.success('로그인 성공!')
          router.push(result.redirectTo)
          router.refresh()
        } else if (result.needsPasswordSetup) {
          // 비밀번호 설정 필요
          toast.info('비밀번호를 설정해주세요.')
          router.push(`/set-password?email=${encodeURIComponent(result.email || '')}`)
        } else {
          toast.error(result.error || '로그인에 실패했습니다.')
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          autoComplete="email"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            로그인 중...
          </>
        ) : isAdmin ? (
          '관리자 로그인'
        ) : (
          '로그인'
        )}
      </Button>

      {isAdmin && (
        <p className="text-xs text-center text-gray-500">관리자 계정으로 로그인합니다.</p>
      )}
    </form>
  )
}
