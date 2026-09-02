using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record CheckoutItemDto([Required] Guid PermitId, [Range(1, 20)] int Quantity);

public record CheckoutDto([Required, MinLength(1)] List<CheckoutItemDto> Items);
