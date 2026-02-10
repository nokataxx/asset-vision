/**
 * S&P 500 Historical Returns (1928-2024)
 * Source: NYU Stern / Yahoo Finance
 *
 * Regime classification:
 * - crash: Annual return <= -10%
 * - recovery: Years following a crash until pre-crash levels are recovered
 * - normal: All other years
 */

export type Regime = 'normal' | 'crash' | 'recovery'

export interface HistoricalReturn {
  year: number
  return: number  // % units (e.g., 43.61 for +43.61%)
  regime: Regime
}

export const sp500HistoricalReturns: HistoricalReturn[] = [
  // 1920s
  { year: 1928, return: 43.61, regime: 'normal' },
  { year: 1929, return: -8.42, regime: 'normal' },

  // 1930s - Great Depression era
  { year: 1930, return: -24.90, regime: 'crash' },
  { year: 1931, return: -43.34, regime: 'crash' },
  { year: 1932, return: -8.19, regime: 'recovery' },
  { year: 1933, return: 53.99, regime: 'recovery' },
  { year: 1934, return: -1.44, regime: 'recovery' },
  { year: 1935, return: 47.67, regime: 'recovery' },
  { year: 1936, return: 33.92, regime: 'normal' },
  { year: 1937, return: -35.03, regime: 'crash' },
  { year: 1938, return: 31.12, regime: 'recovery' },
  { year: 1939, return: -0.41, regime: 'recovery' },

  // 1940s
  { year: 1940, return: -9.78, regime: 'recovery' },
  { year: 1941, return: -11.59, regime: 'crash' },
  { year: 1942, return: 20.34, regime: 'recovery' },
  { year: 1943, return: 25.90, regime: 'recovery' },
  { year: 1944, return: 19.75, regime: 'normal' },
  { year: 1945, return: 36.44, regime: 'normal' },
  { year: 1946, return: -8.07, regime: 'normal' },
  { year: 1947, return: 5.71, regime: 'normal' },
  { year: 1948, return: 5.50, regime: 'normal' },
  { year: 1949, return: 18.79, regime: 'normal' },

  // 1950s - Post-war boom
  { year: 1950, return: 31.71, regime: 'normal' },
  { year: 1951, return: 24.02, regime: 'normal' },
  { year: 1952, return: 18.37, regime: 'normal' },
  { year: 1953, return: -0.99, regime: 'normal' },
  { year: 1954, return: 52.62, regime: 'normal' },
  { year: 1955, return: 31.56, regime: 'normal' },
  { year: 1956, return: 6.56, regime: 'normal' },
  { year: 1957, return: -10.78, regime: 'crash' },
  { year: 1958, return: 43.36, regime: 'recovery' },
  { year: 1959, return: 11.96, regime: 'normal' },

  // 1960s
  { year: 1960, return: 0.47, regime: 'normal' },
  { year: 1961, return: 26.89, regime: 'normal' },
  { year: 1962, return: -8.73, regime: 'normal' },
  { year: 1963, return: 22.80, regime: 'normal' },
  { year: 1964, return: 16.48, regime: 'normal' },
  { year: 1965, return: 12.45, regime: 'normal' },
  { year: 1966, return: -10.06, regime: 'crash' },
  { year: 1967, return: 23.98, regime: 'recovery' },
  { year: 1968, return: 11.06, regime: 'normal' },
  { year: 1969, return: -8.50, regime: 'normal' },

  // 1970s - Stagflation era
  { year: 1970, return: 4.01, regime: 'normal' },
  { year: 1971, return: 14.31, regime: 'normal' },
  { year: 1972, return: 18.98, regime: 'normal' },
  { year: 1973, return: -14.66, regime: 'crash' },
  { year: 1974, return: -26.47, regime: 'crash' },
  { year: 1975, return: 37.20, regime: 'recovery' },
  { year: 1976, return: 23.84, regime: 'recovery' },
  { year: 1977, return: -7.18, regime: 'recovery' },
  { year: 1978, return: 6.56, regime: 'recovery' },
  { year: 1979, return: 18.44, regime: 'normal' },

  // 1980s - Bull market
  { year: 1980, return: 32.50, regime: 'normal' },
  { year: 1981, return: -4.92, regime: 'normal' },
  { year: 1982, return: 21.55, regime: 'normal' },
  { year: 1983, return: 22.56, regime: 'normal' },
  { year: 1984, return: 6.27, regime: 'normal' },
  { year: 1985, return: 31.73, regime: 'normal' },
  { year: 1986, return: 18.67, regime: 'normal' },
  { year: 1987, return: 5.25, regime: 'normal' },  // Black Monday but recovered by year end
  { year: 1988, return: 16.61, regime: 'normal' },
  { year: 1989, return: 31.69, regime: 'normal' },

  // 1990s - Tech boom
  { year: 1990, return: -3.10, regime: 'normal' },
  { year: 1991, return: 30.47, regime: 'normal' },
  { year: 1992, return: 7.62, regime: 'normal' },
  { year: 1993, return: 10.08, regime: 'normal' },
  { year: 1994, return: 1.32, regime: 'normal' },
  { year: 1995, return: 37.58, regime: 'normal' },
  { year: 1996, return: 22.96, regime: 'normal' },
  { year: 1997, return: 33.36, regime: 'normal' },
  { year: 1998, return: 28.58, regime: 'normal' },
  { year: 1999, return: 21.04, regime: 'normal' },

  // 2000s - Dot-com bust and financial crisis
  { year: 2000, return: -9.10, regime: 'normal' },
  { year: 2001, return: -11.89, regime: 'crash' },
  { year: 2002, return: -22.10, regime: 'crash' },
  { year: 2003, return: 28.68, regime: 'recovery' },
  { year: 2004, return: 10.88, regime: 'recovery' },
  { year: 2005, return: 4.91, regime: 'recovery' },
  { year: 2006, return: 15.79, regime: 'recovery' },
  { year: 2007, return: 5.49, regime: 'normal' },
  { year: 2008, return: -37.00, regime: 'crash' },
  { year: 2009, return: 26.46, regime: 'recovery' },

  // 2010s - Long bull market
  { year: 2010, return: 15.06, regime: 'recovery' },
  { year: 2011, return: 2.11, regime: 'recovery' },
  { year: 2012, return: 16.00, regime: 'recovery' },
  { year: 2013, return: 32.39, regime: 'normal' },
  { year: 2014, return: 13.69, regime: 'normal' },
  { year: 2015, return: 1.38, regime: 'normal' },
  { year: 2016, return: 11.96, regime: 'normal' },
  { year: 2017, return: 21.83, regime: 'normal' },
  { year: 2018, return: -4.38, regime: 'normal' },
  { year: 2019, return: 31.49, regime: 'normal' },

  // 2020s
  { year: 2020, return: 18.40, regime: 'normal' },  // COVID crash recovered quickly
  { year: 2021, return: 28.71, regime: 'normal' },
  { year: 2022, return: -18.11, regime: 'crash' },
  { year: 2023, return: 26.29, regime: 'recovery' },
  { year: 2024, return: 24.88, regime: 'normal' },
  { year: 2025, return: 17.78, regime: 'normal' },
]

// Pre-computed returns by regime for efficient bootstrap sampling
export const sp500ReturnsByRegime = {
  normal: sp500HistoricalReturns.filter(r => r.regime === 'normal').map(r => r.return),
  crash: sp500HistoricalReturns.filter(r => r.regime === 'crash').map(r => r.return),
  recovery: sp500HistoricalReturns.filter(r => r.regime === 'recovery').map(r => r.return),
} as const

// 標準偏差を計算するヘルパー関数
function calculateStdDev(values: readonly number[], mean: number): number {
  const squaredDiffs = values.map(v => (v - mean) ** 2)
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(variance)
}

// Statistics for display
const normalMean = sp500ReturnsByRegime.normal.reduce((a, b) => a + b, 0) / sp500ReturnsByRegime.normal.length
const crashMean = sp500ReturnsByRegime.crash.reduce((a, b) => a + b, 0) / sp500ReturnsByRegime.crash.length
const recoveryMean = sp500ReturnsByRegime.recovery.reduce((a, b) => a + b, 0) / sp500ReturnsByRegime.recovery.length

export const sp500RegimeStats = {
  normal: {
    count: sp500ReturnsByRegime.normal.length,
    mean: normalMean,
    stdDev: calculateStdDev(sp500ReturnsByRegime.normal, normalMean),
  },
  crash: {
    count: sp500ReturnsByRegime.crash.length,
    mean: crashMean,
    stdDev: calculateStdDev(sp500ReturnsByRegime.crash, crashMean),
  },
  recovery: {
    count: sp500ReturnsByRegime.recovery.length,
    mean: recoveryMean,
    stdDev: calculateStdDev(sp500ReturnsByRegime.recovery, recoveryMean),
  },
} as const

/**
 * 過去データに基づく暴落発生確率（%）
 * 暴落年数 / 全年数 で計算
 */
export const sp500HistoricalCrashProbability =
  (sp500ReturnsByRegime.crash.length / sp500HistoricalReturns.length) * 100

/**
 * 過去データに基づく平均回復年数
 * 各暴落イベント（連続暴落は1イベント）の回復期間を平均
 *
 * 暴落イベントと回復期間（9イベント）:
 * - 1930-31暴落 → 1932-35回復（4年）
 * - 1937暴落 → 1938-40回復（3年）
 * - 1941暴落 → 1942-43回復（2年）
 * - 1957暴落 → 1958回復（1年）
 * - 1966暴落 → 1967回復（1年）
 * - 1973-74暴落 → 1975-78回復（4年）
 * - 2001-02暴落 → 2003-06回復（4年）
 * - 2008暴落 → 2009-12回復（4年）
 * - 2022暴落 → 2023回復（1年）
 *
 * 平均: (4+3+2+1+1+4+4+4+1) / 9 = 2.67年
 */
export const sp500HistoricalAverageRecoveryYears = 2.7
