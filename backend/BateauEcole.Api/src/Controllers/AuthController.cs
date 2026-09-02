using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Services;

namespace BateauEcole.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService, TokenService tokenService, IAntiforgery antiforgery) : ControllerBase
{
    // [AllowAnonymous] is per-action, not on the class — see PermitsController
    // for why a class-level one would be the wrong call here too.
    [HttpGet("csrf")]
    [AllowAnonymous]
    public IActionResult GetCsrfToken()
    {
        antiforgery.GetAndStoreTokens(HttpContext);
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await authService.GetProfileAsync(userId);
        return user is null ? Unauthorized() : Ok(user);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var (result, errors) = await authService.RegisterAsync(dto);
        if (result is null)
            return BadRequest(new { errors });

        SetAuthCookies(result.AccessToken, result.RefreshToken);
        return Ok(result.User);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var (result, errors) = await authService.LoginAsync(dto);
        if (result is null)
            return Unauthorized(new { errors });

        SetAuthCookies(result.AccessToken, result.RefreshToken);
        return Ok(result.User);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refresh_token"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized();

        var (result, errors) = await authService.RefreshAsync(refreshToken);
        if (result is null)
            return Unauthorized(new { errors });

        SetAuthCookies(result.AccessToken, result.RefreshToken);
        return Ok(result.User);
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        await authService.ForgotPasswordAsync(dto);
        // Always the same response, whether or not the email is registered.
        return NoContent();
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        var errors = await authService.ResetPasswordAsync(dto);
        return errors.Length == 0 ? NoContent() : BadRequest(new { errors });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refresh_token"];
        if (!string.IsNullOrEmpty(refreshToken))
            await authService.LogoutAsync(refreshToken);

        Response.Cookies.Delete("access_token");
        Response.Cookies.Delete("refresh_token");
        return NoContent();
    }

    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddMinutes(tokenService.AccessTokenMinutes),
        });

        Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            Expires = DateTimeOffset.UtcNow.AddDays(tokenService.RefreshTokenDays),
        });
    }
}
