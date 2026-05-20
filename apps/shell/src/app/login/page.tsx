"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiBase } from "@platform/api-client";
import { setAuthSession, type AuthSession } from "@platform/auth-client";
import { applyPrototypeRoleForEmail } from "@/lib/auth-role-map";

type LoginResponse = {
  token: string;
  expiresAtUtc: string;
  user: { id: string; email: string; displayName: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@local.dev");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json().catch(() => null)) as
        | LoginResponse
        | { message?: string }
        | null;

      if (!res.ok) {
        const msg =
          data && "message" in data && typeof data.message === "string"
            ? data.message
            : "تعذر تسجيل الدخول. تحقق من البيانات أو اتصال الخادم.";
        setError(msg);
        return;
      }

      if (!data || !("token" in data)) {
        setError("استجابة غير متوقعة من الخادم.");
        return;
      }

      setAuthSession({
        token: data.token,
        user: data.user,
        expiresAtUtc: data.expiresAtUtc,
      } satisfies AuthSession);
      applyPrototypeRoleForEmail(data.user.email);
      router.push("/dashboard");
    } catch {
      setError("تعذر الاتصال بالخادم. تأكد أن واجهة الـ API تعمل.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page-card">
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
          <div>
            <div className="login-brand-title">نظام إجادة الداخلي</div>
            <div className="login-brand-sub">دراسة الحالة</div>
          </div>
        </div>

        <h1 className="login-title">تسجيل الدخول</h1>
        <p className="login-lead">أدخل البريد الإلكتروني وكلمة المرور للمتابعة.</p>

        {error ? <div className="login-error">{error}</div> : null}

        <form onSubmit={onSubmit}>
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="email">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              className="login-field-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="password">
              كلمة المرور
            </label>
            <input
              id="password"
              className="login-field-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "جاري التحقق…" : "دخول"}
          </button>
        </form>

        <p className="login-hint">
          CDO: <strong style={{ color: "var(--text2)" }}>s.salhy@gmail.com</strong> /{" "}
          <strong style={{ color: "var(--text2)" }}>sliman123</strong>
          <br />
          مديرو الإدارات: علي (HR) · أحمد (PROC) · جمال (CRM) — كلمات المرور كما في
          الإعداد.
          <br />
          تجريبي قديم: <strong style={{ color: "var(--text2)" }}>admin@local.dev</strong> /{" "}
          <strong style={{ color: "var(--text2)" }}>Admin123!</strong>
        </p>
      </div>
    </div>
  );
}
