import { useMemo } from 'react'
import { DEFAULT_REGIME_SETTINGS, DEFAULT_WITHDRAWAL_PRIORITY, type RegimeSettings, type WithdrawalPriority } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpinInput } from '@/components/ui/spin-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RotateCcw, HelpCircle } from 'lucide-react'
import { VALIDATION_CONSTRAINTS, clampValue } from '@/lib/validation'

interface RegimeSettingsInputProps {
  settings: RegimeSettings
  onChange: (settings: RegimeSettings) => void
  withdrawalPriority: WithdrawalPriority
  onWithdrawalPriorityChange: (priority: WithdrawalPriority) => void
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

export function RegimeSettingsInput({ settings, onChange, withdrawalPriority, onWithdrawalPriorityChange }: RegimeSettingsInputProps) {
  const handleChange = (field: keyof RegimeSettings, value: string) => {
    onChange({ ...settings, [field]: parseFloat(value) || 0 })
  }

  const handleBlur = (field: keyof RegimeSettings, constraint: 'regimeReturn' | 'stdDev' | 'probability' | 'bondReturn') => {
    const clampedValue = clampValue(settings[field], constraint)
    if (settings[field] !== clampedValue) {
      onChange({ ...settings, [field]: clampedValue })
    }
  }

  const handleDeclineThresholdChange = (value: string) => {
    onWithdrawalPriorityChange({
      ...withdrawalPriority,
      declineThreshold: parseFloat(value) || 0,
    })
  }

  const handleDeclineThresholdBlur = () => {
    // 閾値は-100〜0の範囲にクランプ
    const clamped = Math.max(-100, Math.min(0, withdrawalPriority.declineThreshold))
    if (withdrawalPriority.declineThreshold !== clamped) {
      onWithdrawalPriorityChange({ ...withdrawalPriority, declineThreshold: clamped })
    }
  }

  const handleReset = () => {
    onChange(DEFAULT_REGIME_SETTINGS)
    onWithdrawalPriorityChange(DEFAULT_WITHDRAWAL_PRIORITY)
  }

  const expectedReturn = useMemo(() => calculateExpectedReturn(settings), [settings])

  const { min: returnMin, max: returnMax } = VALIDATION_CONSTRAINTS.regimeReturn
  const { min: stdMin, max: stdMax } = VALIDATION_CONSTRAINTS.stdDev
  const { min: probMin, max: probMax } = VALIDATION_CONSTRAINTS.probability
  const { min: bondMin, max: bondMax } = VALIDATION_CONSTRAINTS.bondReturn

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
                onBlur={() => handleBlur('normalReturn', 'regimeReturn')}
                step={0.5}
                min={returnMin}
                max={returnMax}
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
                onBlur={() => handleBlur('normalStdDev', 'stdDev')}
                step={0.5}
                min={stdMin}
                max={stdMax}
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
                onBlur={() => handleBlur('crashReturn', 'regimeReturn')}
                step={1}
                min={returnMin}
                max={returnMax}
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
                onBlur={() => handleBlur('crashStdDev', 'stdDev')}
                step={0.5}
                min={stdMin}
                max={stdMax}
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
                onBlur={() => handleBlur('crashProbability', 'probability')}
                step={1}
                min={probMin}
                max={probMax}
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
                onBlur={() => handleBlur('recoveryReturn', 'regimeReturn')}
                step={1}
                min={returnMin}
                max={returnMax}
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
                onBlur={() => handleBlur('recoveryStdDev', 'stdDev')}
                step={0.5}
                min={stdMin}
                max={stdMax}
                placeholder="20"
              />
            </div>
          </div>

          {/* 国債利回り・下落閾値 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bondReturn" className="text-sm">
                国債利回り（%）
              </Label>
              <SpinInput
                id="bondReturn"
                value={settings.bondReturn || ''}
                onChange={(value) => handleChange('bondReturn', value)}
                onBlur={() => handleBlur('bondReturn', 'bondReturn')}
                step={0.1}
                min={bondMin}
                max={bondMax}
                placeholder="1.2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="declineThreshold" className="text-sm flex items-center gap-1">
                下落閾値（%）
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">
                    資産がこの率以下に下落したら、株式を温存して現金・国債から優先的に取り崩します
                  </TooltipContent>
                </Tooltip>
              </Label>
              <SpinInput
                id="declineThreshold"
                value={withdrawalPriority.declineThreshold || ''}
                onChange={handleDeclineThresholdChange}
                onBlur={handleDeclineThresholdBlur}
                step={1}
                min={-100}
                max={0}
                placeholder="-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
