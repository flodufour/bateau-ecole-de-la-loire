using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermitsController(PermitService permitService) : ControllerBase
{
    // [AllowAnonymous] is per-action, not on the class: a class-level
    // [AllowAnonymous] would also open up future Admin-only write actions
    // added to this controller, since it short-circuits [Authorize] entirely.
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await permitService.GetAllAsync());
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var permit = await permitService.GetByIdAsync(id);
        return permit is null ? NotFound() : Ok(permit);
    }
}
