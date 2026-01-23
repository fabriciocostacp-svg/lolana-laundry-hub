/**
 * PII (Personally Identifiable Information) protection utilities
 */

/**
 * Mask CPF showing only last 4 digits
 */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return "***.***.***-**";
  return "***.***.***-" + clean.slice(9);
}

/**
 * Mask CNPJ showing only last 4 digits
 */
export function maskCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return "";
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return "**.***.***/****-**";
  return "**.***.***/****-" + clean.slice(12);
}

/**
 * Mask phone number showing only last 4 digits
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 4) return phone;
  const last4 = clean.slice(-4);
  if (clean.length === 11) {
    return "(XX) XXXXX-" + last4;
  } else if (clean.length === 10) {
    return "(XX) XXXX-" + last4;
  }
  return "*****" + last4;
}

/**
 * Mask address showing only street name
 */
export function maskAddress(address: string | null | undefined): string {
  if (!address) return "";
  const parts = address.split(/,|\s{2,}/);
  if (parts.length > 0) {
    const firstPart = parts[0].trim();
    if (firstPart.length > 30) {
      return firstPart.slice(0, 30) + "...";
    }
    if (parts.length > 1) {
      return firstPart + " ...";
    }
    return firstPart;
  }
  return address.length > 30 ? address.slice(0, 30) + "..." : address;
}

/**
 * Format CPF for display
 */
export function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.slice(0, 3) + "." + clean.slice(3, 6) + "." + clean.slice(6, 9) + "-" + clean.slice(9);
}

/**
 * Format CNPJ for display
 */
export function formatCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return "";
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return cnpj;
  return clean.slice(0, 2) + "." + clean.slice(2, 5) + "." + clean.slice(5, 8) + "/" + clean.slice(8, 12) + "-" + clean.slice(12);
}

/**
 * Determine if user can see full PII based on role
 */
export interface PIIPermissions {
  canViewFullCpf: boolean;
  canViewFullCnpj: boolean;
  canViewFullPhone: boolean;
  canViewFullAddress: boolean;
}

export function getPIIPermissions(isAdmin: boolean): PIIPermissions {
  return {
    canViewFullCpf: isAdmin,
    canViewFullCnpj: isAdmin,
    canViewFullPhone: true,
    canViewFullAddress: true,
  };
}
