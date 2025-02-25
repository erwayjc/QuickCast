-- Up Migration
ALTER TABLE episodes
    ADD COLUMN template_id integer REFERENCES templates(id);

-- Down Migration
-- DO NOT EXECUTE THIS UNLESS YOU NEED TO ROLLBACK
/*
ALTER TABLE episodes
    DROP COLUMN template_id;
*/
