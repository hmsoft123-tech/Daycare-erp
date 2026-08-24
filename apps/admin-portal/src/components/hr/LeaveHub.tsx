"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { leaveRequests, type LeaveRequest } from "@/data/extended-ops";

export function LeaveHub() {
  const [rows, setRows] = useState(leaveRequests);

  const setStatus = (id: string, status: LeaveRequest["status"]) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === "approved" ? "Leave approved" : "Leave rejected");
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Apply → view → approve/reject · balance & history (SDLC Leave Management)
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold">
                    {r.staffName} · {r.type}
                  </p>
                  <p className="text-xs text-muted">
                    {r.from} → {r.to} ({r.days} day{r.days === 1 ? "" : "s"}) · {r.reason}
                  </p>
                  {r.balanceAfter != null && (
                    <p className="text-[11px] text-muted">Balance after: {r.balanceAfter} days</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.status === "approved"
                        ? "success"
                        : r.status === "rejected"
                          ? "danger"
                          : "warning"
                    }
                    className="capitalize"
                  >
                    {r.status}
                  </Badge>
                  {r.status === "pending" && (
                    <>
                      <Button type="button" size="sm" onClick={() => setStatus(r.id, "approved")}>
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(r.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
