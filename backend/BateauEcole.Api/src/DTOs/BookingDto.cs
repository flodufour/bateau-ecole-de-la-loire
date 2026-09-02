using BateauEcole.Api.Models;

namespace BateauEcole.Api.DTOs;

public record BookingDto(
    Guid Id,
    Guid SessionId,
    string PermitName,
    SessionType SessionType,
    DateTimeOffset SessionStartsAt,
    string InstructorName,
    string StudentName,
    BookingStatus Status,
    DateTimeOffset BookedAt);
