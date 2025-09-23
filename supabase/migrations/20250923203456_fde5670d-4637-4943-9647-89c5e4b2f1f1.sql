-- Add review details and purchase links for the sample products
DO $$
DECLARE
    iphone_content_id uuid;
    macbook_content_id uuid;
    sony_content_id uuid;
BEGIN
    -- Get the content IDs for our sample products
    SELECT id INTO iphone_content_id FROM content WHERE slug = 'iphone-15-pro-max-review-ultimate' LIMIT 1;
    SELECT id INTO macbook_content_id FROM content WHERE slug = 'macbook-pro-16-m3-max-review-powerhouse' LIMIT 1;
    SELECT id INTO sony_content_id FROM content WHERE slug = 'sony-wh-1000xm5-best-noise-canceling' LIMIT 1;
    
    -- Insert review details for iPhone 15 Pro Max
    IF iphone_content_id IS NOT NULL THEN
        INSERT INTO review_details (
            content_id, product_name, brand, model, price, overall_rating, 
            pros, cons, specifications, images
        ) VALUES (
            iphone_content_id, 'iPhone 15 Pro Max', 'Apple', 'A3108', 1199.99, 4.8,
            ARRAY['Exceptional build quality', 'Outstanding camera performance', 'Powerful A17 Pro processor', 'Long battery life'],
            ARRAY['Very expensive', 'Heavy despite titanium construction', 'USB-C transition may require new accessories'],
            '{"display": "6.7-inch Super Retina XDR", "processor": "A17 Pro chip", "storage": "256GB", "camera": "48MP Main, 12MP Ultra Wide, 12MP Telephoto", "battery": "Up to 29 hours video playbook", "connectivity": "5G, Wi-Fi 6E, Bluetooth 5.3"}',
            ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800']
        );
        
        -- Insert purchase links for iPhone
        INSERT INTO purchase_links (content_id, retailer_name, product_url, price, currency, is_primary, availability_status) VALUES
        (iphone_content_id, 'Amazon', 'https://amazon.com/dp/B0CHX1W5K1?tag=techbeetle-20', 1199.99, 'USD', true, 'in_stock'),
        (iphone_content_id, 'Best Buy', 'https://bestbuy.com/site/apple-iphone-15-pro-max', 1199.99, 'USD', false, 'in_stock'),
        (iphone_content_id, 'Apple Store', 'https://apple.com/iphone-15-pro', 1199.99, 'USD', false, 'in_stock');
    END IF;
    
    -- Insert review details for MacBook Pro
    IF macbook_content_id IS NOT NULL THEN
        INSERT INTO review_details (
            content_id, product_name, brand, model, price, overall_rating, 
            pros, cons, specifications, images
        ) VALUES (
            macbook_content_id, 'MacBook Pro 16-inch', 'Apple', 'M3 Max', 3999.99, 4.9,
            ARRAY['Incredible M3 Max performance', 'Stunning XDR display', 'Excellent battery life', 'Premium build quality'],
            ARRAY['Very expensive', 'Heavy for portability', 'Limited gaming support'],
            '{"processor": "M3 Max chip", "display": "16.2-inch Liquid Retina XDR", "memory": "36GB unified memory", "storage": "1TB SSD", "ports": "3x Thunderbolt 4, HDMI, SDXC, MagSafe 3"}',
            ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800']
        );
        
        -- Insert purchase links for MacBook
        INSERT INTO purchase_links (content_id, retailer_name, product_url, price, currency, is_primary, availability_status) VALUES
        (macbook_content_id, 'Amazon', 'https://amazon.com/dp/B0CM5JV268?tag=techbeetle-20', 3999.99, 'USD', true, 'in_stock'),
        (macbook_content_id, 'Apple Store', 'https://apple.com/macbook-pro-16', 3999.99, 'USD', false, 'in_stock'),
        (macbook_content_id, 'B&H Photo', 'https://bhphotovideo.com/c/product/apple-macbook-pro', 3999.99, 'USD', false, 'in_stock');
    END IF;
    
    -- Insert review details for Sony WH-1000XM5
    IF sony_content_id IS NOT NULL THEN
        INSERT INTO review_details (
            content_id, product_name, brand, model, price, overall_rating, 
            pros, cons, specifications, images
        ) VALUES (
            sony_content_id, 'WH-1000XM5', 'Sony', 'WH-1000XM5', 399.99, 4.7,
            ARRAY['Industry-leading noise cancellation', 'Excellent sound quality', 'Comfortable design', '30-hour battery life'],
            ARRAY['No folding design', 'Touch controls can be sensitive', 'Price premium over competitors'],
            '{"driver": "30mm", "frequency": "4Hz-40kHz", "battery": "30 hours", "charging": "USB-C", "weight": "250g"}',
            ARRAY['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800']
        );
        
        -- Insert purchase links for Sony headphones
        INSERT INTO purchase_links (content_id, retailer_name, product_url, price, currency, is_primary, availability_status) VALUES
        (sony_content_id, 'Amazon', 'https://amazon.com/dp/B09XS7JWHH?tag=techbeetle-20', 399.99, 'USD', true, 'in_stock'),
        (sony_content_id, 'Best Buy', 'https://bestbuy.com/site/sony-wh1000xm5', 399.99, 'USD', false, 'in_stock'),
        (sony_content_id, 'Sony Direct', 'https://sony.com/electronics/headband-headphones/wh-1000xm5', 399.99, 'USD', false, 'in_stock');
    END IF;
    
END $$;