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

    // startTransition defers the re-render so React can time-slice instead of
    // blocking for the full 100K-product update in a single synchronous chunk.
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
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

  const dispatch = useCallback((request: WorkerRequest) => {
    workerRef.current?.postMessage(request);
  }, []);

  return { dispatch, lastResponse };
}
