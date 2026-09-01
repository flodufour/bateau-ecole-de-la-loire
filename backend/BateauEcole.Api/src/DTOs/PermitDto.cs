namespace BateauEcole.Api.DTOs;

public record PermitDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    decimal Price,
    bool IncludesTheory,
    bool IncludesPractical,
    bool IsBundle);
