import { prisma } from "@/lib/db";

/**
 * Sérialisation des écritures sur l'agenda.
 *
 * Le problème : réserver, c'est lire la disponibilité puis écrire. Entre les
 * deux, une autre requête peut lire la même disponibilité. Deux clients voient
 * alors « il reste 6 places », passent tous les deux le contrôle, et écrivent
 * tous les deux. Le départ est survendu, et le guide se présente devant deux
 * groupes. Aucune vérification applicative ne peut rattraper ça : c'est une
 * course entre la lecture et l'écriture.
 *
 * La parade : un verrou consultatif Postgres pris en début de transaction. Il
 * est relâché automatiquement au commit (ou au rollback), donc il ne peut pas
 * fuiter — même si le process meurt.
 *
 * Un verrou unique pour tout l'agenda, et non un par créneau : la règle « un
 * seul tour à la fois » fait que des tours *différents* peuvent entrer en
 * conflit. Un verrou par créneau les laisserait passer côte à côte. Pour un
 * guide seul, la contention est de toute façon nulle.
 */
const CALENDAR_LOCK = 728411;

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Exécute `fn` en exclusion mutuelle sur l'agenda, dans une transaction.
 * Toute lecture de disponibilité faite pour décider d'une écriture DOIT passer
 * par le client `tx` fourni, sinon le verrou ne sert à rien.
 */
export function withCalendarLock<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CALENDAR_LOCK})`;
      return fn(tx);
    },
    // Le verrou sérialise : une attente franche vaut mieux qu'un échec sous charge.
    { timeout: 15_000, maxWait: 10_000 }
  );
}
