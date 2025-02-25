-- Up Migration
ALTER TABLE templates
    ADD COLUMN host_name text NOT NULL DEFAULT '',
    ADD CONSTRAINT templates_name_key UNIQUE (name);

-- Down Migration
-- DO NOT EXECUTE THIS UNLESS YOU NEED TO ROLLBACK
/*
ALTER TABLE templates
    DROP CONSTRAINT templates_name_key,
    DROP COLUMN host_name;
*/