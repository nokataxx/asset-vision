import type { BootstrapIndex, Regime, RegimeSettings } from '@/types'
import { sp500ReturnsByRegime, sp500HistoricalCrashProbability, sp500HistoricalAverageRecoveryYears } from '@/data/sp500-historical'
import { msciAcwiReturnsByRegime, msciAcwiHistoricalCrashProbability, msciAcwiHistoricalAverageRecoveryYears } from '@/data/msci-acwi-historical'

// ブートストラップ用のデータソース
const bootstrapDataSources = {
  sp500: {
    returnsByRegime: sp500ReturnsByRegime,
    crashProbability: sp500HistoricalCrashProbability,
    averageRecoveryYears: sp500HistoricalAverageRecoveryYears,
  },
  acwi: {
    returnsByRegime: msciAcwiReturnsByRegime,
    crashProbability: msciAcwiHistoricalCrashProbability,
    averageRecoveryYears: msciAcwiHistoricalAverageRecoveryYears,
  },
} as const

function getBootstrapData(index: BootstrapIndex | undefined) {
  if (!index || index === 'none') return null
  if (!(index in bootstrapDataSources)) return null
  return bootstrapDataSources[index as keyof typeof bootstrapDataSources]
}

export interface RegimeState {
  current: Regime
  precrashStocksBalance: number // 暴落前の株式残高（回復判定用）
  yearsInRecovery: number // 戻り期の経過年数（二番底モデル用）
  crashReturn: number // 暴落年の実リターン（暴落深さ相関用、小数: -0.35 = -35%）
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
    yearsInRecovery: 0,
    crashReturn: 0,
  }
}

/**
 * 次のレジームを決定し、状態を更新
 * @param state 現在のレジーム状態
 * @param settings レジーム設定
 * @param currentStocksBalance 現在の株式残高（戻り期の終了判定に使用）
 */
/**
 * 二番底（ダブルディップ）モデル: 戻り期初期ほど再暴落リスクが高い
 * - 1年目: 基本確率の1.5倍（歴史的に最も不安定）
 * - 2年目: 基本確率の1.15倍
 * - 3年目以降: 基本確率のまま
 */
export function getDoubleDipCrashProbability(
  baseCrashProbability: number,
  yearsInRecovery: number
): number {
  if (yearsInRecovery === 1) return baseCrashProbability * 1.5
  if (yearsInRecovery === 2) return baseCrashProbability * 1.15
  return baseCrashProbability
}

/**
 * 暴落深さと回復期間の相関: 深い暴落ほど回復に時間がかかる
 * averageRecoveryYears に対する乗数を返す
 * - 軽度（> -20%）: ×0.6（回復が速い）
 * - 中度（-20%〜-35%）: ×1.0（変更なし）
 * - 重度（< -35%）: ×2.0（回復に2倍の年数）
 */
export function getCrashDepthRecoveryMultiplier(crashReturn: number): number {
  if (crashReturn > -0.20) return 0.6
  if (crashReturn > -0.35) return 1.0
  return 2.0
}

export function determineNextRegime(
  state: RegimeState,
  settings: RegimeSettings,
  currentStocksBalance: number
): RegimeState {
  // ブートストラップモードでは過去実績の暴落確率と平均回復年数を使用
  const bootstrapData = getBootstrapData(settings.bootstrapIndex)
  const crashProbability = bootstrapData
    ? bootstrapData.crashProbability
    : settings.crashProbability

  // 平均回復年数から戻り期→通常期の遷移確率を計算
  // 遷移確率 = 1 / 平均年数 × 100（%）
  // 例: 2.5年の場合 = 40%/年
  const baseRecoveryYears = bootstrapData
    ? bootstrapData.averageRecoveryYears
    : (settings.averageRecoveryYears ?? 2.5)

  switch (state.current) {
    case 'normal':
      // 通常期 → 暴落期（確率で遷移）
      if (Math.random() * 100 < crashProbability) {
        return {
          current: 'crash',
          precrashStocksBalance: currentStocksBalance, // 暴落前の残高を記録
          yearsInRecovery: 0,
          crashReturn: 0,
        }
      }
      return state

    case 'crash':
      // 暴落期 → 戻り期（翌年自動遷移）
      return {
        current: 'recovery',
        precrashStocksBalance: state.precrashStocksBalance,
        yearsInRecovery: 1,
        crashReturn: state.crashReturn, // monteCarlo.tsで設定された暴落リターンを引き継ぎ
      }

    case 'recovery': {
      // 二番底モデル: 戻り期初期ほど再暴落リスクが高い
      const doubleDipProbability = getDoubleDipCrashProbability(
        crashProbability,
        state.yearsInRecovery
      )
      if (Math.random() * 100 < doubleDipProbability) {
        return {
          current: 'crash',
          precrashStocksBalance: currentStocksBalance, // 新たな暴落前の残高を記録
          yearsInRecovery: 0,
          crashReturn: 0, // 新たな暴落リターンはmonteCarlo.tsで設定される
        }
      }

      // 暴落深さと回復期間の相関: 深い暴落ほど回復に時間がかかる
      const depthMultiplier = getCrashDepthRecoveryMultiplier(state.crashReturn)
      const adjustedRecoveryYears = baseRecoveryYears * depthMultiplier
      const recoveryToNormalProbability = (1 / adjustedRecoveryYears) * 100

      // 確率的遷移: 調整済み回復年数に基づいて通常期に戻る
      if (Math.random() * 100 < recoveryToNormalProbability) {
        return {
          current: 'normal',
          precrashStocksBalance: 0,
          yearsInRecovery: 0,
          crashReturn: 0,
        }
      }
      // フォールバック: 株式残高が暴落前の水準に回復したら通常期に戻る
      if (currentStocksBalance >= state.precrashStocksBalance) {
        return {
          current: 'normal',
          precrashStocksBalance: 0,
          yearsInRecovery: 0,
          crashReturn: 0,
        }
      }
      // まだ回復していない場合は戻り期を継続（経過年数をインクリメント）
      return {
        ...state,
        yearsInRecovery: state.yearsInRecovery + 1,
      }
    }

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

// 株式リターンの上限・下限（±40%）
// 歴史的にS&P 500の年間リターンは最高+53%（1954年）、最低-43%（1931年）
const STOCK_RETURN_MAX = 0.40
const STOCK_RETURN_MIN = -0.40

/**
 * レジームに応じた株式利回りを返す（t分布でランダム化）
 * t分布（自由度5）を使用し、正規分布より裾が厚い分布でファットテールを考慮
 * リターンは±40%の範囲にクランプされる
 */
export function getStockReturn(regime: Regime, settings: RegimeSettings): number {
  let rawReturn: number

  const bootstrapData = getBootstrapData(settings.bootstrapIndex)
  if (bootstrapData) {
    // ブートストラップ: 過去データからランダム選択
    const returns = bootstrapData.returnsByRegime[regime]
    const randomIndex = Math.floor(Math.random() * returns.length)
    rawReturn = returns[randomIndex] / 100
  } else {
    // 従来: t分布から生成
    switch (regime) {
      case 'normal':
        rawReturn = randomT(settings.normalReturn, settings.normalStdDev ?? 10, STOCK_RETURN_DF) / 100
        break
      case 'crash':
        rawReturn = randomT(settings.crashReturn, settings.crashStdDev ?? 15, STOCK_RETURN_DF) / 100
        break
      case 'recovery':
        rawReturn = randomT(settings.recoveryReturn, settings.recoveryStdDev ?? 12, STOCK_RETURN_DF) / 100
        break
      default:
        return 0
    }
  }
  // 上限・下限でクランプ
  return Math.max(STOCK_RETURN_MIN, Math.min(STOCK_RETURN_MAX, rawReturn))
}

/**
 * 現在のレジームが暴落中または戻り期かどうかを判定
 * 暴落期・戻り期は株式を温存するため、現金・国債から取崩す
 */
export function isCrashRegime(regime: Regime): boolean {
  // 暴落期と戻り期は株式を温存する取崩し戦略を使用
  return regime === 'crash' || regime === 'recovery'
}


// 為替パラメータ（内部固定値）
const FX_PARAMS = {
  normal: { mean: 0, stdDev: 8 },    // 中立
  crash: { mean: -10, stdDev: 10 },  // 円高（リスクオフ）
  recovery: { mean: 5, stdDev: 8 },  // 円安（リスクオン）
} as const

/**
 * レジームに応じた為替リターンを生成
 * @param regime 現在のレジーム
 * @returns 為替変動率（例: 0.05 = 5%円安）
 */
export function getFxReturn(regime: Regime): number {
  const params = FX_PARAMS[regime]
  return randomStandardNormal() * (params.stdDev / 100) + (params.mean / 100)
}

/**
 * 外貨建て比率を考慮した円建て株式リターンを計算
 * @param regime 現在のレジーム
 * @param baseReturn 株式の基本リターン（ローカル通貨建て）
 * @param foreignRatio 外貨建て比率（0-100の%値）
 * @returns 円建て実質リターン
 */
export function getEffectiveStockReturn(
  regime: Regime,
  baseReturn: number,
  foreignRatio: number
): number {
  if (foreignRatio <= 0) {
    return baseReturn
  }

  const ratio = foreignRatio / 100
  const fxReturn = getFxReturn(regime)

  // 国内部分 = (1 - foreignRatio) × stockReturn
  const domesticPart = (1 - ratio) * baseReturn

  // 外貨部分 = foreignRatio × ((1 + stockReturn) × (1 + fxReturn) - 1)
  const foreignPart = ratio * ((1 + baseReturn) * (1 + fxReturn) - 1)

  return domesticPart + foreignPart
}
