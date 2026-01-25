import { useMemo } from 'react'
import { DEFAULT_REGIME_SETTINGS, type RegimeSettings } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpinInput } from '@/components/ui/spin-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface RegimeSettingsInputProps {
  settings: RegimeSettings
  onChange: (settings: RegimeSettings) => void
}

/**
 * 長期期待リターンを計算する（近似値）
 * 暴落からの回復に必要な年数を計算し、定常分布から期待値を算出
 */
function calculateExpectedReturn(settings: RegimeSettings): number {
  const p = (settings.crashProbability ?? 10) / 100 // 暴落確率（0-1）
  const crashReturn = (settings.crashReturn ?? -30) / 100
  const recoveryReturn = (settings.recoveryReturn ?? 15) / 100

  // 暴落からの回復に必要な平均年数を推定
  // 暴落後の残高比率 = 1 + crashReturn (例: 0.7 for -30%)
  // 回復に必要な年数 = log(1 / 残高比率) / log(1 + recoveryReturn)
  const postCrashRatio = 1 + crashReturn
  let estimatedRecoveryYears = 2 // デフォルト
  if (postCrashRatio > 0 && postCrashRatio < 1 && recoveryReturn > 0) {
    estimatedRecoveryYears = Math.log(1 / postCrashRatio) / Math.log(1 + recoveryReturn)
  }

  // 定常確率の計算（近似）
  const n = estimatedRecoveryYears
  const denominator = 1 + p * (1 + n)
  const piNormal = 1 / denominator
  const piCrash = p / denominator
  const piRecovery = (n * p) / denominator

  // 期待リターン
  return (
    piNormal * (settings.normalReturn ?? 8) +
    piCrash * (settings.crashReturn ?? -30) +
    piRecovery * (settings.recoveryReturn ?? 15)
  )
}

export function RegimeSettingsInput({ settings, onChange }: RegimeSettingsInputProps) {
  const handleChange = (field: keyof RegimeSettings, value: string) => {
    onChange({ ...settings, [field]: parseFloat(value) || 0 })
  }

  const expectedReturn = useMemo(() => calculateExpectedReturn(settings), [settings])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-4">
          <CardTitle>レジーム設定</CardTitle>
          <span className="text-sm text-muted-foreground">
            長期期待リターン:{' '}
            <span className="font-medium text-foreground">
              ≈{expectedReturn.toFixed(1)}%
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
              <SpinInput
                id="normalReturn"
                value={settings.normalReturn || ''}
                onChange={(value) => handleChange('normalReturn', value)}
                step={0.5}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="normalStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <SpinInput
                id="normalStdDev"
                value={settings.normalStdDev || ''}
                onChange={(value) => handleChange('normalStdDev', value)}
                step={0.5}
                placeholder="10"
              />
            </div>
          </div>

          {/* 暴落期: 利回り、標準偏差、発生確率 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="crashReturn" className="text-sm">
                暴落期利回り（%）
              </Label>
              <SpinInput
                id="crashReturn"
                value={settings.crashReturn || ''}
                onChange={(value) => handleChange('crashReturn', value)}
                step={1}
                placeholder="-22"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crashStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <SpinInput
                id="crashStdDev"
                value={settings.crashStdDev || ''}
                onChange={(value) => handleChange('crashStdDev', value)}
                step={0.5}
                placeholder="28"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crashProbability" className="text-sm">
                発生確率（%/年）
              </Label>
              <SpinInput
                id="crashProbability"
                value={settings.crashProbability || ''}
                onChange={(value) => handleChange('crashProbability', value)}
                step={1}
                min={0}
                max={100}
                placeholder="13"
              />
            </div>
          </div>

          {/* 戻り期: 利回り、標準偏差 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="recoveryReturn" className="text-sm">
                戻り期利回り（%）
              </Label>
              <SpinInput
                id="recoveryReturn"
                value={settings.recoveryReturn || ''}
                onChange={(value) => handleChange('recoveryReturn', value)}
                step={1}
                placeholder="18"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recoveryStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <SpinInput
                id="recoveryStdDev"
                value={settings.recoveryStdDev || ''}
                onChange={(value) => handleChange('recoveryStdDev', value)}
                step={0.5}
                placeholder="20"
              />
            </div>
          </div>

          {/* 国債利回り */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bondReturn" className="text-sm">
                国債利回り（%）
              </Label>
              <SpinInput
                id="bondReturn"
                value={settings.bondReturn || ''}
                onChange={(value) => handleChange('bondReturn', value)}
                step={0.1}
                placeholder="1.2"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
