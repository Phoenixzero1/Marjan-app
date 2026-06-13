import Link from "next/link";

interface Props {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export default function BrandCard({ name, slug, logoUrl }: Props) {
  return (
    <Link href={`/brand/${slug}`} className="brand-card">
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
