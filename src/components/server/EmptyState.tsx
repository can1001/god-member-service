import { FileX, Users, CreditCard, Gift, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: 'users' | 'fees' | 'donations' | 'search' | 'general'
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

const iconMap = {
  users: Users,
  fees: CreditCard,
  donations: Gift,
  search: Search,
  general: FileX,
}

export function EmptyState({
  icon = 'general',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  const IconComponent = iconMap[icon]

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
      <div className="rounded-full bg-muted/50 p-6 mb-4">
        <IconComponent className="h-10 w-10 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{description}</p>
      )}

      {actionLabel && (actionHref || onAction) && (
        <div className="flex gap-2">
          {actionHref ? (
            <a href={actionHref}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button onClick={onAction}>
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// 사전 정의된 빈 상태 컴포넌트들
export function EmptyMembers() {
  return (
    <EmptyState
      icon="users"
      title="등록된 회원이 없습니다"
      description="새로운 회원을 등록하여 회원 관리를 시작해보세요."
      actionLabel="회원 등록"
      actionHref="/members/new"
    />
  )
}

export function EmptyMemberSearch({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="검색 결과가 없습니다"
      description="검색 조건을 변경하거나 다른 키워드로 시도해보세요."
      actionLabel="검색 초기화"
      onAction={onClear}
    />
  )
}

export function EmptyFees() {
  return (
    <EmptyState
      icon="fees"
      title="회비 내역이 없습니다"
      description="회원을 먼저 등록하시면 회비 내역이 자동으로 생성됩니다."
      actionLabel="회원 등록"
      actionHref="/members/new"
    />
  )
}

export function EmptyDonations() {
  return (
    <EmptyState
      icon="donations"
      title="후원금 내역이 없습니다"
      description="첫 번째 후원금을 등록하여 후원 관리를 시작해보세요."
      actionLabel="후원금 등록"
    />
  )
}

export function EmptyDashboard() {
  return (
    <EmptyState
      icon="general"
      title="데이터가 준비 중입니다"
      description="회원과 후원금 데이터가 등록되면 대시보드에 표시됩니다."
      actionLabel="회원 등록하기"
      actionHref="/members/new"
    />
  )
}
