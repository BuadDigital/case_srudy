"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PartyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import type { WorkflowTask } from "@case-study/mfe";
import {
  emptyCaseStudyFormDraft,
  loadPartyCaseStudyFormDraft,
  PartyCaseStudyFormTab,
  savePartyCaseStudyFormDraft,
} from "@case-study/mfe";
import { usePoRecordQuery } from "@case-study/mfe/query/case-study-queries";
import {
  InfoBox,
  SectionDivider,
  SectionHeader,
} from "@case-study/mfe/components/po-intake/PropertyDetailFields";
import { PropertyTransactionTimeline } from "@case-study/mfe/components/po-intake/PropertyTransactionTimeline";
import { FailureRaisePanel } from "@failures/mfe";
import { failureRaiserRoleForParty } from "@failures/mfe/lib/failure-party-roles";
import { useFailuresQuery } from "@failures/mfe/query/failures-queries";
import { isActiveFailureStatus } from "@failures/mfe/lib/failures-types";
import {
  isEngineeringSurveyFormLocked,
  type EngineeringSurveySubmission,
} from "../lib/engineering-survey-data";
import {
  getOrCreateEngineeringSurveyDraft,
  loadEngineeringSurveySubmission,
  updateEngineeringSurveyDraft,
} from "../lib/engineering-survey-submission-storage";
import {
  cacheEngineeringSurveyFile,
  clearEngineeringSurveyFile,
} from "../lib/engineering-survey-attachments";
import {
  firstEngineeringSurveyError,
  validateEngineeringSurveySubmission,
  type EngineeringSurveyFieldErrors,
} from "../lib/engineering-survey-validation";
import { finalizeEngineeringSurveySubmission } from "../lib/finalize-engineering-survey-submission";
import type { EngineeringSurveyWindowHostRefObject } from "../lib/engineering-survey-window-host";
import { EngineeringSurveyChecklist } from "./EngineeringSurveyChecklist";
import { EngineeringSurveyMap } from "./EngineeringSurveyMap";
import { EngineeringSurveyPropertySummary } from "./EngineeringSurveyPropertySummary";
import {
  JEDDAH_DEFAULT_LAT,
  JEDDAH_DEFAULT_LNG,
} from "../lib/jeddah-default-coords";
import {
  applyChecklistToCaseStudyAnswers,
  caseStudyAnswersChanged,
} from "../lib/engineering-survey-checklist-sync";

type WorkTab = "property" | "survey" | "failures";

export function EngineeringSurveyWorkPanel({
  def,
  childTask: task,
  hostRef,
  deedNumber,
  onFailureSubmitted,
}: {
  def: PartyTaskPageDef;
  childTask: WorkflowTask;
  hostRef: EngineeringSurveyWindowHostRefObject;
  deedNumber: string;
  onFailureSubmitted?: () => void;
}) {
  const propertyId = task.propertyId ?? "";
  const { data: record } = usePoRecordQuery(task.poNumber);
  const property = record?.properties.find((p) => p.id === propertyId);
  const { data: failures = [] } = useFailuresQuery();

  const activeFailureCount = useMemo(() => {
    if (!propertyId) return 0;
    return failures.filter(
      (f) =>
        f.poNumber === task.poNumber &&
        f.propertyId === propertyId &&
        isActiveFailureStatus(f.status),
    ).length;
  }, [failures, propertyId, task.poNumber]);

  const [draft, setDraft] = useState<EngineeringSurveySubmission | null>(null);
  const [workTab, setWorkTab] = useState<WorkTab>("survey");
  const [fieldErrors, setFieldErrors] = useState<EngineeringSurveyFieldErrors>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    void getOrCreateEngineeringSurveyDraft({
      taskId: task.id,
      propertyId,
      poNumber: task.poNumber,
    }).then((loaded) => {
      if (!cancelled) setDraft(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [task.id, task.poNumber, propertyId]);

  const locked = draft ? isEngineeringSurveyFormLocked(draft.status) : false;
  const formDisabled = locked;

  const syncCaseStudyFromChecklist = useCallback(
    async (checklist: EngineeringSurveySubmission["checklist"]) => {
      if (locked || !task.id) return;

      const partyDraft =
        (await loadPartyCaseStudyFormDraft(task.id)) ??
        emptyCaseStudyFormDraft(task.id, {
          propertyId,
          poNumber: task.poNumber,
        });

      const mergedAnswers = applyChecklistToCaseStudyAnswers(
        checklist,
        partyDraft.answers,
      );
      if (!caseStudyAnswersChanged(partyDraft.answers, mergedAnswers)) return;

      await savePartyCaseStudyFormDraft({
        ...partyDraft,
        answers: mergedAnswers,
      });
    },
    [locked, propertyId, task.id, task.poNumber],
  );

  const persist = useCallback(
    (patch: Parameters<typeof updateEngineeringSurveyDraft>[1]) => {
      if (!task.id) return;
      void updateEngineeringSurveyDraft(task.id, patch).then((next) => {
        if (next) setDraft(next);
      });
    },
    [task.id],
  );

  useEffect(() => {
    if (!draft || locked) return;
    void syncCaseStudyFromChecklist(draft.checklist);
  }, [draft, locked, syncCaseStudyFromChecklist]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!draft || locked) return false;

    const errors = validateEngineeringSurveySubmission(draft);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(firstEngineeringSurveyError(errors));
      return false;
    }

    hostRef.current?.onSavingChange?.(true);
    setFormError(null);
    const submitted = await finalizeEngineeringSurveySubmission(task.id);
    hostRef.current?.onSavingChange?.(false);

    if (submitted) {
      setDraft(submitted);
      hostRef.current?.onSubmitted?.();
      return true;
    }
    return false;
  }, [draft, locked, hostRef, task.id]);

  useEffect(() => {
    if (!hostRef.current) return;
    hostRef.current.submit = submit;
  }, [hostRef, submit]);

  const handleCoordsChange = useCallback(
    (lat: string, lng: string) => {
      persist({ latitude: lat, longitude: lng });
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.latitude;
        delete next.longitude;
        return next;
      });
    },
    [persist],
  );

  function onFilePick(
    field: "surveyReportFileName" | "siteLetterFileName",
    file: File | null,
  ) {
    if (!file || formDisabled || !draft) return;
    const docField =
      field === "surveyReportFileName" ? "surveyReport" : "siteLetter";
    void cacheEngineeringSurveyFile(draft.taskId, docField, file).then((result) => {
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      const next = loadEngineeringSurveySubmission(draft.taskId);
      if (next) setDraft(next);
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field === "surveyReportFileName" ? "survey_report" : "site_letter"];
        return next;
      });
    });
  }

  function onFileClear(field: "surveyReportFileName" | "siteLetterFileName") {
    if (!draft || formDisabled) return;
    const docField =
      field === "surveyReportFileName" ? "surveyReport" : "siteLetter";
    void clearEngineeringSurveyFile(draft.taskId, docField).then(() => {
      const next = loadEngineeringSurveySubmission(draft.taskId);
      if (next) setDraft(next);
    });
  }

  function useCurrentLocation() {
    if (formDisabled || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        persist({ latitude: lat, longitude: lng });
      },
      () => {
        setFormError("تعذر الحصول على الموقع الحالي — أدخل الإحداثيات يدوياً");
      },
    );
  }

  if (!draft) {
    return <p className="po-properties-loading">جاري تحميل نموذج الرفع…</p>;
  }

  const surveyBody = (
    <>
      {draft.status === "reopened" && draft.returnNote ? (
        <InfoBox variant="amber" icon="⚠">
          <strong>تم إعادة الرفع المساحي — يرجى المراجعة والتصحيح.</strong>
          <br />
          {draft.returnNote}
        </InfoBox>
      ) : null}

      {formError ? (
        <InfoBox variant="red" icon="!">
          {formError}
        </InfoBox>
      ) : null}

      <SectionHeader>موقع العقار الميداني</SectionHeader>
      <InfoBox icon="ℹ">
        يُستخدم الموقع للتحقق من زيارة المكتب الهندسي. يجب أن تتطابق الإحداثيات
        مع موقع العقار الفعلي.
      </InfoBox>
      <div className="eng-office-coords-row">
        <div className="form-group">
          <label className="form-label" htmlFor="eng-lat">
            خط العرض (Latitude) <span className="req">*</span>
          </label>
          <input
            id="eng-lat"
            className="form-control eng-office-mono"
            disabled={formDisabled}
            value={draft.latitude}
            placeholder={JEDDAH_DEFAULT_LAT}
            onChange={(e) => {
              persist({ latitude: e.target.value });
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.latitude;
                return next;
              });
            }}
          />
          {fieldErrors.latitude ? (
            <p className="form-error">{fieldErrors.latitude}</p>
          ) : null}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="eng-lng">
            خط الطول (Longitude) <span className="req">*</span>
          </label>
          <input
            id="eng-lng"
            className="form-control eng-office-mono"
            disabled={formDisabled}
            value={draft.longitude}
            placeholder={JEDDAH_DEFAULT_LNG}
            onChange={(e) => {
              persist({ longitude: e.target.value });
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.longitude;
                return next;
              });
            }}
          />
          {fieldErrors.longitude ? (
            <p className="form-error">{fieldErrors.longitude}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline eng-office-locate-btn"
          disabled={formDisabled}
          onClick={useCurrentLocation}
        >
          موقعي الحالي
        </button>
      </div>
      <EngineeringSurveyMap
        latitude={draft.latitude}
        longitude={draft.longitude}
        disabled={formDisabled}
        onCoordsChange={handleCoordsChange}
      />

      <SectionDivider />
      <SectionHeader>التقرير المساحي</SectionHeader>
      <div className="eng-office-upload-zone">
        <div className="eng-office-upload-title">رفع التقرير المساحي</div>
        <div className="eng-office-upload-sub">PDF — الحجم الأقصى 20 ميجابايت</div>
        <label className="btn btn-sm btn-primary eng-office-upload-btn">
          اختيار ملف
          <input
            type="file"
            accept=".pdf,application/pdf"
            hidden
            disabled={formDisabled}
            onChange={(e) =>
              onFilePick("surveyReportFileName", e.target.files?.[0] ?? null)
            }
          />
        </label>
      </div>
      {draft.surveyReportFileName ? (
        <div className="eng-office-uploaded-file">
          <span>{draft.surveyReportFileName}</span>
          {!formDisabled ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => onFileClear("surveyReportFileName")}
            >
              حذف
            </button>
          ) : null}
        </div>
      ) : null}
      {fieldErrors.survey_report ? (
        <p className="form-error">{fieldErrors.survey_report}</p>
      ) : null}

      <SectionDivider />
      <SectionHeader>خطاب إقرار صحة الموقع</SectionHeader>
      <div className="eng-office-upload-zone">
        <div className="eng-office-upload-title">رفع خطاب الإقرار</div>
        <div className="eng-office-upload-sub">PDF — الحجم الأقصى 10 ميجابايت</div>
        <label className="btn btn-sm btn-primary eng-office-upload-btn">
          اختيار ملف
          <input
            type="file"
            accept=".pdf,application/pdf"
            hidden
            disabled={formDisabled}
            onChange={(e) =>
              onFilePick("siteLetterFileName", e.target.files?.[0] ?? null)
            }
          />
        </label>
      </div>
      {draft.siteLetterFileName ? (
        <div className="eng-office-uploaded-file">
          <span>{draft.siteLetterFileName}</span>
          {!formDisabled ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => onFileClear("siteLetterFileName")}
            >
              حذف
            </button>
          ) : null}
        </div>
      ) : null}
      <label className="eng-office-confirm-box">
        <input
          type="checkbox"
          checked={draft.siteConfirmed}
          disabled={formDisabled}
          onChange={(e) => {
            persist({ siteConfirmed: e.target.checked });
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.site_confirmed;
              return next;
            });
          }}
        />
        <span>
          أُقرّ بأن المكتب الهندسي تحقق ميدانياً وأن بيانات التقرير المساحي
          المرفوع <strong>صحيحة ودقيقة</strong>.
        </span>
      </label>
      {fieldErrors.site_confirmed ? (
        <p className="form-error">{fieldErrors.site_confirmed}</p>
      ) : null}
      {fieldErrors.site_letter ? (
        <p className="form-error">{fieldErrors.site_letter}</p>
      ) : null}

      <SectionDivider />
      <SectionHeader>نموذج التحقق الميداني — 13 بنداً</SectionHeader>
      <EngineeringSurveyChecklist
        rows={draft.checklist}
        disabled={formDisabled}
        onChange={(checklist) => {
          persist({ checklist });
          void syncCaseStudyFromChecklist(checklist);
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.checklist;
            return next;
          });
        }}
      />
      {fieldErrors.checklist ? (
        <p className="form-error">{fieldErrors.checklist}</p>
      ) : null}

      <SectionDivider />
      <SectionHeader>أسئلة نموذج دراسة الحالة</SectionHeader>
      <PartyCaseStudyFormTab def={def} childTask={task} />
    </>
  );

  return (
    <div className="po-property-detail-tabs-wrap">
      <nav className="pd-tabs-bar" aria-label="أقسام المهمة">
        <button
          type="button"
          className={`pd-tab${workTab === "property" ? " active" : ""}`}
          onClick={() => setWorkTab("property")}
        >
          بيانات العقار
        </button>
        <button
          type="button"
          className={`pd-tab${workTab === "survey" ? " active" : ""}`}
          onClick={() => setWorkTab("survey")}
        >
          {def.workTitle}
        </button>
        <button
          type="button"
          className={`pd-tab${workTab === "failures" ? " active" : ""}`}
          onClick={() => setWorkTab("failures")}
        >
          التعذرات
          {activeFailureCount > 0 ? (
            <span className="pd-tab-count pd-tab-count--red">
              {activeFailureCount}
            </span>
          ) : null}
        </button>
      </nav>

      <div className="pd-body-row">
        <div className="pd-tab-content">
          {workTab === "property" ? (
            <EngineeringSurveyPropertySummary
              property={property}
              record={record ?? undefined}
            />
          ) : null}
          {workTab === "survey" ? surveyBody : null}
          {workTab === "failures" && propertyId ? (
            <div className="eng-office-failures-panel">
              <SectionHeader>التعذرات المسجلة</SectionHeader>
              <FailureRaisePanel
                poNumber={task.poNumber}
                propertyId={propertyId}
                deedNumber={deedNumber}
                specialist={task.assigneeName || def.assigneeSubtitle}
                raisedByRole={failureRaiserRoleForParty(def)}
                onSubmitted={onFailureSubmitted}
              />
            </div>
          ) : null}
        </div>

        {record && property ? (
          <PropertyTransactionTimeline record={record} property={property} />
        ) : null}
      </div>
    </div>
  );
}
