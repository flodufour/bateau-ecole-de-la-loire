namespace BateauEcole.Api.Models;

public class Booking
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid SessionId { get; set; }
    public Session Session { get; set; } = null!;
    public BookingStatus Status { get; set; }
    public DateTimeOffset BookedAt { get; set; }
}
