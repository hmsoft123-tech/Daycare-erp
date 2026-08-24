"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { libraryBooks, libraryLoans, type LibraryLoan } from "@/data/extended-ops";
import { students } from "@/data/students";

export function LibraryHub() {
  const [loans, setLoans] = useState(libraryLoans);
  const [bookId, setBookId] = useState(libraryBooks.find((b) => b.available > 0)?.id ?? "");
  const [studentId, setStudentId] = useState("s1");

  const issue = () => {
    const book = libraryBooks.find((b) => b.id === bookId);
    const student = students.find((s) => s.id === studentId);
    if (!book || !student || book.available < 1) {
      toast.error("Book unavailable");
      return;
    }
    const loan: LibraryLoan = {
      id: `l-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      childId: student.id,
      childName: student.firstName,
      issuedOn: new Date().toISOString().slice(0, 10),
      dueOn: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: "issued",
    };
    book.available -= 1;
    setLoans((prev) => [loan, ...prev]);
    toast.success("Issued — visible on parent Library");
  };

  const returnLoan = (id: string) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== id || l.status === "returned") return l;
        const book = libraryBooks.find((b) => b.id === l.bookId);
        if (book) book.available = Math.min(book.copies, book.available + 1);
        return {
          ...l,
          status: "returned",
          returnedOn: new Date().toISOString().slice(0, 10),
        };
      })
    );
    toast.success("Returned — parent status updated");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Book</p>
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {libraryBooks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title} ({b.available}/{b.copies})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Student</p>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students
                  .filter((s) => s.status === "active")
                  .slice(0, 12)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={issue} className="w-full">
              Issue book
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold">Catalogue</p>
          <ul className="space-y-2">
            {libraryBooks.map((b) => (
              <li key={b.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-3">
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted">
                  {b.author} · {b.category} · {b.available} available
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Loans</p>
          <ul className="space-y-2">
            {loans.map((l) => (
              <li key={l.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{l.bookTitle}</p>
                    <p className="text-xs text-muted">
                      {l.childName} · due {l.dueOn}
                    </p>
                  </div>
                  <Badge
                    variant={
                      l.status === "returned"
                        ? "success"
                        : l.status === "overdue"
                          ? "danger"
                          : "secondary"
                    }
                    className="capitalize"
                  >
                    {l.status}
                  </Badge>
                </div>
                {l.status !== "returned" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => returnLoan(l.id)}
                  >
                    Mark returned
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
