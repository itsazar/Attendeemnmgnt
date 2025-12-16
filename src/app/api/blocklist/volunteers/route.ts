import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

/** GET/POST /api/blocklist/volunteers */
export async function GET() {
  try {
    const volunteers = await prisma.volunteer.findMany({ orderBy: { joinedAt: "desc" } });
    return NextResponse.json(volunteers);
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load volunteers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { name, phoneNumber, email, joinedAt, comments } = payload;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const now = new Date();
    const created = await prisma.volunteer.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
        email: email ? String(email).trim().toLowerCase() : null,
        joinedAt: joinedAt ? new Date(joinedAt) : now,
        comments: comments ? String(comments).trim() : null,
        updatedAt: now,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating volunteer:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create volunteer" }, { status: 500 });
  }
}
