/**
 * Security utilities for the application
 * Centralizes security-related functions to prevent credential leakage
 */

// Never log these keys
const SENSITIVE_KEYS = ['senha', 'password', 'token', 'sessionToken', 'secret', 'apiKey', 'cpf', 'cnpj'];

/**
 * Sanitize object for logging - removes sensitive fields
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as Partial<T>;
}

/**
 * Safe console log that redacts sensitive information
 */
export function safeLog(message: string, data?: Record<string, unknown>): void {
  if (data) {
    console.log(message, sanitizeForLogging(data));
  } else {
    console.log(message);
  }
}

/**
 * Safe console error that redacts sensitive information
 */
export function safeError(message: string, error?: unknown): void {
  if (error instanceof Error) {
    // Never log stack traces in production that might contain sensitive data
    console.error(message, { name: error.name, message: error.message });
  } else if (typeof error === 'object' && error !== null) {
    console.error(message, sanitizeForLogging(error as Record<string, unknown>));
  } else {
    console.error(message, error);
  }
}

/**
 * Validate session token format (basic validation)
 */
export function isValidSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  // Session tokens should be 64 hex characters
  return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Clear all sensitive session data from localStorage
 */
export function clearAllSessionData(): void {
  const keysToRemove = ['lolana_session', 'lolana_user', 'lolana_expires'];
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  });
}

/**
 * Check if we're in a secure context (HTTPS)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === 'https:';
}
