import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getCurrentUserOrDefault } from "@/lib/auth/session";

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
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") || undefined;
    const user = await getCurrentUserOrDefault();

    const activities = await DataService.getActivities({
      userId: user.id,
      status: statusParam ? parseInt(statusParam, 10) : undefined,
      search,
    });

    return NextResponse.json({ activities });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch activities";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateActivityPayload;
    const user = await getCurrentUserOrDefault();

    if (!body.title || !body.startDate) {
      return NextResponse.json({ error: "Judul kegiatan dan tanggal mulai wajib diisi." }, { status: 400 });
    }

    const activity = await DataService.createActivity({
      userId: user.id,
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
      await DataService.recordAutofillUsage(user.id, "location", body.location);
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create activity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
