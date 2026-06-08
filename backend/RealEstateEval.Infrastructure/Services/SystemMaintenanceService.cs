using Microsoft.EntityFrameworkCore;
using RealEstateEval.Application.Abstractions;
using RealEstateEval.Application.Contracts;
using RealEstateEval.Infrastructure.Data;

namespace RealEstateEval.Infrastructure.Services;

public class SystemMaintenanceService : ISystemMaintenanceService
{
    private readonly ApplicationDbContext _db;
    private readonly IUserRegistrationService _users;

    public SystemMaintenanceService(
        ApplicationDbContext db,
        IUserRegistrationService users)
    {
        _db = db;
        _users = users;
    }

    public async Task<SystemResetResultDto> ResetAllOperationalDataAsync(
        CancellationToken cancellationToken = default)
    {
        var caseStudyForms = await _db.CaseStudyForms.CountAsync(cancellationToken);
        var workflowTasks = await _db.WorkflowTasks.CountAsync(cancellationToken);
        var workOrders = await _db.WorkOrders.CountAsync(cancellationToken);
        var courts = await _db.CourtCatalogEntries.CountAsync(cancellationToken);

        await _db.CaseStudyForms.ExecuteDeleteAsync(cancellationToken);
        await _db.WorkflowTasks.ExecuteDeleteAsync(cancellationToken);
        await _db.PropertyContacts.ExecuteDeleteAsync(cancellationToken);
        await _db.WorkOrderProperties.ExecuteDeleteAsync(cancellationToken);
        await _db.WorkOrders.ExecuteDeleteAsync(cancellationToken);
        await _db.CourtCatalogEntries.ExecuteDeleteAsync(cancellationToken);

        var registeredUsersDeleted = await _users.DeleteAllRegisteredAsync(cancellationToken);

        return new SystemResetResultDto
        {
            WorkOrdersDeleted = workOrders,
            WorkflowTasksDeleted = workflowTasks,
            CaseStudyFormsDeleted = caseStudyForms,
            CourtCatalogEntriesDeleted = courts,
            RegisteredUsersDeleted = registeredUsersDeleted,
        };
    }
}
