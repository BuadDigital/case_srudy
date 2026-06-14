namespace RealEstateEval.Application.Contracts;

public class FailureRecordDto
{
    public string Id { get; set; } = "";
    public string PoNumber { get; set; } = "";
    public string PropertyId { get; set; } = "";
    public string DeedNumber { get; set; } = "";
    public string Title { get; set; } = "";
    public string ProblemTypeId { get; set; } = "";
    public string Severity { get; set; } = "internal";
    public string RaisedByRole { get; set; } = "";
    public string InternalNote { get; set; } = "";
    public string FinalNote { get; set; } = "";
    public string ResolutionReason { get; set; } = "";
    public string ContinueInstructions { get; set; } = "";
    public string Status { get; set; } = "internal";
    public string Specialist { get; set; } = "";
    public string CreatedAt { get; set; } = "";
    public string UpdatedAt { get; set; } = "";
}

public class CreateFailureRequest
{
    public string PoNumber { get; set; } = "";
    public string PropertyId { get; set; } = "";
    public string DeedNumber { get; set; } = "";
    public string ProblemTypeId { get; set; } = "";
    public string Severity { get; set; } = "internal";
    public string? RaisedByRole { get; set; }
    public string? Title { get; set; }
    public string? InternalNote { get; set; }
    public string Specialist { get; set; } = "";
}

public class BourseObstructionRequest
{
    public string PoNumber { get; set; } = "";
    public string PropertyId { get; set; } = "";
    public string DeedNumber { get; set; } = "";
    public string Reason { get; set; } = "";
    public string Specialist { get; set; } = "";
}

public class ResolveFailureRequest
{
    public string ResolutionReason { get; set; } = "";
    public string ContinueInstructions { get; set; } = "";
}

public class FailureNoteRequest
{
    public string Note { get; set; } = "";
}
