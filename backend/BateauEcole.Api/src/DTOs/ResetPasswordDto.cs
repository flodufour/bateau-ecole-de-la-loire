using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record ResetPasswordDto(
    [Required, EmailAddress] string Email,
    [Required] string Token,
    [Required, MinLength(8)] string NewPassword);
