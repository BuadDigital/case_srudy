export type BreadcrumbSegment = {
  label: string;
  href?: string;
  current?: boolean;
  /** Isolate LTR values (deed numbers) in RTL breadcrumb layout. */
  ltr?: boolean;
};

/** Split a legacy `a / b / c` trail into segments (last segment is current). */
export function slashTrailToSegments(trail: string): BreadcrumbSegment[] {
  const parts = trail
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return [];
  return parts.map((label, index) => ({
    label,
    current: index === parts.length - 1,
  }));
}
