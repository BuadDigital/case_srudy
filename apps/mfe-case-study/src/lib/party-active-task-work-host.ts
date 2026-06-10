import type { RefObject } from "react";

/** جسر بين قائمة المهام وشاشة العمل — يُمرَّر كـ ref لتجنب props دوال في حدود Next.js. */
export type PartyActiveTaskWorkHostRef = {
  onRefresh?: () => void;
  onClose?: () => void;
};

export type PartyActiveTaskWorkHostRefObject = RefObject<
  PartyActiveTaskWorkHostRef | null
>;
