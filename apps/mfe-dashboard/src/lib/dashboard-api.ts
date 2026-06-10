/**
 * Reporting / dashboard API — not implemented yet.
 *
 * Target: GET /api/reporting/v1/dashboard (BFF aggregate).
 * PO and property counts should use work-orders API via api-client, not @case-study/mfe.
 */

export function dashboardApiEnabled(): boolean {
  return false;
}
