import { prisma } from "@/lib/db";

/**
 * Bascule les holds périmés en "expired".
 *
 * Le moteur de disponibilité ignore déjà les holds expirés, donc ce balayage
 * n'est pas nécessaire à la correction — il évite juste que des réservations
 * fantômes traînent dans le dashboard du guide. Volontairement silencieux : ce
 * n'est jamais une raison de faire échouer la requête en cours.
 */
export async function expireStaleHolds(): Promise<number> {
  try {
    const { count } = await prisma.booking.updateMany({
      where: { status: "on_hold", holdExpiresAt: { lt: new Date() } },
      data: { status: "expired" },
    });
    return count;
  } catch (err) {
    console.error("[octo] expireStaleHolds failed:", err);
    return 0;
  }
}
