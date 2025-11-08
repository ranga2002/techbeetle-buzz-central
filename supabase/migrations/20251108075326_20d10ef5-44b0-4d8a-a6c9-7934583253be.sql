-- Create comment_likes table for tracking user likes on comments
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate likes
ALTER TABLE public.comment_likes 
ADD CONSTRAINT unique_user_comment_like UNIQUE (comment_id, user_id);

-- Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
CREATE POLICY "Anyone can view comment likes"
  ON public.comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like comments"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update comment likes count
CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();