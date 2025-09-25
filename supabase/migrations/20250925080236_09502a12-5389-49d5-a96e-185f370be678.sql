-- Fix critical security issue: Protect newsletter subscription email addresses from public access
-- Add Row Level Security policies to newsletter_subscriptions table

-- Enable RLS on newsletter_subscriptions table if not already enabled
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only admins can view all newsletter subscriptions
-- This protects email addresses from being harvested by unauthorized users
CREATE POLICY "Admins can view all newsletter subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
USING (is_admin_user());

-- Policy 2: Only admins can manage (insert/update/delete) newsletter subscriptions
-- This ensures only authorized personnel can modify subscription data
CREATE POLICY "Admins can manage newsletter subscriptions"
ON public.newsletter_subscriptions
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Policy 3: Allow public subscription creation (anonymous users can subscribe)
-- This is needed for newsletter signup functionality on the website
-- Note: This only allows INSERT, not reading existing data
CREATE POLICY "Anyone can create newsletter subscriptions"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true);

-- Add a comment explaining the security measures
COMMENT ON TABLE public.newsletter_subscriptions IS 'Newsletter subscription emails are protected by RLS policies. Only admins can view/manage subscriptions to prevent email harvesting by spammers.';