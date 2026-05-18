"use client";

import type { CreateUserResult } from "@platform/api-client";
import type { RegistrationPayload } from "@platform/types";
import type { StaffUser } from "@/lib/prototype/constants";
import type { RegistrationSource } from "@/lib/prototype/registration-data";
import { CrmRegistrationFlow } from "./CrmRegistrationFlow";
import { HrRegistrationFlow } from "./HrRegistrationFlow";
import { ProcRegistrationFlow } from "./ProcRegistrationFlow";

export type SubmitRegistrationFn = (
  source: RegistrationSource,
  data: RegistrationPayload,
) => Promise<CreateUserResult>;

export function RegisterUserFlow({
  source,
  existingEmails,
  submitRegistration,
  onComplete,
  onBack,
  onAddAnother,
}: {
  source: RegistrationSource;
  existingEmails: Set<string>;
  submitRegistration: SubmitRegistrationFn;
  onComplete: (user: StaffUser) => void;
  onBack: () => void;
  onAddAnother: () => void;
}) {
  const props = {
    existingEmails,
    submitRegistration,
    onComplete,
    onBack,
    onAddAnother,
  };

  if (source === "hr") return <HrRegistrationFlow {...props} />;
  if (source === "proc") return <ProcRegistrationFlow {...props} />;
  return <CrmRegistrationFlow {...props} />;
}
