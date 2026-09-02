using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController(SessionService sessionService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetUpcoming(
        [FromQuery] SessionType? type,
        [FromQuery] Guid? permitId,
        [FromQuery] DateOnly? date)
    {
        return Ok(await sessionService.GetUpcomingAsync(type, permitId, date));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var session = await sessionService.GetByIdAsync(id);
        return session is null ? NotFound() : Ok(session);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(SessionInputDto dto)
    {
        var (result, errors) = await sessionService.CreateAsync(dto);
        return result is null ? BadRequest(new { errors }) : Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, SessionInputDto dto)
    {
        var result = await sessionService.UpdateAsync(id, dto);
        if (result.Session is not null)
            return Ok(result.Session);

        return result.NotFound ? NotFound() : BadRequest(new { errors = result.Errors });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await sessionService.DeleteAsync(id);
        return result switch
        {
            DeleteSessionResult.Success => NoContent(),
            DeleteSessionResult.HasBookings => BadRequest(new { errors = new[] { "Cette séance a des réservations, impossible de la supprimer." } }),
            _ => NotFound(),
        };
    }
}
