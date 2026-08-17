-- Commissioner's board: a running feed of posts from the league admin, shown
-- beside the homepage headline once the season is under way. Each post is
-- text with at most one piece of media attached (a YouTube video or an
-- uploaded photo).

CREATE TABLE IF NOT EXISTS commissioner_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  body TEXT NOT NULL,
  media_type VARCHAR(10) NOT NULL DEFAULT 'none'
    CHECK (media_type IN ('none', 'youtube', 'image')),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissioner_posts_created
  ON commissioner_posts(created_at DESC);

DROP TRIGGER IF EXISTS update_commissioner_posts_updated_at ON commissioner_posts;
CREATE TRIGGER update_commissioner_posts_updated_at BEFORE UPDATE ON commissioner_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE commissioner_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read" ON commissioner_posts;
CREATE POLICY "public read" ON commissioner_posts FOR SELECT USING (true);
