namespace RealEstateEval.Application.Rules;

/// <summary>4 business days (Sun–Thu). Receipt day counts as day 1 if before 17:00; after 17:00 or on Fri/Sat → start next business day.</summary>
public static class BusinessDueDateCalculator
{
    private const int WorkdayStartHour = 8;
    private const int WorkdayEndHour = 17;
    private const int BusinessDaysRequired = 4;

    public static DateOnly Compute(DateOnly receivedDate, string? receivedTime)
    {
        var received = ParseReceived(receivedDate, receivedTime);
        var effective = GetEffectiveStartDate(received);
        return AddBusinessDaysFromEffectiveStart(effective, BusinessDaysRequired);
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

    /// <summary>Due date = nth business day on/after effective start (day 1 = effective start when it is a business day).</summary>
    private static DateOnly AddBusinessDaysFromEffectiveStart(DateTime start, int count)
    {
        var d = start.Date;
        var remaining = count;
        while (remaining > 0)
        {
            if (IsBusinessDay(d))
                remaining--;
            if (remaining > 0)
                d = d.AddDays(1);
        }
        return DateOnly.FromDateTime(d);
    }
}
