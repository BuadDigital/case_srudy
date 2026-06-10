/**
 * Failures API client — stub until backend `/api/failures` exists.
 * Prototype data stays in `@failures/mfe` localStorage (`evalFailureRecords`).
 */

export type FailuresApiConfig = {
  baseUrl?: string;
  token: string;
};

// Planned endpoints (not wired):
// GET    /api/failures
// POST   /api/failures
// POST   /api/failures/{id}/submit
// POST   /api/failures/{id}/approve
// POST   /api/failures/{id}/return
