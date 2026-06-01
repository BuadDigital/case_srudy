export function myTasksPath(): string {
  return "/active-primary-data";
}

export function activeDistributionPath(): string {
  return "/active-distribution";
}

export function distributionTaskPath(taskId: string): string {
  return `/active-distribution?task=${encodeURIComponent(taskId)}`;
}

export function primaryDataTaskPath(taskId: string): string {
  return `/active-primary-data?task=${encodeURIComponent(taskId)}`;
}

/** @deprecated Prefer primaryDataTaskPath; /my-tasks/[id] redirects to the query URL. */
export function myTaskPath(taskId: string): string {
  return primaryDataTaskPath(taskId);
}

export function decodeTaskParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
