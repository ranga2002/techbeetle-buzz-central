
-- Add purchase links table for storing multiple purchase options per product
CREATE TABLE public.purchase_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  retailer_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  availability_status TEXT DEFAULT 'in_stock',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add product specifications table for detailed tech specs
CREATE TABLE public.product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  spec_category TEXT NOT NULL, -- 'display', 'performance', 'camera', etc.
  spec_name TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  spec_unit TEXT, -- 'GB', 'MHz', 'hours', etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add content sources table to track where content was sourced from
CREATE TABLE public.content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT DEFAULT 'review', -- 'review', 'specs', 'news', 'price'
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.purchase_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for purchase_links
CREATE POLICY "Anyone can view purchase links" ON public.purchase_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.content 
      WHERE id = content_id AND status = 'published'
    )
  );

CREATE POLICY "Authors can manage purchase links" ON public.purchase_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.content 
      WHERE id = content_id AND author_id = auth.uid()
    ) OR is_admin_user()
  );

-- RLS policies for product_specs
CREATE POLICY "Anyone can view product specs" ON public.product_specs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.content 
      WHERE id = content_id AND status = 'published'
    )
  );

CREATE POLICY "Authors can manage product specs" ON public.product_specs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.content 
      WHERE id = content_id AND author_id = auth.uid()
    ) OR is_admin_user()
  );

-- RLS policies for content_sources (admin only)
CREATE POLICY "Admins can view content sources" ON public.content_sources
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can manage content sources" ON public.content_sources
  FOR ALL USING (is_admin_user());

-- Create indexes for performance
CREATE INDEX idx_purchase_links_content ON public.purchase_links(content_id);
CREATE INDEX idx_product_specs_content ON public.product_specs(content_id);
CREATE INDEX idx_product_specs_category ON public.product_specs(spec_category);
CREATE INDEX idx_content_sources_content ON public.content_sources(content_id);

-- Function to calculate average price across retailers
CREATE OR REPLACE FUNCTION public.get_average_price(content_id_param UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
STABLE
AS $$
  SELECT AVG(price) FROM public.purchase_links 
  WHERE content_id = content_id_param AND price IS NOT NULL;
$$;

-- Insert some sample tech categories if they don't exist
INSERT INTO public.categories (name, slug, description, color) VALUES
  ('Smartphones', 'smartphones', 'Latest smartphone reviews and comparisons', '#10B981'),
  ('Headphones', 'headphones', 'Audio gear and headphone reviews', '#8B5CF6'),
  ('Drones', 'drones', 'Drone reviews and flying tech', '#F59E0B'),
  ('Smart Home', 'smart-home', 'Smart home devices and IoT reviews', '#06B6D4'),
  ('Wearables', 'wearables', 'Smartwatches and fitness trackers', '#EF4444')
ON CONFLICT (slug) DO NOTHING;
