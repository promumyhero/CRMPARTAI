import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";

interface CreateDocumentPayload {
  activityId?: number | string;
  docNumber?: string;
  docType?: number;
  subject?: string;
  recipientName?: string;
  contentPayload?: Record<string, unknown>;
  issuedDate?: string;
}

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activityIdStr = searchParams.get("activityId");

    const docs = await DataService.getDocuments({
      userId: session.userId,
      activityId: activityIdStr ? parseInt(activityIdStr, 10) : undefined,
    });

    return NextResponse.json({ documents: docs });
  } catch (err: unknown) {
    console.error("GET /api/documents error:", err);
    return NextResponse.json({ error: "Gagal mengambil daftar dokumen." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "documents:generate")) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki izin untuk membuat dokumen resmi." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as CreateDocumentPayload;

    if (!body.docNumber || !body.subject || !body.recipientName) {
      return NextResponse.json(
        { error: "Nomor surat, perihal, dan nama penerima wajib diisi." },
        { status: 400 }
      );
    }

    const doc = await DataService.createDocument({
      userId: session.userId,
      activityId: body.activityId ? Number(body.activityId) : undefined,
      docNumber: body.docNumber,
      docType: body.docType !== undefined ? Number(body.docType) : 1,
      subject: body.subject,
      recipientName: body.recipientName,
      contentPayload: body.contentPayload || {},
      issuedDate: body.issuedDate || new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/documents error:", err);
    return NextResponse.json({ error: "Gagal menyimpan dokumen surat." }, { status: 500 });
  }
}
