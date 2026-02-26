import type { Product } from "../types/product";

export type GenerateRequest = {
  type: "GENERATE";
  payload: { count: number };
};

export type FilterRequest = {
  type: "FILTER";
  payload: { query: string; category: string };
};

export type SortRequest = {
  type: "SORT";
  payload: { field: keyof Product; direction: "asc" | "desc" };
};

export type WorkerRequest = GenerateRequest | FilterRequest | SortRequest;

export type GenerateResponse = {
  type: "GENERATE";
  data: Product[];
};

// Transferable Uint32Array — zero-copy; main thread rebuilds Product[] via fullDatasetRef.
export type FilterResponse = {
  type: "FILTER";
  indices: Uint32Array;
};

export type SortResponse = {
  type: "SORT";
  data: Product[];
};

export type ErrorResponse = {
  type: "ERROR";
  data: null;
  error: string;
};

export type WorkerResponse = GenerateResponse | FilterResponse | SortResponse | ErrorResponse;
