import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import ExperimentTracker from "@/components/experiment/experiment-tracker";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  hasEntitlement,
  INCOME_BLUEPRINT_KEY,
} from "@/lib/persistence/entitlements";
import {
  getExperiment,
  experimentTasks,
} from "@/lib/persistence/experiments";
import { computeScores, type AnswerMap } from "@/lib/domain/scoring";
import { INCOME_ROUTES, type RouteKey } from "@/lib/domain/income-routes";

export const metadata: Metadata = {
  title: "แผนทดลอง 7 วัน — ROOTMAN MONEY ROUTE",
  description: "ติดตามความคืบหน้าการลงมือทำใน 7 วันแรก",
};

export const runtime = "nodejs";

export default async function ExperimentPage({
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
    redirect(`/login?next=${encodeURIComponent(`/experiment/${sessionId}`)}`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) notFound();

  const { data: session } = await admin
    .from("assessment_sessions")
    .select("id, user_id, answers")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== user.id) notFound();

  if (!(await hasEntitlement(user.id, INCOME_BLUEPRINT_KEY))) {
    redirect(`/pricing?session=${encodeURIComponent(sessionId)}`);
  }

  const snapshot = computeScores(session.answers as AnswerMap);
  const routeKey = (snapshot.routeMatches[0]?.route ??
    snapshot.cashflowRoute) as RouteKey;
  const tasks = experimentTasks(routeKey);
  const experiment = await getExperiment(user.id, sessionId);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <ExperimentTracker
          sessionId={sessionId}
          routeName={INCOME_ROUTES[routeKey].name}
          tasks={tasks}
          initial={
            experiment
              ? {
                  id: experiment.id,
                  sessionId: experiment.sessionId,
                  status: experiment.status,
                  currentDay: experiment.currentDay,
                  completedDays: experiment.completedDays,
                }
              : null
          }
        />
      </main>
      <SiteFooter />
    </div>
  );
}
