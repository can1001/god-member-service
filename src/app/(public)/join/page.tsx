import { JoinWizard } from '@/components/client/join/JoinWizard'

export const metadata = {
  title: '회원가입 | 한국성서유니온선교회',
  description: '한국성서유니온선교회 회원가입 페이지',
}

export default function JoinPage() {
  return (
    <div className="px-4 py-6">
      <JoinWizard />
    </div>
  )
}
