import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AnswerMap } from "@/lib/domain/scoring";
import type { ScoreSnapshot } from "@/lib/domain/scoring";

/**
 * Persist a completed assessment session and its score snapshot.
 *
 * No-ops (returns null) when Supabase is not configured, so the app keeps
 * working statelessly. Never throws — persistence failures must not break
 * the scoring response.
 *
 * Returns the created session id on success.
 */
export async function persistSnapshot(params: {
  answers: AnswerMap;
  snapshot: ScoreSnapshot;
  anonymousSessionId?: string | null;
}): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { answers, snapshot, anonymousSessionId } = params;

  try {
    const { data: session, error: sessionError } = await admin
      .from("assessment_sessions")
      .insert({
        anonymous_session_id: anonymousSessionId ?? null,
        assessment_version: snapshot.assessmentVersion,
        status: "completed",
        answers,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (sessionError || !session) return null;

    const { error: snapshotError } = await admin
      .from("score_snapshots")
      .insert({
        session_id: session.id,
        scoring_version: snapshot.scoringVersion,
        assessment_version: snapshot.assessmentVersion,
        dimension_scores: snapshot.dimensionScores,
        type_scores: snapshot.typeScores,
        route_scores: snapshot.routeMatches,
        constraint_flags: snapshot.constraintFlags,
        primary_type: snapshot.primaryType,
        secondary_type: snapshot.secondaryType,
        anti_type: snapshot.antiType,
        cashflow_route: snapshot.cashflowRoute,
        asset_route: snapshot.assetRoute,
        bridge_route: snapshot.bridgeRoute,
      });

    if (snapshotError) return null;
    return session.id as string;
  } catch {
    return null;
  }
}
