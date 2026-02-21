import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
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
} from '@/types'
import { getTotalStocks } from '@/lib/simulation/stockFundAggregation'
import { Play, Loader2, Cloud, HardDrive, WifiOff } from 'lucide-react'

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
    setAssets(data.assets)
    setIncomeExpensePlan(data.incomeExpensePlan)
    setAnnualPlans(data.annualPlans)
    setRegimeSettings(data.regimeSettings)
  }, [])

  // エラーハンドラ
  const handleSaveError = useCallback(() => {
    toast.error('保存エラー', {
      description: 'データの保存に失敗しました。ローカルに保存されます。',
    })
  }, [])

  const handleLoadError = useCallback(() => {
    toast.error('読み込みエラー', {
      description: 'クラウドからのデータ読み込みに失敗しました。ローカルデータを使用します。',
    })
  }, [])

  // データ永続化フック
  const { isAuthenticated, isOnline } = useDataPersistence(persistenceData, {
    onLoad: handleDataLoad,
    onSaveError: handleSaveError,
    onLoadError: handleLoadError,
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
        },
        1000
      )

      const initialTotalAssets = getTotalStocks(assets.stockFunds) + assets.bonds + assets.cash
      const result = aggregateSimulationResults(trialResults, annualPlans, initialTotalAssets)
      setSimulationResult(result)
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <MainLayout
      inputArea={
        <>
          {/* 保存状態インジケーター */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground ms-3 mb-2">
            {!isOnline ? (
              <>
                <WifiOff className="h-3 w-3 text-amber-500" />
                <span className="text-amber-500">オフライン - ローカルに保存中</span>
              </>
            ) : isAuthenticated ? (
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

          {/* 1段目: 現在の資産とレジーム設定 (1:1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <AssetsInput assets={assets} onChange={handleAssetsChange} />
            </div>

            <div className="md:col-span-1">
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
          <SampleTrialTable
            trialResults={simulationResult?.trialResults ?? []}
            initialTotalAssets={getTotalStocks(assets.stockFunds) + assets.bonds + assets.cash}
          />
        </>
      }
    />
  )
}

export default App
