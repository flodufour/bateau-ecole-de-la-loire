using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record ExamDateInputDto(
    [Required, MaxLength(50)] string PermitType,
    DateOnly Date,
    [Required, MaxLength(200)] string Location,
    string? Notes);
