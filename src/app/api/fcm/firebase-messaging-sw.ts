import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Dynamic Firebase Messaging service worker.
 *
 * Why:
 * - Files in /public cannot read env vars, so the previous SW had firebaseConfig = {}.
 * - We serve the SW from an API route so we can embed env config at request time.
 *
 * Important:
 * - We must allow scope "/" even though script is under "/api/..." by setting
 *   "Service-Worker-Allowed: /".
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Must be JS
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  // Allow controlling the whole origin (scope "/")
  res.setHeader("Service-Worker-Allowed", "/");
  // Prevent caching during dev/debug; safe in prod too
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  // Note: this is plain JS (not TS) executed in SW context.
  const sw = `
// Import Firebase compat scripts (works with onBackgroundMessage)
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize Firebase
const firebaseConfig = ${JSON.stringify(firebaseConfig)};
try {
  firebase.initializeApp(firebaseConfig);
} catch (e) {
  // ignore init errors (e.g. double init)
}

// Initialize Firebase Messaging
let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  // messaging not supported
}

// Forward background payload to any open clients so the app can store it in history
async function broadcastToClients(payload) {
  try {
    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientList) {
      try {
        client.postMessage({ type: "FCM_BACKGROUND_MESSAGE", payload });
      } catch (e) {}
    }
  } catch (e) {}
}

if (messaging && messaging.onBackgroundMessage) {
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || "New Notification";
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || payload.data?.message || "",
      icon: "/assets/logos/PlasIcon.png",
      badge: "/assets/logos/PlasIcon.png",
      data: payload.data,
      requireInteraction: true,
    };

    // Show system notification
    self.registration.showNotification(notificationTitle, notificationOptions);

    // And forward to app for NotificationCenter history
    broadcastToClients(payload);
  });
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification?.data || {};
  const type = data.type;
  const orderId = data.orderId;
  const urlToOpen =
    type === "chat_message" && orderId
      ? "/Messages/" + orderId
      : (type === "new_order" || type === "batch_orders")
        ? "/Plasa/active-batches"
        : "/Plasa/active-batches";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});
`;

  res.status(200).send(sw);
}
