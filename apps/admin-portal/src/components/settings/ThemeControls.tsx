"use client";

import { useEffect, useRef, useState } from "react";
import {
  brandingToCssVariables,
  buildBrandPalette,
} from "@kinder-pilot/api-client/tenant";
import { Palette, Upload, ImageIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ThemeDraft = {
  themeName: string;
  isActive: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPrimaryColor: string;
  fontSecondaryColor: string;
  lightLogoUrl: string;
  darkLogoUrl: string;
  lightLogoPreview?: string;
  darkLogoPreview?: string;
};

const STORAGE_KEY = (slug: string) => `kp-theme-draft:${slug}`;

function ColorField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-heading">
        {label}
      </Label>
      <p className="text-xs text-muted">{hint}</p>
      <div className="flex items-center gap-2">
        <label
          className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#DFE3E8] shadow-sm"
          title="Pick color"
        >
          <span className="absolute inset-0" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#00a76f"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#00A76F"
          className="font-mono uppercase"
        />
      </div>
    </div>
  );
}

function LogoDropZone({
  label,
  hint,
  preview,
  onFile,
}: {
  label: string;
  hint: string;
  preview?: string;
  onFile: (file: File, dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handle = (file: File | undefined) => {
    if (!file) return;
    const ok = ["image/png", "image/svg+xml", "image/jpeg", "image/webp"].includes(file.type);
    if (!ok) {
      toast.error("Use PNG, SVG, JPG, or WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onFile(file, String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-heading">{label}</Label>
      <p className="text-xs text-muted">{hint}</p>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
          dragOver
            ? "border-brand-500 bg-brand-50"
            : "border-[#DFE3E8] bg-bg/50 hover:border-brand-300 hover:bg-brand-50/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Logo preview" className="mb-2 max-h-14 max-w-[180px] object-contain" />
        ) : (
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-brand-500 shadow-card">
            <Upload className="h-5 w-5" />
          </div>
        )}
        <p className="text-sm font-semibold text-heading">
          {preview ? "Click to replace" : "Click to upload"}
        </p>
        <p className="mt-1 text-xs text-muted">PNG, SVG up to 2MB</p>
      </div>
    </div>
  );
}

function defaultDraft(branding: {
  schoolName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
}): ThemeDraft {
  return {
    themeName: `${branding.schoolName} Brand`,
    isActive: true,
    primaryColor: branding.primaryColor || "#00A76F",
    secondaryColor: branding.secondaryColor || "#4C8BF5",
    accentColor: "#FFAB00",
    fontPrimaryColor: "#1C252E",
    fontSecondaryColor: "#637381",
    lightLogoUrl: branding.logoUrl || "",
    darkLogoUrl: branding.logoUrl || "",
    lightLogoPreview: branding.logoUrl || undefined,
    darkLogoPreview: branding.logoUrl || undefined,
  };
}

function applyThemeToDom(draft: ThemeDraft) {
  const branding = {
    primaryColor: draft.primaryColor,
    secondaryColor: draft.secondaryColor,
    logoUrl: draft.lightLogoPreview || draft.lightLogoUrl || "",
    schoolName: draft.themeName,
    palette: buildBrandPalette(draft.primaryColor),
  };
  const css = brandingToCssVariables(branding);
  const root = document.documentElement;
  css.split(";").forEach((pair) => {
    const [prop, val] = pair.split(":").map((s) => s.trim());
    if (prop && val) root.style.setProperty(prop, val);
  });
  if (draft.fontPrimaryColor) root.style.setProperty("--heading", draft.fontPrimaryColor);
  if (draft.fontSecondaryColor) root.style.setProperty("--muted", draft.fontSecondaryColor);
  if (draft.accentColor) root.style.setProperty("--warning", draft.accentColor);
}

export function ThemeControls() {
  const branding = useTenantStore((s) => s.branding);
  const tenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantContext = useTenantStore((s) => s.setTenantContext);
  const tenantId = useTenantStore((s) => s.tenantId);

  const [draft, setDraft] = useState<ThemeDraft>(() =>
    defaultDraft({
      schoolName: branding?.schoolName ?? "Kinder Pilot",
      primaryColor: branding?.primaryColor ?? "#00A76F",
      secondaryColor: branding?.secondaryColor ?? "#4C8BF5",
      logoUrl: branding?.logoUrl ?? "",
    })
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!tenantSlug) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(tenantSlug));
      if (raw) {
        setDraft(JSON.parse(raw) as ThemeDraft);
        return;
      }
    } catch {
      /* ignore */
    }
    if (branding) {
      setDraft(defaultDraft(branding));
    }
  }, [tenantSlug, branding]);

  const patch = (partial: Partial<ThemeDraft>) => {
    setDraft((d) => ({ ...d, ...partial }));
    setDirty(true);
  };

  const publish = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(draft.primaryColor)) {
      toast.error("Primary color must be a valid hex (e.g. #00A76F)");
      return;
    }
    applyThemeToDom(draft);
    if (tenantSlug) {
      localStorage.setItem(STORAGE_KEY(tenantSlug), JSON.stringify(draft));
    }
    if (tenantSlug && tenantId) {
      setTenantContext({
        tenantId,
        tenantSlug,
        branding: {
          primaryColor: draft.primaryColor,
          secondaryColor: draft.secondaryColor,
          logoUrl: draft.lightLogoPreview || draft.lightLogoUrl,
          schoolName: branding?.schoolName ?? draft.themeName,
          palette: buildBrandPalette(draft.primaryColor),
        },
      });
    }
    setDirty(false);
    toast.success(draft.isActive ? "Theme published and set active" : "Theme saved (inactive)");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Palette className="h-3.5 w-3.5" /> Design & Layout
          </p>
          <h1 className="font-heading text-[1.5rem] font-bold tracking-tight text-heading md:text-[1.75rem]">
            Theme Controls
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage global colors, logos, and typography for this school&apos;s brand.
          </p>
        </div>
        <Button type="button" onClick={publish} className="shrink-0">
          <Check className="h-4 w-4" />
          Publish Theme
          {dirty && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-white" />}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Palette className="h-4 w-4" />
            </span>
            General Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="themeName">Theme Name</Label>
            <Input
              id="themeName"
              value={draft.themeName}
              onChange={(e) => patch({ themeName: e.target.value })}
              placeholder="e.g. Spring Campus Brand"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="isActive"
              checked={draft.isActive}
              onCheckedChange={(c) => patch({ isActive: c === true })}
            />
            <Label htmlFor="isActive" className="cursor-pointer font-normal">
              Set as Active Theme
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Brand Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              id="primary"
              label="Primary Color"
              hint="Buttons & highlights"
              value={draft.primaryColor}
              onChange={(primaryColor) => patch({ primaryColor })}
            />
            <ColorField
              id="secondary"
              label="Secondary Color"
              hint="Surfaces & accents"
              value={draft.secondaryColor}
              onChange={(secondaryColor) => patch({ secondaryColor })}
            />
            <ColorField
              id="accent"
              label="Accent Color"
              hint="Highlights & special elements"
              value={draft.accentColor}
              onChange={(accentColor) => patch({ accentColor })}
            />
            <ColorField
              id="fontPrimary"
              label="Font Primary Color"
              hint="Headings & labels"
              value={draft.fontPrimaryColor}
              onChange={(fontPrimaryColor) => patch({ fontPrimaryColor })}
            />
            <ColorField
              id="fontSecondary"
              label="Font Secondary Color"
              hint="Body & muted text"
              value={draft.fontSecondaryColor}
              onChange={(fontSecondaryColor) => patch({ fontSecondaryColor })}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-bg p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Preview</span>
            <Button type="button" size="sm" style={{ backgroundColor: draft.primaryColor }}>
              Primary button
            </Button>
            <Button type="button" size="sm" variant="secondary" style={{ color: draft.secondaryColor }}>
              Secondary
            </Button>
            <span className="text-sm font-bold" style={{ color: draft.fontPrimaryColor }}>
              Heading sample
            </span>
            <span className="text-sm" style={{ color: draft.fontSecondaryColor }}>
              Body text sample
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: draft.accentColor }}
            >
              Accent
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-brand-600" />
            Brand Logos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-2">
            <LogoDropZone
              label="Light Logo"
              hint="Used on dark backgrounds (sidebar collapse / print)"
              preview={draft.lightLogoPreview}
              onFile={(file, dataUrl) =>
                patch({ lightLogoPreview: dataUrl, lightLogoUrl: file.name })
              }
            />
            <LogoDropZone
              label="Dark Logo"
              hint="Used on light backgrounds (header & login)"
              preview={draft.darkLogoPreview}
              onFile={(file, dataUrl) =>
                patch({ darkLogoPreview: dataUrl, darkLogoUrl: file.name })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
