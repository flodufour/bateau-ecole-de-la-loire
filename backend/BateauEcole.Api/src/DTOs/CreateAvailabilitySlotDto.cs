namespace BateauEcole.Api.DTOs;

public record CreateAvailabilitySlotDto(DateTimeOffset StartsAt, DateTimeOffset EndsAt);
