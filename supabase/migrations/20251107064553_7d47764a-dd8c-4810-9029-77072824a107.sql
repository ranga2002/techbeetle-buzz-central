-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment_reply', 'new_review', 'site_update', 'followed_category')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create category follows table
CREATE TABLE IF NOT EXISTS public.category_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Create site settings table for admin updates
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Category follows policies
CREATE POLICY "Users can view own follows"
  ON public.category_follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own follows"
  ON public.category_follows FOR ALL
  USING (auth.uid() = user_id);

-- Site settings policies
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (is_admin_user());

-- Function to create notification for comment reply
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_user_id UUID;
  content_title TEXT;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_user_id
    FROM comments
    WHERE id = NEW.parent_id;
    
    SELECT title INTO content_title
    FROM content
    WHERE id = NEW.content_id;
    
    IF parent_user_id IS NOT NULL AND parent_user_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        parent_user_id,
        'comment_reply',
        'New reply to your comment',
        'Someone replied to your comment on "' || content_title || '"',
        '/news/' || NEW.content_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comment replies
DROP TRIGGER IF EXISTS on_comment_reply ON comments;
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_reply();

-- Function to notify followers of new content in category (for INSERT)
CREATE OR REPLACE FUNCTION notify_category_followers_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.content_type = 'review' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT 
      cf.user_id,
      'new_review',
      'New review in ' || c.name,
      'New review: ' || NEW.title,
      '/reviews/' || NEW.slug
    FROM category_follows cf
    JOIN categories c ON c.id = cf.category_id
    WHERE cf.category_id = NEW.category_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify followers of new content in category (for UPDATE)
CREATE OR REPLACE FUNCTION notify_category_followers_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.content_type = 'review' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT 
      cf.user_id,
      'new_review',
      'New review in ' || c.name,
      'New review: ' || NEW.title,
      '/reviews/' || NEW.slug
    FROM category_follows cf
    JOIN categories c ON c.id = cf.category_id
    WHERE cf.category_id = NEW.category_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for new content notifications
DROP TRIGGER IF EXISTS on_new_content_insert ON content;
CREATE TRIGGER on_new_content_insert
  AFTER INSERT ON content
  FOR EACH ROW
  EXECUTE FUNCTION notify_category_followers_insert();

DROP TRIGGER IF EXISTS on_new_content_update ON content;
CREATE TRIGGER on_new_content_update
  AFTER UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION notify_category_followers_update();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_category_follows_user_id ON category_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_category_follows_category_id ON category_follows(category_id);