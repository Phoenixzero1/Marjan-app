import { auth } from "./auth";
import { prisma } from "./prisma";

export type Permission =
  | "VIEW_ADMIN"
  | "EDIT_PRODUCTS"
  | "DELETE_PRODUCTS"
  | "MANAGE_CATEGORIES"
  | "MANAGE_BLOG"
  | "MANAGE_MEDIA"
  | "VIEW_ORDERS"
  | "EDIT_ORDERS"
  | "MANAGE_USERS"
  | "MANAGE_ROLES"
  | "MANAGE_COUPONS"
  | "VIEW_FINANCE"
  | "MANAGE_SETTINGS"
  | "MANAGE_BACKUP"
  | "VIEW_LOGS"
  | "SEND_NOTIFICATIONS"
  | "MANAGE_RETURNS";

export const ALL_PERMISSIONS: Permission[] = [
  "VIEW_ADMIN", "EDIT_PRODUCTS", "DELETE_PRODUCTS", "MANAGE_CATEGORIES",
  "MANAGE_BLOG", "MANAGE_MEDIA", "VIEW_ORDERS", "EDIT_ORDERS",
  "MANAGE_USERS", "MANAGE_ROLES", "MANAGE_COUPONS", "VIEW_FINANCE",
  "MANAGE_SETTINGS", "MANAGE_BACKUP", "VIEW_LOGS", "SEND_NOTIFICATIONS",
  "MANAGE_RETURNS",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  VIEW_ADMIN:         "مشاهده پنل ادمین",
  EDIT_PRODUCTS:      "ویرایش محصولات",
  DELETE_PRODUCTS:    "حذف محصولات",
  MANAGE_CATEGORIES:  "مدیریت دسته‌بندی‌ها",
  MANAGE_BLOG:        "مدیریت بلاگ",
  MANAGE_MEDIA:       "مدیریت رسانه‌ها",
  VIEW_ORDERS:        "مشاهده سفارشات",
  EDIT_ORDERS:        "ویرایش سفارشات",
  MANAGE_USERS:       "مدیریت کاربران",
  MANAGE_ROLES:       "مدیریت نقش‌ها و دسترسی",
  MANAGE_COUPONS:     "مدیریت کوپن‌ها",
  VIEW_FINANCE:       "مشاهده مالی",
  MANAGE_SETTINGS:    "تنظیمات سایت",
  MANAGE_BACKUP:      "پشتیبان‌گیری",
  VIEW_LOGS:          "مشاهده لاگ‌ها",
  SEND_NOTIFICATIONS: "ارسال اعلان",
  MANAGE_RETURNS:     "مدیریت مرجوعی‌ها",
};

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  CUSTOMER: [],
  CONTRACTOR: [],
  CONTENT_MANAGER: [
    "VIEW_ADMIN", "EDIT_PRODUCTS", "MANAGE_CATEGORIES",
    "MANAGE_BLOG", "MANAGE_MEDIA",
  ],
  ADMIN: [
    "VIEW_ADMIN", "EDIT_PRODUCTS", "DELETE_PRODUCTS", "MANAGE_CATEGORIES",
    "MANAGE_BLOG", "MANAGE_MEDIA", "VIEW_ORDERS", "EDIT_ORDERS",
    "MANAGE_USERS", "MANAGE_COUPONS", "VIEW_FINANCE",
    "MANAGE_RETURNS", "SEND_NOTIFICATIONS", "VIEW_LOGS",
    "MANAGE_BACKUP", "MANAGE_SETTINGS",
  ],
  SUPER_ADMIN: [...ALL_PERMISSIONS],
};

/** Returns true if the session's user has the given permission. */
export function sessionHasPermission(
  session: { user: { role?: string | null } } | null,
  permission: Permission,
  overrides: Array<{ permission: string; granted: boolean }> = []
): boolean {
  if (!session?.user) return false;
  const role = session.user.role ?? "";
  if (role === "SUPER_ADMIN") return true;

  // Check explicit per-user override first
  const override = overrides.find((o) => o.permission === permission);
  if (override !== undefined) return override.granted;

  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

/**
 * Auth + permission guard for API routes.
 * Returns the session on success, null on forbidden.
 */
export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) return null;

  const role = (session.user as { role?: string; id?: string }).role ?? "";

  // Super admin always passes — no DB query needed
  if (role === "SUPER_ADMIN") return session;

  // Fast path: check role defaults first (no DB hit)
  const rolePerms = ROLE_PERMISSIONS[role] ?? [];
  if (!rolePerms.includes(permission)) {
    // Role doesn't have this permission by default — check for per-user grant override
    const userId = (session.user as { id?: string }).id;
    if (!userId) return null;

    const override = await prisma.userPermission.findUnique({
      where: { userId_permission: { userId, permission } },
      select: { granted: true },
    });
    return override?.granted === true ? session : null;
  }

  // Role has this permission by default — check for explicit revocation
  const userId = (session.user as { id?: string }).id;
  if (!userId) return session; // no id means can't have overrides, allow by role

  const override = await prisma.userPermission.findUnique({
    where: { userId_permission: { userId, permission } },
    select: { granted: true },
  });

  // If no override or override grants it, allow; if override explicitly revokes it, deny
  if (override !== null && override?.granted === false) return null;
  return session;
}
