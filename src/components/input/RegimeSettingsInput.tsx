import { useMemo } from 'react'
import { DEFAULT_REGIME_SETTINGS, type RegimeSettings } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface RegimeSettingsInputProps {
  settings: RegimeSettings
  onChange: (settings: RegimeSettings) => void
}

/**
 * 長期期待リターンを計算する
 * レジーム遷移の定常分布から期待値を算出
 */
function calculateExpectedReturn(settings: RegimeSettings): number {
  const p = (settings.crashProbability ?? 10) / 100 // 暴落確率（0-1）
  const n = settings.recoveryYears ?? 2 // 戻り期年数（平均）

  // 定常確率の計算
  // π_normal = 1 / (1 + p + n*p)
  // π_crash = p / (1 + p + n*p)
  // π_recovery = n*p / (1 + p + n*p)
  const denominator = 1 + p * (1 + n)
  const piNormal = 1 / denominator
  const piCrash = p / denominator
  const piRecovery = (n * p) / denominator

  // 期待リターン
  return (
    piNormal * settings.normalReturn +
    piCrash * settings.crashReturn +
    piRecovery * settings.recoveryReturn
  )
}

export function RegimeSettingsInput({ settings, onChange }: RegimeSettingsInputProps) {
  const handleChange = (field: keyof RegimeSettings, value: string) => {
    onChange({ ...settings, [field]: parseFloat(value) || 0 })
  }

  const expectedReturn = useMemo(() => calculateExpectedReturn(settings), [settings])

  const handleIntChange = (field: keyof RegimeSettings, value: string) => {
    onChange({ ...settings, [field]: parseInt(value) || 0 })
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-4">
          <CardTitle>レジーム設定</CardTitle>
          <span className="text-sm text-muted-foreground">
            長期期待リターン:{' '}
            <span className="font-medium text-foreground">
              {expectedReturn.toFixed(1)}%
            </span>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(DEFAULT_REGIME_SETTINGS)}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          初期値
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 通常期: 利回り、標準偏差 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="normalReturn" className="text-sm">
                通常期利回り（%）
              </Label>
              <Input
                id="normalReturn"
                type="number"
                value={settings.normalReturn || ''}
                onChange={(e) => handleChange('normalReturn', e.target.value)}
                placeholder="8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="normalStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <Input
                id="normalStdDev"
                type="number"
                value={settings.normalStdDev || ''}
                onChange={(e) => handleChange('normalStdDev', e.target.value)}
                placeholder="16"
              />
            </div>
          </div>

          {/* 暴落期: 利回り、標準偏差、発生確率 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="crashReturn" className="text-sm">
                暴落期利回り（%）
              </Label>
              <Input
                id="crashReturn"
                type="number"
                value={settings.crashReturn || ''}
                onChange={(e) => handleChange('crashReturn', e.target.value)}
                placeholder="-30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crashStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <Input
                id="crashStdDev"
                type="number"
                value={settings.crashStdDev || ''}
                onChange={(e) => handleChange('crashStdDev', e.target.value)}
                placeholder="20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crashProbability" className="text-sm">
                発生確率（%/年）
              </Label>
              <Input
                id="crashProbability"
                type="number"
                value={settings.crashProbability || ''}
                onChange={(e) => handleChange('crashProbability', e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          {/* 戻り期: 利回り、標準偏差、年数 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="recoveryReturn" className="text-sm">
                戻り期利回り（%）
              </Label>
              <Input
                id="recoveryReturn"
                type="number"
                value={settings.recoveryReturn || ''}
                onChange={(e) => handleChange('recoveryReturn', e.target.value)}
                placeholder="15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recoveryStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <Input
                id="recoveryStdDev"
                type="number"
                value={settings.recoveryStdDev || ''}
                onChange={(e) => handleChange('recoveryStdDev', e.target.value)}
                placeholder="18"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recoveryYears" className="text-sm">
                継続年数（平均）
              </Label>
              <Input
                id="recoveryYears"
                type="number"
                value={settings.recoveryYears || ''}
                onChange={(e) => handleIntChange('recoveryYears', e.target.value)}
                placeholder="2"
              />
            </div>
          </div>

          {/* 国債利回り */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bondReturn" className="text-sm">
                国債利回り（%）
              </Label>
              <Input
                id="bondReturn"
                type="number"
                value={settings.bondReturn || ''}
                onChange={(e) => handleChange('bondReturn', e.target.value)}
                placeholder="1.2"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
