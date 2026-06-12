import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

const PUBLIC_KEYS = [
  "site_name",
  "site_logo",
  "site_phone",
  "site_hours",
  "site_email",
  "site_address",
  "site_footer_text",
  "site_free_shipping_text",
];

export async function GET() {
  const all = await getSiteSettings();
  const pub: Record<string, string> = {};
  for (const key of PUBLIC_KEYS) {
    if (all[key] !== undefined) pub[key] = all[key];
  }
  return NextResponse.json(pub, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
