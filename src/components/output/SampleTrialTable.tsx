import type { TrialResult } from '@/types'
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
}

// 年次パスが中央値に最も近い試行を選択
function selectMedianTrial(trialResults: TrialResult[]): TrialResult | null {
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

// レジームの日本語表示
function getRegimeLabel(regime: string): string {
  switch (regime) {
    case 'normal':
      return '通常'
    case 'crash':
      return '暴落'
    case 'recovery':
      return '戻り'
    default:
      return regime
  }
}

// レジームに応じた背景色クラス
function getRegimeClass(regime: string): string {
  switch (regime) {
    case 'crash':
      return 'bg-red-100 dark:bg-red-900/30'
    case 'recovery':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    default:
      return ''
  }
}

export function SampleTrialTable({ trialResults }: SampleTrialTableProps) {
  const sampleTrial = selectMedianTrial(trialResults)

  if (!sampleTrial) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>サンプル試行詳細</CardTitle>
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
          <span>50%タイル試行</span>
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
                <TableHead className="w-16">レジーム</TableHead>
                <TableHead className="text-right">収入</TableHead>
                <TableHead className="text-right">支出①</TableHead>
                <TableHead className="text-right">支出②</TableHead>
                <TableHead className="text-right border-l">現金</TableHead>
                <TableHead className="text-right">国債</TableHead>
                <TableHead className="text-right">株式</TableHead>
                <TableHead className="text-right">合計</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleTrial.yearlyResults.map((result) => (
                <TableRow key={result.year} className={getRegimeClass(result.regime)}>
                  <TableCell className="font-medium">{result.year}</TableCell>
                  <TableCell>{result.age}</TableCell>
                  <TableCell className="font-medium">
                    {getRegimeLabel(result.regime)}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span>※金額の単位はすべて万円</span>
          <span>※年次資産推移が50%タイルに最も近い試行を選択</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-100 dark:bg-red-900/30 border"></span>
            暴落期
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-yellow-100 dark:bg-yellow-900/30 border"></span>
            戻り期
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
