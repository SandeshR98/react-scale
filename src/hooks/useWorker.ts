import { useCallback, useEffect, useRef, useState } from "react";
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
      setLastResponse(event.data);
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
