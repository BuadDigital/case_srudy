namespace RealEstateEval.Api.Models;

public class WorkOrderProperty
{
    public Guid Id { get; set; }
    public Guid WorkOrderId { get; set; }
    public PropertyIdentifierType IdentifierType { get; set; }
    public string DeedNumber { get; set; } = "";
    public string? DeedDate { get; set; }
    public string? OwnerName { get; set; }
    public string? Restrictions { get; set; }
    public string? BoundariesMatch { get; set; }
    public string City { get; set; } = "";
    public string District { get; set; } = "";
    public string? DeedStatus { get; set; }
    public string? Area { get; set; }
    public string? Boundaries { get; set; }
    public string? Court { get; set; }
    public string? Circuit { get; set; }
    public string Classification { get; set; } = "";
    public string PropertyType { get; set; } = "";
    public string? AssignmentDocFileName { get; set; }
    public string? RealEstateRegFileName { get; set; }

    public WorkOrder? WorkOrder { get; set; }
    public ICollection<PropertyContact> Contacts { get; set; } = [];
}
