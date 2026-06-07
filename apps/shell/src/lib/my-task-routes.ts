import type { PageId } from "@platform/types";
import { isPartyTaskPage } from "@/lib/prototype/party-task-pages";

export function myTasksPath(): string {
  return "/active-primary-data";
}

export function activeDistributionPath(): string {
  return "/active-distribution";
}

export function distributionTaskPath(taskId: string): string {
  return `/active-distribution?task=${encodeURIComponent(taskId)}`;
}

export function activeCaseStudyPath(): string {
  return "/active-case-study";
}

export function caseStudyWorkspacePath(taskId: string): string {
  return `/case-study/${encodeURIComponent(taskId)}`;
}

/** Queue deep-link; redirects to full workspace when opened with ?task= */
export function caseStudyTaskPath(taskId: string): string {
  return caseStudyWorkspacePath(taskId);
}

export function partyTaskPath(pageId: PageId): string {
  return `/${pageId}`;
}

export function partyTaskTaskPath(pageId: PageId, taskId: string): string {
  return `/${pageId}?task=${encodeURIComponent(taskId)}`;
}

/** @deprecated Use partyTaskPath("property-inspection") */
export function propertyInspectionPath(): string {
  return partyTaskPath("property-inspection");
}

/** @deprecated Use partyTaskTaskPath("property-inspection", taskId) */
export function propertyInspectionTaskPath(taskId: string): string {
  return partyTaskTaskPath("property-inspection", taskId);
}

export function isPartyTaskWorkPath(pathname: string): boolean {
  const page = pathname.split("/").filter(Boolean)[0] ?? "";
  return isPartyTaskPage(page as PageId);
}

export function primaryDataTaskPath(taskId: string): string {
  return `/active-primary-data?task=${encodeURIComponent(taskId)}`;
}

export function decodeTaskParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
