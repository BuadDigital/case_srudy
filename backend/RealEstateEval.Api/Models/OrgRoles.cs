namespace RealEstateEval.Api.Models;

/// <summary>Identity roles for organization setup accounts (CDO + department admins).</summary>
public static class OrgRoles
{
    public const string Cdo = "CDO";
    public const string HrAdmin = "HrAdmin";
    public const string ProcAdmin = "ProcAdmin";
    public const string CrmAdmin = "CrmAdmin";

    public static readonly string[] All = [Cdo, HrAdmin, ProcAdmin, CrmAdmin];

    public static bool IsOrgRole(string? roleName) =>
        roleName is not null && All.Contains(roleName);
}
