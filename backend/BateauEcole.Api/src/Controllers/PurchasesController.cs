using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/purchases")]
public class PurchasesController(PermitPurchaseService purchaseService) : ControllerBase
{
    [HttpPost("checkout")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Checkout(CheckoutDto dto)
    {
        var (result, errors) = await purchaseService.CheckoutAsync(CurrentUserId, dto);
        return result is null ? BadRequest(new { errors }) : Ok(result);
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMine()
    {
        return Ok(await purchaseService.GetForUserAsync(CurrentUserId));
    }

    [HttpPost("{id:guid}/transfer")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Transfer(Guid id, TransferPurchaseDto dto)
    {
        var result = await purchaseService.TransferAsync(CurrentUserId, id, dto);
        if (result.Purchase is not null)
            return Ok(result.Purchase);

        return result.NotFound ? NotFound() : BadRequest(new { errors = result.Errors });
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
