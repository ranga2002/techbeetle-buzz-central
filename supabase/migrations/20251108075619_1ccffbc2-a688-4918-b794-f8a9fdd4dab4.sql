-- Create bookmarks table for saving articles
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_content_id ON public.bookmarks(content_id);

-- Create newsletter_queue table for managing newsletter sends
CREATE TABLE IF NOT EXISTS public.newsletter_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'sent',
  content_ids UUID[] NOT NULL
);

-- Enable RLS
ALTER TABLE public.newsletter_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for newsletter_queue (admin only)
CREATE POLICY "Admins can view newsletter queue"
  ON public.newsletter_queue FOR SELECT
  USING (is_admin_user());

CREATE POLICY "System can manage newsletter queue"
  ON public.newsletter_queue FOR ALL
  USING (true);