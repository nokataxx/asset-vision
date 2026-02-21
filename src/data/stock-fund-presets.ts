import type { StockFundPreset, StockFundPresetId } from '@/types'

export const STOCK_FUND_PRESETS: StockFundPreset[] = [
  { id: 'all_country', label: '全世界株式（オルカン）', foreignRatio: 88 },
  { id: 'developed_ex_jp', label: '先進国株式（MSCIコクサイ）', foreignRatio: 100 },
  { id: 'sp500', label: 'S&P 500 / 米国株式', foreignRatio: 100 },
  { id: 'domestic', label: '国内株式', foreignRatio: 0 },
  { id: 'emerging', label: '新興国株式', foreignRatio: 100 },
  { id: 'balanced', label: 'バランス型（8資産均等）', foreignRatio: 75 },
]

export function getPresetById(id: StockFundPresetId): StockFundPreset {
  return STOCK_FUND_PRESETS.find((p) => p.id === id) ?? STOCK_FUND_PRESETS[STOCK_FUND_PRESETS.length - 1]
}

/** 外貨比率に最も近いプリセットを返す（マイグレーション用） */
export function findClosestPreset(foreignRatio: number): StockFundPreset {
  if (foreignRatio === 0) return getPresetById('domestic')
  if (foreignRatio === 100) return getPresetById('sp500')
  if (foreignRatio >= 85 && foreignRatio <= 92) return getPresetById('all_country')
  return getPresetById('balanced')
}

export const MAX_STOCK_FUNDS = 10
