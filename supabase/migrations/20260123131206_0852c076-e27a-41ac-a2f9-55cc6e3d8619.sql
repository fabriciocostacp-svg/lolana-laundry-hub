-- Create table for tracking login attempts (rate limiting)
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('username', 'ip', 'phone')),
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Block anonymous access
CREATE POLICY "Block anon access - login_attempts" ON public.login_attempts
  AS RESTRICTIVE FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

-- Allow service role only
CREATE POLICY "Service role only - login_attempts" ON public.login_attempts
  AS RESTRICTIVE FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for efficient rate limit lookups
CREATE INDEX idx_login_attempts_identifier ON public.login_attempts (identifier, identifier_type, created_at DESC);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts (ip_address, identifier_type, created_at DESC);

-- Function to cleanup old login attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;