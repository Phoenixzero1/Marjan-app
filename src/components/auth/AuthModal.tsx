"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Accepts email OR Iranian mobile number
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

const registerSchema = z.object({
  firstName: z.string().min(2, "نام الزامی است"),
  lastName: z.string().min(2, "نام خانوادگی الزامی است"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

function isEmail(v: string) {
  return v.includes("@");
}

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotIdentifier, setForgotIdentifier] = useState("");

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

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
      onClose();
    }
  }

  async function handleRegister(data: RegisterData) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "خطا در ثبت‌نام");
      } else {
        setSuccess("ثبت‌نام موفق! در حال ورود...");
        await signIn("credentials", { phone: data.phone, password: data.password, redirect: false });
        setTimeout(onClose, 1000);
      }
    } finally {
      setLoading(false);
    }
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
    marginBottom: 4,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--radius)",
          width: 440,
          maxWidth: "95vw",
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
            {tab === "login" ? "ورود به حساب" : tab === "register" ? "ثبت‌نام" : "بازیابی رمز"}
          </span>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.7)", fontSize: 20, cursor: "pointer" }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setSuccess(""); }}
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                border: "none",
                borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent",
                marginBottom: -2,
                fontSize: 13,
                fontWeight: 900,
                color: tab === t ? "var(--primary)" : "var(--text3)",
                cursor: "pointer",
                fontFamily: "Vazirmatn",
              }}
            >
              {t === "login" ? "ورود" : "ثبت‌نام"}
            </button>
          ))}
        </div>

        <div style={{ padding: "1.5rem" }}>
          {error && (
            <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-alert-circle" /> {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#e8f5e9", color: "#1a7a4a", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-check" /> {success}
            </div>
          )}

          {/* ─── LOGIN ─── */}
          {tab === "login" && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>
                  ایمیل یا شماره موبایل
                </label>
                <input
                  {...loginForm.register("identifier")}
                  style={inputStyle}
                  placeholder="example@email.com  یا  ۰۹۱۲XXXXXXX"
                  type="text"
                  autoComplete="username"
                  dir="ltr"
                />
                {loginForm.formState.errors.identifier && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>
                    {loginForm.formState.errors.identifier.message}
                  </span>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>
                  رمز عبور
                </label>
                <input
                  {...loginForm.register("password")}
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {loginForm.formState.errors.password && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>
                    {loginForm.formState.errors.password.message}
                  </span>
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
                onClick={() => setTab("forgot")}
                style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", textAlign: "center" }}
              >
                فراموشی رمز عبور؟
              </button>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 11, border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer" }}
                >
                  <i className="ti ti-brand-google" style={{ fontSize: 18, color: "#ea4335" }} />
                  ورود با گوگل
                </button>
              </div>
            </form>
          )}

          {/* ─── REGISTER ─── */}
          {tab === "register" && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام</label>
                  <input {...registerForm.register("firstName")} style={inputStyle} placeholder="نام" />
                  {registerForm.formState.errors.firstName && (
                    <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.firstName.message}</span>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام خانوادگی</label>
                  <input {...registerForm.register("lastName")} style={inputStyle} placeholder="نام خانوادگی" />
                  {registerForm.formState.errors.lastName && (
                    <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.lastName.message}</span>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شماره موبایل</label>
                <input {...registerForm.register("phone")} style={inputStyle} placeholder="۰۹۱۲XXXXXXX" type="tel" dir="ltr" />
                {registerForm.formState.errors.phone && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.phone.message}</span>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>رمز عبور</label>
                <input {...registerForm.register("password")} style={inputStyle} type="password" placeholder="حداقل ۶ کاراکتر" autoComplete="new-password" />
                {registerForm.formState.errors.password && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.password.message}</span>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
              </button>
            </form>
          )}

          {/* ─── FORGOT ─── */}
          {tab === "forgot" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                ایمیل یا شماره موبایل خود را وارد کنید تا لینک بازیابی رمز برایتان ارسال شود.
              </p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>
                  ایمیل یا شماره موبایل
                </label>
                <input
                  style={inputStyle}
                  placeholder="example@email.com  یا  ۰۹۱۲XXXXXXX"
                  type="text"
                  dir="ltr"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                />
              </div>
              <button
                style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
                onClick={async () => {
                  if (!forgotIdentifier.trim()) return;
                  setLoading(true);
                  setError("");
                  setSuccess("");
                  try {
                    const res = await fetch("/api/auth/reset-password/request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ identifier: forgotIdentifier }),
                    });
                    if (res.ok) {
                      setSuccess("لینک بازیابی رمز ارسال شد. ایمیل یا پیامک خود را بررسی کنید.");
                    } else {
                      const json = await res.json();
                      setError(json.error ?? "خطا در ارسال لینک بازیابی");
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
              </button>
              <button
                type="button"
                onClick={() => { setTab("login"); setError(""); setSuccess(""); setForgotIdentifier(""); }}
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
