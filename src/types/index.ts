// 資産全体
export interface Assets {
  stocks: number // 株式（万円）
  bonds: number // 国債（万円）
  cash: number // 現金（万円）
  cashLimit: number // 現金上限（万円）
  bondsLimit: number // 国債上限（万円）
  age: number // 年齢
  foreignRatio: number // 外貨建て比率（%）
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

// ブートストラップで使用するインデックス
export type BootstrapIndex = 'none' | 'sp500' | 'acwi'

// レジーム設定
export interface RegimeSettings {
  normalReturn: number // 通常期利回り（%）
  normalStdDev: number // 通常期標準偏差（%）
  crashReturn: number // 暴落期利回り（%）
  crashStdDev: number // 暴落期標準偏差（%）
  recoveryReturn: number // 戻り期利回り（%）
  recoveryStdDev: number // 戻り期標準偏差（%）
  crashProbability: number // 暴落発生確率（%）
  bondReturn: number // 国債リターン（%）
  withdrawalTaxRate: number // 取崩し時税率（%）- 株式・国債共通
  bootstrapIndex: BootstrapIndex // 'none': パラメータ指定, 'sp500': S&P 500, 'acwi': MSCI ACWI
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
  assets75th: number // 75%タイル（楽観）
  assets50th: number // 50%タイル（中央値）
  assets25th: number // 25%タイル（悲観）
  assets10th: number // 10%タイル（最悪）
}

// サマリー指標
export interface SummaryMetrics {
  // メイン指標
  successRate: number // 成功率（%）= 100 - 枯渇確率
  safeWithdrawalRate: number | null // 安全引出率（%）= 年間取崩し額 ÷ 初期資産
  // シナリオ別結果
  depletionAge75th: number | null // 枯渇時年齢（楽観・75%タイル）
  depletionAge50th: number | null // 枯渇時年齢（中央値）
  depletionAge25th: number | null // 枯渇時年齢（悲観・25%タイル）
  depletionAge10th: number | null // 枯渇時年齢（最悪・10%タイル）
  finalAssets75th: number // 期末資産（楽観・75%タイル）
  finalAssets50th: number // 期末資産（中央値）
  finalAssets25th: number // 期末資産（悲観・25%タイル）
  finalAssets10th: number // 期末資産（最悪・10%タイル）
  minAssets75th: number // 最低到達資産（楽観）
  minAssets50th: number // 最低到達資産（中央値）
  minAssets25th: number // 最低到達資産（悲観）
  minAssets10th: number // 最低到達資産（最悪）
  // リスク指標
  averageCrashCount: number // 暴落発生回数（平均）
  averageRecoveryYears: number | null // 平均回復期間（年）
  averageDepletionAge: number | null // 枯渇時の平均年齢（枯渇する場合）
  // 互換性のため残す（グラフ用）
  finalAssets5th: number
  finalAssets95th: number
  depletionProbability: number
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

// デフォルト値（MSCI ACWIベース）
// 根拠: docs/regime-settings-validation.md 参照
export const DEFAULT_REGIME_SETTINGS: RegimeSettings = {
  normalReturn: 12,       // MSCI ACWI 通常期実測値12.65%（やや保守的）
  normalStdDev: 12,       // 実測値10.86%（やや保守的）
  crashReturn: -24,       // MSCI ACWI 暴落期実測値-24.02%
  crashStdDev: 12,        // 実測値10.55%（やや保守的）
  recoveryReturn: 17,     // MSCI ACWI 戻り期実測値17.30%
  recoveryStdDev: 12,     // 実測値8.70%（やや保守的）
  crashProbability: 12,   // S&P 500長期実績に基づく暴落発生確率
  bondReturn: 1.2,
  withdrawalTaxRate: 10,
  bootstrapIndex: 'none', // デフォルトは従来のパラメータ指定モード
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
  foreignRatio: 0,
}
