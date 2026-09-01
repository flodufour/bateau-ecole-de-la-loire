using BateauEcole.Api.Models;

namespace BateauEcole.Api.DTOs;

public record SessionDto(
    Guid Id,
    Guid PermitId,
    string PermitName,
    Guid InstructorId,
    string InstructorName,
    SessionType Type,
    DateTimeOffset StartsAt,
    int DurationMinutes,
    int MaxCapacity,
    string Location);
