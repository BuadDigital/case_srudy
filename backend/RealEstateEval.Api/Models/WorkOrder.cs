namespace RealEstateEval.Api.Models;

public class WorkOrder
{
    public Guid Id { get; set; }
    public string PoNumber { get; set; } = "";
    public AssignmentType AssignmentType { get; set; }
    /// <summary>تاريخ التعميد من إنفاذ.</summary>
    public DateOnly PromulgationDate { get; set; }
    public DateOnly ReceivedFromEnfathAt { get; set; }
    public string? ReceivedFromEnfathTime { get; set; }
    public DateOnly? InternalAssignmentAt { get; set; }
    public string AssignmentSpecialist { get; set; } = "";
    public string AssignmentSpecialistEmail { get; set; } = "";
    /// <summary>عدد العقارات الوارد من إنفاذ عند التعميد.</summary>
    public int ExpectedPropertyCount { get; set; } = 1;
    public DateOnly DueDateAt { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public string? RegisteredByUserId { get; set; }

    public ApplicationUser? RegisteredBy { get; set; }
    public ICollection<WorkOrderProperty> Properties { get; set; } = [];
}
