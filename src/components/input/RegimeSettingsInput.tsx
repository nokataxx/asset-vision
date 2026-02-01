import { useMemo } from 'react'
import { DEFAULT_REGIME_SETTINGS, type RegimeSettings } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpinInput } from '@/components/ui/spin-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { VALIDATION_CONSTRAINTS, clampValue } from '@/lib/validation'
import { sp500RegimeStats, sp500HistoricalCrashProbability } from '@/data/sp500-historical'

interface RegimeSettingsInputProps {
  settings: RegimeSettings
  onChange: (settings: RegimeSettings) => void
}

/**
 * 長期期待リターンを計算する（近似値）
 * 暴落からの回復に必要な年数を計算し、定常分布から期待値を算出
 */
function calculateExpectedReturn(settings: RegimeSettings): number {
  // ブートストラップモードでは過去実績を使用
  const normalReturn = settings.useBootstrap ? sp500RegimeStats.normal.mean : (settings.normalReturn ?? 8)
  const crashReturn = settings.useBootstrap ? sp500RegimeStats.crash.mean : (settings.crashReturn ?? -30)
  const recoveryReturn = settings.useBootstrap ? sp500RegimeStats.recovery.mean : (settings.recoveryReturn ?? 15)
  const crashProbability = settings.useBootstrap ? sp500HistoricalCrashProbability : (settings.crashProbability ?? 10)

  const p = crashProbability / 100 // 暴落確率（0-1）
  const crashReturnRatio = crashReturn / 100
  const recoveryReturnRatio = recoveryReturn / 100

  // 暴落からの回復に必要な平均年数を推定
  // 暴落後の残高比率 = 1 + crashReturn (例: 0.7 for -30%)
  // 回復に必要な年数 = log(1 / 残高比率) / log(1 + recoveryReturn)
  const postCrashRatio = 1 + crashReturnRatio
  let estimatedRecoveryYears = 2 // デフォルト
  if (postCrashRatio > 0 && postCrashRatio < 1 && recoveryReturnRatio > 0) {
    estimatedRecoveryYears = Math.log(1 / postCrashRatio) / Math.log(1 + recoveryReturnRatio)
  }

  // 定常確率の計算（近似）
  const n = estimatedRecoveryYears
  const denominator = 1 + p * (1 + n)
  const piNormal = 1 / denominator
  const piCrash = p / denominator
  const piRecovery = (n * p) / denominator

  // 期待リターン
  return (
    piNormal * normalReturn +
    piCrash * crashReturn +
    piRecovery * recoveryReturn
  )
}

export function RegimeSettingsInput({ settings, onChange }: RegimeSettingsInputProps) {
  const handleChange = (field: keyof RegimeSettings, value: string) => {
    onChange({ ...settings, [field]: parseFloat(value) || 0 })
  }

  const handleBlur = (field: Exclude<keyof RegimeSettings, 'useBootstrap'>, constraint: 'regimeReturn' | 'stdDev' | 'probability' | 'bondReturn' | 'withdrawalTaxRate') => {
    const clampedValue = clampValue(settings[field], constraint)
    if (settings[field] !== clampedValue) {
      onChange({ ...settings, [field]: clampedValue })
    }
  }

  const handleReset = () => {
    onChange(DEFAULT_REGIME_SETTINGS)
  }

  const expectedReturn = useMemo(() => calculateExpectedReturn(settings), [settings])

  const { min: returnMin, max: returnMax } = VALIDATION_CONSTRAINTS.regimeReturn
  const { min: stdMin, max: stdMax } = VALIDATION_CONSTRAINTS.stdDev
  const { min: probMin, max: probMax } = VALIDATION_CONSTRAINTS.probability
  const { min: bondMin, max: bondMax } = VALIDATION_CONSTRAINTS.bondReturn
  const { min: taxMin, max: taxMax } = VALIDATION_CONSTRAINTS.withdrawalTaxRate

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
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          初期値
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* モード切替トグル */}
          <div className="flex gap-2">
            <Button
              variant={!settings.useBootstrap ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ ...settings, useBootstrap: false })}
            >
              パラメータ指定
            </Button>
            <Button
              variant={settings.useBootstrap ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ ...settings, useBootstrap: true })}
            >
              S&P500 過去データ
            </Button>
          </div>

          {/* 通常期: 利回り、標準偏差 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="normalReturn" className="text-sm">
                通常期利回り（%）
              </Label>
              <SpinInput
                id="normalReturn"
                value={settings.useBootstrap ? sp500RegimeStats.normal.mean.toFixed(1) : settings.normalReturn}
                onChange={(value) => handleChange('normalReturn', value)}
                onBlur={() => handleBlur('normalReturn', 'regimeReturn')}
                step={0.5}
                min={returnMin}
                max={returnMax}
                placeholder="10"
                disabled={settings.useBootstrap}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="normalStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <SpinInput
                id="normalStdDev"
                value={settings.useBootstrap ? sp500RegimeStats.normal.stdDev.toFixed(1) : settings.normalStdDev}
                onChange={(value) => handleChange('normalStdDev', value)}
                onBlur={() => handleBlur('normalStdDev', 'stdDev')}
                step={0.5}
                min={stdMin}
                max={stdMax}
                placeholder="10"
                disabled={settings.useBootstrap}
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
                value={settings.useBootstrap ? sp500RegimeStats.crash.mean.toFixed(1) : settings.crashReturn}
                onChange={(value) => handleChange('crashReturn', value)}
                onBlur={() => handleBlur('crashReturn', 'regimeReturn')}
                step={0.5}
                min={returnMin}
                max={returnMax}
                placeholder="-22"
                disabled={settings.useBootstrap}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crashStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <SpinInput
                id="crashStdDev"
                value={settings.useBootstrap ? sp500RegimeStats.crash.stdDev.toFixed(1) : settings.crashStdDev}
                onChange={(value) => handleChange('crashStdDev', value)}
                onBlur={() => handleBlur('crashStdDev', 'stdDev')}
                step={0.5}
                min={stdMin}
                max={stdMax}
                placeholder="28"
                disabled={settings.useBootstrap}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crashProbability" className="text-sm">
                発生確率（%/年）
              </Label>
              <SpinInput
                id="crashProbability"
                value={settings.useBootstrap ? sp500HistoricalCrashProbability.toFixed(1) : settings.crashProbability}
                onChange={(value) => handleChange('crashProbability', value)}
                onBlur={() => handleBlur('crashProbability', 'probability')}
                step={0.5}
                min={probMin}
                max={probMax}
                placeholder="13"
                disabled={settings.useBootstrap}
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
                value={settings.useBootstrap ? sp500RegimeStats.recovery.mean.toFixed(1) : settings.recoveryReturn}
                onChange={(value) => handleChange('recoveryReturn', value)}
                onBlur={() => handleBlur('recoveryReturn', 'regimeReturn')}
                step={0.5}
                min={returnMin}
                max={returnMax}
                placeholder="18"
                disabled={settings.useBootstrap}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recoveryStdDev" className="text-sm">
                標準偏差（%）
              </Label>
              <SpinInput
                id="recoveryStdDev"
                value={settings.useBootstrap ? sp500RegimeStats.recovery.stdDev.toFixed(1) : settings.recoveryStdDev}
                onChange={(value) => handleChange('recoveryStdDev', value)}
                onBlur={() => handleBlur('recoveryStdDev', 'stdDev')}
                step={0.5}
                min={stdMin}
                max={stdMax}
                placeholder="20"
                disabled={settings.useBootstrap}
              />
            </div>
          </div>

          {/* 国債利回り・税率（両モードで表示） */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bondReturn" className="text-sm">
                国債利回り（%）
              </Label>
              <SpinInput
                id="bondReturn"
                value={settings.bondReturn}
                onChange={(value) => handleChange('bondReturn', value)}
                onBlur={() => handleBlur('bondReturn', 'bondReturn')}
                step={0.5}
                min={bondMin}
                max={bondMax}
                placeholder="1.2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalTaxRate" className="text-sm">
                税率（%）
              </Label>
              <SpinInput
                id="withdrawalTaxRate"
                value={settings.withdrawalTaxRate}
                onChange={(value) => handleChange('withdrawalTaxRate', value)}
                onBlur={() => handleBlur('withdrawalTaxRate', 'withdrawalTaxRate')}
                step={0.5}
                min={taxMin}
                max={taxMax}
                placeholder="10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
