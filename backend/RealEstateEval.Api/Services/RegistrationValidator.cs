using System.Text.RegularExpressions;
using RealEstateEval.Api.Contracts;

namespace RealEstateEval.Api.Services;

public static class RegistrationValidator
{
    private static readonly Regex EmailRegex = new(
        @"^[^\s@]+@[^\s@]+\.[^\s@]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static string Get(RegistrationPayloadDto data, string key) =>
        data.TryGetValue(key, out var v) ? v.Trim() : string.Empty;

    public static Dictionary<string, string> ValidateHr(RegistrationPayloadDto data)
    {
        var errors = new Dictionary<string, string>();

        if (string.IsNullOrEmpty(Get(data, "hr_empType")))
            errors["hr_empType"] = "يرجى اختيار نوع التوظيف";
        if (string.IsNullOrEmpty(Get(data, "hr_dept")))
            errors["hr_dept"] = "هذا الحقل مطلوب";
        if (string.IsNullOrEmpty(Get(data, "hr_perms")))
            errors["hr_perms"] = "يرجى اختيار مستوى الصلاحيات";

        Require(data, errors, "hr_name");
        Require(data, errors, "hr_phone");
        Require(data, errors, "hr_email");
        Require(data, errors, "hr_username");
        ValidateEmail(data, errors, "hr_email");
        ValidatePassword(data, errors, "hr_pwd", "hr_pwd2");

        return errors;
    }

    public static Dictionary<string, string> ValidateProc(RegistrationPayloadDto data)
    {
        var errors = new Dictionary<string, string>();
        var isOrg = Get(data, "subtype") == "org";

        if (string.IsNullOrEmpty(Get(data, "subtype")))
            errors["subtype"] = "يرجى اختيار نوع مقدم الخدمة";

        if (isOrg)
        {
            foreach (var key in new[]
                     {
                         "pc_orgname", "pc_crn", "pc_delegate", "pc_idno", "pc_email", "pc_phone",
                         "pc_username", "pc_pwd", "pc_pwd2", "pc_service",
                     })
                Require(data, errors, key);
        }
        else
        {
            foreach (var key in new[]
                     {
                         "pc_name", "pc_idno", "pc_email", "pc_phone", "pc_username", "pc_pwd", "pc_pwd2",
                         "pc_service",
                     })
                Require(data, errors, key);
        }

        ValidateEmail(data, errors, "pc_email");
        ValidatePassword(data, errors, "pc_pwd", "pc_pwd2");

        return errors;
    }

    public static Dictionary<string, string> ValidateCrm(RegistrationPayloadDto data)
    {
        var errors = new Dictionary<string, string>();
        var isCompany = Get(data, "entitySubtype") == "company";

        Require(data, errors, "crm_name");
        Require(data, errors, "crm_email");
        Require(data, errors, "crm_phone");
        Require(data, errors, "crm_username");
        ValidateEmail(data, errors, "crm_email");
        ValidatePassword(data, errors, "crm_pwd", "crm_pwd2");

        if (isCompany)
        {
            Require(data, errors, "crm_orgname");
            Require(data, errors, "crm_contactPerson");
        }

        return errors;
    }

    private static void Require(
        RegistrationPayloadDto data,
        Dictionary<string, string> errors,
        string key)
    {
        if (string.IsNullOrEmpty(Get(data, key)))
            errors[key] = "هذا الحقل مطلوب";
    }

    private static void ValidateEmail(
        RegistrationPayloadDto data,
        Dictionary<string, string> errors,
        string key)
    {
        var email = Get(data, key).ToLowerInvariant();
        if (string.IsNullOrEmpty(email)) return;
        if (!EmailRegex.IsMatch(email))
            errors[key] = "صيغة البريد الإلكتروني غير صحيحة.";
    }

    private static void ValidatePassword(
        RegistrationPayloadDto data,
        Dictionary<string, string> errors,
        string pwdKey,
        string pwd2Key,
        int minLen = 6)
    {
        var pwd = Get(data, pwdKey);
        var pwd2 = Get(data, pwd2Key);
        if (string.IsNullOrEmpty(pwd))
            errors[pwdKey] = "كلمة المرور مطلوبة";
        else if (pwd.Length < minLen)
            errors[pwdKey] = $"يجب أن تكون {minLen} أحرف على الأقل";
        if (string.IsNullOrEmpty(pwd2))
            errors[pwd2Key] = "تأكيد كلمة المرور مطلوب";
        else if (pwd != pwd2)
            errors[pwd2Key] = "غير متطابقة مع كلمة المرور";
    }
}
