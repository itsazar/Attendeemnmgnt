import { z } from "zod";

export const eventImportSchema = z.object({
  eventName: z.string().min(3, "Event name must be at least 3 characters"),
  eventDate: z
    .string()
    .min(1, "Event date is required")
    .refine((val) => !Number.isNaN(Date.parse(val)), "Event date is invalid"),
});

export const attendanceUploadSchema = z.object({
  eventId: z.string().min(1, "Event id is required"),
});

export const exportConfirmedSchema = z.object({
  eventId: z.string().min(1, "Event id is required"),
});

