import { SchoolSubNav } from "@/components/school/SchoolSubNav";

type Props = {
  title: string;
  subtitle: string;
};

export function SchoolPageHeader({ title, subtitle }: Props) {
  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl lg:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <SchoolSubNav />
    </div>
  );
}
