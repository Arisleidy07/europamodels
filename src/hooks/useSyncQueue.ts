"use client";

import { useEffect, useRef } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { getSyncQueue, removeSyncQueueItem } from "@/lib/localDb";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function useSyncQueue() {
  const online = useOnlineStatus();
  const processing = useRef(false);

  useEffect(() => {
    if (!online || processing.current) return;

    const processQueue = async () => {
      processing.current = true;
      const firestore = getFirebaseDb();
      if (!firestore) {
        processing.current = false;
        return;
      }

      try {
        const queue = await getSyncQueue();
        for (const item of queue) {
          try {
            if (item.tipo === "crearCotizacion") {
              const datos = item.datos as any;
              await setDoc(doc(firestore, "quotes", datos.id), {
                ...datos,
                createdAt: serverTimestamp(),
              });
            }
            await removeSyncQueueItem(item.id);
          } catch {
            // Will retry on next online event
          }
        }
      } catch {
        // Silent fail
      } finally {
        processing.current = false;
      }
    };

    processQueue();
  }, [online]);
}
