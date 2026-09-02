using System.ComponentModel.DataAnnotations;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.DTOs;

public record SessionInputDto(
    [Required] Guid PermitId,
    [Required] Guid InstructorId,
    SessionType Type,
    DateTimeOffset StartsAt,
    [Range(1, 480)] int DurationMinutes,
    [Range(1, 100)] int MaxCapacity,
    [Required, MaxLength(200)] string Location);
