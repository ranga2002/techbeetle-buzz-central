-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to fetch news every 5 minutes
SELECT cron.schedule(
  'fetch-tech-news',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://mnlgianmqlcndjyovlxj.supabase.co/functions/v1/fetch-news',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubGdpYW5tcWxjbmRqeW92bHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Mjg3NjYsImV4cCI6MjA2NTIwNDc2Nn0.ho1BxNdFOMpeIe-cdzyQ_412xE493WMwjeWZDkf3hpU"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);
