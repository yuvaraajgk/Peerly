
-- ============================================
-- Peerly Database Migration for Supabase
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  college_email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- Insert default categories (only if they don't exist)
INSERT INTO categories (category_name, slug, description)
VALUES 
  ('Tech Gadgets', 'tech', 'Electronics and technology items'),
  ('Books', 'books', 'Textbooks and reading materials'),
  ('Stationery', 'stationery', 'Writing and office supplies'),
  ('Apparel', 'apparel', 'Clothing and accessories'),
  ('Student Essentials', 'essentials', 'Other student necessities')
ON CONFLICT (slug) DO NOTHING;

-- Items table
CREATE TABLE IF NOT EXISTS items (
  item_id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(category_id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Acceptable')),
  item_age VARCHAR(50),
  price_sale DECIMAL(10, 2),
  price_rent_daily DECIMAL(10, 2),
  is_for_sale BOOLEAN DEFAULT TRUE,
  is_for_rent BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Sold', 'Rented', 'Draft')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Item images table
CREATE TABLE IF NOT EXISTS item_images (
  image_id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  sort_order INTEGER DEFAULT 1
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id SERIAL PRIMARY KEY,
  buyer_id INTEGER NOT NULL REFERENCES users(user_id),
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('Purchase', 'Rental')),
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Cash', 'BankAccount', 'UPI', 'QRCode')),
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'AwaitingVerification')),
  rental_start_date DATE,
  rental_end_date DATE,
  transaction_status VARCHAR(20) NOT NULL DEFAULT 'Processing' CHECK (transaction_status IN ('Processing', 'Completed', 'Cancelled')),
  buyer_transaction_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(item_id) ON DELETE SET NULL,
  user1_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id, item_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  message_id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_status BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_seller ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item ON transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);

-- ============================================
-- Migration Complete!
-- ============================================
-- All tables and indexes have been created.
-- You can now use the Peerly application with Supabase.
-- ============================================
