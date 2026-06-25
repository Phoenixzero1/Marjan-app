"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface NotifCounts { orders: number; comments: number; returns: number; sessions: number; logs: number; blog: number; }
export interface SeenCounts { orders: number; comments: number; returns: number; sessions: number; logs: number; blog: number; }

export const ZERO_COUNTS: NotifCounts = { orders: 0, comments: 0, returns: 0, sessions: 0, logs: 0, blog: 0 };
export const ZERO_SEEN: SeenCounts = { orders: 0, comments: 0, returns: 0, sessions: 0, logs: 0, blog: 0 };

interface AdminNotifContextValue {
  counts: NotifCounts;
  seen: SeenCounts;
  refresh: () => void;
  updateSeen: (key: keyof SeenCounts, count: number) => void;
}

export const AdminNotifContext = createContext<AdminNotifContextValue>({
  counts: ZERO_COUNTS,
  seen: ZERO_SEEN,
  refresh: () => {},
  updateSeen: () => {},
});

export function AdminNotifProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<NotifCounts>(ZERO_COUNTS);
  const [seen, setSeen] = useState<SeenCounts>(ZERO_SEEN);

  const refresh = useCallback(() => {
    fetch("/api/admin/notifications/counts")
      .then((r) => r.text())
      .then((t) => { try { const d = t ? JSON.parse(t) : {}; if (d && typeof d.orders === "number") setCounts(d); } catch { /* ignore */ } })
      .catch(() => {});
    fetch("/api/admin/notifications/seen")
      .then((r) => r.text())
      .then((t) => { try { const d = t ? JSON.parse(t) : {}; if (d && typeof d.orders === "number") setSeen(d); } catch { /* ignore */ } })
      .catch(() => {});
  }, []);

  const updateSeen = useCallback((key: keyof SeenCounts, count: number) => {
    setSeen((prev) => ({ ...prev, [key]: count }));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <AdminNotifContext.Provider value={{ counts, seen, refresh, updateSeen }}>
      {children}
    </AdminNotifContext.Provider>
  );
}

export const useAdminNotif = () => useContext(AdminNotifContext);
