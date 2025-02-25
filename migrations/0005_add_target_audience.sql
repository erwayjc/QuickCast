-- Up Migration
ALTER TABLE templates
    ADD COLUMN target_audience text NOT NULL DEFAULT '';

-- Down Migration
-- DO NOT EXECUTE THIS UNLESS YOU NEED TO ROLLBACK
/*
ALTER TABLE templates
    DROP COLUMN target_audience;
*/