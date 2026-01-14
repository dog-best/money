/**
 * tiny util to generate referral codes (keeps same behaviour as before)
 * example: uid.slice(0,6).toUpperCase()
 */
export function generateReferralCode(uid: string) {
  return uid.slice(0, 6).toUpperCase();
}
export function generateReference(prefix: string) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `${prefix}-${timestamp}-${random}`;
}
