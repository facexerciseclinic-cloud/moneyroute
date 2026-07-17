import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  hasEntitlement,
  INCOME_BLUEPRINT_KEY,
} from "@/lib/persistence/entitlements";
import { computeScores, type AnswerMap } from "@/lib/domain/scoring";
import { buildReport, REPORT_VERSION, TEMPLATE_VERSION } from "@/lib/domain/report";

export const runtime = "nodejs";

const BodySchema = z.object({
  sessionId: z.string().uuid(),
});

/**
 * POST /api/reports/generate
 * Generates (or refreshes) the deterministic full report for a session the
 * caller owns, then persists and returns it.
 *
 * Requires an authenticated Supabase session and the Income Blueprint
 * entitlement (granted after a completed purchase).
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await hasEntitlement(user.id, INCOME_BLUEPRINT_KEY))) {
    return NextResponse.json({ error: "payment_required" }, { status: 402 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_unavailable" }, { status: 503 });
  }

  // Load the session and confirm the caller owns it.
  const { data: session, error: sessionError } = await admin
    .from("assessment_sessions")
    .select("id, user_id, answers")
    .eq("id", parsed.data.sessionId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Recompute deterministically from stored answers, then build the report.
  const snapshot = computeScores(session.answers as AnswerMap);
  let report;
  try {
    report = buildReport(snapshot);
  } catch {
    return NextResponse.json({ error: "report_build_failed" }, { status: 500 });
  }

  const { data: saved, error: upsertError } = await admin
    .from("reports")
    .upsert(
      {
        session_id: session.id,
        user_id: user.id,
        report_version: REPORT_VERSION,
        template_version: TEMPLATE_VERSION,
        status: "ready",
        structured_content: report,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    )
    .select("id")
    .single();

  if (upsertError || !saved) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ reportId: saved.id, report });
}
