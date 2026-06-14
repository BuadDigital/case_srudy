namespace RealEstateEval.Application.Contracts;

public class SystemResetResultDto
{
    public int WorkOrdersDeleted { get; set; }
    public int WorkflowTasksDeleted { get; set; }
    public int CaseStudyFormsDeleted { get; set; }
    public int CourtCatalogEntriesDeleted { get; set; }
    public int CaseStudyInfoRolesConfigsDeleted { get; set; }
    public int PropertyFailuresDeleted { get; set; }
    public int RegisteredUsersDeleted { get; set; }
}
