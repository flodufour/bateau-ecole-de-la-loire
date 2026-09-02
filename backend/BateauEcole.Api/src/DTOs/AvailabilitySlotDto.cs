namespace BateauEcole.Api.DTOs;

public record AvailabilitySlotDto(Guid Id, Guid InstructorId, DateTimeOffset StartsAt, DateTimeOffset EndsAt);
