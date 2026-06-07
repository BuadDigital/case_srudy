namespace RealEstateEval.Api.Models;

public class WorkflowTask
{
    public Guid Id { get; set; }
    public string Kind { get; set; } = "case-study-property";
    public string PoNumber { get; set; } = "";
    public Guid? PropertyId { get; set; }
    public int PropertyOrdinal { get; set; } = 1;
    public string Title { get; set; } = "";
    public string Phase { get; set; } = "enfath";
    public string AssigneeRole { get; set; } = "case-specialist";
    public string AssigneeName { get; set; } = "أخصائي دراسة الحالة";
    public string? AssigneeId { get; set; }
    public Guid? ParentTaskId { get; set; }
    public string Status { get; set; } = "open";
    /// <summary>JSON — TaskDistributionDraft from the shell.</summary>
    public string? DistributionJson { get; set; }
    public string? ObstructionReason { get; set; }
    public string? ObstructionPriorPhase { get; set; }
    public string? AssignmentType { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
