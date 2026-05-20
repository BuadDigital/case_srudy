export type OrgPerson = {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
  systemRole: string;
};

export type OrgDepartment = {
  code: string;
  title: string;
  description: string;
  isActive: boolean;
  admin: OrgPerson | null;
};

export type OrganizationOverview = {
  cdo: OrgPerson | null;
  departments: OrgDepartment[];
};
