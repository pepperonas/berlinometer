-- SQL Script to add pressure column to existing weather_data table
-- Run this on your database to add pressure support

-- Add the pressure column to the existing table
ALTER TABLE weather_data 
ADD COLUMN pressure DECIMAL(7,2) DEFAULT NULL 
AFTER humidity;

-- Verify the table structure
DESCRIBE weather_data;

-- Optional: Check if the column was added successfully
SHOW COLUMNS FROM weather_data;