import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-[30px] sm:leading-none">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-pretty text-[15px] font-normal leading-7 text-slate-700 dark:text-slate-300 sm:text-base sm:leading-7">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 self-start sm:pt-1">
          {actions}
        </div>
      )}
    </div>
  );
}
