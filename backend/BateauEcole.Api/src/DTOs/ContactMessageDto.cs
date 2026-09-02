namespace BateauEcole.Api.DTOs;

public record ContactMessageDto(Guid Id, string Name, string Email, string? Phone, string Message, DateTimeOffset CreatedAt);
