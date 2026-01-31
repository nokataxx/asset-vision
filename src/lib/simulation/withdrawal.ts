export interface AssetBalances {
  stocks: number
  bonds: number
  cash: number
}

export interface WithdrawalResult {
  balances: AssetBalances
  shortfall: number // 不足額（資産が足りなかった場合）
}

/**
 * 収支を現金で処理し、マイナス時は国債→株式から補填
 * @param income 収入
 * @param expense 支出
 * @param balances 現在の資産残高
 */
export function processCashFlow(
  income: number,
  expense: number,
  balances: AssetBalances
): WithdrawalResult {
  const newBalances = { ...balances }

  // 1. 収入を現金に加算
  newBalances.cash += income

  // 2. 支出を現金から減算
  newBalances.cash -= expense

  // 3. 現金がマイナスなら国債→株式の順で補填
  let shortfall = 0
  if (newBalances.cash < 0) {
    const deficit = -newBalances.cash
    newBalances.cash = 0

    // 国債から補填
    const fromBonds = Math.min(newBalances.bonds, deficit)
    newBalances.bonds -= fromBonds
    let remaining = deficit - fromBonds

    // 国債で足りなければ株式から補填
    if (remaining > 0) {
      const fromStocks = Math.min(newBalances.stocks, remaining)
      newBalances.stocks -= fromStocks
      remaining -= fromStocks
    }

    shortfall = remaining
  }

  return {
    balances: newBalances,
    shortfall,
  }
}

/**
 * 現金の超過分を国債→株式にリバランス
 * @param balances 現在の資産残高
 * @param cashLimit 現金の上限
 * @param bondsLimit 国債の上限
 */
export function rebalanceExcessCash(
  balances: AssetBalances,
  cashLimit: number,
  bondsLimit: number
): AssetBalances {
  const newBalances = { ...balances }

  // 現金が上限を超えている場合
  if (newBalances.cash > cashLimit) {
    const excess = newBalances.cash - cashLimit
    newBalances.cash = cashLimit

    // 国債が上限に達していなければ国債へ
    const bondsRoom = Math.max(0, bondsLimit - newBalances.bonds)
    const toBonds = Math.min(excess, bondsRoom)
    newBalances.bonds += toBonds

    // 残りは株式へ
    const toStocks = excess - toBonds
    newBalances.stocks += toStocks
  }

  return newBalances
}

/**
 * 現金が上限未満の場合、国債または株式から補填
 * @param balances 現在の資産残高
 * @param cashLimit 現金の上限
 * @param fromBonds trueなら国債から、falseなら株式から優先的に補填
 */
export function replenishCash(
  balances: AssetBalances,
  cashLimit: number,
  fromBonds: boolean,
  taxRate: number = 0 // 取崩し時税率（0-100の%）
): AssetBalances {
  const newBalances = { ...balances }
  const taxMultiplier = 1 + taxRate / 100 // 例: 税率20%なら1.2

  // 現金が上限未満の場合
  if (newBalances.cash < cashLimit) {
    const deficit = cashLimit - newBalances.cash

    if (fromBonds) {
      // 国債から優先的に補填（税金分を余分に取り崩す）
      const neededFromBonds = Math.min(newBalances.bonds, deficit * taxMultiplier)
      const actualToCash = neededFromBonds / taxMultiplier
      newBalances.bonds -= neededFromBonds
      newBalances.cash += actualToCash

      // 国債で足りなければ株式から
      const remaining = deficit - actualToCash
      if (remaining > 0) {
        const neededFromStocks = Math.min(newBalances.stocks, remaining * taxMultiplier)
        const actualFromStocks = neededFromStocks / taxMultiplier
        newBalances.stocks -= neededFromStocks
        newBalances.cash += actualFromStocks
      }
    } else {
      // 株式から優先的に補填（税金分を余分に取り崩す）
      const neededFromStocks = Math.min(newBalances.stocks, deficit * taxMultiplier)
      const actualToCash = neededFromStocks / taxMultiplier
      newBalances.stocks -= neededFromStocks
      newBalances.cash += actualToCash

      // 株式で足りなければ国債から
      const remaining = deficit - actualToCash
      if (remaining > 0) {
        const neededFromBonds = Math.min(newBalances.bonds, remaining * taxMultiplier)
        const actualFromBonds = neededFromBonds / taxMultiplier
        newBalances.bonds -= neededFromBonds
        newBalances.cash += actualFromBonds
      }
    }
  }

  return newBalances
}

/**
 * 総資産を計算
 */
export function calculateTotalAssets(balances: AssetBalances): number {
  return balances.stocks + balances.bonds + balances.cash
}

/**
 * 資産が枯渇しているかどうかを判定
 */
export function isDepleted(balances: AssetBalances): boolean {
  return calculateTotalAssets(balances) <= 0
}
