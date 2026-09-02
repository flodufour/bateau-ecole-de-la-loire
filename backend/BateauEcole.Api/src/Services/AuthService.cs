using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public class AuthService(
    UserManager<User> userManager,
    AppDbContext db,
    TokenService tokenService,
    ILogger<AuthService> logger)
{
    public async Task<(AuthResult? Result, string[] Errors)> RegisterAsync(RegisterDto dto)
    {
        var user = new User
        {
            UserName = dto.Email,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = UserRole.Student,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var createResult = await userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
            return (null, createResult.Errors.Select(e => e.Description).ToArray());

        var result = await IssueTokensAsync(user);
        return (result, []);
    }

    public async Task<(AuthResult? Result, string[] Errors)> LoginAsync(LoginDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, dto.Password))
            return (null, ["Email ou mot de passe incorrect."]);

        if (!user.IsActive)
            return (null, ["Ce compte a été désactivé."]);

        var result = await IssueTokensAsync(user);
        return (result, []);
    }

    public async Task<(AuthResult? Result, string[] Errors)> RefreshAsync(string refreshToken)
    {
        var tokenHash = tokenService.HashRefreshToken(refreshToken);
        var stored = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == tokenHash);

        if (stored is null || stored.RevokedAt is not null || stored.ExpiresAt < DateTimeOffset.UtcNow)
            return (null, ["Session expirée, merci de vous reconnecter."]);

        if (!stored.User.IsActive)
            return (null, ["Ce compte a été désactivé."]);

        stored.RevokedAt = DateTimeOffset.UtcNow;
        var result = await IssueTokensAsync(stored.User);
        return (result, []);
    }

    // Re-checks IsActive against the DB rather than trusting the JWT's claims —
    // an access token issued before a deactivation stays validly signed until
    // it expires, so this is what actually locks a deactivated user out sooner.
    public async Task<UserDto?> GetProfileAsync(Guid userId)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        return user is null || !user.IsActive
            ? null
            : new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.Role);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var tokenHash = tokenService.HashRefreshToken(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash);
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
    }

    public async Task ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null || !user.IsActive)
            return; // Same response either way — don't reveal whether the email is registered.

        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        // No SMTP service wired up yet (see .env.example SMTP_* vars) — log the
        // reset token instead of emailing it, until the EmailService exists.
        logger.LogInformation(
            "Password reset requested for {Email}. Reset token: {Token}",
            user.Email, token);
    }

    public async Task<string[]> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null)
            return ["Lien de réinitialisation invalide ou expiré."];

        var result = await userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        return result.Succeeded ? [] : result.Errors.Select(e => e.Description).ToArray();
    }

    private async Task<AuthResult> IssueTokensAsync(User user)
    {
        var accessToken = tokenService.CreateAccessToken(user);
        var refreshToken = tokenService.CreateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenService.HashRefreshToken(refreshToken),
            CreatedAt = DateTimeOffset.UtcNow,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(tokenService.RefreshTokenDays),
        });
        await db.SaveChangesAsync();

        var userDto = new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.Role);
        return new AuthResult(userDto, accessToken, refreshToken);
    }
}
