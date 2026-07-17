import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  hasEntitlement,
  INCOME_BLUEPRINT_KEY,
  ROUTE_KIT_KEY,
} from "@/lib/persistence/entitlements";
import { getExperiment } from "@/lib/persistence/experiments";
import { MONEY_TYPES, type MoneyTypeKey } from "@/lib/domain/money-types";
import { INCOME_ROUTES, type RouteKey } from "@/lib/domain/income-routes";
import type { RouteMatch } from "@/lib/domain/scoring";

export const metadata: Metadata = {
  title: "แดชบอร์ด — ROOTMAN MONEY ROUTE",
  description: "ภาพรวมเส้นทางสร้างรายได้ของคุณ",
};

export const runtime = "nodejs";

type LatestSnapshot = {
  primaryType: MoneyTypeKey;
  primaryRoute: RouteKey;
  cashflowRoute: RouteKey;
  assetRoute: RouteKey;
};

type SessionRow = {
  id: string;
  completed_at: string | null;
  hasReport: boolean;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?next=/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const admin = createSupabaseAdminClient();

  let sessions: SessionRow[] = [];
  let latest: LatestSnapshot | null = null;
  let entitled = false;
  let entitledKit = false;

  if (admin) {
    entitled = await hasEntitlement(user.id, INCOME_BLUEPRINT_KEY);
    entitledKit = await hasEntitlement(user.id, ROUTE_KIT_KEY);

    const { data: sessionRows } = await admin
      .from("assessment_sessions")
      .select("id, completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    const ids = (sessionRows ?? []).map((s) => s.id as string);

    const reportSessionIds = new Set<string>();
    if (ids.length > 0) {
      const { data: reportRows } = await admin
        .from("reports")
        .select("session_id")
        .eq("user_id", user.id)
        .in("session_id", ids);
      for (const r of reportRows ?? [])
        reportSessionIds.add(r.session_id as string);
    }

    sessions = (sessionRows ?? []).map((s) => ({
      id: s.id as string,
      completed_at: s.completed_at as string | null,
      hasReport: reportSessionIds.has(s.id as string),
    }));

    // Derive the headline result from the most recent snapshot.
    if (ids.length > 0) {
      const { data: snap } = await admin
        .from("score_snapshots")
        .select("primary_type, route_scores, cashflow_route, asset_route")
        .eq("session_id", ids[0])
        .maybeSingle();

      if (snap) {
        const matches = (snap.route_scores as RouteMatch[] | null) ?? [];
        const top = matches[0];
        latest = {
          primaryType: snap.primary_type as MoneyTypeKey,
          primaryRoute: (top?.route ??
            (snap.cashflow_route as RouteKey)) as RouteKey,
          cashflowRoute: snap.cashflow_route as RouteKey,
          assetRoute: snap.asset_route as RouteKey,
        };
      }
    }
  }

  const firstName = user.email?.split("@")[0] ?? "คุณ";
  const latestSessionId = sessions[0]?.id ?? null;

  // 7-day experiment progress for the latest session (entitled users only).
  let experimentProgress: { completed: number; total: number; status: string } | null =
    null;
  if (admin && entitled && latestSessionId) {
    const exp = await getExperiment(user.id, latestSessionId);
    if (exp) {
      experimentProgress = {
        completed: exp.completedDays.length,
        total: exp.tasks.length,
        status: exp.status,
      };
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-2">
          <Eyebrow>แดชบอร์ด</Eyebrow>
          <SectionTitle>สวัสดี {firstName}</SectionTitle>
          <p className="text-sm text-muted">{user.email}</p>
        </div>

        {sessions.length === 0 ? (
          <Card glow="gold" className="mt-8 space-y-4 p-8 text-center">
            <p className="text-lg text-paper">
              คุณยังไม่ได้ทำแบบวิเคราะห์ Money Scan
            </p>
            <p className="text-sm text-muted">
              เริ่มวิเคราะห์เพื่อค้นหา Money Type และเส้นทางสร้างรายได้ที่เหมาะกับคุณ
            </p>
            <div className="pt-2">
              <ButtonLink href="/assessment" variant="gold">
                เริ่มวิเคราะห์
              </ButtonLink>
            </div>
          </Card>
        ) : (
          <>
            {/* Headline result */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Card glow="gold" className="space-y-3 p-6">
                <Eyebrow>Money Type ของคุณ</Eyebrow>
                {latest ? (
                  <>
                    <h2 className="text-2xl font-extrabold text-paper">
                      {MONEY_TYPES[latest.primaryType].name}
                    </h2>
                    <p className="font-mono text-xs uppercase tracking-widest text-gold">
                      {MONEY_TYPES[latest.primaryType].tagline}
                    </p>
                    <p className="text-sm leading-relaxed text-paper/80">
                      {MONEY_TYPES[latest.primaryType].shortDescription}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">ยังไม่มีข้อมูลผลวิเคราะห์</p>
                )}
              </Card>

              <Card glow="red" className="space-y-3 p-6">
                <Eyebrow>เส้นทางหลัก</Eyebrow>
                {latest ? (
                  <>
                    <h2 className="text-2xl font-extrabold text-paper">
                      {INCOME_ROUTES[latest.primaryRoute].name}
                    </h2>
                    <p className="text-sm leading-relaxed text-paper/80">
                      {INCOME_ROUTES[latest.primaryRoute].description}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-xs text-paper/70">
                      <span className="rounded-full border border-border px-3 py-1">
                        Cashflow: {INCOME_ROUTES[latest.cashflowRoute].name}
                      </span>
                      <span className="rounded-full border border-border px-3 py-1">
                        Asset: {INCOME_ROUTES[latest.assetRoute].name}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">ยังไม่มีข้อมูลผลวิเคราะห์</p>
                )}
              </Card>
            </div>

            {/* Blueprint access */}
            <Card className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Eyebrow>Income Blueprint</Eyebrow>
                <p className="text-lg font-semibold text-paper">
                  {entitled
                    ? "คุณปลดล็อกรายงานฉบับเต็มแล้ว"
                    : "ปลดล็อกแผนสร้างรายได้ฉบับเต็ม"}
                </p>
                <p className="text-sm text-muted">
                  {entitled
                    ? "เปิดดูรายงาน แผนทดลอง 7 วัน และ Roadmap ได้ทุกเมื่อ"
                    : "รายงานเจาะลึก เส้นทางอันดับ 2–3 แผนหาลูกค้า และแผน 30 วัน"}
                </p>
              </div>
              <div className="shrink-0">
                {entitled && latestSessionId ? (
                  <ButtonLink href={`/report/${latestSessionId}`} variant="gold">
                    เปิดรายงานฉบับเต็ม
                  </ButtonLink>
                ) : (
                  <ButtonLink
                    href={
                      latestSessionId
                        ? `/pricing?session=${latestSessionId}`
                        : "/pricing"
                    }
                    variant="gold"
                  >
                    ปลดล็อก 390฿
                  </ButtonLink>
                )}
              </div>
            </Card>

            {/* 7-day experiment */}
            <Card className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-1">
                <Eyebrow>แผนทดลอง 7 วัน</Eyebrow>
                {!entitled ? (
                  <p className="text-sm text-muted">
                    ปลดล็อก Income Blueprint เพื่อรับแผนทดลอง 7 วันที่ออกแบบเฉพาะคุณ
                  </p>
                ) : experimentProgress ? (
                  <>
                    <p className="text-lg font-semibold text-paper">
                      {experimentProgress.status === "completed"
                        ? "ทำครบ 7 วันแล้ว 🎉"
                        : `ความคืบหน้า ${experimentProgress.completed}/${experimentProgress.total} วัน`}
                    </p>
                    <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-ink/60">
                      <div
                        className="h-full rounded-full bg-gold transition-all"
                        style={{
                          width: `${Math.round(
                            (experimentProgress.completed /
                              experimentProgress.total) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    เริ่มลงมือทำจริงใน 7 วัน — ติดตามความคืบหน้าได้ทีละวัน
                  </p>
                )}
              </div>
              {entitled && latestSessionId && (
                <div className="shrink-0">
                  <ButtonLink
                    href={`/experiment/${latestSessionId}`}
                    variant={experimentProgress ? "gold" : "outline"}
                  >
                    {experimentProgress ? "ทำต่อ" : "เริ่มการทดลอง"}
                  </ButtonLink>
                </div>
              )}
            </Card>

            {/* Route Kit */}
            <Card className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Eyebrow>Route Kit</Eyebrow>
                <p className="text-lg font-semibold text-paper">
                  {entitledKit
                    ? "ชุดเครื่องมือลงมือทำของคุณ"
                    : "ชุดเครื่องมือปฏิบัติตามเส้นทาง"}
                </p>
                <p className="text-sm text-muted">
                  {entitledKit
                    ? "เทมเพลตข้อความ เช็กลิสต์ แนวทางตั้งราคา และจังหวะรายสัปดาห์"
                    : "เทมเพลตพร้อมใช้ + เช็กลิสต์ + แนวทางตั้งราคาเฉพาะเส้นทางของคุณ"}
                </p>
              </div>
              <div className="shrink-0">
                {entitledKit && latestSessionId ? (
                  <ButtonLink
                    href={`/route-kit/${latestSessionId}`}
                    variant="gold"
                  >
                    เปิด Route Kit
                  </ButtonLink>
                ) : (
                  <ButtonLink
                    href={
                      latestSessionId
                        ? `/pricing?session=${latestSessionId}`
                        : "/pricing"
                    }
                    variant="outline"
                  >
                    ปลดล็อก 590฿
                  </ButtonLink>
                )}
              </div>
            </Card>

            {/* History */}
            <section className="mt-10 space-y-4">
              <SectionTitle className="text-2xl">
                ประวัติการวิเคราะห์
              </SectionTitle>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <Card
                    key={s.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm text-paper">
                        {s.completed_at
                          ? new Date(s.completed_at).toLocaleDateString(
                              "th-TH",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "ไม่ระบุวันที่"}
                      </p>
                      <p className="text-xs text-muted">
                        {s.hasReport ? "มีรายงานฉบับเต็ม" : "ผลวิเคราะห์ฟรี"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {entitled ? (
                        <Link
                          href={`/report/${s.id}`}
                          className="text-sm text-gold hover:underline"
                        >
                          รายงาน →
                        </Link>
                      ) : (
                        <Link
                          href={`/pricing?session=${s.id}`}
                          className="text-sm text-gold hover:underline"
                        >
                          ปลดล็อก →
                        </Link>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="pt-2">
                <ButtonLink href="/assessment" variant="outline" size="sm">
                  วิเคราะห์ใหม่อีกครั้ง
                </ButtonLink>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
