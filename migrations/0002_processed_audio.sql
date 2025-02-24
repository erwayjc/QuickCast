-- Up Migration
ALTER TABLE episodes
    ADD COLUMN processed_audio_url text;

-- Down Migration
-- DO NOT EXECUTE THIS UNLESS YOU NEED TO ROLLBACK
/*
ALTER TABLE episodes
    DROP COLUMN processed_audio_url;
*/
