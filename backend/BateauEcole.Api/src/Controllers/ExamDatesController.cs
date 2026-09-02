using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/exam-dates")]
public class ExamDatesController(ExamDateService examDateService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetUpcoming()
    {
        return Ok(await examDateService.GetUpcomingAsync());
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(ExamDateInputDto dto)
    {
        return Ok(await examDateService.CreateAsync(dto));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await examDateService.DeleteAsync(id) ? NoContent() : NotFound();
    }
}
