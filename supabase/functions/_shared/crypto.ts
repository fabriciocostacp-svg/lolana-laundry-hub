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
  // Check if it's a bcrypt hash (starts with $2)
  if (storedHash.startsWith('$2')) {
    // Use synchronous version to avoid Worker issues in Deno Deploy
    return bcrypt.compareSync(password, storedHash);
  }
  
  // Check if it's legacy SHA-256 format (salt:hash)
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    if (salt && hash) {
      const encoder = new TextEncoder();
      const data = encoder.encode(salt + password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return computedHash === hash;
    }
  }
  
  // Legacy plain text password (for initial migration only)
  // This should be removed after all passwords are migrated
  return password === storedHash;
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
