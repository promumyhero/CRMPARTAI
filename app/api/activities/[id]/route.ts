import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";

interface UpdateActivityPayload {
  title?: string;
  category?: string;
  location?: string;
  picName?: string;
  status?: number;
  startDate?: string;
  endDate?: string | null;
  checklist?: Array<{ id: string; text: string; done: boolean }>;
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const activity = await DataService.getActivityById(numId);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const budgetItems = await DataService.getBudgetItems(numId);
    const documents = await DataService.getDocuments({ activityId: numId });

    return NextResponse.json({ activity, budgetItems, documents });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching activity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = (await req.json()) as UpdateActivityPayload;
    const updateData: Parameters<typeof DataService.updateActivity>[1] = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.picName !== undefined) updateData.picName = body.picName;
    if (body.status !== undefined) updateData.status = Number(body.status);
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : undefined;
    if (body.checklist !== undefined) updateData.checklist = body.checklist;

    const updated = await DataService.updateActivity(numId, updateData);
    if (!updated) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ activity: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating activity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const ok = await DataService.deleteActivity(numId);
    if (!ok) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting activity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
