using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string FirstName,
    [Required] string LastName);
