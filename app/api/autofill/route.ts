import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getCurrentUserOrDefault } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fieldType = searchParams.get("type");
    const query = searchParams.get("q") || undefined;
    const user = await getCurrentUserOrDefault();

    if (!fieldType) {
      return NextResponse.json({ error: "type parameter is required" }, { status: 400 });
    }

    const suggestions = await DataService.getAutofillSuggestions(user.id, fieldType, query);
    return NextResponse.json({ suggestions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching autofill suggestions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
