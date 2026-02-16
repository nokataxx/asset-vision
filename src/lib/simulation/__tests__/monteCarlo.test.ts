import { describe, it, expect } from 'vitest'
import { runSingleTrial, runMonteCarloSimulation } from '../monteCarlo'
import type { SimulationParams } from '../monteCarlo'
import { DEFAULT_REGIME_SETTINGS } from '@/types'
import type { Assets, AnnualPlan } from '@/types'

const defaultAssets: Assets = {
  stocks: 3000,
  bonds: 1000,
  cash: 500,
  cashLimit: 500,
  bondsLimit: 1000,
  age: 60,
  foreignRatio: 0,
}

function makePlans(years: number, income = 0, expense = 200): AnnualPlan[] {
  return Array.from({ length: years }, (_, i) => ({
    year: 2026 + i,
    age: 60 + i,
    income,
    basicExpense: expense,
    extraExpense: 0,
  }))
}

// --- runSingleTrial ---
describe('runSingleTrial', () => {
  it('0年シミュレーション（空のannualPlans）でクラッシュしない', () => {
    const params: SimulationParams = {
      initialAssets: defaultAssets,
      annualPlans: [],
      regimeSettings: DEFAULT_REGIME_SETTINGS,
    }
    const result = runSingleTrial(params)
    expect(result.yearlyResults).toHaveLength(0)
    expect(result.depletionYear).toBeNull()
    expect(result.crashCount).toBe(0)
  })

  it('初期資産0+支出ありで即枯渇', () => {
    const params: SimulationParams = {
      initialAssets: { ...defaultAssets, stocks: 0, bonds: 0, cash: 0 },
      annualPlans: makePlans(5, 0, 200),
      regimeSettings: DEFAULT_REGIME_SETTINGS,
    }
    const result = runSingleTrial(params)
    expect(result.depletionYear).toBe(2026) // 初年度で枯渇
    expect(result.yearlyResults[0].isDepleted).toBe(true)
    expect(result.yearlyResults[0].totalAssets).toBe(0)
  })

  it('正常ケースで年次結果の構造が正しい', () => {
    const params: SimulationParams = {
      initialAssets: defaultAssets,
      annualPlans: makePlans(10, 100, 150),
      regimeSettings: DEFAULT_REGIME_SETTINGS,
    }
    const result = runSingleTrial(params)
    expect(result.yearlyResults).toHaveLength(10)
    expect(result.crashCount).toBeGreaterThanOrEqual(0)

    const firstYear = result.yearlyResults[0]
    expect(firstYear.year).toBe(2026)
    expect(firstYear.age).toBe(60)
    expect(firstYear.income).toBe(100)
    expect(firstYear.basicExpense).toBe(150)
    expect(firstYear.extraExpense).toBe(0)
    expect(['normal', 'crash', 'recovery']).toContain(firstYear.regime)
    expect(firstYear.stocksBalance).toBeGreaterThanOrEqual(0)
    expect(firstYear.bondsBalance).toBeGreaterThanOrEqual(0)
    expect(firstYear.cashBalance).toBeGreaterThanOrEqual(0)
    expect(firstYear.totalAssets).toBeGreaterThanOrEqual(0)
  })

  it('十分な収入があれば枯渇しない', () => {
    const params: SimulationParams = {
      initialAssets: defaultAssets,
      annualPlans: makePlans(30, 500, 100),
      regimeSettings: DEFAULT_REGIME_SETTINGS,
    }
    const result = runSingleTrial(params)
    expect(result.depletionYear).toBeNull()
  })
})

// --- runMonteCarloSimulation ---
describe('runMonteCarloSimulation', () => {
  it('指定した試行数の結果を返す', () => {
    const params: SimulationParams = {
      initialAssets: defaultAssets,
      annualPlans: makePlans(5),
      regimeSettings: DEFAULT_REGIME_SETTINGS,
    }
    const results = runMonteCarloSimulation(params, 10)
    expect(results).toHaveLength(10)
    for (const trial of results) {
      expect(trial.yearlyResults).toHaveLength(5)
    }
  })
})
