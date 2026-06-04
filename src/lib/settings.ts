import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export const SETTINGS_DEFAULTS: Record<string, string> = {
  site_name: "Marjan",
  site_logo: "",
  site_favicon: "",
  site_phone: "۰۲۱-۴۴۵۵۶۶۷۷",
  site_whatsapp: "۰۹۱۲-۳۴۵-۶۷۸۹",
  site_email: "info@marjan.ir",
  site_address: "تهران، ولیعصر، پلاک ۱۲۳",
  site_hours: "شنبه تا پنجشنبه ۸ تا ۱۷",
  site_free_shipping_text: "ارسال رایگان بالای ۵ میلیون تومان",
  site_footer_text: "© ۱۴۰۴ Marjan — تمام حقوق محفوظ است",
  social_instagram: "#",
  social_telegram: "#",
  social_linkedin: "#",
  social_whatsapp: "#",
};

export const SETTINGS_TAG = "site-settings";

/** Cached site settings — revalidated every hour or on admin save via revalidateTag. */
export const getSiteSettings = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const rows = await prisma.siteSettings.findMany();
      const map: Record<string, string> = { ...SETTINGS_DEFAULTS };
      rows.forEach((r) => { map[r.key] = r.value; });
      return map;
    } catch {
      return { ...SETTINGS_DEFAULTS };
    }
  },
  [SETTINGS_TAG],
  { revalidate: 3600, tags: [SETTINGS_TAG] }
);
