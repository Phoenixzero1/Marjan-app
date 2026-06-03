"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

const identifierSchema = z
  .string()
  .min(1, "این فیلد الزامی است")
  .refine(
    (v) => /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v) || /^09\d{9}$/.test(v),
    "ایمیل یا شماره موبایل معتبر نیست"
  );

const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
});

type LoginData = z.infer<typeof loginSchema>;

function isEmail(v: string) {
  return v.includes("@");
}

const inputStyle: React.CSSProperties = {
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "10px 12px",
  fontFamily: "Vazirmatn",
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"login" | "forgot">("login");
  const [forgotId, setForgotId] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  async function handleLogin(data: LoginData) {
    setLoading(true);
    setError("");
    const credentials = isEmail(data.identifier)
      ? { email: data.identifier, password: data.password }
      : { phone: data.identifier, password: data.password };

    const result = await signIn("credentials", { ...credentials, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("ایمیل / شماره موبایل یا رمز عبور اشتباه است");
    } else {
      router.replace(callbackUrl);
    }
  }

  async function handleForgot() {
    if (!forgotId.trim()) return;
    setLoading(true);
    setForgotMsg("");
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotId }),
      });
      if (res.ok) {
        setForgotMsg("لینک بازیابی رمز ارسال شد. ایمیل یا پیامک خود را بررسی کنید.");
      } else {
        const json = await res.json();
        setError(json.error ?? "خطا در ارسال لینک بازیابی");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "2rem 1rem",
        direction: "rtl",
        fontFamily: "Vazirmatn, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--radius)",
          width: 440,
          maxWidth: "100%",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "var(--primary)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>
            {tab === "login" ? "ورود به حساب" : "بازیابی رمز عبور"}
          </span>
          <Link
            href="/"
            style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
          >
            <i className="ti ti-home" /> بازگشت به سایت
          </Link>
        </div>

        {/* Tabs */}
        {tab === "login" && (
          <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
            <button
              style={{
                flex: 1, padding: "12px", background: "transparent", border: "none",
                borderBottom: "2px solid var(--primary)", marginBottom: -2,
                fontSize: 13, fontWeight: 900, color: "var(--primary)",
                cursor: "pointer", fontFamily: "Vazirmatn",
              }}
            >
              ورود
            </button>
            <Link
              href="/register"
              style={{
                flex: 1, padding: "12px", display: "block", textAlign: "center",
                fontSize: 13, fontWeight: 900, color: "var(--text3)",
                textDecoration: "none", borderBottom: "2px solid transparent", marginBottom: -2,
              }}
            >
              ثبت‌نام
            </Link>
          </div>
        )}

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "#fdf0f0", border: "1px solid #f5c6c6", color: "#c0392b", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleSubmit(handleLogin)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>
                  ایمیل یا شماره موبایل
                </label>
                <input
                  {...register("identifier")}
                  style={inputStyle}
                  placeholder="example@email.com  یا  ۰۹۱۲XXXXXXX"
                  type="text"
                  dir="ltr"
                  autoComplete="username"
                />
                {errors.identifier && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{errors.identifier.message}</span>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>
                  رمز عبور
                </label>
                <input
                  {...register("password")}
                  style={inputStyle}
                  type="password"
                  placeholder="رمز عبور"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--primary)", color: "#fff", border: "none",
                  padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14,
                  fontWeight: 900, fontFamily: "Vazirmatn",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "در حال ورود..." : "ورود"}
              </button>

              <button
                type="button"
                onClick={() => { setTab("forgot"); setError(""); }}
                style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", textAlign: "center" }}
              >
                رمز عبور را فراموش کرده‌ام
              </button>

              <div style={{ textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl })}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: "var(--radius-sm)",
                    border: "1.5px solid var(--border)", background: "#fff",
                    fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn",
                    cursor: "pointer", color: "var(--text)",
                  }}
                >
                  <i className="ti ti-brand-google" style={{ fontSize: 16, color: "#ea4335" }} />
                  ورود با Google
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                ایمیل یا شماره موبایل خود را وارد کنید تا لینک بازیابی رمز برایتان ارسال شود.
              </p>
              {forgotMsg && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                  {forgotMsg}
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>
                  ایمیل یا شماره موبایل
                </label>
                <input
                  style={inputStyle}
                  placeholder="example@email.com  یا  ۰۹۱۲XXXXXXX"
                  type="text"
                  dir="ltr"
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)}
                />
              </div>
              <button
                onClick={handleForgot}
                disabled={loading}
                style={{
                  background: "var(--primary)", color: "#fff", border: "none",
                  padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14,
                  fontWeight: 900, fontFamily: "Vazirmatn",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
              </button>
              <button
                type="button"
                onClick={() => { setTab("login"); setError(""); setForgotMsg(""); setForgotId(""); }}
                style={{ background: "transparent", border: "none", color: "var(--text3)", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer" }}
              >
                بازگشت به ورود
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
