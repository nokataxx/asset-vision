import { DEFAULT_ASSETS, type Assets } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { VALIDATION_CONSTRAINTS, clampValue } from '@/lib/validation'

interface AssetsInputProps {
  assets: Assets
  onChange: (assets: Assets) => void
}

export function AssetsInput({ assets, onChange }: AssetsInputProps) {
  const totalAssets = assets.stocks + assets.bonds + assets.cash

  const handleAssetChange = (field: keyof Assets, value: string) => {
    const numValue = parseFloat(value) || 0
    onChange({ ...assets, [field]: numValue })
  }

  const handleAssetBlur = (field: keyof Assets, constraint: 'assets' | 'assetLimit' | 'foreignRatio' = 'assets') => {
    const currentValue = assets[field]
    const clampedValue = clampValue(currentValue, constraint)
    if (currentValue !== clampedValue) {
      onChange({ ...assets, [field]: clampedValue })
    }
  }

  const handleReset = () => {
    onChange(DEFAULT_ASSETS)
  }

  const { min: assetMin, max: assetMax } = VALIDATION_CONSTRAINTS.assets
  const { min: limitMin, max: limitMax } = VALIDATION_CONSTRAINTS.assetLimit
  const { min: foreignMin, max: foreignMax } = VALIDATION_CONSTRAINTS.foreignRatio

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>現在の資産</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          初期値
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 株式（投資信託） */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="stocks">株式・投資信託（万円）</Label>
            <Input
              id="stocks"
              type="number"
              min={assetMin}
              max={assetMax}
              value={assets.stocks || ''}
              onChange={(e) => handleAssetChange('stocks', e.target.value)}
              onBlur={() => handleAssetBlur('stocks')}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foreignRatio">うち外貨建て（%）</Label>
            <Input
              id="foreignRatio"
              type="number"
              min={foreignMin}
              max={foreignMax}
              step={5}
              value={assets.foreignRatio || ''}
              onChange={(e) => handleAssetChange('foreignRatio', e.target.value)}
              onBlur={() => handleAssetBlur('foreignRatio', 'foreignRatio')}
              placeholder="0"
            />
          </div>
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
              onChange={(e) => handleAssetChange('bonds', e.target.value)}
              onBlur={() => handleAssetBlur('bonds')}
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
              onChange={(e) => handleAssetChange('bondsLimit', e.target.value)}
              onBlur={() => handleAssetBlur('bondsLimit', 'assetLimit')}
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
              onChange={(e) => handleAssetChange('cash', e.target.value)}
              onBlur={() => handleAssetBlur('cash')}
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
              onChange={(e) => handleAssetChange('cashLimit', e.target.value)}
              onBlur={() => handleAssetBlur('cashLimit', 'assetLimit')}
              placeholder="500"
            />
          </div>
        </div>

        {/* 資産合計 */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="font-medium">総資産</span>
            <span className="text-lg font-bold">
              {totalAssets.toLocaleString()} 万円
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
