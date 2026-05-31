import type { RegistrationSource } from "@/lib/prototype/registration-data";

export type RegistrationFormData = Record<string, string>;

function crmTypeLabel(d: RegistrationFormData): string {
  if (d.clientStatus === "lead") return "عميل محتمل";
  const sub = d.clientType === "contract" ? "بعقد" : "مباشر";
  return `عميل فعلي — ${sub}`;
}

export function registrationSuccessLabel(
  source: RegistrationSource,
  data: RegistrationFormData,
): string {
  if (source === "hr") {
    return `موظف داخلي — ${data.hr_empType || "—"}`;
  }
  if (source === "proc") {
    return data.subtype === "org"
      ? "مقدم خدمة — جهة / مؤسسة"
      : "مقدم خدمة — فرد مستقل";
  }
  return crmTypeLabel(data);
}
