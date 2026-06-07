import { decodePoParam, PO_PROPERTY_SEGMENT } from "@/lib/po-routes";

export type PoChrome = {
  breadcrumb: string;
  title: string;
  /** When set, top bar renders `title` + isolated LTR PO number (RTL-safe). */
  titlePo?: string;
};

export function resolvePoChrome(pathname: string): PoChrome | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "po") return null;

  if (parts.length === 1) {
    return {
      breadcrumb: "دراسة الحالة / أوامر العمل",
      title: "",
    };
  }

  const poNumber = decodePoParam(parts[1]);

  if (parts[2] === "edit") {
    return {
      breadcrumb: `دراسة الحالة / أوامر العمل / ${poNumber} / تعديل`,
      title: "تعديل أمر العمل —",
      titlePo: poNumber,
    };
  }

  if (parts[2] !== PO_PROPERTY_SEGMENT) {
    return {
      breadcrumb: "دراسة الحالة / أوامر العمل",
      title: "أوامر العمل",
    };
  }

  if (parts.length === 3) {
    return {
      breadcrumb: `دراسة الحالة / أوامر العمل / ${poNumber} / العقارات`,
      title: "عقارات",
      titlePo: poNumber,
    };
  }

  if (parts[3] === "new") {
    return {
      breadcrumb: `دراسة الحالة / أوامر العمل / ${poNumber} / إضافة عقار`,
      title: "إضافة عقار —",
      titlePo: poNumber,
    };
  }

  if (parts[4] === "edit") {
    return {
      breadcrumb: `دراسة الحالة / أوامر العمل / ${poNumber} / تعديل عقار`,
      title: "تعديل العقار",
    };
  }

  if (parts[4] === "failure") {
    return {
      breadcrumb: `دراسة الحالة / أوامر العمل / ${poNumber} / تعذر`,
      title: "تسجيل تعذر",
    };
  }

  if (parts.length === 4) {
    return {
      breadcrumb: `دراسة الحالة / أوامر العمل / ${poNumber} / تفاصيل العقار`,
      title: "تفاصيل الصك / العقار",
    };
  }

  return {
    breadcrumb: "دراسة الحالة / أوامر العمل",
    title: "أوامر العمل",
  };
}
