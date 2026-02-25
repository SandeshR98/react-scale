import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import type { WorkerRequest, WorkerResponse } from "../workers/protocol";

export function useWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [lastResponse, setLastResponse] = useState<WorkerResponse | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/dataWorker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      // startTransition marks this as a non-urgent update so React can
      // time-slice the 100K-product render instead of blocking the main
      // thread in one 200ms+ chunk (which triggers the browser violation).
      startTransition(() => {
        setLastResponse(event.data);
      });
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Stable reference — uses ref internally so it never changes identity
  const dispatch = useCallback((request: WorkerRequest) => {
    workerRef.current?.postMessage(request);
  }, []);

  return { dispatch, lastResponse };
}
