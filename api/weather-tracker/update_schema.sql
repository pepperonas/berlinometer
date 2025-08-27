-- Update existing weather_data table to support indoor/outdoor sensors
-- This script adds new columns to the existing table

ALTER TABLE weather_data 
ADD COLUMN temperature_indoor DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN humidity_indoor DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN pressure_indoor DECIMAL(7,2) DEFAULT NULL,
ADD COLUMN temperature_outdoor DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN humidity_outdoor DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN sensor_indoor VARCHAR(20) DEFAULT NULL,
ADD COLUMN sensor_outdoor VARCHAR(20) DEFAULT NULL;

-- Update existing records to populate indoor columns from primary columns
UPDATE weather_data 
SET 
    temperature_indoor = temperature,
    humidity_indoor = humidity,
    pressure_indoor = pressure,
    sensor_indoor = 'ENV3'
WHERE temperature_indoor IS NULL;