-- Run this in your Supabase SQL editor to create the saved_articles table

CREATE TABLE IF NOT EXISTS saved_articles (
  id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  source_name TEXT NOT NULL,
  author TEXT DEFAULT 'unknown',
  published_at TIMESTAMPTZ NOT NULL,
  tags TEXT[] DEFAULT '{}',
  score INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  image_url TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  PRIMARY KEY (id, device_id)
);

-- Index for fast device lookups
CREATE INDEX IF NOT EXISTS idx_saved_articles_device_id ON saved_articles (device_id);

-- Index for sorting by saved date
CREATE INDEX IF NOT EXISTS idx_saved_articles_saved_at ON saved_articles (device_id, saved_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since we use device_id, not auth)
CREATE POLICY "Allow all operations" ON saved_articles
  FOR ALL
  USING (true)
  WITH CHECK (true);
