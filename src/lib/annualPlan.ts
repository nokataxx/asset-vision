import type { AnnualPlan, IncomeExpensePlan } from '@/types'

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
