/**
 * demoattendee — src/app/api/events/[eventId]/attendance/route.ts
 *
 * Brief: Accept attendance Excel uploads (attended/no-show/blocklisted) and record them.
 */
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseParticipantWorkbook } from "@/lib/excel";
import { randomUUID } from "crypto";

/** Summary returned by attendance endpoint */
type AttendanceSummary = {
  totalAttendedMarked: number;
  totalNoShowsMarked: number;
  totalBlocklisted: number;
  missingParticipants: string[];
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;
    const formData = await request.formData();
    const attendedFile = formData.get("attendedFile");
    const noShowFile = formData.get("noShowFile");
    const blocklistedFile = formData.get("blocklistedFile");

    if (
      !(attendedFile instanceof File) &&
      !(noShowFile instanceof File) &&
      !(blocklistedFile instanceof File)
    ) {
      return NextResponse.json(
        { error: "Please upload at least one attendance file" },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const attendedRows =
      attendedFile instanceof File
        ? parseParticipantWorkbook(
            Buffer.from(await attendedFile.arrayBuffer()),
          )
        : [];
    const noShowRows =
      noShowFile instanceof File
        ? parseParticipantWorkbook(Buffer.from(await noShowFile.arrayBuffer()))
        : [];
    const blocklistedRows =
      blocklistedFile instanceof File
        ? parseParticipantWorkbook(
            Buffer.from(await blocklistedFile.arrayBuffer()),
          )
        : [];

    if (!attendedRows.length && !noShowRows.length && !blocklistedRows.length) {
      return NextResponse.json(
        { error: "Uploaded files do not contain any participants" },
        { status: 400 },
      );
    }

    const attendedEmails = new Set(attendedRows.map((row) => row.email));
    const noShowEmails = new Set(noShowRows.map((row) => row.email));
    const blocklistedEmails = new Set(blocklistedRows.map((row) => row.email));
    const allEmails = Array.from(
      new Set([...attendedEmails, ...noShowEmails, ...blocklistedEmails]),
    );

    const participants = await prisma.participant.findMany({
      where: { email: { in: allEmails } },
      include: { BlocklistEntry: true },
    });
    type ParticipantRecord = (typeof participants)[number];
    const participantMap = new Map<string, ParticipantRecord>();
    participants.forEach((participant: ParticipantRecord) => {
      participantMap.set(participant.email, participant);
    });

    const summary: AttendanceSummary = {
      totalAttendedMarked: 0,
      totalNoShowsMarked: 0,
      totalBlocklisted: 0,
      missingParticipants: [],
    };

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ensureEventParticipant = async (participantId: string) => {
        const existing = await tx.eventParticipant.findUnique({
          where: { eventId_participantId: { eventId, participantId } },
        });
        if (existing) {
          return existing;
        }
        return tx.eventParticipant.create({
          data: {
            id: randomUUID(),
            eventId,
            participantId,
            status: "CONFIRMED",
            updatedAt: new Date(),
          },
        });
      };

      for (const email of attendedEmails) {
        const participant = participantMap.get(email);
        if (!participant) {
          summary.missingParticipants.push(email);
          continue;
        }

        await ensureEventParticipant(participant.id);
        await tx.eventParticipant.update({
          where: {
            eventId_participantId: { eventId, participantId: participant.id },
          },
          data: {
            status: "ATTENDED",
            flaggedNoShow: false,
            flaggedBlocklist: false,
            updatedAt: new Date(),
          },
        });

        summary.totalAttendedMarked += 1;
      }

      for (const email of noShowEmails) {
        const participant = participantMap.get(email);
        if (!participant) {
          summary.missingParticipants.push(email);
          continue;
        }

        await ensureEventParticipant(participant.id);
        await tx.eventParticipant.update({
          where: {
            eventId_participantId: { eventId, participantId: participant.id },
          },
          data: {
            status: "NO_SHOW",
            flaggedNoShow: true,
            flaggedBlocklist: false, // Don't auto-flag as blocklisted
            updatedAt: new Date(),
          },
        });

        summary.totalNoShowsMarked += 1;

        // Record in no-show history (only if not already recorded for this event)
        const existingHistory = await tx.noShowHistory.findFirst({
          where: {
            participantId: participant.id,
            eventId,
          },
        });

        if (!existingHistory) {
          await tx.noShowHistory.create({
            data: {
              id: randomUUID(),
              participantId: participant.id,
              eventId,
            },
          });
        }

        // Count total no-shows for this participant (after creating the entry)
        const totalNoShows = await tx.noShowHistory.count({
          where: { participantId: participant.id },
        });

        // Auto-blocklist if they have 2 or more no-shows
        if (totalNoShows >= 2) {
          const existingBlocklist = await tx.blocklistEntry.findUnique({
            where: { participantId: participant.id },
          });

          if (!existingBlocklist) {
            // Find the first no-show event for this participant
            const firstNoShow = await tx.noShowHistory.findFirst({
              where: { participantId: participant.id },
              orderBy: { recordedAt: "asc" },
              include: { Event: true },
            });

            // Create new blocklist entry
            await tx.blocklistEntry.create({
              data: {
                id: randomUUID(),
                participantId: participant.id,
                firstNoShowEventId: firstNoShow?.eventId ?? event.id,
                firstNoShowAt: firstNoShow?.Event?.eventDate ?? event.eventDate,
                totalNoShows: totalNoShows,
                updatedAt: new Date(),
              },
            });
          } else {
            // Update existing blocklist entry with new count
            await tx.blocklistEntry.update({
              where: { participantId: participant.id },
              data: {
                totalNoShows: totalNoShows,
                updatedAt: new Date(),
              },
            });
          }

          // Mark as blocklisted in event participant
          await tx.eventParticipant.update({
            where: {
              eventId_participantId: { eventId, participantId: participant.id },
            },
            data: {
              flaggedBlocklist: true,
              updatedAt: new Date(),
            },
          });
        }
      }

      // Process blocklisted participants
      for (const email of blocklistedEmails) {
        const participant = participantMap.get(email);
        if (!participant) {
          summary.missingParticipants.push(email);
          continue;
        }

        await ensureEventParticipant(participant.id);

        // Mark as blocklisted in event participant
        await tx.eventParticipant.update({
          where: {
            eventId_participantId: { eventId, participantId: participant.id },
          },
          data: {
            flaggedBlocklist: true,
            updatedAt: new Date(),
          },
        });

        // Create or update blocklist entry
        const existingBlocklist = await tx.blocklistEntry.findUnique({
          where: { participantId: participant.id },
        });

        if (existingBlocklist) {
          // Update existing blocklist entry
          await tx.blocklistEntry.update({
            where: { participantId: participant.id },
            data: {
              totalNoShows: existingBlocklist.totalNoShows + 1,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new blocklist entry
          await tx.blocklistEntry.create({
            data: {
              id: randomUUID(),
              participantId: participant.id,
              firstNoShowEventId: event.id,
              firstNoShowAt: event.eventDate,
              totalNoShows: 1,
              updatedAt: new Date(),
            },
          });
        }

        summary.totalBlocklisted += 1;
      }
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to record attendance",
      },
      { status: 500 },
    );
  }
}
