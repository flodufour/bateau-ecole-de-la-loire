using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController(ContactService contactService) : ControllerBase
{
    // No SMTP wired up yet (see backend/docs/security.md), so a submission is
    // persisted for an admin to read in the back-office rather than emailed —
    // same "log it somewhere real can be checked later" approach as the
    // password reset token until a shared EmailService exists.
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Submit(CreateContactMessageDto dto)
    {
        return Ok(await contactService.SubmitAsync(dto));
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await contactService.GetAllAsync());
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await contactService.DeleteAsync(id) ? NoContent() : NotFound();
    }
}
