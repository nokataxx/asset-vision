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
    <Card>
      <CardHeader>
        <CardTitle>現在の資産</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 株式（投資信託） */}
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

        {/* 国債 */}
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

        {/* 現金 */}
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

        {/* 資産合計 */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
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
