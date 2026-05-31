export const prototypeKeys = {
  all: ["prototype"] as const,
  poListRows: () => [...prototypeKeys.all, "po-list-rows"] as const,
  poRecords: () => [...prototypeKeys.all, "po-records"] as const,
  propertyListItems: () => [...prototypeKeys.all, "property-list-items"] as const,
  poRecord: (poNumber: string) =>
    [...prototypeKeys.all, "po-record", poNumber] as const,
  workflowTasks: () => [...prototypeKeys.all, "workflow-tasks"] as const,
  staffUsers: () => [...prototypeKeys.all, "staff-users"] as const,
  organization: () => [...prototypeKeys.all, "organization"] as const,
};
