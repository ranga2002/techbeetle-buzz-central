-- Fix search_path for notification functions
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION notify_category_followers_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION notify_category_followers_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;