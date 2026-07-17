"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Mode = "signin" | "signup";
type Status = "idle" | "working" | "error" | "unconfigured";

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
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    // With email confirmation disabled, sign-up returns a session directly.
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }
    // Otherwise sign in immediately with the same credentials.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setStatus("error");
      setMessage(
        "สมัครสมาชิกสำเร็จ แต่เข้าสู่ระบบอัตโนมัติไม่ได้ กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ",
      );
      return;
    }
    router.push(next);
    router.refresh();
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
      </div>
    </Card>
  );
}
