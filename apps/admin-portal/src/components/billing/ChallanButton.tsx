"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface ChallanButtonProps {
  invoiceNumber: string;
  amount: number;
}

export function ChallanButton({ invoiceNumber, amount }: ChallanButtonProps) {
  const handleGenerate = () => {
    toast.success(`Challan generated for ${invoiceNumber} — PKR ${amount.toLocaleString()}`);
  };

  return (
    <Button variant="outline" onClick={handleGenerate}>
      <FileText className="h-4 w-4" />
      Generate Challan
    </Button>
  );
}
