/** Re-export assignee lists for transaction distribution. */
import type { DistributionAssignee } from "@/lib/prototype/distribution-party-accounts";
export type { DistributionAssignee };
export {
  getEngineeringOffices,
  getFieldInspectors,
  getGovernmentAuditors,
  getPrototypeRoleAssigneeId,
  getValuationCoordinators,
  getValuators,
  partyAccountByAssigneeId,
  partyAccountByEmail,
  partyAccountForRole,
  partyAccountForViewer,
} from "@/lib/prototype/distribution-party-accounts";

export function assigneeLabel(
  list: DistributionAssignee[],
  id: string,
): string {
  if (!id.trim()) return "";
  return list.find((a) => a.id === id)?.name ?? "";
}
