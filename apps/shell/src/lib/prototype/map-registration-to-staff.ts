import type { StaffUser } from "@/lib/prototype/constants";
import type { RegistrationSource } from "@/lib/prototype/registration-data";

export type RegistrationFormData = Record<string, string>;

function crmTypeLabel(d: RegistrationFormData): string {
  if (d.clientStatus === "lead") return "عميل محتمل";
  const sub = d.clientType === "contract" ? "بعقد" : "مباشر";
  return `عميل فعلي — ${sub}`;
}

export function mapRegistrationToStaff(
  source: RegistrationSource,
  data: RegistrationFormData,
): StaffUser {
  const registration = { ...data, source };

  if (source === "hr") {
    const isFreelance = data.hr_empType === "متعاون";
    return {
      name: data.hr_name ?? "",
      role: data.hr_jobTitle || data.hr_perms || "موظف",
      email: (data.hr_email ?? "").toLowerCase(),
      password: data.hr_pwd,
      type: isFreelance ? "freelance" : "internal",
      source: "hr",
      registration,
    };
  }

  if (source === "proc") {
    const isOrg = data.subtype === "org";
    return {
      name: isOrg
        ? data.pc_delegate || data.pc_orgname || ""
        : data.pc_name || "",
      role: isOrg
        ? "مقدم خدمة — جهة"
        : data.pc_service || "مقدم خدمة — فرد",
      email: (data.pc_email ?? "").toLowerCase(),
      password: data.pc_pwd,
      type: isOrg ? "external" : "freelance",
      source: "proc",
      registration,
    };
  }

  return {
    name: data.crm_name || data.crm_orgname || "",
    role: crmTypeLabel(data),
    email: (data.crm_email ?? "").toLowerCase(),
    password: data.crm_pwd,
    type: "external",
    source: "crm",
    registration,
  };
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
