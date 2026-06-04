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

        foreach (var role in LegacyRoles.Concat(OrgRoles.All).Concat(DepartmentRoles.All))
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
            "آلاء قمصاني",
            "أخصائية موارد بشرية",
            RegistrationSource.Hr,
            cancellationToken);

        await EnsureOrgAccountAsync(
            userManager,
            db,
            OrgRoles.ProcAdmin,
            "a.alqadri@gmail.com",
            "ahmad123",
            "علي الأمين",
            "مدير المالية والعقود",
            RegistrationSource.Proc,
            cancellationToken);

        await EnsureOrgAccountAsync(
            userManager,
            db,
            OrgRoles.CrmAdmin,
            "g.abdo@gmail.com",
            "gamal123",
            "شهد العماري",
            "مدير علاقات العملاء",
            RegistrationSource.Crm,
            cancellationToken);

        await SeedWorkflowDemoUsersAsync(userManager, db, cancellationToken);
    }

    private static async Task SeedWorkflowDemoUsersAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var workflowUsers = new (string Email, string Password, string DisplayName, string JobTitle)[]
        {
            ("salam@ejadah.dev", "EjadaGM2025!", "سالم الغريب", "مدير إدارة التقييم العقاري"),
            ("abdulrahman@ejadah.dev", "EjadaSS2025!", "عبدالرحمن النفيعي", "مشرف دراسة الحالة"),
            ("osama@ejadah.dev", "EjadaCS2025!", "أسامة الصالحي", "أخصائي دراسة الحالة"),
            ("feras@ejadah.dev", "EjadaCD2025!", "فراس كمرين", "مراجع حكومي"),
            ("valuation@ejadah.dev", "EjadaVC2025!", "محمد دياب", "منسق عمليات التقييم"),
            ("abdullah.kathiri@ejadah.dev", "EjadaRA2025!", "عبدالله الكثيري", "مقيم عقاري"),
            ("ahmed@ejadah.dev", "EjadaFI2025!", "أحمد سعيد", "معاين ميداني"),
            ("survey.jeddah@ejadah.dev", "EjadaEO2025!", "مكتب جدة للمساحة", "مكتب هندسي — رفع مساحي"),
            ("eman@ejadah.dev", "EjadaFO2025!", "إيمان النهدي", "موظف الشؤون المالية"),
        };

        foreach (var (email, password, displayName, jobTitle) in workflowUsers)
        {
            await EnsureWorkflowUserAsync(
                userManager,
                db,
                email,
                password,
                displayName,
                jobTitle,
                cancellationToken);
        }
    }

    private static async Task EnsureWorkflowUserAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db,
        string email,
        string password,
        string displayName,
        string jobTitle,
        CancellationToken cancellationToken)
    {
        const string identityRole = "Editor";
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
                    "Failed to seed workflow user " + email + ": "
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
                RegistrationSource = RegistrationSource.Hr,
                ContractType = ContractType.Internal,
                JobTitle = jobTitle,
                PermissionLevel = "STAFF",
                Status = UserStatus.Active,
                CreatedAtUtc = DateTime.UtcNow,
            };
            db.UserProfiles.Add(profile);
            await db.SaveChangesAsync(cancellationToken);
        }
        else if (profile.JobTitle != jobTitle)
        {
            profile.JobTitle = jobTitle;
            profile.Status = UserStatus.Active;
            await db.SaveChangesAsync(cancellationToken);
        }
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
