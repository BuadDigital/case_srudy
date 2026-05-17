import { MOCK_STAFF, type StaffUser } from "@/lib/prototype/constants";

export const STAFF_STORAGE_KEY = "evalStaffUsers";

export function loadStaffUsers(): StaffUser[] {
  if (typeof window === "undefined") return [...MOCK_STAFF];
  const raw = localStorage.getItem(STAFF_STORAGE_KEY);
  if (!raw) return [...MOCK_STAFF];
  try {
    const parsed = JSON.parse(raw) as StaffUser[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_STAFF];
  } catch {
    return [...MOCK_STAFF];
  }
}

export function saveStaffUsers(users: StaffUser[]): void {
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(users));
}

export function staffRoleOptions(): string[] {
  return [...new Set(MOCK_STAFF.map((u) => u.role))];
}
