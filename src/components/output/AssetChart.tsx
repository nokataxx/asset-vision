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

export function AssetChart({ yearlyResults }: AssetChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 288 })

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
    median: r.assets50th,
    lower: r.assets5th,
    p10: r.assets10th,
    p25: r.assets25th,
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
                    median: '50%',
                    lower: '5%',
                    p10: '10%',
                    p25: '25%',
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
              <Line
                type="monotone"
                dataKey="lower"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />

              {/* 10%タイルライン */}
              <Line
                type="monotone"
                dataKey="p10"
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />

              {/* 25%タイルライン */}
              <Line
                type="monotone"
                dataKey="p25"
                stroke="#eab308"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            </ComposedChart>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-blue-600" />
            <span>50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-red-500" style={{ borderTopWidth: 1, borderTopStyle: 'dashed' }} />
            <span>5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-orange-500" style={{ borderTopWidth: 1, borderTopStyle: 'dashed' }} />
            <span>10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-yellow-500" style={{ borderTopWidth: 1, borderTopStyle: 'dashed' }} />
            <span>25%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
