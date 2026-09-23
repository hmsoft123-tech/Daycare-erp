/**
 * One category tree shared by Purchase Requisitions and Branch Stock,
 * so what a branch requests is reported under the same heading once received.
 */

import type { InventoryItemType, RequisitionKind } from "@/types";

export type StockCategoryDef = {
  value: RequisitionKind;
  label: string;
  /** Physical items that land in branch stock on GRN */
  stocked: boolean;
  subCategories: string[];
  /** Shown under the category picker on PR / item forms */
  hint?: string;
};

export const STOCK_CATEGORIES: StockCategoryDef[] = [
  {
    value: "stationery",
    label: "Stationery",
    stocked: true,
    subCategories: ["Paper & Registers", "Writing Instruments", "Art & Craft", "Office Supplies"],
  },
  {
    value: "groceries",
    label: "Grocery",
    stocked: true,
    subCategories: ["Staples", "Cooking Oil & Ghee", "Beverages", "Snacks", "Dairy"],
  },
  {
    value: "toiletries",
    label: "Toiletries",
    stocked: true,
    subCategories: ["Cleaning Agents", "Tissue & Paper", "Hand Hygiene", "Mops & Tools"],
  },
  {
    value: "montessori",
    label: "Montessori Material",
    stocked: true,
    subCategories: ["Practical Life", "Sensorial", "Mathematics", "Language", "Cultural"],
  },
  {
    value: "fixed_assets",
    label: "Fixed Assets",
    stocked: true,
    subCategories: ["Furniture", "Playground Equipment", "Electronics & Appliances", "Classroom Fixtures"],
  },
  {
    value: "maintenance",
    label: "Maintenance",
    stocked: true,
    subCategories: ["Electrical", "Plumbing", "Paint & Civil", "Tools & Hardware"],
  },
  {
    value: "books",
    label: "Course Material / Books",
    stocked: true,
    subCategories: ["Course Books", "Workbooks", "Copies / Notebooks", "Library Books", "Course Kits"],
    hint: "Books, copies and kits required by a Course Outline are tracked here.",
  },
  {
    value: "printed",
    label: "Printing Material",
    stocked: true,
    subCategories: ["Forms", "ID Cards", "Certificates & Report Cards", "Banners & Flyers"],
  },
  {
    value: "it",
    label: "IT / Technology",
    stocked: true,
    subCategories: ["Hardware", "Accessories", "Software & Licences"],
  },
  {
    value: "courses",
    label: "Staff Training (external seats)",
    stocked: false,
    subCategories: ["First Aid / Safety", "Therapy & Special Needs", "Teaching Skills"],
    hint:
      "Only for buying external training seats for staff (e.g. CPR course fees). " +
      "Academic courses taught to children are managed in Course Outline, not Procurement.",
  },
  {
    value: "inventory",
    label: "General Inventory",
    stocked: true,
    subCategories: ["General"],
  },
  {
    value: "other",
    label: "Other Operational",
    stocked: false,
    subCategories: ["Services", "Miscellaneous"],
  },
];

export const STOCK_CATEGORY_MAP = Object.fromEntries(
  STOCK_CATEGORIES.map((c) => [c.value, c])
) as Record<RequisitionKind, StockCategoryDef>;

/** Categories that appear on Branch Stock filters / reports */
export const STOCKED_CATEGORIES = STOCK_CATEGORIES.filter((c) => c.stocked);

export function categoryLabel(value: RequisitionKind): string {
  return STOCK_CATEGORY_MAP[value]?.label ?? value;
}

export function subCategoriesFor(value: RequisitionKind): string[] {
  return STOCK_CATEGORY_MAP[value]?.subCategories ?? [];
}

export const ITEM_TYPE_LABEL: Record<InventoryItemType, string> = {
  consumable: "Consumable",
  fixed_asset: "Fixed asset",
  course_material: "Course material",
  non_stock: "Non-stock",
};

export type StockStatus = "in_stock" | "low" | "out";

export function stockStatus(qtyOnHand: number, reorderLevel: number): StockStatus {
  if (qtyOnHand <= 0) return "out";
  if (qtyOnHand <= reorderLevel) return "low";
  return "in_stock";
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "In stock",
  low: "Low stock",
  out: "Out of stock",
};
