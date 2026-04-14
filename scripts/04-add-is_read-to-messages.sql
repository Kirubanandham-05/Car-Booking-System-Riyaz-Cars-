-- Add is_read column to messages so admin can mark messages as read/unread
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
