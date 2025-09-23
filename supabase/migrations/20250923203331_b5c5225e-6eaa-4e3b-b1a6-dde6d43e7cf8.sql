-- Insert sample product categories first
INSERT INTO categories (name, slug, description, color, is_active) VALUES
('Smartphones', 'smartphones', 'Latest smartphone reviews and recommendations', '#E91E63', true),
('Laptops', 'laptops', 'Laptop reviews and buying guides', '#3F51B5', true),
('Audio', 'audio', 'Headphones, speakers, and audio gear', '#FF9800', true),
('Gaming', 'gaming', 'Gaming accessories and hardware', '#4CAF50', true),
('Wearables', 'wearables', 'Smartwatches and fitness trackers', '#9C27B0', true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color;

-- Insert sample product reviews with affiliate data
DO $$
DECLARE
    admin_user_id uuid;
    mobile_category_id uuid;
    laptop_category_id uuid;
    audio_category_id uuid;
    gaming_category_id uuid;
    wearable_category_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- Get category IDs
    SELECT id INTO mobile_category_id FROM categories WHERE slug = 'smartphones' LIMIT 1;
    SELECT id INTO laptop_category_id FROM categories WHERE slug = 'laptops' LIMIT 1;
    SELECT id INTO audio_category_id FROM categories WHERE slug = 'audio' LIMIT 1;
    SELECT id INTO gaming_category_id FROM categories WHERE slug = 'gaming' LIMIT 1;
    SELECT id INTO wearable_category_id FROM categories WHERE slug = 'wearables' LIMIT 1;
    
    -- Insert iPhone 15 Pro Max review
    INSERT INTO content (
        title, slug, excerpt, content, featured_image, author_id, category_id, 
        content_type, status, is_featured, published_at, meta_title, meta_description, 
        views_count, likes_count, reading_time
    ) VALUES (
        'iPhone 15 Pro Max Review: The Ultimate Smartphone Experience',
        'iphone-15-pro-max-review-ultimate',
        'Apple''s flagship iPhone 15 Pro Max delivers exceptional performance with its titanium build, A17 Pro chip, and revolutionary camera system.',
        'The iPhone 15 Pro Max represents Apple''s most ambitious smartphone yet, featuring a stunning titanium construction that feels premium while reducing weight. The A17 Pro chip delivers blazing-fast performance for everything from gaming to professional video editing.

**Key Features:**
- 6.7-inch Super Retina XDR display
- A17 Pro chip with 6-core GPU  
- Pro camera system with 5x Telephoto
- Action Button replaces Ring/Silent switch
- USB-C connectivity
- Up to 29 hours video playback

**Performance:** The A17 Pro chip is a game-changer, offering desktop-class performance in a mobile device. Gaming performance is exceptional, and the new GPU handles intensive tasks with ease.

**Camera Excellence:** The camera system is where the iPhone 15 Pro Max truly shines. The new 5x telephoto lens provides incredible zoom capabilities, while the main camera captures stunning detail in all lighting conditions.

**Conclusion:** If you''re looking for the absolute best smartphone experience and don''t mind the premium price, the iPhone 15 Pro Max is unmatched.',
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        admin_user_id, mobile_category_id, 'review', 'published', true, 
        NOW() - INTERVAL '2 days', 'iPhone 15 Pro Max Review | Best Smartphone 2024',
        'Comprehensive review of the iPhone 15 Pro Max. Features, performance, camera quality, and more.',
        1250, 89, 8
    );

    -- Insert MacBook Pro review
    INSERT INTO content (
        title, slug, excerpt, content, featured_image, author_id, category_id, 
        content_type, status, is_featured, published_at, meta_title, meta_description, 
        views_count, likes_count, reading_time
    ) VALUES (
        'MacBook Pro 16-inch M3 Max: Creative Powerhouse Review',
        'macbook-pro-16-m3-max-review-powerhouse',
        'The MacBook Pro 16-inch with M3 Max chip redefines mobile workstation performance for creative professionals and power users.',
        'Apple''s MacBook Pro 16-inch with M3 Max is the ultimate laptop for creative professionals. With its incredible performance, stunning display, and all-day battery life, it sets new standards for mobile workstations.

**Technical Specifications:**
- M3 Max chip with 16-core CPU and 40-core GPU
- 16.2-inch Liquid Retina XDR display  
- Up to 128GB unified memory
- Up to 8TB SSD storage
- Six Thunderbolt 4 ports
- MagSafe 3 charging

**Performance Benchmarks:** The M3 Max chip delivers exceptional performance across all applications. Video editing in Final Cut Pro is smooth even with 8K footage, and 3D rendering times are significantly reduced.

**Display Quality:** The Liquid Retina XDR display offers incredible color accuracy and brightness, making it perfect for photo and video editing, design work, and content creation.

**Verdict:** This is the laptop to get if you need maximum performance for creative work. The price is high, but the capabilities justify the investment.',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        admin_user_id, laptop_category_id, 'review', 'published', true,
        NOW() - INTERVAL '1 day', 'MacBook Pro 16-inch M3 Max Review | Best Laptop for Creatives',
        'Complete review of the MacBook Pro 16-inch M3 Max. Performance, display, battery life, and more.',
        980, 67, 10
    );

    -- Insert Sony WH-1000XM5 review
    INSERT INTO content (
        title, slug, excerpt, content, featured_image, author_id, category_id, 
        content_type, status, is_featured, published_at, meta_title, meta_description, 
        views_count, likes_count, reading_time
    ) VALUES (
        'Sony WH-1000XM5: The Best Noise-Canceling Headphones',
        'sony-wh-1000xm5-best-noise-canceling',
        'Sony''s WH-1000XM5 headphones offer industry-leading noise cancellation, exceptional sound quality, and premium comfort.',
        'The Sony WH-1000XM5 represents the pinnacle of noise-canceling headphone technology. With improved drivers, better noise cancellation, and enhanced comfort, these headphones are perfect for travel, work, and everyday listening.

**Key Features:**
- Industry-leading noise cancellation
- 30-hour battery life
- Quick charge: 3 minutes for 3 hours playback
- Multipoint Bluetooth connection
- Touch controls and voice assistant support
- Lightweight design with premium materials

**Sound Quality:** The sound signature is well-balanced with clear highs, detailed mids, and controlled bass. The V1 chip processes sound in real-time for optimal audio quality.

**Noise Cancellation:** The adaptive noise cancellation is phenomenal, blocking out ambient noise effectively whether you''re on a plane, in a café, or at home.

**Conclusion:** For anyone seeking the best noise-canceling headphones, the WH-1000XM5 delivers on all fronts.',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
        admin_user_id, audio_category_id, 'review', 'published', false,
        NOW() - INTERVAL '3 days', 'Sony WH-1000XM5 Review | Best Noise Canceling Headphones',
        'Detailed review of Sony WH-1000XM5 headphones. Sound quality, noise cancellation, and more.',
        750, 45, 7
    );

END $$;