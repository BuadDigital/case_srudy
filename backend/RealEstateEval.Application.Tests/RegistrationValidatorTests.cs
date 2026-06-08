using RealEstateEval.Application.Contracts;
using RealEstateEval.Application.Rules;

namespace RealEstateEval.Application.Tests;

public class RegistrationValidatorTests
{
    [Fact]
    public void ValidateHr_returns_no_errors_for_complete_payload()
    {
        var errors = RegistrationValidator.ValidateHr(ValidHrPayload());

        Assert.Empty(errors);
    }

    [Fact]
    public void ValidateHr_requires_employment_fields()
    {
        var errors = RegistrationValidator.ValidateHr(new RegistrationPayloadDto());

        Assert.Contains("hr_empType", errors.Keys);
        Assert.Contains("hr_dept", errors.Keys);
        Assert.Contains("hr_perms", errors.Keys);
        Assert.Contains("hr_name", errors.Keys);
        Assert.Contains("hr_email", errors.Keys);
        Assert.Contains("hr_pwd", errors.Keys);
        Assert.Contains("hr_pwd2", errors.Keys);
    }

    [Fact]
    public void ValidateHr_rejects_invalid_email_and_mismatched_passwords()
    {
        var data = ValidHrPayload();
        data["hr_email"] = "bad-email";
        data["hr_pwd2"] = "different";

        var errors = RegistrationValidator.ValidateHr(data);

        Assert.Equal("صيغة البريد الإلكتروني غير صحيحة.", errors["hr_email"]);
        Assert.Equal("غير متطابقة مع كلمة المرور", errors["hr_pwd2"]);
    }

    [Fact]
    public void ValidateProc_org_requires_organization_fields()
    {
        var data = new RegistrationPayloadDto
        {
            ["subtype"] = "org",
            ["pc_orgname"] = "Org",
            ["pc_crn"] = "123",
            ["pc_delegate"] = "Delegate",
            ["pc_idno"] = "ID",
            ["pc_email"] = "proc@ejadah.dev",
            ["pc_phone"] = "0500000000",
            ["pc_username"] = "proc-user",
            ["pc_pwd"] = "secret1",
            ["pc_pwd2"] = "secret1",
            ["pc_service"] = "valuation",
        };

        var errors = RegistrationValidator.ValidateProc(data);

        Assert.Empty(errors);
    }

    [Fact]
    public void ValidateProc_individual_requires_person_fields_not_org_fields()
    {
        var errors = RegistrationValidator.ValidateProc(new RegistrationPayloadDto
        {
            ["subtype"] = "individual",
        });

        Assert.Contains("pc_name", errors.Keys);
        Assert.DoesNotContain(errors, e => e.Key == "pc_orgname");
    }

    [Fact]
    public void ValidateCrm_company_requires_org_and_contact_person()
    {
        var errors = RegistrationValidator.ValidateCrm(new RegistrationPayloadDto
        {
            ["entitySubtype"] = "company",
            ["crm_name"] = "Client",
            ["crm_email"] = "client@ejadah.dev",
            ["crm_phone"] = "0500000000",
            ["crm_username"] = "client-user",
            ["crm_pwd"] = "secret1",
            ["crm_pwd2"] = "secret1",
        });

        Assert.Contains("crm_orgname", errors.Keys);
        Assert.Contains("crm_contactPerson", errors.Keys);
    }

    [Fact]
    public void ValidateCrm_individual_does_not_require_company_fields()
    {
        var errors = RegistrationValidator.ValidateCrm(new RegistrationPayloadDto
        {
            ["crm_name"] = "Client",
            ["crm_email"] = "client@ejadah.dev",
            ["crm_phone"] = "0500000000",
            ["crm_username"] = "client-user",
            ["crm_pwd"] = "secret1",
            ["crm_pwd2"] = "secret1",
        });

        Assert.Empty(errors);
        Assert.DoesNotContain(errors, e => e.Key == "crm_orgname");
    }

    private static RegistrationPayloadDto ValidHrPayload() => new()
    {
        ["hr_empType"] = "full_time",
        ["hr_dept"] = "HR",
        ["hr_perms"] = "admin",
        ["hr_name"] = "Employee",
        ["hr_phone"] = "0500000000",
        ["hr_email"] = "hr@ejadah.dev",
        ["hr_username"] = "hr-user",
        ["hr_pwd"] = "secret1",
        ["hr_pwd2"] = "secret1",
    };
}
