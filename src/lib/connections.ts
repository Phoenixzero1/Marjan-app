// Shared schema for the admin Connections section — used by both the API route
// and the ConnectionsManager UI so config fields stay in sync.

export interface ServiceField {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;   // stored server-side, never returned in full to the client
  required?: boolean; // checked by the "test connection" validation
}

export const SERVICE_FIELDS: Record<string, ServiceField[]> = {
  zarinpal:  [{ key: "merchantId", label: "مرچنت‌آی‌دی", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", secret: true, required: true }],
  idpay:     [{ key: "apiKey", label: "کلید API", secret: true, required: true }],
  nextpay:   [{ key: "apiKey", label: "کلید API", secret: true, required: true }],
  kavenegar: [{ key: "apiKey", label: "کلید API", secret: true, required: true }, { key: "sender", label: "شماره فرستنده", placeholder: "10004346" }],
  ghasedak:  [{ key: "apiKey", label: "کلید API", secret: true, required: true }, { key: "sender", label: "شماره فرستنده" }],
  tipax:     [{ key: "apiKey", label: "کلید API", secret: true, required: true }, { key: "username", label: "نام کاربری" }],
  pishro:    [{ key: "apiKey", label: "کلید API", secret: true, required: true }],
  instagram: [{ key: "pageUrl", label: "آدرس صفحه", placeholder: "https://instagram.com/...", required: true }, { key: "accessToken", label: "توکن دسترسی", secret: true }],
  telegram:  [{ key: "botToken", label: "توکن ربات", secret: true, required: true }, { key: "channelId", label: "شناسه کانال", placeholder: "@channel" }],
  whatsapp:  [{ key: "phoneNumber", label: "شماره واتس‌اپ", placeholder: "98912...", required: true }, { key: "apiToken", label: "توکن API", secret: true }],
  linkedin:  [{ key: "pageUrl", label: "آدرس صفحه", placeholder: "https://linkedin.com/company/...", required: true }],
};

export const CONNECTION_SERVICES = Object.keys(SERVICE_FIELDS);

/** Mask a secret so only the head/tail are visible. */
export function maskValue(v: string): string {
  if (!v) return "";
  if (v.length <= 8) return "••••••••";
  return v.slice(0, 4) + "•".repeat(Math.min(16, v.length - 8)) + v.slice(-4);
}
