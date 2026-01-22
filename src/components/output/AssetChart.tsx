import { useState, useEffect, useRef } from 'react'
import type { YearlyResult } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
} from 'recharts'

type ChartMode = 'all' | 'medianOnly' | 'medianAnd5th'

interface AssetChartProps {
  yearlyResults: YearlyResult[]
}

export function AssetChart({ yearlyResults }: AssetChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 288 })
  const [chartMode, setChartMode] = useState<ChartMode>('all')

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        if (width > 0) {
          setDimensions({ width, height: 288 })
        }
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)

    // 少し遅延させて再計算（レイアウトが確定した後）
    const timer = setTimeout(updateDimensions, 100)

    return () => {
      window.removeEventListener('resize', updateDimensions)
      clearTimeout(timer)
    }
  }, [yearlyResults])

  if (yearlyResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>資産推移グラフ</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            シミュレーションを実行すると結果が表示されます
          </p>
        </CardContent>
      </Card>
    )
  }

  // グラフ用のデータを変換
  // 信頼区間を正しく描画するため、スタック用の別キーを使用
  const chartData = yearlyResults.map((r) => ({
    year: r.year,
    age: r.age,
    median: r.assets50th,
    lower: r.assets5th,
    upper: r.assets95th,
    // スタック用（Tooltipには表示しない）
    _stackBase: r.assets5th,
    _stackBand: Math.max(0, r.assets95th - r.assets5th),
  }))

  const formatYAxis = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}億`
    }
    return `${value}万`
  }

  const formatTooltip = (value: number) => {
    return `${value.toLocaleString()}万円`
  }

  const showUpper = chartMode === 'all'
  const showLower = chartMode === 'all' || chartMode === 'medianAnd5th'
  const showConfidenceBand = chartMode === 'all'

  // モードに応じたY軸の最大値を計算
  const getYAxisMax = (): number | 'auto' => {
    if (chartMode === 'medianOnly') {
      const maxMedian = Math.max(...chartData.map((d) => d.median))
      return Math.ceil(maxMedian * 1.1) // 10%のマージン
    }
    if (chartMode === 'medianAnd5th') {
      const maxValue = Math.max(...chartData.map((d) => Math.max(d.median, d.lower)))
      return Math.ceil(maxValue * 1.1)
    }
    return 'auto'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>資産推移グラフ</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={chartMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartMode('all')}
            className="text-xs h-7 px-2"
          >
            全て
          </Button>
          <Button
            variant={chartMode === 'medianAnd5th' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartMode('medianAnd5th')}
            className="text-xs h-7 px-2"
          >
            中央値+5%
          </Button>
          <Button
            variant={chartMode === 'medianOnly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartMode('medianOnly')}
            className="text-xs h-7 px-2"
          >
            中央値のみ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} style={{ width: '100%', height: 288 }}>
          {dimensions.width > 0 ? (
            <ComposedChart
              data={chartData}
              width={dimensions.width}
              height={dimensions.height}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="age"
                tickFormatter={(value) => `${value}歳`}
                fontSize={12}
              />
              <YAxis
                tickFormatter={formatYAxis}
                fontSize={12}
                domain={[0, getYAxisMax()]}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (typeof value !== 'number') return ['-', '']
                  // スタック用データはTooltipに表示しない
                  if (String(name).startsWith('_')) return null
                  // 非表示のラインはTooltipにも表示しない
                  if (String(name) === 'upper' && !showUpper) return null
                  if (String(name) === 'lower' && !showLower) return null
                  const labels: Record<string, string> = {
                    median: '中央値',
                    lower: '5%タイル',
                    upper: '95%タイル',
                  }
                  return [formatTooltip(value), labels[String(name)] || String(name)]
                }}
                labelFormatter={(label) => `${label}歳`}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />

              {/* 信頼区間（5%〜95%）の帯 - スタック方式 */}
              {showConfidenceBand && (
                <>
                  <Area
                    type="monotone"
                    dataKey="_stackBase"
                    stackId="confidence"
                    stroke="none"
                    fill="transparent"
                    legendType="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="_stackBand"
                    stackId="confidence"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    legendType="none"
                  />
                </>
              )}

              {/* 枯渇ライン */}
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />

              {/* 中央値ライン */}
              <Line
                type="monotone"
                dataKey="median"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />

              {/* 5%タイルライン */}
              {showLower && (
                <Line
                  type="monotone"
                  dataKey="lower"
                  stroke="#6b7280"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}

              {/* 95%タイルライン */}
              {showUpper && (
                <Line
                  type="monotone"
                  dataKey="upper"
                  stroke="#6b7280"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </ComposedChart>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
          )}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-600" />
            <span>中央値</span>
          </div>
          {showLower && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-500 border-dashed" style={{ borderTopWidth: 1, borderTopStyle: 'dashed' }} />
              <span>{showUpper ? '5%/95%タイル' : '5%タイル'}</span>
            </div>
          )}
          {showConfidenceBand && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-blue-500/15" />
              <span>信頼区間</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
