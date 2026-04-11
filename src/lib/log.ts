import { prisma } from "./db";

export type LogAction = "created" | "confirmed" | "refused" | "deleted";

export async function writeLog(
  action: LogAction,
  bookingId: string | null,
  details: string
) {
  try {
    await prisma.log.create({
      data: { action, bookingId: bookingId ?? undefined, details },
    });
  } catch {
    // Le log ne doit jamais faire planter l'action principale
    console.error("[log] Failed to write log:", action, details);
  }
}
