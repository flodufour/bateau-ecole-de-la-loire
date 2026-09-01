using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
}
