import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";
import { getMetricsSummary, getOrCreateRequestId } from "@/lib/observability/logger";

export async function GET(req: Request) {
  const requestId = getOrCreateRequestId(req);
  const [status, session] = await Promise.all([
    DataService.getDbStatus(),
    getSessionUser(),
  ]);

  const isAdmin = session ? hasPermission(session.normalizedRole, "users:manage") : false;

  return NextResponse.json(
    {
      status: "ok",
      database: status,
      ...(isAdmin ? { metrics: getMetricsSummary() } : {}),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "X-Request-Id": requestId,
        "Cache-Control": "no-store",
      },
    }
  );
}
