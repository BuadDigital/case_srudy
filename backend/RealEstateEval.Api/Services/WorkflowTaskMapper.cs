using System.Text.Json;
using RealEstateEval.Api.Contracts;
using RealEstateEval.Api.Models;

namespace RealEstateEval.Api.Services;

public static class WorkflowTaskMapper
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static WorkflowTaskDto ToDto(WorkflowTask entity)
    {
        return new WorkflowTaskDto
        {
            Id = entity.Id.ToString(),
            Kind = entity.Kind,
            PoNumber = entity.PoNumber,
            PropertyId = entity.PropertyId?.ToString(),
            PropertyOrdinal = entity.PropertyOrdinal,
            Title = entity.Title,
            Phase = entity.Phase,
            AssigneeRole = entity.AssigneeRole,
            AssigneeName = entity.AssigneeName,
            AssigneeId = entity.AssigneeId,
            ParentTaskId = entity.ParentTaskId?.ToString(),
            Status = entity.Status,
            Distribution = DeserializeDistribution(entity.DistributionJson),
            ObstructionReason = entity.ObstructionReason,
            ObstructionPriorPhase = entity.ObstructionPriorPhase,
            AssignmentType = entity.AssignmentType,
            CreatedAt = entity.CreatedAtUtc.ToString("O"),
            UpdatedAt = entity.UpdatedAtUtc.ToString("O"),
        };
    }

    public static TaskDistributionDraftDto DefaultDistribution() => new();

    public static TaskDistributionDraftDto? DeserializeDistribution(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<TaskDistributionDraftDto>(json, JsonOpts);
        }
        catch
        {
            return null;
        }
    }

    public static string SerializeDistribution(TaskDistributionDraftDto? dto)
    {
        return JsonSerializer.Serialize(dto ?? DefaultDistribution(), JsonOpts);
    }
}
