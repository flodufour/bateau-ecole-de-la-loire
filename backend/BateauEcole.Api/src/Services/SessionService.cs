using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public class SessionService(AppDbContext db)
{
    public async Task<List<SessionDto>> GetUpcomingAsync(SessionType? type, Guid? permitId, DateOnly? date)
    {
        var query = db.Sessions
            .Include(s => s.Permit)
            .Include(s => s.Instructor).ThenInclude(i => i.User)
            .Where(s => s.StartsAt >= DateTimeOffset.UtcNow)
            .AsQueryable();

        if (type is not null)
            query = query.Where(s => s.Type == type);

        if (permitId is not null)
            query = query.Where(s => s.PermitId == permitId);

        if (date is not null)
        {
            var startOfDay = new DateTimeOffset(date.Value.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
            var startOfNextDay = startOfDay.AddDays(1);
            query = query.Where(s => s.StartsAt >= startOfDay && s.StartsAt < startOfNextDay);
        }

        var sessions = await query.OrderBy(s => s.StartsAt).ToListAsync();
        return sessions.Select(ToDto).ToList();
    }

    public async Task<SessionDto?> GetByIdAsync(Guid id)
    {
        var session = await db.Sessions
            .Include(s => s.Permit)
            .Include(s => s.Instructor).ThenInclude(i => i.User)
            .FirstOrDefaultAsync(s => s.Id == id);

        return session is null ? null : ToDto(session);
    }

    private static SessionDto ToDto(Session s) => new(
        s.Id,
        s.PermitId,
        s.Permit.Name,
        s.InstructorId,
        $"{s.Instructor.User.FirstName} {s.Instructor.User.LastName}",
        s.Type,
        s.StartsAt,
        s.DurationMinutes,
        s.MaxCapacity,
        s.Location);
}
