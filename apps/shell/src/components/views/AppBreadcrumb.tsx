import Link from "next/link";
import type { BreadcrumbSegment } from "@/lib/breadcrumb";

function BreadcrumbChevron() {
  return (
    <span className="breadcrumb-sep" aria-hidden>
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </span>
  );
}

function BreadcrumbLabel({ segment }: { segment: BreadcrumbSegment }) {
  if (segment.ltr) {
    return (
      <bdi dir="ltr" className="po-num-ltr">
        {segment.label}
      </bdi>
    );
  }
  return segment.label;
}

export function AppBreadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  if (segments.length === 0) return null;

  return (
    <nav className="breadcrumb" id="tb-bc" aria-label="مسار التنقل">
      {segments.map((segment, index) => {
        const isCurrent = segment.current ?? index === segments.length - 1;
        const showSep = index > 0;

        return (
          <span key={`${segment.label}-${index}`} className="breadcrumb-part">
            {showSep ? <BreadcrumbChevron /> : null}
            {isCurrent || !segment.href ? (
              <span className={isCurrent ? "breadcrumb-current" : undefined}>
                <BreadcrumbLabel segment={segment} />
              </span>
            ) : (
              <Link href={segment.href}>
                <BreadcrumbLabel segment={segment} />
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
