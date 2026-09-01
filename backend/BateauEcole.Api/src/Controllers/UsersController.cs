using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController(UserService userService) : ControllerBase
{
    // Soft delete: deactivates the account (is_active = false) rather than
    // removing the row, so bookings/instructor profiles keep a valid user_id.
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var found = await userService.DeactivateAsync(id);
        return found ? NoContent() : NotFound();
    }
}
