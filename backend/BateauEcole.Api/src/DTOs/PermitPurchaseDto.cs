namespace BateauEcole.Api.DTOs;

public record PermitPurchaseDto(Guid Id, Guid PermitId, string PermitName, decimal Price, DateTimeOffset PurchasedAt);
