using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Tests.TestSupport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

public class AuthMeTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Me_WithValidSession_ReturnsCurrentUser()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("me");
        await client.RegisterAsync(email);

        var response = await client.GetAsync("/api/auth/me");
        var user = await response.Content.ReadFromJsonAsync<UserDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(email, user!.Email);
    }

    [Fact]
    public async Task Me_WithoutSession_ReturnsUnauthorized()
    {
        var client = fixture.CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_ForADeactivatedAccount_ReturnsUnauthorized_EvenWithAStillValidToken()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("me-deactivated");
        await client.RegisterAsync(email);

        using (var scope = fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == email);
            user.IsActive = false;
            await db.SaveChangesAsync();
        }

        // The access token cookie from registration is still validly signed and
        // unexpired — only the DB-backed IsActive re-check should catch this.
        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
