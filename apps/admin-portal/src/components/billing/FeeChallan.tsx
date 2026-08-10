"use client";

import type { Invoice, Parent, Student } from "@/types";
import { CHALLAN_BANK, CHALLAN_TERMS, formatChallanDate } from "@/lib/fee-challan";

type CopyTheme = {
  label: string;
  /** Banner + table header */
  accent: string;
  accentText: string;
  totalBg: string;
};

/** Order & colors match the bank-accepted SDLC voucher */
const COPIES: CopyTheme[] = [
  { label: "Bank Copy", accent: "#3B82F6", accentText: "#ffffff", totalBg: "#DBEAFE" },
  { label: "Parent's Copy", accent: "#A3E635", accentText: "#14532D", totalBg: "#ECFCCB" },
  { label: "Parent / School's Copy", accent: "#22C55E", accentText: "#ffffff", totalBg: "#DCFCE7" },
];

function money(n: number) {
  return n.toLocaleString("en-PK");
}

function challanGr(gr: string) {
  const digits = gr.replace(/\D/g, "");
  return digits || gr;
}

function SchoolLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <circle cx="20" cy="20" r="19" fill="#F97316" />
      <circle cx="20" cy="20" r="14" fill="#FDBA74" />
      <path
        d="M20 8c2 4 2 7 0 10-2-3-2-6 0-10zm0 6c4 2 7 5 8 9-5-1-8-3-8-9zm0 0c-4 2-7 5-8 9 5-1 8-3 8-9zm-1 10c-3 2-5 5-5 8h12c0-3-2-6-5-8-1 1-1 1-2 0z"
        fill="#DC2626"
      />
    </svg>
  );
}

interface FeeChallanProps {
  invoice: Invoice;
  student: Student;
  parents: Parent[];
  branchAddress?: string;
}

function ChallanCopy({
  theme,
  invoice,
  student,
  father,
  phone,
  address,
}: {
  theme: CopyTheme;
  invoice: Invoice;
  student: Student;
  father: string;
  phone: string;
  address: string;
}) {
  const studentName = `${student.firstName} ${student.lastName}`.toUpperCase();
  const gr = challanGr(invoice.grNumber || student.grNumber || "");
  const phoneClean = phone.replace(/\s+/g, "");

  return (
    <div
      className="challan-pane relative flex h-full min-h-0 flex-col bg-white text-black"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Colored copy banner */}
      <div
        className="px-1.5 py-1 text-center text-[9px] font-bold tracking-wide"
        style={{ backgroundColor: theme.accent, color: theme.accentText }}
      >
        {theme.label}
      </div>

      {/* Logo + school + bank */}
      <div className="flex items-start gap-1.5 px-1.5 pt-1.5">
        <SchoolLogo />
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[8.5px] font-bold uppercase leading-tight">
            {CHALLAN_BANK.schoolName.toUpperCase()}
          </p>
          <p className="mt-0.5 text-[8px] font-semibold">{CHALLAN_BANK.bankName}</p>
          <p className="text-[7.5px]">{CHALLAN_BANK.branchNote}</p>
        </div>
      </div>

      {/* Collection account box */}
      <div className="mx-1.5 mt-1.5 border border-black px-1 py-1 text-center">
        <p className="text-[8px]">
          Collection Account No.{" "}
          <span className="text-[9px] font-bold">{CHALLAN_BANK.collectionAccountNo}</span>
        </p>
      </div>

      {/* GR + Consumer */}
      <div className="mx-1.5 mt-1 flex justify-between text-[8px] font-bold">
        <span>G.R. NUMBER: {gr}</span>
        <span>Consumer # {invoice.consumerNumber}</span>
      </div>

      {/* Dates */}
      <div className="mx-1.5 mt-1 grid grid-cols-3 border border-black text-center text-[7.5px]">
        <div className="border-r border-black px-0.5 py-1">
          <p className="font-semibold">Issue Date</p>
          <p className="font-bold">{formatChallanDate(invoice.issueDate)}</p>
        </div>
        <div className="border-r border-black px-0.5 py-1">
          <p className="font-semibold">Due Date</p>
          <p className="font-bold">{formatChallanDate(invoice.dueDate)}</p>
        </div>
        <div className="px-0.5 py-1">
          <p className="font-semibold">Validity Date</p>
          <p className="font-bold">{formatChallanDate(invoice.validityDate)}</p>
        </div>
      </div>

      {/* Name / Class / ID — same row order as bank voucher */}
      <div className="mx-1.5 mt-1 border border-black text-[7.5px]">
        <div className="grid grid-cols-[1.2fr_1fr_auto] gap-x-1 border-b border-black px-1 py-0.5">
          <p>
            <span className="font-semibold">Name:</span> {studentName}
          </p>
          <p className="font-semibold">{student.className}</p>
          <p className="whitespace-nowrap text-right">
            <span className="font-semibold">ID</span> {invoice.consumerNumber}
          </p>
        </div>
        <div className="flex items-center justify-between gap-1 px-1 py-0.5">
          <p>
            <span className="font-semibold">Father&apos;s Name:</span> {father.toUpperCase()}
          </p>
          <p className="font-semibold">{phoneClean}</p>
        </div>
      </div>

      {/* Fee table */}
      <table className="mx-1.5 mt-1 w-[calc(100%-0.75rem)] flex-1 border-collapse text-[7.5px]">
        <thead>
          <tr style={{ backgroundColor: theme.accent, color: theme.accentText }}>
            <th className="border border-black px-1 py-0.5 text-left font-bold">Particulars</th>
            <th className="w-[30%] border border-black px-1 py-0.5 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item) => (
            <tr key={item.id}>
              <td className="border border-black px-1 py-0.5 align-top">{item.description}</td>
              <td className="border border-black px-1 py-0.5 text-right align-top">
                {money(item.amount)}
              </td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, 5 - invoice.lineItems.length) }).map((_, i) => (
            <tr key={`pad-${i}`}>
              <td className="border border-black px-1 py-2.5">&nbsp;</td>
              <td className="border border-black px-1 py-2.5">&nbsp;</td>
            </tr>
          ))}
          <tr style={{ backgroundColor: theme.totalBg }}>
            <td className="border border-black px-1 py-0.5 font-bold">Before Due Date:</td>
            <td className="border border-black px-1 py-0.5 text-right font-bold">
              {money(invoice.amount)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5 font-bold">After Due Date:</td>
            <td className="border border-black px-1 py-0.5 text-right text-[9px] font-bold">
              {money(invoice.amountAfterDue)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Stamps */}
      <div className="mx-1.5 mt-2 grid grid-cols-3 items-end gap-1">
        <div className="border-b border-dotted border-black pb-0.5 text-center text-[7px]">
          Bank Stamp
        </div>
        <div className="flex justify-center pb-0.5">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-center text-[6px] font-bold leading-tight"
            style={{ borderColor: "#16A34A", color: "#15803D" }}
          >
            THANK YOU
            <br />
            PAID
            <br />
            THANK YOU
          </div>
        </div>
        <div className="border-b border-dotted border-black pb-0.5 text-center text-[7px]">
          Authorized Signature
        </div>
      </div>

      <p className="mx-1.5 mt-1.5 text-[7px]">
        <span className="font-semibold">Address:</span> {address}
      </p>

      <div className="mx-1.5 mt-auto border-t border-black pt-0.5 text-[6px] leading-tight text-gray-700">
        <p>
          {CHALLAN_BANK.ibanNote}, These funds are intended for {CHALLAN_BANK.schoolName} held with{" "}
          {CHALLAN_BANK.heldWith}. Collection Account # {CHALLAN_BANK.collectionAccountNo}
        </p>
      </div>
    </div>
  );
}

export function FeeChallan({ invoice, student, parents, branchAddress }: FeeChallanProps) {
  const father =
    parents.find((p) => p.relation === "father")?.name ??
    parents[0]?.name ??
    "—";
  const phone =
    parents.find((p) => p.relation === "father")?.phone ??
    parents[0]?.phone ??
    "—";
  const address = branchAddress ?? CHALLAN_BANK.address;

  return (
    <div className="fee-challan bg-white text-black">
      {/* Page 1 — three copies with dashed cut lines */}
      <div className="challan-sheet challan-sheet-main grid grid-cols-3">
        {COPIES.map((theme, idx) => (
          <div
            key={theme.label}
            className={
              idx < COPIES.length - 1
                ? "border-r border-dashed border-gray-400 pr-1"
                : "pl-0"
            }
            style={idx > 0 ? { paddingLeft: 4 } : undefined}
          >
            <ChallanCopy
              theme={theme}
              invoice={invoice}
              student={student}
              father={father}
              phone={phone}
              address={address}
            />
          </div>
        ))}
      </div>

      {/* Page 2 — terms (same as bank voucher reverse) */}
      <div className="challan-sheet challan-sheet-terms mt-3 grid grid-cols-3 print:mt-0">
        {COPIES.map((theme, idx) => (
          <div
            key={`terms-${theme.label}`}
            className={
              idx < COPIES.length - 1
                ? "border-r border-dashed border-gray-400 px-2 py-2"
                : "px-2 py-2"
            }
          >
            <div
              className="mb-1 px-1 py-0.5 text-center text-[8px] font-bold"
              style={{ backgroundColor: theme.accent, color: theme.accentText }}
            >
              {theme.label}
            </div>
            <p className="mb-1 text-center text-[8px] font-bold uppercase">Terms &amp; Conditions</p>
            <ul className="list-disc space-y-1 pl-3 text-[7.5px] leading-snug">
              {CHALLAN_TERMS.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
            <p className="mt-2 text-[7px]">
              <span className="font-semibold">Address:</span> {CHALLAN_BANK.address}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
