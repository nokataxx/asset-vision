-- Asset Vision Database Schema
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- User Data Table (ユーザー設定データ)
-- ============================================
-- Stores the complete simulation configuration for each user
CREATE TABLE IF NOT EXISTS user_simulation_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ============================================
-- Optional: Simulation History Table
-- ============================================
-- Stores simulation results history (optional feature)
CREATE TABLE IF NOT EXISTS simulation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Simulation input snapshot
  input_snapshot JSONB NOT NULL,

  -- Simulation result
  result_summary JSONB NOT NULL,

  -- Metadata
  simulation_type VARCHAR(20) NOT NULL DEFAULT 'single', -- 'single' or 'comparison'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for history lookups
CREATE INDEX IF NOT EXISTS idx_simulation_history_user_id
  ON simulation_history(user_id);

CREATE INDEX IF NOT EXISTS idx_simulation_history_created_at
  ON simulation_history(created_at DESC);

-- Enable RLS for history table
ALTER TABLE simulation_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for history
CREATE POLICY "Users can view own history" ON simulation_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON simulation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON simulation_history
  FOR DELETE USING (auth.uid() = user_id);
