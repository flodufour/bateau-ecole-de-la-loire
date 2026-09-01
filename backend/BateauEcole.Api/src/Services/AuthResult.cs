using BateauEcole.Api.DTOs;

namespace BateauEcole.Api.Services;

public record AuthResult(UserDto User, string AccessToken, string RefreshToken);
