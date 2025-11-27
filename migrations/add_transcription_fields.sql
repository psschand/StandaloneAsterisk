-- Add transcript, summary, and transcription_status columns to CDRs table
ALTER TABLE cdrs 
ADD COLUMN transcript TEXT NULL,
ADD COLUMN summary TEXT NULL,
ADD COLUMN transcription_status VARCHAR(20) DEFAULT 'pending';

-- Create index for faster queries on transcription status
CREATE INDEX idx_cdrs_transcription_status ON cdrs(transcription_status);

-- Update existing records with recordings to pending status
UPDATE cdrs 
SET transcription_status = 'pending' 
WHERE recording_url IS NOT NULL 
  AND recording_url != '' 
  AND (transcription_status IS NULL OR transcription_status = '');
