import { useEffect, useRef, useState } from 'react'
import type { YearlyResult } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

interface AssetChartProps {
  yearlyResults: YearlyResult[]
}

interface PercentileVisibility {
  p75: boolean
  median: boolean
  p25: boolean
  p10: boolean
}

export function AssetChart({ yearlyResults }: AssetChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 288 })
  const [visible, setVisible] = useState<PercentileVisibility>({
    p75: true,
    median: true,
    p25: true,
    p10: true,
  })

  const toggleVisibility = (key: keyof PercentileVisibility) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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

  const chartData = yearlyResults.map((r) => ({
    year: r.year,
    age: r.age,
    p75: r.assets75th,
    median: r.assets50th,
    p25: r.assets25th,
    p10: r.assets10th,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>資産推移グラフ</CardTitle>
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
              />
              <Tooltip
                formatter={(value, name) => {
                  if (typeof value !== 'number') return ['-', '']
                  const labels: Record<string, string> = {
                    p75: '楽観(75%)',
                    median: '中央値(50%)',
                    p25: '悲観(25%)',
                    p10: '最悪(10%)',
                  }
                  return [formatTooltip(value), labels[String(name)] || String(name)]
                }}
                labelFormatter={(label) => `${label}歳`}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
                itemSorter={(item) => {
                  const order: Record<string, number> = { p75: 0, median: 1, p25: 2, p10: 3 }
                  return order[item.dataKey as string] ?? 99
                }}
              />

              {/* 枯渇ライン */}
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />

              {/* 75%タイルライン（楽観） */}
              {visible.p75 && (
                <Line
                  type="monotone"
                  dataKey="p75"
                  stroke="#22c55e"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}

              {/* 中央値ライン */}
              {visible.median && (
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              )}

              {/* 25%タイルライン（悲観） */}
              {visible.p25 && (
                <Line
                  type="monotone"
                  dataKey="p25"
                  stroke="#eab308"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}

              {/* 10%タイルライン（最悪） */}
              {visible.p10 && (
                <Line
                  type="monotone"
                  dataKey="p10"
                  stroke="#ef4444"
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
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visible.p75}
              onChange={() => toggleVisibility('p75')}
              className="w-3.5 h-3.5 accent-green-500"
            />
            <div className="w-4 h-0.5 bg-green-500" style={{ borderTopWidth: 1, borderTopStyle: 'dashed' }} />
            <span className={visible.p75 ? 'text-foreground' : 'text-muted-foreground'}>楽観(75%)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visible.median}
              onChange={() => toggleVisibility('median')}
              className="w-3.5 h-3.5 accent-blue-600"
            />
            <div className="w-4 h-0.5 bg-blue-600" />
            <span className={visible.median ? 'text-foreground' : 'text-muted-foreground'}>中央値(50%)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visible.p25}
              onChange={() => toggleVisibility('p25')}
              className="w-3.5 h-3.5 accent-yellow-500"
            />
            <div className="w-4 h-0.5 bg-yellow-500" style={{ borderTopWidth: 1, borderTopStyle: 'dashed' }} />
            <span className={visible.p25 ? 'text-foreground' : 'text-muted-foreground'}>悲観(25%)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visible.p10}
              onChange={() => toggleVisibility('p10')}
              className="w-3.5 h-3.5 accent-red-500"
            />
            <div className="w-4 h-0.5 bg-red-500" style={{ borderTopWidth: 1, borderTopStyle: 'dashed' }} />
            <span className={visible.p10 ? 'text-foreground' : 'text-muted-foreground'}>最悪(10%)</span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
