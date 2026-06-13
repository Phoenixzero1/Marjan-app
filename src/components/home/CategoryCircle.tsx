"use client";

import Link from "next/link";

interface Props {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  iconClass: string;
  count?: string | null;
}

export default function CategoryCircle({ name, slug, imageUrl, iconClass, count }: Props) {
  return (
    <Link
      href={`/category/${slug}`}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        minWidth: 90,
      }}
    >
      <div
        className="cat-circle-img"
        style={{
          background: imageUrl
            ? `url(${imageUrl}) center/cover no-repeat`
            : "linear-gradient(135deg, var(--bg) 0%, var(--bg2) 100%)",
          display: imageUrl ? undefined : "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!imageUrl && (
          <i className={`ti ${iconClass}`} style={{ fontSize: 30, color: "var(--primary)" }} />
        )}
      </div>
      <strong style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", textAlign: "center", lineHeight: 1.3 }}>
        {name}
      </strong>
      {count && (
        <span style={{ fontSize: 10, color: "var(--text3)", marginTop: -6 }}>{count} کالا</span>
      )}
    </Link>
  );
}
