import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-white shadow-sm hover:bg-brand-600 hover:shadow-[0_8px_16px_-4px_rgba(0,167,111,0.35)]",
        destructive: "bg-danger text-white hover:bg-red-600",
        outline: "border border-[#DFE3E8] bg-surface text-heading hover:bg-bg hover:border-[#C4CDD5]",
        secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
        ghost: "text-muted hover:bg-bg hover:text-heading",
        link: "text-brand-500 underline-offset-4 hover:underline",
        success: "bg-success text-white hover:bg-emerald-600",
        warm: "bg-warm-400 text-white hover:bg-orange-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
