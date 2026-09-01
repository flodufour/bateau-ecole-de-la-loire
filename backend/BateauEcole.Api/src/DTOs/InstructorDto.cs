namespace BateauEcole.Api.DTOs;

public record InstructorDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Bio,
    string? PhotoUrl,
    string[] Specialties);
