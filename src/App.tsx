import { useState, useCallback, useMemo } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AssetsInput } from '@/components/input/AssetsInput'
import { IncomeExpenseSettings } from '@/components/input/IncomeExpenseSettings'
import { AnnualPlanTable } from '@/components/input/AnnualPlanTable'
import { generateAnnualPlans } from '@/lib/annualPlan'
import { RegimeSettingsInput } from '@/components/input/RegimeSettingsInput'
import { AssetChart } from '@/components/output/AssetChart'
import { SummaryMetrics } from '@/components/output/SummaryMetrics'
import { YearlyResultTable } from '@/components/output/YearlyResultTable'
import { SampleTrialTable } from '@/components/output/SampleTrialTable'
import { Button } from '@/components/ui/button'
import { runMonteCarloSimulation } from '@/lib/simulation/monteCarlo'
import { aggregateSimulationResults } from '@/lib/simulation/statistics'
import { useDataPersistence } from '@/hooks/useDataPersistence'
import type { UserSimulationData } from '@/lib/database/userDataService'
import type {
  Assets,
  IncomeExpensePlan,
  AnnualPlan,
  RegimeSettings,
  SimulationResult,
} from '@/types'
import {
  DEFAULT_ASSETS,
  DEFAULT_INCOME_EXPENSE_PLAN,
  DEFAULT_REGIME_SETTINGS,
  DEFAULT_WITHDRAWAL_PRIORITY,
} from '@/types'
import { Play, Loader2, Cloud, HardDrive, RotateCcw } from 'lucide-react'

function App() {
  // 入力状態
  const [assets, setAssets] = useState<Assets>(DEFAULT_ASSETS)
  const [incomeExpensePlan, setIncomeExpensePlan] = useState<IncomeExpensePlan>(
    DEFAULT_INCOME_EXPENSE_PLAN
  )
  const [annualPlans, setAnnualPlans] = useState<AnnualPlan[]>([])
  const [regimeSettings, setRegimeSettings] = useState<RegimeSettings>(
    DEFAULT_REGIME_SETTINGS
  )

  // シミュレーション結果
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(
    null
  )
  const [isSimulating, setIsSimulating] = useState(false)

  // データ永続化用のオブジェクト
  const persistenceData = useMemo<UserSimulationData>(
    () => ({
      assets,
      incomeExpensePlan,
      annualPlans,
      regimeSettings,
    }),
    [assets, incomeExpensePlan, annualPlans, regimeSettings]
  )

  // データ読み込み時のコールバック
  const handleDataLoad = useCallback((data: UserSimulationData) => {
    // 古いデータ形式（stocks が配列）から新しい形式（数値）への変換
    let migratedAssets = data.assets
    if (Array.isArray(data.assets.stocks)) {
      const stocksArray = data.assets.stocks as Array<{ amount: number }>
      migratedAssets = {
        ...data.assets,
        stocks: stocksArray.reduce((sum, s) => sum + (s.amount || 0), 0),
      }
    }
    setAssets(migratedAssets)
    setIncomeExpensePlan(data.incomeExpensePlan)
    setAnnualPlans(data.annualPlans)

    // 古いデータ形式からの移行（recoveryYears関連のプロパティを削除）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { recoveryYears, recoveryYearsMin, recoveryYearsMax, ...cleanSettings } = data.regimeSettings as RegimeSettings & {
      recoveryYears?: number
      recoveryYearsMin?: number
      recoveryYearsMax?: number
    }
    setRegimeSettings(cleanSettings as RegimeSettings)
  }, [])

  // データ永続化フック
  const { isAuthenticated } = useDataPersistence(persistenceData, {
    onLoad: handleDataLoad,
    debounceMs: 2000,
  })

  // 収支計画が変更されたら年次計画を更新（既存の値を保持）
  const handleIncomeExpensePlanChange = (plan: IncomeExpensePlan) => {
    setIncomeExpensePlan(plan)
    if (plan.duration > 0 && assets.age > 0) {
      const plans = generateAnnualPlans(plan, assets.age, annualPlans)
      setAnnualPlans(plans)
    }
  }

  // 年齢が変更されたら年次計画を更新（既存の値を保持）
  const handleAssetsChange = (newAssets: Assets) => {
    setAssets(newAssets)
    if (newAssets.age !== assets.age && incomeExpensePlan.duration > 0) {
      const plans = generateAnnualPlans(incomeExpensePlan, newAssets.age, annualPlans)
      setAnnualPlans(plans)
    }
  }

  // シミュレーション実行
  const handleRunSimulation = async () => {
    if (annualPlans.length === 0) {
      alert('収支計画を入力してください')
      return
    }

    setIsSimulating(true)

    // UIをブロックしないように非同期で実行
    await new Promise((resolve) => setTimeout(resolve, 10))

    try {
      const trialResults = runMonteCarloSimulation(
        {
          initialAssets: assets,
          annualPlans,
          regimeSettings,
          withdrawalPriority: DEFAULT_WITHDRAWAL_PRIORITY,
        },
        1000
      )

      const result = aggregateSimulationResults(trialResults, annualPlans)
      setSimulationResult(result)
    } finally {
      setIsSimulating(false)
    }
  }

  // 設定をリセット
  const handleResetSettings = () => {
    if (!confirm('すべての設定をデフォルト値にリセットしますか？')) {
      return
    }

    // ローカルストレージをクリア
    localStorage.removeItem('asset-vision-data')

    // 状態をデフォルト値にリセット
    setAssets(DEFAULT_ASSETS)
    setIncomeExpensePlan(DEFAULT_INCOME_EXPENSE_PLAN)
    setAnnualPlans([])
    setRegimeSettings(DEFAULT_REGIME_SETTINGS)
    setSimulationResult(null)
  }

  return (
    <MainLayout
      inputArea={
        <>
          {/* 保存状態インジケーターとリセットボタン */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground ms-3">
              {isAuthenticated ? (
                <>
                  <Cloud className="h-3 w-3" />
                  <span>クラウドに自動保存</span>
                </>
              ) : (
                <>
                  <HardDrive className="h-3 w-3" />
                  <span>ローカルに自動保存</span>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetSettings}
              className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              設定をリセット
            </Button>
          </div>

          {/* 1段目: 現在の資産とレジーム設定 (4:6) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <AssetsInput assets={assets} onChange={handleAssetsChange} />
            </div>

            <div className="md:col-span-3">
              <RegimeSettingsInput
                settings={regimeSettings}
                onChange={setRegimeSettings}
              />
            </div>
          </div>

          {/* 2段目: 収支計画と年次収支テーブル (4:6) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <IncomeExpenseSettings
                plan={incomeExpensePlan}
                onChange={handleIncomeExpensePlanChange}
                age={assets.age}
                onAgeChange={(age) => handleAssetsChange({ ...assets, age })}
              />
            </div>

            <div className="md:col-span-3">
              <AnnualPlanTable
                plans={annualPlans}
                onChange={setAnnualPlans}
                incomeGrowthRate={incomeExpensePlan.incomeGrowthRate}
                expenseGrowthRate={incomeExpensePlan.expenseGrowthRate}
              />
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleRunSimulation}
            disabled={isSimulating || annualPlans.length === 0}
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                シミュレーション中...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                シミュレーション実行
              </>
            )}
          </Button>
        </>
      }
      outputArea={
        <>
          <AssetChart yearlyResults={simulationResult?.yearlyResults ?? []} />
          <SummaryMetrics metrics={simulationResult?.summary ?? null} />
          <YearlyResultTable yearlyResults={simulationResult?.yearlyResults ?? []} />
          <SampleTrialTable trialResults={simulationResult?.trialResults ?? []} />
        </>
      }
    />
  )
}

export default App
