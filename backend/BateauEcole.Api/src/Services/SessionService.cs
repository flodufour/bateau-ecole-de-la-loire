using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public enum DeleteSessionResult { Success, NotFound, HasBookings }

public record UpdateSessionResult(SessionDto? Session, bool NotFound, string[] Errors);

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

    public async Task<(SessionDto? Result, string[] Errors)> CreateAsync(SessionInputDto dto)
    {
        var errors = await ValidateReferencesAsync(dto);
        if (errors.Length > 0)
            return (null, errors);

        var session = new Session
        {
            Id = Guid.NewGuid(),
            PermitId = dto.PermitId,
            InstructorId = dto.InstructorId,
            Type = dto.Type,
            StartsAt = dto.StartsAt,
            DurationMinutes = dto.DurationMinutes,
            MaxCapacity = dto.MaxCapacity,
            Location = dto.Location,
        };

        db.Sessions.Add(session);
        await db.SaveChangesAsync();

        return (await GetByIdAsync(session.Id), []);
    }

    public async Task<UpdateSessionResult> UpdateAsync(Guid id, SessionInputDto dto)
    {
        var session = await db.Sessions.FindAsync(id);
        if (session is null)
            return new UpdateSessionResult(null, NotFound: true, []);

        var errors = await ValidateReferencesAsync(dto);
        if (errors.Length > 0)
            return new UpdateSessionResult(null, NotFound: false, errors);

        session.PermitId = dto.PermitId;
        session.InstructorId = dto.InstructorId;
        session.Type = dto.Type;
        session.StartsAt = dto.StartsAt;
        session.DurationMinutes = dto.DurationMinutes;
        session.MaxCapacity = dto.MaxCapacity;
        session.Location = dto.Location;

        await db.SaveChangesAsync();
        return new UpdateSessionResult(await GetByIdAsync(id), NotFound: false, []);
    }

    public async Task<DeleteSessionResult> DeleteAsync(Guid id)
    {
        var session = await db.Sessions.FindAsync(id);
        if (session is null)
            return DeleteSessionResult.NotFound;

        if (await db.Bookings.AnyAsync(b => b.SessionId == id))
            return DeleteSessionResult.HasBookings;

        db.Sessions.Remove(session);
        await db.SaveChangesAsync();
        return DeleteSessionResult.Success;
    }

    private async Task<string[]> ValidateReferencesAsync(SessionInputDto dto)
    {
        var errors = new List<string>();

        if (!await db.Permits.AnyAsync(p => p.Id == dto.PermitId))
            errors.Add("Permis introuvable.");

        if (!await db.Instructors.AnyAsync(i => i.Id == dto.InstructorId))
            errors.Add("Moniteur introuvable.");

        return errors.ToArray();
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
