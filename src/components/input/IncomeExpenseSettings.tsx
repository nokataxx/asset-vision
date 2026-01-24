import type { IncomeExpensePlan } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SpinInput } from '@/components/ui/spin-input'
import { Label } from '@/components/ui/label'

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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>収支計画</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 現在の年齢 */}
          <div className="space-y-2">
            <Label htmlFor="age">現在の年齢（歳）</Label>
            <Input
              id="age"
              type="number"
              value={age || ''}
              onChange={(e) => onAgeChange(parseInt(e.target.value) || 0)}
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
              value={plan.startYear || ''}
              onChange={(e) => handleIntChange('startYear', e.target.value)}
              placeholder={new Date().getFullYear().toString()}
            />
          </div>

          {/* シミュレーション期間 */}
          <div className="space-y-2">
            <Label htmlFor="duration">期間（年）</Label>
            <Input
              id="duration"
              type="number"
              value={plan.duration || ''}
              onChange={(e) => handleIntChange('duration', e.target.value)}
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
              value={plan.incomeGrowthRate || ''}
              onChange={(value) => handleFloatChange('incomeGrowthRate', value)}
              step={0.5}
              placeholder="0"
            />
          </div>

          {/* 基本生活費成長率 */}
          <div className="space-y-2">
            <Label htmlFor="expenseGrowthRate">生活費成長率（%）</Label>
            <SpinInput
              id="expenseGrowthRate"
              value={plan.expenseGrowthRate || ''}
              onChange={(value) => handleFloatChange('expenseGrowthRate', value)}
              step={0.5}
              placeholder="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
