/**
 * API-backed failures repository — not implemented yet.
 *
 * When product requirements are ready:
 * 1. Add `packages/api-client/src/failures.ts` (list, create, submit, approve, return).
 * 2. Add backend `FailuresController` + PostgreSQL entity.
 * 3. Implement `apiFailuresRepository` here and call `setFailuresRepository()` at app boot.
 *
 * Until then, `localFailuresRepository` in failures-local-storage.ts is the only backend.
 */

import type { FailuresApiConfig } from "@platform/api-client";

export type { FailuresApiConfig };

export function failuresApiConfig(): FailuresApiConfig | null {
  return null;
}
