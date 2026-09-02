using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstructorsController(InstructorService instructorService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await instructorService.GetAllAsync());
    }

    // Instructor,Admin (not just Instructor): an Admin who also teaches has
    // no other role to hold — see backend/docs/api.md for why this project
    // doesn't do full multi-role support for what is, today, a single case.
    [HttpGet("me")]
    [Authorize(Roles = "Instructor,Admin")]
    public async Task<IActionResult> GetMe()
    {
        var instructor = await instructorService.GetByUserIdAsync(CurrentUserId);
        return instructor is null ? NotFound() : Ok(instructor);
    }

    // Admin-only: an existing Instructor account already gets its profile
    // created atomically by POST /instructors (see CreateAsync) — this is
    // only for an Admin linking a profile to their own account.
    [HttpPost("me")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateMyProfile(CreateOwnInstructorProfileDto dto)
    {
        var (result, errors) = await instructorService.CreateForOwnAccountAsync(CurrentUserId, dto);
        return result is null ? BadRequest(new { errors }) : Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var instructor = await instructorService.GetByIdAsync(id);
        return instructor is null ? NotFound() : Ok(instructor);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateInstructorDto dto)
    {
        var (result, errors) = await instructorService.CreateAsync(dto);
        return result is null ? BadRequest(new { errors }) : Ok(result);
    }

    [HttpGet("{id:guid}/availability")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailability(Guid id)
    {
        return Ok(await instructorService.GetAvailabilityAsync(id));
    }

    [HttpPost("{id:guid}/availability")]
    [Authorize(Roles = "Instructor,Admin")]
    public async Task<IActionResult> AddAvailability(Guid id, CreateAvailabilitySlotDto dto)
    {
        if (!await instructorService.IsOwnedByUserAsync(id, CurrentUserId))
            return Forbid();

        var (result, errors) = await instructorService.AddAvailabilityAsync(id, dto);
        return result is null ? BadRequest(new { errors }) : Ok(result);
    }

    [HttpDelete("{id:guid}/availability/{slotId:guid}")]
    [Authorize(Roles = "Instructor,Admin")]
    public async Task<IActionResult> DeleteAvailability(Guid id, Guid slotId)
    {
        if (!await instructorService.IsOwnedByUserAsync(id, CurrentUserId))
            return Forbid();

        var deleted = await instructorService.DeleteAvailabilityAsync(id, slotId);
        return deleted ? NoContent() : NotFound();
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
