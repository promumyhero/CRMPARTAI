import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fieldType = searchParams.get("type");
    const query = searchParams.get("q") || undefined;

    if (!fieldType) {
      return NextResponse.json({ error: "type parameter is required" }, { status: 400 });
    }

    const suggestions = await DataService.getAutofillSuggestions(session.userId, fieldType, query);
    return NextResponse.json({ suggestions });
  } catch (err: unknown) {
    console.error("GET /api/autofill error:", err);
    return NextResponse.json({ error: "Gagal mengambil saran autofill." }, { status: 500 });
  }
}
