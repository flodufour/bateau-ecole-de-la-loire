using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record PermitInputDto(
    [Required, MaxLength(200)] string Name,
    [Required, MaxLength(200)] string Slug,
    [Required] string Description,
    [Range(0, 100_000)] decimal Price,
    bool IncludesTheory,
    bool IncludesPractical,
    bool IsBundle);
