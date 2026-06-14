"use client";

import { EmptyState, SectionHeader } from "./PropertyDetailFields";

export function PropertyDetailEnfathUpload() {
  return (
    <>
      <SectionHeader>الرفع على إنفاذ</SectionHeader>
      <EmptyState
        icon="⬆"
        title="الرفع على إنفاذ"
        sub="سيُستكمل هذا القسم لاحقاً لمساعدة الأخصائي في رفع بيانات دراسة الحالة إلى منصة إنفاذ."
      />
    </>
  );
}
