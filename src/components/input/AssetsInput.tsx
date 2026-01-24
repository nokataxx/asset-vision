import type { Assets } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AssetsInputProps {
  assets: Assets
  onChange: (assets: Assets) => void
}

export function AssetsInput({ assets, onChange }: AssetsInputProps) {
  const totalAssets = assets.stocks + assets.bonds + assets.cash

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>現在の資産</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 株式（投資信託） */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="stocks">株式・投資信託（万円）</Label>
            <Input
              id="stocks"
              type="number"
              value={assets.stocks || ''}
              onChange={(e) =>
                onChange({ ...assets, stocks: parseFloat(e.target.value) || 0 })
              }
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
              value={assets.bonds || ''}
              onChange={(e) =>
                onChange({ ...assets, bonds: parseFloat(e.target.value) || 0 })
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bondsLimit">積立上限（万円）</Label>
            <Input
              id="bondsLimit"
              type="number"
              value={assets.bondsLimit || ''}
              onChange={(e) =>
                onChange({ ...assets, bondsLimit: parseFloat(e.target.value) || 0 })
              }
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
              value={assets.cash || ''}
              onChange={(e) =>
                onChange({ ...assets, cash: parseFloat(e.target.value) || 0 })
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cashLimit">積立上限（万円）</Label>
            <Input
              id="cashLimit"
              type="number"
              value={assets.cashLimit || ''}
              onChange={(e) =>
                onChange({ ...assets, cashLimit: parseFloat(e.target.value) || 0 })
              }
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
