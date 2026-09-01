namespace BateauEcole.Api.DTOs;

public record ExamDateDto(
    Guid Id,
    string PermitType,
    DateOnly Date,
    string Location,
    string? Notes);
