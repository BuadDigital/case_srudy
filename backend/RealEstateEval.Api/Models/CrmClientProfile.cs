namespace RealEstateEval.Api.Models;

public class CrmClientProfile
{
    public string UserId { get; set; } = string.Empty;
    public UserProfile Profile { get; set; } = null!;

    public CrmEntityKind EntityKind { get; set; }
    public CrmClientStatus ClientStatus { get; set; }
    public CrmClientType ClientType { get; set; }
    public string? FullName { get; set; }
    public string? OrganizationName { get; set; }
    public string? CommercialRegistration { get; set; }
    public string? NationalId { get; set; }
    public string? Region { get; set; }
    public string? Sector { get; set; }
    public string? Address { get; set; }
    public string? AccountRepresentative { get; set; }
    public string? VatRegistration { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactRole { get; set; }
    public string? ContactPhone { get; set; }
}
