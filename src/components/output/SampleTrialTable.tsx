import type { TrialResult, Regime } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { calculatePercentile } from '@/lib/simulation/statistics'

interface SampleTrialTableProps {
  trialResults: TrialResult[]
  initialTotalAssets: number
}

/**
 * 年次資産パスが中央値に最も近い試行を選択
 * 各年の資産額と中央値パスとの二乗誤差が最小の試行を「中央値シナリオ」として返す
 */
function selectRepresentativeTrial(trialResults: TrialResult[]): TrialResult | null {
  if (trialResults.length === 0) return null

  const numYears = trialResults[0].yearlyResults.length

  // 各年の50%タイル（中央値）を計算
  const medianPath: number[] = []
  for (let yearIndex = 0; yearIndex < numYears; yearIndex++) {
    const yearAssets = trialResults.map(
      (trial) => trial.yearlyResults[yearIndex]?.totalAssets ?? 0
    )
    medianPath.push(calculatePercentile(yearAssets, 50))
  }

  // 各試行について、中央値パスからの距離（二乗和）を計算
  let minDistance = Infinity
  let closestTrial: TrialResult | null = null

  for (const trial of trialResults) {
    let distance = 0
    for (let yearIndex = 0; yearIndex < numYears; yearIndex++) {
      const diff = (trial.yearlyResults[yearIndex]?.totalAssets ?? 0) - medianPath[yearIndex]
      distance += diff * diff
    }

    if (distance < minDistance) {
      minDistance = distance
      closestTrial = trial
    }
  }

  return closestTrial
}

// 増減率を計算（前年比の変化率）- 数値を返す
function calculateReturnRate(currentAssets: number, previousAssets: number): number | null {
  if (previousAssets <= 0) return null
  return ((currentAssets / previousAssets) - 1) * 100
}

// 増減率の表示文字列
function formatReturnRate(rate: number | null): string {
  if (rate === null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

// 増減率に応じた背景色クラス
function getReturnRateClass(rate: number | null): string {
  if (rate === null) return ''
  if (rate <= -10) return 'bg-red-100 dark:bg-red-900/30'
  if (rate >= 10) return 'bg-green-100 dark:bg-green-900/30'
  return ''
}

// レジームの日本語表示
const REGIME_LABELS: Record<Regime, string> = {
  normal: '通常',
  crash: '暴落',
  recovery: '戻り',
}

// レジームの色クラス
const REGIME_COLORS: Record<Regime, string> = {
  normal: '',
  crash: 'text-red-600',
  recovery: 'text-green-600',
}

export function SampleTrialTable({ trialResults, initialTotalAssets }: SampleTrialTableProps) {
  const sampleTrial = selectRepresentativeTrial(trialResults)

  if (!sampleTrial) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>中央値シナリオ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            シミュレーションを実行すると結果が表示されます
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>中央値シナリオ</span>
          <span className="text-sm font-normal text-muted-foreground">
            暴落回数: {sampleTrial.crashCount}回
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">年</TableHead>
                <TableHead className="w-16">年齢</TableHead>
                <TableHead className="w-16 text-center">レジーム</TableHead>
                <TableHead className="text-right">収入</TableHead>
                <TableHead className="text-right">支出①</TableHead>
                <TableHead className="text-right">支出②</TableHead>
                <TableHead className="text-right border-l">現金</TableHead>
                <TableHead className="text-right">国債</TableHead>
                <TableHead className="text-right">株式</TableHead>
                <TableHead className="text-right">合計</TableHead>
                <TableHead className="text-right">増減率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleTrial.yearlyResults.map((result, index) => {
                const previousAssets = index === 0
                  ? initialTotalAssets
                  : sampleTrial.yearlyResults[index - 1]?.totalAssets ?? 0
                const returnRate = calculateReturnRate(result.totalAssets, previousAssets)
                return (
                <TableRow key={result.year} className={getReturnRateClass(returnRate)}>
                  <TableCell className="font-medium">{result.year}</TableCell>
                  <TableCell>{result.age}</TableCell>
                  <TableCell className={`text-center font-medium ${REGIME_COLORS[result.regime]}`}>
                    {REGIME_LABELS[result.regime]}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.income.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.basicExpense.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.extraExpense.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right border-l">
                    {Math.round(result.cashBalance).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {Math.round(result.bondsBalance).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {Math.round(result.stocksBalance).toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      result.isDepleted ? 'text-destructive' : ''
                    }`}
                  >
                    {Math.round(result.totalAssets).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatReturnRate(returnRate)}
                  </TableCell>
                </TableRow>
              )
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span>※金額の単位はすべて万円</span>
          <span>※年次資産推移が中央値に最も近い試行を表示</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-100 dark:bg-red-900/30 border"></span>
            増減率 -10%以下
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-green-100 dark:bg-green-900/30 border"></span>
            増減率 +10%以上
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
