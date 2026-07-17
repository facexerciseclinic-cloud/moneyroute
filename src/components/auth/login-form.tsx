"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Mode = "signin" | "signup";
type Status =
  | "idle"
  | "working"
  | "magic_sent"
  | "reset_sent"
  | "confirm_email"
  | "error"
  | "unconfigured";

const inputClass =
  "w-full rounded-md border border-border bg-ink/40 px-4 py-3 text-paper outline-none transition-colors placeholder:text-muted/60 focus:border-gold";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/result";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(
    searchParams.get("error") ? "error" : "idle",
  );
  const [message, setMessage] = useState<string>("");

  function origin() {
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  function callbackUrl(target: string) {
    return `${origin()}/auth/callback?next=${encodeURIComponent(target)}`;
  }

  // Email + password sign in / sign up.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setStatus("unconfigured");

    setStatus("working");
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setStatus("error");
        setMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: callbackUrl(next) },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    // No session means Supabase requires email confirmation first.
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setStatus("confirm_email");
    }
  }

  // Magic link fallback.
  async function sendMagicLink() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setStatus("unconfigured");
    if (!email.trim()) {
      setStatus("error");
      setMessage("กรุณากรอกอีเมลก่อน");
      return;
    }
    setStatus("working");
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(next) },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("magic_sent");
  }

  // Password reset email.
  async function sendReset() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setStatus("unconfigured");
    if (!email.trim()) {
      setStatus("error");
      setMessage("กรุณากรอกอีเมลก่อนเพื่อรับลิงก์รีเซ็ตรหัสผ่าน");
      return;
    }
    setStatus("working");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: callbackUrl("/auth/update-password"),
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("reset_sent");
  }

  if (
    status === "magic_sent" ||
    status === "reset_sent" ||
    status === "confirm_email"
  ) {
    const text =
      status === "magic_sent"
        ? "ส่งลิงก์เข้าสู่ระบบไปที่อีเมลของคุณแล้ว กรุณาเปิดอีเมลแล้วคลิกลิงก์"
        : status === "reset_sent"
          ? "ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว กรุณาเปิดอีเมลเพื่อตั้งรหัสผ่านใหม่"
          : "สมัครสมาชิกแล้ว! กรุณายืนยันอีเมลของคุณโดยคลิกลิงก์ที่เราส่งไป จากนั้นจึงเข้าสู่ระบบ";
    return (
      <Card glow="gold" className="p-8">
        <Eyebrow>เข้าสู่ระบบ</Eyebrow>
        <SectionTitle className="mt-3 text-2xl sm:text-3xl">
          ตรวจสอบอีเมลของคุณ
        </SectionTitle>
        <div className="mt-6 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm text-paper">
          {text} (<strong>{email}</strong>)
        </div>
      </Card>
    );
  }

  return (
    <Card glow="gold" className="p-8">
      <Eyebrow>เข้าสู่ระบบ</Eyebrow>
      <SectionTitle className="mt-3 text-2xl sm:text-3xl">
        {mode === "signin" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
      </SectionTitle>
      <p className="mt-3 text-sm text-muted">
        {mode === "signin"
          ? "เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน เพื่อดูผลวิเคราะห์และรายงานของคุณ"
          : "ตั้งอีเมลและรหัสผ่านของคุณเอง เพื่อบันทึกผลและเข้าถึงได้ทุกเมื่อ"}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            className={inputClass}
          />
        </div>

        {status === "error" && (
          <p className="text-sm text-red-soft">
            {message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}
          </p>
        )}
        {status === "unconfigured" && (
          <p className="text-sm text-red-soft">
            ระบบเข้าสู่ระบบยังไม่พร้อมใช้งานในขณะนี้
          </p>
        )}

        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={status === "working"}
        >
          {status === "working"
            ? "กำลังดำเนินการ…"
            : mode === "signin"
              ? "เข้าสู่ระบบ"
              : "สมัครสมาชิก"}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setStatus("idle");
            setMessage("");
          }}
          className="text-gold hover:underline"
        >
          {mode === "signin"
            ? "ยังไม่มีบัญชี? สมัครสมาชิก"
            : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}
        </button>
        {mode === "signin" && (
          <button
            type="button"
            onClick={sendReset}
            className="text-muted hover:text-paper"
          >
            ลืมรหัสผ่าน?
          </button>
        )}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted/60">
        <span className="h-px flex-1 bg-border" />
        หรือ
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={sendMagicLink}
        disabled={status === "working"}
      >
        รับลิงก์เข้าสู่ระบบทางอีเมล
      </Button>
    </Card>
  );
}
