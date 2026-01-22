import type { RegimeSettings } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RegimeSettingsInputProps {
  settings: RegimeSettings
  onChange: (settings: RegimeSettings) => void
}

export function RegimeSettingsInput({ settings, onChange }: RegimeSettingsInputProps) {
  const handleChange = (field: keyof RegimeSettings, value: number) => {
    onChange({ ...settings, [field]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>レジーム設定</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左側: 株式レジームパラメータ (2/3) */}
          <div className="space-y-4 md:col-span-2">
            <Label className="text-base font-medium">株式レジームパラメータ</Label>

            {/* 通常期 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="normalReturn" className="text-sm">
                  通常期利回り（%）
                </Label>
                <Input
                  id="normalReturn"
                  type="number"
                  step="0.1"
                  value={settings.normalReturn}
                  onChange={(e) =>
                    handleChange('normalReturn', parseFloat(e.target.value) || 0)
                  }
                  placeholder="7"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="normalStdDev" className="text-sm">
                  標準偏差（%）
                </Label>
                <Input
                  id="normalStdDev"
                  type="number"
                  step="0.1"
                  value={settings.normalStdDev ?? 10}
                  onChange={(e) =>
                    handleChange('normalStdDev', parseFloat(e.target.value) || 0)
                  }
                  placeholder="10"
                />
              </div>
            </div>

            {/* 暴落期 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="crashReturn" className="text-sm">
                  暴落期利回り（%）
                </Label>
                <Input
                  id="crashReturn"
                  type="number"
                  step="0.1"
                  value={settings.crashReturn}
                  onChange={(e) =>
                    handleChange('crashReturn', parseFloat(e.target.value) || 0)
                  }
                  placeholder="-25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crashStdDev" className="text-sm">
                  標準偏差（%）
                </Label>
                <Input
                  id="crashStdDev"
                  type="number"
                  step="0.1"
                  value={settings.crashStdDev ?? 15}
                  onChange={(e) =>
                    handleChange('crashStdDev', parseFloat(e.target.value) || 0)
                  }
                  placeholder="15"
                />
              </div>
            </div>

            {/* 戻り期 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="recoveryReturn" className="text-sm">
                  戻り期利回り（%）
                </Label>
                <Input
                  id="recoveryReturn"
                  type="number"
                  step="0.1"
                  value={settings.recoveryReturn}
                  onChange={(e) =>
                    handleChange('recoveryReturn', parseFloat(e.target.value) || 0)
                  }
                  placeholder="12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recoveryStdDev" className="text-sm">
                  標準偏差（%）
                </Label>
                <Input
                  id="recoveryStdDev"
                  type="number"
                  step="0.1"
                  value={settings.recoveryStdDev ?? 12}
                  onChange={(e) =>
                    handleChange('recoveryStdDev', parseFloat(e.target.value) || 0)
                  }
                  placeholder="12"
                />
              </div>
            </div>

            {/* 暴落確率と戻り期年数 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="crashProbability" className="text-sm">
                  暴落発生確率（%/年）
                </Label>
                <Input
                  id="crashProbability"
                  type="number"
                  step="0.1"
                  value={settings.crashProbability}
                  onChange={(e) =>
                    handleChange('crashProbability', parseFloat(e.target.value) || 0)
                  }
                  placeholder="7"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recoveryYears" className="text-sm">
                  戻り期継続年数
                </Label>
                <Input
                  id="recoveryYears"
                  type="number"
                  value={settings.recoveryYears}
                  onChange={(e) =>
                    handleChange('recoveryYears', parseInt(e.target.value) || 0)
                  }
                  placeholder="4"
                />
              </div>
            </div>
          </div>

          {/* 右側: その他資産のリターン (1/3) */}
          <div className="space-y-4 md:border-l md:pl-6 md:col-span-1">
            <Label className="text-base font-medium">その他資産のリターン</Label>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bondReturn" className="text-sm">
                  国債リターン（%）
                </Label>
                <Input
                  id="bondReturn"
                  type="number"
                  step="0.1"
                  value={settings.bondReturn}
                  onChange={(e) =>
                    handleChange('bondReturn', parseFloat(e.target.value) || 0)
                  }
                  placeholder="1.2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cashReturn" className="text-sm">
                  現金リターン（%）
                </Label>
                <Input
                  id="cashReturn"
                  type="number"
                  step="0.1"
                  value={settings.cashReturn}
                  onChange={(e) =>
                    handleChange('cashReturn', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
