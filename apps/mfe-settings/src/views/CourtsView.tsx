"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrototype } from "@platform/app-shared/contexts/PrototypeContext";
import { RegField, RegSelect } from "@platform/app-shared/registration/FormFields";
import { prototypeKeys } from "@platform/app-shared/query/prototype-keys";
import { CITY_OPTIONS } from "@case-study/mfe";
import { canManageCourts } from "../lib/settings-roles";
import { saveCourtsCatalog } from "../lib/prototype/courts-storage";
import { useCourtsCatalogQuery } from "../query/settings-queries";

function newCourtId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}`;
}

export function CourtsView() {
  const queryClient = useQueryClient();
  const { role } = usePrototype();
  const canEdit = canManageCourts(role);
  const { data: entries = [], refetch } = useCourtsCatalogQuery();
  const [city, setCity] = useState<string>(CITY_OPTIONS[0]);
  const [court, setCourt] = useState("");
  const [circuitInput, setCircuitInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: prototypeKeys.courtsCatalog(),
    });
    await refetch();
  }, [queryClient, refetch]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleAdd() {
    if (!canEdit) return;
    const courtName = court.trim();
    const circuit = circuitInput.trim();
    if (!courtName || !circuit) {
      setToast("أدخل اسم المحكمة والدائرة");
      return;
    }
    const list = [...entries];
    const existing = list.find((e) => e.city === city && e.court === courtName);
    if (existing) {
      if (existing.circuits.includes(circuit)) {
        setToast("هذه الدائرة مسجّلة مسبقاً");
        return;
      }
      existing.circuits.push(circuit);
    } else {
      list.push({
        id: newCourtId(),
        city,
        court: courtName,
        circuits: [circuit],
      });
    }
    const ok = await saveCourtsCatalog(list);
    if (!ok) {
      setToast("تعذّر الحفظ — تحقق من تسجيل الدخول والخادم");
      return;
    }
    await refresh();
    setCourt("");
    setCircuitInput("");
    setToast("تمت الإضافة");
  }

  async function handleRemove(id: string, circuit?: string) {
    if (!canEdit) return;
    const list = [...entries];
    const idx = list.findIndex((e) => e.id === id);
    if (idx < 0) return;
    if (circuit) {
      list[idx] = {
        ...list[idx],
        circuits: list[idx].circuits.filter((c) => c !== circuit),
      };
      if (list[idx].circuits.length === 0) list.splice(idx, 1);
    } else {
      list.splice(idx, 1);
    }
    const ok = await saveCourtsCatalog(list);
    if (!ok) {
      setToast("تعذّر الحفظ");
      return;
    }
    await refresh();
    setToast("تم الحذف");
  }

  const grouped = CITY_OPTIONS.map((c) => ({
    city: c,
    rows: entries.filter((e) => e.city === c),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      {toast ? (
        <div className="note note-success reg-users-toast" role="status">
          {toast}
        </div>
      ) : null}

      {!canEdit ? (
        <div className="note note-info" style={{ marginBottom: 16 }}>
          عرض فقط — إدارة القائمة للمشرف.
        </div>
      ) : (
        <article className="page-shell" style={{ marginBottom: 0 }}>
          <header className="po-subpage-hd">
            <div className="po-subpage-titles">
              <h2 className="po-subpage-title">إضافة محكمة / دائرة</h2>
            </div>
          </header>
          <div className="reg-fg2 page-gutter" style={{ paddingBottom: 16 }}>
            <RegSelect
              id="court_city"
              label="المدينة"
              options={[...CITY_OPTIONS]}
              value={city}
              onChange={setCity}
            />
            <RegField
              id="court_name"
              label="المحكمة"
              value={court}
              onChange={setCourt}
            />
            <RegField
              id="circuit_name"
              label="الدائرة"
              value={circuitInput}
              onChange={setCircuitInput}
            />
            <div className="reg-sp2" style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void handleAdd()}
              >
                + إضافة
              </button>
            </div>
          </div>
        </article>
      )}

      <article className="page-shell">
        <header className="po-subpage-hd">
          <div className="po-subpage-titles">
            <h2 className="po-subpage-title">قائمة المحاكم والدوائر</h2>
          </div>
        </header>
        {grouped.length === 0 ? (
          <p className="page-gutter" style={{ paddingBottom: 16, color: "var(--text3)", fontSize: 12 }}>
            لا توجد محاكم — يبدأ النظام بقائمة افتراضية عند أول فتح.
          </p>
        ) : (
          grouped.map(({ city: c, rows }) => (
            <div key={c} className="page-gutter" style={{ paddingBlock: 12, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{c}</div>
              {rows.map((row) => (
                <div key={row.id} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{row.court}</span>
                    {canEdit ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger-outline"
                        onClick={() => void handleRemove(row.id)}
                      >
                        حذف المحكمة
                      </button>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {row.circuits.map((circuit) => (
                      <span key={circuit} className="badge b-prog" style={{ fontSize: 11 }}>
                        {circuit}
                        {canEdit ? (
                          <button
                            type="button"
                            style={{
                              marginRight: 6,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: "var(--danger)",
                            }}
                            aria-label={`حذف ${circuit}`}
                            onClick={() => void handleRemove(row.id, circuit)}
                          >
                            ×
                          </button>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </article>
    </>
  );
}
