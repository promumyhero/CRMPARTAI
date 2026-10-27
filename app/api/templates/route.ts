import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getCurrentUserOrDefault } from "@/lib/auth/session";
import type { DocumentTemplate } from "@/lib/db/schema";

export async function GET() {
  try {
    const templates = await DataService.getTemplates();
    return NextResponse.json({ templates });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching templates";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<DocumentTemplate> & { name?: string };
    const user = await getCurrentUserOrDefault();

    if (!body.name) {
      return NextResponse.json({ error: "Nama template wajib diisi." }, { status: 400 });
    }

    const saved = await DataService.saveTemplate({
      ...body,
      name: body.name,
      userId: user.id,
    });

    return NextResponse.json({ template: saved }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error saving template";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
