'use client'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="space-y-3">
      {/* 진행 바 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 단계 레이블 */}
      <div className="flex justify-between">
        {labels.map((label, index) => {
          const stepNum = index + 1
          const isActive = stepNum === currentStep
          const isCompleted = stepNum < currentStep

          return (
            <div
              key={label}
              className={`flex flex-col items-center ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className="text-xs mt-1 hidden sm:block">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
