import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { INCOME_ROUTES, type RouteKey } from "@/lib/domain/income-routes";

export const metadata: Metadata = {
  title: "Opportunity Radar — ROOTMAN MONEY ROUTE",
  description: "โอกาสสร้างรายได้ที่คัดมาแล้ว พร้อมแผนทดสอบเบื้องต้น",
};

export const runtime = "nodejs";

type Opportunity = {
  slug: string;
  title: string;
  summary: string;
  payer: string;
  pain_point: string;
  revenue_model: string;
  capital_score: number;
  speed_score: number;
  difficulty_score: number;
  scale_score: number;
  visibility_requirement: string;
  sales_requirement: string;
  recommended_routes: string[];
  test_plan: string[];
};

function Dots({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${
            n <= value ? "bg-gold" : "bg-border"
          }`}
        />
      ))}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted">
      <span>{label}</span>
      <Dots value={value} />
    </div>
  );
}

function routeName(slug: string): string {
  return INCOME_ROUTES[slug as RouteKey]?.name ?? slug;
}

export default async function OpportunitiesPage() {
  const admin = createSupabaseAdminClient();
  let opportunities: Opportunity[] = [];

  if (admin) {
    const { data } = await admin
      .from("opportunities")
      .select(
        "slug, title, summary, payer, pain_point, revenue_model, capital_score, speed_score, difficulty_score, scale_score, visibility_requirement, sales_requirement, recommended_routes, test_plan",
      )
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    opportunities = (data ?? []) as Opportunity[];
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-2 text-center">
          <Eyebrow>Opportunity Radar</Eyebrow>
          <SectionTitle className="mt-2">โอกาสสร้างรายได้ที่คัดมาแล้ว</SectionTitle>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            แนวทางที่ตลาดต้องการจริง พร้อมแผนทดสอบเบื้องต้น — เลือกที่เข้ากับ Money Type ของคุณ
            แล้วลองทำใน 7 วัน (ไม่ใช่การรับประกันรายได้)
          </p>
        </div>

        {opportunities.length === 0 ? (
          <Card className="mt-10 p-8 text-center text-muted">
            ยังไม่มีโอกาสที่เผยแพร่ในขณะนี้ กรุณากลับมาใหม่เร็ว ๆ นี้
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {opportunities.map((o) => (
              <Card key={o.slug} className="flex flex-col gap-4 p-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-paper">{o.title}</h2>
                  <p className="text-sm leading-relaxed text-paper/80">
                    {o.summary}
                  </p>
                </div>

                <div className="grid gap-1.5 border-y border-border py-3">
                  <Metric label="เงินทุนที่ต้องใช้" value={o.capital_score} />
                  <Metric label="ความเร็วรายได้" value={o.speed_score} />
                  <Metric label="ความง่าย (ยิ่งมากยิ่งยาก)" value={o.difficulty_score} />
                  <Metric label="โอกาสขยายสเกล" value={o.scale_score} />
                </div>

                <dl className="space-y-1.5 text-sm">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted">ใครจ่าย:</dt>
                    <dd className="text-paper/90">{o.payer}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted">แก้ปัญหา:</dt>
                    <dd className="text-paper/90">{o.pain_point}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted">โมเดลรายได้:</dt>
                    <dd className="text-paper/90">{o.revenue_model}</dd>
                  </div>
                </dl>

                {o.recommended_routes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {o.recommended_routes.map((r) => (
                      <span
                        key={r}
                        className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold"
                      >
                        {routeName(r)}
                      </span>
                    ))}
                  </div>
                )}

                {o.test_plan.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      แผนทดสอบเบื้องต้น
                    </p>
                    <ol className="space-y-1 text-sm text-paper/80">
                      {o.test_plan.map((step, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-gold">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <ButtonLink href="/assessment" variant="gold">
            หา Money Type ของคุณก่อนเริ่ม
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
