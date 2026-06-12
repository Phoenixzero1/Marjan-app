"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface WishlistButtonProps {
  productId: string;
  size?: number;
}

export default function WishlistButton({ productId, size = 32 }: WishlistButtonProps) {
  const { data: session } = useSession();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authHint, setAuthHint] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/wishlist/check?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setInWishlist(d.inWishlist ?? false))
      .catch(() => {});
  }, [productId, session]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      setAuthHint(true);
      setTimeout(() => setAuthHint(false), 2200);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.added) setInWishlist(true);
      if (data.removed) setInWishlist(false);
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={toggle}
        title={inWishlist ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: loading ? "wait" : "pointer",
          transition: "all .2s",
          boxShadow: "0 1px 6px rgba(0,0,0,.16)",
          padding: 0,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!loading) (e.currentTarget as HTMLElement).style.background = "#fff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.92)";
        }}
      >
        <i
          className={loading ? "ti ti-loader" : inWishlist ? "ti ti-heart-filled" : "ti ti-heart"}
          style={{
            fontSize: Math.round(size * 0.52),
            color: inWishlist ? "#e74c3c" : "var(--text3)",
            transition: "color .2s",
            animation: loading ? "spin .7s linear infinite" : "none",
          }}
        />
      </button>

      {authHint && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: "50%",
            transform: "translateX(50%)",
            background: "var(--primary)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "5px 10px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,.2)",
          }}
        >
          ابتدا وارد شوید
        </div>
      )}
    </div>
  );
}
