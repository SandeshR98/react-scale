import { generateProducts } from "../data/generator";
import { filterProducts, sortProducts } from "../data/operations";
import type { Product } from "../types/product";
import type { WorkerRequest, WorkerResponse } from "./protocol";

// Worker-local dataset — avoids re-sending 100K records on every FILTER/SORT
let cachedDataset: Product[] = [];

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    switch (request.type) {
      case "GENERATE": {
        const data = generateProducts(request.payload.count);
        cachedDataset = data;
        const response: WorkerResponse = { type: "GENERATE", data };
        self.postMessage(response);
        break;
      }
      case "FILTER": {
        const { query, category } = request.payload;
        const data = filterProducts(cachedDataset, query, category);
        const response: WorkerResponse = { type: "FILTER", data };
        self.postMessage(response);
        break;
      }
      case "SORT": {
        const { field, direction } = request.payload;
        const data = sortProducts(cachedDataset, field, direction);
        const response: WorkerResponse = { type: "SORT", data };
        self.postMessage(response);
        break;
      }
      default: {
        const response: WorkerResponse = {
          type: "ERROR",
          data: null,
          error: `Unknown request type: ${(request as WorkerRequest).type}`,
        };
        self.postMessage(response);
      }
    }
  } catch (err) {
    const response: WorkerResponse = {
      type: "ERROR",
      data: null,
      error: err instanceof Error ? err.message : "Unknown worker error",
    };
    self.postMessage(response);
  }
};
