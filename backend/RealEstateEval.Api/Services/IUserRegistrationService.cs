using RealEstateEval.Api.Contracts;

namespace RealEstateEval.Api.Services;

public interface IUserRegistrationService
{
    Task<IReadOnlyList<UserListItemDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateHrAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default);
    Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateProcAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default);
    Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateCrmAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default);
}
