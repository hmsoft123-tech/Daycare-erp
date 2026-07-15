"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "./cn";

export type VirtualColumn<T> = {
  id: string;
  header: string;
  width?: number;
  cell: (row: T) => React.ReactNode;
};

type VirtualTableProps<T> = {
  rows: T[];
  columns: VirtualColumn<T>[];
  estimateSize?: number;
  height?: number;
  getRowId: (row: T) => string;
  className?: string;
  emptyMessage?: string;
};

/**
 * Viewport-virtualized table — only DOM nodes for visible rows are mounted.
 * Suitable for attendance grids / large invoice histories.
 */
export function VirtualTable<T>({
  rows,
  columns,
  estimateSize = 52,
  height = 480,
  getRowId,
  className,
  emptyMessage = "No records found",
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
  });

  if (rows.length === 0) {
    return (
      <div className={cn("rounded-2xl bg-white p-10 text-center text-sm text-[var(--muted,#637381)] shadow-[var(--shadow-card)]", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]", className)}>
      <div className="grid border-b border-[#F1F3F5] bg-[#F9FAFB] text-xs font-semibold uppercase tracking-wider text-[var(--muted,#637381)]"
        style={{ gridTemplateColumns: columns.map((c) => (c.width ? `${c.width}px` : "1fr")).join(" ") }}
      >
        {columns.map((col) => (
          <div key={col.id} className="px-4 py-3.5">
            {col.header}
          </div>
        ))}
      </div>

      <div ref={parentRef} style={{ height, overflow: "auto" }}>
        <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={getRowId(row)}
                className="absolute left-0 top-0 grid w-full border-b border-[#F1F3F5] text-sm hover:bg-[#F9FAFB]"
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: columns.map((c) => (c.width ? `${c.width}px` : "1fr")).join(" "),
                }}
              >
                {columns.map((col) => (
                  <div key={col.id} className="flex items-center px-4 py-2">
                    {col.cell(row)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
