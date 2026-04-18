import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MemberRegistrationForm } from '@/components/client/MemberRegistrationForm'

export default function NewMemberPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/members">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">회원 등록</h1>
            <p className="mt-1 text-sm text-gray-600">새로운 회원을 등록할 수 있습니다.</p>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <MemberRegistrationForm />
      </div>
    </div>
  )
}
