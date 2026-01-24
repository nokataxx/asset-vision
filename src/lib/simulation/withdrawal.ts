import type { AssetType, WithdrawalPriority } from '@/types'

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
 * 優先順位に従って資産から取崩す
 */
export function withdraw(
  amount: number,
  balances: AssetBalances,
  priority: AssetType[]
): WithdrawalResult {
  let remaining = amount
  const newBalances = { ...balances }

  for (const assetType of priority) {
    if (remaining <= 0) break

    const available = newBalances[assetType]
    const withdrawal = Math.min(available, remaining)

    newBalances[assetType] = available - withdrawal
    remaining -= withdrawal
  }

  return {
    balances: newBalances,
    shortfall: remaining,
  }
}

/**
 * 収支に応じて資産を取崩しまたは積立
 * @param netIncome 純収入（収入 - 支出）。マイナスなら取崩し、プラスなら積立
 * @param balances 現在の資産残高
 * @param priority 取崩し時の優先順位
 * @param isCrash 暴落中かどうか（取崩し優先順位の選択に使用）
 * @param withdrawalPriority 取崩し優先順位設定
 */
export function processNetIncome(
  netIncome: number,
  balances: AssetBalances,
  withdrawalPriority: WithdrawalPriority,
  isCrash: boolean,
  limits?: { cashLimit: number; bondsLimit: number }
): WithdrawalResult {
  if (netIncome >= 0) {
    // 収支がプラス → 現金→国債→株式の順で上限を守って積立
    let remaining = netIncome
    const newBalances = { ...balances }

    if (limits) {
      // 1. 現金を上限まで
      const cashRoom = Math.max(0, limits.cashLimit - newBalances.cash)
      const toCash = Math.min(remaining, cashRoom)
      newBalances.cash += toCash
      remaining -= toCash

      // 2. 国債を上限まで
      const bondsRoom = Math.max(0, limits.bondsLimit - newBalances.bonds)
      const toBonds = Math.min(remaining, bondsRoom)
      newBalances.bonds += toBonds
      remaining -= toBonds

      // 3. 残りは株式へ
      newBalances.stocks += remaining
    } else {
      // 上限がない場合は現金に積立（後方互換性のため）
      newBalances.cash += netIncome
    }

    return {
      balances: newBalances,
      shortfall: 0,
    }
  }

  // 収支がマイナス → 取崩し
  const priority = isCrash ? withdrawalPriority.crash : withdrawalPriority.normal
  return withdraw(-netIncome, balances, priority)
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
