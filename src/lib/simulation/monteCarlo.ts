import type {
  Assets,
  AnnualPlan,
  RegimeSettings,
  TrialResult,
  TrialYearResult,
} from '@/types'
import {
  createInitialRegimeState,
  determineNextRegime,
  adjustRecoveryTargetForCashFlow,
  getStockReturn,
  getEffectiveStockReturn,
  type RegimeState,
} from './regime'
import {
  type AssetBalances,
  processCashFlow,
  rebalanceExcessCash,
  replenishCash,
  calculateTotalAssets,
  isDepleted,
} from './withdrawal'
import { getTotalStocks, getWeightedForeignRatio } from './stockFundAggregation'

export interface SimulationParams {
  initialAssets: Assets
  annualPlans: AnnualPlan[]
  regimeSettings: RegimeSettings
}

/**
 * 1回のシミュレーション試行を実行
 */
export function runSingleTrial(params: SimulationParams): TrialResult {
  const { initialAssets, annualPlans, regimeSettings } = params

  // stockFundsから集約
  const totalStocks = getTotalStocks(initialAssets.stockFunds)
  const foreignRatio = getWeightedForeignRatio(initialAssets.stockFunds)

  // 初期状態
  let balances: AssetBalances = {
    stocks: totalStocks,
    bonds: initialAssets.bonds,
    cash: initialAssets.cash,
  }
  let regimeState: RegimeState = createInitialRegimeState()
  let depletionYear: number | null = null
  let crashCount = 0
  const yearlyResults: TrialYearResult[] = []

  // 年初の現金補充: 初年度は国債から優先（不足時は株式から）
  balances = replenishCash(balances, initialAssets.cashLimit, true, regimeSettings.withdrawalTaxRate)

  for (const plan of annualPlans) {
    // 1. レジーム遷移の判定（年初）
    const previousRegime = regimeState.current
    regimeState = determineNextRegime(regimeState, regimeSettings, balances.stocks)

    // 暴落カウント
    if (regimeState.current === 'crash' && previousRegime !== 'crash') {
      crashCount++
    }

    // 2. 収支処理（収入を現金に加算、支出を現金から減算、不足時は国債→株式から補填）
    const expense = plan.basicExpense + plan.extraExpense
    const cashFlowResult = processCashFlow(plan.income, expense, balances)
    balances = cashFlowResult.balances

    // 3. 資産の成長（利回り計算）
    // 国債のリターンを国債に加算
    const bondGain = balances.bonds * (regimeSettings.bondReturn / 100)
    balances.bonds += bondGain

    // 株式のリターンを計算（外貨建て比率を考慮）
    const baseStockReturn = getStockReturn(regimeState.current, regimeSettings)
    // 暴落年の実リターンを記録（暴落深さと回復期間の相関に使用）
    if (regimeState.current === 'crash') {
      regimeState = { ...regimeState, crashReturn: baseStockReturn }
    }
    const stockReturn = getEffectiveStockReturn(
      regimeState.current,
      baseStockReturn,
      foreignRatio
    )
    const stockGain = balances.stocks * stockReturn

    // 株式リターンがプラスで国債が上限未達の場合、国債に優先的に積立
    if (stockGain > 0 && balances.bonds < initialAssets.bondsLimit) {
      const bondsRoom = initialAssets.bondsLimit - balances.bonds
      const toBonds = Math.min(stockGain, bondsRoom)
      balances.bonds += toBonds
      balances.stocks += stockGain - toBonds
    } else {
      // マイナスまたは国債が上限以上の場合は株式に加算
      balances.stocks += stockGain
    }

    // 4. 年末リバランス（現金超過分を国債→株式へ）
    balances = rebalanceExcessCash(
      balances,
      initialAssets.cashLimit,
      initialAssets.bondsLimit
    )

    // 5. 年末の現金補充: 株式増減がプラスなら株式から、マイナスなら国債から
    const fromBonds = stockGain <= 0
    balances = replenishCash(balances, initialAssets.cashLimit, fromBonds, regimeSettings.withdrawalTaxRate)

    // 暴落期・戻り期中は収支を考慮して回復目標を調整
    const netIncome = plan.income - expense
    regimeState = adjustRecoveryTargetForCashFlow(regimeState, netIncome)

    // 6. 枯渇判定
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
