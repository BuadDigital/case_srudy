using RealEstateEval.Application.Contracts;

namespace RealEstateEval.Application.Abstractions;

public interface ISystemMaintenanceService
{
    Task<SystemResetResultDto> ResetAllOperationalDataAsync(
        CancellationToken cancellationToken = default);
}
