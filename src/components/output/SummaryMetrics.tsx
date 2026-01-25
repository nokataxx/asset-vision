import type { SummaryMetrics as SummaryMetricsType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SummaryMetricsProps {
  metrics: SummaryMetricsType | null
}

export function SummaryMetrics({ metrics }: SummaryMetricsProps) {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>サマリー指標</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            シミュレーションを実行すると結果が表示されます
          </p>
        </CardContent>
      </Card>
    )
  }

  const tableRows = [
    {
      scenario: '楽観',
      percentile: '75%',
      depletionAge: metrics.depletionAge75th,
      finalAssets: metrics.finalAssets75th,
      minAssets: metrics.minAssets75th,
      highlight: false,
    },
    {
      scenario: '中央値',
      percentile: '50%',
      depletionAge: metrics.depletionAge50th,
      finalAssets: metrics.finalAssets50th,
      minAssets: metrics.minAssets50th,
      highlight: false,
    },
    {
      scenario: '悲観',
      percentile: '25%',
      depletionAge: metrics.depletionAge25th,
      finalAssets: metrics.finalAssets25th,
      minAssets: metrics.minAssets25th,
      highlight: metrics.finalAssets25th <= 0,
    },
    {
      scenario: '最悪',
      percentile: '10%',
      depletionAge: metrics.depletionAge10th,
      finalAssets: metrics.finalAssets10th,
      minAssets: metrics.minAssets10th,
      highlight: metrics.finalAssets10th <= 0,
    },
  ]

  // 成功率に応じた色
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-destructive'
  }

  // 安全引出率に応じた色（4%ルール基準）
  const getSWRColor = (rate: number | null) => {
    if (rate === null) return ''
    if (rate <= 4) return 'text-green-600'
    if (rate <= 5) return 'text-yellow-600'
    return 'text-destructive'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>サマリー指標</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 mx-10">
        {/* メイン指標（大きく表示） */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">成功率</p>
            <p className={`text-3xl font-bold ${getSuccessRateColor(metrics.successRate)}`}>
              {metrics.successRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              資産が枯渇しない確率
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">安全引出率</p>
            <p className={`text-3xl font-bold ${getSWRColor(metrics.safeWithdrawalRate)}`}>
              {metrics.safeWithdrawalRate !== null ? `${metrics.safeWithdrawalRate}%` : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              4%以下が目安
            </p>
          </div>
        </div>

        {/* シナリオ別結果（表形式） */}
        <div className="overflow-x-auto mx-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">シナリオ</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">枯渇時年齢</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">期末資産</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">最低到達資産</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.percentile} className="border-b last:border-b-0">
                  <td className="py-2 px-2">
                    <span className="font-medium">{row.scenario}</span>
                    <span className="text-muted-foreground ml-1">({row.percentile})</span>
                  </td>
                  <td className={`py-2 px-2 text-right ${row.depletionAge !== null ? 'text-destructive font-semibold' : ''}`}>
                    {row.depletionAge !== null ? `${row.depletionAge}歳` : '-'}
                  </td>
                  <td className={`py-2 px-2 text-right ${row.highlight ? 'text-destructive font-semibold' : ''}`}>
                    {row.finalAssets.toLocaleString()}万円
                  </td>
                  <td className={`py-2 px-2 text-right ${row.minAssets <= 0 ? 'text-destructive font-semibold' : ''}`}>
                    {row.minAssets.toLocaleString()}万円
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* リスク指標 */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t text-sm mx-12">
          <div>
            <span className="text-muted-foreground">暴落回数（平均）:</span>
            <span className="ml-1 font-medium">{metrics.averageCrashCount}回</span>
          </div>
          <div>
            <span className="text-muted-foreground">回復期間（平均）:</span>
            <span className="ml-1 font-medium">
              {metrics.averageRecoveryYears !== null ? `${metrics.averageRecoveryYears}年` : '-'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
