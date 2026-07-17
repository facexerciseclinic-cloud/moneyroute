import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasEntitlement,
  INCOME_BLUEPRINT_KEY,
} from "@/lib/persistence/entitlements";
import {
  startExperiment,
  completeDay,
} from "@/lib/persistence/experiments";

export const runtime = "nodejs";

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    sessionId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("complete_day"),
    sessionId: z.string().uuid(),
    day: z.number().int().min(1).max(7),
    evidenceText: z.string().max(2000).optional(),
  }),
]);

/**
 * POST /api/experiments
 * Starts a 7-day experiment or marks a day complete for a session the caller
 * owns. Requires auth and the Income Blueprint entitlement.
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

  const body = parsed.data;
  const result =
    body.action === "start"
      ? await startExperiment(user.id, body.sessionId)
      : await completeDay(
          user.id,
          body.sessionId,
          body.day,
          body.evidenceText,
        );

  if (!result) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ experiment: result });
}
