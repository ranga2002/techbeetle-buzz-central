-- 1. Fix analytics table - require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Authenticated users can insert own analytics" ON public.analytics;

CREATE POLICY "Authenticated users can insert own analytics"
ON public.analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 2. Fix content_tags RLS policies (currently has RLS enabled but no policies)
-- Allow public to view tags for published content
CREATE POLICY "Anyone can view content tags for published content"
ON public.content_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.content
    WHERE content.id = content_tags.content_id
    AND content.status = 'published'
  )
);

-- Allow authors and admins to manage content tags
CREATE POLICY "Authors can manage content tags"
ON public.content_tags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.content
    WHERE content.id = content_tags.content_id
    AND content.author_id = auth.uid()
  )
  OR public.is_admin_user(auth.uid())
);

-- 3. Fix function search_path for get_average_price
CREATE OR REPLACE FUNCTION public.get_average_price(content_id_param uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT AVG(price) FROM public.purchase_links 
  WHERE content_id = content_id_param AND price IS NOT NULL;
$$;

-- 4. Fix increment_content_views to have proper search_path
CREATE OR REPLACE FUNCTION public.increment_content_views(content_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.content 
  SET views_count = views_count + 1 
  WHERE id = content_id_param;
  
  INSERT INTO public.analytics (content_id, user_id, created_at)
  VALUES (content_id_param, auth.uid(), NOW());
END;
$$;

-- 5. Fix handle_new_user to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$;

-- 6. Fix get_current_user_role to have proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 7. Fix has_role to have proper search_path
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role = required_role
  );
$$;

-- 8. Fix is_admin_user to have proper search_path
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'editor')
  );
$$;

-- 9. Fix promote_to_admin to have proper search_path
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = user_email
  );
$$;