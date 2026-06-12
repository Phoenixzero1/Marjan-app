"use client";

import Link from "next/link";

interface Props {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export default function BrandCard({ name, slug, logoUrl }: Props) {
  return (
    <Link
      href={`/brand/${slug}`}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        textDecoration: "none",
        padding: "12px 16px",
        borderRadius: "var(--radius-sm)",
        border: "1.5px solid var(--border)",
        transition: "border-color .2s",
        minWidth: 100,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
        (e.currentTarget as HTMLElement).style.background = "var(--accent-light)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.background = "";
      }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          style={{ height: 40, width: "auto", maxWidth: 80, objectFit: "contain" }}
        />
      ) : (
        <div style={{ height: 40, width: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-building-factory" style={{ fontSize: 28, color: "var(--text3)" }} />
        </div>
      )}
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>{name}</span>
    </Link>
  );
}
