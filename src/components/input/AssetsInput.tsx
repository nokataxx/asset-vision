import { Fragment } from 'react'
import { DEFAULT_ASSETS, type Assets, type StockFund, type StockFundPresetId } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RotateCcw, Plus, X } from 'lucide-react'
import { VALIDATION_CONSTRAINTS, clampValue } from '@/lib/validation'
import { STOCK_FUND_PRESETS, getPresetById, MAX_STOCK_FUNDS } from '@/data/stock-fund-presets'
import { getTotalStocks, getWeightedForeignRatio } from '@/lib/simulation/stockFundAggregation'

interface AssetsInputProps {
  assets: Assets
  onChange: (assets: Assets) => void
}

function generateFundId(): string {
  return `fund-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function AssetsInput({ assets, onChange }: AssetsInputProps) {
  const totalStocks = getTotalStocks(assets.stockFunds)
  const weightedForeignRatio = getWeightedForeignRatio(assets.stockFunds)
  const totalAssets = totalStocks + assets.bonds + assets.cash

  // 非stockFundsフィールドの変更
  type ScalarField = 'bonds' | 'cash' | 'cashLimit' | 'bondsLimit' | 'age'
  const handleFieldChange = (field: ScalarField, value: string) => {
    const numValue = parseFloat(value) || 0
    onChange({ ...assets, [field]: numValue })
  }

  const handleFieldBlur = (field: ScalarField, constraint: 'assets' | 'assetLimit' = 'assets') => {
    const currentValue = assets[field]
    const clampedValue = clampValue(currentValue, constraint)
    if (currentValue !== clampedValue) {
      onChange({ ...assets, [field]: clampedValue })
    }
  }

  const handleReset = () => {
    onChange(DEFAULT_ASSETS)
  }

  // ファンド操作
  const handleAddFund = () => {
    const preset = getPresetById('all_country')
    const newFund: StockFund = {
      id: generateFundId(),
      presetId: preset.id,
      label: preset.label,
      amount: 0,
      foreignRatio: preset.foreignRatio,
    }
    onChange({ ...assets, stockFunds: [...assets.stockFunds, newFund] })
  }

  const handleRemoveFund = (id: string) => {
    onChange({ ...assets, stockFunds: assets.stockFunds.filter((f) => f.id !== id) })
  }

  const handleFundChange = (id: string, updates: Partial<StockFund>) => {
    onChange({
      ...assets,
      stockFunds: assets.stockFunds.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })
  }

  const handlePresetChange = (id: string, presetId: StockFundPresetId) => {
    const preset = getPresetById(presetId)
    handleFundChange(id, {
      presetId,
      label: preset.label,
      foreignRatio: preset.foreignRatio,
    })
  }

  const handleFundAmountBlur = (id: string) => {
    const fund = assets.stockFunds.find((f) => f.id === id)
    if (!fund) return
    const clamped = clampValue(fund.amount, 'assets')
    if (fund.amount !== clamped) {
      handleFundChange(id, { amount: clamped })
    }
  }

  const handleFundRatioBlur = (id: string) => {
    const fund = assets.stockFunds.find((f) => f.id === id)
    if (!fund) return
    const clamped = clampValue(fund.foreignRatio, 'foreignRatio')
    if (fund.foreignRatio !== clamped) {
      handleFundChange(id, { foreignRatio: clamped })
    }
  }

  const { min: assetMin, max: assetMax } = VALIDATION_CONSTRAINTS.assets
  const { min: limitMin, max: limitMax } = VALIDATION_CONSTRAINTS.assetLimit

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>現在の資産</CardTitle>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          初期値
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 株式・投資信託セクション */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>株式・投資信託</Label>
          </div>

          {/* ファンドテーブル */}
          {assets.stockFunds.length > 0 && (
            <div className="grid grid-cols-[220px_minmax(0,1fr)_72px_20px] gap-x-1 gap-y-1 items-center">
              <span className="text-[11px] text-muted-foreground">ファンド</span>
              <span className="text-[11px] text-muted-foreground">金額（万円）</span>
              <span className="text-[11px] text-muted-foreground">外貨比率</span>
              <span />
              {assets.stockFunds.map((fund) => (
                <Fragment key={fund.id}>
                  <Select
                    value={fund.presetId}
                    onValueChange={(v) => handlePresetChange(fund.id, v as StockFundPresetId)}
                  >
                    <SelectTrigger className="h-8 text-[13px] w-full min-w-0">
                      <SelectValue className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCK_FUND_PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={assetMin}
                    max={assetMax}
                    value={fund.amount || ''}
                    onChange={(e) =>
                      handleFundChange(fund.id, { amount: parseFloat(e.target.value) || 0 })
                    }
                    onBlur={() => handleFundAmountBlur(fund.id)}
                    placeholder="万円"
                    className="h-8 text-xs"
                  />
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={fund.foreignRatio}
                      onChange={(e) =>
                        handleFundChange(fund.id, {
                          foreignRatio: parseFloat(e.target.value) || 0,
                        })
                      }
                      onBlur={() => handleFundRatioBlur(fund.id)}
                      className="h-8 text-xs pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground/40 hover:text-destructive transition-colors"
                    onClick={() => handleRemoveFund(fund.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Fragment>
              ))}
            </div>
          )}

          {/* ファンド追加ボタン + 合計表示 */}
          <div className="flex items-center justify-between">
            {assets.stockFunds.length < MAX_STOCK_FUNDS ? (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px]"
                onClick={handleAddFund}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                追加
              </Button>
            ) : (
              <div />
            )}
            {assets.stockFunds.length > 0 && (
              <span className="text-sm font-medium text-muted-foreground pr-4">
                合計: {totalStocks.toLocaleString()}万円{totalStocks > 0 && ` (${Math.round(weightedForeignRatio)}%)`}
              </span>
            )}
          </div>
        </div>

        <div className="pt-2">
          <hr className="border-border" />
        </div>

        {/* 国債 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="bonds">国債（万円）</Label>
            <Input
              id="bonds"
              type="number"
              min={assetMin}
              max={assetMax}
              value={assets.bonds || ''}
              onChange={(e) => handleFieldChange('bonds', e.target.value)}
              onBlur={() => handleFieldBlur('bonds')}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bondsLimit">積立上限（万円）</Label>
            <Input
              id="bondsLimit"
              type="number"
              min={limitMin}
              max={limitMax}
              value={assets.bondsLimit || ''}
              onChange={(e) => handleFieldChange('bondsLimit', e.target.value)}
              onBlur={() => handleFieldBlur('bondsLimit', 'assetLimit')}
              placeholder="1000"
            />
          </div>
        </div>

        {/* 現金 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="cash">現金（万円）</Label>
            <Input
              id="cash"
              type="number"
              min={assetMin}
              max={assetMax}
              value={assets.cash || ''}
              onChange={(e) => handleFieldChange('cash', e.target.value)}
              onBlur={() => handleFieldBlur('cash')}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cashLimit">積立上限（万円）</Label>
            <Input
              id="cashLimit"
              type="number"
              min={limitMin}
              max={limitMax}
              value={assets.cashLimit || ''}
              onChange={(e) => handleFieldChange('cashLimit', e.target.value)}
              onBlur={() => handleFieldBlur('cashLimit', 'assetLimit')}
              placeholder="500"
            />
          </div>
        </div>

        {/* 資産合計 */}
        <div className="pt-4">
          <div className="flex items-center justify-end gap-2 pr-4">
            <span className="font-medium">総資産</span>
            <span className="text-lg font-bold">
              {totalAssets.toLocaleString()} 万円
              {totalStocks > 0 && totalAssets > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({Math.round(totalStocks * weightedForeignRatio / totalAssets)}%)
                </span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
