-- Rename table from user_simulation_data to asset_simulation_data

ALTER TABLE user_simulation_data RENAME TO asset_simulation_data;

-- Rename indexes
ALTER INDEX idx_user_simulation_data_user_id RENAME TO idx_asset_simulation_data_user_id;
ALTER INDEX idx_user_simulation_data_user_unique RENAME TO idx_asset_simulation_data_user_unique;

-- Rename trigger
ALTER TRIGGER trigger_user_simulation_data_updated_at ON asset_simulation_data
  RENAME TO trigger_asset_simulation_data_updated_at;
