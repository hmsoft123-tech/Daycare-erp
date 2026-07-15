import { AlertTriangle } from "lucide-react";

interface AllergyBannerProps {
  allergies: string[];
}

export function AllergyBanner({ allergies }: AllergyBannerProps) {
  if (allergies.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Allergy Alert</p>
        <p className="text-sm text-white/90">{allergies.join(", ")}</p>
      </div>
    </div>
  );
}
