namespace BateauEcole.Api.Models;

public class Instructor
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Bio { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string[] Specialties { get; set; } = [];
}
