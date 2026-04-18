import { JoinWizard } from '@/components/client/join/JoinWizard'

export const metadata = {
  title: '회원가입 | 하나님나라연구소',
  description: '하나님나라연구소 회원가입 페이지',
}

export default function JoinPage() {
  return (
    <div className="px-4 py-6">
      <JoinWizard />
    </div>
  )
}
