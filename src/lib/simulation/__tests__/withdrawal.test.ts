import { describe, it, expect } from 'vitest'
import {
  processCashFlow,
  calculateTotalAssets,
  isDepleted,
  rebalanceExcessCash,
  replenishCash,
} from '../withdrawal'
import type { AssetBalances } from '../withdrawal'

// --- calculateTotalAssets ---
describe('calculateTotalAssets', () => {
  it('全資産の合計を返す', () => {
    expect(calculateTotalAssets({ stocks: 3000, bonds: 1000, cash: 500 })).toBe(4500)
  })

  it('全て0なら0', () => {
    expect(calculateTotalAssets({ stocks: 0, bonds: 0, cash: 0 })).toBe(0)
  })
})

// --- isDepleted ---
describe('isDepleted', () => {
  it('合計0以下ならtrue', () => {
    expect(isDepleted({ stocks: 0, bonds: 0, cash: 0 })).toBe(true)
  })

  it('合計が正ならfalse', () => {
    expect(isDepleted({ stocks: 0, bonds: 0, cash: 1 })).toBe(false)
  })
})

// --- processCashFlow ---
describe('processCashFlow', () => {
  it('収入 > 支出: 現金が増える', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 1000, cash: 500 }
    const result = processCashFlow(300, 200, balances)
    expect(result.balances.cash).toBe(600) // 500 + 300 - 200
    expect(result.balances.stocks).toBe(3000)
    expect(result.balances.bonds).toBe(1000)
    expect(result.shortfall).toBe(0)
  })

  it('支出 > 収入 + 現金: 国債から補填', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 1000, cash: 100 }
    const result = processCashFlow(0, 300, balances)
    // cash: 100 - 300 = -200 → 0, deficit = 200
    // bonds: min(1000, 200) = 200 引かれる → 800
    expect(result.balances.cash).toBe(0)
    expect(result.balances.bonds).toBe(800)
    expect(result.balances.stocks).toBe(3000)
    expect(result.shortfall).toBe(0)
  })

  it('国債で足りなければ株式から補填', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 100, cash: 50 }
    const result = processCashFlow(0, 500, balances)
    // cash: 50 - 500 = -450 → 0, deficit = 450
    // bonds: min(100, 450) = 100 引かれる → 0, remaining = 350
    // stocks: min(3000, 350) = 350 引かれる → 2650
    expect(result.balances.cash).toBe(0)
    expect(result.balances.bonds).toBe(0)
    expect(result.balances.stocks).toBe(2650)
    expect(result.shortfall).toBe(0)
  })

  it('全資産で足りない場合はshortfallが発生', () => {
    const balances: AssetBalances = { stocks: 100, bonds: 50, cash: 50 }
    const result = processCashFlow(0, 500, balances)
    // cash: 50 - 500 = -450 → 0, deficit = 450
    // bonds: min(50, 450) = 50 → 0, remaining = 400
    // stocks: min(100, 400) = 100 → 0, remaining = 300
    expect(result.balances.cash).toBe(0)
    expect(result.balances.bonds).toBe(0)
    expect(result.balances.stocks).toBe(0)
    expect(result.shortfall).toBe(300)
  })
})

// --- rebalanceExcessCash ---
describe('rebalanceExcessCash', () => {
  it('現金が上限以下なら変更なし', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 500, cash: 300 }
    const result = rebalanceExcessCash(balances, 500, 1000)
    expect(result).toEqual(balances)
  })

  it('超過分を国債→株式へ振り分け', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 500, cash: 800 }
    const result = rebalanceExcessCash(balances, 300, 1000)
    // excess = 800 - 300 = 500
    // bondsRoom = 1000 - 500 = 500, toBonds = min(500, 500) = 500
    // toStocks = 500 - 500 = 0
    expect(result.cash).toBe(300)
    expect(result.bonds).toBe(1000)
    expect(result.stocks).toBe(3000)
  })

  it('国債が上限到達済みなら全て株式へ', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 1000, cash: 800 }
    const result = rebalanceExcessCash(balances, 300, 1000)
    // excess = 500, bondsRoom = 0 → 全て株式
    expect(result.cash).toBe(300)
    expect(result.bonds).toBe(1000)
    expect(result.stocks).toBe(3500)
  })
})

// --- replenishCash ---
describe('replenishCash', () => {
  it('現金が上限以上なら変更なし', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 1000, cash: 500 }
    const result = replenishCash(balances, 500, true)
    expect(result).toEqual(balances)
  })

  it('国債から優先補填（税率0%）', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 1000, cash: 200 }
    const result = replenishCash(balances, 500, true, 0)
    // deficit = 300, taxMultiplier = 1.0
    // fromBonds = min(1000, 300) = 300
    expect(result.cash).toBe(500)
    expect(result.bonds).toBe(700)
    expect(result.stocks).toBe(3000)
  })

  it('株式から優先補填（税率0%）', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 1000, cash: 200 }
    const result = replenishCash(balances, 500, false, 0)
    // deficit = 300, fromStocks = min(3000, 300) = 300
    expect(result.cash).toBe(500)
    expect(result.stocks).toBe(2700)
    expect(result.bonds).toBe(1000)
  })

  it('税率考慮: 取崩し額の一部が税金で消える', () => {
    const balances: AssetBalances = { stocks: 3000, bonds: 1000, cash: 200 }
    const result = replenishCash(balances, 500, true, 20)
    // deficit = 300, taxMultiplier = 1.2
    // neededFromBonds = min(1000, 360) = 360
    // actualToCash = 360 / 1.2 = 300
    expect(result.cash).toBe(500)
    expect(result.bonds).toBe(640) // 1000 - 360
    expect(result.stocks).toBe(3000)
  })
})
