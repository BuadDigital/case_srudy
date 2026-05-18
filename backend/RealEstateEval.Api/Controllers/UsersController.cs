using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateEval.Api.Contracts;
using RealEstateEval.Api.Services;

namespace RealEstateEval.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "CanManageUsers")]
public class UsersController : ControllerBase
{
    private readonly IUserRegistrationService _users;

    public UsersController(IUserRegistrationService users)
    {
        _users = users;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserListItemDto>>> List(
        CancellationToken cancellationToken)
    {
        var list = await _users.ListAsync(cancellationToken);
        return Ok(list);
    }

    [HttpPost("hr")]
    public async Task<ActionResult<CreateUserResponseDto>> CreateHr(
        [FromBody] RegistrationPayloadDto data,
        CancellationToken cancellationToken)
    {
        return await Create(data, _users.CreateHrAsync, cancellationToken);
    }

    [HttpPost("proc")]
    public async Task<ActionResult<CreateUserResponseDto>> CreateProc(
        [FromBody] RegistrationPayloadDto data,
        CancellationToken cancellationToken)
    {
        return await Create(data, _users.CreateProcAsync, cancellationToken);
    }

    [HttpPost("crm")]
    public async Task<ActionResult<CreateUserResponseDto>> CreateCrm(
        [FromBody] RegistrationPayloadDto data,
        CancellationToken cancellationToken)
    {
        return await Create(data, _users.CreateCrmAsync, cancellationToken);
    }

    private static async Task<ActionResult<CreateUserResponseDto>> Create(
        RegistrationPayloadDto data,
        Func<RegistrationPayloadDto, CancellationToken, Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)>> create,
        CancellationToken cancellationToken)
    {
        var (result, errors) = await create(data, cancellationToken);
        if (errors is { Count: > 0 })
            return new BadRequestObjectResult(new FieldErrorsResponseDto { Errors = errors });

        return new CreatedAtActionResult(
            nameof(List),
            "Users",
            null,
            result);
    }
}
