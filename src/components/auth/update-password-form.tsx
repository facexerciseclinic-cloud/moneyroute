"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Status = "idle" | "working" | "done" | "error" | "unconfigured";

const inputClass =
  "w-full rounded-md border border-border bg-ink/40 px-4 py-3 text-paper outline-none transition-colors placeholder:text-muted/60 focus:border-gold";

/**
 * Set a new password. Reached via the reset link, which establishes a
 * recovery session (handled by /auth/callback) before landing here.
 */
export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setStatus("unconfigured");

    setStatus("working");
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("done");
    setTimeout(() => {
      router.push("/result");
      router.refresh();
    }, 1200);
  }

  return (
    <Card glow="gold" className="p-8">
      <Eyebrow>ตั้งรหัสผ่านใหม่</Eyebrow>
      <SectionTitle className="mt-3 text-2xl sm:text-3xl">
        ตั้งรหัสผ่านใหม่
      </SectionTitle>

      {status === "done" ? (
        <div className="mt-6 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm text-paper">
          ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กำลังพาคุณเข้าสู่ระบบ…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
            >
              รหัสผ่านใหม่
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className={inputClass}
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-soft">
              {message || "ตั้งรหัสผ่านไม่สำเร็จ ลิงก์อาจหมดอายุ กรุณาขอลิงก์ใหม่"}
            </p>
          )}
          {status === "unconfigured" && (
            <p className="text-sm text-red-soft">
              ระบบยังไม่พร้อมใช้งานในขณะนี้
            </p>
          )}

          <Button
            type="submit"
            variant="gold"
            className="w-full"
            disabled={status === "working"}
          >
            {status === "working" ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
          </Button>
        </form>
      )}
    </Card>
  );
}
