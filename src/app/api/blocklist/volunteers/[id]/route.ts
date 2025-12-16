import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** DELETE /api/blocklist/volunteers/[id] */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // attempt to extract id from params, URL, or request body
    const { id } = await params;
    let idVar = id;

    if (!idVar) {
      try {
        const url = new URL(request.url);
        const parts = url.pathname.split("/").filter(Boolean);
        idVar = parts[parts.length - 1];
      } catch {
        // ignore
      }
    }

    if (!idVar) {
      try {
        const body = await request.json().catch(() => ({}));
        if (body && typeof body.id === "string") idVar = body.id;
      } catch {
        // ignore
      }
    }

    if (!idVar) {
      return NextResponse.json({ error: "Missing volunteer id" }, { status: 400 });
    }

    const deleted = await prisma.volunteer.delete({ where: { id: idVar } });
    return NextResponse.json({ id: deleted.id, deleted: true });
  } catch (err) {
    // Prisma record not found throws P2025
    const error = err as any;
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
    }
    console.error("Error deleting volunteer:", err);
    return NextResponse.json({ error: error?.message || "Failed to remove volunteer" }, { status: 500 });
  }
}
