-- Adds the poster's phone number and widens the note to riders to 300 chars.
-- Both columns are nullable, so existing rides without them still load.

ALTER TABLE Rides ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE Rides ADD COLUMN IF NOT EXISTS note VARCHAR(300);
ALTER TABLE Rides ALTER COLUMN note TYPE VARCHAR(300);
