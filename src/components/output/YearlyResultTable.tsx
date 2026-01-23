import type { YearlyResult } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface YearlyResultTableProps {
  yearlyResults: YearlyResult[]
}

export function YearlyResultTable({ yearlyResults }: YearlyResultTableProps) {
  if (yearlyResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>年次結果テーブル</CardTitle>
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
        <CardTitle>年次結果テーブル</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">年</TableHead>
                <TableHead className="w-16">年齢</TableHead>
                <TableHead className="text-right">収入</TableHead>
                <TableHead className="text-right">支出①</TableHead>
                <TableHead className="text-right">支出②</TableHead>
                <TableHead className="text-right">資産(5%)</TableHead>
                <TableHead className="text-right">資産(10%)</TableHead>
                <TableHead className="text-right">資産(25%)</TableHead>
                <TableHead className="text-right">資産(50%)</TableHead>
                <TableHead className="text-right">資産(95%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearlyResults.map((result) => (
                <TableRow key={result.year}>
                  <TableCell className="font-medium">{result.year}</TableCell>
                  <TableCell>{result.age}</TableCell>
                  <TableCell className="text-right">
                    {result.income.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.basicExpense.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.extraExpense.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      result.assets5th <= 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {result.assets5th.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      result.assets10th <= 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {result.assets10th.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      result.assets25th <= 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {result.assets25th.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {result.assets50th.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.assets95th.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ※金額の単位はすべて万円
        </p>
      </CardContent>
    </Card>
  )
}
