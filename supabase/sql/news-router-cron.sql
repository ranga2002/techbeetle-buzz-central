-- Configure secrets (store once, reuse in cron)
-- Replace placeholders with your real values when running in Supabase SQL editor
select vault.create_secret('project_url', 'https://YOUR_PROJECT_REF.supabase.co');
select vault.create_secret('anon_key', 'YOUR_SUPABASE_ANON_KEY');

-- Optional: set a preferred country for scheduled pulls
select vault.create_secret('news_country', 'us');

-- Schedule the news-router edge function every 10 minutes
select
  cron.schedule(
    'invoke-news-router-every-10min',
    '*/10 * * * *', -- every 10 minutes
    $$
    select
      net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/news-router',
        headers := jsonb_build_object(
          'Content-type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
          'x-country', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'news_country'), 'us')
        ),
        body := jsonb_build_object('triggered_at', now())
      ) as request_id;
    $$
  );

-- Requirements: pg_net and pg_cron extensions enabled in your database.
-- To remove the schedule:
-- select cron.unschedule('invoke-news-router-every-10min');
