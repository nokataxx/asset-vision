-- Asset Vision Database Schema
-- Run this SQL in Supabase SQL Editor

-- gen_random_uuid() is built-in to PostgreSQL 13+, no extension needed

-- ============================================
-- User Data Table (ユーザー設定データ)
-- ============================================
-- Stores the complete simulation configuration for each user
CREATE TABLE IF NOT EXISTS user_simulation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Asset data (資産データ)
  assets JSONB NOT NULL DEFAULT '{
    "stocks": [],
    "bonds": 0,
    "cash": 0,
    "age": 40
  }',

  -- Income/Expense plan (収支計画)
  income_expense_plan JSONB NOT NULL DEFAULT '{
    "duration": 30,
    "baseIncome": 500,
    "baseExpense": 400,
    "retirementAge": 65,
    "retirementIncome": 200,
    "retirementExpense": 300
  }',

  -- Annual plans (年次計画)
  annual_plans JSONB NOT NULL DEFAULT '[]',

  -- Regime settings (レジーム設定)
  regime_settings JSONB NOT NULL DEFAULT '{
    "normalReturn": 8,
    "normalStdDev": 15,
    "crashReturn": -30,
    "crashStdDev": 25,
    "recoveryReturn": 15,
    "recoveryStdDev": 20,
    "crashProbability": 5,
    "recoveryYears": 3
  }',

  -- Withdrawal priority (取り崩し優先順位)
  withdrawal_priority JSONB NOT NULL DEFAULT '{
    "normalOrder": ["cash", "bonds", "stocks"],
    "crashOrder": ["cash", "bonds", "stocks"]
  }',

  -- Scenarios (シナリオ)
  scenarios JSONB NOT NULL DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_simulation_data_user_id
  ON user_simulation_data(user_id);

-- Ensure one record per user (upsert pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_simulation_data_user_unique
  ON user_simulation_data(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Enable RLS
ALTER TABLE user_simulation_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON user_simulation_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data" ON user_simulation_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON user_simulation_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own data
CREATE POLICY "Users can delete own data" ON user_simulation_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Updated At Trigger
-- ============================================
-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_user_simulation_data_updated_at ON user_simulation_data;
CREATE TRIGGER trigger_user_simulation_data_updated_at
  BEFORE UPDATE ON user_simulation_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
