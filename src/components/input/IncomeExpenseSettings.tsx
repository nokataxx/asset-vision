import { DEFAULT_ASSETS, DEFAULT_INCOME_EXPENSE_PLAN, type IncomeExpensePlan } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SpinInput } from '@/components/ui/spin-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { VALIDATION_CONSTRAINTS, clampValue } from '@/lib/validation'

interface IncomeExpenseSettingsProps {
  plan: IncomeExpensePlan
  onChange: (plan: IncomeExpensePlan) => void
  age: number
  onAgeChange: (age: number) => void
}

export function IncomeExpenseSettings({ plan, onChange, age, onAgeChange }: IncomeExpenseSettingsProps) {
  const handleIntChange = (field: keyof IncomeExpensePlan, value: string) => {
    onChange({ ...plan, [field]: parseInt(value) || 0 })
  }

  const handleFloatChange = (field: keyof IncomeExpensePlan, value: string) => {
    onChange({ ...plan, [field]: parseFloat(value) || 0 })
  }

  const handleAgeBlur = () => {
    const clampedAge = clampValue(age, 'age')
    if (age !== clampedAge) {
      onAgeChange(clampedAge)
    }
  }

  const handleDurationBlur = () => {
    const clampedDuration = clampValue(plan.duration, 'duration')
    if (plan.duration !== clampedDuration) {
      onChange({ ...plan, duration: clampedDuration })
    }
  }

  const handleStartYearBlur = () => {
    const clampedStartYear = clampValue(plan.startYear, 'startYear')
    if (plan.startYear !== clampedStartYear) {
      onChange({ ...plan, startYear: clampedStartYear })
    }
  }

  const handleGrowthRateBlur = (field: 'incomeGrowthRate' | 'expenseGrowthRate') => {
    const clampedValue = clampValue(plan[field], 'growthRate')
    if (plan[field] !== clampedValue) {
      onChange({ ...plan, [field]: clampedValue })
    }
  }

  const handleReset = () => {
    onChange(DEFAULT_INCOME_EXPENSE_PLAN)
    onAgeChange(DEFAULT_ASSETS.age)
  }

  const { min: ageMin, max: ageMax } = VALIDATION_CONSTRAINTS.age
  const { min: durationMin, max: durationMax } = VALIDATION_CONSTRAINTS.duration
  const { min: startYearMin, max: startYearMax } = VALIDATION_CONSTRAINTS.startYear
  const { min: growthMin, max: growthMax } = VALIDATION_CONSTRAINTS.growthRate

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>収支計画</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          初期値
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 現在の年齢 */}
          <div className="space-y-2">
            <Label htmlFor="age">現在の年齢（歳）</Label>
            <Input
              id="age"
              type="number"
              min={ageMin}
              max={ageMax}
              value={age}
              onChange={(e) => onAgeChange(parseInt(e.target.value) || 0)}
              onBlur={handleAgeBlur}
              placeholder="30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 開始年 */}
          <div className="space-y-2">
            <Label htmlFor="startYear">開始年</Label>
            <Input
              id="startYear"
              type="number"
              min={startYearMin}
              max={startYearMax}
              value={plan.startYear}
              onChange={(e) => handleIntChange('startYear', e.target.value)}
              onBlur={handleStartYearBlur}
              placeholder={new Date().getFullYear().toString()}
            />
          </div>

          {/* シミュレーション期間 */}
          <div className="space-y-2">
            <Label htmlFor="duration">期間（年）</Label>
            <Input
              id="duration"
              type="number"
              min={durationMin}
              max={durationMax}
              value={plan.duration}
              onChange={(e) => handleIntChange('duration', e.target.value)}
              onBlur={handleDurationBlur}
              placeholder="30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 収入成長率 */}
          <div className="space-y-2">
            <Label htmlFor="incomeGrowthRate">収入成長率（%）</Label>
            <SpinInput
              id="incomeGrowthRate"
              value={plan.incomeGrowthRate}
              onChange={(value) => handleFloatChange('incomeGrowthRate', value)}
              onBlur={() => handleGrowthRateBlur('incomeGrowthRate')}
              step={0.5}
              min={growthMin}
              max={growthMax}
              placeholder="0"
            />
          </div>

          {/* 基本生活費成長率 */}
          <div className="space-y-2">
            <Label htmlFor="expenseGrowthRate">生活費成長率（%）</Label>
            <SpinInput
              id="expenseGrowthRate"
              value={plan.expenseGrowthRate}
              onChange={(value) => handleFloatChange('expenseGrowthRate', value)}
              onBlur={() => handleGrowthRateBlur('expenseGrowthRate')}
              step={0.5}
              min={growthMin}
              max={growthMax}
              placeholder="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
