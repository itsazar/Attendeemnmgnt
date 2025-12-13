/**
 * demoattendee — src/app/api/export/blocklist/route.ts
 *
 * Brief: Export blocklisted participants as an Excel workbook.
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildWorkbookFromRows, bufferToArrayBuffer } from "@/lib/excel";

/** GET /api/export/blocklist */
export async function GET() {
  try {
    const entries = await prisma.blocklistEntry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Participant: true,
        Event: true,
      },
    });

    type BlocklistRecord = (typeof entries)[number];

    const rows = entries.map((entry: BlocklistRecord) => ({
      "Full Name": entry.Participant.fullName,
      Email: entry.Participant.email,
      Company: entry.Participant.company ?? "",
      City: entry.Participant.city ?? "",
      "Total Missed Events": entry.totalNoShows,
      "First No-Show Event": entry.Event?.name ?? "",
      "First No-Show Date": entry.firstNoShowAt
        ? entry.firstNoShowAt.toISOString().split("T")[0]
        : "",
      "Blocked On": entry.createdAt.toISOString(),
    }));

    const buffer = buildWorkbookFromRows("blocklist", rows);
    const arrayBuffer = bufferToArrayBuffer(buffer);

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="global_blocklist.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to export blocklist",
      },
      { status: 500 },
    );
  }
}
