import { useEffect, useRef, useState } from "react";
import { LayoutList, LayoutGrid, Table2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "../data/generator";
import type { ViewMode } from "./ProductCard";

type FilterBarProps = {
  onFilter: (query: string, category: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

const ALL_CATEGORIES = "__all__";

export function FilterBar({ onFilter, viewMode, onViewModeChange }: FilterBarProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilter(query, category === ALL_CATEGORIES ? "" : category);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, onFilter]);

  return (
    <div className="flex flex-wrap gap-2 items-center px-4 py-2.5 border-b border-border bg-background shrink-0">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 pr-8 h-9 text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-44 h-9 text-sm">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center border border-border rounded-md overflow-hidden shrink-0">
        {(
          [
            { mode: "list",  Icon: LayoutList, label: "List view"  },
            { mode: "grid",  Icon: LayoutGrid,  label: "Grid view"  },
            { mode: "table", Icon: Table2,       label: "Table view" },
          ] as const
        ).map(({ mode, Icon, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`flex items-center justify-center h-9 w-9 transition-colors ${
              viewMode === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-label={label}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
