import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { computeScores, type AnswerMap } from "@/lib/domain/scoring";
import { ROUTE_CONTENT } from "@/lib/domain/report-content";
import type { ExperimentTask } from "@/lib/domain/report-content";
import type { RouteKey } from "@/lib/domain/income-routes";

export type ExperimentState = {
  id: string;
  sessionId: string;
  routeKey: RouteKey;
  status: "active" | "completed" | "abandoned";
  currentDay: number;
  tasks: ExperimentTask[];
  completedDays: number[];
};

/** The 7 daily tasks for an income route (deterministic, from code). */
export function experimentTasks(routeKey: RouteKey): ExperimentTask[] {
  return ROUTE_CONTENT[routeKey].sevenDayExperiment;
}

/**
 * Load a user's experiment for a session, if one exists.
 * Returns null when Supabase is unconfigured or none started yet.
 */
export async function getExperiment(
  userId: string,
  sessionId: string,
): Promise<ExperimentState | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data: exp } = await admin
    .from("user_experiments")
    .select("id, session_id, route_key, status, current_day")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!exp) return null;

  const { data: completions } = await admin
    .from("task_completions")
    .select("day_number")
    .eq("user_experiment_id", exp.id as string);

  const completedDays = (completions ?? [])
    .map((c) => c.day_number as number)
    .sort((a, b) => a - b);

  return {
    id: exp.id as string,
    sessionId: exp.session_id as string,
    routeKey: exp.route_key as RouteKey,
    status: exp.status as ExperimentState["status"],
    currentDay: exp.current_day as number,
    tasks: experimentTasks(exp.route_key as RouteKey),
    completedDays,
  };
}

/**
 * Start (or return the existing) experiment for a session the user owns.
 * The route is derived deterministically from the session's stored answers.
 */
export async function startExperiment(
  userId: string,
  sessionId: string,
): Promise<ExperimentState | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const existing = await getExperiment(userId, sessionId);
  if (existing) return existing;

  const { data: session } = await admin
    .from("assessment_sessions")
    .select("id, user_id, answers")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== userId) return null;

  const snapshot = computeScores(session.answers as AnswerMap);
  const routeKey = (snapshot.routeMatches[0]?.route ??
    snapshot.cashflowRoute) as RouteKey;

  const { error } = await admin.from("user_experiments").insert({
    user_id: userId,
    session_id: sessionId,
    route_key: routeKey,
    status: "active",
    current_day: 1,
  });
  if (error) return null;

  return getExperiment(userId, sessionId);
}

/**
 * Mark a day complete (idempotent). Advances current_day and marks the whole
 * experiment complete once all 7 days are done. Verifies ownership.
 */
export async function completeDay(
  userId: string,
  sessionId: string,
  day: number,
  evidenceText?: string,
): Promise<ExperimentState | null> {
  if (day < 1 || day > 7) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const exp = await getExperiment(userId, sessionId);
  if (!exp) return null;

  await admin.from("task_completions").upsert(
    {
      user_experiment_id: exp.id,
      day_number: day,
      evidence_text: evidenceText?.slice(0, 2000) ?? null,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_experiment_id,day_number" },
  );

  const completed = new Set([...exp.completedDays, day]);
  const allDone = [1, 2, 3, 4, 5, 6, 7].every((d) => completed.has(d));
  const nextDay = Math.min(7, Math.max(exp.currentDay, day + 1));

  await admin
    .from("user_experiments")
    .update({
      current_day: nextDay,
      status: allDone ? "completed" : "active",
      completed_at: allDone ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", exp.id);

  return getExperiment(userId, sessionId);
}
