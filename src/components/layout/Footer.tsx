import Link from "next/link";
import { prisma } from "@/lib/prisma";

const fallbackCategories = [
  { id: "1", name: "شیرآلات", slug: "valves" },
  { id: "2", name: "لوله‌ها", slug: "pipes" },
  { id: "3", name: "اتصالات", slug: "fittings" },
  { id: "4", name: "پمپ‌ها", slug: "pumps" },
  { id: "5", name: "بهداشتی", slug: "sanitary" },
];

export default async function Footer() {
  let categories = fallbackCategories;
  try {
    const dbCats = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
      select: { id: true, name: true, slug: true },
    });
    if (dbCats.length > 0) categories = dbCats;
  } catch { /* use fallback */ }
  return (
    <footer style={{ background: "var(--primary-dark)", color: "rgba(255,255,255,.75)", marginTop: "4rem" }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "auto",
          padding: "3rem 2rem",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "2.5rem",
        }}
      >
        {/* Brand */}
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: ".75rem" }}>
            Marjan<span style={{ color: "var(--accent)" }}>.</span>
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.8, marginBottom: "1.25rem" }}>
            بیش از ۱۵ سال تجربه در تامین لوازم ساختمانی و تأسیساتی. هزاران قطعه اصل از بهترین برندها با ضمانت کیفیت و تحویل سریع.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: "ti-brand-instagram", color: "#e1306c" },
              { icon: "ti-brand-telegram", color: "#229ed9" },
              { icon: "ti-brand-linkedin", color: "#0077b5" },
              { icon: "ti-brand-whatsapp", color: "#25d366" },
            ].map((s) => (
              <a
                key={s.icon}
                href="#"
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255,255,255,.1)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "rgba(255,255,255,.7)",
                  transition: "all .2s",
                }}
              >
                <i className={`ti ${s.icon}`} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: "1rem" }}>
            دسترسی سریع
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "محصولات", href: "/products" },
              { label: "وبلاگ", href: "/blog" },
              { label: "فاکتورساز", href: "/invoice" },
              { label: "درباره ما", href: "/about" },
              { label: "تماس با ما", href: "/contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: "1rem" }}>
            دسته‌بندی‌ها
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/category/${cat.slug}`} style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: "1rem" }}>
            اطلاعات تماس
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <i className="ti ti-phone" style={{ color: "var(--accent)", fontSize: 16 }} />
              ۰۲۱-۴۴۵۵۶۶۷۷
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <i className="ti ti-brand-whatsapp" style={{ color: "var(--accent)", fontSize: 16 }} />
              ۰۹۱۲-۳۴۵-۶۷۸۹
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <i className="ti ti-mail" style={{ color: "var(--accent)", fontSize: 16 }} />
              info@marjan.ir
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <i className="ti ti-map-pin" style={{ color: "var(--accent)", fontSize: 16 }} />
              تهران، ولیعصر، پلاک ۱۲۳
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "auto",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <span>© ۱۴۰۴ Marjan — تمام حقوق محفوظ است</span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/terms" style={{ color: "rgba(255,255,255,.5)" }}>
              قوانین و مقررات
            </Link>
            <Link href="/privacy" style={{ color: "rgba(255,255,255,.5)" }}>
              حریم خصوصی
            </Link>
          </div>
          {/* Enamad / trust badges */}
          <div style={{ display: "flex", gap: 8 }}>
            {["اینماد", "رسمی"].map((t) => (
              <div
                key={t}
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255,255,255,.1)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "rgba(255,255,255,.5)",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
