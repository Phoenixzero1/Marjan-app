export default function AdminLoading() {
  return (
    <div style={{ direction: "rtl" }}>
      {/* Page header skeleton */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="admin-skel" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div>
            <div className="admin-skel" style={{ width: 180, height: 18, marginBottom: 8 }} />
            <div className="admin-skel" style={{ width: 120, height: 12 }} />
          </div>
        </div>
        <div className="admin-skel" style={{ width: 120, height: 38, borderRadius: 8 }} />
      </div>

      {/* KPI cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="admin-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div className="admin-skel" style={{ width: 36, height: 36, borderRadius: "50%" }} />
              <div className="admin-skel" style={{ width: 80, height: 12 }} />
            </div>
            <div className="admin-skel" style={{ width: 90, height: 26, marginBottom: 12 }} />
            <div className="admin-skel" style={{ width: "100%", height: 12 }} />
          </div>
        ))}
      </div>

      {/* Large content block */}
      <div className="admin-card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div className="admin-skel" style={{ width: 200, height: 16, marginBottom: 18 }} />
        <div className="admin-skel" style={{ width: "100%", height: 240, borderRadius: 10 }} />
      </div>

      {/* Table-ish rows */}
      <div className="admin-card" style={{ padding: "1.25rem" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
            <div className="admin-skel" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div className="admin-skel" style={{ flex: 1, height: 12 }} />
            <div className="admin-skel" style={{ width: 70, height: 12 }} />
            <div className="admin-skel" style={{ width: 50, height: 24, borderRadius: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
