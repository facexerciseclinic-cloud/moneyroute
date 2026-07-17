import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on all routes except static assets, the score API, and the payment
    // webhook (a server-to-server call with no session cookies).
    "/((?!_next/static|_next/image|favicon.ico|api/score|api/payments/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
