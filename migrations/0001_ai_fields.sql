-- Create enum type for transcription status
DO $$ BEGIN
    CREATE TYPE transcription_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Up Migration
ALTER TABLE episodes
    ADD COLUMN transcript text,
    ADD COLUMN transcription_status transcription_status DEFAULT 'pending',
    ADD COLUMN show_notes text,
    ADD COLUMN ai_generated_tags text[] DEFAULT '{}',
    ADD COLUMN ai_generated_summary text,
    ADD COLUMN title_suggestions text[] DEFAULT '{}';

-- Down Migration
-- DO NOT EXECUTE THIS UNLESS YOU NEED TO ROLLBACK
/*
ALTER TABLE episodes
    DROP COLUMN transcript,
    DROP COLUMN transcription_status,
    DROP COLUMN show_notes,
    DROP COLUMN ai_generated_tags,
    DROP COLUMN ai_generated_summary,
    DROP COLUMN title_suggestions;

DROP TYPE IF EXISTS transcription_status;
*/
