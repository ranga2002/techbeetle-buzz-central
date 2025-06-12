
-- Drop ALL policies that might depend on the role column
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view published content" ON content;
DROP POLICY IF EXISTS "Authors can view own content" ON content;
DROP POLICY IF EXISTS "Authors can create content" ON content;
DROP POLICY IF EXISTS "Authors can update own content" ON content;
DROP POLICY IF EXISTS "Editors can manage all content" ON content;
DROP POLICY IF EXISTS "Anyone can view approved comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Moderators can manage comments" ON comments;
DROP POLICY IF EXISTS "Anyone can view review details" ON review_details;
DROP POLICY IF EXISTS "Authors can manage review details" ON review_details;
DROP POLICY IF EXISTS "Users can view own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can manage own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Admins can view analytics" ON analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics;

-- Now update the role column type
ALTER TABLE profiles ALTER COLUMN role TYPE text;
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('user', 'author', 'editor', 'admin');
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Recreate all RLS policies with proper role checks
-- Profile policies
CREATE POLICY "Anyone can view active profiles" ON profiles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Content policies
CREATE POLICY "Anyone can view published content" ON content
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can view own content" ON content
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Staff can view all content" ON content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'editor', 'author')
    )
  );

CREATE POLICY "Authors can create content" ON content
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'editor', 'author')
    )
  );

CREATE POLICY "Authors can update own content" ON content
  FOR UPDATE USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete content" ON content
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Category policies
CREATE POLICY "Anyone can view active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'editor')
    )
  );

-- Comment policies
CREATE POLICY "Anyone can view approved comments" ON comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Moderators can manage comments" ON comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'editor')
    )
  );

-- Review details policies
CREATE POLICY "Anyone can view review details" ON review_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content 
      WHERE id = content_id AND status = 'published'
    )
  );

CREATE POLICY "Authors can manage review details" ON review_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM content 
      WHERE id = content_id AND author_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- User interactions policies
CREATE POLICY "Users can view own interactions" ON user_interactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own interactions" ON user_interactions
  FOR ALL USING (user_id = auth.uid());

-- Analytics policies
CREATE POLICY "Admins can view analytics" ON analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert analytics" ON analytics
  FOR INSERT WITH CHECK (true);

-- Create helper functions
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role user_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'editor')
  );
$$;

-- Create a function to promote a user to admin (for initial setup)
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles 
  SET role = 'admin' 
  WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = user_email
  );
$$;
