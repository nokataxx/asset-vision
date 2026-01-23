import type { IncomeExpensePlan } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface IncomeExpenseSettingsProps {
  plan: IncomeExpensePlan
  onChange: (plan: IncomeExpensePlan) => void
  age: number
  onAgeChange: (age: number) => void
}

export function IncomeExpenseSettings({ plan, onChange, age, onAgeChange }: IncomeExpenseSettingsProps) {
  const handleChange = (field: keyof IncomeExpensePlan, value: number) => {
    onChange({ ...plan, [field]: value })
  }

  return (
    <Card>
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
              onChange={(e) =>
                handleChange('startYear', parseInt(e.target.value) || 0)
              }
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
              onChange={(e) =>
                handleChange('duration', parseInt(e.target.value) || 0)
              }
              placeholder="30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 初期収入 */}
          <div className="space-y-2">
            <Label htmlFor="initialIncome">収入（万円/年）</Label>
            <Input
              id="initialIncome"
              type="number"
              value={plan.initialIncome || ''}
              onChange={(e) =>
                handleChange('initialIncome', parseFloat(e.target.value) || 0)
              }
              placeholder="0"
            />
          </div>

          {/* 収入成長率 */}
          <div className="space-y-2">
            <Label htmlFor="incomeGrowthRate">収入成長率（%）</Label>
            <Input
              id="incomeGrowthRate"
              type="number"
              step="0.1"
              value={plan.incomeGrowthRate || ''}
              onChange={(e) =>
                handleChange('incomeGrowthRate', parseFloat(e.target.value) || 0)
              }
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 初期基本生活費 */}
          <div className="space-y-2">
            <Label htmlFor="initialExpense">生活費（万円/年）</Label>
            <Input
              id="initialExpense"
              type="number"
              value={plan.initialExpense || ''}
              onChange={(e) =>
                handleChange('initialExpense', parseFloat(e.target.value) || 0)
              }
              placeholder="0"
            />
          </div>

          {/* 基本生活費成長率 */}
          <div className="space-y-2">
            <Label htmlFor="expenseGrowthRate">生活費成長率（%）</Label>
            <Input
              id="expenseGrowthRate"
              type="number"
              step="0.1"
              value={plan.expenseGrowthRate || ''}
              onChange={(e) =>
                handleChange('expenseGrowthRate', parseFloat(e.target.value) || 0)
              }
              placeholder="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
