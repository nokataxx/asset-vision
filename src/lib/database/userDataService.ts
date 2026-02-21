import { supabase } from '@/lib/supabase'
import type {
  Assets,
  StockFund,
  IncomeExpensePlan,
  AnnualPlan,
  RegimeSettings,
} from '@/types'
import { findClosestPreset } from '@/data/stock-fund-presets'

// Database row type
interface UserSimulationDataRow {
  id: string
  user_id: string
  assets: Assets
  income_expense_plan: IncomeExpensePlan
  annual_plans: AnnualPlan[]
  regime_settings: RegimeSettings
  created_at: string
  updated_at: string
}

// Application data type
export interface UserSimulationData {
  assets: Assets
  incomeExpensePlan: IncomeExpensePlan
  annualPlans: AnnualPlan[]
  regimeSettings: RegimeSettings
}

/**
 * Load user simulation data from database
 */
export async function loadUserData(userId: string): Promise<UserSimulationData | null> {
  const { data, error } = await supabase
    .from('asset_simulation_data')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No data found for user
      return null
    }
    console.error('Error loading user data:', error)
    throw error
  }

  const row = data as UserSimulationDataRow
  return migrateUserSimulationData({
    assets: row.assets,
    incomeExpensePlan: row.income_expense_plan,
    annualPlans: row.annual_plans,
    regimeSettings: row.regime_settings,
  })
}

/**
 * Save user simulation data to database (upsert)
 */
export async function saveUserData(
  userId: string,
  data: UserSimulationData
): Promise<void> {
  const { error } = await supabase
    .from('asset_simulation_data')
    .upsert(
      {
        user_id: userId,
        assets: data.assets,
        income_expense_plan: data.incomeExpensePlan,
        annual_plans: data.annualPlans,
        regime_settings: data.regimeSettings,
      },
      {
        onConflict: 'user_id',
      }
    )

  if (error) {
    console.error('Error saving user data:', error)
    throw error
  }
}

/**
 * Delete user simulation data
 */
export async function deleteUserData(userId: string): Promise<void> {
  const { error } = await supabase
    .from('asset_simulation_data')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting user data:', error)
    throw error
  }
}

// ============================================
// Data migration: old format (stocks + foreignRatio) -> new format (stockFunds[])
// ============================================

interface OldAssets {
  stocks: number
  foreignRatio: number
  bonds: number
  cash: number
  cashLimit: number
  bondsLimit: number
  age: number
}

function generateFundId(): string {
  return `fund-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Migrate old Assets format to new stockFunds format */
export function migrateAssets(data: Record<string, unknown>): Assets {
  // Already new format
  if ('stockFunds' in data && Array.isArray(data.stockFunds)) {
    return data as unknown as Assets
  }

  // Old format: has stocks and foreignRatio fields
  if ('stocks' in data && !('stockFunds' in data)) {
    const old = data as unknown as OldAssets
    const stockFunds: StockFund[] = []

    if (old.stocks > 0) {
      const preset = findClosestPreset(old.foreignRatio ?? 0)
      stockFunds.push({
        id: generateFundId(),
        presetId: preset.id,
        label: preset.label,
        amount: old.stocks,
        foreignRatio: old.foreignRatio ?? 0,
      })
    }

    return {
      stockFunds,
      bonds: old.bonds ?? 0,
      cash: old.cash ?? 0,
      cashLimit: old.cashLimit ?? 500,
      bondsLimit: old.bondsLimit ?? 1000,
      age: old.age ?? 30,
    }
  }

  return data as unknown as Assets
}

function migrateUserSimulationData(data: UserSimulationData): UserSimulationData {
  return {
    ...data,
    assets: migrateAssets(data.assets as unknown as Record<string, unknown>),
  }
}

// ============================================
// LocalStorage fallback for non-logged-in users
// ============================================

const LOCAL_STORAGE_KEY = 'asset-vision-data'

/**
 * Load data from localStorage
 */
export function loadLocalData(): UserSimulationData | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as UserSimulationData
    return migrateUserSimulationData(parsed)
  } catch (error) {
    console.error('Error loading local data:', error)
    return null
  }
}

/**
 * Save data to localStorage
 */
export function saveLocalData(data: UserSimulationData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving local data:', error)
  }
}

/**
 * Clear localStorage data
 */
export function clearLocalData(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}

/**
 * Migrate local data to database when user logs in
 */
export async function migrateLocalDataToDatabase(userId: string): Promise<boolean> {
  const localData = loadLocalData()
  if (!localData) return false

  try {
    // Check if user already has data in database
    const existingData = await loadUserData(userId)
    if (existingData) {
      // User already has data, don't overwrite
      return false
    }

    // Save local data to database
    await saveUserData(userId, localData)
    // Clear local storage after successful migration
    clearLocalData()
    return true
  } catch (error) {
    console.error('Error migrating local data:', error)
    return false
  }
}
