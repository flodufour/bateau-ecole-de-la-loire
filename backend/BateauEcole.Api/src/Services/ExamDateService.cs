using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;

namespace BateauEcole.Api.Services;

public class ExamDateService(AppDbContext db)
{
    public async Task<List<ExamDateDto>> GetUpcomingAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var examDates = await db.ExamDates
            .Where(e => e.Date >= today)
            .OrderBy(e => e.Date)
            .ToListAsync();

        return examDates.Select(ToDto).ToList();
    }

    private static ExamDateDto ToDto(Models.ExamDate e) =>
        new(e.Id, e.PermitType, e.Date, e.Location, e.Notes);
}
