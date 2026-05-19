namespace RealEstateEval.Api.Services;

/// <summary>§6 — 4 business days (Sun–Thu), 08:00–17:00 receipt rules.</summary>
public static class BusinessDueDateCalculator
{
    private const int WorkdayStartHour = 8;
    private const int WorkdayEndHour = 17;
    private const int BusinessDaysRequired = 4;

    public static DateOnly Compute(DateOnly receivedDate, string? receivedTime)
    {
        var received = ParseReceived(receivedDate, receivedTime);
        var effective = GetEffectiveStartDate(received);
        return AddBusinessDaysInclusive(effective, BusinessDaysRequired);
    }

    private static DateTime ParseReceived(DateOnly receivedDate, string? receivedTime)
    {
        var t = string.IsNullOrWhiteSpace(receivedTime) ? "10:00" : receivedTime.Trim();
        if (TimeOnly.TryParse(t, out var time))
            return receivedDate.ToDateTime(time);
        return receivedDate.ToDateTime(new TimeOnly(10, 0));
    }

    private static bool IsBusinessDay(DateTime d) => d.DayOfWeek is >= DayOfWeek.Sunday and <= DayOfWeek.Thursday;

    private static bool IsWithinBusinessHours(DateTime d) =>
        d.Hour >= WorkdayStartHour && d.Hour < WorkdayEndHour;

    private static DateTime GetEffectiveStartDate(DateTime received)
    {
        if (IsBusinessDay(received) && IsWithinBusinessHours(received))
            return received.Date;

        var cursor = received;
        if (!IsBusinessDay(cursor) || received.Hour >= WorkdayEndHour)
            cursor = cursor.AddDays(1);

        while (!IsBusinessDay(cursor))
            cursor = cursor.AddDays(1);

        return cursor.Date;
    }

    private static DateOnly AddBusinessDaysInclusive(DateTime start, int count)
    {
        var d = start.Date;
        var added = 0;
        while (added < count)
        {
            if (IsBusinessDay(d))
                added++;
            if (added < count)
                d = d.AddDays(1);
        }
        return DateOnly.FromDateTime(d);
    }
}
