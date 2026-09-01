using BateauEcole.Api.Models;

namespace BateauEcole.Api.DTOs;

public record UserDto(Guid Id, string Email, string FirstName, string LastName, UserRole Role);
