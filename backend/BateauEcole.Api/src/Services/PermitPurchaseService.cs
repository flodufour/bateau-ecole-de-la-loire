using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public record TransferPurchaseResult(PermitPurchaseDto? Purchase, bool NotFound, string[] Errors);

public class PermitPurchaseService(AppDbContext db, UserManager<User> userManager)
{
    public async Task<(PermitPurchaseDto? Result, string[] Errors)> PurchaseAsync(Guid userId, CreatePurchaseDto dto)
    {
        var permit = await db.Permits.FindAsync(dto.PermitId);
        if (permit is null)
            return (null, ["Permis introuvable."]);

        var purchase = new PermitPurchase
        {
            Id = Guid.NewGuid(),
            PermitId = dto.PermitId,
            Permit = permit,
            UserId = userId,
            PurchasedAt = DateTimeOffset.UtcNow,
        };

        db.PermitPurchases.Add(purchase);
        await db.SaveChangesAsync();

        return (ToDto(purchase), []);
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
