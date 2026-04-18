'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onPrev: () => void
  onNext: () => void
  isSubmitting: boolean
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  isSubmitting,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  return (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        className="flex-1 h-12"
        onClick={onPrev}
        disabled={isFirstStep || isSubmitting}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        이전
      </Button>
      <Button type="button" className="flex-1 h-12" onClick={onNext} disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            처리 중...
          </>
        ) : isLastStep ? (
          '가입하기'
        ) : (
          <>
            다음
            <ChevronRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  )
}
