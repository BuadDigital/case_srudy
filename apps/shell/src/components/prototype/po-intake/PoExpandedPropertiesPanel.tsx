"use client";

import { StatusBadge } from "@platform/design-system";
import { EyeIconButton } from "@/components/ui/EyeIconButton";
import {
  requiresAssignmentDecree,
  type PoPropertyIntake,
} from "@/lib/prototype/po-intake-data";
import { getPropertyFailure } from "@/lib/prototype/failures-storage";
import { usePoRecordQuery } from "@/lib/query/prototype-queries";
import { poPropertyToPropertyRow } from "@/lib/prototype/po-intake-storage";

function deedLabel(property: PoPropertyIntake): string {
  return property.deedNumber.trim() || "—";
}

export function PoExpandedPropertiesPanel({
  poNumber,
  showEdit,
  previewPropertyId,
  onTogglePreviewAction,
  onEditPropertyAction,
  onFailurePropertyAction,
  onAddPropertyAction,
}: {
  poNumber: string;
  showEdit: boolean;
  previewPropertyId: string | null;
  onTogglePreviewAction: (propertyId: string) => void;
  onEditPropertyAction: (propertyId: string) => void;
  onFailurePropertyAction: (propertyId: string, deedNumber: string) => void;
  onAddPropertyAction: () => void;
}) {
  const { data: record, isPending } = usePoRecordQuery(poNumber);

  if (isPending && !record) {
    return (
      <div className="po-expand-panel">
        <p className="po-expand-loading">جاري التحميل…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="po-expand-panel">
        <p className="po-detail-empty">لم يُعثر على أمر العمل.</p>
      </div>
    );
  }

  const showDecree = requiresAssignmentDecree(record.assignmentType);
  const priorByDeed = new Map<string, string>();

  return (
    <div className="po-expand-panel">
      <div className="po-expand-panel-hd">
        <span className="po-expand-panel-title">
          عقارات أمر العمل ({record.properties.length})
        </span>
        {showEdit ? (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onAddPropertyAction}
          >
            + إضافة عقار
          </button>
        ) : null}
      </div>

      {record.properties.length === 0 ? (
        <p className="po-detail-empty">لا توجد عقارات في هذا الأمر.</p>
      ) : (
        <table className="tbl po-expand-tbl">
          <thead>
            <tr>
              <th>رقم الصك / العقار</th>
              <th>الموقع</th>
              <th>التصنيف / النوع</th>
              <th>حالة الصك</th>
              <th>الحالة</th>
              <th aria-label="عرض التفاصيل" />
              {showEdit ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {record.properties.map((prop) => {
              const row = poPropertyToPropertyRow(record, prop, priorByDeed);
              const location = prop.district
                ? `${prop.city} · ${prop.district}`
                : prop.city || "—";
              const typeLabel =
                prop.propertyType || prop.classification || "—";

              return (
                <tr key={prop.id}>
                  <td className="id-cell" dir="ltr">
                    {deedLabel(prop)}
                  </td>
                  <td>{location}</td>
                  <td>
                    {prop.classification
                      ? `${prop.classification} · ${typeLabel}`
                      : typeLabel}
                  </td>
                  <td>{prop.deedStatus || "—"}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>
                    <EyeIconButton
                      active={previewPropertyId === prop.id}
                      label={`عرض تفاصيل الصك ${deedLabel(prop)}`}
                      onClick={() => onTogglePreviewAction(prop.id)}
                    />
                  </td>
                  {showEdit ? (
                    <td>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onEditPropertyAction(prop.id)}
                        >
                          تعديل
                        </button>
                        {!getPropertyFailure(poNumber, prop.id) ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger-outline"
                            onClick={() =>
                              onFailurePropertyAction(
                                prop.id,
                                deedLabel(prop),
                              )
                            }
                          >
                            تعذر
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showDecree ? (
        <p className="po-expand-note">
          مسار التنفيذ — قرار إسناد مستقل لكل صك (اضغط العين لمعاينة التفاصيل).
        </p>
      ) : null}
    </div>
  );
}
