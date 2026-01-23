// Secure password hashing using bcrypt (Deno-compatible without Workers)
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

// Cost factor: 10 is a good balance for edge functions
// Higher = more secure but slower
const BCRYPT_COST = 10;

export async function hashPassword(password: string): Promise<string> {
  // Use synchronous version to avoid Worker issues in Deno Deploy
  const salt = bcrypt.genSaltSync(BCRYPT_COST);
  return bcrypt.hashSync(password, salt);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // SECURITY: Only accept bcrypt hashed passwords
  // Legacy formats (SHA-256, plain text) are NO LONGER supported
  if (!storedHash.startsWith('$2')) {
    console.warn('Attempted login with non-bcrypt password hash - access denied');
    return false;
  }
  
  // Use synchronous version to avoid Worker issues in Deno Deploy
  return bcrypt.compareSync(password, storedHash);
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateResetToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos um número' };
  }
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra' };
  }
  
  return { valid: true };
}
