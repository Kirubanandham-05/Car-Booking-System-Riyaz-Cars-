-- Insert admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (email, password, name, phone, role) 
VALUES (
  'admin@riyazcars.com', 
  '$2b$10$rKZN5qJ5qJ5qJ5qJ5qJ5qOXxYvGxYvGxYvGxYvGxYvGxYvGxYvGxY',
  'Admin',
  '1234567890',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert cars
INSERT INTO cars (name, type, seats, price_per_day, image_url, available) 
VALUES 
  (
    'Toyota Innova Crysta',
    'SUV',
    7,
    2500.00,
    '/toyota-innova-crysta-white.jpg',
    true
  ),
  (
    'Honda City',
    'Sedan',
    5,
    1800.00,
    '/honda-city-silver.jpg',
    true
  )
ON CONFLICT DO NOTHING;
