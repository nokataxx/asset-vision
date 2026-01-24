import type {
  Assets,
  AnnualPlan,
  RegimeSettings,
  WithdrawalPriority,
  TrialResult,
  TrialYearResult,
} from '@/types'
import {
  createInitialRegimeState,
  determineNextRegime,
  getStockReturn,
  isCrashRegime,
  type RegimeState,
} from './regime'
import {
  type AssetBalances,
  processNetIncome,
  calculateTotalAssets,
  isDepleted,
} from './withdrawal'

interface SimulationParams {
  initialAssets: Assets
  annualPlans: AnnualPlan[]
  regimeSettings: RegimeSettings
  withdrawalPriority: WithdrawalPriority
}

/**
 * 1回のシミュレーション試行を実行
 */
export function runSingleTrial(params: SimulationParams): TrialResult {
  const { initialAssets, annualPlans, regimeSettings, withdrawalPriority } = params

  // 初期状態
  let balances: AssetBalances = {
    stocks: initialAssets.stocks,
    bonds: initialAssets.bonds,
    cash: initialAssets.cash,
  }
  let regimeState: RegimeState = createInitialRegimeState()
  let depletionYear: number | null = null
  let crashCount = 0
  const yearlyResults: TrialYearResult[] = []

  for (const plan of annualPlans) {
    // 1. レジーム遷移の判定（年初、現在の株式残高を渡す）
    const previousRegime = regimeState.current
    regimeState = determineNextRegime(regimeState, regimeSettings, balances.stocks)

    // 暴落カウント
    if (regimeState.current === 'crash' && previousRegime !== 'crash') {
      crashCount++
    }

    // 2. 資産の成長
    // 国債のリターンを計算（常にプラス）
    const bondGain = balances.bonds * (regimeSettings.bondReturn / 100)

    // 国債リターンを現金→国債→株式の順で配分
    if (bondGain > 0) {
      let remainingBondGain = bondGain

      // 1. 現金を上限まで補充
      const cashRoomForBonds = Math.max(0, initialAssets.cashLimit - balances.cash)
      const toCashFromBonds = Math.min(remainingBondGain, cashRoomForBonds)
      balances.cash += toCashFromBonds
      remainingBondGain -= toCashFromBonds

      // 2. 国債を上限まで補充
      const bondsRoomForBonds = Math.max(0, initialAssets.bondsLimit - balances.bonds)
      const toBondsFromBonds = Math.min(remainingBondGain, bondsRoomForBonds)
      balances.bonds += toBondsFromBonds
      remainingBondGain -= toBondsFromBonds

      // 3. 残りは株式へ
      balances.stocks += remainingBondGain
    }

    // 株式のリターンを計算
    const stockReturn = getStockReturn(regimeState.current, regimeSettings)
    const stockGain = balances.stocks * stockReturn

    // 株式リターンを処理
    if (stockGain > 0) {
      let remainingStockGain = stockGain

      // 1. 現金を上限まで補充
      const cashRoomForStocks = Math.max(0, initialAssets.cashLimit - balances.cash)
      const toCashFromStocks = Math.min(remainingStockGain, cashRoomForStocks)
      balances.cash += toCashFromStocks
      remainingStockGain -= toCashFromStocks

      // 2. 国債を上限まで補充
      const bondsRoomForStocks = Math.max(0, initialAssets.bondsLimit - balances.bonds)
      const toBondsFromStocks = Math.min(remainingStockGain, bondsRoomForStocks)
      balances.bonds += toBondsFromStocks
      remainingStockGain -= toBondsFromStocks

      // 3. 残りは株式に加算
      balances.stocks += remainingStockGain
    } else {
      // 損失の場合は株式から減算
      balances.stocks += stockGain
    }

    // 3. 収支の計算
    const netIncome = plan.income - plan.basicExpense - plan.extraExpense

    // 4. 取崩し/積立
    const isCrash = isCrashRegime(regimeState.current, regimeSettings)
    const result = processNetIncome(netIncome, balances, withdrawalPriority, isCrash, {
      cashLimit: initialAssets.cashLimit,
      bondsLimit: initialAssets.bondsLimit,
    })
    balances = result.balances

    // 5. 枯渇判定
    const totalAssets = calculateTotalAssets(balances)
    const depleted = isDepleted(balances)

    if (depleted && depletionYear === null) {
      depletionYear = plan.year
    }

    // 年次結果を記録
    yearlyResults.push({
      year: plan.year,
      age: plan.age,
      regime: regimeState.current,
      stocksBalance: Math.max(0, balances.stocks),
      bondsBalance: Math.max(0, balances.bonds),
      cashBalance: Math.max(0, balances.cash),
      totalAssets: Math.max(0, totalAssets),
      income: plan.income,
      basicExpense: plan.basicExpense,
      extraExpense: plan.extraExpense,
      isDepleted: depleted,
    })
  }

  return {
    yearlyResults,
    depletionYear,
    crashCount,
  }
}

/**
 * モンテカルロシミュレーションを実行（複数試行）
 */
export function runMonteCarloSimulation(
  params: SimulationParams,
  numTrials: number = 1000
): TrialResult[] {
  const results: TrialResult[] = []

  for (let i = 0; i < numTrials; i++) {
    results.push(runSingleTrial(params))
  }

  return results
}
