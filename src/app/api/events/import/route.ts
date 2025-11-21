import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseParticipantWorkbook } from "@/lib/excel";
import prisma from "@/lib/prisma";
import { eventImportSchema } from "@/lib/validators";
import { randomUUID } from "crypto";
import { z } from "zod";

type SummaryPayload = {
  totalImported: number;
  newParticipants: number;
  updatedParticipants: number;
  flaggedNoShows: number;
  flaggedBlocklisted: number;
  normalParticipants: number;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const confirmedFile = formData.get("confirmedFile");
    const eventName = formData.get("eventName");
    const eventDate = formData.get("eventDate");

    if (!(confirmedFile instanceof File)) {
      return NextResponse.json(
        { error: "Confirmed participant Excel file is required" },
        { status: 400 }
      );
    }

    let parsedName: string;
    let parsedDate: string;
    try {
      const parsed = eventImportSchema.parse({
        eventName,
        eventDate,
      });
      parsedName = parsed.eventName;
      parsedDate = parsed.eventDate;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return NextResponse.json(
          { error: `Validation failed: ${errorMessages}` },
          { status: 400 }
        );
      }
      throw error;
    }

    const excelBuffer = Buffer.from(await confirmedFile.arrayBuffer());
    const participants = parseParticipantWorkbook(excelBuffer);

    if (!participants.length) {
      return NextResponse.json(
        { error: "No valid participants were found in the uploaded file" },
        { status: 400 }
      );
    }

    const summary: SummaryPayload = {
      totalImported: participants.length,
      newParticipants: 0,
      updatedParticipants: 0,
      flaggedNoShows: 0,
      flaggedBlocklisted: 0,
      normalParticipants: 0,
    };

    const flaggedParticipants: Array<{
      fullName: string;
      email: string;
      company?: string;
      city?: string;
      wasNoShow: boolean;
      isBlocklisted: boolean;
    }> = [];

    const normalParticipants: Array<{
      fullName: string;
      email: string;
      company?: string;
      city?: string;
    }> = [];

    const noShowParticipants: Array<{
      fullName: string;
      email: string;
      company?: string;
      city?: string;
    }> = [];

    const blocklistedParticipants: Array<{
      fullName: string;
      email: string;
      company?: string;
      city?: string;
    }> = [];

    const event = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdEvent = await tx.event.create({
        data: {
          id: randomUUID(),
          name: parsedName,
          eventDate: new Date(parsedDate),
          updatedAt: new Date(),
        },
      });

      const existingParticipants = await tx.participant.findMany({
        where: { email: { in: participants.map((p) => p.email) } },
        include: {
          BlocklistEntry: true,
          _count: { select: { NoShowHistory: true } },
        },
      });
      type ExistingParticipantRecord = (typeof existingParticipants)[number];
      const existingMap = new Map<string, ExistingParticipantRecord>(
        existingParticipants.map((participant: ExistingParticipantRecord) => [
          participant.email,
          participant,
        ])
      );

      for (const participantRow of participants) {
        const existing = existingMap.get(participantRow.email);
        let participantId = existing?.id;

        if (existing) {
          await tx.participant.update({
            where: { id: existing.id },
            data: {
              fullName: participantRow.fullName || existing.fullName,
              company: participantRow.company || existing.company,
              city: participantRow.city || existing.city,
              updatedAt: new Date(),
            },
          });
          summary.updatedParticipants += 1;
        } else {
          const createdParticipant = await tx.participant.create({
            data: {
              id: randomUUID(),
              fullName: participantRow.fullName,
              email: participantRow.email,
              company: participantRow.company,
              city: participantRow.city,
              updatedAt: new Date(),
            },
          });
          participantId = createdParticipant.id;
          existingMap.set(participantRow.email, {
            ...createdParticipant,
            BlocklistEntry: null,
            _count: { NoShowHistory: 0 },
          } as (typeof existingParticipants)[number]);

          summary.newParticipants += 1;
        }

        const currentParticipant = existingMap.get(participantRow.email);
        if (!currentParticipant) {
          continue;
        }

        const wasNoShow = (currentParticipant._count?.NoShowHistory ?? 0) > 0;
        const isBlocklisted = !!currentParticipant.BlocklistEntry;

        // Categorize participants
        if (isBlocklisted) {
          summary.flaggedBlocklisted += 1;
          blocklistedParticipants.push({
            fullName: participantRow.fullName,
            email: participantRow.email,
            company: participantRow.company,
            city: participantRow.city,
          });
          flaggedParticipants.push({
            fullName: participantRow.fullName,
            email: participantRow.email,
            company: participantRow.company,
            city: participantRow.city,
            wasNoShow,
            isBlocklisted,
          });
        } else if (wasNoShow) {
          summary.flaggedNoShows += 1;
          noShowParticipants.push({
            fullName: participantRow.fullName,
            email: participantRow.email,
            company: participantRow.company,
            city: participantRow.city,
          });
          flaggedParticipants.push({
            fullName: participantRow.fullName,
            email: participantRow.email,
            company: participantRow.company,
            city: participantRow.city,
            wasNoShow,
            isBlocklisted,
          });
        } else {
          // Normal participant (no flags)
          summary.normalParticipants += 1;
          normalParticipants.push({
            fullName: participantRow.fullName,
            email: participantRow.email,
            company: participantRow.company,
            city: participantRow.city,
          });
        }

        await tx.eventParticipant.create({
          data: {
            id: randomUUID(),
            eventId: createdEvent.id,
            participantId: participantId!,
            status: "CONFIRMED",
            flaggedNoShow: wasNoShow,
            flaggedBlocklist: isBlocklisted,
            updatedAt: new Date(),
          },
        });
      }

      return createdEvent;
    });

    return NextResponse.json({
      summary,
      flaggedParticipants,
      normalParticipants,
      noShowParticipants,
      blocklistedParticipants,
    });
  } catch (error) {
    console.error("Error in /api/events/import:", error);
    const errorMessage = error instanceof Error ? error.message : "Unable to import participants";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

