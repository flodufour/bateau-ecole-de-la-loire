using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record CreatePurchaseDto([Required] Guid PermitId);
