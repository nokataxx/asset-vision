import type { Regime, RegimeSettings } from '@/types'

export interface RegimeState {
  current: Regime
  recoveryYearsRemaining: number
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
    recoveryYearsRemaining: 0,
  }
}

/**
 * 次のレジームを決定し、状態を更新
 */
export function determineNextRegime(
  state: RegimeState,
  settings: RegimeSettings
): RegimeState {
  switch (state.current) {
    case 'normal':
      // 通常期 → 暴落期（確率で遷移）
      if (Math.random() * 100 < settings.crashProbability) {
        return {
          current: 'crash',
          recoveryYearsRemaining: 0,
        }
      }
      return state

    case 'crash':
      // 暴落期 → 戻り期（翌年自動遷移）
      return {
        current: 'recovery',
        recoveryYearsRemaining: settings.recoveryYears,
      }

    case 'recovery':
      // 戻り期 → 通常期（継続年数終了後）
      const remaining = state.recoveryYearsRemaining - 1
      if (remaining <= 0) {
        return {
          current: 'normal',
          recoveryYearsRemaining: 0,
        }
      }
      return {
        current: 'recovery',
        recoveryYearsRemaining: remaining,
      }

    default:
      return state
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
export function isCrashRegime(regime: Regime, _settings: RegimeSettings): boolean {
  // 暴落期と戻り期は株式を温存する取崩し戦略を使用
  return regime === 'crash' || regime === 'recovery'
}
