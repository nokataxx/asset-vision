import type { AnnualPlan, IncomeExpensePlan } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface AnnualPlanTableProps {
  plans: AnnualPlan[]
  onChange: (plans: AnnualPlan[]) => void
  onRegenerate: () => void
}

export function AnnualPlanTable({
  plans,
  onChange,
  onRegenerate,
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">年次収支テーブル</CardTitle>
        <Button variant="outline" size="sm" onClick={onRegenerate}>
          <RefreshCw className="h-4 w-4 mr-1" />
          再生成
        </Button>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            上記の基本設定を入力すると、年次テーブルが自動生成されます
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 sticky top-0 bg-background">年</TableHead>
                  <TableHead className="w-16 sticky top-0 bg-background">年齢</TableHead>
                  <TableHead className="w-28 sticky top-0 bg-background">収入</TableHead>
                  <TableHead className="w-28 sticky top-0 bg-background">基本生活費</TableHead>
                  <TableHead className="w-28 sticky top-0 bg-background">臨時支出</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan, index) => (
                  <TableRow key={plan.year}>
                    <TableCell className="font-medium">{plan.year}</TableCell>
                    <TableCell>{plan.age}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={plan.income || ''}
                        onChange={(e) =>
                          handleCellChange(
                            index,
                            'income',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={plan.basicExpense || ''}
                        onChange={(e) =>
                          handleCellChange(
                            index,
                            'basicExpense',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={plan.extraExpense || ''}
                        onChange={(e) =>
                          handleCellChange(
                            index,
                            'extraExpense',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 年次計画を自動生成するユーティリティ関数
export function generateAnnualPlans(
  basePlan: IncomeExpensePlan,
  currentAge: number
): AnnualPlan[] {
  const plans: AnnualPlan[] = []

  for (let i = 0; i < basePlan.duration; i++) {
    const year = basePlan.startYear + i
    const age = currentAge + i
    const income =
      basePlan.initialIncome * Math.pow(1 + basePlan.incomeGrowthRate / 100, i)
    const basicExpense =
      basePlan.initialExpense * Math.pow(1 + basePlan.expenseGrowthRate / 100, i)

    plans.push({
      year,
      age,
      income: Math.round(income * 10) / 10,
      basicExpense: Math.round(basicExpense * 10) / 10,
      extraExpense: 0,
    })
  }

  return plans
}
