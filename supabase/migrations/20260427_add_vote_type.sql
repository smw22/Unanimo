-- Add vote_type column to votes table
ALTER TABLE votes ADD COLUMN vote_type TEXT DEFAULT 'yes' CHECK (vote_type IN ('yes', 'no'));

-- Create index for faster filtering by vote_type
CREATE INDEX idx_votes_vote_type ON votes(vote_type);
