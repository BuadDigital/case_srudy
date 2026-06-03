using RealEstateEval.Api.Contracts;
using RealEstateEval.Api.Models;

namespace RealEstateEval.Api.Services;

public interface IUserRegistrationService
{
    Task<IReadOnlyList<UserListItemDto>> ListAsync(
        RegistrationSource? sourceScope = null,
        CancellationToken cancellationToken = default);
    Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateHrAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default);
    Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateProcAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default);
    Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateCrmAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default);

    /// <summary>Deletes all users created via registration (have a profile). Keeps seeded admin.</summary>
    Task<int> DeleteAllRegisteredAsync(CancellationToken cancellationToken = default);

    Task<OrganizationOverviewDto> GetOrganizationOverviewAsync(
        CancellationToken cancellationToken = default);
}
