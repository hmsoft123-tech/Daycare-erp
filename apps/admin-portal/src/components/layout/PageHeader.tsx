import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: { label: string; href?: string; onClick?: () => void };
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, action, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-[1.5rem] font-bold tracking-tight text-heading md:text-[1.75rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {action &&
          (action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          ))}
      </div>
    </div>
  );
}
