using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController(BookingService bookingService) : ControllerBase
{
    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMine()
    {
        return Ok(await bookingService.GetForUserAsync(CurrentUserId));
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Create(CreateBookingDto dto)
    {
        var (result, errors) = await bookingService.CreateAsync(CurrentUserId, dto);
        return result is null ? BadRequest(new { errors }) : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var result = await bookingService.CancelAsync(CurrentUserId, id);
        return result switch
        {
            CancelBookingResult.Success => NoContent(),
            CancelBookingResult.AlreadyCancelled => BadRequest(new { errors = new[] { "Cette réservation est déjà annulée." } }),
            _ => NotFound(),
        };
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await bookingService.GetAllAsync());
    }

    [HttpPatch("{id:guid}/confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Confirm(Guid id)
    {
        var result = await bookingService.ConfirmAsync(id);
        return result switch
        {
            ConfirmBookingResult.Success => NoContent(),
            ConfirmBookingResult.NotPending => BadRequest(new { errors = new[] { "Cette réservation n'est pas en attente." } }),
            _ => NotFound(),
        };
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
