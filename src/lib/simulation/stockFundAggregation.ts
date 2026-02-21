import type { StockFund } from '@/types'

/** stockFunds から合計株式額を算出 */
export function getTotalStocks(funds: StockFund[]): number {
  return funds.reduce((sum, f) => sum + f.amount, 0)
}

/** stockFunds から加重平均外貨比率を算出 */
export function getWeightedForeignRatio(funds: StockFund[]): number {
  const total = getTotalStocks(funds)
  if (total === 0) return 0
  const weightedSum = funds.reduce((sum, f) => sum + f.amount * f.foreignRatio, 0)
  return weightedSum / total
}
