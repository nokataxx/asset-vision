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
 * 枯渇年のパーセンタイルを計算
 * 枯渇しないケースは最終年+1として扱い、
 * 結果が最終年を超える場合はnullを返す
 */
export function calculateDepletionYearPercentile(
  trialResults: TrialResult[],
  percentile: number,
  finalYear: number
): number | null {
  // 枯渇しないケースは最終年+1として扱う
  const depletionYears = trialResults.map((r) =>
    r.depletionYear !== null ? r.depletionYear : finalYear + 1
  )

  const result = calculatePercentile(depletionYears, percentile)

  // 結果が最終年を超える場合は枯渇しない
  return result <= finalYear ? Math.round(result) : null
}


/**
 * 枯渇時年齢のパーセンタイルを計算
 * 枯渇しないケースは最終年齢+1として扱い、
 * 結果が最終年齢を超える場合はnullを返す
 */
export function calculateDepletionAgePercentile(
  trialResults: TrialResult[],
  percentile: number,
  startAge: number,
  startYear: number,
  finalYear: number
): number | null {
  const finalAge = startAge + (finalYear - startYear)
  
  // 枯渇しないケースは最終年齢+1として扱う
  const depletionAges = trialResults.map((r) => {
    if (r.depletionYear === null) {
      return finalAge + 1
    }
    return startAge + (r.depletionYear - startYear)
  })

  const result = calculatePercentile(depletionAges, percentile)

  // 結果が最終年齢を超える場合は枯渇しない
  return result <= finalAge ? Math.round(result) : null
}

/**
 * 平均暴落回数を計算
 */
export function calculateAverageCrashCount(trialResults: TrialResult[]): number {
  const total = trialResults.reduce((sum, r) => sum + r.crashCount, 0)
  return total / trialResults.length
}

/**
 * 各試行の最大資産額を取得
 */
export function getMaxAssetsPerTrial(trialResults: TrialResult[]): number[] {
  return trialResults.map((trial) => {
    const assets = trial.yearlyResults.map((r) => r.totalAssets)
    return Math.max(...assets)
  })
}

/**
 * 各試行の最低資産額を取得
 */
export function getMinAssetsPerTrial(trialResults: TrialResult[]): number[] {
  return trialResults.map((trial) => {
    const assets = trial.yearlyResults.map((r) => r.totalAssets)
    return Math.min(...assets)
  })
}

/**
 * 各試行の最大ドローダウン（%）を計算
 * ドローダウン = (ピーク - 現在値) / ピーク * 100
 */
export function getMaxDrawdownPerTrial(trialResults: TrialResult[]): number[] {
  return trialResults.map((trial) => {
    let peak = 0
    let maxDrawdown = 0

    for (const yearResult of trial.yearlyResults) {
      if (yearResult.totalAssets > peak) {
        peak = yearResult.totalAssets
      }
      if (peak > 0) {
        const drawdown = ((peak - yearResult.totalAssets) / peak) * 100
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown
        }
      }
    }

    return maxDrawdown
  })
}

/**
 * 平均回復期間を計算
 * 回復期間 = 戻り期（recovery）の連続年数
 */
export function calculateAverageRecoveryYears(trialResults: TrialResult[]): number | null {
  const recoveryPeriods: number[] = []

  for (const trial of trialResults) {
    let currentRecoveryLength = 0

    for (const yearResult of trial.yearlyResults) {
      if (yearResult.regime === 'recovery') {
        currentRecoveryLength++
      } else if (currentRecoveryLength > 0) {
        recoveryPeriods.push(currentRecoveryLength)
        currentRecoveryLength = 0
      }
    }

    // 最後まで回復期だった場合
    if (currentRecoveryLength > 0) {
      recoveryPeriods.push(currentRecoveryLength)
    }
  }

  if (recoveryPeriods.length === 0) return null

  const total = recoveryPeriods.reduce((sum, p) => sum + p, 0)
  return Math.round((total / recoveryPeriods.length) * 10) / 10
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
    results.push({
      year: plan.year,
      age: plan.age,
      income: plan.income,
      basicExpense: plan.basicExpense,
      extraExpense: plan.extraExpense,
      assets75th: Math.round(calculatePercentile(yearAssets, 75)),
      assets50th: Math.round(calculatePercentile(yearAssets, 50)),
      assets25th: Math.round(calculatePercentile(yearAssets, 25)),
      assets10th: Math.round(calculatePercentile(yearAssets, 10)),
    })
  }

  return results
}

/**
 * 枯渇時の平均年齢を計算（枯渇したケースのみ）
 */
export function calculateAverageDepletionAge(
  trialResults: TrialResult[],
  startAge: number,
  startYear: number
): number | null {
  const depletionAges = trialResults
    .filter((r) => r.depletionYear !== null)
    .map((r) => startAge + ((r.depletionYear as number) - startYear))

  if (depletionAges.length === 0) return null

  const total = depletionAges.reduce((sum, age) => sum + age, 0)
  return Math.round(total / depletionAges.length)
}

/**
 * 安全引出率を計算（年間平均取崩し額 ÷ 初期資産）
 *
 * 従来の4%ルールは初年度のみを基準としていたが、
 * 支出成長率がある場合は実態を反映しないため、
 * シミュレーション期間全体の平均取崩し額を使用する。
 */
export function calculateSafeWithdrawalRate(
  annualPlans: AnnualPlan[],
  initialAssets: number
): number | null {
  if (initialAssets <= 0 || annualPlans.length === 0) return null

  // 各年の取崩し額（支出 - 収入、マイナスなら0）を計算
  const annualWithdrawals = annualPlans.map((plan) =>
    Math.max(0, plan.basicExpense + plan.extraExpense - plan.income)
  )

  // 平均取崩し額を計算
  const totalWithdrawal = annualWithdrawals.reduce((sum, w) => sum + w, 0)
  const averageWithdrawal = totalWithdrawal / annualPlans.length

  if (averageWithdrawal === 0) return null

  return Math.round((averageWithdrawal / initialAssets) * 1000) / 10
}

/**
 * サマリー指標を計算
 */
export function calculateSummaryMetrics(
  trialResults: TrialResult[],
  annualPlans: AnnualPlan[],
  initialAssets: number
): SummaryMetrics {
  // 期末資産の取得
  const lastYearIndex = annualPlans.length - 1
  const finalAssets = trialResults.map(
    (trial) => trial.yearlyResults[lastYearIndex]?.totalAssets ?? 0
  )

  // 最低資産額の計算
  const minAssetsPerTrial = getMinAssetsPerTrial(trialResults)

  // 枯渇確率・成功率
  const depletionProbability = Math.round(calculateDepletionProbability(trialResults) * 10) / 10
  const successRate = Math.round((100 - depletionProbability) * 10) / 10

  // 開始年齢・開始年・最終年
  const startAge = annualPlans[0].age
  const startYear = annualPlans[0].year
  const finalYear = annualPlans[lastYearIndex].year

  return {
    // メイン指標
    successRate,
    safeWithdrawalRate: calculateSafeWithdrawalRate(annualPlans, initialAssets),
    // シナリオ別結果
    depletionAge75th: calculateDepletionAgePercentile(trialResults, 75, startAge, startYear, finalYear),
    depletionAge50th: calculateDepletionAgePercentile(trialResults, 50, startAge, startYear, finalYear),
    depletionAge25th: calculateDepletionAgePercentile(trialResults, 25, startAge, startYear, finalYear),
    depletionAge10th: calculateDepletionAgePercentile(trialResults, 10, startAge, startYear, finalYear),
    finalAssets75th: Math.round(calculatePercentile(finalAssets, 75)),
    finalAssets50th: Math.round(calculatePercentile(finalAssets, 50)),
    finalAssets25th: Math.round(calculatePercentile(finalAssets, 25)),
    finalAssets10th: Math.round(calculatePercentile(finalAssets, 10)),
    minAssets75th: Math.round(calculatePercentile(minAssetsPerTrial, 75)),
    minAssets50th: Math.round(calculatePercentile(minAssetsPerTrial, 50)),
    minAssets25th: Math.round(calculatePercentile(minAssetsPerTrial, 25)),
    minAssets10th: Math.round(calculatePercentile(minAssetsPerTrial, 10)),
    // リスク指標
    averageCrashCount: Math.round(calculateAverageCrashCount(trialResults) * 10) / 10,
    averageRecoveryYears: calculateAverageRecoveryYears(trialResults),
    averageDepletionAge: calculateAverageDepletionAge(trialResults, startAge, startYear),
    // 互換性のため残す（グラフ用）
    finalAssets5th: Math.round(calculatePercentile(finalAssets, 5)),
    finalAssets95th: Math.round(calculatePercentile(finalAssets, 95)),
    depletionProbability,
  }
}

/**
 * シミュレーション結果を集計
 */
export function aggregateSimulationResults(
  trialResults: TrialResult[],
  annualPlans: AnnualPlan[],
  initialAssets: number
): SimulationResult {
  return {
    trialResults,
    yearlyResults: aggregateYearlyResults(trialResults, annualPlans),
    summary: calculateSummaryMetrics(trialResults, annualPlans, initialAssets),
  }
}
