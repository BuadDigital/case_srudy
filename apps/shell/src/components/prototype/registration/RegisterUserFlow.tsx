"use client";

import type { StaffUser } from "@/lib/prototype/constants";
import type { RegistrationSource } from "@/lib/prototype/registration-data";
import { CrmRegistrationFlow } from "./CrmRegistrationFlow";
import { HrRegistrationFlow } from "./HrRegistrationFlow";
import { ProcRegistrationFlow } from "./ProcRegistrationFlow";

export function RegisterUserFlow({
  source,
  existingEmails,
  onComplete,
  onBack,
  onAddAnother,
}: {
  source: RegistrationSource;
  existingEmails: Set<string>;
  onComplete: (user: StaffUser) => void;
  onBack: () => void;
  onAddAnother: () => void;
}) {
  const props = { existingEmails, onComplete, onBack, onAddAnother };

  if (source === "hr") return <HrRegistrationFlow {...props} />;
  if (source === "proc") return <ProcRegistrationFlow {...props} />;
  return <CrmRegistrationFlow {...props} />;
}

