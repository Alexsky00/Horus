"use client";
import { useState, useEffect } from "react";

export default function PushSubscribe() {
  const [state, setState] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    // Enregistre le service worker au montage
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => { if (sub) setState("subscribed"); });
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState("subscribed");
    } catch (e: any) {
      if (e.name === "NotAllowedError") setState("denied");
      else console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setState("idle");
  }

  async function sendTest() {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Horus", body: "Les notifications fonctionnent !" }),
    });
  }

  if (state === "unsupported") return null;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-wrap items-center gap-3">
      <span className="text-slate-300 text-sm">Notifications Android :</span>
      {state === "subscribed" ? (
        <>
          <span className="text-green-400 text-sm font-medium">✓ Activées</span>
          <button onClick={sendTest} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-slate-300">
            Tester
          </button>
          <button onClick={unsubscribe} className="text-xs text-slate-500 hover:text-red-400">
            Désactiver
          </button>
        </>
      ) : state === "denied" ? (
        <span className="text-red-400 text-sm">Accès refusé — active les notifs dans les réglages du navigateur</span>
      ) : (
        <button
          onClick={subscribe}
          disabled={loading}
          className="text-xs bg-amber-500 hover:bg-amber-400 text-black px-3 py-1 rounded font-medium disabled:opacity-50"
        >
          {loading ? "..." : "Activer les notifications"}
        </button>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}
