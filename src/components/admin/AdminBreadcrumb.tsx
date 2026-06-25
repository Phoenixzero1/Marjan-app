"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveTrail } from "@/components/admin/adminNav";

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const { category, page } = resolveTrail(pathname);

  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid var(--border)", flexShrink: 0,
      padding: "0 18px", height: 42, display: "flex", alignItems: "center", gap: 7,
    }}>
      <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text3)", fontWeight: 700, textDecoration: "none" }}>
        <i className="ti ti-home" style={{ fontSize: 14 }} /> خانه
      </Link>
      {category && (
        <>
          <i className="ti ti-chevron-left" style={{ fontSize: 11, color: "var(--text3)", opacity: 0.6 }} />
          <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>{category}</span>
        </>
      )}
      <i className="ti ti-chevron-left" style={{ fontSize: 11, color: "var(--text3)", opacity: 0.6 }} />
      <span style={{ fontSize: 12.5, color: "var(--primary)", fontWeight: 900 }}>{page}</span>
    </div>
  );
}
