import type { PartyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import type { WorkflowTaskKind } from "@case-study/mfe/lib/prototype/tasks-storage";

/** §5 — أسماء الأطراف كما في وثيقة التعذرات. */
const RAISER_LABEL_BY_KIND: Partial<Record<WorkflowTaskKind, string>> = {
  "field-inspection": "المعاين",
  "property-appraisal": "المقيم",
  "government-review": "المراجع الحكومي",
  "engineering-survey": "المكتب الهندسي",
};

export function failureRaiserRoleForParty(def: PartyTaskPageDef): string {
  return RAISER_LABEL_BY_KIND[def.kind] ?? def.assigneeSubtitle;
}

export const FAILURE_RAISER_SUPERVISOR = "المشرف";
export const FAILURE_RAISER_SPECIALIST = "الأخصائي";
