/**
 * demoattendee — src/app/api/export/confirmed/route.ts
 *
 * Brief: Export confirmed participants for an event as an Excel workbook.
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildWorkbookFromRows, bufferToArrayBuffer } from "@/lib/excel";
import { exportConfirmedSchema } from "@/lib/validators";

/** POST /api/export/confirmed */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { eventId } = exportConfirmedSchema.parse(payload);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        EventParticipant: {
          where: { status: "CONFIRMED" },
          include: { Participant: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    type EventParticipantRecord = (typeof event.EventParticipant)[number];

    const filtered = event.EventParticipant.filter(
      (participant: EventParticipantRecord) =>
        !participant.flaggedBlocklist && !participant.flaggedNoShow,
    );

    const rows = filtered.map((participant: EventParticipantRecord) => ({
      "Full Name": participant.Participant.fullName,
      Email: participant.Participant.email,
      Company: participant.Participant.company ?? "",
      City: participant.Participant.city ?? "",
    }));

    const buffer = buildWorkbookFromRows(`${event.name}-confirmed`, rows);
    const arrayBuffer = bufferToArrayBuffer(buffer);
    const filename = `${event.name.replace(/\s+/g, "_")}_filtered_confirmed.xlsx`;

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to export confirmed list",
      },
      { status: 500 },
    );
  }
}
