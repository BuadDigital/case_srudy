using Microsoft.AspNetCore.Identity;
using RealEstateEval.Api.Models;

namespace RealEstateEval.Api.Data;

public static class DataSeeder
{
    private static readonly string[] LegacyRoles =
        ["Admin", "Supervisor", "Editor", "Reader"];

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<ApplicationDbContext>();

        foreach (var role in LegacyRoles.Concat(OrgRoles.All))
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        await EnsureLegacyAdminAsync(userManager);

        await EnsureOrgAccountAsync(
            userManager,
            db,
            OrgRoles.Cdo,
            "s.salhy@gmail.com",
            "sliman123",
            "سليمان",
            "مسؤول التحول الرقمي (CDO)",
            RegistrationSource.Hr,
            cancellationToken);

        await EnsureOrgAccountAsync(
            userManager,
            db,
            OrgRoles.HrAdmin,
            "a.alamin@gmail.com",
            "ali123",
            "علي",
            "مدير الموارد البشرية",
            RegistrationSource.Hr,
            cancellationToken);

        await EnsureOrgAccountAsync(
            userManager,
            db,
            OrgRoles.ProcAdmin,
            "a.alqadri@gmail.com",
            "ahmad123",
            "أحمد",
            "مدير العقود والمشتريات",
            RegistrationSource.Proc,
            cancellationToken);

        await EnsureOrgAccountAsync(
            userManager,
            db,
            OrgRoles.CrmAdmin,
            "g.abdo@gmail.com",
            "gamal123",
            "جمال",
            "مدير علاقات العملاء",
            RegistrationSource.Crm,
            cancellationToken);
    }

    private static async Task EnsureLegacyAdminAsync(UserManager<ApplicationUser> userManager)
    {
        const string email = "admin@local.dev";
        if (await userManager.FindByEmailAsync(email) is not null)
            return;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = "سالم الغريب",
        };

        const string password = "Admin123!";
        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                "Failed to seed default user: "
                + string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        await userManager.AddToRoleAsync(user, "Admin");
    }

    private static async Task EnsureOrgAccountAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db,
        string identityRole,
        string email,
        string password,
        string displayName,
        string jobTitle,
        RegistrationSource registrationSource,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(normalizedEmail);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = normalizedEmail,
                Email = normalizedEmail,
                EmailConfirmed = true,
                DisplayName = displayName,
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(
                    "Failed to seed org user " + email + ": "
                    + string.Join("; ", createResult.Errors.Select(e => e.Description)));
            }
        }
        else if (!string.Equals(user.DisplayName, displayName, StringComparison.Ordinal))
        {
            user.DisplayName = displayName;
            await userManager.UpdateAsync(user);
        }

        var roles = await userManager.GetRolesAsync(user);
        if (!roles.Contains(identityRole))
            await userManager.AddToRoleAsync(user, identityRole);

        var profile = await db.UserProfiles.FindAsync([user.Id], cancellationToken);
        if (profile is null)
        {
            profile = new UserProfile
            {
                UserId = user.Id,
                RegistrationSource = registrationSource,
                ContractType = ContractType.Internal,
                JobTitle = jobTitle,
                PermissionLevel = "MANAGER",
                Status = UserStatus.Active,
                CreatedAtUtc = DateTime.UtcNow,
            };
            db.UserProfiles.Add(profile);
            await db.SaveChangesAsync(cancellationToken);
        }
        else if (profile.JobTitle != jobTitle)
        {
            profile.JobTitle = jobTitle;
            profile.RegistrationSource = registrationSource;
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
