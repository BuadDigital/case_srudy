namespace RealEstateEval.Api.Models;

public class UserProfile
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public RegistrationSource RegistrationSource { get; set; }
    public ContractType ContractType { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? PermissionLevel { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public DateTime CreatedAtUtc { get; set; }

    public HrEmployeeProfile? HrEmployee { get; set; }
    public ProcServiceProviderProfile? ProcProvider { get; set; }
    public CrmClientProfile? CrmClient { get; set; }
}
