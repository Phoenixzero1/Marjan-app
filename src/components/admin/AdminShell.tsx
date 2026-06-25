"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminNotifProvider } from "@/components/admin/AdminNotifProvider";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role ?? "";
      if (!["ADMIN", "SUPER_ADMIN"].includes(role)) router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", flexDirection: "column", gap: 12 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 32, color: "var(--primary)", opacity: 0.5 }} />
        <div style={{ fontSize: 13, color: "var(--text3)", fontFamily: "Vazirmatn" }}>در حال بارگذاری پنل...</div>
      </div>
    );
  }

  if (status !== "authenticated") return null;
  const role = (session?.user as { role?: string })?.role ?? "";
  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) return null;

  return (
    <AdminNotifProvider>
      <TooltipProvider>
        <div style={{ position: "fixed", inset: 0, zIndex: 200, direction: "rtl", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
          <AdminTopNav />
          <AdminBreadcrumb />
          <div className="admin-main" style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
            <div style={{ padding: "1.25rem", maxWidth: 1600, margin: "0 auto" }}>
              {children}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </AdminNotifProvider>
  );
}
