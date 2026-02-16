import { describe, it, expect } from 'vitest'
import {
  calculatePercentile,
  calculateDepletionProbability,
  calculateSafeWithdrawalRate,
} from '../statistics'
import type { TrialResult, AnnualPlan } from '@/types'

// --- calculatePercentile ---
describe('calculatePercentile', () => {
  it('空配列は0を返す', () => {
    expect(calculatePercentile([], 50)).toBe(0)
  })

  it('単一要素は常にその値を返す', () => {
    expect(calculatePercentile([42], 0)).toBe(42)
    expect(calculatePercentile([42], 50)).toBe(42)
    expect(calculatePercentile([42], 100)).toBe(42)
  })

  it('50パーセンタイル（中央値）', () => {
    // [1, 2, 3, 4, 5] → 中央値 = 3
    expect(calculatePercentile([1, 2, 3, 4, 5], 50)).toBe(3)
  })

  it('25パーセンタイル', () => {
    // [10, 20, 30, 40, 50] → index = 0.25 * 4 = 1.0 → sorted[1] = 20
    expect(calculatePercentile([10, 20, 30, 40, 50], 25)).toBe(20)
  })

  it('75パーセンタイル', () => {
    // [10, 20, 30, 40, 50] → index = 0.75 * 4 = 3.0 → sorted[3] = 40
    expect(calculatePercentile([10, 20, 30, 40, 50], 75)).toBe(40)
  })

  it('ソートされていない配列でも正しく計算', () => {
    expect(calculatePercentile([50, 10, 40, 20, 30], 50)).toBe(30)
  })

  it('補間が正しく動く', () => {
    // [10, 20, 30, 40] → 50パーセンタイル: index = 0.5 * 3 = 1.5
    // lower=1 (20), upper=2 (30), fraction=0.5 → 20*0.5 + 30*0.5 = 25
    expect(calculatePercentile([10, 20, 30, 40], 50)).toBe(25)
  })
})

// --- calculateDepletionProbability ---
describe('calculateDepletionProbability', () => {
  function makeTrial(depleted: boolean): TrialResult {
    return {
      yearlyResults: [],
      depletionYear: depleted ? 2030 : null,
      crashCount: 0,
    }
  }

  it('全試行が枯渇なら100%', () => {
    const trials = [makeTrial(true), makeTrial(true), makeTrial(true)]
    expect(calculateDepletionProbability(trials)).toBe(100)
  })

  it('枯渇なしなら0%', () => {
    const trials = [makeTrial(false), makeTrial(false)]
    expect(calculateDepletionProbability(trials)).toBe(0)
  })

  it('半数が枯渇なら50%', () => {
    const trials = [makeTrial(true), makeTrial(false), makeTrial(true), makeTrial(false)]
    expect(calculateDepletionProbability(trials)).toBe(50)
  })
})

// --- calculateSafeWithdrawalRate ---
describe('calculateSafeWithdrawalRate', () => {
  const plans: AnnualPlan[] = [
    { year: 2026, age: 60, income: 100, basicExpense: 300, extraExpense: 0 },
    { year: 2027, age: 61, income: 100, basicExpense: 300, extraExpense: 0 },
  ]

  it('正常ケース: 平均取崩し額 / 初期資産', () => {
    // 各年の取崩し = max(0, 300 - 100) = 200
    // 平均取崩し = 200, 初期資産 = 5000
    // SWR = 200 / 5000 * 100 = 4.0%
    const result = calculateSafeWithdrawalRate(plans, 5000)
    expect(result).toBe(4.0)
  })

  it('初期資産0ならnull', () => {
    expect(calculateSafeWithdrawalRate(plans, 0)).toBeNull()
  })

  it('空のプランならnull', () => {
    expect(calculateSafeWithdrawalRate([], 5000)).toBeNull()
  })

  it('収入が支出を上回れば取崩し0でnull', () => {
    const surplusPlans: AnnualPlan[] = [
      { year: 2026, age: 60, income: 500, basicExpense: 200, extraExpense: 0 },
    ]
    expect(calculateSafeWithdrawalRate(surplusPlans, 5000)).toBeNull()
  })
})
