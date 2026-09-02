using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

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

    public async Task<ExamDateDto> CreateAsync(ExamDateInputDto dto)
    {
        var examDate = new ExamDate
        {
            Id = Guid.NewGuid(),
            PermitType = dto.PermitType,
            Date = dto.Date,
            Location = dto.Location,
            Notes = dto.Notes,
        };

        db.ExamDates.Add(examDate);
        await db.SaveChangesAsync();

        return ToDto(examDate);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var examDate = await db.ExamDates.FindAsync(id);
        if (examDate is null)
            return false;

        db.ExamDates.Remove(examDate);
        await db.SaveChangesAsync();
        return true;
    }

    private static ExamDateDto ToDto(ExamDate e) =>
        new(e.Id, e.PermitType, e.Date, e.Location, e.Notes);
}
