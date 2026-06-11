"use client";

import { useCallback, useEffect, useState } from "react";
import type { PartyTaskPageDef } from "@platform/app-shared/prototype/party-task-pages";
import type { WorkflowTask } from "@case-study/mfe";
import { PartyCaseStudyFormTab } from "@case-study/mfe";
import { usePoRecordQuery } from "@case-study/mfe/query/case-study-queries";
import { RegistrationFormCard } from "@platform/app-shared/registration/RegistrationFormCard";
import {
  isEngineeringSurveyFormLocked,
  type EngineeringSurveySubmission,
} from "../lib/engineering-survey-data";
import {
  getOrCreateEngineeringSurveyDraft,
  updateEngineeringSurveyDraft,
} from "../lib/engineering-survey-submission-storage";
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

type WorkTab = "property" | "survey" | "case-study";

export function EngineeringSurveyWorkPanel({
  def,
  childTask: task,
  hostRef,
}: {
  def: PartyTaskPageDef;
  childTask: WorkflowTask;
  hostRef: EngineeringSurveyWindowHostRefObject;
}) {
  const propertyId = task.propertyId ?? "";
  const { data: record } = usePoRecordQuery(task.poNumber);
  const property = record?.properties.find((p) => p.id === propertyId);

  const [draft, setDraft] = useState<EngineeringSurveySubmission | null>(null);
  const [workTab, setWorkTab] = useState<WorkTab>("survey");
  const [fieldErrors, setFieldErrors] = useState<EngineeringSurveyFieldErrors>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    setDraft(
      getOrCreateEngineeringSurveyDraft({
        taskId: task.id,
        propertyId,
        poNumber: task.poNumber,
      }),
    );
  }, [task.id, task.poNumber, propertyId]);

  const locked = draft ? isEngineeringSurveyFormLocked(draft.status) : false;
  const formDisabled = locked;

  const persist = useCallback(
    (patch: Parameters<typeof updateEngineeringSurveyDraft>[1]) => {
      if (!task.id) return;
      const next = updateEngineeringSurveyDraft(task.id, patch);
      if (next) setDraft(next);
    },
    [task.id],
  );

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
    if (!file || formDisabled) return;
    persist({ [field]: file.name });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field === "surveyReportFileName" ? "survey_report" : "site_letter"];
      return next;
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

  return (
    <div className="eng-office-work">
      <nav className="case-study-tabs party-work-tabs" aria-label="أقسام المهمة">
        <button
          type="button"
          className={`case-study-tab${workTab === "property" ? " active" : ""}`}
          onClick={() => setWorkTab("property")}
        >
          بيانات العقار
        </button>
        <button
          type="button"
          className={`case-study-tab${workTab === "survey" ? " active" : ""}`}
          onClick={() => setWorkTab("survey")}
        >
          {def.workTitle}
        </button>
        <button
          type="button"
          className={`case-study-tab${workTab === "case-study" ? " active" : ""}`}
          onClick={() => setWorkTab("case-study")}
        >
          أسئلة نموذج دراسة الحالة
        </button>
      </nav>

      {draft.status === "reopened" && draft.returnNote ? (
        <div className="eng-office-return-notice" role="status">
          <div className="eng-office-return-title">
            تم إعادة الرفع المساحي — يرجى المراجعة والتصحيح
          </div>
          <p>{draft.returnNote}</p>
        </div>
      ) : null}

      {formError ? (
        <div className="note note-danger" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      {workTab === "property" ? (
        <EngineeringSurveyPropertySummary property={property} />
      ) : null}

      {workTab === "case-study" ? (
        <PartyCaseStudyFormTab def={def} childTask={task} />
      ) : null}

      {workTab === "survey" ? (
        <div className="eng-office-work-grid">
          <div className="eng-office-work-main">
            <RegistrationFormCard title="موقع العقار الميداني">
              <div className="note note-info eng-office-map-note">
                يُستخدم الموقع للتحقق من زيارة المكتب الهندسي. يجب أن تتطابق
                الإحداثيات مع موقع العقار الفعلي.
              </div>
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
            </RegistrationFormCard>

            <RegistrationFormCard title="التقرير المساحي">
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
                      onClick={() => persist({ surveyReportFileName: "" })}
                    >
                      حذف
                    </button>
                  ) : null}
                </div>
              ) : null}
              {fieldErrors.survey_report ? (
                <p className="form-error">{fieldErrors.survey_report}</p>
              ) : null}
            </RegistrationFormCard>

            <RegistrationFormCard title="خطاب إقرار صحة الموقع">
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
                      onClick={() => persist({ siteLetterFileName: "" })}
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
            </RegistrationFormCard>

            <RegistrationFormCard title="نموذج التحقق الميداني — 13 بنداً">
              <EngineeringSurveyChecklist
                rows={draft.checklist}
                disabled={formDisabled}
                onChange={(checklist) => {
                  persist({ checklist });
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
            </RegistrationFormCard>
          </div>

          <aside className="eng-office-work-side" aria-label="معلومات مساعدة">
            <div className="eng-office-side-card">
              <div className="eng-office-side-hd">الجدول الزمني</div>
              <ul className="eng-office-timeline">
                <li>
                  <span className="eng-office-tl-dot eng-office-tl-dot--ok" />
                  تأكيد التوزيع على المكتب
                </li>
                <li>
                  <span className="eng-office-tl-dot eng-office-tl-dot--warn" />
                  بدء الرفع المساحي
                </li>
              </ul>
            </div>
            <div className="eng-office-side-card">
              <div className="eng-office-side-hd">الاستحقاق</div>
              <p className="eng-office-deadline">
                {record?.dueDateAt
                  ? new Date(record.dueDateAt).toLocaleDateString("ar-SA")
                  : "—"}
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
