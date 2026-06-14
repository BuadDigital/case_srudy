"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  findSurveyChildForParent,
} from "@engineering-office/mfe";
import { useMemo, useState } from "react";
import { getPropertyFailure } from "@failures/mfe";
import { failureStatusLabel } from "@failures/mfe/lib/failures-local-storage";
import {
  DocIconButton,
  EmptyState,
  FieldBox,
  FieldsGrid,
  InfoBox,
  SectionDivider,
  SectionHeader,
} from "./PropertyDetailFields";
import { PropertyDetailCaseStudyReport } from "./PropertyDetailCaseStudyReport";
import { PropertyDetailPropertyKeys } from "./PropertyDetailPropertyKeys";
import { PropertyDetailEnfathUpload } from "./PropertyDetailEnfathUpload";
import { PropertyTransactionTimeline } from "./PropertyTransactionTimeline";
import {
  boundariesAvailabilityLabel,
  formatDateAr,
  formatPropertyDeedDisplay,
  formatPropertyLocation,
  formatPropertyTypeLine,
  hasBourseDetailFields,
  restrictionsPresentLabel,
  showsCourtFields,
  skipsBourseForIdentifier,
  type PoIntakeRecord,
  type PoPropertyIntake,
} from "../../lib/prototype/po-intake-data";
import { isValidContactEntry } from "./po-property-validation";
import { PartyRoleDetailPanel } from "./PartyRoleDetailPanel";
import {
  buildPropertyDetailPartyCards,
  partyCardDotClass,
  partyCardStatusLabel,
  type PropertyDetailPartyRoleKey,
} from "../../lib/prototype/property-detail-parties";
import { poPropertyFailurePath, poPropertyPath } from "../../lib/po-routes";
import {
  buildPropertyDetailTimeline,
  formatTimelineDate,
} from "../../lib/prototype/property-detail-timeline";
import {
  caseStudyTaskForProperty,
} from "../../lib/prototype/tasks-storage";
import { childTasksForCaseStudyParent } from "../../lib/prototype/case-study-party-answers";
import {
  countPropertyDetailDocuments,
  downloadPropertyDetailDocument,
  type PropertyDetailDocumentEntry,
  type PropertyDetailDocumentSection,
} from "../../lib/prototype/property-detail-documents";
import { usePropertyDetailDocuments } from "../../query/property-detail-documents-query";
import { useWorkflowTasksQuery } from "../../query/case-study-queries";
import { usePropertyDetailPartySubmissionsQuery } from "../../query/property-detail-party-submissions-queries";

const TABS = [
  { id: "basic", label: "البيانات الأساسية" },
  { id: "documents", label: "مستندات العقار" },
  { id: "linked", label: "العقارات المرتبطة" },
  { id: "failures", label: "التعذرات" },
  { id: "parties", label: "الأطراف" },
  { id: "report", label: "تقرير دراسة الحالة" },
  { id: "appraisal", label: "تقييم العقار" },
  { id: "photos", label: "صور العقار" },
  { id: "log", label: "السجل والتدقيق" },
  { id: "keys", label: "مفاتيح العقار" },
  { id: "enfath-upload", label: "الرفع على انفاذ" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function docIconLabel(kind: PropertyDetailDocumentEntry["kind"]): string {
  if (kind === "pdf") return "PDF";
  if (kind === "image") return "📷";
  return "📄";
}

function docIconClass(kind: PropertyDetailDocumentEntry["kind"]): string {
  return kind === "pdf" ? "pd-doc-icon is-pdf" : "pd-doc-icon";
}

function DocumentRow({ doc }: { doc: PropertyDetailDocumentEntry }) {
  const canDownload = Boolean(doc.dataUrl);

  return (
    <div className="pd-doc-row">
      <div className="pd-doc-row-main">
        <span className={docIconClass(doc.kind)} aria-hidden>
          {docIconLabel(doc.kind)}
        </span>
        <div>
          <div className="pd-doc-name">{doc.name}</div>
          <div className="pd-doc-sub">
            <bdi dir="ltr" className="po-property-detail-ltr-val">
              {doc.fileName}
            </bdi>
          </div>
        </div>
      </div>
      <div className="pd-doc-actions">
        <DocIconButton
          label="تحميل"
          disabled={!canDownload}
          onClick={() => downloadPropertyDetailDocument(doc)}
        />
      </div>
    </div>
  );
}

function DocumentsTab({
  sections,
}: {
  sections: PropertyDetailDocumentSection[];
}) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} className="pd-doc-section">
          <SectionHeader>{section.title}</SectionHeader>
          {section.documents.length === 0 ? (
            <InfoBox icon="ℹ">لا توجد مستندات في هذا القسم بعد.</InfoBox>
          ) : (
            <div className="pd-doc-list">
              {section.documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  );
}

function logIconGlyph(tone: string): string {
  if (tone === "done") return "✓";
  if (tone === "active") return "⚠";
  if (tone === "warn") return "⚠";
  return "+";
}

function logIconClass(tone: string): string {
  if (tone === "done") return "pd-log-icon--teal";
  if (tone === "active") return "pd-log-icon--amber";
  if (tone === "warn") return "pd-log-icon--red";
  return "pd-log-icon--gray";
}

function BasicTab({
  record,
  property,
}: {
  record: PoIntakeRecord;
  property: PoPropertyIntake;
}) {
  const boursePending = !property.bourseDataCompleted;
  const needsBourse = !skipsBourseForIdentifier(property.identifierType);
  const showBourseSection =
    needsBourse &&
    (boursePending ||
      hasBourseDetailFields(property) ||
      property.bourseDataCompleted);
  const validContacts = property.contacts.filter((c) => isValidContactEntry(c));
  const restrictions = restrictionsPresentLabel(property.restrictionsPresent);
  const courtLine = [property.court, property.circuit]
    .filter(Boolean)
    .join(" · ");
  const primaryContact = validContacts[0];
  const hasMapTarget = Boolean(
    property.city.trim() || property.district.trim(),
  );

  return (
    <>
      <SectionHeader>بيانات الصك</SectionHeader>
      <FieldsGrid>
        <FieldBox label="رقم الصك" value={property.deedNumber} ltr />
        <FieldBox label="تاريخ الصك" value={property.deedDate} ltr />
        <FieldBox label="حالة الصك">
          {property.deedStatus.trim() ? (
            <span className="pd-badge pd-badge-teal">{property.deedStatus}</span>
          ) : null}
        </FieldBox>
        <FieldBox label="اسم المالك" value={property.ownerName} />
        <FieldBox label="حالة الملك" value={property.deedStatus} />
        <FieldBox
          label="القيود على العقار"
          value={restrictions}
          emptyLabel="لا توجد قيود"
        />
      </FieldsGrid>

      <SectionDivider />
      <SectionHeader>بيانات الموقع</SectionHeader>
      <FieldsGrid>
        <FieldBox label="المدينة" value={property.city} />
        <FieldBox label="الحي" value={property.district} />
        {showsCourtFields(record.assignmentType) ? (
          <FieldBox label="المحكمة / الدائرة" value={courtLine} />
        ) : null}
        <FieldBox
          label="توفر الحدود"
          value={boundariesAvailabilityLabel(property.boundariesAvailability)}
        />
        <FieldBox label="الإحداثيات" span={2} link={hasMapTarget}>
          {hasMapTarget ? "عرض على الخريطة" : undefined}
        </FieldBox>
      </FieldsGrid>

      <SectionDivider />
      <SectionHeader>البيانات المساحية</SectionHeader>
      <FieldsGrid>
        <FieldBox label="التصنيف" value={property.classification} />
        <FieldBox label="النوع / الاستخدام" value={property.propertyType} />
        <FieldBox
          label="المساحة الإجمالية"
          value={property.area.trim() ? `${property.area.trim()} م²` : ""}
        />
        <FieldBox label="الأطوال والأبعاد" emptyLabel="غير محدد" />
        <FieldBox label="واجهات الأرض" emptyLabel="غير محدد" />
        <FieldBox label="رقم القطعة / المخطط" emptyLabel="غير محدد" />
      </FieldsGrid>

      <SectionDivider />
      <SectionHeader>بيانات الاتصال</SectionHeader>
      {validContacts.length === 0 ? (
        <InfoBox icon="ℹ">لا يوجد ضابط اتصال مسجّل.</InfoBox>
      ) : (
        <FieldsGrid cols={2}>
          <FieldBox
            label="جهة الاتصال"
            value={primaryContact.role.trim() || "المالك"}
          />
          <FieldBox label="رقم الجوال" value={primaryContact.phone} ltr />
        </FieldsGrid>
      )}

      {showBourseSection ? (
        <>
          <SectionDivider />
          <SectionHeader>بيانات الاستعلام — البورصة العقارية</SectionHeader>
          {boursePending && !hasBourseDetailFields(property) ? (
            <InfoBox variant="amber" icon="ℹ">
              لم تُسجَّل بعد بيانات استعلام البورصة — أكملها من «استعلام
              البورصة» في الشريط العلوي.
            </InfoBox>
          ) : (
            <>
              {property.bourseDataCompleted ? (
                <InfoBox variant="teal" icon="✓">
                  اكتمل استعلام البورصة العقارية بنجاح
                  {record.receivedFromEnfathAt ? (
                    <>
                      {" بتاريخ "}
                      <bdi dir="ltr" className="po-property-detail-ltr-val">
                        {formatDateAr(record.receivedFromEnfathAt)}
                      </bdi>
                    </>
                  ) : null}
                  .
                </InfoBox>
              ) : null}
              <FieldsGrid>
                <FieldBox
                  label="حالة الصك في البورصة"
                  value={property.deedStatus}
                />
                <FieldBox
                  label="الفروق / الملاحظات"
                  emptyLabel="لا توجد فروق"
                />
                <FieldBox
                  label="تاريخ آخر تحديث"
                  ltr
                  value={
                    record.receivedFromEnfathAt
                      ? formatDateAr(record.receivedFromEnfathAt)
                      : ""
                  }
                />
              </FieldsGrid>
            </>
          )}
        </>
      ) : null}
    </>
  );
}

export function PoPropertyDetailTabs({
  record,
  property,
  showDecree,
}: {
  record: PoIntakeRecord;
  property: PoPropertyIntake;
  showDecree: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabId>(() =>
    TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : "basic",
  );
  const [selectedPartyRole, setSelectedPartyRole] =
    useState<PropertyDetailPartyRoleKey | null>(null);
  const { data: tasks = [] } = useWorkflowTasksQuery();
  const poNumber = record.poNumber.trim();

  const task = useMemo(
    () => caseStudyTaskForProperty(poNumber, property.id, tasks),
    [poNumber, property.id, tasks],
  );

  const failure = useMemo(
    () => getPropertyFailure(poNumber, property.id),
    [poNumber, property.id],
  );

  const linkedProperties = useMemo(
    () =>
      record.properties
        .filter((p) => p.id !== property.id)
        .map((p) => ({
          property: p,
          index: record.properties.findIndex((x) => x.id === p.id) + 1,
        })),
    [record.properties, property.id],
  );

  const surveyTask = useMemo(
    () =>
      task
        ? findSurveyChildForParent(task.id, property.id, tasks)
        : null,
    [task, property.id, tasks],
  );

  const appraisalTask = useMemo(() => {
    if (!task) return null;
    return (
      childTasksForCaseStudyParent(task.id, tasks).find(
        (t) => t.kind === "property-appraisal",
      ) ?? null
    );
  }, [task, tasks]);

  const inspectionTask = useMemo(() => {
    if (!task) return null;
    return (
      childTasksForCaseStudyParent(task.id, tasks).find(
        (t) => t.kind === "field-inspection",
      ) ?? null
    );
  }, [task, tasks]);

  const propertyDocumentSections = usePropertyDetailDocuments({
    property,
    showDecree,
    poNumber,
    surveyTaskId: surveyTask?.id ?? null,
    appraisalTaskId: appraisalTask?.id ?? null,
    inspectionTaskId: inspectionTask?.id ?? null,
  });

  const docCount = countPropertyDetailDocuments(propertyDocumentSections);
  const specialistName = task?.assigneeName?.trim() || record.assignmentSpecialist.trim();
  const partyCards = buildPropertyDetailPartyCards({
    specialistName,
    task: task ?? null,
    allTasks: tasks,
  });
  const selectedPartyCard =
    partyCards.find((card) => card.roleKey === selectedPartyRole) ?? null;
  const coordinatorCard = partyCards.find((c) => c.roleKey === "coordinator");
  const coordinatorName =
    coordinatorCard && !coordinatorCard.unassigned ? coordinatorCard.name : "";

  const governmentCard =
    partyCards.find((c) => c.roleKey === "government") ?? null;

  const partySubmissionsQuery = usePropertyDetailPartySubmissionsQuery({
    parentTask: task ?? null,
    allTasks: tasks,
    coordinatorName,
    enabled: tab === "parties" || tab === "keys",
  });

  const logEvents = useMemo(
    () =>
      [...buildPropertyDetailTimeline({ record, property, tasks })].reverse(),
    [record, property, tasks],
  );

  return (
    <div className="po-property-detail-tabs-wrap">
      <nav className="pd-tabs-bar" aria-label="أقسام تفاصيل العقار">
        {TABS.map((t) => {
          let count: number | null = null;
          let countTone: "teal" | "red" | "gray" = "gray";
          if (t.id === "documents" && docCount > 0) {
            count = docCount;
            countTone = "teal";
          }
          if (t.id === "failures" && failure) {
            count = 1;
            countTone = "red";
          }
          if (t.id === "photos") {
            count = 0;
          }
          if (t.id === "keys") {
            const govSubmission = partySubmissionsQuery.data?.government;
            if (govSubmission?.hasData) {
              const keysField = govSubmission.fields.find(
                (f) => f.label === "حالة المفاتيح",
              );
              if (keysField?.value?.includes("استلام")) {
                count = 1;
                countTone = "teal";
              } else if (keysField?.value) {
                count = 1;
                countTone = "gray";
              }
            }
          }

          return (
            <button
              key={t.id}
              type="button"
              className={`pd-tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {count !== null ? (
                <span className={`pd-tab-count pd-tab-count--${countTone}`}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="pd-body-row">
        <div className="pd-tab-content">
          {tab === "basic" ? (
            <BasicTab record={record} property={property} />
          ) : null}

          {tab === "documents" ? (
            <DocumentsTab sections={propertyDocumentSections} />
          ) : null}

          {tab === "linked" ? (
            linkedProperties.length === 0 ? (
              <EmptyState
                icon="🔗"
                title="لا توجد عقارات مرتبطة"
                sub="لا توجد عقارات أخرى مرتبطة بهذا الصك حالياً."
              />
            ) : (
              <>
                <SectionHeader>العقارات على نفس أمر العمل</SectionHeader>
                <ul className="po-property-linked-list">
                  {linkedProperties.map(({ property: linked, index }) => (
                    <li key={linked.id} className="po-property-linked-item">
                      <Link
                        href={poPropertyPath(poNumber, linked.id)}
                        className="po-property-linked-link"
                      >
                        <span className="po-property-linked-deed">
                          {formatPropertyDeedDisplay(linked)}
                        </span>
                        <span className="po-property-linked-meta">
                          عقار {index} · {formatPropertyLocation(linked) || "—"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )
          ) : null}

          {tab === "failures" ? (
            failure ? (
              <>
                <SectionHeader>التعذرات المسجلة</SectionHeader>
                <div
                  className={`pd-fail-row${
                    failure.status === "approved"
                      ? " pd-fail-row--resolved"
                      : " pd-fail-row--pending"
                  }`}
                >
                  <div className="pd-fail-body">
                    <div className="pd-fail-title">{failure.title}</div>
                    <div className="pd-fail-meta">
                      سُجّل بواسطة {failure.specialist || "—"} ·{" "}
                      <bdi dir="ltr" className="po-property-detail-ltr-val">
                        {formatDateAr(failure.updatedAt.slice(0, 10))}
                      </bdi>
                      {failure.internalNote
                        ? ` · السبب: ${failure.internalNote}`
                        : null}
                    </div>
                  </div>
                  <div className="pd-fail-actions">
                    <span className="pd-badge pd-badge-amber">
                      {failureStatusLabel(failure.status)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        router.push(poPropertyFailurePath(poNumber, property.id))
                      }
                    >
                      معالجة
                    </button>
                  </div>
                </div>
                <p className="pd-tab-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      router.push(poPropertyFailurePath(poNumber, property.id))
                    }
                  >
                    تسجيل تعذّر جديد
                  </button>
                </p>
              </>
            ) : (
              <>
                <SectionHeader>التعذرات المسجلة</SectionHeader>
                <EmptyState
                  icon="⚠"
                  title="لا توجد تعذرات"
                  sub="لم يُسجَّل أي تعذر لهذا العقار."
                />
                <p className="pd-tab-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      router.push(poPropertyFailurePath(poNumber, property.id))
                    }
                  >
                    تسجيل تعذّر جديد
                  </button>
                </p>
              </>
            )
          ) : null}

          {tab === "parties" ? (
            <>
              <SectionHeader>الأطراف المعيّنة</SectionHeader>
              <div className="pd-party-grid">
                {partyCards.map((card) => {
                  const selected = selectedPartyRole === card.roleKey;
                  return (
                    <button
                      key={card.roleKey}
                      type="button"
                      className={`pd-party-card pd-party-card--clickable${
                        selected ? " pd-party-card--selected" : ""
                      }`}
                      aria-pressed={selected}
                      onClick={() =>
                        setSelectedPartyRole((prev) =>
                          prev === card.roleKey ? null : card.roleKey,
                        )
                      }
                    >
                      <div className="pd-party-role">{card.role}</div>
                      <div
                        className={`pd-party-name${
                          card.unassigned ? " pd-party-name--na" : ""
                        }`}
                      >
                        {card.name}
                      </div>
                      <div className="pd-party-status">
                        <span
                          className={`pd-status-dot ${partyCardDotClass(card)}`}
                        />
                        <span className="pd-status-label">
                          {partyCardStatusLabel(card)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedPartyCard ? (
                <PartyRoleDetailPanel
                  card={selectedPartyCard}
                  submission={
                    partySubmissionsQuery.data?.[selectedPartyCard.roleKey] ??
                    null
                  }
                  loading={
                    partySubmissionsQuery.isLoading ||
                    partySubmissionsQuery.isFetching
                  }
                />
              ) : null}
            </>
          ) : null}

          {tab === "report" ? (
            <>
              <SectionHeader>نموذج دراسة الحالة</SectionHeader>
              <PropertyDetailCaseStudyReport
                record={record}
                property={property}
                task={task ?? null}
              />
            </>
          ) : null}

          {tab === "appraisal" ? (
            <>
              <SectionHeader>ملخص التقييم</SectionHeader>
              <InfoBox icon="ℹ">
                لم يتم رفع تقرير التقييم بعد. يُستكمل هذا القسم بعد إتمام
                المقيّم لعمله.
              </InfoBox>
              <SectionHeader>قائمة التقييم</SectionHeader>
              <FieldsGrid>
                <FieldBox label="سعر التقييم" emptyLabel="—" />
                <FieldBox label="تاريخ التقييم" emptyLabel="—" />
                <FieldBox label="جهة التقييم" emptyLabel="—" />
                <FieldBox label="ملاحظات المقيّم" emptyLabel="—" />
                <FieldBox label="رقم الشهادة" emptyLabel="—" />
                <FieldBox label="حالة التقرير" emptyLabel="—" />
              </FieldsGrid>
            </>
          ) : null}

          {tab === "photos" ? (
            <>
              <SectionHeader>صور العقار</SectionHeader>
              <InfoBox icon="ℹ">لا توجد صور مرفوعة لهذا العقار بعد.</InfoBox>
              <div className="pd-photos-grid">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="pd-photo-cell">
                    <span className="pd-photo-cell-icon" aria-hidden>
                      +
                    </span>
                    <span>رفع صورة</span>
                  </div>
                ))}
              </div>
              <p className="pd-tab-actions">
                <button type="button" className="btn btn-sm">
                  رفع صور متعددة
                </button>
              </p>
            </>
          ) : null}

          {tab === "log" ? (
            logEvents.length === 0 ? (
              <EmptyState title="لا يوجد سجل إجراءات" />
            ) : (
              <>
                <SectionHeader>سجل الإجراءات الكامل</SectionHeader>
                <div className="pd-log-list">
                  {logEvents.map((event) => (
                    <div key={event.id} className="pd-log-row">
                      <div
                        className={`pd-log-icon ${logIconClass(event.tone)}`}
                        aria-hidden
                      >
                        {logIconGlyph(event.tone)}
                      </div>
                      <div className="pd-log-body">
                        <div className="pd-log-action">{event.title}</div>
                        <div className="pd-log-meta">
                          <span>{formatTimelineDate(event.at)}</span>
                          {event.detail ? <span>{event.detail}</span> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : null}

          {tab === "keys" ? (
            <PropertyDetailPropertyKeys
              property={property}
              governmentCard={governmentCard}
              submission={partySubmissionsQuery.data?.government ?? null}
              loading={
                partySubmissionsQuery.isLoading ||
                partySubmissionsQuery.isFetching
              }
            />
          ) : null}

          {tab === "enfath-upload" ? <PropertyDetailEnfathUpload /> : null}
        </div>

        <PropertyTransactionTimeline record={record} property={property} />
      </div>
    </div>
  );
}
