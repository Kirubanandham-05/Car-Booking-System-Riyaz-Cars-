-- Add sender_name and sender_email columns to messages so guest senders can be identified
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sender_name TEXT NULL,
ADD COLUMN IF NOT EXISTS sender_email TEXT NULL;
