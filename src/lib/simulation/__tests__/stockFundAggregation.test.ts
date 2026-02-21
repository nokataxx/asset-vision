import { describe, it, expect } from 'vitest'
import { getTotalStocks, getWeightedForeignRatio } from '../stockFundAggregation'
import type { StockFund } from '@/types'

function makeFund(amount: number, foreignRatio: number): StockFund {
  return {
    id: `test-${Math.random()}`,
    presetId: 'custom',
    label: 'Test',
    amount,
    foreignRatio,
  }
}

describe('getTotalStocks', () => {
  it('空配列で0を返す', () => {
    expect(getTotalStocks([])).toBe(0)
  })

  it('1ファンドの金額を返す', () => {
    expect(getTotalStocks([makeFund(1000, 88)])).toBe(1000)
  })

  it('複数ファンドの合計を返す', () => {
    expect(getTotalStocks([makeFund(3000, 88), makeFund(1000, 0)])).toBe(4000)
  })
})

describe('getWeightedForeignRatio', () => {
  it('空配列で0を返す', () => {
    expect(getWeightedForeignRatio([])).toBe(0)
  })

  it('1ファンドの外貨比率をそのまま返す', () => {
    expect(getWeightedForeignRatio([makeFund(1000, 88)])).toBe(88)
  })

  it('同一比率の複数ファンドでその比率を返す', () => {
    expect(getWeightedForeignRatio([makeFund(500, 100), makeFund(500, 100)])).toBe(100)
  })

  it('異なる比率の複数ファンドで加重平均を返す', () => {
    // (3000*88 + 1000*0) / 4000 = 66
    expect(getWeightedForeignRatio([makeFund(3000, 88), makeFund(1000, 0)])).toBe(66)
  })

  it('金額0のファンドは加重平均に影響しない', () => {
    expect(getWeightedForeignRatio([makeFund(0, 100), makeFund(1000, 50)])).toBe(50)
  })

  it('全ファンドの金額が0なら0を返す', () => {
    expect(getWeightedForeignRatio([makeFund(0, 100), makeFund(0, 50)])).toBe(0)
  })
})
