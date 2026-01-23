import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 30,
  },
  resetPassword: {
    maxAttempts: 3,
    windowMinutes: 60,
    lockoutMinutes: 60,
  },
};

export type RateLimitType = 'login' | 'resetPassword';

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMinutes?: number;
}

export async function checkRateLimit(
  identifier: string,
  identifierType: 'username' | 'ip' | 'phone',
  limitType: RateLimitType,
  ipAddress?: string
): Promise<RateLimitResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const config = RATE_LIMIT_CONFIG[limitType];
  
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000).toISOString();
  
  // Count failed attempts in window
  const { count: failedCount } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('identifier_type', identifierType)
    .eq('success', false)
    .gte('created_at', windowStart);

  const attempts = failedCount || 0;
  
  if (attempts >= config.maxAttempts) {
    // Check lockout period
    const lockoutStart = new Date(Date.now() - config.lockoutMinutes * 60 * 1000).toISOString();
    
    const { data: lastAttempt } = await supabase
      .from('login_attempts')
      .select('created_at')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('success', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastAttempt && new Date(lastAttempt.created_at) > new Date(lockoutStart)) {
      const retryAfter = Math.ceil(
        (new Date(lastAttempt.created_at).getTime() + config.lockoutMinutes * 60 * 1000 - Date.now()) / 60000
      );
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterMinutes: Math.max(1, retryAfter),
      };
    }
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, config.maxAttempts - attempts),
  };
}

export async function recordLoginAttempt(
  identifier: string,
  identifierType: 'username' | 'ip' | 'phone',
  success: boolean,
  ipAddress?: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  await supabase.from('login_attempts').insert({
    identifier,
    identifier_type: identifierType,
    ip_address: ipAddress || null,
    success,
  });
}

export async function clearLoginAttempts(
  identifier: string,
  identifierType: 'username' | 'ip' | 'phone'
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // On successful login, clear failed attempts
  await supabase
    .from('login_attempts')
    .delete()
    .eq('identifier', identifier)
    .eq('identifier_type', identifierType)
    .eq('success', false);
}

export function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}
