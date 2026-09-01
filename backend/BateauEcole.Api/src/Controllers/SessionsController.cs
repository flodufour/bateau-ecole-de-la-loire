using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.Models;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController(SessionService sessionService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUpcoming(
        [FromQuery] SessionType? type,
        [FromQuery] Guid? permitId,
        [FromQuery] DateOnly? date)
    {
        return Ok(await sessionService.GetUpcomingAsync(type, permitId, date));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var session = await sessionService.GetByIdAsync(id);
        return session is null ? NotFound() : Ok(session);
    }
}
