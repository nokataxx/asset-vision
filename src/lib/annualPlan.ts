import type { AnnualPlan, IncomeExpensePlan } from '@/types'

// 年次計画を自動生成するユーティリティ関数
// existingPlansが指定された場合、インデックスに基づいて既存の値を保持
export function generateAnnualPlans(
  basePlan: IncomeExpensePlan,
  currentAge: number,
  existingPlans: AnnualPlan[] = []
): AnnualPlan[] {
  const plans: AnnualPlan[] = []

  for (let i = 0; i < basePlan.duration; i++) {
    const year = basePlan.startYear + i
    const age = currentAge + i

    // 既存の値があれば保持、なければ0
    const existing = existingPlans[i]

    plans.push({
      year,
      age,
      income: existing?.income ?? 0,
      basicExpense: existing?.basicExpense ?? 0,
      extraExpense: existing?.extraExpense ?? 0,
    })
  }

  return plans
}
