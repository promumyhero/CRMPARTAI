import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getCurrentUserOrDefault } from "@/lib/auth/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return NextResponse.json({ error: "ID dokumen tidak valid." }, { status: 400 });
    }

    const doc = await DataService.getDocumentById(docId);
    if (!doc) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil data dokumen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return NextResponse.json({ error: "ID dokumen tidak valid." }, { status: 400 });
    }

    const success = await DataService.deleteDocument(docId);
    if (!success) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan atau gagal dihapus." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Dokumen berhasil dihapus." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus dokumen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
