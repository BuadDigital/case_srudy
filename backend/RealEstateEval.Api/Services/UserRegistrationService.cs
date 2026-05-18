using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RealEstateEval.Api.Contracts;
using RealEstateEval.Api.Data;
using RealEstateEval.Api.Models;

namespace RealEstateEval.Api.Services;

public class UserRegistrationService : IUserRegistrationService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserRegistrationService(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<UserListItemDto>> ListAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await _db.UserProfiles
            .AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.HrEmployee)
            .Include(p => p.ProcProvider)
            .Include(p => p.CrmClient)
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var userIds = rows.Select(p => p.UserId).ToList();
        var roleRows = await (
            from ur in _db.UserRoles.AsNoTracking()
            join r in _db.Roles.AsNoTracking() on ur.RoleId equals r.Id
            where userIds.Contains(ur.UserId)
            select new { ur.UserId, RoleName = r.Name }
        ).ToListAsync(cancellationToken);

        var rolesByUser = roleRows
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)g.Select(x => x.RoleName).ToList());

        return rows
            .Select(p => RegistrationMapper.ToListItem(
                p.User,
                p,
                rolesByUser.GetValueOrDefault(p.UserId, [])))
            .ToList();
    }

    public Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateHrAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default)
    {
        var (user, profile, hr) = RegistrationMapper.MapHr(data);
        profile.HrEmployee = hr;
        return CreateCoreAsync(
            data,
            RegistrationValidator.ValidateHr,
            user,
            profile,
            "hr_email",
            Get(data, "hr_pwd"),
            RegistrationMapper.MapPermissionToRole(Get(data, "hr_perms")),
            cancellationToken);
    }

    public Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateProcAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default)
    {
        var (user, profile, proc) = RegistrationMapper.MapProc(data);
        profile.ProcProvider = proc;
        return CreateCoreAsync(
            data,
            RegistrationValidator.ValidateProc,
            user,
            profile,
            "pc_email",
            Get(data, "pc_pwd"),
            null,
            cancellationToken);
    }

    public Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateCrmAsync(
        RegistrationPayloadDto data,
        CancellationToken cancellationToken = default)
    {
        var (user, profile, crm) = RegistrationMapper.MapCrm(data);
        profile.CrmClient = crm;
        return CreateCoreAsync(
            data,
            RegistrationValidator.ValidateCrm,
            user,
            profile,
            "crm_email",
            Get(data, "crm_pwd"),
            null,
            cancellationToken);
    }

    private async Task<(CreateUserResponseDto? Result, Dictionary<string, string>? Errors)> CreateCoreAsync(
        RegistrationPayloadDto data,
        Func<RegistrationPayloadDto, Dictionary<string, string>> validate,
        ApplicationUser user,
        UserProfile profile,
        string emailFieldKey,
        string password,
        string? roleName,
        CancellationToken cancellationToken)
    {
        var errors = validate(data);
        if (errors.Count > 0)
            return (null, errors);

        var email = (user.Email ?? "").Trim().ToLowerInvariant();
        if (await _userManager.FindByEmailAsync(email) is not null)
        {
            return (null, new Dictionary<string, string>
            {
                [emailFieldKey] = "هذا البريد مستخدم مسبقاً",
            });
        }

        await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

        var createResult = await _userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            await tx.RollbackAsync(cancellationToken);
            return (null, createResult.Errors.ToDictionary(
                _ => "hr_pwd",
                e => e.Description));
        }

        profile.UserId = user.Id;
        if (profile.HrEmployee is not null)
            profile.HrEmployee.UserId = user.Id;
        if (profile.ProcProvider is not null)
            profile.ProcProvider.UserId = user.Id;
        if (profile.CrmClient is not null)
            profile.CrmClient.UserId = user.Id;

        if (!string.IsNullOrEmpty(roleName))
            await _userManager.AddToRoleAsync(user, roleName);

        _db.UserProfiles.Add(profile);
        await _db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        IReadOnlyList<string> createdRoles = string.IsNullOrEmpty(roleName)
            ? []
            : [roleName];

        return (new CreateUserResponseDto
        {
            User = RegistrationMapper.ToListItem(user, profile, createdRoles),
        }, null);
    }

    private static string Get(RegistrationPayloadDto data, string key) =>
        data.TryGetValue(key, out var v) ? v : "";
}
