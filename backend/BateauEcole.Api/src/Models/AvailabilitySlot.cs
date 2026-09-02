namespace BateauEcole.Api.Models;

// An instructor-declared window of time they can be assigned a session in.
// Explicit dated slots (not a recurring weekly pattern), so an instructor can
// open exactly the hours they're actually free that week.
public class AvailabilitySlot
{
    public Guid Id { get; set; }
    public Guid InstructorId { get; set; }
    public Instructor Instructor { get; set; } = null!;
    public DateTimeOffset StartsAt { get; set; }
    public DateTimeOffset EndsAt { get; set; }
}
