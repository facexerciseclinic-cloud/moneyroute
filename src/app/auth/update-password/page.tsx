import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import UpdatePasswordForm from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "ตั้งรหัสผ่านใหม่ — ROOTMAN MONEY ROUTE",
};

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <Suspense>
          <UpdatePasswordForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
