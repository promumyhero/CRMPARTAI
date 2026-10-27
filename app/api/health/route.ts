import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";

export async function GET() {
  const status = await DataService.getDbStatus();
  return NextResponse.json({
    status: "ok",
    database: status,
    timestamp: new Date().toISOString(),
  });
}
