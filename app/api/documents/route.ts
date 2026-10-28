import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getCurrentUserOrDefault } from "@/lib/auth/session";

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
    const { searchParams } = new URL(req.url);
    const activityIdStr = searchParams.get("activityId");
    const user = await getCurrentUserOrDefault();

    const docs = await DataService.getDocuments({
      userId: user.id,
      activityId: activityIdStr ? parseInt(activityIdStr, 10) : undefined,
    });

    return NextResponse.json({ documents: docs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching documents";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateDocumentPayload;
    const user = await getCurrentUserOrDefault();

    if (!body.docNumber || !body.subject || !body.recipientName) {
      return NextResponse.json(
        { error: "Nomor surat, perihal, dan nama penerima wajib diisi." },
        { status: 400 }
      );
    }

    const doc = await DataService.createDocument({
      userId: user.id,
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
    const msg = err instanceof Error ? err.message : "Error creating document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
