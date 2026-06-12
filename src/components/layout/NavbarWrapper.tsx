import { getSiteSettings } from "@/lib/settings";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const s = await getSiteSettings();
  return <Navbar siteName={s.site_name || "Marjan"} siteLogo={s.site_logo || ""} />;
}
