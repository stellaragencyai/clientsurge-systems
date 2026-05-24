/**
 * adminPrivacy.ts — #183
 * Mask phone numbers for non-super-admin users: (602) ***-3227
 */
export function maskPhone(phone: string, isSuperAdmin: boolean = false): string {
  if (isSuperAdmin || !phone) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const area = digits.length >= 10 ? `(${digits.slice(0,3)}) ` : "";
  return `${area}***-${digits.slice(-4)}`;
}

export function maskEmail(email: string, isSuperAdmin: boolean = false): string {
  if (isSuperAdmin || !email) return email;
  const [user, domain] = email.split("@");
  return `${user.slice(0,2)}***@${domain}`;
}
