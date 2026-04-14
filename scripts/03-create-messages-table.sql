-- Create messages table to store contact messages from users
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  owner_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
  sender_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  sent_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
