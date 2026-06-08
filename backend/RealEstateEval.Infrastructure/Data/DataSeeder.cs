using Microsoft.AspNetCore.Identity;

using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.DependencyInjection;

using RealEstateEval.Domain;



namespace RealEstateEval.Infrastructure.Data;



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



        foreach (var staff in HrStaffSeeds)

        {

            await EnsureHrStaffAsync(userManager, db, staff, cancellationToken);

        }



        await EnsureProcProviderAsync(

            userManager,

            db,

            JeddahSurveyOfficeSeed,

            cancellationToken);

    }



    private static readonly HrStaffSeed[] HrStaffSeeds =

    [

        new(

            "s.salhy@gmail.com",

            "sliman123",

            "سليمان",

            "مسؤول التحول الرقمي (CDO)",

            "دوام كامل",

            "الإدارة التنفيذية",

            null,

            "مدير",

            ContractType.Internal,

            OrgRoles.Cdo,

            DepartmentRoles.Hr),

        new(

            "a.alamin@gmail.com",

            "ali123",

            "آلاء قمصاني",

            "أخصائية موارد بشرية",

            "دوام كامل",

            "الإدارة التنفيذية",

            null,

            "مدير",

            ContractType.Internal,

            OrgRoles.HrAdmin,

            DepartmentRoles.Hr),

        new(

            "a.alqadri@gmail.com",

            "ahmad123",

            "علي الأمين",

            "مدير المالية والعقود",

            "دوام كامل",

            "الإدارة المالية",

            "قسم المحاسبة",

            "مدير",

            ContractType.Internal,

            OrgRoles.ProcAdmin,

            DepartmentRoles.Hr),

        new(

            "g.abdo@gmail.com",

            "gamal123",

            "شهد العماري",

            "مدير علاقات العملاء",

            "دوام كامل",

            "الإدارة التنفيذية",

            null,

            "مدير",

            ContractType.Internal,

            OrgRoles.CrmAdmin,

            DepartmentRoles.Hr),

        new(

            "salam@ejadah.dev",

            "EjadaGM2025!",

            "سالم الغريب",

            "مدير إدارة التقييم العقاري",

            "دوام كامل",

            "إدارة التقييم العقاري",

            null,

            "مدير",

            ContractType.Internal,

            DepartmentRoles.Hr,

            "Editor"),

        new(

            "abdulrahman@ejadah.dev",

            "EjadaSS2025!",

            "عبدالرحمن النفيعي",

            "مشرف قسم دراسة الحالة",

            "دوام كامل",

            "إدارة التقييم العقاري",

            "قسم دراسة الحالة",

            "مشرف",

            ContractType.Internal,

            DepartmentRoles.Hr,

            "Supervisor"),

        new(

            "osama@ejadah.dev",

            "EjadaCS2025!",

            "أسامة الصالحي",

            "أخصائي دراسة حالة",

            "دوام كامل",

            "إدارة التقييم العقاري",

            "قسم دراسة الحالة",

            "محرر",

            ContractType.Internal,

            DepartmentRoles.Hr,

            "Editor"),

        new(

            "feras@ejadah.dev",

            "EjadaCD2025!",

            "فراس كمرين",

            "مراجع حكومي",

            "دوام كامل",

            "إدارة التقييم العقاري",

            "قسم دراسة الحالة",

            "محرر",

            ContractType.Internal,

            DepartmentRoles.Hr,

            "Editor"),

        new(

            "valuation@ejadah.dev",

            "EjadaVC2025!",

            "محمد دياب",

            "منسق عمليات التقييم",

            "دوام كامل",

            "إدارة التقييم العقاري",

            "قسم تقييم الأفراد",

            "مشرف",

            ContractType.Internal,

            DepartmentRoles.Hr,

            "Supervisor"),

        new(

            "abdullah.kathiri@ejadah.dev",

            "EjadaRA2025!",

            "عبدالله الكثيري",

            "مقيم عقاري",

            "دوام كامل",

            "إدارة التقييم العقاري",

            "قسم تقييم الأفراد",

            "محرر",

            ContractType.Internal,

            DepartmentRoles.Hr,

            "Editor"),

        new(

            "ahmed@ejadah.dev",

            "EjadaFI2025!",

            "أحمد سعيد",

            "معاين ميداني",

            "متعاون",

            "إدارة التقييم العقاري",

            "قسم تقييم الأفراد",

            "محرر",

            ContractType.Freelance,

            DepartmentRoles.Hr,

            "Editor"),

        new(

            "abdullah.abdulmane@ejadah.dev",

            "EjadaFI2025!",

            "عبدالله عبدالمانع",

            "معاين ميداني",

            "دوام كامل",

            "إدارة التقييم العقاري",

            "قسم تقييم الأفراد",

            "محرر",

            ContractType.Internal,

            DepartmentRoles.Hr,

            "Editor"),

        new(

            "eman@ejadah.dev",

            "EjadaFO2025!",

            "إيمان النهدي",

            "موظف الشؤون المالية",

            "دوام كامل",

            "الإدارة المالية",

            "قسم المحاسبة",

            "محرر",

            ContractType.Internal,

            DepartmentRoles.Hr,

            "Editor"),

    ];



    private static readonly ProcProviderSeed JeddahSurveyOfficeSeed = new(

        "survey.jeddah@ejadah.dev",

        "EjadaEO2025!",

        "مكتب جدة للمساحة",

        "مكتب جدة للمساحة",

        "مسح ميداني",

        "مكة المكرمة",

        "عقاري");



    private sealed record HrStaffSeed(

        string Email,

        string Password,

        string DisplayName,

        string JobTitle,

        string EmploymentType,

        string Department,

        string? Section,

        string PermissionLevel,

        ContractType ContractType,

        params string[] IdentityRoles);



    private sealed record ProcProviderSeed(

        string Email,

        string Password,

        string UserName,

        string OrganizationName,

        string ServiceType,

        string Region,

        string Sector);



    private static async Task EnsureHrStaffAsync(

        UserManager<ApplicationUser> userManager,

        ApplicationDbContext db,

        HrStaffSeed seed,

        CancellationToken cancellationToken)

    {

        var normalizedEmail = seed.Email.Trim().ToLowerInvariant();

        var user = await userManager.FindByEmailAsync(normalizedEmail);

        if (user is null)

        {

            user = new ApplicationUser

            {

                UserName = normalizedEmail,

                Email = normalizedEmail,

                EmailConfirmed = true,

                DisplayName = seed.DisplayName,

            };



            var createResult = await userManager.CreateAsync(user, seed.Password);

            if (!createResult.Succeeded)

            {

                throw new InvalidOperationException(

                    "Failed to seed HR user " + seed.Email + ": "

                    + string.Join("; ", createResult.Errors.Select(e => e.Description)));

            }

        }

        else if (!string.Equals(user.DisplayName, seed.DisplayName, StringComparison.Ordinal))

        {

            user.DisplayName = seed.DisplayName;

            await userManager.UpdateAsync(user);

        }



        var roles = await userManager.GetRolesAsync(user);

        foreach (var role in seed.IdentityRoles.Distinct())

        {

            if (!roles.Contains(role))

                await userManager.AddToRoleAsync(user, role);

        }



        var profile = await db.UserProfiles

            .Include(p => p.HrEmployee)

            .FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);



        if (profile is null)

        {

            profile = new UserProfile

            {

                UserId = user.Id,

                RegistrationSource = RegistrationSource.Hr,

                ContractType = seed.ContractType,

                JobTitle = seed.JobTitle,

                PermissionLevel = seed.PermissionLevel,

                Status = UserStatus.Active,

                CreatedAtUtc = DateTime.UtcNow,

                HrEmployee = new HrEmployeeProfile

                {

                    UserId = user.Id,

                    EmploymentType = seed.EmploymentType,

                    Department = seed.Department,

                    Section = seed.Section,

                },

            };

            db.UserProfiles.Add(profile);

        }

        else

        {

            profile.RegistrationSource = RegistrationSource.Hr;

            profile.ContractType = seed.ContractType;

            profile.JobTitle = seed.JobTitle;

            profile.PermissionLevel = seed.PermissionLevel;

            profile.Status = UserStatus.Active;

            if (profile.ProcProvider is not null)
            {
                db.ProcServiceProviderProfiles.Remove(profile.ProcProvider);
                profile.ProcProvider = null;
            }

            profile.CrmClient = null;

            if (profile.HrEmployee is null)

            {

                profile.HrEmployee = new HrEmployeeProfile { UserId = user.Id };

                db.HrEmployeeProfiles.Add(profile.HrEmployee);

            }



            profile.HrEmployee.EmploymentType = seed.EmploymentType;

            profile.HrEmployee.Department = seed.Department;

            profile.HrEmployee.Section = seed.Section;

        }



        await db.SaveChangesAsync(cancellationToken);

    }



    private static async Task EnsureProcProviderAsync(

        UserManager<ApplicationUser> userManager,

        ApplicationDbContext db,

        ProcProviderSeed seed,

        CancellationToken cancellationToken)

    {

        var normalizedEmail = seed.Email.Trim().ToLowerInvariant();

        var user = await userManager.FindByEmailAsync(normalizedEmail);

        if (user is null)

        {

            user = new ApplicationUser

            {

                UserName = normalizedEmail,

                Email = normalizedEmail,

                EmailConfirmed = true,

                DisplayName = seed.OrganizationName,

            };



            var createResult = await userManager.CreateAsync(user, seed.Password);

            if (!createResult.Succeeded)

            {

                throw new InvalidOperationException(

                    "Failed to seed PROC provider " + seed.Email + ": "

                    + string.Join("; ", createResult.Errors.Select(e => e.Description)));

            }

        }

        else if (!string.Equals(user.DisplayName, seed.OrganizationName, StringComparison.Ordinal))

        {

            user.DisplayName = seed.OrganizationName;

            await userManager.UpdateAsync(user);

        }



        var roles = await userManager.GetRolesAsync(user);

        if (!roles.Contains(DepartmentRoles.Proc))

            await userManager.AddToRoleAsync(user, DepartmentRoles.Proc);



        var profile = await db.UserProfiles

            .Include(p => p.ProcProvider)

            .FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);



        if (profile is null)

        {

            profile = new UserProfile

            {

                UserId = user.Id,

                RegistrationSource = RegistrationSource.Proc,

                ContractType = ContractType.ServiceProvider,

                JobTitle = "مقدم خدمة — جهة",

                Status = UserStatus.Active,

                CreatedAtUtc = DateTime.UtcNow,

                ProcProvider = new ProcServiceProviderProfile

                {

                    UserId = user.Id,

                    ProviderKind = ProcProviderKind.Organization,

                    OrganizationName = seed.OrganizationName,

                    ServiceType = seed.ServiceType,

                    Region = seed.Region,

                    Sector = seed.Sector,

                },

            };

            db.UserProfiles.Add(profile);

        }

        else

        {

            profile.RegistrationSource = RegistrationSource.Proc;

            profile.ContractType = ContractType.ServiceProvider;

            profile.JobTitle = "مقدم خدمة — جهة";

            profile.Status = UserStatus.Active;

            if (profile.HrEmployee is not null)
            {
                db.HrEmployeeProfiles.Remove(profile.HrEmployee);
                profile.HrEmployee = null;
            }

            profile.CrmClient = null;

            if (profile.ProcProvider is null)

            {

                profile.ProcProvider = new ProcServiceProviderProfile { UserId = user.Id };

                db.ProcServiceProviderProfiles.Add(profile.ProcProvider);

            }



            profile.ProcProvider.ProviderKind = ProcProviderKind.Organization;

            profile.ProcProvider.OrganizationName = seed.OrganizationName;

            profile.ProcProvider.ServiceType = seed.ServiceType;

            profile.ProcProvider.Region = seed.Region;

            profile.ProcProvider.Sector = seed.Sector;

        }



        await db.SaveChangesAsync(cancellationToken);

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

}


