using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

public record TransferPurchaseDto([Required, EmailAddress] string Email);
