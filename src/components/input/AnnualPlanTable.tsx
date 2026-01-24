import type { AnnualPlan } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface AnnualPlanTableProps {
  plans: AnnualPlan[]
  onChange: (plans: AnnualPlan[]) => void
  incomeGrowthRate: number
  expenseGrowthRate: number
}

export function AnnualPlanTable({
  plans,
  onChange,
  incomeGrowthRate,
  expenseGrowthRate,
}: AnnualPlanTableProps) {
  const handleCellChange = (
    index: number,
    field: keyof AnnualPlan,
    value: number
  ) => {
    const newPlans = [...plans]
    newPlans[index] = { ...newPlans[index], [field]: value }
    onChange(newPlans)
  }

  // 収入を変更したら、それ以降の年に成長率を適用
  const handleIncomeChange = (index: number, value: number) => {
    const newPlans = [...plans]
    newPlans[index] = { ...newPlans[index], income: value }

    // 以降の年に成長率を適用
    for (let i = index + 1; i < newPlans.length; i++) {
      const prevIncome = newPlans[i - 1].income
      const newIncome = prevIncome * (1 + incomeGrowthRate / 100)
      newPlans[i] = { ...newPlans[i], income: Math.round(newIncome * 10) / 10 }
    }

    onChange(newPlans)
  }

  // 生活費を変更したら、それ以降の年に成長率を適用
  const handleExpenseChange = (index: number, value: number) => {
    const newPlans = [...plans]
    newPlans[index] = { ...newPlans[index], basicExpense: value }

    // 以降の年に成長率を適用
    for (let i = index + 1; i < newPlans.length; i++) {
      const prevExpense = newPlans[i - 1].basicExpense
      const newExpense = prevExpense * (1 + expenseGrowthRate / 100)
      newPlans[i] = { ...newPlans[i], basicExpense: Math.round(newExpense * 10) / 10 }
    }

    onChange(newPlans)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">年次収支テーブル</CardTitle>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            上記の基本設定を入力すると、年次テーブルが自動生成されます
          </p>
        ) : (
          <div className="border rounded-md">
            {/* 固定ヘッダー */}
            <div className="border-b bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="w-16 h-10 px-2 text-left font-medium">年</th>
                    <th className="w-16 h-10 px-2 text-left font-medium">年齢</th>
                    <th className="w-28 h-10 px-2 text-left font-medium">収入</th>
                    <th className="w-28 h-10 px-2 text-left font-medium">生活費</th>
                    <th className="w-28 h-10 px-2 text-left font-medium">臨時支出</th>
                  </tr>
                </thead>
              </table>
            </div>
            {/* スクロール可能なボディ */}
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {plans.map((plan, index) => (
                    <tr key={plan.year} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="w-16 p-2 font-medium">{plan.year}</td>
                      <td className="w-16 p-2">{plan.age}</td>
                      <td className="w-28 p-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={plan.income || ''}
                            onChange={(e) =>
                              handleIncomeChange(index, parseFloat(e.target.value) || 0)
                            }
                          />
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => handleIncomeChange(index, 0)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="w-28 p-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={plan.basicExpense || ''}
                            onChange={(e) =>
                              handleExpenseChange(index, parseFloat(e.target.value) || 0)
                            }
                          />
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => handleExpenseChange(index, 0)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="w-28 p-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={plan.extraExpense || ''}
                            onChange={(e) =>
                              handleCellChange(
                                index,
                                'extraExpense',
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCellChange(index, 'extraExpense', 0)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
