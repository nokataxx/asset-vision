/**
 * MSCI ACWI (All Country World Index) Historical Returns (2001-2025)
 * Source: MSCI, iShares MSCI ACWI ETF (ACWI)
 *
 * Note: MSCI ACWI was officially launched on January 1, 2001.
 * Data prior to launch date would be back-tested.
 *
 * This index captures large and mid cap representation across
 * 23 Developed Markets and 24 Emerging Markets countries,
 * covering approximately 85% of the global investable equity opportunity set.
 *
 * Regime classification (same as S&P 500):
 * - crash: Annual return <= -10%
 * - recovery: Years following a crash until pre-crash levels are recovered
 * - normal: All other years
 */

export type Regime = 'normal' | 'crash' | 'recovery'

export interface HistoricalReturn {
  year: number
  return: number  // % units (e.g., 20.95 for +20.95%)
  regime: Regime
}

export const msciAcwiHistoricalReturns: HistoricalReturn[] = [
  // 2000s - Dot-com bust and financial crisis
  { year: 2001, return: -16.21, regime: 'crash' },
  { year: 2002, return: -19.32, regime: 'crash' },
  { year: 2003, return: 33.99, regime: 'recovery' },
  { year: 2004, return: 15.23, regime: 'recovery' },
  { year: 2005, return: 10.84, regime: 'recovery' },
  { year: 2006, return: 20.95, regime: 'normal' },
  { year: 2007, return: 11.66, regime: 'normal' },
  { year: 2008, return: -42.19, regime: 'crash' },
  { year: 2009, return: 34.63, regime: 'recovery' },

  // 2010s - Long bull market
  { year: 2010, return: 12.67, regime: 'recovery' },
  { year: 2011, return: -7.35, regime: 'recovery' },
  { year: 2012, return: 16.13, regime: 'recovery' },
  { year: 2013, return: 22.80, regime: 'normal' },
  { year: 2014, return: 4.16, regime: 'normal' },
  { year: 2015, return: -2.36, regime: 'normal' },
  { year: 2016, return: 8.40, regime: 'normal' },
  { year: 2017, return: 24.35, regime: 'normal' },
  { year: 2018, return: -9.12, regime: 'normal' },
  { year: 2019, return: 26.58, regime: 'normal' },

  // 2020s
  { year: 2020, return: 16.33, regime: 'normal' },
  { year: 2021, return: 18.67, regime: 'normal' },
  { year: 2022, return: -18.37, regime: 'crash' },
  { year: 2023, return: 22.30, regime: 'recovery' },
  { year: 2024, return: 17.45, regime: 'normal' },
  { year: 2025, return: 22.41, regime: 'normal' },
]

// Pre-computed returns by regime for efficient bootstrap sampling
export const msciAcwiReturnsByRegime = {
  normal: msciAcwiHistoricalReturns.filter(r => r.regime === 'normal').map(r => r.return),
  crash: msciAcwiHistoricalReturns.filter(r => r.regime === 'crash').map(r => r.return),
  recovery: msciAcwiHistoricalReturns.filter(r => r.regime === 'recovery').map(r => r.return),
} as const

// 標準偏差を計算するヘルパー関数
function calculateStdDev(values: readonly number[], mean: number): number {
  const squaredDiffs = values.map(v => (v - mean) ** 2)
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(variance)
}

// Statistics for display
const normalMean = msciAcwiReturnsByRegime.normal.reduce((a, b) => a + b, 0) / msciAcwiReturnsByRegime.normal.length
const crashMean = msciAcwiReturnsByRegime.crash.reduce((a, b) => a + b, 0) / msciAcwiReturnsByRegime.crash.length
const recoveryMean = msciAcwiReturnsByRegime.recovery.reduce((a, b) => a + b, 0) / msciAcwiReturnsByRegime.recovery.length

export const msciAcwiRegimeStats = {
  normal: {
    count: msciAcwiReturnsByRegime.normal.length,
    mean: normalMean,
    stdDev: calculateStdDev(msciAcwiReturnsByRegime.normal, normalMean),
  },
  crash: {
    count: msciAcwiReturnsByRegime.crash.length,
    mean: crashMean,
    stdDev: calculateStdDev(msciAcwiReturnsByRegime.crash, crashMean),
  },
  recovery: {
    count: msciAcwiReturnsByRegime.recovery.length,
    mean: recoveryMean,
    stdDev: calculateStdDev(msciAcwiReturnsByRegime.recovery, recoveryMean),
  },
} as const

/**
 * 過去データに基づく暴落発生確率（%）
 * 暴落年数 / 全年数 で計算
 */
export const msciAcwiHistoricalCrashProbability =
  (msciAcwiReturnsByRegime.crash.length / msciAcwiHistoricalReturns.length) * 100

/**
 * 過去データに基づく平均回復年数
 * 各暴落イベント（連続暴落は1イベント）の回復期間を平均
 *
 * 暴落イベントと回復期間:
 * - 2001-02暴落 → 2003-05回復（3年）
 * - 2008暴落 → 2009-12回復（4年）
 * - 2022暴落 → 2023回復（1年）
 *
 * 平均: (3 + 4 + 1) / 3 = 2.67年
 */
export const msciAcwiHistoricalAverageRecoveryYears = 2.7
