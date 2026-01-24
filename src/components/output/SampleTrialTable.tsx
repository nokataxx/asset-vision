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

interface SampleTrialTableProps {
  trialResults: TrialResult[]
}

// 中央値に近い試行を選択
function selectMedianTrial(trialResults: TrialResult[]): TrialResult | null {
  if (trialResults.length === 0) return null

  // 最終資産額でソート
  const sorted = [...trialResults].sort((a, b) => {
    const aFinal = a.yearlyResults[a.yearlyResults.length - 1]?.totalAssets ?? 0
    const bFinal = b.yearlyResults[b.yearlyResults.length - 1]?.totalAssets ?? 0
    return aFinal - bFinal
  })

  // 中央の試行を返す
  const medianIndex = Math.floor(sorted.length / 2)
  return sorted[medianIndex]
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
          <span>※最終年の資産額で50パーセンタイルの試行を1つ選択</span>
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
