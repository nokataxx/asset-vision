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

  const items = [
    {
      label: '資産枯渇確率',
      value: `${metrics.depletionProbability}%`,
      highlight: metrics.depletionProbability > 10,
    },
    {
      label: '枯渇年（中央値）',
      value: metrics.medianDepletionYear
        ? `${metrics.medianDepletionYear}年`
        : '-',
      highlight: false,
    },
    {
      label: '期末資産（50%）',
      value: `${metrics.finalAssets50th.toLocaleString()}万円`,
      highlight: false,
    },
    {
      label: '期末資産（5%）',
      value: `${metrics.finalAssets5th.toLocaleString()}万円`,
      highlight: metrics.finalAssets5th <= 0,
    },
    {
      label: '期末資産（10%）',
      value: `${metrics.finalAssets10th.toLocaleString()}万円`,
      highlight: metrics.finalAssets10th <= 0,
    },
    {
      label: '期末資産（25%）',
      value: `${metrics.finalAssets25th.toLocaleString()}万円`,
      highlight: metrics.finalAssets25th <= 0,
    },
    {
      label: '期末資産（95%）',
      value: `${metrics.finalAssets95th.toLocaleString()}万円`,
      highlight: false,
    },
    {
      label: '暴落発生回数（平均）',
      value: `${metrics.averageCrashCount}回`,
      highlight: false,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>サマリー指標</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p
                className={`text-lg font-semibold ${
                  item.highlight ? 'text-destructive' : ''
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
