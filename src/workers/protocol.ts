import type { Product } from "../types/product";

// --- Requests ---

export type GenerateRequest = {
  type: "GENERATE";
  payload: { count: number };
};

// Worker caches the dataset after GENERATE; FILTER/SORT only send lightweight params
export type FilterRequest = {
  type: "FILTER";
  payload: { query: string; category: string };
};

export type SortRequest = {
  type: "SORT";
  payload: { field: keyof Product; direction: "asc" | "desc" };
};

export type WorkerRequest = GenerateRequest | FilterRequest | SortRequest;

// --- Responses ---

export type GenerateResponse = {
  type: "GENERATE";
  data: Product[];
  error?: string;
};

// FILTER sends back a Uint32Array of matching indices as a Transferable —
// zero-copy transfer, no structured-clone deserialization cost.
// The main thread reconstructs Product[] from fullDatasetRef using these indices.
export type FilterResponse = {
  type: "FILTER";
  indices: Uint32Array;
  error?: string;
};

export type SortResponse = {
  type: "SORT";
  data: Product[];
  error?: string;
};

export type ErrorResponse = {
  type: "ERROR";
  data: null;
  error: string;
};

export type WorkerResponse = GenerateResponse | FilterResponse | SortResponse | ErrorResponse;
