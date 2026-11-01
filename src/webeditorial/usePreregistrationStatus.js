import { useEffect, useState } from "react";

const initialState = {
  phase: "loading",
  ready: false,
  reason: null,
  policy: null,
};

export default function usePreregistrationStatus() {
  const [status, setStatus] = useState(initialState);

  useEffect(() => {
    const controller = new AbortController();

    async function checkStatus() {
      try {
        const response = await fetch("/api/kiri-preregister-status", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type") || "";

        if (!response.ok || !contentType.includes("application/json")) {
          throw new Error("readiness endpoint unavailable");
        }

        const result = await response.json();
        setStatus({
          phase: "complete",
          ready: result.ready === true,
          reason: result.reason || null,
          policy: result.policy || null,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setStatus({
          phase: "complete",
          ready: false,
          reason: "unavailable",
          policy: null,
        });
      }
    }

    checkStatus();
    return () => controller.abort();
  }, []);

  return status;
}
