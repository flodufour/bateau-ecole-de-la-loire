using System.Net;
using BateauEcole.Api.Data;
using BateauEcole.Api.Tests.TestSupport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

// Split out from AuthTests and given its own fixture: every method here calls
// /auth/login, which is rate-limited (5/min/IP) — grouping them with tests
// from another concern would risk tripping that limit for the wrong reason.
public class AuthLoginTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Login_WithCorrectCredentials_ReturnsUser()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("login-ok");
        await client.RegisterAsync(email, "Password123!");

        var (response, user) = await client.LoginAsync(email, "Password123!");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(email, user!.Email);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("login-wrong-pw");
        await client.RegisterAsync(email, "Password123!");

        var (response, _) = await client.LoginAsync(email, "NotTheRightPassword!");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithUnknownEmail_ReturnsUnauthorized()
    {
        var client = fixture.CreateAuthClient();

        var (response, _) = await client.LoginAsync(ApiTestFixtureExtensions.UniqueEmail("nobody"), "Whatever123!");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithDeactivatedAccount_ReturnsUnauthorized()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("deactivated");
        await client.RegisterAsync(email, "Password123!");

        using (var scope = fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == email);
            user.IsActive = false;
            await db.SaveChangesAsync();
        }

        var (response, _) = await client.LoginAsync(email, "Password123!");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
