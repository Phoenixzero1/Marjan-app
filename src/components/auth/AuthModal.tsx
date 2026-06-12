"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "این فیلد الزامی است")
    .refine(
      (v) => /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v) || /^09\d{9}$/.test(v),
      "ایمیل یا شماره موبایل معتبر نیست"
    ),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "نام الزامی است"),
  lastName: z.string().min(2, "نام خانوادگی الزامی است"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
  terms: z.literal(true).refine(v => v === true, { message: "پذیرش قوانین الزامی است" }),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

function isEmail(v: string) {
  return v.includes("@");
}

function passwordStrength(pw: string): { pct: number; color: string } {
  if (!pw) return { pct: 0, color: "#c0392b" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) || /[!@#$%^&*]/.test(pw)) score++;
  const colors = ["#c0392b", "#e67e22", "#f1c40f", "#1a7a4a"];
  return { pct: score * 25, color: colors[score - 1] ?? "#c0392b" };
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
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regPassword, setRegPassword] = useState("");
  const [siteName, setSiteName] = useState("Marjan");

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.json())
      .then((d) => { if (d.site_name) setSiteName(d.site_name); })
      .catch(() => {});
  }, []);

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
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email || undefined,
          password: data.password,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "خطا در ثبت‌نام");
      } else {
        setSuccess("ثبت‌نام موفق! در حال ورود...");
        await signIn("credentials", { phone: data.phone, password: data.password, redirect: false });
        setTimeout(onClose, 900);
      }
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t: "login" | "register" | "forgot") {
    setTab(t);
    setError("");
    setSuccess("");
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
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 900,
    color: "var(--text2)",
    display: "block",
    marginBottom: 5,
  };

  const strength = passwordStrength(regPassword);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 440,
          maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ── Header strip ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #071d42, #1a3d7c)",
            padding: "1.5rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
            {siteName}
          </span>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.7)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1,
                padding: "14px",
                background: "transparent",
                border: "none",
                borderBottom: tab === t ? "3px solid var(--primary)" : "3px solid transparent",
                marginBottom: -2,
                fontSize: 14,
                fontWeight: tab === t ? 900 : 700,
                color: tab === t ? "var(--primary)" : "var(--text3)",
                cursor: "pointer",
                fontFamily: "Vazirmatn",
                transition: "all .15s",
              }}
            >
              {t === "login" ? "ورود" : "ثبت نام"}
            </button>
          ))}
        </div>

        <div style={{ padding: "1.75rem 2rem" }}>
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
            <form onSubmit={loginForm.handleSubmit(handleLogin)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>موبایل یا ایمیل</label>
                <input
                  {...loginForm.register("identifier")}
                  style={inputStyle}
                  placeholder="۰۹۱۲-XXX-XXXX یا email@example.com"
                  type="text"
                  autoComplete="username"
                  dir="ltr"
                />
                {loginForm.formState.errors.identifier && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{loginForm.formState.errors.identifier.message}</span>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <label style={labelStyle}>رمز عبور</label>
                <input
                  {...loginForm.register("password")}
                  style={inputStyle}
                  type={showLoginPwd ? "text" : "password"}
                  placeholder="رمز عبور خود را وارد کنید"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPwd((v) => !v)}
                  style={{ position: "absolute", left: 10, bottom: 9, background: "transparent", border: "none", color: "var(--text3)", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}
                >
                  <i className={showLoginPwd ? "ti ti-eye-off" : "ti ti-eye"} />
                </button>
                {loginForm.formState.errors.password && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{loginForm.formState.errors.password.message}</span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 700, color: "var(--text2)" }}>
                  <input type="checkbox" style={{ accentColor: "var(--primary)" }} />
                  مرا به خاطر بسپار
                </label>
                <button
                  type="button"
                  onClick={() => switchTab("forgot")}
                  style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", padding: 0 }}
                >
                  فراموشی رمز؟
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--primary)", color: "#fff", border: "none",
                  padding: "13px", borderRadius: "var(--radius-sm)", fontSize: 14,
                  fontWeight: 900, fontFamily: "Vazirmatn", marginTop: 4,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
                  width: "100%",
                }}
              >
                {loading ? "در حال ورود..." : "ورود به حساب"}
              </button>

              {/* Social divider */}
              <div style={{ position: "relative", textAlign: "center", margin: "4px 0" }}>
                <div style={{ borderTop: "1px solid var(--border)" }} />
                <span style={{ position: "relative", top: -10, background: "#fff", padding: "0 12px", fontSize: 12, color: "var(--text3)", fontWeight: 700 }}>
                  یا ورود با
                </span>
              </div>

              {/* Social buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <SocialBtn icon="ti-brand-google" iconColor="#ea4335" label="گوگل" onClick={() => signIn("google")} />
                <SocialBtn icon="ti-brand-facebook" iconColor="#1877f2" label="فیسبوک" onClick={() => alert("ورود با فیسبوک به زودی فعال می‌شود")} />
                <SocialBtn icon="ti-brand-x" iconColor="#000" label="توییتر" onClick={() => alert("ورود با توییتر به زودی فعال می‌شود")} />
              </div>

              <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                حساب ندارید؟{" "}
                <button type="button" onClick={() => switchTab("register")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 900, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, padding: 0 }}>
                  ثبت نام کنید
                </button>
              </p>
            </form>
          )}

          {/* ─── REGISTER ─── */}
          {tab === "register" && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>نام</label>
                  <input {...registerForm.register("firstName")} style={inputStyle} placeholder="نام" />
                  {registerForm.formState.errors.firstName && (
                    <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.firstName.message}</span>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>نام خانوادگی</label>
                  <input {...registerForm.register("lastName")} style={inputStyle} placeholder="نام خانوادگی" />
                  {registerForm.formState.errors.lastName && (
                    <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.lastName.message}</span>
                  )}
                </div>
              </div>

              <div>
                <label style={labelStyle}>شماره موبایل</label>
                <input {...registerForm.register("phone")} style={inputStyle} placeholder="۰۹۱۲XXXXXXX" type="tel" dir="ltr" />
                {registerForm.formState.errors.phone && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.phone.message}</span>
                )}
              </div>

              <div>
                <label style={labelStyle}>ایمیل <span style={{ fontWeight: 400, color: "var(--text3)" }}>(اختیاری)</span></label>
                <input {...registerForm.register("email")} style={inputStyle} placeholder="email@example.com" type="email" dir="ltr" />
                {registerForm.formState.errors.email && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.email.message}</span>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <label style={labelStyle}>رمز عبور</label>
                <input
                  {...registerForm.register("password", {
                    onChange: (e) => setRegPassword(e.target.value),
                  })}
                  style={inputStyle}
                  type={showRegPwd ? "text" : "password"}
                  placeholder="حداقل ۶ کاراکتر"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPwd((v) => !v)}
                  style={{ position: "absolute", left: 10, bottom: 9, background: "transparent", border: "none", color: "var(--text3)", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}
                >
                  <i className={showRegPwd ? "ti ti-eye-off" : "ti ti-eye"} />
                </button>
                {registerForm.formState.errors.password && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>{registerForm.formState.errors.password.message}</span>
                )}
              </div>

              {/* Password strength bar */}
              {regPassword.length > 0 && (
                <div style={{ height: 4, borderRadius: 2, background: "var(--border)", marginTop: -6 }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${strength.pct}%`, background: strength.color, transition: "width .3s, background .3s" }} />
                </div>
              )}

              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>
                <input {...registerForm.register("terms")} type="checkbox" style={{ accentColor: "var(--primary)", marginTop: 2, flexShrink: 0 }} />
                <span>
                  با{" "}
                  <a href="/terms" target="_blank" style={{ color: "var(--primary)" }}>قوانین و مقررات</a>
                  {" "}و{" "}
                  <a href="/privacy" target="_blank" style={{ color: "var(--primary)" }}>حریم خصوصی</a>
                  {" "}موافقم
                </span>
              </label>
              {registerForm.formState.errors.terms && (
                <span style={{ fontSize: 11, color: "#c0392b", marginTop: -8 }}>{registerForm.formState.errors.terms.message}</span>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--primary)", color: "#fff", border: "none",
                  padding: "13px", borderRadius: "var(--radius-sm)", fontSize: 14,
                  fontWeight: 900, fontFamily: "Vazirmatn",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
                  width: "100%",
                }}
              >
                {loading ? "در حال ثبت‌نام..." : "ثبت نام"}
              </button>

              <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)" }}>
                حساب دارید؟{" "}
                <button type="button" onClick={() => switchTab("login")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 900, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, padding: 0 }}>
                  وارد شوید
                </button>
              </p>
            </form>
          )}

          {/* ─── FORGOT ─── */}
          {tab === "forgot" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
                شماره موبایل یا ایمیل خود را وارد کنید تا لینک بازیابی رمز برایتان ارسال شود.
              </p>
              <div>
                <label style={labelStyle}>موبایل یا ایمیل</label>
                <input
                  style={inputStyle}
                  placeholder="۰۹۱۲-XXX-XXXX یا email@example.com"
                  type="text"
                  dir="ltr"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                />
              </div>
              <button
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
                style={{
                  background: "var(--primary)", color: "#fff", border: "none",
                  padding: "13px", borderRadius: "var(--radius-sm)", fontSize: 14,
                  fontWeight: 900, fontFamily: "Vazirmatn",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
                  width: "100%",
                }}
              >
                {loading ? "در حال ارسال..." : "ارسال کد تأیید"}
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)", margin: 0 }}>
                <button
                  type="button"
                  onClick={() => { switchTab("login"); setForgotIdentifier(""); }}
                  style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 900, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, padding: 0 }}
                >
                  ← بازگشت به ورود
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialBtn({ icon, iconColor, label, onClick }: { icon: string; iconColor: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "10px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
        background: "#fff", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700,
        cursor: "pointer", color: "var(--text2)", transition: "border-color .15s, background .15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
        (e.currentTarget as HTMLElement).style.background = "var(--bg)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.background = "#fff";
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 16, color: iconColor }} />
      {label}
    </button>
  );
}
