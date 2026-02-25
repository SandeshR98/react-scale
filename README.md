# ReactScale

A high-performance React SPA that renders and manages a dataset of **100,000 product cards** without breaking a sweat. Built as a hands-on deep-dive into React performance patterns, virtualization, and Web Workers.

**[Live Demo →](https://react-scale.vercel.app)**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)

---

## Features

- **100K product dataset** generated deterministically on the client — no server required
- **Three view modes** — Grid, List, and Table, each fully virtualized
- **TanStack Virtual** — only the visible rows/cards are mounted in the DOM at any time
- **TanStack Table** — sortable columns with client-side sort in the table view
- **Web Worker** — filter and sort operations run off the main thread to keep the UI responsive
- **Full-text search** — searches across all fields (name, category, price, rating, stock, etc.) with AND token semantics
- **Category filter** — dropdown filter combined with full-text search
- **Product detail modal** — click any card or row to open a detail dialog with image, stats, and trend score
- **Performance panel** — live toggle for virtualization on/off, worker on/off, and visible item count
- **shadcn/ui** components throughout — Card, Badge, Dialog, Select, Input, Switch, Table, and more

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Virtualization | TanStack Virtual v3 |
| Table | TanStack Table v8 |
| Icons | Lucide React |
| Off-thread compute | Web Workers (native browser API) |

---

## Project Structure

```
src/
├── components/
│   ├── FilterBar.tsx        # Search input + category select + view mode toggles
│   ├── PerformancePanel.tsx # Live metrics + virtualization/worker toggles
│   ├── ProductCard.tsx      # Grid and list card variants (React.memo)
│   ├── ProductList.tsx      # Virtualizer orchestrator for grid + list views
│   ├── ProductModal.tsx     # Product detail dialog
│   └── ProductTable.tsx     # TanStack Table + TanStack Virtual table view
├── data/
│   ├── generator.ts         # Deterministic 100K product generator
│   └── operations.ts        # filterProducts + sortProducts (used in worker)
├── hooks/
│   └── useWorker.ts         # Stable Web Worker hook
├── types/
│   └── product.ts           # Product interface
├── workers/
│   ├── dataWorker.ts        # Worker: GENERATE / FILTER / SORT handlers
│   └── protocol.ts          # WorkerRequest / WorkerResponse discriminated unions
└── App.tsx                  # Root: useReducer state, useDeferredValue, worker wiring
```

---

## Getting Started

**Prerequisites:** Node.js 18+ and npm

```bash
# Clone the repo
git clone https://github.com/SandeshR98/react-scale.git
cd react-scale

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

---

## Key Architecture Decisions

### Virtualization
TanStack Virtual is used for all three view modes. The grid view groups products into rows of 3 and virtualizes rows. The table view uses a separate virtualizer instance inside `ProductTable`. When virtualization is toggled off, a naive render is capped at 5,000 nodes to prevent the browser from hanging — a warning banner is shown.

### Web Worker
All filter and sort operations are dispatched to a dedicated Web Worker (`dataWorker.ts`). The worker caches the full 100K dataset after the initial `GENERATE` message so subsequent `FILTER` and `SORT` calls don't re-serialize the data. The `useWorker` hook exposes a stable `dispatch` function (via `useCallback`) so toggling the worker on/off never causes the debounced search input to spuriously re-fire.

### useDeferredValue
The virtualization toggle uses `useDeferredValue` so the switch UI responds instantly while the list re-renders lazily in the background, preventing jank when switching between virtualized and naive modes.

### Full-text Search
Search input is split into whitespace-separated tokens. All tokens must match a single lowercased haystack built from every product field (AND semantics). For example, searching `"ele 4.5"` returns Electronics products with a 4.5 rating.
