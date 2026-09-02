using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record CreateContactMessageDto(
    [Required, MaxLength(200)] string Name,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [MaxLength(30)] string? Phone,
    [Required, MaxLength(2000)] string Message);
