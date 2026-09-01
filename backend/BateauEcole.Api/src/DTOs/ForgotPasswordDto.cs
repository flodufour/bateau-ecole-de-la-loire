using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record ForgotPasswordDto([Required, EmailAddress] string Email);
