-- Demo catalog: 20 products across 4 categories, loaded on first container
-- start. Deliberately small (see README "What's next" re: the assistant's
-- whole-catalog-in-context AI grounding approach) and uses deterministic
-- placeholder images instead of a real asset library.
--
-- A couple of items are intentionally "waterproof" + under $30 so the
-- README's AI-search example ("cheap waterproof bags under $30") has a real
-- hit against this data.

INSERT INTO products (title, description, price, category, image_url, stock) VALUES
    -- electronics
    ('Wireless Earbuds Pro', 'True wireless earbuds with active noise cancellation and 30-hour battery life.', 59.99, 'electronics', 'https://picsum.photos/seed/earbuds-pro/600/400', 40),
    ('Portable Bluetooth Speaker', 'Compact speaker with rich bass, splash-resistant design, 12-hour playtime.', 34.99, 'electronics', 'https://picsum.photos/seed/bt-speaker/600/400', 35),
    ('USB-C Fast Charger 65W', 'Compact GaN charger for laptops and phones, 65W fast charging.', 24.99, 'electronics', 'https://picsum.photos/seed/usbc-charger/600/400', 60),
    ('Mechanical Keyboard', 'Hot-swappable mechanical keyboard with tactile switches and RGB backlight.', 89.99, 'electronics', 'https://picsum.photos/seed/mech-keyboard/600/400', 20),
    ('Noise Cancelling Headphones', 'Over-ear headphones with adaptive noise cancellation and 40-hour battery.', 149.99, 'electronics', 'https://picsum.photos/seed/anc-headphones/600/400', 15),

    -- apparel
    ('Classic Cotton T-Shirt', 'Soft, breathable 100% cotton t-shirt in a relaxed fit.', 14.99, 'apparel', 'https://picsum.photos/seed/cotton-tshirt/600/400', 100),
    ('Slim Fit Denim Jeans', 'Stretch denim jeans with a modern slim fit.', 44.99, 'apparel', 'https://picsum.photos/seed/denim-jeans/600/400', 50),
    ('Waterproof Rain Jacket', 'Lightweight, fully waterproof jacket with a packable hood.', 79.99, 'apparel', 'https://picsum.photos/seed/rain-jacket/600/400', 30),
    ('Running Shoes', 'Cushioned running shoes with breathable mesh upper.', 69.99, 'apparel', 'https://picsum.photos/seed/running-shoes/600/400', 45),
    ('Wool Blend Sweater', 'Warm wool-blend crew neck sweater for cold weather.', 54.99, 'apparel', 'https://picsum.photos/seed/wool-sweater/600/400', 25),

    -- home
    ('Ceramic Coffee Mug Set', 'Set of 4 handcrafted ceramic mugs, dishwasher safe.', 19.99, 'home', 'https://picsum.photos/seed/mug-set/600/400', 40),
    ('Non-Stick Frying Pan', '10-inch non-stick frying pan with ergonomic handle.', 29.99, 'home', 'https://picsum.photos/seed/frying-pan/600/400', 30),
    ('Memory Foam Pillow', 'Contoured memory foam pillow for neck support.', 24.99, 'home', 'https://picsum.photos/seed/foam-pillow/600/400', 55),
    ('LED Desk Lamp', 'Adjustable LED desk lamp with 3 brightness levels and USB port.', 22.99, 'home', 'https://picsum.photos/seed/desk-lamp/600/400', 35),
    ('Cotton Bath Towel Set', 'Set of 2 ultra-absorbent 100% cotton bath towels.', 27.99, 'home', 'https://picsum.photos/seed/bath-towels/600/400', 40),

    -- accessories
    ('Waterproof Backpack', 'Durable waterproof backpack with laptop sleeve, perfect for commuting or hiking.', 27.99, 'accessories', 'https://picsum.photos/seed/wp-backpack/600/400', 25),
    ('Leather Wallet', 'Slim genuine leather bifold wallet with RFID protection.', 34.99, 'accessories', 'https://picsum.photos/seed/leather-wallet/600/400', 60),
    ('Canvas Tote Bag', 'Sturdy canvas tote bag, great for everyday errands.', 12.99, 'accessories', 'https://picsum.photos/seed/tote-bag/600/400', 70),
    ('Sunglasses UV Protection', 'Polarized sunglasses with 100% UV protection.', 18.99, 'accessories', 'https://picsum.photos/seed/sunglasses/600/400', 50),
    ('Waterproof Phone Pouch', 'Universal waterproof pouch for phones, great for beach or pool days.', 8.99, 'accessories', 'https://picsum.photos/seed/phone-pouch/600/400', 90)
ON CONFLICT DO NOTHING;
