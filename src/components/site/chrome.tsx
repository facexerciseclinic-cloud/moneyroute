import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { AuthNav } from "@/components/auth/auth-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
            ROOTMAN
          </span>
          <span className="text-lg font-extrabold tracking-tight text-paper">
            MONEY ROUTE
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="hidden px-3 text-sm text-muted transition-colors hover:text-paper sm:inline"
          >
            ราคา
          </Link>
          <AuthNav />
          <ButtonLink href="/assessment" variant="gold" size="sm">
            เริ่มวิเคราะห์
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-ink/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
              ROOTMAN MONEY ROUTE
            </p>
            <p className="text-sm text-muted">
              ระบบวิเคราะห์และออกแบบเส้นทางสร้างรายได้เฉพาะบุคคล — ช่วยตัดสินใจ
              ไม่ใช่การรับประกันรายได้
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-muted">
            <Link href="/assessment" className="hover:text-paper">
              Money Scan
            </Link>
            <Link href="/opportunities" className="hover:text-paper">
              Opportunity Radar
            </Link>
            <Link href="/pricing" className="hover:text-paper">
              ราคา
            </Link>
            <Link href="/privacy" className="hover:text-paper">
              ความเป็นส่วนตัว
            </Link>
            <Link href="/terms" className="hover:text-paper">
              เงื่อนไข & Disclaimer
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-muted/70">
          ผลลัพธ์ขึ้นอยู่กับตลาด ทักษะ การลงมือ และเงื่อนไขของแต่ละคน
          ระบบนี้ไม่ใช่คำแนะนำการลงทุนและไม่รับประกันรายได้ · ©{" "}
          {new Date().getFullYear()} ROOTMAN
        </p>
      </div>
    </footer>
  );
}
