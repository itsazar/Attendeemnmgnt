import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildWorkbook, bufferToArrayBuffer } from "@/lib/excel";
import { exportConfirmedSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { eventId } = exportConfirmedSchema.parse(payload);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        EventParticipant: {
          where: { status: "NO_SHOW" },
          include: { Participant: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    type EventParticipantRecord = (typeof event.EventParticipant)[number];

    const participantIds = event.EventParticipant.map(
      (participant: EventParticipantRecord) => participant.participantId
    );

    const crossEventHistory = participantIds.length
      ? await prisma.noShowHistory.findMany({
          where: { participantId: { in: participantIds } },
          include: { Participant: true, Event: true },
          orderBy: { recordedAt: "desc" },
        })
      : [];

    const eventRows = event.EventParticipant.map((participant: EventParticipantRecord) => ({
      "Full Name": participant.Participant.fullName,
      Email: participant.Participant.email,
      Company: participant.Participant.company ?? "",
      City: participant.Participant.city ?? "",
      "Event Name": event.name,
      "Event Date": event.eventDate.toISOString().split("T")[0],
    }));

    type NoShowHistoryRecord = (typeof crossEventHistory)[number];

    const historyRows = crossEventHistory.map((entry: NoShowHistoryRecord) => ({
      "Full Name": entry.Participant.fullName,
      Email: entry.Participant.email,
      Company: entry.Participant.company ?? "",
      City: entry.Participant.city ?? "",
      "Event Name": entry.Event.name,
      "Event Date": entry.Event.eventDate.toISOString().split("T")[0],
      Recorded: entry.recordedAt.toISOString(),
    }));

    const buffer = buildWorkbook([
      { name: `${event.name}-no-shows`, rows: eventRows },
      { name: "cross-event-history", rows: historyRows },
    ]);
    const arrayBuffer = bufferToArrayBuffer(buffer);

    const filename = `${event.name.replace(/\s+/g, "_")}_no_show_report.xlsx`;

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
      { error: error instanceof Error ? error.message : "Unable to export no-show report" },
      { status: 500 }
    );
  }
}

