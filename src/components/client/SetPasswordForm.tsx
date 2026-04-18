'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { setPassword as setPasswordAction } from '@/app/actions/auth'

export function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromQuery)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  // 비밀번호 유효성 검사
  const passwordValid = password.length >= 8
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('이메일을 입력해주세요.')
      return
    }

    if (!passwordValid) {
      toast.error('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    if (!passwordsMatch) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }

    startTransition(async () => {
      const result = await setPasswordAction(email, password)

      if (result.success) {
        toast.success('비밀번호가 설정되었습니다.')
        router.push(result.redirectTo || '/my')
        router.refresh()
      } else {
        toast.error(result.error || '비밀번호 설정에 실패했습니다.')
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
          placeholder="가입 시 입력한 이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending || !!emailFromQuery}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">새 비밀번호</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="8자 이상 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            autoComplete="new-password"
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
        <div className="flex items-center gap-1 text-xs">
          {password.length > 0 && (
            <>
              {passwordValid ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className={passwordValid ? 'text-green-600' : 'text-red-600'}>8자 이상</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="비밀번호를 다시 입력"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isPending}
          autoComplete="new-password"
        />
        <div className="flex items-center gap-1 text-xs">
          {confirmPassword.length > 0 && (
            <>
              {passwordsMatch ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className={passwordsMatch ? 'text-green-600' : 'text-red-600'}>
                {passwordsMatch ? '일치' : '불일치'}
              </span>
            </>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !passwordValid || !passwordsMatch}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            설정 중...
          </>
        ) : (
          '비밀번호 설정'
        )}
      </Button>
    </form>
  )
}
