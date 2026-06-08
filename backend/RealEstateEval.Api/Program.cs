using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using RealEstateEval.Infrastructure;
using RealEstateEval.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

var connectionString =
    Environment.GetEnvironmentVariable("REAL_ESTATE_EVAL_PG_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection missing. Set REAL_ESTATE_EVAL_PG_CONNECTION_STRING, or ConnectionStrings:DefaultConnection in appsettings / user secrets.");
}

builder.Services.AddInfrastructure(builder.Configuration, connectionString);

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
var jwtSigningKey = builder.Configuration["Jwt:SigningKey"];

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey ?? "")),
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = JwtRegisteredClaimNames.Sub,
            RoleClaimType = "role",
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanManageUsers", policy =>
        policy.RequireAuthenticatedUser());
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .SetIsOriginAllowed(origin =>
                {
                    if (string.IsNullOrEmpty(origin) ||
                        !Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                        return false;
                    return uri.Port is 3000 or 3001;
                })
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

app.UseResponseCompression();
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
    await DataSeeder.SeedAsync(scope.ServiceProvider);
}

app.Run();
