/**
 * demoattendee — src/lib/validators.ts
 *
 * Brief: Zod schemas for validating API payloads.
 */
import { z } from "zod";

/** Schema for importing events (name and date). */
export const eventImportSchema = z.object({
  eventName: z.string().min(3, "Event name must be at least 3 characters"),
  eventDate: z
    .string()
    .min(1, "Event date is required")
    .refine((val) => !Number.isNaN(Date.parse(val)), "Event date is invalid"),
});

/** Schema for attendance upload payloads. */
export const attendanceUploadSchema = z.object({
  eventId: z.string().min(1, "Event id is required"),
});

/** Schema for exporting confirmed participant lists. */
export const exportConfirmedSchema = z.object({
  eventId: z.string().min(1, "Event id is required"),
});
