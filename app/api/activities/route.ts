import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";

interface CreateActivityPayload {
  title?: string;
  category?: string;
  location?: string;
  picName?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
  checklist?: Array<{ id: string; text: string; done: boolean }>;
}

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "activities:view")) {
      return NextResponse.json({ error: "Akses ditolak. Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") || undefined;

    const activities = await DataService.getActivities({
      userId: session.userId,
      status: statusParam ? parseInt(statusParam, 10) : undefined,
      search,
    });

    return NextResponse.json({ activities });
  } catch (err: unknown) {
    console.error("GET /api/activities error:", err);
    return NextResponse.json({ error: "Gagal mengambil data kegiatan." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "activities:create")) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki izin untuk membuat kegiatan." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as CreateActivityPayload;

    if (!body.title || !body.startDate) {
      return NextResponse.json({ error: "Judul kegiatan dan tanggal mulai wajib diisi." }, { status: 400 });
    }

    const activity = await DataService.createActivity({
      userId: session.userId,
      title: body.title,
      category: body.category || "Umum",
      location: body.location,
      picName: body.picName,
      status: body.status !== undefined ? Number(body.status) : 1,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      checklist: body.checklist || [],
    });

    if (body.location) {
      await DataService.recordAutofillUsage(session.userId, "location", body.location);
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/activities error:", err);
    return NextResponse.json({ error: "Gagal membuat kegiatan baru." }, { status: 500 });
  }
}
