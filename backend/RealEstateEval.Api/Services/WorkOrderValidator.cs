using RealEstateEval.Api.Contracts;
using RealEstateEval.Api.Models;

namespace RealEstateEval.Api.Services;

internal static class WorkOrderValidator
{
    public static bool RequiresAssignmentDecree(AssignmentType type) =>
        type == AssignmentType.Execution;

    public static Dictionary<string, string> ValidateProperty(
        WorkOrderPropertyDto dto,
        AssignmentType assignmentType,
        string poNumber,
        Guid? excludePropertyId,
        Func<string, Guid?, bool> deedExistsInPo)
    {
        var errors = new Dictionary<string, string>();

        if (string.IsNullOrWhiteSpace(dto.DeedNumber))
            errors["deedNumber"] = "رقم الصك مطلوب";
        if (string.IsNullOrWhiteSpace(dto.City))
            errors["city"] = "المدينة مطلوبة";
        if (string.IsNullOrWhiteSpace(dto.District))
            errors["district"] = "الحي مطلوب";
        if (string.IsNullOrWhiteSpace(dto.Classification))
            errors["classification"] = "التصنيف مطلوب";
        if (string.IsNullOrWhiteSpace(dto.PropertyType))
            errors["propertyType"] = "نوع العقار مطلوب";

        if (RequiresAssignmentDecree(assignmentType) &&
            string.IsNullOrWhiteSpace(dto.AssignmentDocFileName))
            errors["assignmentDocFileName"] = "مرفق قرار الإسناد مطلوب لمسار التنفيذ";

        PropertyIdentifierTypeLabels.TryParseApiValue(dto.IdentifierType, out var idType);
        if (idType == PropertyIdentifierType.RealEstateRegistration &&
            string.IsNullOrWhiteSpace(dto.RealEstateRegFileName))
            errors["realEstateRegFileName"] =
                "ارفع السجل العقاري كمرفق (يُطلب من أطراف التنفيذ)";

        var hasContact = dto.Contacts.Any(c =>
            !string.IsNullOrWhiteSpace(c.Name) && !string.IsNullOrWhiteSpace(c.Phone));
        if (!hasContact)
            errors["_contacts"] = "أضف ضابط اتصال واحداً على الأقل";

        if (!string.IsNullOrWhiteSpace(dto.DeedNumber) &&
            deedExistsInPo(dto.DeedNumber.Trim(), excludePropertyId))
            errors["deedNumber"] = "رقم الصك مسجّل مسبقاً في هذا أمر العمل";

        return errors;
    }

    public static Dictionary<string, string> ValidateHeader(CreateWorkOrderRequest request)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(request.PoNumber))
            errors["poNumber"] = "رقم PO مطلوب";
        if (!AssignmentTypeLabels.TryParseLabel(request.AssignmentType, out _))
            errors["assignmentType"] = "نوع الإسناد غير صالح";
        if (!DateOnly.TryParse(request.ReceivedFromEnfathAt, out _))
            errors["receivedFromEnfathAt"] = "تاريخ الاستلام غير صالح";
        if (!DateOnly.TryParse(request.InternalAssignmentAt, out _))
            errors["internalAssignmentAt"] = "تاريخ التكليف غير صالح";
        if (string.IsNullOrWhiteSpace(request.AssignmentSpecialist))
            errors["assignmentSpecialist"] = "أخصائي الإسناد مطلوب";
        if (request.Properties.Count < 1)
            errors["properties"] = "يجب تسجيل عقار واحد على الأقل";
        return errors;
    }
}
