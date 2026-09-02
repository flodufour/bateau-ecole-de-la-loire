using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.DTOs;
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

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(PermitInputDto dto)
    {
        var (result, errors) = await permitService.CreateAsync(dto);
        return result is null ? BadRequest(new { errors }) : Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, PermitInputDto dto)
    {
        var result = await permitService.UpdateAsync(id, dto);
        if (result.Permit is not null)
            return Ok(result.Permit);

        return result.NotFound ? NotFound() : BadRequest(new { errors = result.Errors });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await permitService.DeleteAsync(id);
        return result switch
        {
            DeletePermitResult.Success => NoContent(),
            DeletePermitResult.HasSessions => BadRequest(new { errors = new[] { "Ce permis a des séances associées, impossible de le supprimer." } }),
            _ => NotFound(),
        };
    }
}
