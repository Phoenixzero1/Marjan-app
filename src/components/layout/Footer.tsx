import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

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
      where: { parentId: null, isActive: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      take: 6,
      select: { id: true, name: true, slug: true },
    });
    if (dbCats.length > 0) categories = dbCats;
  } catch { /* use fallback */ }

  const s = await getSiteSettings();
  return (
    <footer style={{ background: "var(--primary-dark)", color: "rgba(255,255,255,.75)", marginTop: "4rem" }}>
      <style>{`
        .footer-link {
          font-size: 13px;
          color: rgba(255,255,255,.6);
          text-decoration: none;
          transition: color .2s;
        }
        .footer-link:hover { color: #e8920a; }
        .footer-bottom-link {
          color: rgba(255,255,255,.5);
          text-decoration: none;
          transition: color .2s;
        }
        .footer-bottom-link:hover { color: #e8920a; }
        .soc-btn {
          width: 36px; height: 36px;
          background: rgba(255,255,255,.1);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          color: rgba(255,255,255,.7);
          text-decoration: none;
          transition: background .2s, color .2s;
        }
        .soc-btn:hover { background: #e8920a; color: #fff; }
      `}</style>
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
            {s.site_name || "Marjan"}<span style={{ color: "var(--accent)" }}>.</span>
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.8, marginBottom: "1.25rem" }}>
            بیش از ۱۵ سال تجربه در تامین لوازم ساختمانی و تأسیساتی. هزاران قطعه اصل از بهترین برندها با ضمانت کیفیت و تحویل سریع.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: "ti-brand-instagram", color: "#e1306c", href: s.social_instagram || "#" },
              { icon: "ti-brand-telegram", color: "#229ed9", href: s.social_telegram || "#" },
              { icon: "ti-brand-linkedin", color: "#0077b5", href: s.social_linkedin || "#" },
              { icon: "ti-brand-whatsapp", color: "#25d366", href: s.social_whatsapp || "#" },
            ].map((social) => (
              <a
                key={social.icon}
                href={social.href || "#"}
                target={social.href && social.href !== "#" ? "_blank" : undefined}
                rel="noreferrer"
                className="soc-btn"
              >
                <i className={`ti ${social.icon}`} />
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
                <Link href={l.href} className="footer-link">
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
                <Link href={`/category/${cat.slug}`} className="footer-link">
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
              {s.site_phone}
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <i className="ti ti-brand-whatsapp" style={{ color: "var(--accent)", fontSize: 16 }} />
              {s.site_whatsapp}
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <i className="ti ti-mail" style={{ color: "var(--accent)", fontSize: 16 }} />
              {s.site_email}
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <i className="ti ti-map-pin" style={{ color: "var(--accent)", fontSize: 16 }} />
              {s.site_address}
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
          <span>{s.site_footer_text}</span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/terms" className="footer-bottom-link">
              قوانین و مقررات
            </Link>
            <Link href="/privacy" className="footer-bottom-link">
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
