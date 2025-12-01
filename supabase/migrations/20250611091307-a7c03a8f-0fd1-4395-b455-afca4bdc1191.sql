
-- Create enum types for better data integrity
CREATE TYPE public.content_type AS ENUM ('news', 'review', 'video', 'how_to', 'comparison');
CREATE TYPE public.content_status AS ENUM ('draft', 'pending', 'published', 'archived');
CREATE TYPE public.user_role AS ENUM ('admin', 'editor', 'author', 'user');
CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'rejected', 'spam');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content table (articles, reviews, videos, how-tos)
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  content_type content_type NOT NULL,
  status content_status DEFAULT 'draft',
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  reading_time INTEGER, -- in minutes
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content tags junction table
CREATE TABLE public.content_tags (
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

-- Reviews specific data
CREATE TABLE public.review_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  price DECIMAL(10,2),
  overall_rating DECIMAL(2,1) CHECK (overall_rating >= 0 AND overall_rating <= 5),
  pros TEXT[],
  cons TEXT[],
  specifications JSONB,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  status comment_status DEFAULT 'pending',
  parent_id UUID REFERENCES public.comments(id), -- for nested comments
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interactions (likes, bookmarks)
CREATE TABLE public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'like', 'bookmark', 'share'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id, interaction_type)
);

-- Newsletter subscriptions
CREATE TABLE public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Analytics table for tracking page views
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- RLS Policies for tags (public read, authenticated write)
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authors can create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for content
CREATE POLICY "Anyone can view published content" ON public.content FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can view own content" ON public.content FOR SELECT USING (author_id = auth.uid());
CREATE POLICY "Authors can create content" ON public.content FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update own content" ON public.content FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Editors can manage all content" ON public.content FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- RLS Policies for comments
CREATE POLICY "Anyone can view approved comments" ON public.comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Moderators can manage comments" ON public.comments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- RLS Policies for user interactions
CREATE POLICY "Users can view own interactions" ON public.user_interactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own interactions" ON public.user_interactions FOR ALL USING (user_id = auth.uid());

-- RLS Policies for review details
CREATE POLICY "Anyone can view review details" ON public.review_details FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.content 
    WHERE id = content_id AND status = 'published'
  )
);
CREATE POLICY "Authors can manage review details" ON public.review_details FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.content 
    WHERE id = content_id AND author_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- RLS Policies for analytics (admin only)
CREATE POLICY "Admins can view analytics" ON public.analytics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_content_status ON public.content(status);
CREATE INDEX idx_content_category ON public.content(category_id);
CREATE INDEX idx_content_author ON public.content(author_id);
CREATE INDEX idx_content_type ON public.content(content_type);
CREATE INDEX idx_content_published_at ON public.content(published_at DESC);
CREATE INDEX idx_comments_content ON public.comments(content_id);
CREATE INDEX idx_comments_status ON public.comments(status);
CREATE INDEX idx_user_interactions_user ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_content ON public.user_interactions(content_id);

-- Insert default categories
INSERT INTO public.categories (name, slug, description, color) VALUES
('Mobile', 'mobile', 'Latest smartphones and mobile technology', '#10B981'),
('Laptops', 'laptops', 'Laptop reviews and comparisons', '#3B82F6'),
('AI', 'ai', 'Artificial Intelligence and Machine Learning', '#8B5CF6'),
('Gadgets', 'gadgets', 'Cool gadgets and tech accessories', '#F59E0B'),
('Gaming', 'gaming', 'Gaming hardware and reviews', '#EF4444'),
('Apps', 'apps', 'Mobile and web applications', '#06B6D4'),
('Startups', 'startups', 'Tech startup news and funding', '#84CC16'),
('Reviews', 'reviews', 'In-depth product reviews', '#F97316');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update content views count
CREATE OR REPLACE FUNCTION public.increment_content_views(content_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.content 
  SET views_count = views_count + 1 
  WHERE id = content_id_param;
  
  INSERT INTO public.analytics (content_id, user_id, created_at)
  VALUES (content_id_param, auth.uid(), NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
