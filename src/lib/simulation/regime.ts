import type { Regime, RegimeSettings } from '@/types'

export interface RegimeState {
  current: Regime
  precrashStocksBalance: number // 暴落前の株式残高（回復判定用）
}

/**
 * Box-Muller法による標準正規分布乱数生成
 * @returns 標準正規分布（平均0、標準偏差1）に従う乱数
 */
function randomStandardNormal(): number {
  // Box-Muller変換
  // u1が0だとlog(0)=-Infinityになるため、0を回避
  let u1: number
  do {
    u1 = Math.random()
  } while (u1 === 0)
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/**
 * ガンマ分布乱数生成（Marsaglia and Tsang's method）
 * @param shape 形状パラメータ (k > 0)
 * @returns ガンマ分布に従う乱数
 */
function randomGamma(shape: number): number {
  // shape < 1 の場合は変換を使用
  if (shape < 1) {
    return randomGamma(shape + 1) * Math.pow(Math.random(), 1 / shape)
  }

  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)

  while (true) {
    let x: number
    let v: number
    do {
      x = randomStandardNormal()
      v = 1 + c * x
    } while (v <= 0)

    v = v * v * v
    const u = Math.random()

    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
      return d * v
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v
    }
  }
}

/**
 * カイ二乗分布乱数生成
 * @param df 自由度
 * @returns カイ二乗分布に従う乱数
 */
function randomChiSquared(df: number): number {
  // χ²(df) = Gamma(df/2, 2) = 2 * Gamma(df/2, 1)
  return 2 * randomGamma(df / 2)
}

// 株式リターンのt分布自由度（固定値）
const STOCK_RETURN_DF = 5

// t分布のスケール調整係数
// t分布の標準偏差 = scale × √(df/(df-2)) となるため、
// 正規分布と同じ標準偏差にするには scale = stdDev × √((df-2)/df) とする
// df=5 の場合: √(3/5) ≈ 0.7746
const T_SCALE_ADJUSTMENT = Math.sqrt((STOCK_RETURN_DF - 2) / STOCK_RETURN_DF)

/**
 * t分布乱数生成（標準偏差調整済み）
 * @param mean 平均（位置パラメータ）
 * @param stdDev 標準偏差（正規分布と同じ解釈）
 * @param df 自由度
 * @returns t分布に従う乱数
 */
function randomT(mean: number, stdDev: number, df: number): number {
  // T = Z / sqrt(V/df) where Z ~ N(0,1), V ~ χ²(df)
  // スケール調整により、正規分布と同じ標準偏差を維持しつつ裾を厚くする
  const scale = stdDev * T_SCALE_ADJUSTMENT
  const z = randomStandardNormal()
  const v = randomChiSquared(df)
  const t = z / Math.sqrt(v / df)
  return mean + scale * t
}

/**
 * 初期レジーム状態を作成
 */
export function createInitialRegimeState(): RegimeState {
  return {
    current: 'normal',
    precrashStocksBalance: 0,
  }
}

/**
 * 次のレジームを決定し、状態を更新
 * @param state 現在のレジーム状態
 * @param settings レジーム設定
 * @param currentStocksBalance 現在の株式残高（戻り期の終了判定に使用）
 */
export function determineNextRegime(
  state: RegimeState,
  settings: RegimeSettings,
  currentStocksBalance: number
): RegimeState {
  switch (state.current) {
    case 'normal':
      // 通常期 → 暴落期（確率で遷移）
      if (Math.random() * 100 < settings.crashProbability) {
        return {
          current: 'crash',
          precrashStocksBalance: currentStocksBalance, // 暴落前の残高を記録
        }
      }
      return state

    case 'crash':
      // 暴落期 → 戻り期（翌年自動遷移）
      return {
        current: 'recovery',
        precrashStocksBalance: state.precrashStocksBalance,
      }

    case 'recovery':
      // 戻り期中も暴落が発生する可能性あり
      if (Math.random() * 100 < settings.crashProbability) {
        return {
          current: 'crash',
          precrashStocksBalance: currentStocksBalance, // 新たな暴落前の残高を記録
        }
      }
      // 株式残高が暴落前の水準に回復したら通常期に戻る
      if (currentStocksBalance >= state.precrashStocksBalance) {
        return {
          current: 'normal',
          precrashStocksBalance: 0,
        }
      }
      // まだ回復していない場合は戻り期を継続
      return state

    default:
      return state
  }
}


/**
 * 暴落期・戻り期中の収支を考慮して回復目標を調整
 * 赤字（支出>収入）の場合は回復目標を下げる
 * @param state 現在のレジーム状態
 * @param netIncome 当年の収支（収入-支出、負の値は赤字）
 * @returns 調整後のレジーム状態
 */
export function adjustRecoveryTargetForCashFlow(
  state: RegimeState,
  netIncome: number
): RegimeState {
  // 通常期は調整不要
  if (state.current === 'normal') {
    return state
  }

  // 暴落期・戻り期は収支に応じて回復目標を調整
  // 赤字の場合（netIncome < 0）: 目標が下がる
  // 黒字の場合（netIncome > 0）: 目標が上がる
  // 注: 回復目標は0未満にならないようにクランプする
  // （継続的な赤字で目標が負になると回復判定が永久に成立しなくなるため）
  const adjustedTarget = Math.max(0, state.precrashStocksBalance + netIncome)
  return {
    ...state,
    precrashStocksBalance: adjustedTarget,
  }
}

/**
 * レジームに応じた株式利回りを返す（t分布でランダム化）
 * t分布（自由度5）を使用し、正規分布より裾が厚い分布でファットテールを考慮
 */
export function getStockReturn(regime: Regime, settings: RegimeSettings): number {
  switch (regime) {
    case 'normal':
      return randomT(settings.normalReturn, settings.normalStdDev ?? 10, STOCK_RETURN_DF) / 100
    case 'crash':
      return randomT(settings.crashReturn, settings.crashStdDev ?? 15, STOCK_RETURN_DF) / 100
    case 'recovery':
      return randomT(settings.recoveryReturn, settings.recoveryStdDev ?? 12, STOCK_RETURN_DF) / 100
    default:
      return 0
  }
}

/**
 * 現在のレジームが暴落中または戻り期かどうかを判定
 * 暴落期・戻り期は株式を温存するため、現金・国債から取崩す
 */
export function isCrashRegime(regime: Regime): boolean {
  // 暴落期と戻り期は株式を温存する取崩し戦略を使用
  return regime === 'crash' || regime === 'recovery'
}
