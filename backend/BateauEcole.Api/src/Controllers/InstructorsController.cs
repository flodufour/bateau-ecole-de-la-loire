using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var instructor = await instructorService.GetByIdAsync(id);
        return instructor is null ? NotFound() : Ok(instructor);
    }
}
