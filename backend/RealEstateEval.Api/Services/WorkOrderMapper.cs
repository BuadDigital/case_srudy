using System.Text.Json;
using RealEstateEval.Api.Contracts;
using RealEstateEval.Api.Models;

namespace RealEstateEval.Api.Services;

internal static class WorkOrderMapper
{
    public static WorkOrderDto ToDto(WorkOrder entity)
    {
        return new WorkOrderDto
        {
            Id = entity.Id,
            PoNumber = entity.PoNumber,
            AssignmentType = AssignmentTypeLabels.ToLabel(entity.AssignmentType),
            ReceivedFromEnfathAt = entity.ReceivedFromEnfathAt.ToString("yyyy-MM-dd"),
            ReceivedFromEnfathTime = entity.ReceivedFromEnfathTime,
            InternalAssignmentAt = entity.InternalAssignmentAt.ToString("yyyy-MM-dd"),
            AssignmentSpecialist = entity.AssignmentSpecialist,
            DueDateAt = entity.DueDateAt.ToString("yyyy-MM-dd"),
            CreatedAtUtc = entity.CreatedAtUtc.ToString("o"),
            Properties = entity.Properties
                .OrderBy(p => p.DeedNumber)
                .Select(ToPropertyDto)
                .ToList(),
        };
    }

    public static WorkOrderPropertyDto ToPropertyDto(WorkOrderProperty p)
    {
        return new WorkOrderPropertyDto
        {
            Id = p.Id,
            IdentifierType = PropertyIdentifierTypeLabels.ToApiValue(p.IdentifierType),
            DeedNumber = p.DeedNumber,
            DeedDate = p.DeedDate,
            OwnerName = p.OwnerName,
            Restrictions = p.Restrictions,
            BoundariesMatch = p.BoundariesMatch,
            City = p.City,
            District = p.District,
            DeedStatus = p.DeedStatus,
            Area = p.Area,
            Boundaries = p.Boundaries,
            Court = p.Court,
            Circuit = p.Circuit,
            Classification = p.Classification,
            PropertyType = p.PropertyType,
            AssignmentDocFileName = p.AssignmentDocFileName,
            RealEstateRegFileName = p.RealEstateRegFileName,
            Contacts = p.Contacts
                .OrderBy(c => c.SortOrder)
                .Select(c => new PropertyContactDto { Name = c.Name, Phone = c.Phone })
                .ToList(),
        };
    }

    public static WorkOrderListItemDto ToListItem(WorkOrder entity)
    {
        return new WorkOrderListItemDto
        {
            PoNumber = entity.PoNumber,
            AssignmentType = AssignmentTypeLabels.ToLabel(entity.AssignmentType),
            PropertyCount = entity.Properties.Count,
            CompletedCount = 0,
            Status = "progress",
            ReceivedFromEnfathAt = entity.ReceivedFromEnfathAt.ToString("yyyy-MM-dd"),
            DueDateAt = entity.DueDateAt.ToString("yyyy-MM-dd"),
            AssignmentSpecialist = entity.AssignmentSpecialist,
        };
    }

    public static CourtCatalogEntryDto ToCourtDto(CourtCatalogEntry e)
    {
        var circuits = JsonSerializer.Deserialize<List<string>>(e.CircuitsJson) ?? [];
        return new CourtCatalogEntryDto
        {
            Id = e.Id,
            City = e.City,
            Court = e.Court,
            Circuits = circuits,
        };
    }
}
