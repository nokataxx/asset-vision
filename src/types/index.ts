// 資産全体
export interface Assets {
  stocks: number // 株式（万円）
  bonds: number // 国債（万円）
  cash: number // 現金（万円）
  cashLimit: number // 現金上限（万円）
  bondsLimit: number // 国債上限（万円）
  age: number // 年齢
}

// 収支計画の基本設定
export interface IncomeExpensePlan {
  startYear: number // 開始年
  duration: number // シミュレーション期間（年）
  incomeGrowthRate: number // 収入成長率（%）
  expenseGrowthRate: number // 基本生活費成長率（%）
}

// 年次計画
export interface AnnualPlan {
  year: number // 年
  age: number // 年齢
  income: number // 収入（万円）
  basicExpense: number // 基本生活費・支出①（万円）
  extraExpense: number // 臨時支出・支出②（万円）
}

// レジーム設定
export interface RegimeSettings {
  normalReturn: number // 通常期利回り（%）
  normalStdDev: number // 通常期標準偏差（%）
  crashReturn: number // 暴落期利回り（%）
  crashStdDev: number // 暴落期標準偏差（%）
  recoveryReturn: number // 戻り期利回り（%）
  recoveryStdDev: number // 戻り期標準偏差（%）
  crashProbability: number // 暴落発生確率（%）
  recoveryYears: number // 戻り期継続年数
  bondReturn: number // 国債リターン（%）
  cashReturn: number // 現金リターン（%）
}

// 資産タイプ
export type AssetType = 'stocks' | 'bonds' | 'cash'

// 取崩し優先順位
export interface WithdrawalPriority {
  normal: AssetType[] // 通常時の優先順位
  crash: AssetType[] // 暴落時の優先順位
}

// レジーム状態
export type Regime = 'normal' | 'crash' | 'recovery'

// シミュレーション1試行の年次結果
export interface TrialYearResult {
  year: number
  age: number
  regime: Regime
  stocksBalance: number
  bondsBalance: number
  cashBalance: number
  totalAssets: number
  income: number
  basicExpense: number
  extraExpense: number
  isDepleted: boolean
}

// シミュレーション1試行の結果
export interface TrialResult {
  yearlyResults: TrialYearResult[]
  depletionYear: number | null // 枯渇した年（nullなら枯渇せず）
  crashCount: number // 暴落発生回数
}

// 年次結果（パーセンタイル別）
export interface YearlyResult {
  year: number
  age: number
  income: number
  basicExpense: number
  extraExpense: number
  assets5th: number // 5%タイル
  assets10th: number // 10%タイル
  assets25th: number // 25%タイル
  assets50th: number // 中央値
  assets95th: number // 95%タイル
}

// サマリー指標
export interface SummaryMetrics {
  depletionProbability: number // 資産枯渇確率（%）
  medianDepletionYear: number | null // 枯渇年の中央値
  finalAssets50th: number // 期末資産（中央値）
  finalAssets5th: number // 期末資産（5%タイル）
  finalAssets10th: number // 期末資産（10%タイル）
  finalAssets25th: number // 期末資産（25%タイル）
  finalAssets95th: number // 期末資産（95%タイル）
  averageCrashCount: number // 暴落発生回数（平均）
}

// シミュレーション結果
export interface SimulationResult {
  trialResults: TrialResult[]
  yearlyResults: YearlyResult[]
  summary: SummaryMetrics
}

// アプリケーション全体の状態
export interface AppState {
  assets: Assets
  incomeExpensePlan: IncomeExpensePlan
  annualPlans: AnnualPlan[]
  regimeSettings: RegimeSettings
  withdrawalPriority: WithdrawalPriority
}

// デフォルト値
export const DEFAULT_REGIME_SETTINGS: RegimeSettings = {
  normalReturn: 7,
  normalStdDev: 15,
  crashReturn: -35,
  crashStdDev: 20,
  recoveryReturn: 20,
  recoveryStdDev: 18,
  crashProbability: 10,
  recoveryYears: 3,
  bondReturn: 1.2,
  cashReturn: 0,
}

// 取崩し優先順位（固定ロジック）
// 通常時：株式（利益確定）→ 現金（リターン0%）→ 国債（リターン1.2%を運用継続）
// 暴落時：現金 → 国債 → 株式（回復を待つ）
export const DEFAULT_WITHDRAWAL_PRIORITY: WithdrawalPriority = {
  normal: ['stocks', 'cash', 'bonds'],
  crash: ['cash', 'bonds', 'stocks'],
}

export const DEFAULT_INCOME_EXPENSE_PLAN: IncomeExpensePlan = {
  startYear: new Date().getFullYear(),
  duration: 30,
  incomeGrowthRate: 0,
  expenseGrowthRate: 0,
}

export const DEFAULT_ASSETS: Assets = {
  stocks: 0,
  bonds: 0,
  cash: 0,
  cashLimit: 500,
  bondsLimit: 1000,
  age: 30,
}
