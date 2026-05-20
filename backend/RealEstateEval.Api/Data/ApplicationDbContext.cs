using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RealEstateEval.Api.Models;
namespace RealEstateEval.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<HrEmployeeProfile> HrEmployeeProfiles => Set<HrEmployeeProfile>();
    public DbSet<ProcServiceProviderProfile> ProcServiceProviderProfiles => Set<ProcServiceProviderProfile>();
    public DbSet<CrmClientProfile> CrmClientProfiles => Set<CrmClientProfile>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<WorkOrderProperty> WorkOrderProperties => Set<WorkOrderProperty>();
    public DbSet<PropertyContact> PropertyContacts => Set<PropertyContact>();
    public DbSet<CourtCatalogEntry> CourtCatalogEntries => Set<CourtCatalogEntry>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(e => e.ToTable("Users"));
        builder.Entity<IdentityRole>(e => e.ToTable("Roles"));
        builder.Entity<IdentityUserRole<string>>(e => e.ToTable("UserRoles"));
        builder.Entity<IdentityUserClaim<string>>(e => e.ToTable("UserClaims"));
        builder.Entity<IdentityRoleClaim<string>>(e => e.ToTable("RoleClaims"));
        builder.Entity<IdentityUserLogin<string>>(e => e.ToTable("UserLogins"));
        builder.Entity<IdentityUserToken<string>>(e => e.ToTable("UserTokens"));

        builder.Entity<UserProfile>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
                .WithOne()
                .HasForeignKey<UserProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.JobTitle).HasMaxLength(256);
            e.Property(x => x.PermissionLevel).HasMaxLength(64);
            e.Property(x => x.RegistrationPayloadJson).HasColumnType("jsonb");
        });

        builder.Entity<HrEmployeeProfile>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.Profile)
                .WithOne(x => x.HrEmployee)
                .HasForeignKey<HrEmployeeProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.EmploymentType).HasMaxLength(64);
            e.Property(x => x.Department).HasMaxLength(256);
            e.Property(x => x.Section).HasMaxLength(256);
        });

        builder.Entity<ProcServiceProviderProfile>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.Profile)
                .WithOne(x => x.ProcProvider)
                .HasForeignKey<ProcServiceProviderProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.ServiceType).HasMaxLength(128);
        });

        builder.Entity<CrmClientProfile>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.Profile)
                .WithOne(x => x.CrmClient)
                .HasForeignKey<CrmClientProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<WorkOrder>(e =>
        {
            e.ToTable("WorkOrders");
            e.HasIndex(x => x.PoNumber).IsUnique();
            e.Property(x => x.PoNumber).HasMaxLength(64);
            e.Property(x => x.AssignmentSpecialist).HasMaxLength(256);
            e.Property(x => x.ReceivedFromEnfathTime).HasMaxLength(8);
            e.HasOne(x => x.RegisteredBy)
                .WithMany()
                .HasForeignKey(x => x.RegisteredByUserId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Properties)
                .WithOne(x => x.WorkOrder)
                .HasForeignKey(x => x.WorkOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<WorkOrderProperty>(e =>
        {
            e.ToTable("WorkOrderProperties");
            e.Property(x => x.DeedNumber).HasMaxLength(128);
            e.Property(x => x.City).HasMaxLength(128);
            e.Property(x => x.District).HasMaxLength(128);
            e.Property(x => x.Classification).HasMaxLength(128);
            e.Property(x => x.PropertyType).HasMaxLength(128);
            e.HasIndex(x => new { x.WorkOrderId, x.DeedNumber });
            e.HasMany(x => x.Contacts)
                .WithOne(x => x.Property)
                .HasForeignKey(x => x.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PropertyContact>(e =>
        {
            e.ToTable("PropertyContacts");
            e.Property(x => x.Name).HasMaxLength(256);
            e.Property(x => x.Phone).HasMaxLength(32);
        });

        builder.Entity<CourtCatalogEntry>(e =>
        {
            e.ToTable("CourtCatalogEntries");
            e.Property(x => x.City).HasMaxLength(128);
            e.Property(x => x.Court).HasMaxLength(256);
            e.Property(x => x.CircuitsJson).HasColumnType("jsonb");
        });
    }
}
