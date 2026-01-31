/**
 * 入力バリデーション制約とユーティリティ
 */

// バリデーション制約の定義
export const VALIDATION_CONSTRAINTS = {
  // 資産関連（単位: 万円）
  assets: {
    min: 0,
    max: 100000, // 10億円
  },
  assetLimit: {
    min: 0,
    max: 100000, // 10億円
  },
  // 年齢
  age: {
    min: 0,
    max: 120,
  },
  // シミュレーション期間（年）
  duration: {
    min: 1,
    max: 60,
  },
  // 開始年
  startYear: {
    min: 1900,
    max: 2100,
  },
  // 成長率（%）
  growthRate: {
    min: -10,
    max: 10,
  },
  // レジーム利回り（%）
  regimeReturn: {
    min: -100,
    max: 100,
  },
  // 標準偏差（%）
  stdDev: {
    min: 0,
    max: 100,
  },
  // 確率（%）
  probability: {
    min: 0,
    max: 100,
  },
  // 国債利回り（%）
  bondReturn: {
    min: -10,
    max: 20,
  },
  // 取崩し税率（%）
  withdrawalTaxRate: {
    min: 0,
    max: 50,
  },
  // 収入・支出（万円）
  incomeExpense: {
    min: 0,
    max: 100000, // 10億円
  },
} as const

export type ConstraintKey = keyof typeof VALIDATION_CONSTRAINTS

/**
 * 値を制約範囲内にクランプする
 */
export function clampValue(value: number, constraint: ConstraintKey): number {
  const { min, max } = VALIDATION_CONSTRAINTS[constraint]
  return Math.max(min, Math.min(max, value))
}

/**
 * 値が制約範囲内かどうかを判定
 */
export function isValidValue(value: number, constraint: ConstraintKey): boolean {
  const { min, max } = VALIDATION_CONSTRAINTS[constraint]
  return value >= min && value <= max
}

/**
 * 制約を取得
 */
export function getConstraint(constraint: ConstraintKey) {
  return VALIDATION_CONSTRAINTS[constraint]
}

/**
 * エラーメッセージを生成
 */
export function getValidationMessage(constraint: ConstraintKey): string {
  const { min, max } = VALIDATION_CONSTRAINTS[constraint]
  return `${min}〜${max}の範囲で入力してください`
}
