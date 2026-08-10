import { branches } from "@/data/branches";

const BRANCH_PREFIX: Record<string, string> = {
  "branch-nn": "NN",
  "branch-clifton": "CL",
  "branch-dha": "DH",
  "branch-gulshan": "GU",
};

/** Next sequential G.R. number for a campus (keeps student details; new number on branch change). */
export function generateGrNumber(branchId: string, existing: string[] = []): string {
  const prefix =
    BRANCH_PREFIX[branchId] ??
    branches
      .find((b) => b.id === branchId)
      ?.name.replace(/\s*Campus\s*/i, "")
      .slice(0, 2)
      .toUpperCase() ??
    "GR";

  let max = 45000;
  for (const gr of existing) {
    const m = gr.match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${max + 1}`;
}

export function branchPrefixLabel(branchId: string) {
  return BRANCH_PREFIX[branchId] ?? "GR";
}
