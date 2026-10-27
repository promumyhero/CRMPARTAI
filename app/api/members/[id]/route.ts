import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "members:delete")) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki izin untuk menghapus data kader/anggota." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const memberId = parseInt(id, 10);
    if (isNaN(memberId)) {
      return NextResponse.json({ error: "ID anggota tidak valid." }, { status: 400 });
    }

    const success = await DataService.deletePartyMember(memberId);
    if (!success) {
      return NextResponse.json({ error: "Data kader tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Data kader berhasil dihapus." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
