import type { ReactNode } from "react";
import { HeroOrb } from "./HeroOrb";

/**
 * Page header with eyebrow + title. When `showOrb` is true it renders the small
 * docked HeroOrb beside the title — the landing spot for the empty-state morph.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  showOrb = false,
  orbId,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  showOrb?: boolean;
  orbId?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        {showOrb && <HeroOrb size={48} layoutId={orbId} />}
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-dim">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
