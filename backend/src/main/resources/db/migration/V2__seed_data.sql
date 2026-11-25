-- =====================================================================
-- QuickRider - V2 seed data (LOCAL DEVELOPMENT ONLY)
-- All seeded accounts use the password: password
-- BCrypt(10) hash of "password"
-- =====================================================================

INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
('Platform Admin',  'admin@quickrider.com',        '9000000001', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG6', 'ADMIN'),
('Ravi Kulkarni',   'ravi.fresh@quickrider.com',   '9000000002', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG6', 'SHOPKEEPER'),
('Anita Deshmukh',  'anita.daily@quickrider.com',  '9000000003', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG6', 'SHOPKEEPER'),
('Suresh Patil',    'suresh.green@quickrider.com', '9000000004', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG6', 'SHOPKEEPER'),
('Priya Sharma',    'priya@example.com',           '9000000005', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG6', 'CUSTOMER'),
('Rahul Mehta',     'rahul@example.com',           '9000000006', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG6', 'CUSTOMER');

INSERT INTO addresses (user_id, label, line1, line2, city, pincode, is_default) VALUES
((SELECT id FROM users WHERE email = 'priya@example.com'), 'Home', 'Flat 402, Lotus Residency', 'Lane 5, Koregaon Park', 'Pune', '411001', TRUE),
((SELECT id FROM users WHERE email = 'priya@example.com'), 'Work', '3rd Floor, Business Bay', 'Yerawada', 'Pune', '411006', FALSE),
((SELECT id FROM users WHERE email = 'rahul@example.com'), 'Home', 'B-12, Sunshine Society', 'Baner Road', 'Pune', '411045', TRUE);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Fresh Produce',    'fresh-produce',    'Apple',       1),
('Dairy & Bakery',   'dairy-bakery',     'Milk',        2),
('Staples & Grains', 'staples-grains',   'Wheat',       3),
('Beverages',        'beverages',        'CupSoda',     4),
('Snacks',           'snacks',           'Cookie',      5),
('Household',        'household',        'SprayCan',    6);

INSERT INTO shops (name, description, address, city, pincode, phone, delivery_radius_km, opening_time, closing_time, image_url, min_order_amount, delivery_fee, rating, active, owner_id) VALUES
('FreshMart Koregaon Park', 'Farm-fresh fruits, vegetables and daily essentials delivered in minutes.',
 'Shop 7, North Main Road, Koregaon Park', 'Pune', '411001', '02026110001', 4.00, '07:00', '23:00',
 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', 99.00, 20.00, 4.6, TRUE,
 (SELECT id FROM users WHERE email = 'ravi.fresh@quickrider.com')),
('Daily Needs Supermarket', 'Your neighbourhood supermarket for staples, dairy and beverages.',
 'Plot 21, Baner Road, Near Balewadi Phata', 'Pune', '411045', '02026110002', 5.00, '08:00', '22:00',
 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800', 149.00, 25.00, 4.3, TRUE,
 (SELECT id FROM users WHERE email = 'anita.daily@quickrider.com')),
('Green Basket Organics', 'Certified organic groceries and cold-pressed beverages.',
 'Lane 3, Kalyani Nagar', 'Pune', '411006', '02026110003', 3.00, '09:00', '21:00',
 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800', 199.00, 30.00, 4.8, FALSE,
 (SELECT id FROM users WHERE email = 'suresh.green@quickrider.com'));

-- FreshMart Koregaon Park
INSERT INTO products (shop_id, category_id, name, description, unit, price, discounted_price, stock_quantity, image_url)
SELECT s.id, c.id, v.name, v.description, v.unit, v.price, v.discounted_price, v.stock, v.image_url
FROM (VALUES
  ('fresh-produce',  'Fresh Tomatoes',        'Juicy, ripe local tomatoes.',            '500g',   40.00, 32.00, 120, 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=600'),
  ('fresh-produce',  'Onions',                'Nashik red onions.',                     '1kg',    45.00, NULL,  200, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600'),
  ('fresh-produce',  'Bananas (Robusta)',     'Naturally ripened bananas.',             '1 dozen',60.00, 55.00, 80,  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600'),
  ('fresh-produce',  'Alphonso Mangoes',      'Ratnagiri Alphonso, premium grade.',     '1kg',   399.00,349.00, 25,  'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'),
  ('fresh-produce',  'Spinach (Palak)',       'Fresh leafy spinach bunch.',             '250g',   25.00, NULL,  60,  'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600'),
  ('dairy-bakery',   'Toned Milk',            'Pasteurised toned milk.',                '1L',     56.00, NULL,  150, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600'),
  ('dairy-bakery',   'Fresh Paneer',          'Soft malai paneer.',                     '200g',   90.00, 85.00, 40,  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600'),
  ('dairy-bakery',   'Whole Wheat Bread',     '100% atta bread, no maida.',             '1 pack', 50.00, 45.00, 35,  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600'),
  ('beverages',      'Tender Coconut Water',  'Natural electrolytes, no added sugar.',  '1L',     99.00, 89.00, 30,  'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600'),
  ('snacks',         'Roasted Makhana',       'Lightly salted fox nuts.',               '100g',  120.00, 99.00, 45,  'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600')
) AS v(cat, name, description, unit, price, discounted_price, stock, image_url)
JOIN categories c ON c.slug = v.cat
JOIN shops s ON s.name = 'FreshMart Koregaon Park';

-- Daily Needs Supermarket
INSERT INTO products (shop_id, category_id, name, description, unit, price, discounted_price, stock_quantity, image_url)
SELECT s.id, c.id, v.name, v.description, v.unit, v.price, v.discounted_price, v.stock, v.image_url
FROM (VALUES
  ('staples-grains', 'Basmati Rice',          'Long-grain aged basmati.',               '5kg',   649.00,579.00, 50,  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'),
  ('staples-grains', 'Whole Wheat Atta',      'Chakki-fresh whole wheat flour.',        '5kg',   289.00,265.00, 70,  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'),
  ('staples-grains', 'Toor Dal',              'Unpolished toor dal.',                   '1kg',   179.00,165.00, 90,  'https://images.unsplash.com/photo-1585996746300-f4f8b4f5c9d3?w=600'),
  ('staples-grains', 'Sunflower Oil',         'Refined sunflower oil.',                 '1L',    155.00,139.00, 60,  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'),
  ('dairy-bakery',   'Salted Butter',         'Creamy salted butter.',                  '500g',  285.00, NULL,  40,  'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600'),
  ('dairy-bakery',   'Farm Eggs',             'Brown eggs, pack of 12.',                '1 pack',110.00, 99.00, 55,  'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600'),
  ('dairy-bakery',   'Greek Yogurt',          'High-protein plain yogurt.',             '400g',  140.00,125.00, 25,  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600'),
  ('beverages',      'Assam Tea',             'Strong CTC Assam tea.',                  '500g',  260.00,235.00, 45,  'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600'),
  ('beverages',      'Filter Coffee Powder',  'South Indian coffee-chicory blend.',     '500g',  320.00, NULL,  30,  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600'),
  ('beverages',      'Orange Juice',          '100% juice, no added sugar.',            '1L',    135.00,119.00, 40,  'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600'),
  ('household',      'Dishwash Liquid',       'Lemon dishwash gel.',                    '750ml', 199.00,175.00, 35,  'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600')
) AS v(cat, name, description, unit, price, discounted_price, stock, image_url)
JOIN categories c ON c.slug = v.cat
JOIN shops s ON s.name = 'Daily Needs Supermarket';

-- Green Basket Organics (inactive shop)
INSERT INTO products (shop_id, category_id, name, description, unit, price, discounted_price, stock_quantity, image_url)
SELECT s.id, c.id, v.name, v.description, v.unit, v.price, v.discounted_price, v.stock, v.image_url
FROM (VALUES
  ('fresh-produce',  'Organic Carrots',       'Pesticide-free carrots.',                '500g',   70.00, 65.00, 40,  'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600'),
  ('staples-grains', 'Organic Jaggery',       'Chemical-free jaggery block.',           '1kg',   140.00, NULL,  30,  'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=600'),
  ('beverages',      'Cold Pressed Green Juice','Spinach, apple, cucumber.',            '300ml', 150.00,135.00, 20,  'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600')
) AS v(cat, name, description, unit, price, discounted_price, stock, image_url)
JOIN categories c ON c.slug = v.cat
JOIN shops s ON s.name = 'Green Basket Organics';

-- Sample orders for Priya at FreshMart
INSERT INTO orders (order_number, customer_id, shop_id, status, delivery_name, delivery_phone, delivery_address, delivery_pincode, subtotal, delivery_fee, total_amount, payment_method, created_at, updated_at)
VALUES
('QR-20261120-0001', (SELECT id FROM users WHERE email = 'priya@example.com'), (SELECT id FROM shops WHERE name = 'FreshMart Koregaon Park'),
 'DELIVERED', 'Priya Sharma', '9000000005', 'Flat 402, Lotus Residency, Lane 5, Koregaon Park, Pune', '411001', 176.00, 20.00, 196.00, 'COD',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '40 minutes'),
('QR-20261122-0002', (SELECT id FROM users WHERE email = 'priya@example.com'), (SELECT id FROM shops WHERE name = 'FreshMart Koregaon Park'),
 'PACKING', 'Priya Sharma', '9000000005', 'Flat 402, Lotus Residency, Lane 5, Koregaon Park, Pune', '411001', 141.00, 20.00, 161.00, 'UPI',
 NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '5 minutes');

INSERT INTO order_items (order_id, product_id, product_name, unit, unit_price, quantity, line_total)
SELECT o.id, p.id, p.name, p.unit, v.unit_price, v.qty, v.unit_price * v.qty
FROM (VALUES
  ('QR-20261120-0001', 'Fresh Tomatoes',    32.00, 2),
  ('QR-20261120-0001', 'Toned Milk',        56.00, 2),
  ('QR-20261122-0002', 'Fresh Paneer',      85.00, 1),
  ('QR-20261122-0002', 'Toned Milk',        56.00, 1)
) AS v(order_number, product_name, unit_price, qty)
JOIN orders o ON o.order_number = v.order_number
JOIN products p ON p.name = v.product_name AND p.shop_id = o.shop_id;

INSERT INTO order_status_history (order_id, status, changed_by, note, changed_at)
SELECT o.id, v.status, u.id, v.note, o.created_at + v.offset_min * INTERVAL '1 minute'
FROM (VALUES
  ('QR-20261120-0001', 'PLACED',           'priya@example.com',         'Order placed',            0),
  ('QR-20261120-0001', 'ACCEPTED',         'ravi.fresh@quickrider.com', 'Order accepted by shop',  3),
  ('QR-20261120-0001', 'PACKING',          'ravi.fresh@quickrider.com', 'Packing your items',      8),
  ('QR-20261120-0001', 'OUT_FOR_DELIVERY', 'ravi.fresh@quickrider.com', 'Rider is on the way',    18),
  ('QR-20261120-0001', 'DELIVERED',        'ravi.fresh@quickrider.com', 'Delivered',              40),
  ('QR-20261122-0002', 'PLACED',           'priya@example.com',         'Order placed',            0),
  ('QR-20261122-0002', 'ACCEPTED',         'ravi.fresh@quickrider.com', 'Order accepted by shop',  4),
  ('QR-20261122-0002', 'PACKING',          'ravi.fresh@quickrider.com', 'Packing your items',     10)
) AS v(order_number, status, email, note, offset_min)
JOIN orders o ON o.order_number = v.order_number
JOIN users u ON u.email = v.email;
