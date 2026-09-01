namespace BateauEcole.Api.Models;

public class Session
{
    public Guid Id { get; set; }
    public Guid PermitId { get; set; }
    public Permit Permit { get; set; } = null!;
    public Guid InstructorId { get; set; }
    public Instructor Instructor { get; set; } = null!;
    public SessionType Type { get; set; }
    public DateTimeOffset StartsAt { get; set; }
    public int DurationMinutes { get; set; }
    public int MaxCapacity { get; set; }
    public string Location { get; set; } = string.Empty;
}
