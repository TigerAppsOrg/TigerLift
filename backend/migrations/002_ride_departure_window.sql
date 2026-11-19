-- Adds an optional departure window to rides ("leave between 4:00 and
-- 5:30PM"). Both columns are nullable, so existing rides without a window
-- still load.

ALTER TABLE Rides ADD COLUMN IF NOT EXISTS departure_start TIMESTAMP;
ALTER TABLE Rides ADD COLUMN IF NOT EXISTS departure_end TIMESTAMP;
