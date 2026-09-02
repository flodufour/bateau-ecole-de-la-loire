using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public enum CancelBookingResult { Success, NotFound, AlreadyCancelled }
public enum ConfirmBookingResult { Success, NotFound, NotPending }

public class BookingService(AppDbContext db)
{
    public async Task<List<BookingDto>> GetForUserAsync(Guid userId)
    {
        var bookings = await QueryWithIncludes().Where(b => b.UserId == userId).ToListAsync();
        return bookings.Select(ToDto).ToList();
    }

    public async Task<List<BookingDto>> GetAllAsync()
    {
        var bookings = await QueryWithIncludes().ToListAsync();
        return bookings.Select(ToDto).ToList();
    }

    public async Task<(BookingDto? Result, string[] Errors)> CreateAsync(Guid userId, CreateBookingDto dto)
    {
        var session = await db.Sessions
            .Include(s => s.Permit)
            .Include(s => s.Instructor).ThenInclude(i => i.User)
            .FirstOrDefaultAsync(s => s.Id == dto.SessionId);

        if (session is null)
            return (null, ["Séance introuvable."]);

        if (session.StartsAt <= DateTimeOffset.UtcNow)
            return (null, ["Impossible de réserver une séance déjà passée."]);

        var alreadyBooked = await db.Bookings.AnyAsync(b =>
            b.SessionId == dto.SessionId && b.UserId == userId && b.Status != BookingStatus.Cancelled);
        if (alreadyBooked)
            return (null, ["Vous avez déjà une réservation pour cette séance."]);

        var activeBookingCount = await db.Bookings.CountAsync(b =>
            b.SessionId == dto.SessionId && b.Status != BookingStatus.Cancelled);
        if (activeBookingCount >= session.MaxCapacity)
            return (null, ["Cette séance est complète."]);

        var user = await db.Users.SingleAsync(u => u.Id == userId);
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            User = user,
            SessionId = dto.SessionId,
            Session = session,
            Status = BookingStatus.Pending,
            BookedAt = DateTimeOffset.UtcNow,
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        return (ToDto(booking), []);
    }

    public async Task<CancelBookingResult> CancelAsync(Guid userId, Guid bookingId)
    {
        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId && b.UserId == userId);
        if (booking is null)
            return CancelBookingResult.NotFound;

        if (booking.Status == BookingStatus.Cancelled)
            return CancelBookingResult.AlreadyCancelled;

        booking.Status = BookingStatus.Cancelled;
        await db.SaveChangesAsync();
        return CancelBookingResult.Success;
    }

    public async Task<ConfirmBookingResult> ConfirmAsync(Guid bookingId)
    {
        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
        if (booking is null)
            return ConfirmBookingResult.NotFound;

        if (booking.Status != BookingStatus.Pending)
            return ConfirmBookingResult.NotPending;

        booking.Status = BookingStatus.Confirmed;
        await db.SaveChangesAsync();
        return ConfirmBookingResult.Success;
    }

    private IQueryable<Booking> QueryWithIncludes() => db.Bookings
        .Include(b => b.User)
        .Include(b => b.Session).ThenInclude(s => s.Permit)
        .Include(b => b.Session).ThenInclude(s => s.Instructor).ThenInclude(i => i.User)
        .OrderByDescending(b => b.BookedAt);

    private static BookingDto ToDto(Booking b) => new(
        b.Id,
        b.SessionId,
        b.Session.Permit.Name,
        b.Session.Type,
        b.Session.StartsAt,
        $"{b.Session.Instructor.User.FirstName} {b.Session.Instructor.User.LastName}",
        $"{b.User.FirstName} {b.User.LastName}",
        b.Status,
        b.BookedAt);
}
