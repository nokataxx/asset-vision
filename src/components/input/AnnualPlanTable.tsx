import type { AnnualPlan } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RefreshCw, X } from 'lucide-react'

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
    <Card className="h-full">
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
                              handleCellChange(
                                index,
                                'income',
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCellChange(index, 'income', 0)}
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
                              handleCellChange(
                                index,
                                'basicExpense',
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCellChange(index, 'basicExpense', 0)}
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
