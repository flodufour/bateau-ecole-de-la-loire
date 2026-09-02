namespace BateauEcole.Api.Models;

// A student "buying" a permit formula. No real payment yet — created already
// paid (PurchasedAt is set at creation time) — see backend/docs/api.md.
public class PermitPurchase
{
    public Guid Id { get; set; }
    public Guid PermitId { get; set; }
    public Permit Permit { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTimeOffset PurchasedAt { get; set; }
}
