import type { Regime, RegimeSettings } from '@/types'

export interface RegimeState {
  current: Regime
  precrashStocksBalance: number // 暴落前の株式残高（回復判定用）
}

/**
 * Box-Muller法による正規分布乱数生成
 * @param mean 平均
 * @param stdDev 標準偏差
 * @returns 正規分布に従う乱数
 */
function randomNormal(mean: number, stdDev: number): number {
  // Box-Muller変換
  // u1が0だとlog(0)=-Infinityになるため、0を回避
  let u1: number
  do {
    u1 = Math.random()
  } while (u1 === 0)
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + stdDev * z
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
 * レジームに応じた株式利回りを返す（正規分布でランダム化）
 */
export function getStockReturn(regime: Regime, settings: RegimeSettings): number {
  switch (regime) {
    case 'normal':
      return randomNormal(settings.normalReturn, settings.normalStdDev ?? 10) / 100
    case 'crash':
      return randomNormal(settings.crashReturn, settings.crashStdDev ?? 15) / 100
    case 'recovery':
      return randomNormal(settings.recoveryReturn, settings.recoveryStdDev ?? 12) / 100
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
