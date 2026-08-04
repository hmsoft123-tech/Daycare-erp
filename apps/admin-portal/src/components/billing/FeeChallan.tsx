"use client";

import type { Invoice, Parent, Student } from "@/types";
import {
  CHALLAN_BANK,
  CHALLAN_TERMS,
  formatChallanDate,
} from "@/lib/fee-challan";

const COPIES = ["Parent Copy", "Bank Copy", "Parent-School Copy"] as const;

function money(n: number) {
  return n.toLocaleString("en-PK");
}

interface FeeChallanProps {
  invoice: Invoice;
  student: Student;
  parents: Parent[];
  branchAddress?: string;
}

function ChallanCopy({
  copyLabel,
  invoice,
  student,
  father,
  phone,
  address,
}: {
  copyLabel: string;
  invoice: Invoice;
  student: Student;
  father: string;
  phone: string;
  address: string;
}) {
  const studentName = `${student.firstName} ${student.lastName}`.toUpperCase();

  return (
    <div className="challan-copy break-inside-avoid border border-black p-3 text-[10px] leading-tight text-black">
      <div className="flex items-start justify-between gap-2 border-b border-black pb-2">
        <div>
          <p className="text-[11px] font-bold uppercase">{CHALLAN_BANK.schoolName}</p>
          <p className="mt-0.5">{address}</p>
          <p className="mt-1 font-semibold">
            {CHALLAN_BANK.bankName} {CHALLAN_BANK.branchNote}
          </p>
          <p>
            Collection A/C: <span className="font-bold">{CHALLAN_BANK.collectionAccountNo}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold uppercase">{copyLabel}</p>
          <p className="mt-1">Fee Challan</p>
          <p className="font-mono text-[11px] font-bold">{invoice.invoiceNumber}</p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1">
        <p>
          <span className="text-gray-600">Issue Date:</span>{" "}
          <span className="font-semibold">{formatChallanDate(invoice.issueDate)}</span>
        </p>
        <p>
          <span className="text-gray-600">Due Date:</span>{" "}
          <span className="font-semibold">{formatChallanDate(invoice.dueDate)}</span>
        </p>
        <p>
          <span className="text-gray-600">Validity Date:</span>{" "}
          <span className="font-semibold">{formatChallanDate(invoice.validityDate)}</span>
        </p>
        <p>
          <span className="text-gray-600">G.R. Number:</span>{" "}
          <span className="font-semibold">{invoice.grNumber}</span>
        </p>
        <p>
          <span className="text-gray-600">Consumer #:</span>{" "}
          <span className="font-semibold">{invoice.consumerNumber}</span>
        </p>
        <p>
          <span className="text-gray-600">Class ID:</span>{" "}
          <span className="font-semibold">{invoice.consumerNumber}</span>
        </p>
        <p className="col-span-2">
          <span className="text-gray-600">Name:</span>{" "}
          <span className="font-semibold">{studentName}</span>
        </p>
        <p>
          <span className="text-gray-600">Class:</span>{" "}
          <span className="font-semibold">{student.className}</span>
        </p>
        <p className="col-span-2">
          <span className="text-gray-600">Father&apos;s Name:</span>{" "}
          <span className="font-semibold">{father}</span>
        </p>
        <p>
          <span className="text-gray-600">Phone:</span>{" "}
          <span className="font-semibold">{phone}</span>
        </p>
      </div>

      <table className="mt-2 w-full border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 text-left font-semibold">Particulars</th>
            <th className="border border-black px-1 py-1 text-right font-semibold">Amount (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item) => (
            <tr key={item.id}>
              <td className="border border-black px-1 py-0.5">{item.description}</td>
              <td className="border border-black px-1 py-0.5 text-right">{money(item.amount)}</td>
            </tr>
          ))}
          <tr>
            <td className="border border-black px-1 py-0.5 font-semibold">
              Total Payable (Before Due Date)
            </td>
            <td className="border border-black px-1 py-0.5 text-right font-bold">
              {money(invoice.amount)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5 font-semibold">
              Total Payable (After Due Date) incl. late fee {money(invoice.lateFeeAfterDue)}
            </td>
            <td className="border border-black px-1 py-0.5 text-right font-bold">
              {money(invoice.amountAfterDue)}
            </td>
          </tr>
        </tbody>
      </table>

      <ol className="mt-2 list-decimal space-y-0.5 pl-3 text-[9px]">
        {CHALLAN_TERMS.map((term) => (
          <li key={term}>{term}</li>
        ))}
      </ol>

      <div className="mt-3 flex justify-between gap-4 pt-2">
        <div className="w-1/3 border-t border-black pt-1 text-center">Bank Stamp / Signature</div>
        <div className="w-1/3 border-t border-black pt-1 text-center">Cashier</div>
        <div className="w-1/3 border-t border-black pt-1 text-center">Parent Signature</div>
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
    <div className="fee-challan space-y-3 bg-white text-black">
      {COPIES.map((label) => (
        <ChallanCopy
          key={label}
          copyLabel={label}
          invoice={invoice}
          student={student}
          father={father}
          phone={phone}
          address={address}
        />
      ))}
    </div>
  );
}
