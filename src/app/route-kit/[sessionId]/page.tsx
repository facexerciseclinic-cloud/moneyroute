import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import RouteKitView from "@/components/route-kit/route-kit-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasEntitlement, ROUTE_KIT_KEY } from "@/lib/persistence/entitlements";
import { computeScores, type AnswerMap } from "@/lib/domain/scoring";
import { INCOME_ROUTES, type RouteKey } from "@/lib/domain/income-routes";

export const metadata: Metadata = {
  title: "Route Kit — ROOTMAN MONEY ROUTE",
  description: "ชุดเครื่องมือลงมือทำจริงสำหรับเส้นทางสร้างรายได้ของคุณ",
};

export const runtime = "nodejs";

export default async function RouteKitPage({
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
    redirect(`/login?next=${encodeURIComponent(`/route-kit/${sessionId}`)}`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) notFound();

  const { data: session } = await admin
    .from("assessment_sessions")
    .select("id, user_id, answers")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== user.id) notFound();

  if (!(await hasEntitlement(user.id, ROUTE_KIT_KEY))) {
    redirect(`/pricing?session=${encodeURIComponent(sessionId)}`);
  }

  const snapshot = computeScores(session.answers as AnswerMap);
  const routeKey = (snapshot.routeMatches[0]?.route ??
    snapshot.cashflowRoute) as RouteKey;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <RouteKitView routeKey={routeKey} routeName={INCOME_ROUTES[routeKey].name} />
      </main>
      <SiteFooter />
    </div>
  );
}
