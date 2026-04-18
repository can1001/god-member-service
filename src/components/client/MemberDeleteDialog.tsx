'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteMember } from '@/app/actions/members'
import { toast } from 'sonner'

interface MemberDeleteDialogProps {
  memberId: number
  memberName: string
  onDelete?: () => void
}

export function MemberDeleteDialog({ memberId, memberName, onDelete }: MemberDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteMember(memberId)

      if (result.success) {
        toast.success(result.message || '회원이 성공적으로 삭제되었습니다.')
        setOpen(false)
        onDelete?.()
      } else {
        toast.error(result.error || '회원 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error('회원 삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          />
        }
      >
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            회원 삭제 확인
          </DialogTitle>
          <DialogDescription className="text-left">
            <strong>{memberName}</strong> 회원을 삭제하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">주의사항</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 회비 또는 후원 내역이 있는 회원은 완전히 삭제되지 않고 비활성화됩니다.</li>
              <li>• 관련 데이터가 없는 회원만 완전히 삭제됩니다.</li>
              <li>• 삭제된 데이터는 복구할 수 없습니다.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
