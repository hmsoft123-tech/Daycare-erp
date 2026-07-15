import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "PKR"): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currency} ${formatted}`;
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateAge(dob: string): number {
  const birth = parseISO(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export const statusPillStyles = {
  paid: "bg-soft-green text-brand-700",
  overdue: "bg-soft-red text-danger",
  pending: "bg-soft-yellow text-[#B76E00]",
  partial: "bg-soft-cyan text-[#006C9C]",
  present: "bg-soft-green text-brand-700",
  absent: "bg-soft-red text-danger",
  late: "bg-soft-yellow text-[#B76E00]",
  active: "bg-soft-green text-brand-700",
  inquiry: "bg-soft-cyan text-[#006C9C]",
  waitlist: "bg-soft-yellow text-[#B76E00]",
  pending_first_payment: "bg-orange-100 text-orange-700",
  enrol_unpaid: "bg-orange-100 text-orange-700",
  alumni: "bg-bg text-muted",
} as const;
