"use client";

import { apiBaseUrl } from "@/lib/api/config";
import { getSession } from "next-auth/react";
import { useEffect } from "react";

type NotificationStreamOptions = {
  enabled?: boolean;
  onNotification: () => void;
};

const RETRY_DELAY_MS = 5_000;

export function useNotificationStream({
  enabled = true,
  onNotification,
}: NotificationStreamOptions) {
  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let retryTimer: ReturnType<typeof window.setTimeout> | null = null;
    let controller: AbortController | null = null;

    const connect = async () => {
      controller = new AbortController();

      try {
        const session = await getSession();
        if (!session?.accessToken) return;

        const response = await fetch(`${apiBaseUrl}/notifications/stream`, {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${session.accessToken}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("notification stream unavailable");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let eventName = "";

        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
              continue;
            }

            if (line === "") {
              eventName = "";
              continue;
            }

            if (line.startsWith("data:") && eventName === "notification") {
              onNotification();
            }
          }
        }
      } catch {
        if (stopped || controller?.signal.aborted) return;
      }

      if (!stopped) {
        retryTimer = window.setTimeout(connect, RETRY_DELAY_MS);
      }
    };

    void connect();

    return () => {
      stopped = true;
      controller?.abort();
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [enabled, onNotification]);
}
