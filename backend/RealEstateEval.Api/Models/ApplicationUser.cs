using Microsoft.AspNetCore.Identity;

namespace RealEstateEval.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
}
