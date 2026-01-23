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

    plans.push({
      year,
      age,
      income: 0,
      basicExpense: 0,
      extraExpense: 0,
    })
  }

  return plans
}
