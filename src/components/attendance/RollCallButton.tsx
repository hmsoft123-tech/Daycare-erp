"use client";

import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { toast } from "sonner";

interface RollCallButtonProps {
  onMarkAllPresent: () => void;
}

export function RollCallButton({ onMarkAllPresent }: RollCallButtonProps) {
  const handleClick = () => {
    onMarkAllPresent();
    toast.success("All students marked present");
  };

  return (
    <Button variant="secondary" onClick={handleClick}>
      <Users className="h-4 w-4" />
      Mark All Present
    </Button>
  );
}
