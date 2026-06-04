import type {
  CaseStudyInfoPartyId,
  CaseStudyInfoRoleType,
} from "@/lib/prototype/case-study-info-roles-data";
import { CASE_STUDY_INFO_PARTIES } from "@/lib/prototype/case-study-info-roles-data";
import { CASE_STUDY_QUESTION_CATALOG } from "@/lib/prototype/case-study-info-roles-data";

const STORAGE_KEY = "evalCaseStudyInfoRoles";

/** questionKey → partyId → role */
export type CaseStudyInfoRolesMatrix = Record<
  string,
  Partial<Record<CaseStudyInfoPartyId, CaseStudyInfoRoleType>>
>;

export type CaseStudyInfoRolesConfig = {
  matrix: CaseStudyInfoRolesMatrix;
  notes: Record<string, string>;
  updatedAt: string;
};

function emptyMatrix(): CaseStudyInfoRolesMatrix {
  const matrix: CaseStudyInfoRolesMatrix = {};
  for (const q of CASE_STUDY_QUESTION_CATALOG) {
    matrix[q.key] = {};
    for (const p of CASE_STUDY_INFO_PARTIES) {
      matrix[q.key]![p.id] = undefined;
    }
  }
  return matrix;
}

export function emptyCaseStudyInfoRolesConfig(): CaseStudyInfoRolesConfig {
  return {
    matrix: emptyMatrix(),
    notes: {},
    updatedAt: new Date().toISOString(),
  };
}

export function loadCaseStudyInfoRolesConfig(): CaseStudyInfoRolesConfig {
  if (typeof window === "undefined") return emptyCaseStudyInfoRolesConfig();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCaseStudyInfoRolesConfig();
    const parsed = JSON.parse(raw) as CaseStudyInfoRolesConfig;
    const base = emptyCaseStudyInfoRolesConfig();
    return {
      matrix: { ...base.matrix, ...parsed.matrix },
      notes: { ...base.notes, ...parsed.notes },
      updatedAt: parsed.updatedAt ?? base.updatedAt,
    };
  } catch {
    return emptyCaseStudyInfoRolesConfig();
  }
}

export function saveCaseStudyInfoRolesConfig(
  config: CaseStudyInfoRolesConfig,
): void {
  if (typeof window === "undefined") return;
  const payload: CaseStudyInfoRolesConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** يمكن للطرف الإجابة إذا له دور غير «لا دور». */
export function canPartyAnswerQuestion(
  matrix: CaseStudyInfoRolesMatrix,
  questionKey: string,
  partyId: CaseStudyInfoPartyId,
): boolean {
  const role = matrix[questionKey]?.[partyId];
  return role === "primary" || role === "secondary" || role === "verify";
}

export function partyRoleOnQuestion(
  matrix: CaseStudyInfoRolesMatrix,
  questionKey: string,
  partyId: CaseStudyInfoPartyId,
): CaseStudyInfoRoleType | null | undefined {
  return matrix[questionKey]?.[partyId] ?? null;
}
