import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

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
    console.error("GET /api/documents/[id] error:", err);
    return NextResponse.json({ error: "Gagal mengambil data dokumen." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "documents:generate")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

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
    console.error("DELETE /api/documents/[id] error:", err);
    return NextResponse.json({ error: "Gagal menghapus dokumen." }, { status: 500 });
  }
}
