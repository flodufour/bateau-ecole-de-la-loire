using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermitsController(PermitService permitService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await permitService.GetAllAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var permit = await permitService.GetByIdAsync(id);
        return permit is null ? NotFound() : Ok(permit);
    }
}
