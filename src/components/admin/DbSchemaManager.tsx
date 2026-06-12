"use client";

interface Field { name: string; type: string; note?: string; }
interface Table { name: string; icon: string; color: string; fields: Field[]; }

const TABLES: Table[] = [
  {
    name: "User", icon: "ti-user", color: "#0284c7",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "firstName", type: "String" },
      { name: "lastName", type: "String" },
      { name: "phone", type: "String?", note: "منحصربه‌فرد" },
      { name: "email", type: "String?", note: "منحصربه‌فرد" },
      { name: "passwordHash", type: "String?" },
      { name: "role", type: "UserRole", note: "CUSTOMER|ADMIN|..." },
      { name: "status", type: "UserStatus", note: "ACTIVE|SUSPENDED|..." },
      { name: "walletBalance", type: "Int", note: "ریال" },
      { name: "createdAt", type: "DateTime" },
    ],
  },
  {
    name: "Product", icon: "ti-package", color: "#16a34a",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "name", type: "String" },
      { name: "slug", type: "String", note: "منحصربه‌فرد" },
      { name: "sku", type: "String?" },
      { name: "price", type: "Int", note: "ریال" },
      { name: "comparePrice", type: "Int?" },
      { name: "stockQty", type: "Int" },
      { name: "status", type: "ProductStatus", note: "PUBLISHED|DRAFT|..." },
      { name: "categoryId", type: "String?", note: "FK → Category" },
      { name: "brandId", type: "String?", note: "FK → Brand" },
      { name: "createdAt", type: "DateTime" },
    ],
  },
  {
    name: "Order", icon: "ti-truck-delivery", color: "#7c3aed",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "orderNumber", type: "String", note: "منحصربه‌فرد" },
      { name: "userId", type: "String?", note: "FK → User" },
      { name: "status", type: "OrderStatus", note: "PENDING|SHIPPED|..." },
      { name: "subtotal", type: "Int" },
      { name: "discountAmount", type: "Int" },
      { name: "shippingCost", type: "Int" },
      { name: "taxAmount", type: "Int" },
      { name: "totalAmount", type: "Int" },
      { name: "trackingCode", type: "String?" },
      { name: "createdAt", type: "DateTime" },
    ],
  },
  {
    name: "Category", icon: "ti-category", color: "#ea580c",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "name", type: "String" },
      { name: "slug", type: "String", note: "منحصربه‌فرد" },
      { name: "parentId", type: "String?", note: "FK → Category" },
      { name: "imageUrl", type: "String?" },
      { name: "sortOrder", type: "Int" },
      { name: "isActive", type: "Boolean" },
    ],
  },
  {
    name: "Brand", icon: "ti-building-factory", color: "#be185d",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "name", type: "String" },
      { name: "slug", type: "String", note: "منحصربه‌فرد" },
      { name: "logoUrl", type: "String?" },
      { name: "isActive", type: "Boolean" },
      { name: "sortOrder", type: "Int" },
    ],
  },
  {
    name: "Wallet / WalletTx", icon: "ti-wallet", color: "#0369a1",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "userId", type: "String", note: "FK → User (منحصربه‌فرد)" },
      { name: "balance", type: "Int", note: "کیف‌پول (WalletTx)" },
      { name: "type", type: "TxType", note: "DEPOSIT|WITHDRAWAL|REFUND" },
      { name: "amount", type: "Int" },
      { name: "description", type: "String?" },
      { name: "createdAt", type: "DateTime" },
    ],
  },
  {
    name: "SystemLog", icon: "ti-terminal-2", color: "#475569",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "level", type: "LogLevel", note: "INFO|WARNING|ERROR|CRITICAL" },
      { name: "action", type: "String" },
      { name: "details", type: "Json?" },
      { name: "ipAddress", type: "String?" },
      { name: "userAgent", type: "String?" },
      { name: "userId", type: "String?", note: "FK → User" },
      { name: "createdAt", type: "DateTime" },
    ],
  },
  {
    name: "Notification", icon: "ti-bell", color: "#ca8a04",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "userId", type: "String", note: "FK → User" },
      { name: "type", type: "NotifType", note: "ORDER_UPDATE|PAYMENT|..." },
      { name: "title", type: "String" },
      { name: "body", type: "String" },
      { name: "isRead", type: "Boolean" },
      { name: "link", type: "String?" },
      { name: "createdAt", type: "DateTime" },
    ],
  },
  {
    name: "Coupon", icon: "ti-ticket", color: "#16a34a",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "code", type: "String", note: "منحصربه‌فرد" },
      { name: "type", type: "CouponType", note: "PERCENT|FIXED" },
      { name: "value", type: "Float" },
      { name: "minOrder", type: "Int?" },
      { name: "maxUses", type: "Int?" },
      { name: "usedCount", type: "Int" },
      { name: "expiresAt", type: "DateTime?" },
      { name: "isActive", type: "Boolean" },
    ],
  },
  {
    name: "Review", icon: "ti-star", color: "#f59e0b",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "userId", type: "String", note: "FK → User" },
      { name: "productId", type: "String", note: "FK → Product" },
      { name: "rating", type: "Int", note: "۱ تا ۵" },
      { name: "title", type: "String?" },
      { name: "body", type: "String?" },
      { name: "status", type: "ReviewStatus", note: "PENDING|APPROVED|..." },
      { name: "createdAt", type: "DateTime" },
    ],
  },
  {
    name: "BlogPost", icon: "ti-news", color: "#0284c7",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "title", type: "String" },
      { name: "slug", type: "String", note: "منحصربه‌فرد" },
      { name: "status", type: "PostStatus", note: "DRAFT|PUBLISHED|ARCHIVED" },
      { name: "authorId", type: "String?", note: "FK → User" },
      { name: "views", type: "Int" },
      { name: "publishedAt", type: "DateTime?" },
      { name: "createdAt", type: "DateTime" },
    ],
  },
  {
    name: "Address", icon: "ti-map-pin", color: "#dc2626",
    fields: [
      { name: "id", type: "String", note: "UUID, PK" },
      { name: "userId", type: "String", note: "FK → User" },
      { name: "fullName", type: "String" },
      { name: "province", type: "String" },
      { name: "city", type: "String" },
      { name: "street", type: "String" },
      { name: "postalCode", type: "String?" },
      { name: "isDefault", type: "Boolean" },
    ],
  },
];

export default function DbSchemaManager() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>ساختار پایگاه داده</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>{TABLES.length} جدول اصلی — بر اساس Prisma Schema</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {TABLES.map((table) => (
          <div key={table.name} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ padding: "12px 16px", background: table.color, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`ti ${table.icon}`} style={{ fontSize: 17, color: "#fff" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{table.name}</span>
              <span style={{ marginRight: "auto", fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>{table.fields.length} فیلد</span>
            </div>

            {/* Fields */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["فیلد", "نوع", "توضیح"].map(h => (
                    <th key={h} style={{ padding: "7px 12px", background: "var(--bg)", textAlign: "right", fontSize: 10, fontWeight: 900, color: "var(--text2)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.fields.map((f, i) => (
                  <tr key={f.name} style={{ borderBottom: i < table.fields.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "7px 12px", fontWeight: 900, fontFamily: "monospace", fontSize: 11, color: "var(--primary)" }}>{f.name}</td>
                    <td style={{ padding: "7px 12px" }}>
                      <span style={{ background: "#e0f2fe", color: "#0284c7", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 900, fontFamily: "monospace" }}>{f.type}</span>
                    </td>
                    <td style={{ padding: "7px 12px", color: "var(--text3)", fontSize: 10 }}>{f.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.5rem", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)" }}>راهنما:</div>
        {[
          { label: "String?", desc: "nullable string" },
          { label: "PK", desc: "Primary Key" },
          { label: "FK → X", desc: "Foreign Key به جدول X" },
          { label: "منحصربه‌فرد", desc: "@@unique constraint" },
        ].map(({ label, desc }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 900, fontFamily: "monospace" }}>{label}</span>
            <span style={{ color: "var(--text3)" }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
