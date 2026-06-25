import type { NotifCounts, SeenCounts } from "@/components/admin/AdminNotifProvider";

// ─── Types ──────────────────────────────────────────────────────────────────
export type BadgeKey = keyof NotifCounts; // orders | comments | returns | sessions | logs | blog

export interface AdminNavItem {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
  badgeKey?: BadgeKey;
  badgeColor?: string;
}

export interface AdminNavCategory {
  id: string;
  label: string;
  icon: string;
  /** A category with a single direct link and no dropdown (e.g. dashboard). */
  href?: string;
  exact?: boolean;
  items?: AdminNavItem[];
}

// ─── Nav structure — every admin route lives here ────────────────────────────
export const ADMIN_NAV: AdminNavCategory[] = [
  { id: "dashboard", label: "داشبورد", icon: "ti-layout-dashboard", href: "/admin", exact: true },
  {
    id: "shop", label: "فروشگاه", icon: "ti-building-store",
    items: [
      { href: "/admin/products", icon: "ti-package", label: "محصولات" },
      { href: "/admin/categories", icon: "ti-category", label: "دسته‌بندی‌ها" },
      { href: "/admin/brands", icon: "ti-building-factory", label: "برندها" },
      { href: "/admin/coupons", icon: "ti-ticket", label: "تخفیف و کوپن" },
      { href: "/admin/flashdeal", icon: "ti-clock-bolt", label: "مرجان تایم" },
      { href: "/admin/slider", icon: "ti-slideshow", label: "اسلایدر" },
      { href: "/admin/showcase", icon: "ti-photo-check", label: "ویترین تصاویر" },
    ],
  },
  {
    id: "orders", label: "سفارشات", icon: "ti-truck-delivery",
    items: [
      { href: "/admin/orders", icon: "ti-truck-delivery", label: "سفارشات", badgeKey: "orders" },
      { href: "/admin/returns", icon: "ti-arrow-back-up", label: "مرجوعی‌ها", badgeKey: "returns" },
      { href: "/admin/finance", icon: "ti-report-money", label: "مالی" },
      { href: "/admin/org-requests", icon: "ti-building-skyscraper", label: "خرید سازمانی" },
      { href: "/admin/wallet", icon: "ti-wallet", label: "کیف پول" },
    ],
  },
  {
    id: "content", label: "محتوا", icon: "ti-news",
    items: [
      { href: "/admin/blog", icon: "ti-news", label: "بلاگ", badgeKey: "blog" },
      { href: "/admin/faqs", icon: "ti-help-circle", label: "سوالات متداول" },
      { href: "/admin/media", icon: "ti-photo", label: "رسانه‌ها" },
      { href: "/admin/cms", icon: "ti-layout-cms", label: "مدیریت محتوا" },
    ],
  },
  {
    id: "users", label: "کاربران", icon: "ti-users",
    items: [
      { href: "/admin/users", icon: "ti-users", label: "مدیریت کاربران" },
      { href: "/admin/roles", icon: "ti-shield-half-filled", label: "نقش‌ها و دسترسی" },
      { href: "/admin/newsletter", icon: "ti-mail", label: "خبرنامه" },
      { href: "/admin/chat", icon: "ti-messages", label: "مرکز ارتباطات", badgeKey: "comments" },
      { href: "/admin/notifications", icon: "ti-bell", label: "اطلاع‌رسانی" },
    ],
  },
  {
    id: "system", label: "سیستم", icon: "ti-settings",
    items: [
      { href: "/admin/settings", exact: true, icon: "ti-settings", label: "تنظیمات عمومی" },
      { href: "/admin/settings/payment", exact: true, icon: "ti-credit-card", label: "درگاه پرداخت" },
      { href: "/admin/settings/seo", exact: true, icon: "ti-search", label: "سئو" },
      { href: "/admin/settings/security", exact: true, icon: "ti-lock", label: "امنیت" },
      { href: "/admin/connections", icon: "ti-plug-connected", label: "اتصالات" },
      { href: "/admin/backup", icon: "ti-database", label: "پشتیبان‌گیری" },
      { href: "/admin/logs", icon: "ti-terminal-2", label: "لاگ سیستم", badgeKey: "logs", badgeColor: "#c0392b" },
      { href: "/admin/sessions", icon: "ti-device-laptop", label: "نشست‌ها", badgeKey: "sessions" },
      { href: "/admin/trash", icon: "ti-trash", label: "سطل زباله" },
      { href: "/admin/maintenance", icon: "ti-tools", label: "حالت تعمیرات" },
      { href: "/admin/migration", icon: "ti-package-export", label: "انتقال سایت" },
      { href: "/admin/db-schema", icon: "ti-database-export", label: "ساختار پایگاه داده" },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
export function isItemActive(item: { href: string; exact?: boolean }, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function isCategoryActive(cat: AdminNavCategory, pathname: string): boolean {
  if (cat.href) return isItemActive({ href: cat.href, exact: cat.exact }, pathname);
  return (cat.items ?? []).some((it) => isItemActive(it, pathname));
}

/** Unseen badge count for one nav item, or 0. */
export function itemBadgeCount(item: AdminNavItem, counts: NotifCounts, seen: SeenCounts): number {
  if (!item.badgeKey) return 0;
  return Math.max(0, counts[item.badgeKey] - seen[item.badgeKey]);
}

/** Total unseen badge count across a category (for the top-level dot). */
export function categoryBadgeCount(cat: AdminNavCategory, counts: NotifCounts, seen: SeenCounts): number {
  return (cat.items ?? []).reduce((sum, it) => sum + itemBadgeCount(it, counts, seen), 0);
}

/** Resolve the breadcrumb trail (category + page label) for a pathname. */
export function resolveTrail(pathname: string): { category?: string; page: string } {
  for (const cat of ADMIN_NAV) {
    if (cat.href && isItemActive({ href: cat.href, exact: cat.exact }, pathname)) {
      return { page: cat.label };
    }
    for (const it of cat.items ?? []) {
      if (isItemActive(it, pathname)) {
        return { category: cat.label, page: it.label };
      }
    }
  }
  // Dynamic / nested routes (e.g. /admin/products/[id]/edit)
  const parts = pathname.split("/");
  if (parts[2] === "products") {
    if (parts[4] === "edit") return { category: "فروشگاه", page: "ویرایش محصول" };
    if (parts[3] === "new") return { category: "فروشگاه", page: "محصول جدید" };
  }
  return { page: "پنل مدیریت" };
}
