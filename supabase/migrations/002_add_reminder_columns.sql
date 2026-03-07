-- Migration: Add reminder tracking columns to citas table
-- Run this in Supabase SQL Editor

-- Add columns to track when reminders were sent (prevents duplicate sends)
ALTER TABLE citas ADD COLUMN IF NOT EXISTS recordatorio_24h TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS recordatorio_2h TIMESTAMPTZ DEFAULT NULL;

-- Add index to speed up reminder queries  
CREATE INDEX IF NOT EXISTS idx_citas_recordatorio_24h ON citas(recordatorio_24h) WHERE recordatorio_24h IS NULL;
CREATE INDEX IF NOT EXISTS idx_citas_recordatorio_2h ON citas(recordatorio_2h) WHERE recordatorio_2h IS NULL;
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora_estado ON citas(fecha_hora, estado);
