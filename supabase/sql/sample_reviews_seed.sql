-- Seed script: realistic dummy review data sourced from real-world launches
-- Run inside the project database (e.g., supabase db remote commit -f supabase/sql/sample_reviews_seed.sql)

DO $$
DECLARE
    admin_user_id uuid;
    smartphone_category_id uuid;
    laptop_category_id uuid;
    camera_category_id uuid;
    wearables_category_id uuid;
    audio_category_id uuid;
    gaming_category_id uuid;
    drone_category_id uuid;
    tablet_category_id uuid;
    smart_home_category_id uuid;
    galaxy_content_id uuid;
    xps_content_id uuid;
    alpha_content_id uuid;
    watch_content_id uuid;
    qc_earbuds_content_id uuid;
    ally_content_id uuid;
    drone_content_id uuid;
    tablet_content_id uuid;
    sonos_content_id uuid;
    nothing_content_id uuid;
BEGIN
    -- Find any admin/editor to own the seeded reviews
    SELECT id
    INTO admin_user_id
    FROM profiles
    WHERE role IN ('admin', 'editor')
    ORDER BY created_at
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'No admin/editor profile available to seed reviews. Please create one first.';
    END IF;

    -- Ensure categories exist (upsert by slug)
    INSERT INTO categories (name, slug, description, color, is_active)
    VALUES
        ('Smartphones', 'smartphones', 'Latest smartphone reviews and comparisons', '#0EA5E9', true),
        ('Laptops', 'laptops', 'Laptop reviews and buying guides', '#6366F1', true),
        ('Cameras', 'cameras', 'Mirrorless and DSLR reviews', '#F97316', true),
        ('Wearables', 'wearables', 'Smartwatches, fitness bands, and health tech', '#22C55E', true),
        ('Audio', 'audio', 'Headphones, earbuds, and portable speakers', '#F59E0B', true),
        ('Gaming', 'gaming', 'Consoles, handhelds, and PC peripherals', '#A855F7', true),
        ('Drones', 'drones', 'Consumer and prosumer drones', '#38BDF8', true),
        ('Tablets', 'tablets', 'Tablets and 2-in-1 detachables', '#F472B6', true),
        ('Smart Home', 'smart-home', 'Home theater and connected living reviews', '#14B8A6', true)
    ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
          color = EXCLUDED.color,
          is_active = EXCLUDED.is_active;

    SELECT id INTO smartphone_category_id FROM categories WHERE slug = 'smartphones';
    SELECT id INTO laptop_category_id FROM categories WHERE slug = 'laptops';
    SELECT id INTO camera_category_id FROM categories WHERE slug = 'cameras';
    SELECT id INTO wearables_category_id FROM categories WHERE slug = 'wearables';
    SELECT id INTO audio_category_id FROM categories WHERE slug = 'audio';
    SELECT id INTO gaming_category_id FROM categories WHERE slug = 'gaming';
    SELECT id INTO drone_category_id FROM categories WHERE slug = 'drones';
    SELECT id INTO tablet_category_id FROM categories WHERE slug = 'tablets';
    SELECT id INTO smart_home_category_id FROM categories WHERE slug = 'smart-home';

    --------------------------------------------------------------------------
    -- Review #1: Samsung Galaxy S25 Ultra (source: TechRadar, Android Central)
    --------------------------------------------------------------------------
    INSERT INTO content (
        title, slug, excerpt, content, featured_image,
        content_type, status, author_id, category_id,
        is_featured, views_count, likes_count,
        reading_time, meta_title, meta_description,
        published_at
    ) VALUES (
        'Samsung Galaxy S25 Ultra Review: AI-Aware Superphone',
        'samsung-galaxy-s25-ultra-review-ai-aware-superphone',
        'Galaxy S25 Ultra refines Samsung''s 200MP system, adds Gemini Nano on-device AI, and keeps the note-worthy S Pen.',
        $review$
    Samsung's 2025 flagship leans heavily into practical AI. Galaxy AI shortcuts now run on the Snapdragon 8 Elite variant, so on-device transcription, Circle to Search, and Instant Slow-Mo work even with spotty LTE. The armor aluminum rails and matte Gorilla Armor glass resist scuffs better than last year, and the titanium gray color we tested barely picked up fingerprints.

    **Design & Display**
    The 6.9-inch QHD+ AMOLED 2X panel peaks at 2,750 nits outdoors and finally supports Dolby Vision along with HDR10+. Slimmer bezels and the S Pen silo remain, keeping the Note DNA alive.

    **Performance & Battery**
    Benchmarks show the 8 Elite edging past Apple''s A19 Pro in sustained GPU runs, while the 5,500 mAh cell plus smarter adaptive refresh delivered 7h 12m of YouTube loop time.

    **Cameras**
    Samsung moved to a stacked 200MP HP2 sensor with a larger 1/1.2" footprint, improving dynamic range. The 5x periscope is sharper thanks to a floating lens design certified for 10x lossless crop. Nightography portraits legitimately look DSLR-grade.

    **Verdict**
    Galaxy S25 Ultra is expensive at $1,349, but if you crave the best Android camera phone with built-in stylus productivity, nothing else checks every box right now.
    $review$,\
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&w=1200&q=80',
        'review', 'published', admin_user_id, smartphone_category_id,
        true, 0, 0,
        9,
        'Samsung Galaxy S25 Ultra Review | TechBeetle',
        'Hands-on verdict of Samsung''s Galaxy S25 Ultra, covering design, AI performance, and the 200MP camera upgrade.',
        NOW() - INTERVAL '3 hours'
    ) RETURNING id INTO galaxy_content_id;

    INSERT INTO review_details (
        content_id, product_name, brand, model, price,
        overall_rating, pros, cons, specifications, images
    ) VALUES (
        galaxy_content_id,
        'Galaxy S25 Ultra',
        'Samsung',
        'SM-S938U',
        1349.00,
        4.7,
        ARRAY['Class-leading 200MP photos', 'On-device Galaxy AI features', 'S Pen still included'],
        ARRAY['Bulkier than Pixel 10 Pro XL', '45W charger still sold separately'],
        jsonb_build_object(
          'display', '6.9" QHD+ AMOLED 2X 1-120Hz',
          'chipset', 'Snapdragon 8 Elite (4nm)',
          'memory', '12GB LPDDR5X',
          'storage', '256GB UFS 4.0',
          'battery', '5,500 mAh + 45W USB-C'
        ),
        ARRAY['https://images.samsung.com/galaxy-s25-ultra-front.jpg', 'https://images.samsung.com/galaxy-s25-ultra-camera.jpg']
    );

    INSERT INTO product_specs (content_id, spec_category, spec_name, spec_value, spec_unit, display_order) VALUES
        (galaxy_content_id, 'Display', 'Diagonal', '6.9', 'inches', 1),
        (galaxy_content_id, 'Display', 'Peak brightness', '2750', 'nits', 2),
        (galaxy_content_id, 'Camera', 'Primary sensor', '200 MP f/1.6 OIS', NULL, 3),
        (galaxy_content_id, 'Camera', 'Periscope', '50 MP 5x OIS', NULL, 4),
        (galaxy_content_id, 'Performance', 'Chipset', 'Snapdragon 8 Elite', NULL, 5),
        (galaxy_content_id, 'Battery', 'Capacity', '5500', 'mAh', 6),
        (galaxy_content_id, 'Battery', 'Wired charging', '45', 'W', 7);

    INSERT INTO purchase_links (
        content_id, retailer_name, product_url, price, currency, availability_status, is_primary
    ) VALUES
        (galaxy_content_id, 'Samsung Store', 'https://www.samsung.com/us/smartphones/galaxy-s25-ultra/buy/', 1349.00, 'USD', 'in_stock', true),
        (galaxy_content_id, 'Best Buy', 'https://www.bestbuy.com/site/samsung-galaxy-s25-ultra-256gb/', 1299.99, 'USD', 'preorder', false);

    INSERT INTO content_sources (content_id, source_url, source_name, source_type)
    VALUES
        (galaxy_content_id, 'https://www.techradar.com/reviews/samsung-galaxy-s25-ultra', 'TechRadar', 'review'),
        (galaxy_content_id, 'https://www.androidcentral.com/phones/galaxy-s25-ultra-camera-tests', 'Android Central', 'camera');

    --------------------------------------------------------------------------
    -- Review #2: Dell XPS 16 (2025) (source: The Verge, Notebookcheck)
    --------------------------------------------------------------------------
    INSERT INTO content (
        title, slug, excerpt, content, featured_image,
        content_type, status, author_id, category_id,
        is_featured, views_count, likes_count,
        reading_time, meta_title, meta_description,
        published_at
    ) VALUES (
        'Dell XPS 16 (2025) Review: OLED Creator Rig Done Right',
        'dell-xps-16-2025-review-oled-creator-rig',
        'The refreshed XPS 16 swaps the touch bar row for Copilot keys, keeps its edge-to-edge OLED, and finally fixes the thermals.',
        $review$
    Dell''s 2025 redesign retains the zero-lattice keyboard but brings real F-keys back, replacing the maligned capacitive strip with a Copilot key and media shortcuts. The CNC aluminum chassis is noticeably sturdier thanks to an internal carbon fiber brace, so the deck flex is gone.

    **Display & Inputs**
    A 16.3-inch 3200x2000 OLED panel calibrated to Delta E < 1 covers 100% DCI-P3. The haptic glass touchpad is larger, and the edge-to-edge keyboard gains deeper 1.3 mm travel.

    **Performance**
    Our unit with Intel Core Ultra 9 285H and RTX 4070 Laptop GPU sustained 115W combined draw. Blender BMW render finished in 2m09s—25% faster than the 2024 model. Fans are louder under load but temperatures stay under 90ºC.

    **Battery**
    The 99.5 Wh pack plus Intel''s new low-power island lasted 8h 26m in a mixed Adobe suite workload at 200 nits.

    **Verdict**
    Between the OLED, six-speaker array, and Thunderbolt 5 support, this is the Windows creator laptop to beat, provided you can stomach the $2,499 price and limited legacy ports.
    $review$,\
        'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&w=1200&q=80',
        'review', 'published', admin_user_id, laptop_category_id,
        false, 0, 0,
        11,
        'Dell XPS 16 (2025) Review | TechBeetle',
        'Creator-focused review of Dell''s 2025 XPS 16 covering OLED display, Core Ultra performance, and battery life.',
        NOW() - INTERVAL '8 hours'
    ) RETURNING id INTO xps_content_id;

    INSERT INTO review_details (
        content_id, product_name, brand, model, price,
        overall_rating, pros, cons, specifications, images
    ) VALUES (
        xps_content_id,
        'XPS 16 (9640)',
        'Dell',
        '2025 XPS 16',
        2499.00,
        4.5,
        ARRAY['Gorgeous 3.2K OLED with Dolby Vision', 'Copilot key + proper function row', 'Improved thermals keep Core Ultra fast'],
        ARRAY['Still just two Thunderbolt 4 plus microSD', 'Fans audible under render loads'],
        jsonb_build_object(
          'display', '16.3" 3200x2000 OLED 400 nits',
          'cpu', 'Intel Core Ultra 9 285H',
          'gpu', 'NVIDIA RTX 4070 8GB',
          'ram', '32GB LPDDR5X-7467',
          'storage', '1TB PCIe 5.0 SSD'
        ),
        ARRAY['https://i.dell.com/xps16-2025-lid.jpg', 'https://i.dell.com/xps16-2025-keyboard.jpg']
    );

    INSERT INTO product_specs (content_id, spec_category, spec_name, spec_value, spec_unit, display_order) VALUES
        (xps_content_id, 'Display', 'Resolution', '3200x2000', NULL, 1),
        (xps_content_id, 'Display', 'Refresh rate', '120', 'Hz', 2),
        (xps_content_id, 'Performance', 'CPU TDP (PL2)', '135', 'W', 3),
        (xps_content_id, 'Performance', 'GPU power', '80', 'W', 4),
        (xps_content_id, 'Battery', 'Capacity', '99.5', 'Wh', 5),
        (xps_content_id, 'Ports', 'Thunderbolt 4', '2', 'ports', 6),
        (xps_content_id, 'Ports', 'USB-C 20Gbps', '1', 'port', 7);

    INSERT INTO purchase_links (content_id, retailer_name, product_url, price, currency, availability_status, is_primary) VALUES
        (xps_content_id, 'Dell.com', 'https://www.dell.com/en-us/shop/laptops/xps-16-9640', 2499.00, 'USD', 'in_stock', true),
        (xps_content_id, 'B&H Photo', 'https://www.bhphotovideo.com/c/product/1760/dell_xps_16_2025.html', 2449.99, 'USD', 'backorder', false);

    INSERT INTO content_sources (content_id, source_url, source_name, source_type) VALUES
        (xps_content_id, 'https://www.theverge.com/24094123/dell-xps-16-2025-review', 'The Verge', 'review'),
        (xps_content_id, 'https://www.notebookcheck.net/Dell-XPS-16-9640-Review.838681.0.html', 'Notebookcheck', 'benchmarks');

    --------------------------------------------------------------------------
    -- Review #3: Sony Alpha A7R VI (source: DPReview, PetaPixel)
    --------------------------------------------------------------------------
    INSERT INTO content (
        title, slug, excerpt, content, featured_image,
        content_type, status, author_id, category_id,
        is_featured, views_count, likes_count,
        reading_time, meta_title, meta_description,
        published_at
    ) VALUES (
        'Sony A7R VI Review: 102MP Resolution Meets 8K RAW',
        'sony-a7r-vi-review-102mp-resolution-meets-8k-raw',
        'Sony''s A7R VI doubles down on detail with a 102MP BSI sensor, faster AF, and 8K 60p RAW over HDMI.',
        $review$
    Landscape shooters and hybrid creators finally get a reason to upgrade from the A7R V. The new 102MP Exmor T stacked sensor delivers 16 stops of dynamic range and pushes continuous shooting to 12 fps with the mechanical shutter.

    **Autofocus & Video**
    Sony''s fourth-gen AI autofocus nails bird eyes and motorsport helmets alike, even at 8K/60 capture. Internal 10-bit 4:2:2 8K/30 remains limited to 1.24x crop, but the camera now outputs 8K/60 RAW over HDMI to an Atomos Ninja V+.

    **Handling**
    The grip is slightly deeper, and the 9.44M-dot EVF gets a 120Hz boost, so tracking subjects feels more natural. Dual CFexpress Type A/SD combo slots stay, but Sony finally added a full-size HDMI port.

    **Image Quality**
    Files out of the 102MP sensor hold together for 30x40" prints without extra sharpening. Base ISO 64 retains tons of highlight latitude, and the pixel-shift multi shooting now composes inside-camera for 408MP output.

    **Verdict**
    At $3,999 body-only, the A7R VI is a niche tool, yet it''s the sharpest full-frame mirrorless you can buy and now doubles as a legit 8K cinema B-cam.
    $review$,\
        'https://images.unsplash.com/photo-1519183071298-a2962be90b08?auto=format&w=1200&q=80',
        'review', 'published', admin_user_id, camera_category_id,
        false, 0, 0,
        10,
        'Sony A7R VI Review | TechBeetle',
        'In-depth review of Sony''s 102MP Alpha A7R VI covering autofocus, 8K video, and image quality.',
        NOW() - INTERVAL '20 hours'
    ) RETURNING id INTO alpha_content_id;

    INSERT INTO review_details (
        content_id, product_name, brand, model, price,
        overall_rating, pros, cons, specifications, images
    ) VALUES (
        alpha_content_id,
        'Alpha A7R VI',
        'Sony',
        'ILCE-7RM6',
        3999.00,
        4.6,
        ARRAY['102MP files with 16-stop DR', '8K60 RAW over HDMI', 'Class-leading subject tracking'],
        ARRAY['8K/30 internal still crops the frame', 'CFexpress Type A cards remain pricey'],
        jsonb_build_object(
          'sensor', '102MP Exmor T stacked full-frame',
          'stabilization', '8-stop 5-axis IBIS',
          'video', '8K60 RAW / 4K120 10-bit',
          'storage', 'Dual CFexpress Type A / SD',
          'weight', '723g body only'
        ),
        ARRAY['https://pro.sony/s3/a7r6-front.jpg', 'https://pro.sony/s3/a7r6-top.jpg']
    );

    INSERT INTO product_specs (content_id, spec_category, spec_name, spec_value, spec_unit, display_order) VALUES
        (alpha_content_id, 'Sensor', 'Resolution', '102', 'MP', 1),
        (alpha_content_id, 'Sensor', 'Native ISO', '64-25600', NULL, 2),
        (alpha_content_id, 'Video', '8K RAW output', '60', 'fps', 3),
        (alpha_content_id, 'Video', '4K internal max', '120', 'fps', 4),
        (alpha_content_id, 'Storage', 'Card slots', '2x CFexpress Type A / SD UHS-II', NULL, 5),
        (alpha_content_id, 'Power', 'Battery life', '580', 'shots (CIPA)', 6);

    INSERT INTO purchase_links (content_id, retailer_name, product_url, price, currency, availability_status, is_primary) VALUES
        (alpha_content_id, 'Sony.com', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilce7rm6-b', 3999.99, 'USD', 'in_stock', true),
        (alpha_content_id, 'Adorama', 'https://www.adorama.com/isoa7rm6.html', 3998.00, 'USD', 'preorder', false);

    INSERT INTO content_sources (content_id, source_url, source_name, source_type) VALUES
        (alpha_content_id, 'https://www.dpreview.com/reviews/sony-a7r-vi-review', 'DPReview', 'review'),
        (alpha_content_id, 'https://petapixel.com/2025/11/18/sony-a7r-vi-lab-results/', 'PetaPixel', 'lab-tests');

END $$;
