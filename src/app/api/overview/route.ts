/**
 * demoattendee — src/app/api/overview/route.ts
 *
 * Brief: API route returning dashboard summary (counts, event history, blocklist).
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** GET /api/overview - returns dashboard data */
export async function GET() {
  try {
    console.log("API /overview called");
    const [
      participantCount,
      attendedCount,
      noShowCount,
      blocklistCount,
      eventCount,
    ] = await Promise.all([
      prisma.participant.count(),
      prisma.eventParticipant.count({ where: { status: "ATTENDED" } }),
      prisma.eventParticipant.count({ where: { status: "NO_SHOW" } }),
      prisma.blocklistEntry.count(),
      prisma.event.count(),
    ]);

    console.log("Counts:", {
      participantCount,
      attendedCount,
      noShowCount,
      blocklistCount,
      eventCount,
    });

    const events = await prisma.event.findMany({
      orderBy: { eventDate: "desc" },
      include: {
        EventParticipant: {
          include: {
            Participant: true,
          },
        },
      },
    });

    type EventRecord = (typeof events)[number];
    type EventParticipantRecord = EventRecord["EventParticipant"][number];

    const eventHistory = events.map((event: EventRecord) => {
      const totalParticipants = event.EventParticipant.length;
      const attended = event.EventParticipant.filter(
        (participant: EventParticipantRecord) =>
          participant.status === "ATTENDED",
      ).length;
      const noShows = event.EventParticipant.filter(
        (participant: EventParticipantRecord) =>
          participant.status === "NO_SHOW",
      ).length;
      const flagged = event.EventParticipant.filter(
        (participant: EventParticipantRecord) => participant.flaggedBlocklist,
      ).length;

      return {
        id: event.id,
        name: event.name,
        eventDate: event.eventDate.toISOString(),
        totalParticipants,
        attended,
        noShows,
        flagged,
      };
    });

    const noShowHistoryRaw = await prisma.noShowHistory.findMany({
      orderBy: { recordedAt: "desc" },
      include: {
        Participant: true,
        Event: true,
      },
    });

    const noShowHistory = noShowHistoryRaw.map((entry) => ({
      id: entry.id,
      recordedAt: entry.recordedAt.toISOString(),
      participant: entry.Participant,
      event: {
        name: entry.Event.name,
        eventDate: entry.Event.eventDate.toISOString(),
      },
    }));

    const blocklistRaw = await prisma.blocklistEntry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Participant: true,
        Event: true,
      },
    });

    const blocklist = blocklistRaw.map((entry) => ({
      id: entry.id,
      totalNoShows: entry.totalNoShows,
      firstNoShowAt: entry.firstNoShowAt?.toISOString() ?? null,
      participant: entry.Participant,
      firstNoShowEvent: entry.Event ? { name: entry.Event.name } : null,
    }));

    const totalConsidered = attendedCount + noShowCount;
    const noShowPercentage =
      totalConsidered === 0
        ? 0
        : Number(((noShowCount / totalConsidered) * 100).toFixed(2));

    const response = {
      summary: {
        totalParticipants: participantCount,
        totalAttended: attendedCount,
        totalNoShows: noShowCount,
        totalBlocklisted: blocklistCount,
        noShowPercentage,
        totalEvents: eventCount,
      },
      eventHistory,
      noShowHistory,
      blocklist,
    };

    console.log("Response prepared:", JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/overview:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unable to load dashboard data";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);

    // Check if it's a database connection error
    if (
      errorMessage.includes("DATABASE_URL") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("P1001") ||
      errorMessage.includes("P1000")
    ) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. Please check your DATABASE_URL environment variable.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
