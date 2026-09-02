using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public record TransferPurchaseResult(PermitPurchaseDto? Purchase, bool NotFound, string[] Errors);

public class PermitPurchaseService(AppDbContext db, UserManager<User> userManager)
{
    // One row per unit (a quantity of 3 for the same permit creates 3 separate
    // PermitPurchase rows) — each unit needs to be individually transferable
    // to a different account afterward, so a single row with a Quantity
    // column wouldn't work.
    public async Task<(List<PermitPurchaseDto>? Result, string[] Errors)> CheckoutAsync(Guid userId, CheckoutDto dto)
    {
        var permitIds = dto.Items.Select(i => i.PermitId).Distinct().ToList();
        var permits = await db.Permits.Where(p => permitIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        if (permitIds.Any(id => !permits.ContainsKey(id)))
            return (null, ["Un ou plusieurs permis du panier sont introuvables."]);

        var purchases = new List<PermitPurchase>();
        foreach (var item in dto.Items)
        {
            var permit = permits[item.PermitId];
            for (var i = 0; i < item.Quantity; i++)
            {
                purchases.Add(new PermitPurchase
                {
                    Id = Guid.NewGuid(),
                    PermitId = permit.Id,
                    Permit = permit,
                    UserId = userId,
                    PurchasedAt = DateTimeOffset.UtcNow,
                });
            }
        }

        db.PermitPurchases.AddRange(purchases);
        await db.SaveChangesAsync();

        return (purchases.Select(ToDto).ToList(), []);
    }

    public async Task<List<PermitPurchaseDto>> GetForUserAsync(Guid userId)
    {
        var purchases = await db.PermitPurchases
            .Include(p => p.Permit)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.PurchasedAt)
            .ToListAsync();

        return purchases.Select(ToDto).ToList();
    }

    public async Task<TransferPurchaseResult> TransferAsync(Guid userId, Guid purchaseId, TransferPurchaseDto dto)
    {
        var purchase = await db.PermitPurchases
            .Include(p => p.Permit)
            .FirstOrDefaultAsync(p => p.Id == purchaseId && p.UserId == userId);
        if (purchase is null)
            return new TransferPurchaseResult(null, NotFound: true, []);

        var targetUser = await userManager.FindByEmailAsync(dto.Email);
        if (targetUser is null)
            return new TransferPurchaseResult(null, NotFound: false, ["Aucun compte n'existe avec cette adresse email."]);

        if (targetUser.Id == userId)
            return new TransferPurchaseResult(null, NotFound: false, ["Vous possédez déjà ce permis."]);

        purchase.UserId = targetUser.Id;
        await db.SaveChangesAsync();

        return new TransferPurchaseResult(ToDto(purchase), NotFound: false, []);
    }

    private static PermitPurchaseDto ToDto(PermitPurchase p) =>
        new(p.Id, p.PermitId, p.Permit.Name, p.Permit.Price, p.PurchasedAt);
}
