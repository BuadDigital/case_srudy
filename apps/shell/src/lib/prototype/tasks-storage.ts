import type { RoleId } from "@platform/types";
import type {
  AssignmentType,
  PoIntakeRecord,
  PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import {
  classificationRequiresSurvey,
  formatPropertyDeedDisplay,
} from "@/lib/prototype/po-intake-data";

export const TASKS_STORAGE_KEY = "evalWorkflowTasks";
export const TASKS_CHANGED_EVENT = "eval-workflow-tasks-changed";

/** Phases of the case-study property task (specialist workflow). */
export type CaseStudyTaskPhase =
  | "enfath"
  | "bourse"
  | "distribution"
  | "done"
  | "obstruction";

export type WorkflowTaskKind =
  | "case-study-property"
  | "field-inspection"
  | "government-review"
  | "engineering-survey";

export type WorkflowTaskStatus = "open" | "completed" | "blocked";

export type TaskDistributionDraft = {
  fieldInspector: boolean;
  governmentReviewer: boolean;
  engineeringOffice: boolean;
  /** Required before engineering office can be selected. */
  fieldInspectorRecommendedVisit: boolean;
};

export type WorkflowTask = {
  id: string;
  kind: WorkflowTaskKind;
  poNumber: string;
  /** Set after phase 1 (Enfath) saves the property. */
  propertyId?: string;
  /** Slot index 1..expectedPropertyCount on the PO. */
  propertyOrdinal: number;
  title: string;
  phase: CaseStudyTaskPhase;
  assigneeRole: RoleId;
  assigneeName: string;
  parentTaskId?: string;
  status: WorkflowTaskStatus;
  distribution?: TaskDistributionDraft;
  obstructionReason?: string;
  obstructionPriorPhase?: CaseStudyTaskPhase;
  assignmentType?: PoIntakeRecord["assignmentType"];
  createdAt: string;
  updatedAt: string;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function notifyTasksChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT));
}

export function loadWorkflowTasks(): WorkflowTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkflowTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWorkflowTasks(list: WorkflowTask[]): void {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(list));
  notifyTasksChanged();
}

function poCaseTasks(list: WorkflowTask[], poNumber: string): WorkflowTask[] {
  const n = poNumber.trim();
  return list.filter(
    (t) => t.kind === "case-study-property" && t.poNumber.trim() === n,
  );
}

export function taskKindLabel(kind: WorkflowTaskKind): string {
  if (kind === "case-study-property") return "دراسة حالة — عقار";
  if (kind === "field-inspection") return "معاينة ميدانية";
  if (kind === "government-review") return "مراجعة حكومية";
  return "رفع مساحي — مكتب هندسي";
}

export function taskPhaseLabel(phase: CaseStudyTaskPhase): string {
  if (phase === "enfath") return "البيانات الأولية للعقار";
  if (phase === "bourse") return "المرحلة 2 — بيانات البورصة";
  if (phase === "distribution") return "المرحلة 3 — توزيع الأطراف";
  if (phase === "obstruction") return "تعذر — بانتظار المشرف";
  return "مكتملة";
}

export function taskStatusLabel(status: WorkflowTaskStatus): string {
  if (status === "open") return "مفتوحة";
  if (status === "blocked") return "موقوفة";
  return "مكتملة";
}

export function taskDisplayPropertyLabel(task: WorkflowTask): string {
  if (task.propertyId) {
    const part = task.title.split(" — ")[0];
    return part || `عقار ${task.propertyOrdinal}`;
  }
  return `خانة ${task.propertyOrdinal}`;
}

export function engineeringOfficeAvailable(
  property: PoPropertyIntake,
  hasPriorSurvey: boolean,
  fieldInspectorRecommendedVisit: boolean,
): boolean {
  if (!classificationRequiresSurvey(property.classification)) return false;
  if (hasPriorSurvey) return false;
  return fieldInspectorRecommendedVisit;
}

export function defaultDistribution(): TaskDistributionDraft {
  return {
    fieldInspector: false,
    governmentReviewer: false,
    engineeringOffice: false,
    fieldInspectorRecommendedVisit: false,
  };
}

export function slotTaskTitle(
  poNumber: string,
  ordinal: number,
  total: number,
): string {
  return `تسجيل عقار ${ordinal} من ${total} — ${poNumber}`;
}

function propertyTaskTitle(property: PoPropertyIntake, poNumber: string): string {
  const deed = formatPropertyDeedDisplay(property);
  if (deed && deed !== "—") return `${deed} — ${poNumber}`;
  return `عقار — ${poNumber}`;
}

function phaseAfterEnfathRegistration(
  property: PoPropertyIntake,
): CaseStudyTaskPhase {
  if (property.bourseDataCompleted) return "distribution";
  return "bourse";
}

function caseStudyTaskForProperty(
  poNumber: string,
  propertyId: string,
  list = loadWorkflowTasks(),
): WorkflowTask | undefined {
  return list.find(
    (t) =>
      t.kind === "case-study-property" &&
      t.poNumber.trim() === poNumber.trim() &&
      t.propertyId === propertyId,
  );
}

function newSlotTask(
  poNumber: string,
  ordinal: number,
  total: number,
  assignmentType?: AssignmentType,
): WorkflowTask {
  const now = new Date().toISOString();
  return {
    id: newId(),
    kind: "case-study-property",
    poNumber,
    propertyOrdinal: ordinal,
    title: slotTaskTitle(poNumber, ordinal, total),
    phase: "enfath",
    assigneeRole: "case-specialist",
    assigneeName: "أخصائي دراسة الحالة",
    status: "open",
    distribution: defaultDistribution(),
    assignmentType,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Ensures one open task slot per expected property on the PO (manual count at PO registration).
 * Links existing properties to empty slots; adds/removes slots when expected count changes.
 */
export function syncTaskSlotsForPo(record: PoIntakeRecord): WorkflowTask[] {
  const poNumber = record.poNumber.trim();
  const expected = Math.max(1, record.expectedPropertyCount ?? 1);
  let list = loadWorkflowTasks();

  list = list.filter((t) => {
    if (t.kind !== "case-study-property" || t.poNumber.trim() !== poNumber) {
      return true;
    }
    if (t.propertyOrdinal > expected && !t.propertyId && t.phase === "enfath") {
      return false;
    }
    return true;
  });

  let tasks = poCaseTasks(list, poNumber);
  const byOrdinal = new Map(tasks.map((t) => [t.propertyOrdinal, t]));

  for (let ord = 1; ord <= expected; ord++) {
    const existing = byOrdinal.get(ord);
    if (!existing) {
      const task = newSlotTask(poNumber, ord, expected, record.assignmentType);
      list = [task, ...list];
      byOrdinal.set(ord, task);
    } else if (!existing.propertyId) {
      const idx = list.findIndex((t) => t.id === existing.id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          title: slotTaskTitle(poNumber, ord, expected),
          assignmentType: record.assignmentType,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  tasks = poCaseTasks(list, poNumber);
  const linkedIds = new Set(
    tasks.filter((t) => t.propertyId).map((t) => t.propertyId!),
  );

  for (let i = 0; i < record.properties.length; i++) {
    const prop = record.properties[i];
    if (!prop.id || linkedIds.has(prop.id)) continue;

    const preferred = tasks.find(
      (t) => !t.propertyId && t.propertyOrdinal === i + 1,
    );
    const slot =
      preferred ??
      tasks
        .filter((t) => !t.propertyId)
        .sort((a, b) => a.propertyOrdinal - b.propertyOrdinal)[0];

    if (!slot) continue;

    const idx = list.findIndex((t) => t.id === slot.id);
    if (idx < 0) continue;

    list[idx] = {
      ...list[idx],
      propertyId: prop.id,
      phase: phaseAfterEnfathRegistration(prop),
      title: propertyTaskTitle(prop, poNumber),
      assignmentType: record.assignmentType,
      updatedAt: new Date().toISOString(),
    };
    linkedIds.add(prop.id);
  }

  saveWorkflowTasks(list);
  return poCaseTasks(list, poNumber);
}

/** Link a property registered outside مهامي (e.g. PO → إضافة عقار) to the next empty slot. */
export function linkNewPropertyToTaskSlot(
  record: PoIntakeRecord,
  property: PoPropertyIntake,
): WorkflowTask | null {
  if (!property.id) return null;
  syncTaskSlotsForPo(record);

  const existing = caseStudyTaskForProperty(record.poNumber, property.id);
  if (existing) return existing;

  const tasks = poCaseTasks(loadWorkflowTasks(), record.poNumber);
  const slot = tasks
    .filter((t) => !t.propertyId)
    .sort((a, b) => a.propertyOrdinal - b.propertyOrdinal)[0];

  if (!slot) return null;

  return updateTask(slot.id, {
    propertyId: property.id,
    phase: phaseAfterEnfathRegistration(property),
    title: propertyTaskTitle(property, record.poNumber),
    assignmentType: record.assignmentType,
  });
}

export function deleteTasksForProperty(
  poNumber: string,
  propertyId: string,
  expectedPropertyCount = 1,
): void {
  const nPo = poNumber.trim();
  const nProp = propertyId.trim();
  const list = loadWorkflowTasks();
  const linked = list.find(
    (t) =>
      t.kind === "case-study-property" &&
      t.poNumber.trim() === nPo &&
      t.propertyId === nProp,
  );

  if (linked) {
    const expected = Math.max(1, expectedPropertyCount);
    const parentIds = new Set([linked.id]);
    const withoutChildren = list.filter((t) => {
      if (t.poNumber.trim() !== nPo) return true;
      if (t.propertyId === nProp) return false;
      if (t.parentTaskId && parentIds.has(t.parentTaskId)) return false;
      return true;
    });
    const idx = withoutChildren.findIndex((t) => t.id === linked.id);
    if (idx >= 0) {
      withoutChildren[idx] = {
        ...withoutChildren[idx],
        propertyId: undefined,
        phase: "enfath",
        status: "open",
        title: slotTaskTitle(nPo, linked.propertyOrdinal, expected),
        distribution: defaultDistribution(),
        obstructionReason: undefined,
        obstructionPriorPhase: undefined,
        updatedAt: new Date().toISOString(),
      };
    }
    saveWorkflowTasks(withoutChildren);
    return;
  }

  const parentIds = new Set(
    list
      .filter((t) => t.poNumber.trim() === nPo && t.propertyId === nProp)
      .map((t) => t.id),
  );
  saveWorkflowTasks(
    list.filter((t) => {
      if (t.poNumber.trim() !== nPo) return true;
      if (t.propertyId === nProp) return false;
      if (t.parentTaskId && parentIds.has(t.parentTaskId)) return false;
      return true;
    }),
  );
}

export function deleteTasksForPo(poNumber: string): void {
  const n = poNumber.trim();
  saveWorkflowTasks(loadWorkflowTasks().filter((t) => t.poNumber.trim() !== n));
}

function updateTask(
  id: string,
  patch: Partial<WorkflowTask>,
): WorkflowTask | null {
  const list = loadWorkflowTasks();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const next: WorkflowTask = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  saveWorkflowTasks(list);
  return next;
}

export function advanceTaskAfterEnfath(
  taskId: string,
  property: PoPropertyIntake,
): WorkflowTask | null {
  const poNumber =
    loadWorkflowTasks().find((t) => t.id === taskId)?.poNumber ?? "";
  return updateTask(taskId, {
    propertyId: property.id,
    phase: "bourse",
    title: propertyTaskTitle(property, poNumber),
  });
}

export function advanceTaskAfterBourse(
  taskId: string,
  property: PoPropertyIntake,
): WorkflowTask | null {
  const poNumber =
    loadWorkflowTasks().find((t) => t.id === taskId)?.poNumber ?? "";
  return updateTask(taskId, {
    phase: "distribution",
    title: `توزيع الأطراف — ${formatPropertyDeedDisplay(property) || poNumber}`,
  });
}

function childTaskTitle(
  kind: WorkflowTaskKind,
  poNumber: string,
  deed: string,
): string {
  const ref = deed.trim() || poNumber;
  if (kind === "field-inspection") return `معاينة ميدانية — ${ref}`;
  if (kind === "government-review") return `مراجعة حكومية — ${ref}`;
  return `رفع مساحي — ${ref}`;
}

const CHILD_ASSIGNEE: Record<
  Exclude<WorkflowTaskKind, "case-study-property">,
  { role: RoleId; name: string }
> = {
  "field-inspection": { role: "field-inspector", name: "معاين ميداني" },
  "government-review": { role: "government-reviewer", name: "مراجع حكومي" },
  "engineering-survey": { role: "engineering-office", name: "مكتب هندسي" },
};

export function confirmTaskDistribution(
  taskId: string,
  distribution: TaskDistributionDraft,
  deedNumber = "",
): { parent: WorkflowTask | null; children: WorkflowTask[] } {
  const list = loadWorkflowTasks();
  const parent = list.find((t) => t.id === taskId);
  if (!parent || parent.phase !== "distribution" || !parent.propertyId) {
    return { parent: null, children: [] };
  }

  const now = new Date().toISOString();
  const children: WorkflowTask[] = [];
  const deed = deedNumber.trim();

  const spawn = (kind: Exclude<WorkflowTaskKind, "case-study-property">) => {
    const meta = CHILD_ASSIGNEE[kind];
    children.push({
      id: newId(),
      kind,
      poNumber: parent.poNumber,
      propertyId: parent.propertyId,
      propertyOrdinal: parent.propertyOrdinal,
      title: childTaskTitle(kind, parent.poNumber, deed),
      phase: "done",
      assigneeRole: meta.role,
      assigneeName: meta.name,
      parentTaskId: parent.id,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  };

  if (distribution.fieldInspector) spawn("field-inspection");
  if (distribution.governmentReviewer) spawn("government-review");
  if (distribution.engineeringOffice) spawn("engineering-survey");

  const updatedParent: WorkflowTask = {
    ...parent,
    phase: "done",
    status: "completed",
    distribution,
    updatedAt: now,
  };

  const idx = list.findIndex((t) => t.id === taskId);
  list[idx] = updatedParent;
  saveWorkflowTasks([...children, ...list]);

  return { parent: updatedParent, children };
}

export function escalateTaskForObstruction(
  poNumber: string,
  propertyId: string,
  reason: string,
): WorkflowTask | null {
  const task = loadWorkflowTasks().find(
    (t) =>
      t.kind === "case-study-property" &&
      t.poNumber === poNumber &&
      t.propertyId === propertyId &&
      t.status !== "completed",
  );
  if (!task) return null;

  return updateTask(task.id, {
    phase: "obstruction",
    obstructionPriorPhase: task.phase,
    assigneeRole: "section-supervisor",
    assigneeName: "مشرف دراسة الحالة",
    status: "blocked",
    obstructionReason: reason.trim(),
  });
}

export function resolveTaskObstruction(taskId: string): WorkflowTask | null {
  const task = loadWorkflowTasks().find((t) => t.id === taskId);
  if (!task || task.phase !== "obstruction") return null;

  const resumePhase =
    task.obstructionPriorPhase ?? (task.propertyId ? "bourse" : "enfath");

  return updateTask(taskId, {
    phase: resumePhase,
    assigneeRole: "case-specialist",
    assigneeName: "أخصائي دراسة الحالة",
    status: "open",
    obstructionReason: undefined,
    obstructionPriorPhase: undefined,
  });
}

export function completeChildTask(taskId: string): WorkflowTask | null {
  return updateTask(taskId, { status: "completed", phase: "done" });
}

export function compareWorkflowTasks(
  a: WorkflowTask,
  b: WorkflowTask,
): number {
  const poCmp = a.poNumber.localeCompare(b.poNumber, undefined, {
    numeric: true,
  });
  if (poCmp !== 0) return poCmp;
  if (a.propertyOrdinal !== b.propertyOrdinal) {
    return a.propertyOrdinal - b.propertyOrdinal;
  }
  return a.createdAt.localeCompare(b.createdAt);
}

export function tasksForRole(
  role: RoleId,
  tasks = loadWorkflowTasks(),
): WorkflowTask[] {
  return tasks
    .filter((t) => t.assigneeRole === role)
    .sort(compareWorkflowTasks);
}

export function syncTasksFromPoRecords(records: PoIntakeRecord[]): void {
  for (const record of records) {
    syncTaskSlotsForPo(record);
  }
}

export function patchTaskDistribution(
  taskId: string,
  patch: Partial<TaskDistributionDraft>,
): WorkflowTask | null {
  const task = loadWorkflowTasks().find((t) => t.id === taskId);
  if (!task) return null;
  const distribution = {
    ...(task.distribution ?? defaultDistribution()),
    ...patch,
  };
  if (!distribution.fieldInspector) {
    distribution.fieldInspectorRecommendedVisit = false;
    distribution.engineeringOffice = false;
  }
  return updateTask(taskId, { distribution });
}
