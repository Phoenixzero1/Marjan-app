"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/store/cart";

interface ProductSize {
  id: string;
  label: string;
  unit: string;
  price: number | null;
  stock: number;
}

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  lowStockAlert: number;
  description: string | null;
  shortDesc: string | null;
  isFeatured: boolean;
  isNew: boolean;
  tags: string[];
  avgRating: number;
  images: ProductImage[];
  sizes: ProductSize[];
  reviews: Review[];
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  images: ProductImage[];
  brand: { name: string } | null;
  sizes: ProductSize[];
}

function formatPrice(n: number) {
  return n.toLocaleString("fa-IR");
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, openCart } = useCart();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setProduct(data.product);
        setRelated(data.related ?? []);
        const primaryIdx = data.product.images.findIndex((i: ProductImage) => i.isPrimary);
        setSelectedImage(primaryIdx >= 0 ? primaryIdx : 0);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Vazirmatn" }}>
        <i className="ti ti-package-off" style={{ fontSize: 56, color: "var(--text3)" }} />
        <h2 style={{ fontSize: 20, fontWeight: 900 }}>محصول یافت نشد</h2>
        <Link href="/products" style={{ color: "var(--primary)", fontWeight: 700 }}>بازگشت به فروشگاه</Link>
      </div>
    );
  }

  const displayPrice = selectedSize?.price ?? product.price;
  const discountPct =
    product.comparePrice && product.comparePrice > displayPrice
      ? Math.round(((product.comparePrice - displayPrice) / product.comparePrice) * 100)
      : 0;
  const inStock = selectedSize ? selectedSize.stock > 0 : product.stockQty > 0;
  const lowStock = selectedSize
    ? selectedSize.stock > 0 && selectedSize.stock <= product.lowStockAlert
    : product.stockQty > 0 && product.stockQty <= product.lowStockAlert;

  function handleAddToCart() {
    addItem({
      id: product!.id,
      name: product!.name,
      price: displayPrice,
      imageUrl: product!.images[0]?.url ?? "",
      sizeLabel: selectedSize?.label,
      quantity: qty,
    });
    setAddedToCart(true);
    openCart();
    setTimeout(() => setAddedToCart(false), 2000);
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "Vazirmatn" }}>
      {/* Breadcrumb */}
      <nav style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "var(--text3)", marginBottom: 24, flexWrap: "wrap" }}>
        <Link href="/" style={{ color: "var(--text3)", textDecoration: "none" }}>خانه</Link>
        <i className="ti ti-chevron-left" style={{ fontSize: 11 }} />
        {product.category?.parent && (
          <>
            <Link href={`/category/${product.category.parent.slug}`} style={{ color: "var(--text3)", textDecoration: "none" }}>
              {product.category.parent.name}
            </Link>
            <i className="ti ti-chevron-left" style={{ fontSize: 11 }} />
          </>
        )}
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} style={{ color: "var(--text3)", textDecoration: "none" }}>
              {product.category.name}
            </Link>
            <i className="ti ti-chevron-left" style={{ fontSize: 11 }} />
          </>
        )}
        <span style={{ color: "var(--text2)", fontWeight: 700 }}>{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 40, marginBottom: 48 }}>
        {/* ── Images ── */}
        <div>
          <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 12, position: "relative", background: "#fafafa" }}>
            {product.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[selectedImage]?.url}
                alt={product.images[selectedImage]?.altText ?? product.name}
                style={{ width: "100%", height: 420, objectFit: "contain", display: "block" }}
              />
            ) : (
              <div style={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-photo-off" style={{ fontSize: 64, color: "var(--border)" }} />
              </div>
            )}
            {discountPct > 0 && (
              <span style={{ position: "absolute", top: 12, right: 12, background: "#e74c3c", color: "#fff", fontSize: 12, fontWeight: 900, padding: "3px 10px", borderRadius: 20 }}>
                {discountPct}٪ تخفیف
              </span>
            )}
            {product.isNew && (
              <span style={{ position: "absolute", top: 12, left: 12, background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20 }}>
                جدید
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  style={{
                    width: 64, height: 64, border: `2px solid ${i === selectedImage ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)", overflow: "hidden", background: "#fafafa", cursor: "pointer", padding: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.altText ?? ""} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Brand + Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {product.brand && (
              <Link href={`/products?brandId=${product.brand.slug}`} style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
                {product.brand.name}
              </Link>
            )}
            {product.sku && (
              <span style={{ fontSize: 11, color: "var(--text3)", direction: "ltr" }}>SKU: {product.sku}</span>
            )}
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", lineHeight: 1.5, margin: 0 }}>
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {[1,2,3,4,5].map((s) => (
                <i
                  key={s}
                  className={s <= Math.round(product.avgRating) ? "ti ti-star-filled" : "ti ti-star"}
                  style={{ fontSize: 16, color: "#f39c12" }}
                />
              ))}
              <span style={{ fontSize: 12, color: "var(--text3)" }}>({product.reviews.length} نظر)</span>
            </div>
          )}

          {product.shortDesc && (
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8, margin: 0 }}>{product.shortDesc}</p>
          )}

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "var(--primary)" }}>
              {formatPrice(displayPrice)} <span style={{ fontSize: 14, fontWeight: 700 }}>تومان</span>
            </span>
            {product.comparePrice && product.comparePrice > displayPrice && (
              <span style={{ fontSize: 16, color: "var(--text3)", textDecoration: "line-through" }}>
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Stock status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700,
              color: inStock ? "#1a7a4a" : "#c0392b",
              background: inStock ? "#e8f5e9" : "#fdecea",
              padding: "4px 10px", borderRadius: 20,
            }}>
              <i className={inStock ? "ti ti-circle-check" : "ti ti-circle-x"} />
              {inStock ? (lowStock ? "موجودی محدود" : "موجود") : "ناموجود"}
            </span>
          </div>

          {/* Size selector */}
          {product.sizes.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 8 }}>
                انتخاب سایز / اندازه
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {product.sizes.map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setSelectedSize(selectedSize?.id === sz.id ? null : sz)}
                    disabled={sz.stock === 0}
                    style={{
                      padding: "7px 16px",
                      border: `2px solid ${selectedSize?.id === sz.id ? "var(--primary)" : "var(--border)"}`,
                      borderRadius: "var(--radius-sm)",
                      background: selectedSize?.id === sz.id ? "var(--primary)" : "#fff",
                      color: selectedSize?.id === sz.id ? "#fff" : sz.stock === 0 ? "var(--text3)" : "var(--text)",
                      fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn",
                      cursor: sz.stock === 0 ? "not-allowed" : "pointer",
                      opacity: sz.stock === 0 ? 0.5 : 1,
                    }}
                  >
                    {sz.label} {sz.unit !== "PIECE" ? sz.unit.toLowerCase() : ""}
                    {sz.price && sz.price !== product.price ? ` — ${formatPrice(sz.price)}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 36, height: 44, background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text)" }}>−</button>
              <span style={{ width: 40, textAlign: "center", fontSize: 15, fontWeight: 700 }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: 36, height: 44, background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text)" }}>+</button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              style={{
                flex: 1, height: 44, background: inStock ? "var(--primary)" : "var(--border)",
                color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
                fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn",
                cursor: inStock ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s",
              }}
            >
              <i className={addedToCart ? "ti ti-check" : "ti ti-shopping-cart"} />
              {addedToCart ? "افزوده شد!" : inStock ? "افزودن به سبد خرید" : "ناموجود"}
            </button>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700 }}>برچسب‌ها:</span>
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?q=${encodeURIComponent(tag)}`}
                  style={{ fontSize: 11, background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 10px", borderRadius: 20, color: "var(--text2)", textDecoration: "none" }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description + Reviews Tabs */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
          {/* Description */}
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", borderBottom: "2px solid var(--primary)", paddingBottom: 10, marginBottom: 20 }}>
              توضیحات محصول
            </h2>
            {product.description ? (
              <div
                style={{ fontSize: 13, color: "var(--text2)", lineHeight: 2 }}
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p style={{ fontSize: 13, color: "var(--text3)" }}>توضیحاتی برای این محصول ثبت نشده است.</p>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", borderBottom: "2px solid var(--primary)", paddingBottom: 10, marginBottom: 20 }}>
              نظرات ({product.reviews.length})
            </h2>
            {product.reviews.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text3)" }}>هنوز نظری ثبت نشده است.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {product.reviews.map((rev) => (
                  <div key={rev.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>
                        {rev.user.firstName} {rev.user.lastName}
                      </span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map((s) => (
                          <i key={s} className={s <= rev.rating ? "ti ti-star-filled" : "ti ti-star"} style={{ fontSize: 12, color: "#f39c12" }} />
                        ))}
                      </div>
                    </div>
                    {rev.title && <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{rev.title}</p>}
                    {rev.content && <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>{rev.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", borderBottom: "2px solid var(--border)", paddingBottom: 10, marginBottom: 24 }}>
            محصولات مرتبط
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {related.map((p) => {
              const disc = p.comparePrice && p.comparePrice > p.price
                ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
                : 0;
              return (
                <Link key={p.id} href={`/product/${p.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", background: "#fff", transition: "box-shadow 0.2s" }}>
                    <div style={{ position: "relative", background: "#fafafa" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0]?.url ?? "/placeholder.png"}
                        alt={p.name}
                        style={{ width: "100%", height: 140, objectFit: "contain", display: "block" }}
                      />
                      {disc > 0 && (
                        <span style={{ position: "absolute", top: 6, right: 6, background: "#e74c3c", color: "#fff", fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 20 }}>
                          {disc}٪
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "10px 10px 12px" }}>
                      <p style={{ fontSize: 12, color: "var(--text)", fontWeight: 700, lineHeight: 1.5, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.name}
                      </p>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)" }}>
                        {formatPrice(p.price)} تومان
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
