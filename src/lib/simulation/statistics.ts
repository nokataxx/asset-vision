import type {
  TrialResult,
  YearlyResult,
  SummaryMetrics,
  SimulationResult,
  AnnualPlan,
} from '@/types'

/**
 * パーセンタイルを計算
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) {
    return sorted[lower]
  }

  const fraction = index - lower
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction
}

/**
 * 資産枯渇確率を計算
 */
export function calculateDepletionProbability(trialResults: TrialResult[]): number {
  const depletedCount = trialResults.filter((r) => r.depletionYear !== null).length
  return (depletedCount / trialResults.length) * 100
}

/**
 * 枯渇年の中央値を計算（枯渇したケースのみ）
 */
export function calculateMedianDepletionYear(
  trialResults: TrialResult[]
): number | null {
  const depletionYears = trialResults
    .filter((r) => r.depletionYear !== null)
    .map((r) => r.depletionYear as number)

  if (depletionYears.length === 0) return null

  return calculatePercentile(depletionYears, 50)
}

/**
 * 平均暴落回数を計算
 */
export function calculateAverageCrashCount(trialResults: TrialResult[]): number {
  const total = trialResults.reduce((sum, r) => sum + r.crashCount, 0)
  return total / trialResults.length
}

/**
 * 年次別の統計量を集計
 */
export function aggregateYearlyResults(
  trialResults: TrialResult[],
  annualPlans: AnnualPlan[]
): YearlyResult[] {
  const results: YearlyResult[] = []

  for (let yearIndex = 0; yearIndex < annualPlans.length; yearIndex++) {
    const plan = annualPlans[yearIndex]

    // 各試行からこの年のデータを取得
    const yearAssets = trialResults.map(
      (trial) => trial.yearlyResults[yearIndex]?.totalAssets ?? 0
    )
    const yearStocks = trialResults.map(
      (trial) => trial.yearlyResults[yearIndex]?.stocksBalance ?? 0
    )
    const yearBonds = trialResults.map(
      (trial) => trial.yearlyResults[yearIndex]?.bondsBalance ?? 0
    )
    const yearCash = trialResults.map(
      (trial) => trial.yearlyResults[yearIndex]?.cashBalance ?? 0
    )

    results.push({
      year: plan.year,
      age: plan.age,
      income: plan.income,
      basicExpense: plan.basicExpense,
      extraExpense: plan.extraExpense,
      assets5th: Math.round(calculatePercentile(yearAssets, 5)),
      assets10th: Math.round(calculatePercentile(yearAssets, 10)),
      assets25th: Math.round(calculatePercentile(yearAssets, 25)),
      assets50th: Math.round(calculatePercentile(yearAssets, 50)),
      stocks50th: Math.round(calculatePercentile(yearStocks, 50)),
      bonds50th: Math.round(calculatePercentile(yearBonds, 50)),
      cash50th: Math.round(calculatePercentile(yearCash, 50)),
    })
  }

  return results
}

/**
 * サマリー指標を計算
 */
export function calculateSummaryMetrics(
  trialResults: TrialResult[],
  annualPlans: AnnualPlan[]
): SummaryMetrics {
  // 期末資産の取得
  const lastYearIndex = annualPlans.length - 1
  const finalAssets = trialResults.map(
    (trial) => trial.yearlyResults[lastYearIndex]?.totalAssets ?? 0
  )

  return {
    depletionProbability: Math.round(calculateDepletionProbability(trialResults) * 10) / 10,
    medianDepletionYear: calculateMedianDepletionYear(trialResults),
    finalAssets50th: Math.round(calculatePercentile(finalAssets, 50)),
    finalAssets5th: Math.round(calculatePercentile(finalAssets, 5)),
    finalAssets10th: Math.round(calculatePercentile(finalAssets, 10)),
    finalAssets25th: Math.round(calculatePercentile(finalAssets, 25)),
    finalAssets95th: Math.round(calculatePercentile(finalAssets, 95)),
    averageCrashCount: Math.round(calculateAverageCrashCount(trialResults) * 10) / 10,
  }
}

/**
 * シミュレーション結果を集計
 */
export function aggregateSimulationResults(
  trialResults: TrialResult[],
  annualPlans: AnnualPlan[]
): SimulationResult {
  return {
    trialResults,
    yearlyResults: aggregateYearlyResults(trialResults, annualPlans),
    summary: calculateSummaryMetrics(trialResults, annualPlans),
  }
}
