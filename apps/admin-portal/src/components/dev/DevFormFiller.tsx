"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Development only: a floating "Fill form" button (or Alt+Shift+F) that fills the
 * open modal — or the page's form — with realistic test data. Values are picked
 * from each field's label / name / type, so it works for every form without
 * per-form code. Only empty fields are touched; hold Shift while clicking to
 * overwrite everything. Never rendered in a production build.
 */

const rand = () => Math.random().toString(36).slice(2, 7);
const digits = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

function isoDate(offsetDays: number, offsetYears = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Label / name / placeholder text that describes a field, lower-cased. */
function describe(el: Element): string {
  const parts = [
    el.getAttribute("id"),
    el.getAttribute("name"),
    el.getAttribute("placeholder"),
    el.getAttribute("aria-label"),
  ];
  const id = el.getAttribute("id");
  if (id) parts.push(document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent ?? null);
  parts.push(el.closest("label")?.textContent ?? null);
  // shadcn layout: <div><Label/>…<Input/></div>
  const box = el.parentElement?.closest("div");
  parts.push(box?.querySelector("label")?.textContent ?? null);
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function textValue(hint: string, textarea: boolean, s: string): string {
  // What the field holds comes before whose it is ("Mother occupation" → occupation).
  const rules: [RegExp, string][] = [
    [/user ?name|login/, "test-admin"],
    [/cnic/, "35202-1234567-1"],
    [/b-?form|birth cert/, "35202-7654321-1"],
    [/relation/, "Uncle"],
    [/occupation|profession/, "Engineer"],
    [/nationality/, "Pakistani"],
    [/blood/, "O+"],
    [/allerg/, "None"],
    [/pediatric|doctor|physician/, "Dr. Tariq"],
    [/qualification|degree/, "B.Ed"],
    [/position|designation|job title/, "Teacher"],
    [/address/, "House 5, Street 10, DHA, Karachi"],
    [/city/, "Karachi"],
    [/previous school/, "N/A"],
    [/location|room|venue/, "Main campus"],
    [/reference|transaction|receipt|txn/, `TXN-${digits(6)}`],
    [/father/, "Rao Hammad Ali"],
    [/mother/, "Ayesha Ali"],
    [/emergency/, "Ahmad Raza"],
    [/first ?name/, "Zain"],
    [/last ?name|surname/, "Ali"],
    [/child|student/, `Zain Ali ${s}`],
    [/parent|guardian/, "Rao Hammad Ali"],
    [/applicant|candidate|full ?name|staff ?name|employee ?name/, `Test Candidate ${s}`],
    [/code|number|no\b/, `DEV-${s.toUpperCase()}`],
    [/url|link|website/, "https://example.com"],
    [/title|subject/, `Dev test ${s}`],
    [/name/, `Test ${s}`],
  ];
  for (const [re, v] of rules) if (re.test(hint)) return v;
  return textarea ? "Dev test data — safe to delete." : "Test";
}

function numberValue(hint: string, el: HTMLInputElement): string {
  const rules: [RegExp, number][] = [
    [/salary/, 45000],
    [/tuition|fee|amount|price|paid|cost|rate/, 15000],
    [/discount|percent|%/, 10],
    [/experience|years/, 3],
    [/age/, 4],
    [/rating/, 5],
    [/month/, 3],
    [/qty|quantity|stock|capacity|count|seats/, 10],
  ];
  let n = rules.find(([re]) => re.test(hint))?.[1] ?? 1;
  const min = el.min !== "" ? Number(el.min) : null;
  const max = el.max !== "" ? Number(el.max) : null;
  if (min !== null && n < min) n = min;
  if (max !== null && n > max) n = max;
  return String(n);
}

function valueFor(el: HTMLInputElement | HTMLTextAreaElement, s: string): string {
  const hint = describe(el);
  if (el instanceof HTMLTextAreaElement) return textValue(hint, true, s);
  switch (el.type) {
    case "email":
      return `dev.${s}@example.com`;
    case "password":
      return "DevPass123!";
    case "tel":
      return `+92300${digits(7)}`;
    case "number":
      return numberValue(hint, el);
    case "date":
      return /dob|birth/.test(hint) ? isoDate(0, -3) : isoDate(7);
    case "time":
      return "11:00";
    case "datetime-local":
      return `${isoDate(7)}T11:00`;
    case "month":
      return isoDate(30).slice(0, 7);
    case "url":
      return "https://example.com";
  }
  if (/e-?mail/.test(hint)) return `dev.${s}@example.com`;
  if (/phone|mobile|whatsapp|contact no|cell/.test(hint)) return `+92300${digits(7)}`;
  if (/password/.test(hint)) return "DevPass123!";
  const v = textValue(hint, false, s);
  return el.maxLength > 0 ? v.slice(0, el.maxLength) : v;
}

/** Sets a value so React (controlled inputs and react-hook-form) sees the change. */
function setNativeValue(el: Field, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

const PNG_1PX =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const MINI_PDF =
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";

function testFile(accept: string): File {
  const wantsPdfOnly = /pdf/.test(accept) && !/image/.test(accept);
  if (wantsPdfOnly) return new File([MINI_PDF], "dev-test.pdf", { type: "application/pdf" });
  if (/csv/.test(accept)) {
    return new File(["name,email,phone\nTest Parent,dev@example.com,+923001234567\n"], "dev-test.csv", {
      type: "text/csv",
    });
  }
  const bytes = Uint8Array.from(atob(PNG_1PX), (c) => c.charCodeAt(0));
  return new File([bytes], "dev-test.png", { type: "image/png" });
}

const CONSENT = /agree|consent|acknowledg|confirm|accept|declare|terms|authori[sz]e/;
const SKIP_TYPES = new Set(["hidden", "submit", "button", "reset", "image", "color", "range", "search"]);

const visible = (el: Element) => (el as HTMLElement).offsetParent !== null || el.getClientRects().length > 0;
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));

/** Open modal first; otherwise the form holding focus; otherwise the main page. */
function fillScope(): ParentNode {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(visible);
  if (dialogs.length) return dialogs[dialogs.length - 1];
  const focusedForm = document.activeElement?.closest("form");
  if (focusedForm) return focusedForm;
  return document.querySelector("main") ?? document.body;
}

async function fillRadixSelects(scope: ParentNode, overwrite: boolean): Promise<number> {
  let count = 0;
  const triggers = Array.from(scope.querySelectorAll<HTMLButtonElement>('button[role="combobox"]'));
  for (const trigger of triggers) {
    if (trigger.disabled || !visible(trigger)) continue;
    if (!overwrite && !trigger.hasAttribute("data-placeholder")) continue;
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await tick();
    const options = Array.from(
      document.querySelectorAll<HTMLElement>('[role="listbox"] [role="option"]:not([data-disabled])')
    );
    const option = options[0];
    if (!option) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      continue;
    }
    option.focus();
    option.click();
    await tick();
    if (document.querySelector('[role="listbox"]')) {
      option.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await tick();
    }
    count++;
  }
  return count;
}

async function fillOnce(overwrite: boolean): Promise<number> {
  const scope = fillScope();
  const s = rand();
  let count = 0;

  const fields = Array.from(scope.querySelectorAll<Field>("input, textarea, select"));
  const radioGroups = new Set<string>();

  for (const el of fields) {
    if (el.disabled || el.closest("[data-dev-form-filler]")) continue;
    if (el instanceof HTMLInputElement) {
      if (el.readOnly || SKIP_TYPES.has(el.type)) continue;
      if (/search|filter/.test(describe(el))) continue;

      if (el.type === "file") {
        if (el.files?.length && !overwrite) continue;
        const dt = new DataTransfer();
        dt.items.add(testFile(el.accept));
        el.files = dt.files;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        count++;
        continue;
      }
      if (!visible(el)) continue;
      if (el.type === "checkbox") {
        if (!el.checked && (el.required || CONSENT.test(describe(el)))) {
          el.click();
          count++;
        }
        continue;
      }
      if (el.type === "radio") {
        if (!el.name || radioGroups.has(el.name)) continue;
        radioGroups.add(el.name);
        const group = scope.querySelectorAll<HTMLInputElement>(
          `input[type="radio"][name="${CSS.escape(el.name)}"]`
        );
        if (!Array.from(group).some((r) => r.checked)) {
          el.click();
          count++;
        }
        continue;
      }
    }
    if (!visible(el)) continue;

    if (el instanceof HTMLSelectElement) {
      if (el.value && !overwrite) continue;
      const option = Array.from(el.options).find((o) => o.value && !o.disabled);
      if (option) {
        setNativeValue(el, option.value);
        count++;
      }
      continue;
    }

    if ((el as HTMLInputElement).readOnly) continue;
    if (el.value && !overwrite) continue;
    setNativeValue(el, valueFor(el, s));
    count++;
  }

  // Radix checkboxes (consent-style only)
  for (const box of Array.from(scope.querySelectorAll<HTMLButtonElement>('button[role="checkbox"]'))) {
    if (box.disabled || box.getAttribute("aria-checked") === "true") continue;
    if (CONSENT.test(describe(box))) {
      box.click();
      count++;
    }
  }

  count += await fillRadixSelects(scope, overwrite);
  return count;
}

export function DevFormFiller() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (overwrite: boolean) => {
    setBusy(true);
    try {
      // Second pass picks up fields revealed by the first (e.g. a type select).
      let filled = await fillOnce(overwrite);
      await tick(150);
      filled += await fillOnce(false);
      setStatus(filled ? `Filled ${filled} field${filled === 1 ? "" : "s"}` : "Nothing empty to fill");
    } catch (e) {
      setStatus(`Fill failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(null), 2500);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === "KeyF") {
        e.preventDefault();
        void run(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      data-dev-form-filler
      className="fixed bottom-4 right-4 z-[2147483647] flex flex-col items-end gap-1"
    >
      {status && (
        <span className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow">{status}</span>
      )}
      <button
        type="button"
        disabled={busy}
        // Keep focus (and any open form) where it is.
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => void run(e.shiftKey)}
        title="Dev only — fill the open form with test data (Alt+Shift+F). Shift+click overwrites filled fields."
        className="rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-lg ring-1 ring-white/20 hover:bg-gray-700 disabled:opacity-60"
      >
        {busy ? "Filling…" : "⚡ Fill form"}
      </button>
    </div>
  );
}
