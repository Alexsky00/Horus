import webpush from "web-push";
import { prisma } from "./db";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Envoie une notification push à tous les appareils abonnés.
 * Si l'abonnement est expiré (410), il est supprimé automatiquement.
 */
export async function sendPushToAll(payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany();
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // Abonnement invalide ou expiré → on supprime
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      }
    })
  );
  return results;
}

/**
 * Envoie un email de fallback via nodemailer (si configuré).
 * Silencieux si SMTP non configuré.
 */
export async function sendEmailFallback(subject: string, text: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return;
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      subject,
      text,
    });
  } catch (e) {
    console.error("Email fallback failed:", e);
  }
}
