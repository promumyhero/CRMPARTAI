import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";
import type { DocumentTemplate } from "@/lib/db/schema";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const templates = await DataService.getTemplates();
    return NextResponse.json({ templates });
  } catch (err: unknown) {
    console.error("GET /api/templates error:", err);
    return NextResponse.json({ error: "Gagal mengambil data template." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "templates:manage")) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin yang dapat mengelola template surat." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as Partial<DocumentTemplate> & { name?: string };

    if (!body.name) {
      return NextResponse.json({ error: "Nama template wajib diisi." }, { status: 400 });
    }

    const saved = await DataService.saveTemplate({
      ...body,
      name: body.name,
      userId: session.userId,
    });

    return NextResponse.json({ template: saved }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/templates error:", err);
    return NextResponse.json({ error: "Gagal menyimpan template." }, { status: 500 });
  }
}
