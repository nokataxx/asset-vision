import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createInitialRegimeState,
  determineNextRegime,
  adjustRecoveryTargetForCashFlow,
  getDoubleDipCrashProbability,
  getCrashDepthRecoveryMultiplier,
} from '../regime'
import type { RegimeState } from '../regime'
import { DEFAULT_REGIME_SETTINGS } from '@/types'
import type { RegimeSettings } from '@/types'

const settings: RegimeSettings = { ...DEFAULT_REGIME_SETTINGS }

afterEach(() => {
  vi.restoreAllMocks()
})

// --- getDoubleDipCrashProbability ---
describe('getDoubleDipCrashProbability', () => {
  it('1年目は基本確率の1.5倍', () => {
    expect(getDoubleDipCrashProbability(13, 1)).toBeCloseTo(19.5)
  })

  it('2年目は基本確率の1.15倍', () => {
    expect(getDoubleDipCrashProbability(13, 2)).toBeCloseTo(14.95)
  })

  it('3年目以降は基本確率のまま', () => {
    expect(getDoubleDipCrashProbability(13, 3)).toBe(13)
    expect(getDoubleDipCrashProbability(13, 10)).toBe(13)
  })
})

// --- getCrashDepthRecoveryMultiplier ---
describe('getCrashDepthRecoveryMultiplier', () => {
  it('軽度（> -20%）は0.6', () => {
    expect(getCrashDepthRecoveryMultiplier(-0.10)).toBe(0.6)
    expect(getCrashDepthRecoveryMultiplier(-0.19)).toBe(0.6)
  })

  it('中度（-20%〜-35%）は1.0', () => {
    expect(getCrashDepthRecoveryMultiplier(-0.20)).toBe(1.0)
    expect(getCrashDepthRecoveryMultiplier(-0.34)).toBe(1.0)
  })

  it('重度（< -35%）は2.0', () => {
    expect(getCrashDepthRecoveryMultiplier(-0.35)).toBe(2.0)
    expect(getCrashDepthRecoveryMultiplier(-0.50)).toBe(2.0)
  })
})

// --- createInitialRegimeState ---
describe('createInitialRegimeState', () => {
  it('通常期・残高0・経過年数0で初期化', () => {
    const state = createInitialRegimeState()
    expect(state.current).toBe('normal')
    expect(state.precrashStocksBalance).toBe(0)
    expect(state.yearsInRecovery).toBe(0)
    expect(state.crashReturn).toBe(0)
  })
})

// --- adjustRecoveryTargetForCashFlow ---
describe('adjustRecoveryTargetForCashFlow', () => {
  it('通常期は変更なし', () => {
    const state: RegimeState = {
      current: 'normal',
      precrashStocksBalance: 1000,
      yearsInRecovery: 0,
      crashReturn: 0,
    }
    const result = adjustRecoveryTargetForCashFlow(state, -500)
    expect(result.precrashStocksBalance).toBe(1000)
  })

  it('戻り期で黒字なら目標が上がる', () => {
    const state: RegimeState = {
      current: 'recovery',
      precrashStocksBalance: 1000,
      yearsInRecovery: 1,
      crashReturn: -0.25,
    }
    const result = adjustRecoveryTargetForCashFlow(state, 200)
    expect(result.precrashStocksBalance).toBe(1200)
  })

  it('戻り期で赤字なら目標が下がる', () => {
    const state: RegimeState = {
      current: 'recovery',
      precrashStocksBalance: 1000,
      yearsInRecovery: 1,
      crashReturn: -0.25,
    }
    const result = adjustRecoveryTargetForCashFlow(state, -300)
    expect(result.precrashStocksBalance).toBe(700)
  })

  it('大きな赤字でも目標は0未満にならない', () => {
    const state: RegimeState = {
      current: 'recovery',
      precrashStocksBalance: 100,
      yearsInRecovery: 1,
      crashReturn: -0.25,
    }
    const result = adjustRecoveryTargetForCashFlow(state, -500)
    expect(result.precrashStocksBalance).toBe(0)
  })
})

// --- determineNextRegime ---
describe('determineNextRegime', () => {
  it('通常期 → 暴落期（確率以下の乱数）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05) // 5% < 12%
    const state: RegimeState = {
      current: 'normal',
      precrashStocksBalance: 0,
      yearsInRecovery: 0,
      crashReturn: 0,
    }
    const next = determineNextRegime(state, settings, 5000)
    expect(next.current).toBe('crash')
    expect(next.precrashStocksBalance).toBe(5000)
  })

  it('通常期 → 通常期維持（確率以上の乱数）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.50) // 50% > 12%
    const state: RegimeState = {
      current: 'normal',
      precrashStocksBalance: 0,
      yearsInRecovery: 0,
      crashReturn: 0,
    }
    const next = determineNextRegime(state, settings, 5000)
    expect(next.current).toBe('normal')
  })

  it('暴落期 → 戻り期（自動遷移）', () => {
    const state: RegimeState = {
      current: 'crash',
      precrashStocksBalance: 5000,
      yearsInRecovery: 0,
      crashReturn: -0.25,
    }
    const next = determineNextRegime(state, settings, 3000)
    expect(next.current).toBe('recovery')
    expect(next.yearsInRecovery).toBe(1)
    expect(next.crashReturn).toBe(-0.25)
    expect(next.precrashStocksBalance).toBe(5000)
  })

  it('戻り期 → 暴落期（二番底: 1年目の高確率で再暴落）', () => {
    // 二番底: 12% * 1.5 = 18%。乱数 0.15 → 15% < 18% → 暴落
    vi.spyOn(Math, 'random').mockReturnValue(0.15)
    const state: RegimeState = {
      current: 'recovery',
      precrashStocksBalance: 5000,
      yearsInRecovery: 1,
      crashReturn: -0.25,
    }
    const next = determineNextRegime(state, settings, 4000)
    expect(next.current).toBe('crash')
    expect(next.precrashStocksBalance).toBe(4000) // 新たな暴落前残高
  })

  it('戻り期 → 通常期（確率的遷移）', () => {
    // 二番底回避（乱数大）→ 確率的遷移成功（乱数小）
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom
      .mockReturnValueOnce(0.99) // 二番底チェック: 99% > 18% → 回避
      .mockReturnValueOnce(0.10) // 遷移チェック: 10% < 40% (1/2.5) → 通常期へ
    const state: RegimeState = {
      current: 'recovery',
      precrashStocksBalance: 5000,
      yearsInRecovery: 1,
      crashReturn: -0.25, // 中度 → multiplier 1.0 → 2.5年 → 40%
    }
    const next = determineNextRegime(state, settings, 3000)
    expect(next.current).toBe('normal')
    expect(next.precrashStocksBalance).toBe(0)
    expect(next.yearsInRecovery).toBe(0)
  })

  it('戻り期 → 通常期（フォールバック: 残高回復）', () => {
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom
      .mockReturnValueOnce(0.99) // 二番底回避
      .mockReturnValueOnce(0.99) // 確率的遷移失敗
    const state: RegimeState = {
      current: 'recovery',
      precrashStocksBalance: 3000,
      yearsInRecovery: 2,
      crashReturn: -0.25,
    }
    // 株式残高 >= 暴落前残高 → 通常期へ
    const next = determineNextRegime(state, settings, 3000)
    expect(next.current).toBe('normal')
  })

  it('戻り期 → 戻り期継続（経過年数がインクリメント）', () => {
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom
      .mockReturnValueOnce(0.99) // 二番底回避
      .mockReturnValueOnce(0.99) // 確率的遷移失敗
    const state: RegimeState = {
      current: 'recovery',
      precrashStocksBalance: 5000,
      yearsInRecovery: 2,
      crashReturn: -0.25,
    }
    // 株式残高 < 暴落前残高 → 戻り期継続
    const next = determineNextRegime(state, settings, 3000)
    expect(next.current).toBe('recovery')
    expect(next.yearsInRecovery).toBe(3)
  })

  it('重度暴落では回復確率が低い（回復年数×2.0）', () => {
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom
      .mockReturnValueOnce(0.99) // 二番底回避
      .mockReturnValueOnce(0.15) // 遷移チェック: 15% < 20% (1/5.0) → 通常期へ
    const state: RegimeState = {
      current: 'recovery',
      precrashStocksBalance: 5000,
      yearsInRecovery: 3,
      crashReturn: -0.40, // 重度 → multiplier 2.0 → 5.0年 → 20%
    }
    const next = determineNextRegime(state, settings, 3000)
    expect(next.current).toBe('normal')
  })
})
