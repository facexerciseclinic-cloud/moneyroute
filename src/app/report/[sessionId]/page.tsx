import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import ReportView from "@/components/report/report-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  hasEntitlement,
  INCOME_BLUEPRINT_KEY,
} from "@/lib/persistence/entitlements";
import { computeScores, type AnswerMap } from "@/lib/domain/scoring";
import {
  buildReport,
  ReportSchema,
  REPORT_VERSION,
  TEMPLATE_VERSION,
  type Report,
} from "@/lib/domain/report";

export const metadata: Metadata = {
  title: "รายงานฉบับเต็ม — ROOTMAN MONEY ROUTE",
  description: "แผนสร้างรายได้เฉพาะตัวจากผลวิเคราะห์ Money Scan",
};

export const runtime = "nodejs";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/report/${sessionId}`)}`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) notFound();

  // Confirm the caller owns this session.
  const { data: session } = await admin
    .from("assessment_sessions")
    .select("id, user_id, answers")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== user.id) notFound();

  // Gate the full report behind the Income Blueprint entitlement.
  const entitled = await hasEntitlement(user.id, INCOME_BLUEPRINT_KEY);
  if (!entitled) {
    redirect(`/pricing?session=${encodeURIComponent(sessionId)}`);
  }

  // Reuse a persisted report when it matches the current engine version.
  const { data: existing } = await admin
    .from("reports")
    .select("structured_content, report_version, template_version")
    .eq("session_id", sessionId)
    .maybeSingle();

  let report: Report;
  const isFresh =
    existing &&
    existing.report_version === REPORT_VERSION &&
    existing.template_version === TEMPLATE_VERSION;

  if (isFresh) {
    const parsed = ReportSchema.safeParse(existing.structured_content);
    report = parsed.success
      ? parsed.data
      : buildReport(computeScores(session.answers as AnswerMap));
  } else {
    report = buildReport(computeScores(session.answers as AnswerMap));
    // Persist (best-effort) so future loads are fast and stable.
    await admin.from("reports").upsert(
      {
        session_id: sessionId,
        user_id: user.id,
        report_version: REPORT_VERSION,
        template_version: TEMPLATE_VERSION,
        status: "ready",
        structured_content: report,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <ReportView report={report} />
      </main>
      <SiteFooter />
    </div>
  );
}
