namespace RealEstateEval.Domain;

public enum AssignmentType
{
    Execution = 0,
    Estates = 1,
    PrivateSector = 2,
}

public enum PropertyIdentifierType
{
    Deed = 0,
    RealEstateRegistration = 1,
    BourseInquiry = 2,
}

public static class AssignmentTypeLabels
{
    public const string Execution = "تنفيذ";
    public const string Estates = "تركات";
    public const string PrivateSector = "قطاع خاص";

    public static string ToLabel(AssignmentType type) => type switch
    {
        AssignmentType.Execution => Execution,
        AssignmentType.Estates => Estates,
        AssignmentType.PrivateSector => PrivateSector,
        _ => Execution,
    };

    public static bool TryParseLabel(string? label, out AssignmentType type)
    {
        var n = label?.Trim() ?? "";
        if (n == Execution) { type = AssignmentType.Execution; return true; }
        if (n == Estates) { type = AssignmentType.Estates; return true; }
        if (n == PrivateSector) { type = AssignmentType.PrivateSector; return true; }
        type = AssignmentType.Execution;
        return false;
    }
}

public static class PropertyIdentifierTypeLabels
{
    public const string Deed = "deed";
    public const string RealEstateReg = "real_estate_reg";
    public const string BourseInquiry = "bourse_inquiry";

    public static string ToApiValue(PropertyIdentifierType type) => type switch
    {
        PropertyIdentifierType.RealEstateRegistration => RealEstateReg,
        PropertyIdentifierType.BourseInquiry => BourseInquiry,
        _ => Deed,
    };

    public static bool TryParseApiValue(string? value, out PropertyIdentifierType type)
    {
        var n = value?.Trim() ?? "";
        if (n == RealEstateReg)
        {
            type = PropertyIdentifierType.RealEstateRegistration;
            return true;
        }
        if (n == BourseInquiry)
        {
            type = PropertyIdentifierType.BourseInquiry;
            return true;
        }
        type = PropertyIdentifierType.Deed;
        return n == Deed || string.IsNullOrEmpty(n);
    }
}

/// <summary>PO list workflow status returned to the shell (progress | done).</summary>
public static class WorkOrderListStatus
{
    public const string Progress = "progress";
    public const string Done = "done";

    public static string FromWorkOrder(WorkOrder entity)
    {
        var expected = Math.Max(1, entity.ExpectedPropertyCount);
        if (entity.Properties.Count < expected) return Progress;

        var ready = entity.Properties.Count(p =>
            p.BourseDataCompleted ||
            p.IdentifierType == PropertyIdentifierType.RealEstateRegistration);

        return ready >= expected ? Done : Progress;
    }
}
