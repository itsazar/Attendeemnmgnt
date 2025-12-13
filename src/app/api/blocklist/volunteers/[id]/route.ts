import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** DELETE /api/blocklist/volunteers/[id] */
export async function DELETE(request: Request, { params }: { params?: { id?: string } }) {
  try {
    // attempt to extract id from params, URL, or request body
    let id = params?.id;

    if (!id) {
      try {
        const url = new URL(request.url);
        const parts = url.pathname.split("/").filter(Boolean);
        id = parts[parts.length - 1];
      } catch {
        // ignore
      }
    }

    if (!id) {
      try {
        const body = await request.json().catch(() => ({}));
        if (body && typeof body.id === "string") id = body.id;
      } catch {
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing volunteer id" }, { status: 400 });
    }

    const deleted = await prisma.volunteer.delete({ where: { id } });
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
