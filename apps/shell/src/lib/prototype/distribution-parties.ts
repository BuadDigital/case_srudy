/** Re-export assignee lists — defined in distribution-party-accounts.ts */
import type { DistributionAssignee } from "@/lib/prototype/distribution-party-accounts";
export type { DistributionAssignee };
export {
  ENGINEERING_OFFICES,
  FIELD_INSPECTORS,
  GOVERNMENT_AUDITORS,
  PROTOTYPE_ROLE_ASSIGNEE_ID,
  VALUATION_COORDINATORS,
  VALUATORS,
  partyAccountByAssigneeId,
  partyAccountForRole,
} from "@/lib/prototype/distribution-party-accounts";

export function assigneeLabel(
  list: DistributionAssignee[],
  id: string,
): string {
  if (!id.trim()) return "";
  return list.find((a) => a.id === id)?.name ?? "";
}
