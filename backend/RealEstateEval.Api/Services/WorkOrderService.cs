using Microsoft.EntityFrameworkCore;
using RealEstateEval.Api.Contracts;
using RealEstateEval.Api.Data;
using RealEstateEval.Api.Models;

namespace RealEstateEval.Api.Services;

public class WorkOrderService : IWorkOrderService
{
    private readonly ApplicationDbContext _db;

    public WorkOrderService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<WorkOrderListItemDto>> ListAsync(CancellationToken cancellationToken)
    {
        var list = await _db.WorkOrders
            .AsNoTracking()
            .Include(w => w.Properties)
            .OrderByDescending(w => w.CreatedAtUtc)
            .ToListAsync(cancellationToken);
        return list.Select(WorkOrderMapper.ToListItem).ToList();
    }

    public async Task<WorkOrderDto?> GetByPoNumberAsync(
        string poNumber,
        CancellationToken cancellationToken)
    {
        var entity = await LoadWorkOrderTrackedAsync(poNumber, cancellationToken, asNoTracking: true);
        return entity is null ? null : WorkOrderMapper.ToDto(entity);
    }

    public Task<bool> ExistsAsync(string poNumber, CancellationToken cancellationToken) =>
        _db.WorkOrders.AnyAsync(
            w => w.PoNumber == NormalizePo(poNumber),
            cancellationToken);

    public async Task<PriorDeedRegistrationDto?> FindPriorDeedAsync(
        string deedNumber,
        string? excludePoNumber,
        CancellationToken cancellationToken)
    {
        var n = deedNumber.Trim();
        if (n.Length == 0) return null;

        var exclude = string.IsNullOrWhiteSpace(excludePoNumber)
            ? null
            : NormalizePo(excludePoNumber);

        var hit = await _db.WorkOrderProperties
            .AsNoTracking()
            .Include(p => p.WorkOrder)
            .Where(p =>
                p.IdentifierType == PropertyIdentifierType.Deed &&
                p.DeedNumber == n &&
                (exclude == null || p.WorkOrder!.PoNumber != exclude))
            .Select(p => p.WorkOrder!.PoNumber)
            .FirstOrDefaultAsync(cancellationToken);

        return hit is null ? null : new PriorDeedRegistrationDto { PoNumber = hit };
    }

    public async Task<(WorkOrderDto? Result, Dictionary<string, string>? Errors)> CreateAsync(
        CreateWorkOrderRequest request,
        string? userId,
        CancellationToken cancellationToken)
    {
        var headerErrors = WorkOrderValidator.ValidateHeader(request);
        if (headerErrors.Count > 0) return (null, headerErrors);

        var po = NormalizePo(request.PoNumber);
        if (await ExistsAsync(po, cancellationToken))
            return (null, new Dictionary<string, string> { ["poNumber"] = "رقم PO مسجّل مسبقاً" });

        if (!AssignmentTypeLabels.TryParseLabel(request.AssignmentType, out var assignmentType))
            return (null, new Dictionary<string, string> { ["assignmentType"] = "نوع الإسناد غير صالح" });

        var received = DateOnly.Parse(request.ReceivedFromEnfathAt);
        var internalAt = DateOnly.Parse(request.InternalAssignmentAt);

        var seenDeeds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in request.Properties)
        {
            var deed = prop.DeedNumber.Trim();
            if (!seenDeeds.Add(deed))
            {
                return (null, new Dictionary<string, string>
                {
                    ["deedNumber"] = "رقم الصك مسجّل مسبقاً في هذا أمر العمل",
                });
            }

            var propErrors = WorkOrderValidator.ValidateProperty(
                prop,
                assignmentType,
                po,
                null,
                (_, _) => false);
            if (propErrors.Count > 0) return (null, propErrors);
        }

        var workOrder = new WorkOrder
        {
            Id = Guid.NewGuid(),
            PoNumber = po,
            AssignmentType = assignmentType,
            ReceivedFromEnfathAt = received,
            ReceivedFromEnfathTime = request.ReceivedFromEnfathTime?.Trim(),
            InternalAssignmentAt = internalAt,
            AssignmentSpecialist = request.AssignmentSpecialist.Trim(),
            DueDateAt = BusinessDueDateCalculator.Compute(received, request.ReceivedFromEnfathTime),
            CreatedAtUtc = DateTime.UtcNow,
            RegisteredByUserId = userId,
        };

        foreach (var propDto in request.Properties)
            workOrder.Properties.Add(MapProperty(propDto, workOrder.Id));

        _db.WorkOrders.Add(workOrder);
        await _db.SaveChangesAsync(cancellationToken);

        var loaded = await LoadWorkOrderTrackedAsync(po, cancellationToken, asNoTracking: true);
        return (loaded is null ? null : WorkOrderMapper.ToDto(loaded), null);
    }

    public async Task<(WorkOrderDto? Result, Dictionary<string, string>? Errors)> UpdateHeaderAsync(
        string poNumber,
        UpdateWorkOrderHeaderRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await LoadWorkOrderTrackedAsync(poNumber, cancellationToken);
        if (entity is null) return (null, new Dictionary<string, string> { ["_"] = "أمر العمل غير موجود" });

        if (!AssignmentTypeLabels.TryParseLabel(request.AssignmentType, out var assignmentType))
            return (null, new Dictionary<string, string> { ["assignmentType"] = "نوع الإسناد غير صالح" });

        if (WorkOrderValidator.RequiresAssignmentDecree(assignmentType))
        {
            var missingDecree = entity.Properties.Any(p =>
                string.IsNullOrWhiteSpace(p.AssignmentDocFileName));
            if (missingDecree)
                return (null, new Dictionary<string, string>
                {
                    ["assignmentType"] = "مسار التنفيذ يتطلب قرار إسناد لكل عقار",
                });
        }

        if (!DateOnly.TryParse(request.ReceivedFromEnfathAt, out var received))
            return (null, new Dictionary<string, string> { ["receivedFromEnfathAt"] = "تاريخ غير صالح" });
        if (!DateOnly.TryParse(request.InternalAssignmentAt, out var internalAt))
            return (null, new Dictionary<string, string> { ["internalAssignmentAt"] = "تاريخ غير صالح" });

        entity.AssignmentType = assignmentType;
        entity.ReceivedFromEnfathAt = received;
        entity.ReceivedFromEnfathTime = request.ReceivedFromEnfathTime?.Trim();
        entity.InternalAssignmentAt = internalAt;
        entity.AssignmentSpecialist = request.AssignmentSpecialist.Trim();
        entity.DueDateAt = BusinessDueDateCalculator.Compute(received, request.ReceivedFromEnfathTime);

        await _db.SaveChangesAsync(cancellationToken);
        return (WorkOrderMapper.ToDto(entity), null);
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(
        string poNumber,
        CancellationToken cancellationToken)
    {
        var entity = await LoadWorkOrderTrackedAsync(poNumber, cancellationToken);
        if (entity is null) return (false, "أمر العمل غير موجود");
        _db.WorkOrders.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return (true, null);
    }

    public async Task<(WorkOrderPropertyDto? Result, Dictionary<string, string>? Errors)> AddPropertyAsync(
        string poNumber,
        WorkOrderPropertyDto property,
        CancellationToken cancellationToken)
    {
        var entity = await LoadWorkOrderTrackedAsync(poNumber, cancellationToken);
        if (entity is null) return (null, new Dictionary<string, string> { ["_"] = "أمر العمل غير موجود" });

        var errors = WorkOrderValidator.ValidateProperty(
            property,
            entity.AssignmentType,
            entity.PoNumber,
            null,
            (deed, _) => entity.Properties.Any(p => p.DeedNumber.Trim() == deed.Trim()));
        if (errors.Count > 0) return (null, errors);

        var mapped = MapProperty(property, entity.Id);
        entity.Properties.Add(mapped);
        await _db.SaveChangesAsync(cancellationToken);
        return (WorkOrderMapper.ToPropertyDto(mapped), null);
    }

    public async Task<(WorkOrderPropertyDto? Result, Dictionary<string, string>? Errors)> UpdatePropertyAsync(
        string poNumber,
        Guid propertyId,
        WorkOrderPropertyDto property,
        CancellationToken cancellationToken)
    {
        var entity = await LoadWorkOrderTrackedAsync(poNumber, cancellationToken);
        if (entity is null) return (null, new Dictionary<string, string> { ["_"] = "أمر العمل غير موجود" });

        var existing = entity.Properties.FirstOrDefault(p => p.Id == propertyId);
        if (existing is null) return (null, new Dictionary<string, string> { ["_"] = "العقار غير موجود" });

        var errors = WorkOrderValidator.ValidateProperty(
            property,
            entity.AssignmentType,
            entity.PoNumber,
            propertyId,
            (deed, excludeId) =>
                entity.Properties.Any(p =>
                    p.DeedNumber.Trim() == deed.Trim() && p.Id != excludeId));
        if (errors.Count > 0) return (null, errors);

        ApplyProperty(existing, property);
        await _db.SaveChangesAsync(cancellationToken);
        return (WorkOrderMapper.ToPropertyDto(existing), null);
    }

    public async Task<(bool Ok, string? Error)> DeletePropertyAsync(
        string poNumber,
        Guid propertyId,
        CancellationToken cancellationToken)
    {
        var entity = await LoadWorkOrderTrackedAsync(poNumber, cancellationToken);
        if (entity is null) return (false, "أمر العمل غير موجود");
        if (entity.Properties.Count <= 1)
            return (false, "يجب الإبقاء على عقار واحد على الأقل");

        var prop = entity.Properties.FirstOrDefault(p => p.Id == propertyId);
        if (prop is null) return (false, "العقار غير موجود");

        _db.WorkOrderProperties.Remove(prop);
        await _db.SaveChangesAsync(cancellationToken);
        return (true, null);
    }

    private async Task<WorkOrder?> LoadWorkOrderTrackedAsync(
        string poNumber,
        CancellationToken cancellationToken,
        bool asNoTracking = false)
    {
        var po = NormalizePo(poNumber);
        IQueryable<WorkOrder> q = _db.WorkOrders
            .Include(w => w.Properties)
            .ThenInclude(p => p.Contacts);

        if (asNoTracking) q = q.AsNoTracking();

        return await q.FirstOrDefaultAsync(w => w.PoNumber == po, cancellationToken);
    }

    private static string NormalizePo(string poNumber) => poNumber.Trim();

    private static WorkOrderProperty MapProperty(WorkOrderPropertyDto dto, Guid workOrderId)
    {
        PropertyIdentifierTypeLabels.TryParseApiValue(dto.IdentifierType, out var idType);
        var entity = new WorkOrderProperty
        {
            Id = dto.Id ?? Guid.NewGuid(),
            WorkOrderId = workOrderId,
        };
        ApplyProperty(entity, dto);
        entity.IdentifierType = idType;
        return entity;
    }

    private static void ApplyProperty(WorkOrderProperty entity, WorkOrderPropertyDto dto)
    {
        PropertyIdentifierTypeLabels.TryParseApiValue(dto.IdentifierType, out var idType);
        entity.IdentifierType = idType;
        entity.DeedNumber = dto.DeedNumber.Trim();
        entity.DeedDate = dto.DeedDate?.Trim();
        entity.OwnerName = dto.OwnerName?.Trim();
        entity.Restrictions = dto.Restrictions?.Trim();
        entity.BoundariesMatch = dto.BoundariesMatch?.Trim();
        entity.City = dto.City.Trim();
        entity.District = dto.District.Trim();
        entity.DeedStatus = dto.DeedStatus?.Trim();
        entity.Area = dto.Area?.Trim();
        entity.Boundaries = dto.Boundaries?.Trim();
        entity.Court = dto.Court?.Trim();
        entity.Circuit = dto.Circuit?.Trim();
        entity.Classification = dto.Classification.Trim();
        entity.PropertyType = dto.PropertyType.Trim();
        entity.AssignmentDocFileName = dto.AssignmentDocFileName?.Trim();
        entity.RealEstateRegFileName = dto.RealEstateRegFileName?.Trim();

        entity.Contacts.Clear();
        var order = 0;
        foreach (var c in dto.Contacts.Where(c =>
                     !string.IsNullOrWhiteSpace(c.Name) || !string.IsNullOrWhiteSpace(c.Phone)))
        {
            entity.Contacts.Add(new PropertyContact
            {
                Id = Guid.NewGuid(),
                PropertyId = entity.Id,
                Name = c.Name.Trim(),
                Phone = c.Phone.Trim(),
                SortOrder = order++,
            });
        }
    }
}
