"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { RegField, RegSelect } from "@platform/app-shared/registration/FormFields";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { isSuperAdmin } from "@platform/app-shared/prototype/prototype-role-access";
import type { RoleId } from "@platform/types";
import {
  addFailureProblemType,
  removeFailureProblemType,
  resetFailureTypesCatalog,
} from "../lib/failure-types-storage";
import { useFailureTypesQuery } from "../query/failure-types-queries";

function canManageFailureTypes(role: RoleId): boolean {
  return isSuperAdmin(role) || role === "section-supervisor";
}

/** §4 — إدارة قائمة أنواع التعذرات (قابلة للتوسع دون تعديل في الكود). */
export function FailureTypesView() {
  const queryClient = useQueryClient();
  const { role } = usePrototype();
  const canEdit = canManageFailureTypes(role);
  const { data: catalog, refetch } = useFailureTypesQuery();
  const [categoryId, setCategoryId] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: prototypeKeys.failureTypes(),
    });
    await refetch();
  }, [queryClient, refetch]);

  useEffect(() => {
    if (!catalog?.categories.length) return;
    if (!categoryId) setCategoryId(catalog.categories[0].id);
  }, [catalog, categoryId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleAdd() {
    if (!canEdit || !categoryId || !label.trim()) return;
    addFailureProblemType({
      categoryId,
      label,
      description,
    });
    await refresh();
    setLabel("");
    setDescription("");
    setToast("تمت إضافة نوع التعذر");
  }

  async function handleRemove(id: string) {
    if (!canEdit) return;
    removeFailureProblemType(id);
    await refresh();
    setToast("تم الحذف");
  }

  async function handleReset() {
    if (!canEdit) return;
    resetFailureTypesCatalog();
    await refresh();
    setToast("تمت استعادة القائمة الافتراضية");
  }

  if (!catalog) {
    return (
      <p className="po-properties-loading page-gutter" style={{ paddingTop: 16 }}>
        جاري التحميل…
      </p>
    );
  }

  const sortedCategories = [...catalog.categories].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <>
      {toast ? <div className="note note-success">{toast}</div> : null}

      {!canEdit ? (
        <div className="note note-info">
          وضع الاطلاع — صلاحية التعديل للمشرف ومسؤول النظام.
        </div>
      ) : null}

      <div className="note note-warn">
        القائمة مبدئية وقابلة للتوسع — تُضاف أنواع جديدة دون الحاجة لتعديل في الكود
        (§4 وثيقة التعذرات).
      </div>

      {canEdit ? (
        <article className="page-shell">
          <header className="po-subpage-hd">
            <div className="po-subpage-titles">
              <h2 className="po-subpage-title">إضافة نوع تعذر</h2>
            </div>
          </header>
          <div className="reg-form-grid page-gutter" style={{ paddingBottom: 12 }}>
            <RegSelect
              id="failure_type_category"
              label="التصنيف"
              value={categoryId}
              onChange={setCategoryId}
              options={sortedCategories.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
            />
            <RegField
              id="failure_type_label"
              label="اسم نوع المشكلة"
              value={label}
              onChange={setLabel}
            />
            <RegField
              id="failure_type_description"
              label="وصف (اختياري)"
              value={description}
              onChange={setDescription}
            />
          </div>
          <div className="page-gutter" style={{ display: "flex", gap: 8, paddingBottom: 16 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void handleAdd()}
            >
              إضافة
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => void handleReset()}
            >
              استعادة القائمة الافتراضية
            </button>
          </div>
        </article>
      ) : null}

      {sortedCategories.map((category) => {
        const types = catalog.problemTypes
          .filter((t) => t.categoryId === category.id)
          .sort((a, b) => a.order - b.order);
        return (
          <article key={category.id} className="page-shell">
            <header className="po-subpage-hd">
              <div className="po-subpage-titles">
                <h2 className="po-subpage-title">{category.label}</h2>
              </div>
            </header>
            <div className="page-gutter" style={{ paddingBlock: 12 }}>
              {types.length === 0 ? (
                <p style={{ color: "var(--text3)", fontSize: 13 }}>لا أنواع.</p>
              ) : (
                types.map((type) => (
                  <div
                    key={type.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px dashed var(--border)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {type.label}
                      </div>
                      {type.description ? (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text3)",
                            marginTop: 2,
                          }}
                        >
                          {type.description}
                        </div>
                      ) : null}
                    </div>
                    {canEdit && type.id.startsWith("custom-") ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => void handleRemove(type.id)}
                      >
                        حذف
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}
