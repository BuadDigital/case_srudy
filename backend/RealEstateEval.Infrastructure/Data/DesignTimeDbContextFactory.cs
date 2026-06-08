using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace RealEstateEval.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "RealEstateEval.Api");
        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString =
            Environment.GetEnvironmentVariable("REAL_ESTATE_EVAL_PG_CONNECTION_STRING")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Database connection missing for design-time migrations.");

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new ApplicationDbContext(options);
    }
}
